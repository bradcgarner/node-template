'use strict';

const logger = require('../comm/logger').createLogger('./test/custom-and-db.log');

const chai = require('chai');
const expect = chai.expect;

process.env.DB_MODE = 'test';

describe('helpers db and custom', ()=> { // mocha has built-in promise handling in before, after, beforeEach, afterEach, and it



});