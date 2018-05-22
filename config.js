'use strict';

require('dotenv').config(); // this is unconditional, which will require heroku to install it (which is not needed), but since it is listed in core dependencies, it at least won't break heroku. Later learn to do it conditionally.

module.exports = {
  PORT: process.env.PORT || 8080,
  TEST_PORT: process.env.TEST_PORT || 8081,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  DATABASE_URL:
                      process.env.DATABASE_URL || 'mongodb://localhost/code-quiz',
  TEST_DATABASE_URL:
                 process.env.TEST_DATABASE_URL || 'mongodb://localhost/code-quiz-test',
  JWT_SECRET:       process.env.JWT_SECRET,
  JWT_EXPIRY:       process.env.JWT_EXPIRY
};