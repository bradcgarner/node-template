'use strict';

const { JWT_SECRET, JWT_EXPIRY, authFile } = require('../config');
const logger = require('../comm/logger').createLogger(authFile); // logs to a file
const express           = require('express');
const router            = express.Router();
const bcrypt            = require('bcryptjs');const { sendPwReset }   = require('../comm/notifications');
const jwt               = require('jsonwebtoken');
const generator         = require('generate-password');
const { respondToError }= require('../comm/responses');
const { getKeyArray,
  isPrimitiveNumber }   = require('../helpers/lib');
const { keys }          = require('../helpers/keys');
const bodyParser        = require('body-parser');
const knex              = require('../db-sql');
router.use(bodyParser.json());

const hashPassword = password => {
  return bcrypt.hash(password, 12);
};

const validatePassword = (suppliedPW, userPW) => {
  return bcrypt.compare(suppliedPW, userPW);
};

const createAuthToken = user => {
  return jwt.sign(
    {user},      // object to encrypt
    JWT_SECRET,
    {            // object has a fixed format; do not edit (subject can be another string)
      subject: user.username,
      expiresIn: JWT_EXPIRY,
      algorithm: 'HS256'
    }
  );
};

const userScAsCcExtract = getKeyArray(keys, 'users', 0, 1);

const routesAllowed = {
  GET: {
    user: [
      '//api/sample',
      '//api/sample/*',
    ],
    admin: [
      '//api/users/*',
    ]
  },
  POST: {
    admin: [
      '//api/users',
      '//api/sample',
    ],
    user: [
      '//api/sample',
    ],
  },
  PUT: {
    user: [
      '//api/sample/*',
      '//api/users/*/pw',
      '//api/users/*',
    ],
    admin: [
      '//api/users/*',
    ]
  },
  DELETE: {
    admin: [

    ],
  },
};

const jwtStrategy = (req, res, next)=>{
  // this is middleware, so don't throw (it won't make it back to the calling function)
  // instead respond on error, and the calling function is never called
  // see next() at the end, which calls the calling function if this passes
  // step 1: check header or url parameters or post parameters for token
  var tokenWithBearer = req.headers['authorization'];
  logger.info('tokenWithBearer',tokenWithBearer);
  if(!tokenWithBearer){
    res.status(403).json({
      message:'No Token'
    });
  } else {
    const token = tokenWithBearer.slice(7,tokenWithBearer.length);
    //Decode the token
    jwt.verify(token,JWT_SECRET,(err,decod)=>{
      if(err){
        res.status(403).json({
          message:'Wrong Token'
        });
      } else {
        //If decoded then call next() so that respective route is called.
        req.decoded = decod;
        logger.info('req.decoded',req.decoded);
        if(!Array.isArray(req.decoded.user.permissions)){
          res.status(403).json({
            message:'Cannot read user permissions'
          });
        } else {
          if(req.decoded.exp < req.decoded.iat) {
            res.status(403).json({
              message:'Expired Token'
            });
          } else if(!routesAllowed[req.method]) {
            res.status(403).json({
              message:'Access not granted (method)'
            });
          } else {
            const urlArray = req.originalUrl.split('/');
            const urlArrayAdjusted = urlArray.map(u=>{
              const segment =
                u === '' ? '/' :
                  isNaN(parseInt(u)) ? u :
                    '*';
              return segment;
            });
            const url = urlArrayAdjusted.join('/');
            const allowedPermission = req.decoded.user.permissions.find(p=>{
              if(routesAllowed[req.method][p]) {
                return routesAllowed[req.method][p].find(x=>x === url);
              }
            });
            logger.info('endpoint sought', req.originalUrl, '(',url,')','permission', allowedPermission);
            if(!allowedPermission) {
              res.status(403).json({
                message:'Access not granted'
              });
            } else {
              next();
            }
          } // end if expired / else if no routes found / else check allowedPath
        }   // end if no permissions / else permissions
      }     // end if err / else no err
    });     // end verify token function
  }         // end if no token / else token
};

