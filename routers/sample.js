'use strict';
// endpoint is /api/admin/
// core imports
const express         = require('express');
const router          = express.Router();
const bodyParser      = require('body-parser');
const jsonParser      = bodyParser.json();
// auth import
const { jwtStrategy } = require('./auth/jwt-strategy');
// project-specific imports
const { loggingFile } = require('../config');
const knex            = require('../db-sql');
const logger          = require('../comm/logger').createLogger(loggingFile);
const { Sample }      = require('../models/sample');
// use
router.use(jsonParser);
router.use((req, res, next)=>jwtStrategy(req, res, next));
// @@@@@@@@@@@@@@ END IMPORTS  @@@@@@@@@@@@


// @@@@@@@@@@@@@@ NOTIFICATIONS  @@@@@@@@@@@@
const { confirmSuccess, logError } = require('../comm/notifications');
const failureSubject = `E*R*R*O*R updating schedule ${new Date()}`;
const successSubject = `S*C*H*E*D*U*L*E update ${new Date()}`;

// @@@@@@@@@@@@@@ HELPERS  @@@@@@@@@@@@


// @@@@@@@@@@@@@@ END HELPERS, START ENDPOINTS @@@@@@@@@@@@

// MONGO
router.put('/endpoint',  (req, res) => {
  return Sample.findByIdAndUpdate(1, 
    {$set: {
      key: true,
    }}, 
    {new: true} 
  )
    .then(update=>{
      return;
    })
    .catch(err=>{  
      logger.error('error in catch', err);  
      logError(failureSubject, err, 'status');
      return;
    });
});

// KNEX
router.post('/',  (req, res) => {
  return knex('samples')
    .insert('keys_to_insert')
    .returning('id')
    .then(id => {
      return id;
    })
    .catch(err => {
      logger.error(err);
      if (err.reason === 'ValidationError') {
        return res.status(422).json(err);
      }
      res.status(500).json({ code: 500, message: `Internal server error: ${err.message}` });
    });
});

module.exports = {
  router,
};