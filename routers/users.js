'use strict';
// endpoint is /api/users/
// core imports
const express         = require('express');
const router          = express.Router();
const bodyParser      = require('body-parser');
const jsonParser      = bodyParser.json();
// auth import
const { jwtStrategy,
  hashPassword }= require('./auth');
// project-specific imports
const { respondToError }= require('../comm/responses');
const { userFile }    = require('../config');
const knex            = require('../db-sql');
const logger          = require('../comm/logger').createLogger(userFile); // logs to a file
// helper function imports
const { keys }        = require('../helpers/keys');
const {
  getKeyArray,
  isObjectLiteral
} = require('../helpers/lib');
const { 
  formatReqBodyForKnex, 
} = require('../helpers/db');
// use
router.use(jsonParser);
router.use((req, res, next)=>jwtStrategy(req, res, next));
// @@@@@@@@@@@@@@ END IMPORTS  @@@@@@@@@@@@

const userScAsCcExtract = getKeyArray(keys, 'users', 0, 1);

const validateUserFieldsPresent = (user, keys, type) => {
  if(!isObjectLiteral(user)) return { message: 'invalid user' };
  if(!Array.isArray(keys)) return { message: 'invalid user keys'};
  if(type !== 'new') return 'ok';
  const missingField = keys.find(field => (!(field in user)));
  if (missingField) {
    const response = {
      message: 'Missing field',
      location: missingField,
    };
    return response;
  }
  return 'ok';
};

const validateUserFieldsString = (user, keys) => {
  if(!isObjectLiteral(user)) return { message: 'invalid user' };
  if(!Array.isArray(keys)) return { message: 'invalid user keys'};
  const nonStringField = keys.find(
    field => field in user && typeof user[field] !== 'string'
  );
  if (nonStringField) {
    return {
      message: 'Incorrect field type: expected string',
      location: nonStringField,
    };
  }
  return 'ok';
};  

const validateUserFieldsTrimmed = (user, keys) => {
  if(!isObjectLiteral(user)) return { message: 'invalid user' };
  if(!Array.isArray(keys)) return { message: 'invalid user keys'};
  const nonTrimmedField = keys.find(
    field => user[field] && user[field].trim() !== user[field]
  );
  if (nonTrimmedField) {
    return {
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField,
    };
  }
  return 'ok' ;
};  

const validateUserFieldsArray = (user, keys) => {
  if(!isObjectLiteral(user)) return { message: 'invalid user' };
  if(!Array.isArray(keys)) return { message: 'invalid user keys'};
  const nonArrayField = keys.find(
    field => !Array.isArray(user[field])
  );
  if (nonArrayField) {
    return {
      message: 'Incorrect field type: expected array',
      location: nonArrayField,
    };
  }
  let nonStringIndex = -1;
  let nonStringMessage = '';
  keys.forEach(field=>{
    user[field].forEach((item, i)=>{
      nonStringIndex = typeof item !== 'string' ? i : nonStringIndex ;
      nonStringMessage = `Incorrect data type at ${field} index #${nonStringIndex}: expected string`;
    });
  });
  if(nonStringIndex > -1) {
    return {
      message: nonStringMessage,
      location: nonStringIndex,
    };
  }
  return 'ok' ;
}; 

const validateUserFieldsSize = (user, keys) => {  
  if(!isObjectLiteral(user)) return { message: 'invalid user' };
  if(!isObjectLiteral(keys)) return { message: 'invalid user keys'};

  const tooSmallField = Object.keys(keys).find(field =>
    'min' in keys[field] &&
    user[field] && 
    user[field].trim().length < keys[field].min
  );
  const tooLargeField = Object.keys(keys).find(field =>
    'max' in keys[field] &&
    user[field] &&
    user[field].trim().length > keys[field].max
  );

  if (tooSmallField || tooLargeField) {
    return {
      message: tooSmallField
        ? `Must be at least ${keys[tooSmallField].min} characters long`
        : `Must be at most ${keys[tooLargeField].max} characters long`,
      location: tooSmallField || tooLargeField
    };
  }
  return 'ok' ;
};  

const validateUser = (user, type = 'new', keys) => { // type = new or existing
  if(!isObjectLiteral(user))     return { message: 'invalid user' };
  if(typeof type !== 'string')   return { message: 'invalid user type' };
  if(!isObjectLiteral(keys))     return { message: 'invalid keys'};
  if(!Array.isArray(keys.users)) return { message: 'invalid user keys'};

  const userRequiredCreate    = getKeyArray(keys, 'users', 1, 3);
  const userExplicitlyTrimmed = getKeyArray(keys, 'users', 1, 6);
  const userString            = getKeyArray(keys, 'users', 1, 5);
  const userSizes             = getKeyArray(keys, 'users', 1, 7);
  const arrayFields           = ['permissions'];

  const isPresentt = validateUserFieldsPresent(user, userRequiredCreate, type);
  const isStringg  = validateUserFieldsString(user, userString);
  const isTrimmedd = validateUserFieldsTrimmed(user, userExplicitlyTrimmed);
  const isSize     = validateUserFieldsSize(user, userSizes);
  const isArray    = validateUserFieldsArray(user, arrayFields);
  
  if (isPresentt !== 'ok' && type === 'new') {
    return isPresentt; 

  } else if (isStringg !== 'ok') {
    return isStringg;
  } else if (isTrimmedd !== 'ok' ) {
    return isTrimmedd;
  } else if (isSize !== 'ok' ) {
    return isSize;
  } else if (isArray !== 'ok' ) {
    return isArray;
  } else {
    return 'ok';
  }
};

