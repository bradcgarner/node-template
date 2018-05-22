'use strict';
// endpoint is /api/users/
// index: helpers, post, put, get, delete

const express = require('express');
const router = express.Router();

const { User, } = require('./models');

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
router.use(jsonParser);
const passport = require('passport');
const jwt = require('jsonwebtoken');
const jwtAuth = passport.authenticate('jwt', { session: false });

const validateUserFieldsPresent = user => {
  const requiredFields = ['username', 'password', 'firstName', 'lastName'];
  const missingField = requiredFields.find(field => (!(field in user)));
  if (missingField) {
    const response = {
      message: 'Missing field',
      location: missingField
    };
    return response;
  }
  return 'ok';

};

const validateUserFieldsString = user => {
  const stringFields = ['username', 'password', 'firstName', 'lastName'];
  const nonStringField = stringFields.find(
    field => field in user && typeof user[field] !== 'string'
  );
  if (nonStringField) {
    return {
      message: 'Incorrect field type: expected string',
      location: nonStringField
    };
  }
  return 'ok';
};  

const validateUserFieldsTrimmed = user => {
  const explicityTrimmedFields = ['username', 'password'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => user[field].trim() !== user[field]
  );
  if (nonTrimmedField) {
    return {
      message: 'Cannot start or end with whitespace',
      location: nonTrimmedField
    };
  }
  return 'ok' ;
};  

const validateUserFieldsSize = user => {  
  const sizedFields = {
    username: { min: 1 },
    password: { min: 10, max: 72 }
  };
  const tooSmallField = Object.keys(sizedFields).find(field =>
    'min' in sizedFields[field] &&
    user[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(field =>
    'max' in sizedFields[field] &&
    user[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField) {
    return {
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
        : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
      location: tooSmallField || tooLargeField
    };
  }
  return 'ok' ;
};  

const validateUserFields = (user, type) => { // type = new or existing
  const isPresentt = type === 'new' ? validateUserFieldsPresent(user): 'ok';
  const isStringg = validateUserFieldsString(user);
  const isTrimmedd = validateUserFieldsTrimmed(user);
  const isSize = validateUserFieldsSize(user);
  
  if (isPresentt !== 'ok' && type === 'new') {
    return isPresentt; 

  } else if (isStringg !== 'ok') {
    return isStringg;

  } else if (isTrimmedd !== 'ok' ) {
    return isTrimmedd;

  } else if (isSize !== 'ok' ) {
    return isSize;

  } else {
    return 'ok';
  }
};

function confirmUniqueUsername(username, type='new') {
  return User.find({ username })
    .count()
    .then(count => {
      const maxMatch = type === 'existingUser' ? 1 : 0 ;
      if (count > maxMatch) {
        return Promise.reject({
          reason: 'ValidationError',
          message: 'Username already taken',
          location: 'username'
        });
      } else {
        return Promise.resolve();
      }
    });
}

// @@@@@@@@@@@@@@ END HELPERS, START ENDPOINTS @@@@@@@@@@@@

// create a new user
router.post('/', jsonParser, (req, res) => {
  const user = validateUserFields(req.body, 'new');
  let userValid;
  if (user !== 'ok') {
    user.reason = 'ValidationError';
    return res.status(422).json(user);
  } else {
    userValid = req.body;
  }

  let { username, password, lastName, firstName } = userValid;

  return confirmUniqueUsername(username)
    .then(() => {
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({ username, password: hash, lastName, firstName });
    })
    .then(user => {
      return res.status(201).json(user.apiRepr());
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(422).json(err);
      }
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// update a user profile
router.put('/:id', jsonParser, jwtAuth, (req, res) => {
  const user = validateUserFields(req.body, 'existingUser');
  let userValid;
  if (user !== 'ok') {
    user.reason = 'ValidationError';
    return res.status(422).json(user);
  } else {
    userValid = req.body;
  }
  return confirmUniqueUsername(userValid.username, 'existingUser') // returns Promise.resolve or .reject
    .then(() => {
      if (userValid.password) {        
        return User.hashPassword(userValid.password);
      } else {        
        return false;
      }
    })
    .then(hash => {      
      if (hash) {
        userValid.password = hash;
      }
    })
    .then(() => {      
      return User.findByIdAndUpdate(req.params.id,
        { $set: userValid },
        { new: true },
        function (err, user) {
          if (err) return res.send(err);
          const filteredUser = user.apiRepr();
          res.status(201).json(filteredUser);
        }
      );
    })
    .catch(err => {
      if (err.reason === 'ValidationError') {
        return res.status(err.code).json(err);
      }
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// update a user data (any data other than credentials)
router.put('/:id/data', jwtAuth, jsonParser, (req, res) => {  
  const updateUser = req.body;
  User.findByIdAndUpdate(req.params.id,
    { $set: {quizzes: updateUser.quizzes, recent: updateUser.recent } }, // recent: updateUser.recent
    { new: true },
    function (err, user) {
      if (err) return res.status(500).json({message: 'user not found', error: err});
      const filteredUser = user.apiRepr();    
      res.status(201).json(filteredUser);
    });
});

// get user by id
router.get('/user/:userId', jwtAuth, (req, res) => {
  return User.findById(req.params.userId)
    .then(user => {
      const filteredUser = user.apiRepr();
      return res.status(200).json(filteredUser);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});

// get all users DANGER ZONE!!!! but good for initial testing
router.get('/', (req, res) => {
  return User.find()
    .then(users => {
      let usersJSON = users.map(user=>user.apiRepr());
      return res.status(200).json(usersJSON);
    })
    .catch(err => {
      res.status(500).json({ code: 500, message: 'Internal server error' });
    });
});


// delete user DANGER ZONE!!!! but good for initial testing
router.delete('/:id', jwtAuth, (req, res) => {
  User
    .findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).end();
    })
    .catch(err => {
      return res.status(500).json({ message: 'something went wrong' });
    });
});

module.exports = { router };