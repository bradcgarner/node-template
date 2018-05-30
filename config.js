'use strict';

require('dotenv').config(); // this is unconditional, which will require heroku to install it (which is not needed), but since it is listed in core dependencies, it at least won't break heroku. Later learn to do it conditionally.

module.exports = {

  PORT:                process.env.PORT || 8080,
  TEST_PORT:           process.env.TEST_PORT || 8081,
  
  CLIENT_ORIGIN:       process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  JWT_SECRET:          process.env.JWT_SECRET,
  JWT_EXPIRY:          process.env.JWT_EXPIRY,
  
  DATABASE_URL:        process.env.DATABASE_URL      || 'postgres://localhost/rain',
  TEST_DATABASE_URL:   process.env.TEST_DATABASE_URL || 'postgres://localhost/rain-test',
  
  DATABASE_URL_MONGO:  process.env.DB_MODE === 'test' ? process.env.DATABASE_URL_MONGO_TEST : process.env.DATABASE_URL_MONGO,

  emailSetup: {
    service:           process.env.EMAIL_SERVICE,
    auth: { 
      user:            process.env.EMAIL_ADDRESS,
      pass:            process.env.EMAIL_PASS
    }
  },
  sampleSchedRule:     process.env.SAMPLE_SCHEDULE_RULE || '*/5  * * * *',

  loggingFile:         process.env.LOG_MODE === 'file' ? './comm/notifications.log'   : '' ,
};