router.post('/login', (req, res) => {
  logger.info('login', req.body);
  let authToken, userFound;
  const userFromClient = req.body;
  if(!userFromClient.username) {
    res.status(400).json({ message: 'missing username' });
    return;
  } else if(!userFromClient.password){
    res.status(400).json({ message: 'missing password' });
    return;
  }
  return knex('users')
    .select(userScAsCcExtract)
    .where('username', '=',  userFromClient.username)
    .then(users => {
      if(users.length <= 0) throw { message: 'user not found' };
      userFound = users[0];
      logger.info('userFound',userFound);
      return validatePassword(userFromClient.password, userFound.password);
    })
    .then( isValid => {
      if(!isValid) throw { message: 'incorrect password' };
      return;
    })
    .then(()=>{
      const userForToken = {
        id: userFound.id,
        username: userFound.username,
        permissions: userFound.permissions,
      };
      authToken = createAuthToken(userForToken);
      const userForResponse = {
        id:        userFound.id,
        username:  userFound.username,
        firstName: userFound.firstName,
        lastName:  userFound.lastName,
        authToken: authToken,
        pwReset:   userFound.pwReset,
      };
      logger.info('login: userForResponse',userForResponse);
      return userForResponse;
    })
    .then(user => {
      res.status(200).json(user);
    })
    .catch(err => {
      respondToError(err, res);
    });
});

router.post('/relogin', (req, res) => {
  const authToken = req.body.authToken;
  let idUser = null;
  console.log('authToken', authToken);

  if(authToken){
    return new Promise(resolve=>{
      resolve(
        jwt.verify(authToken,JWT_SECRET,(err,decod)=>{
          if(!err){
            console.log(decod); 
            if(decod.user){
              if(isPrimitiveNumber(decod.user.id)) {
                idUser = decod.user.id;
              }
            }
          }     
        })
      );
    })
      .then(()=>{
        console.log('idUser', idUser);
        if(idUser){
          return knex('users')
            .select(userScAsCcExtract)
            .where('id', '=',  idUser)
            .then( usersFound => { 
              console.log('usersFound',usersFound);
              const userFound = usersFound[0];
              const userForToken = {
                id: userFound.id,
                username: userFound.username,
                permissions: userFound.permissions,
              };
              const newAuthToken = createAuthToken(userForToken);
              const userForResponse = {
                id:        userFound.id,
                username:  userFound.username,
                firstName: userFound.firstName,
                lastName:  userFound.lastName,
                authToken: newAuthToken,
              };
              logger.info('login: userForResponse',userForResponse);
              return userForResponse;
            })
            .then( user => {
              res.status(200).json(user);
            })
            .catch( err => {
              respondToError(err, res);
            });
        } else {
          res.status(400).json({message: 'invalid request'});
        }
      });
  } else {
    res.status(400).json({message: 'missing auth token, cannot reauthenticate; please log in with username and password'});
  }
});

router.post('/pwreset', (req, res) => {
  let tempPw;
  const email = req.body.email;
  if(!email || typeof email !== 'string') {
    return res.status(400).json({message: 'invalid email'});
  }
  return knex('users')
    .where('email', '=',  email)
    .then( usersFound => { 
      return usersFound[0];
    })
    .then(user => {
      const id = user ? user.id : null ;
      if(id){
        tempPw = generator.generate({
          length: 10,
          numbers: true
        });
        return hashPassword(tempPw)
          .then(hashed=>{
            return knex('users')
              .update({
                password: hashed,
                pw_reset: true,
              })
              .where('id', '=',  id)
              .then( usersFound => { 
                return usersFound[0];
              });
          })
          .then(()=>{
            sendPwReset(user.email, tempPw);
            res.status(200).json({message: `a temporary password was sent to ${user.email}`});
          });
      } else {
        res.status(400).json({message: 'user not found'});
      }
    })
    .catch( err => {
      respondToError(err, res);
    });
});

module.exports = {
  router, 
  jwtStrategy, 
  hashPassword,
  createAuthToken 
};