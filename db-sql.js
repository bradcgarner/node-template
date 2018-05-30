'use strict';

const { DATABASE_URL, TEST_DATABASE_URL } = require('./config');
let dbMode = process.env.DB_MODE;

const dbConfigurations = {
  production: {
    client: 'pg',
    connection: DATABASE_URL,
    pool: { min: 0, max: 3 },
    debug: false
  },

  test: {
    client: 'pg',
    connection: TEST_DATABASE_URL,
    pool: { min: 0, max: 3 },
    debug: false
  }
};

const dbConfig = dbConfigurations[dbMode];

module.exports = require('knex')(dbConfig);