const confirmUniqueKey = (key, value, id, type='new') => {
  // input: key and value
  // key is required. Undefined value = ok/no check/just return (we check for completeness elsewhere; here we only check for duplicates)
  if(typeof key !== 'string') throw { code: 500, message: `invalid request to check for unique key with value ${value}`};
  if(value === undefined) return;
  if(type !== 'new' && !id) throw { code: 500, message: 'invalid id in confirmUniqueKey' };
  if(type === 'new'){
    return knex('users')
      .where(key, '=', value)
      .then(users=>{
        if (users.length > 0) throw { code: 400, message: `${key} already in use` };
        return;
      });
  } else {
    return knex('users')
      .where(key, '=', value)
      .returning([key, 'id'])
      .then(users=>{
        const sameUser = users.find(u=> u.id === id);
        if (sameUser) {
          if( users.length > 1) throw { code: 400, message: `${key} already taken` } ;
          return;
        }
        else if(users.length > 0) throw { code: 400, message: `${key} is not available` };
      });
  }
};

// @@@@@@@@@@@@@@ END HELPERS, START ENDPOINTS @@@@@@@@@@@@

router.post('/', (req, res) => {
  const user = validateUser(req.body, 'new', keys);
  let userPosted;
  if (user !== 'ok') {
    const err = {code: 422, message: 'invalid user'};
    respondToError(err, res);
    return;
  } else {
    userPosted = req.body;
  }

  let { username, password, lastName, firstName, permissions, email } = userPosted;

  return confirmUniqueKey('username', username)
    .then(() => {
      return confirmUniqueKey('email', email);
    })
    .then(() => {
      return hashPassword(password);
    })
    .then(hash => {
      const userObject = { 
        username, 
        password: hash, 
        last_name: lastName, 
        first_name: firstName, 
        permissions,
        email,
      };
      return knex('users')
        .insert(userObject)
        .returning(userScAsCcExtract)
        .then( userInserted => {
          const user = Object.assign({}, userInserted[0]);
          delete user.password;
          res.status(201).json(user);
        });
    })
    .catch(err => {
      respondToError(err, res);
    });
});

router.put('/:id',  (req, res) => {
  const idUser = parseInt(req.params.id, 10);
  const user = validateUser(req.body, 'existingUser', keys);
  let userPut;
  if (user !== 'ok') {
    return res.status(422).json({message: 'invalid user'});
  } else {
    userPut = req.body;
  } 
  return confirmUniqueKey('username', userPut.username, idUser, 'existingUser')
    .then(()=>{
      return confirmUniqueKey('email', userPut.email, idUser, 'existingUser');
    })
    .then(() => {
      if (userPut.password) {   
        return hashPassword(userPut.password);
      } else {        
        return false;
      }
    })
    .then(hash => {      
      if(hash) {
        userPut.password = hash;
        userPut.pwReset = false;
      } 
      const userToInsert = formatReqBodyForKnex(userPut, keys, 'users', 'PUT');
      return knex('users')
        .where('id', '=', idUser)
        .update(userToInsert)
        .returning(userScAsCcExtract)
        .then(users=>{
          const userToReturn = 
            users.length === 0 ? { message: 'user not found' } :
              Object.assign({}, users[0]);
          delete userToReturn.password;
          res.status(201).json(userToReturn);
        });
    })
    .catch(err => {
      respondToError(err, res);
    });
});

router.put('/:id/pw',  (req, res) => {
  const idUser = parseInt(req.params.id, 10);
  const user   = req.body;
  if (user.password) {   
    return hashPassword(user.password)
      .then(hash=>{
        return knex('users')
          .where('id', '=', idUser)
          .update({
            password: hash,
            pw_reset: false,
          })
          .returning(userScAsCcExtract)
          .then(usersFound=>{
            const userFound = usersFound[0];
            const userForResponse = {
              id:        userFound.id,
              pwReset:   false,
            };
            res.status(201).json(userForResponse);
          });
      })
      .catch(err => {
        respondToError(err, res);
      });
  } else {
    respondToError({message: 'no password'}, res);
  }
});

router.get('/:id',  (req, res) => {
  const idUser = req.params.id;
  return knex('users')
    .select(userScAsCcExtract)
    .where('id', '=', idUser)
    .then( users => {
      const user = Object.assign({}, users[0]);
      delete user.password;
      return res.status(200).json(user);
    })
    .catch(err => {
      respondToError(err, res);
    });
});

module.exports = { 
  router,
  validateUserFieldsPresent,
  validateUserFieldsString,
  validateUserFieldsTrimmed,
  validateUserFieldsArray,
  validateUserFieldsSize,
  validateUser,
  confirmUniqueKey,
};