'use strict';

const chai      = require('chai');
const expect    = chai.expect;
const chaiHttp  = require('chai-http');
const logger    = require('../comm/logger').createLogger('./test/endpoint-users.log'); // logs to a file
const knex      = require('../db-sql');
// var chaiAsPromised = require('chai-as-promised');
// chai.use(chaiAsPromised);
chai.use(chaiHttp); // lets us make HTTP requests in our tests. https://github.com/chaijs/chai-http

const { app, runServer, closeMongoServer} = require('../index'); // if server.js includes other functions to export, list here.
const {
  validateUserFieldsPresent,
  validateUserFieldsString,
  validateUserFieldsTrimmed,
  validateUserFieldsArray,
  validateUserFieldsSize,
  validateUser,
  confirmUniqueKey,
} = require('../routers/users');
const {uniqueNumber0, uniqueNumber1} = require('../test/helpers');

describe('endpoint users', () => { 

  let authToken;
  let userId;

  before(() => { 
    return runServer()
      .then(()=>{
        return chai.request(app)
          .post('/api/auth/login')
          .send({username: 'testuser3333', password: 'testuser3333'})
          .then(fetched=>{
            authToken = fetched.res.body.authToken;
            logger.info('fetched at login', fetched.res.body, 'authToken', authToken);
            return;
          });
      })
      .then(()=>{
        return knex.raw('delete from users where first_name = \'Wanda\';delete from users where first_name = \'Wendy\';')
          .then(()=>{
            return;
          });
      });
  });

  after(() => {
    return closeMongoServer();
  });

  it('validateUserFieldsPresent invalid user', () => {
    const user = 'not an object';
    const keys = ['firstName', 'lastName'];
    const type = 'existing';
    const expectedResult = { message: 'invalid user' };
    const result = validateUserFieldsPresent(user, keys, type);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsPresent invalid keys', () => {
    // startingTime and endingTime can be strings or timestamps
    const user = {};
    const keys = 'not an array';
    const type = 'existing';
    const expectedResult = { message: 'invalid user keys' };
    const result = validateUserFieldsPresent(user, keys, type);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsPresent ok if NOT new user', () => {
    // startingTime and endingTime can be strings or timestamps
    const user = {};
    const keys = [];
    const type = 'existing';
    const expectedResult = 'ok';
    const result = validateUserFieldsPresent(user, keys, type);
    expect(result).to.equal(expectedResult);
  });
  it('validateUserFieldsPresent missing field', () => {
    // startingTime and endingTime can be strings or timestamps
    const user = {
      firstName: 'Brad',
      lastName: 'Garner'
    };
    const keys = ['firstName', 'someKey'];
    const type = 'new';
    const expectedResult = {
      message: 'Missing field',
      location: 'someKey',
    };
    const result = validateUserFieldsPresent(user, keys, type);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsPresent no missing field', () => {
    // startingTime and endingTime can be strings or timestamps
    const user = {
      firstName: 'Brad',
      lastName: 'Garner',
      extra: 'extra!'
    };
    const keys = ['firstName', 'lastName'];
    const type = 'new';
    const expectedResult = 'ok';
    const result = validateUserFieldsPresent(user, keys, type);
    expect(result).to.equal(expectedResult);
  });

  it('validateUserFieldsString invalid user', () => {
    const user = 'not an object';
    const keys = []; 
    const expectedResult = { message: 'invalid user' };
    const result = validateUserFieldsString(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsString invalid keys', () => {
    const user = {};
    const keys = 'not an array'; 
    const expectedResult = { message: 'invalid user keys' };
    const result = validateUserFieldsString(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsString incorrect type', () => {
    const user = {
      firstName: 'Brad',
      lastName: {notQuite: 'a string'},
    };
    const keys = ['firstName', 'lastName']; 
    const expectedResult = {
      message: 'Incorrect field type: expected string',
      location: 'lastName'
    };
    const result = validateUserFieldsString(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsString skips incorrect type if not included', () => {
    const user = {
      firstName: 'Brad',
      lastName: {notQuite: 'a string'},
    };
    const keys = ['firstName']; 
    const expectedResult = 'ok';
    const result = validateUserFieldsString(user, keys);
    expect(result).to.equal(expectedResult);
  });
  it('validateUserFieldsString all correct types', () => {
    const user = {
      firstName: 'Brad',
      lastName: 'String',
    };
    const keys = ['firstName', 'lastName']; 
    const expectedResult = 'ok';
    const result = validateUserFieldsString(user, keys);
    expect(result).to.equal(expectedResult);
  });

  it('validateUserFieldsTrimmed invalid user', () => {
    const user = 'not an object';
    const keys = []; 
    const expectedResult = { message: 'invalid user' };
    const result = validateUserFieldsTrimmed(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsTrimmed invalid keys', () => {
    const user = {};
    const keys = 'not an array'; 
    const expectedResult = { message: 'invalid user keys' };
    const result = validateUserFieldsTrimmed(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsTrimmed start white', () => {
    const user = {
      username: ' brad',
      password: 'reallysecurepassWord!',
    };
    const keys = ['username', 'password']; 
    const expectedResult = {
      message: 'Cannot start or end with whitespace',
      location: 'username',
    };
    const result = validateUserFieldsTrimmed(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsTrimmed end white', () => {
    const user = {
      username: 'brad',
      password: 'reallysecurepassWord! ',
    };
    const keys = ['username', 'password']; 
    const expectedResult = {
      message: 'Cannot start or end with whitespace',
      location: 'password',
    };
    const result = validateUserFieldsTrimmed(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsTrimmed ignores middle space', () => {
    const user = {
      username: 'brad',
      password: 'reallysecure passWord!',
    };
    const keys = ['username', 'password']; 
    const expectedResult = 'ok';
    const result = validateUserFieldsTrimmed(user, keys);
    expect(result).to.equal(expectedResult);
  });

  it('validateUserFieldsArray invalid user', () => {
    const user = 'not an object';
    const keys = []; 
    const expectedResult = { message: 'invalid user' };
    const result = validateUserFieldsArray(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsArray invalid keys', () => {
    const user = {};
    const keys = 'not an array'; 
    const expectedResult = { message: 'invalid user keys' };
    const result = validateUserFieldsArray(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsArray invalid if not array', () => {
    const user = {
      permissions: 'not an array',
      password: 'reallysecurepassWord!',
    };
    const keys = ['permissions']; 
    const expectedResult = {
      message: 'Incorrect field type: expected array',
      location: 'permissions',
    };
    const result = validateUserFieldsArray(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsArray invalid if not present', () => {
    const user = {
      password: 'reallysecurepassWord!',
    };
    const keys = ['permissions']; 
    const expectedResult = {
      message: 'Incorrect field type: expected array',
      location: 'permissions',
    };
    const result = validateUserFieldsArray(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsArray invalid if not array of strings 0', () => {
    const user = {
      permissions: [1,'string',{}],
      password: 'reallysecurepassWord!',
    };
    const keys = ['permissions']; 
    const expectedResult = {
      message: 'Incorrect data type at permissions index #2: expected string',
      location: 2,
    };
    const result = validateUserFieldsArray(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsArray invalid if not array of strings 1', () => {
    const user = {
      permissions: ['string',{},'string2'],
      password: 'reallysecurepassWord!',
    };
    const keys = ['permissions']; 
    const expectedResult = {
      message: 'Incorrect data type at permissions index #1: expected string',
      location: 1,
    };
    const result = validateUserFieldsArray(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsArray valid if array of strings', () => {
    const user = {
      permissions: ['string','string2'],
      password: 'reallysecurepassWord!',
    };
    const keys = ['permissions']; 
    const expectedResult = 'ok';
    const result = validateUserFieldsArray(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });

  it('validateUserFieldsSize invalid user', () => {
    const user = 'not an object';
    const keys = []; 
    const expectedResult = { message: 'invalid user' };
    const result = validateUserFieldsSize(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsSize invalid keys', () => {
    const user = {};
    const keys = 'not an array'; 
    const expectedResult = { message: 'invalid user keys' };
    const result = validateUserFieldsSize(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsSize invalid if too small', () => {
    const user = {
      firstName: 'Brad',
      lastName: 'Garner',
    };
    const keys = {
      firstName: { min: 5, max: 25 },
      lastName:  { min: 8, max: 33 },
    };    const expectedResult = {
      message: 'Must be at least 5 characters long',
      location: 'firstName',
    };
    const result = validateUserFieldsSize(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsSize invalid if too big', () => {
    const user = {
      firstName: 'Brad',
      lastName: 'GarnerGarnerGarnerGarnerGarnerGarnerGarner',
    };
    const keys = {
      firstName: { min: 3, max: 25 },
      lastName:  { min: 5, max: 33 },
    };    const expectedResult = {
      message: 'Must be at most 33 characters long',
      location: 'lastName',
    };
    const result = validateUserFieldsSize(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUserFieldsSize ok', () => {
    const user = {
      firstName: 'Brad',
      lastName: 'Garner',
    };
    const keys = {
      firstName: { min: 3, max: 25 },
      lastName:  { min: 5, max: 33 },
    };
    const expectedResult = 'ok';
    const result = validateUserFieldsSize(user, keys);
    expect(result).to.deep.equal(expectedResult);
  });

  it('validateUser invalid user', () => {
    const user = 'not an object';
    const type = 'existing';
    const keys = {
      users: [
        //snake all             cC all              2POST   3POST req. 4PUT  5STRING 6TRIM 7SIZES 8NAME 9DEFINITIONS
        ['id'               ,'id'                ,false,  false,    false, false,  false, false,'user id'          ,'unique id'],
        ['timestamp_created','timestampCreated'  ,false,  false,    false, false,  false, false,'timestamp created','date and time of record creation'],
          
        ['username'         ,'username'          ,true ,  true ,    true , true ,  true , {min: 1 },'username'     ,'username'], 
        ['password'         ,'password'          ,true ,  true ,    true , true ,  true , {min: 8, max: 72 },'password','hashed password'],    
        ['first_name'       ,'firstName'         ,true ,  true ,    true , true ,  false, false,'first name'       ,'user\'s first name'], 
        ['last_name'        ,'lastName'          ,true ,  true ,    true , true ,  false, false,'last name'        ,'user\'s last name'], 
        ['email'            ,'email'             ,true ,  true ,    true , true ,  false, false,'user\'s email'    ,'user\'s email is only used for password recovery'], 
        ['pw_reset'         ,'pwReset'           ,false,  false,    true , true ,  false, false,'password reset'   ,'true if user must reset password'], 
        ['permissions'      ,'permissions'       ,true ,  true ,    true , false,  false, false,'permissions'      ,'user\'s permissions, including which server endpoints are authorized'], 
      ],
    };
    const expectedResult = { message: 'invalid user' };
    const result = validateUser(user, type, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUser invalid type', () => {
    const user = {};
    const type = {};
    const keys = {
      users: [
        //snake all             cC all              2POST   3POST req. 4PUT  5STRING 6TRIM 7SIZES 8NAME 9DEFINITIONS
        ['id'               ,'id'                ,false,  false,    false, false,  false, false,'user id'          ,'unique id'],
        ['timestamp_created','timestampCreated'  ,false,  false,    false, false,  false, false,'timestamp created','date and time of record creation'],
          
        ['username'         ,'username'          ,true ,  true ,    true , true ,  true , {min: 1 },'username'     ,'username'], 
        ['password'         ,'password'          ,true ,  true ,    true , true ,  true , {min: 8, max: 72 },'password','hashed password'],    
        ['first_name'       ,'firstName'         ,true ,  true ,    true , true ,  false, false,'first name'       ,'user\'s first name'], 
        ['last_name'        ,'lastName'          ,true ,  true ,    true , true ,  false, false,'last name'        ,'user\'s last name'], 
        ['email'            ,'email'             ,true ,  true ,    true , true ,  false, false,'user\'s email'    ,'user\'s email is only used for password recovery'], 
        ['pw_reset'         ,'pwReset'           ,false,  false,    true , true ,  false, false,'password reset'   ,'true if user must reset password'], 
        ['permissions'      ,'permissions'       ,true ,  true ,    true , false,  false, false,'permissions'      ,'user\'s permissions, including which server endpoints are authorized'], 
      ],
    };
    const expectedResult = { message: 'invalid user type' };
    const result = validateUser(user, type, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUser invalid keys', () => {
    const user = {};
    const type = 'existing';
    const keys = 'not an object';
    const expectedResult = { message: 'invalid keys' };
    const result = validateUser(user, type, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUser invalid array of keys', () => {
    const user = {};
    const type = 'existing';
    const keys = {
      users: 'not an array'
    };
    const expectedResult = { message: 'invalid user keys' };
    const result = validateUser(user, type, keys);
    expect(result).to.deep.equal(expectedResult);
  });
  it('validateUser ok on existing', () => {
    const user = {
      permissions: ['admin'], // only field ABSOLUTELY required for any put or post
    };
    const type = 'existing';
    const keys = {
      users: [
        //snake all             cC all              2POST   3POST req. 4PUT  5STRING 6TRIM 7SIZES 8NAME 9DEFINITIONS
        ['id'               ,'id'                ,false,  false,    false, false,  false, false,'user id'          ,'unique id'],
        ['timestamp_created','timestampCreated'  ,false,  false,    false, false,  false, false,'timestamp created','date and time of record creation'],
          
        ['username'         ,'username'          ,true ,  true ,    true , true ,  true , {min: 1 },'username'     ,'username'], 
        ['password'         ,'password'          ,true ,  true ,    true , true ,  true , {min: 8, max: 72 },'password','hashed password'],    
        ['first_name'       ,'firstName'         ,true ,  true ,    true , true ,  false, false,'first name'       ,'user\'s first name'], 
        ['last_name'        ,'lastName'          ,true ,  true ,    true , true ,  false, false,'last name'        ,'user\'s last name'], 
        ['email'            ,'email'             ,true ,  true ,    true , true ,  false, false,'user\'s email'    ,'user\'s email is only used for password recovery'], 
        ['pw_reset'         ,'pwReset'           ,false,  false,    true , true ,  false, false,'password reset'   ,'true if user must reset password'], 
        ['permissions'      ,'permissions'       ,true ,  true ,    true , false,  false, false,'permissions'      ,'user\'s permissions, including which server endpoints are authorized'], 
      ],
    };
    const expectedResult = 'ok';
    const result = validateUser(user, type, keys);
    expect(result).to.equal(expectedResult);
  });
  it('validateUser deep check for new', () => {
    const user = {
      username: 'bradgarner',
      password: 'asjfklsjflksjflkajsklfjskl',
      firstName: 'Brad',
      lastName: 'Garner',
      email: 'asfjskldjfkljfklajksdj',
      permissions: ['admin'],
    };
    const type = 'existing';
    const keys = {
      users: [
        //snake all             cC all              2POST   3POST req. 4PUT  5STRING 6TRIM 7SIZES 8NAME 9DEFINITIONS
        ['id'               ,'id'                ,false,  false,    false, false,  false, false,'user id'          ,'unique id'],
        ['timestamp_created','timestampCreated'  ,false,  false,    false, false,  false, false,'timestamp created','date and time of record creation'],
          
        ['username'         ,'username'          ,true ,  true ,    true , true ,  true , {min: 1 },'username'     ,'username'], 
        ['password'         ,'password'          ,true ,  true ,    true , true ,  true , {min: 8, max: 72 },'password','hashed password'],    
        ['first_name'       ,'firstName'         ,true ,  true ,    true , true ,  false, false,'first name'       ,'user\'s first name'], 
        ['last_name'        ,'lastName'          ,true ,  true ,    true , true ,  false, false,'last name'        ,'user\'s last name'], 
        ['email'            ,'email'             ,true ,  true ,    true , true ,  false, false,'user\'s email'    ,'user\'s email is only used for password recovery'], 
        ['pw_reset'         ,'pwReset'           ,false,  false,    true , true ,  false, false,'password reset'   ,'true if user must reset password'], 
        ['permissions'      ,'permissions'       ,true ,  true ,    true , false,  false, false,'permissions'      ,'user\'s permissions, including which server endpoints are authorized'], 
      ],
    };
    const expectedResult = 'ok';
    const result = validateUser(user, type, keys);
    expect(result).to.deep.equal(expectedResult);
  });

  it('confirmUniqueKey', () => {
    // test via integration testing
  });

  it('posts a unique user', () => {
    const user = {
      firstName: 'Wanda',
      lastName: 'Sykes',
      username: `ws${uniqueNumber0}`,
      password: 'dsfdfsdfsdfdfdsa',
      email: `email@${uniqueNumber0}.net`,
      permissions: ['admin'],
    };
    return chai.request(app)
      .post('/api/users')
      .set('ContentType', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .send(user)
      .then(r=> {
        userId = r.body.id;
        console.log('just posted user #', userId);
        expect(r.body.id).to.be.above(0);
        expect(r.body).to.not.haveOwnProperty('password');
        expect(r.body).to.not.haveOwnProperty('authToken');
      });
  });
  it('posts a non-unique username and returns error', () => {
    const user = {
      firstName: 'Wanda',
      lastName: 'Sykes',
      username: `ws${uniqueNumber0}`,
      password: 'dsfdfsdfsdfdfdsa',
      email: 'asfsdjjkajskfdkaj;jkj',
      permissions: ['admin'],
    };
    const err = () => {
      return chai.request(app)
        .post('/api/users')
        .set('ContentType', 'application/json')
        .set('Authorization', `Bearer ${authToken}`)
        .send(user)
        .then(()=> {
          return;
        });
    };
    chai.assert(err(), 'Error');
  });
  it('posts a non-unique email and returns error', () => {
    const user = {
      firstName: 'Wanda',
      lastName: 'Sykes',
      username: `ws${uniqueNumber0}333`,
      password: 'dsfdfsdfsdfdfdsa',
      email: `email@${uniqueNumber0}.net`,
      permissions: ['admin'],
    };
    const err = () => {
      return chai.request(app)
        .post('/api/users')
        .set('ContentType', 'application/json')
        .set('Authorization', `Bearer ${authToken}`)
        .send(user)
        .then(()=> {
          return;
        });
    };
    chai.assert(err(), 'Error');
  });
  it('posts a unique user without a key and returns error', () => {
    const user = {
      firstName: 'Wanda',
      lastName: 'Sykes',
      username: `ws${uniqueNumber0}777`,
      password: 'dsfdfsdfsdfdfdsa',
      email: `email@${uniqueNumber0}.gov`,
      permissions: ['admin'],
    };
    const users = [];
    for (let key in user){
      const userWithoutKey = Object.assign({}, user);
      delete userWithoutKey[key];
      users.push(userWithoutKey);
    }
    const errs = users.map(u=>{
      return () => {
        return chai.request(app)
          .post('/api/users')
          .set('ContentType', 'application/json')
          .set('Authorization', `Bearer ${authToken}`)
          .send(u)
          .then(r=> {
            return;
          });
      };
    });
    errs.forEach(e=>{
      chai.assert(e(), 'Error', 'Internal Server Error');
    });
  });
  it('puts a non-unique username and returns error', () => {
    const user = {
      firstName: 'Wanda',
      lastName: 'Sykes',
      username: 'testuser3333',
      password: 'dsfdfsdfsdfdfdsa',
      email: `email@${uniqueNumber1}.com`,
      permissions: ['admin'],
    };
    const err = () => {
      return chai.request(app)
        .put(`/api/users/${userId}`)
        .set('ContentType', 'application/json')
        .set('Authorization', `Bearer ${authToken}`)
        .send(user)
        .then(r=> {
          return;
        });
    };
    chai.assert(err(), 'Error', 'Internal Server Error');
  });
  it('puts a non-unique email and returns error', () => {
    const user = {
      firstName: 'Wanda',
      lastName: 'Sykes',
      username: 'testuser13579',
      password: 'dsfdfsdfsdfdfdsa',
      email: 'testuser3333@testuser3333.com',
      permissions: ['admin'],
    };
    const err = () => {
      return chai.request(app)
        .put(`/api/users/${userId}`)
        .set('ContentType', 'application/json')
        .set('Authorization', `Bearer ${authToken}`)
        .send(user)
        .then(r=> {
          return;
        });
    };
    chai.assert(err(), 'Error', 'Internal Server Error');
  });
  it('puts a non-existing user and returns error', () => {
    const user = {
      firstName: 'Wanda',
      lastName: 'Sykes',
      username: 'testuser3333',
      password: 'dsfdfsdfsdfdfdsa',
      email: 'asfsdjjkajskfdkaj;jkj',
      permissions: ['admin'],
    };
    const err = () => {
      return chai.request(app)
        .put(`/api/users/${userId+1}`)
        .set('ContentType', 'application/json')
        .set('Authorization', `Bearer ${authToken}`)
        .send(user)
        .then(r=> {
          return;
        });
    };
    chai.assert(err(), 'Error');
  });
  it('puts a user', () => {
    const user = {
      firstName: 'Wendy',
      lastName: 'Williams',
      username: `ws${uniqueNumber0}`,
      password: 'dsfdfsdfsdfdfdsa',
      email: `email@${uniqueNumber0}.biz`,
      permissions: ['admin'],
    };
    return chai.request(app)
      .put(`/api/users/${userId}`)
      .set('ContentType', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .send(user)
      .then(r=> {
        const returnedUser = r.body;
        console.log('returnedUser',returnedUser);
        expect(returnedUser.id).to.be.above(0);
        expect(returnedUser.firstName).to.equal(user.firstName);
        expect(returnedUser).to.not.haveOwnProperty('password');
        expect(returnedUser).to.not.haveOwnProperty('authToken');
      });
  });
  it('gets a user by id', () => {
    return chai.request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .then(r=> {
        expect(r.body.id).to.be.above(0);
        expect(r.body).to.not.haveOwnProperty('password');
        expect(r.body).to.not.haveOwnProperty('authToken');
        expect(r.body).to.haveOwnProperty('firstName');
        expect(r.body).to.haveOwnProperty('lastName');
      });
  });
  it('gets a user fails without authToken', () => {
    const err = () => {
      return chai.request(app)
        .get(`/api/users/${userId}`)
        .then(()=> {
          return;
        });
    };
    chai.assert(err(),'Error', 'Forbidden');
  });
  it('post a user fails without authToken', () => {
    const err = () => {
      return chai.request(app)
        .post(`/api/users/${userId}`)
        .then(()=> {
          return;
        });
    };
    chai.assert(err(),'Error', 'Forbidden');
  });
  it('put a user fails without authToken', () => {
    const err = () => {
      return chai.request(app)
        .put(`/api/users/${userId}`)
        .then(()=> {
          return;
        });
    };
    chai.assert(err(),'Error', 'Forbidden');
  });

  it('auth login invalid username', () => {
    const err = () => {
      return chai.request(app)
        .post('/api/auth/login')
        .send({username: 'unrecognized', password: 'testuser3333'})
        .then(()=>{
          return;
        });
    };
    chai.assert(err(), 'Error');
  });
  it('auth login invalid password', () => {
    const err = () => {
      return chai.request(app)
        .post('/api/auth/login')
        .send({username: 'testuser3333', password: 'wrong'})
        .then(()=>{
          return;
        });
    };
    chai.assert(err(), 'Error');
  });
  it('auth login without username', () => {
    const err = () => {
      return chai.request(app)
        .post('/api/auth/login')
        .send({notusername: 'testuser3333', password: 'testuser3333'})
        .then(()=>{
          return;
        });
    };
    chai.assert(err(), 'Error');
  });
  it('auth login without password', () => {
    const err = () => {
      return chai.request(app)
        .post('/api/auth/login')
        .send({username: 'testuser3333', notpassword: 'testuser3333'})
        .then(()=>{
          return;
        });
    };
    chai.assert(err(), 'Error');
  });

  it('put api/auth/relogin with token gets new token', ()=>{
    const user = {
      authToken
    };
    return chai.request(app)
      .post('/api/auth/relogin')
      .send(user)
      .then(res=>{
        expect(res.body).to.haveOwnProperty('authToken');
        expect(res.body.authToken).to.not.equal(authToken);
      });
  });
  it('put api/auth/relogin returns error without token', ()=>{
    const user = {
      notAuthToken: 'blah blah'
    };
    const err = () => {
      return chai.request(app)
        .post('/api/auth/relogin')
        .send(user)
        .then(()=>{
          return;
        });
    };
    chai.assert(err(), 'Error');
  });
  it('put api/auth/relogin returns error with invalid token', ()=>{
    const user = {
      authToken: 'blah blah'
    };
    const err = () => {
      return chai.request(app)
        .post('/api/auth/relogin')
        .send(user)
        .then(()=>{
          return;
        });
    };
    chai.assert(err(), 'Error');
  });

  it('put api/auth/pwreset with valid email', ()=>{
    const user = {
      email: 'brad@bradgarner.com'
    };
    const expectedResult = {
      message: 'a temporary password was sent to brad@bradgarner.com',
    };
    return chai.request(app)
      .post('/api/auth/pwreset')
      .send(user)
      .then(res=>{
        expect(res.body).to.deep.equal(expectedResult);
      });
  });
  it('put api/auth/pwreset error on invalid email', ()=>{
    const user = {
      email: 'invalid email'
    };
    const err = () => {
      return chai.request(app)
        .post('/api/auth/pwreset')
        .send(user)
        .then(res=>{
          return;
        });
    };
    chai.assert(err(), 'Error');    
  });
  it('put api/auth/pwreset error on no email', ()=>{
    const user = {
      notEmail: 'brad@bradgarner.com'
    };
    const err = () => {
      return chai.request(app)
        .post('/api/auth/pwreset')
        .send(user)
        .then(res=>{
          return;
        });
    };
    chai.assert(err(), 'Error');    
  });
  it('puts a user (corrects password for next round)', () => {
    const user = {
      firstName: 'test',
      lastName: 'user',
      username: 'testuser3333',
      password: 'testuser3333',
      email: 'brad@bradgarner.com',
      permissions: ['admin','user'],
    };
    return chai.request(app)
      .put('/api/users/1')
      .set('ContentType', 'application/json')
      .set('Authorization', `Bearer ${authToken}`)
      .send(user)
      .then(r=> {
        const returnedUser = r.body;
        console.log('returnedUser',returnedUser);
        expect(returnedUser.id).to.be.above(0);
        expect(returnedUser.firstName).to.equal(user.firstName);
        expect(returnedUser).to.not.haveOwnProperty('password');
        expect(returnedUser).to.not.haveOwnProperty('authToken');
      });
  });

});