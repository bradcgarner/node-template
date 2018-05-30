'use strict';

const { loggingFile, sampleScheduleRule } = require('../config');

const schedule =   require('node-schedule');
const logger =     require('../comm/logger').createLogger(loggingFile); // logs to a file
const knex =       require('../db-sql');
const { Sample } = require('../models/sample');

const fileAction = 'sample';
// @@@@@@@@@@@@@@ NOTIFICATIONS  @@@@@@@@@@@@
const { confirmSuccess, logError } = require('../comm/notifications');
const failureSubject = `E*R*R*O*R ${fileAction} ${new Date()}`;
const successSubject = `${fileAction} ${new Date()}`;

// @@@@@@@@@@@@@@ START HELPERS (IN ORDER INVOKED) @@@@@@@@@@@@


// @@@@@@@@@@@@@@ END HELPERS, START SCHEDULED TASK @@@@@@@@@@@@
 
schedule.scheduleJob(sampleScheduleRule, function() {
  
});

module.exports = { 
  
};