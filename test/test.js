'use strict';

const chai = require('chai');
const should = chai.should(); // lets us use *should* style syntax in our tests http://chaijs.com/api/bdd/
const chaiHttp = require('chai-http');
const uuid = require('uuid');

const {app, runServer, closeServer} = require('../server'); // if server.js includes other functions to export, list here.

chai.use(chaiHttp); // lets us make HTTP requests in our tests. https://github.com/chaijs/chai-http

// Set NODE_ENV to `test` to disable http layer logs
// You can do this in the command line, but this is cross-platform
process.env.NODE_ENV = 'test';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

describe('describe this test', function() { // mocha has built-in promise handling in before, after, beforeEach, afterEach, and it

  before(function() { // before expects to return a promise. runSever() returns a promise, so we return that.
    return runServer();
  });

  beforeEach(function() { // again return a promise
    return somePromise();
  });

  afterEach(function() {
    return someOtherPromise();
  });

  after(function() {
    return closeServer();
  });

  it('should do what', function() { // it expects to return a promise, or a done callback. chai.request returns a promise, so we return that.
    return chai.request(app)
      .get('/shopping-list')
      .then(function(res) { // just examples...
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('array');
        const expectedKeys = ['id', 'name', 'checked'];
        res.body.forEach(function(item) {
          item.should.be.a('object');
          item.should.include.keys(expectedKeys);
        });
      });
  });
});