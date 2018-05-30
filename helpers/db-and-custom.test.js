'use strict';

const logger = require('../comm/logger').createLogger('./test/custom-and-db.log'); // logs to a file

const chai = require('chai');
const expect = chai.expect;

const { 
  formatTimestampForSql,
  formatDataForSql,
  formatObjectForKnex, 
  formatReqBodyForKnex,
  prefixCommonKeys, 
  createSqlFetchTableKeys,
} = require('../helpers/db');
const {
  numbers, 
  nonNumberArrays,
  nonStringPrimitives,
  date1,
  date1String_d_t_z,
  date1StringDtz,
  date1StringDtmsz,
} = require('../test/helpers');
process.env.DB_MODE = 'test';

describe('helpers db and custom', ()=> { // mocha has built-in promise handling in before, after, beforeEach, afterEach, and it

  it('formatTimestampForSql raw date', ()=> { 
    // input: a primitive value or a date that SHOULD be a timestamp
    // i.e. before calling this function, determine that it SHOULD be a timestamp
    // raw sqlOption returns a single-quote-wrapped string with time zone
    // knex sqlOption keeps uses a date object (and lets Knex handle the time zone)
    const value = date1;
    const sqlOption = 'raw';
    const expectedResult = `'${date1String_d_t_z}'`;
    const result = formatTimestampForSql(value, sqlOption);
    expect(result).to.equal(expectedResult);
  });
  it('formatTimestampForSql raw string d t z', ()=> { 
    const value = date1String_d_t_z;
    const sqlOption = 'raw';
    const expectedResult = `'${date1String_d_t_z}'`;
    const result = formatTimestampForSql(value, sqlOption);
    expect(result).to.equal(expectedResult);
  });
  it('formatTimestampForSql raw string dtz', ()=> { 
    const value = date1StringDtz;
    const sqlOption = 'raw';
    const expectedResult = `'${date1StringDtz}'`;
    const result = formatTimestampForSql(value, sqlOption);
    expect(result).to.equal(expectedResult);
  });
  it('formatTimestampForSql raw string dtmsz', ()=> { 
    const value = date1StringDtmsz;
    const sqlOption = 'raw';
    const expectedResult = `'${date1StringDtmsz}'`;
    const result = formatTimestampForSql(value, sqlOption);
    expect(result).to.equal(expectedResult);
  });
  it('formatTimestampForSql raw other', ()=> { 
    const values = [...nonNumberArrays, nonStringPrimitives, numbers];
    const sqlOption = 'raw'; // don't pass to test default
    const expectedResult = 'null';
    values.forEach(value=>{
      const result = formatTimestampForSql(value);
      expect(result).to.equal(expectedResult);
    });
  });
  it('formatTimestampForSql knex date', ()=> { 
    const value = date1;
    const sqlOption = 'knex';
    const expectedResult = date1;
    const result = formatTimestampForSql(value, sqlOption);
    expect(result).to.deep.equal(expectedResult);
  });
  it('formatTimestampForSql knex string', ()=> { 
    const value = date1String_d_t_z;
    const sqlOption = 'knex';
    const expectedResult = date1;
    const result = formatTimestampForSql(value, sqlOption);
    expect(result).to.deep.equal(expectedResult);
  });
  it('formatTimestampForSql knex other', ()=> { 
    const values = [...nonNumberArrays, nonStringPrimitives, numbers];
    const sqlOption = 'knex';
    const expectedResult = null;
    values.forEach(value=>{
      const result = formatTimestampForSql(value, sqlOption);
      expect(result).to.equal(expectedResult);
    });
  });
  
  it('formatDataForSql null raw', ()=> { 
    const nullValues = ['NaN', 'NAN', null, undefined, ''];
    const option = 'raw';
    nullValues.forEach(value=>{
      const result = formatDataForSql(value, 'key', option);
      expect(result).to.equal('null');
    });
    // same but imply option, and no need for key if just null
    const result = formatDataForSql(nullValues[0]);
    expect(result).to.equal('null');
  });
  it('formatDataForSql null skip key default raw', ()=> { 
    // skip key (2nd parameter)
    // skip option (3rd parameter)
    // the 3rd parameter defaults to raw
    const nullValues = ['NaN', 'NAN', null, undefined, ''];
    const result = formatDataForSql(nullValues[0]);
    expect(result).to.equal('null');
  });
  it('formatDataForSql null knex', ()=> { 
    const nullValues = ['NaN', 'NAN', null, undefined, ''];
    const option = 'knex';
    nullValues.forEach(value=>{
      const result = formatDataForSql(value, 'key', option);
      expect(result).to.equal(null);
    });
  });
  it('formatDataForSql null default to knex', ()=> { 
    const nullValues = ['NaN', 'NAN', null, undefined, ''];
    const result = formatDataForSql(nullValues[0],'some key','bogus option');
    expect(result).to.equal(null);
  });
  it('formatDataForSql array timestamp raw', ()=> { 
    const value = [date1, date1String_d_t_z];
    const result = formatDataForSql(value,'timestamp', 'raw');
    const expectedResult = `'{"${date1String_d_t_z}", "${date1String_d_t_z}"}'`;
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql array timestamp raw with null', ()=> { 
    const value = [date1, 'blah blah', date1String_d_t_z];
    const result = formatDataForSql(value,'timestamp', 'raw');
    const expectedResult = `'{"${date1String_d_t_z}", null, "${date1String_d_t_z}"}'`;
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql array string raw', ()=> { 
    const value = ['a string', 'blah blah', 'words...'];
    const result = formatDataForSql(value,'key', 'raw');
    const expectedResult = '\'{"a string", "blah blah", "words..."}\'';
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql array string and number raw', ()=> { 
    const value = ['a string', 3, 'words...'];
    const result = formatDataForSql(value,'key', 'raw');
    const expectedResult = '\'{"a string", 3, "words..."}\'';
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql string raw', ()=> { 
    const value = 'a string';
    const result = formatDataForSql(value,'key', 'raw');
    const expectedResult = `'${value}'`;
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql string knex', ()=> { 
    const value = 'a string';
    const result = formatDataForSql(value,'key', 'knex');
    const expectedResult = value;
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql number raw', ()=> { 
    const value = 88;
    const result = formatDataForSql(value,'key', 'raw');
    const expectedResult = value;
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql number knex', ()=> { 
    const value = 88;
    const result = formatDataForSql(value,'key', 'raw');
    const expectedResult = value;
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql object raw', ()=> { 
    const value = {key: 'value'};
    const result = formatDataForSql(value,'key', 'raw');
    const expectedResult = 'null';
    expect(result).to.equal(expectedResult);
  });
  it('formatDataForSql object knex', ()=> { 
    const value = {key: 'value'};
    const result = formatDataForSql(value,'key', 'knex');
    const expectedResult = null;
    expect(result).to.equal(expectedResult);
  });

  it('formatObjectForKnex', ()=> { 
    const original = {
      aString: 'a string',
      aNumber: 3,
      anObject: {key: 'some value'},
      anotherObject: {key: 33},
      arrayOfTimestamps: [
        date1, date1, date1
      ],
      arrayOfTimestampStrings: [
        date1String_d_t_z, date1String_d_t_z, date1String_d_t_z
      ],
      arrayOfArrays: [
        ['string', 'string'], [1,2]
      ],
      arrayOfNumbers: [ 1,2,3 ],
      timestamp: date1,
      stringTimestamp: date1String_d_t_z,
      anotherTimestamp: date1,
      arrayOfObjects: [ {key: 'val'} ],
    };
    const expectedResult = {
      aString: 'a string',
      aNumber: 3,
      anObject: null,
      anotherObject: null,
      arrayOfTimestamps: [
        date1, date1, date1
      ],
      arrayOfTimestampStrings: [
        date1, date1, date1
      ],
      arrayOfArrays: [
        ['string', 'string'], [1,2]
      ],
      arrayOfNumbers: [ 1,2,3 ],
      timestamp: date1,
      stringTimestamp: date1,
      anotherTimestamp: date1,
      arrayOfObjects: [ null ],
    };
    const result = formatObjectForKnex(original);
    expect(result).to.deep.equal(expectedResult);
  });

  it('formatReqBodyForKnex', ()=> { 
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
    const body = {
      id: 7,
      username: 'brad',
      lastName: 'garner',
      badKey: 'delete this one'
    };
    const table = 'users';
    const action = 'PUT';
    const expectedResult = {
      username: 'brad',
      last_name: 'garner',
    };
    const result = formatReqBodyForKnex(body, keys, table, action);
    expect(result).to.deep.equal(expectedResult);
  });

  it('prefixCommonKeys parent, always, cC', ()=> { 
    const keys = [
      'id',
      'timestamp_created',
      'username',
      'password',
      'first_name'
    ];
    const common = [
      'id',
      'timestamp_created'
    ];
    const table = 'users';
    const options = {
      parent: true,
      alwaysPrefix: true,
      case: 'cC',
    };
    const expectedResult = [
      'users.id as usersId',
      'users.timestamp_created as usersTimestampCreated',
      'username as usersUsername',
      'password as usersPassword',
      'first_name as usersFirstName',
    ];
    const result = prefixCommonKeys(table, keys, common, options);
    expect(result).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys child, always, cC', ()=> { 
    const keys = [
      'id',
      'timestamp_created',
      'username',
      'password',
      'first_name'
    ];
    const common = [
      'id',
      'timestamp_created'
    ];
    const table = 'users';
    const options = {
      alwaysPrefix: true,
      case: 'cC',
    };
    const expectedResult = [
      'users.id as usersId',
      'users.timestamp_created as usersTimestampCreated',
      'username as usersUsername',
      'password as usersPassword',
      'first_name as usersFirstName',
    ];
    const result = prefixCommonKeys(table, keys, common, options);
    expect(result).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys child, not always, cC', ()=> { 
    const keys = [
      'id',
      'timestamp_created',
      'username',
      'password',
      'first_name'
    ];
    const common = [
      'id',
      'timestamp_created'
    ];
    const table = 'users';
    const options = {
      case: 'cC',
    };
    const expectedResult = [ // child = always table. as ~
      'users.id as usersId',
      'users.timestamp_created as usersTimestampCreated',
      'username',
      'password',
      'first_name as firstName',
    ];
    const result = prefixCommonKeys(table, keys, common, options);
    expect(result).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys child, not always, Sc', ()=> { 
    const keys = [
      'id',
      'timestamp_created',
      'username',
      'password',
      'first_name'
    ];
    const common = [
      'id',
      'timestamp_created'
    ];
    const table = 'users';
    const expectedResult = [ // child = always table. as ~
      'users.id as users_id',
      'users.timestamp_created as users_timestamp_created',
      'username',
      'password',
      'first_name',
    ];
    const result = prefixCommonKeys(table, keys, common);
    expect(result).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys child, always, Sc', ()=> { 
    const keys = [
      'id',
      'timestamp_created',
      'username',
      'password',
      'first_name'
    ];
    const common = [
      'id',
      'timestamp_created'
    ];
    const options = {
      alwaysPrefix: true,
    };
    const table = 'users';
    const expectedResult = [ // child = always table. as ~
      'users.id as users_id',
      'users.timestamp_created as users_timestamp_created',
      'username as users_username',
      'password as users_password',
      'first_name as users_first_name',
    ];
    const result = prefixCommonKeys(table, keys, common, options);
    expect(result).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys same on valid input with default or given option 1', () => { 
    const table = 'table';
    const keys = [
      'id', 
      'id_user', 
      'slope_pct'
    ];
    const common = [
      'id', 
      'id_user'
    ];
    const expectedResult = [
      'table.id as table_id', // default is child, child prefixes on common
      'table.id_user as table_id_user', 
      'slope_pct'
    ];
    const prefixedKeys = prefixCommonKeys(table, keys, common);
    expect(prefixedKeys).to.deep.equal(expectedResult);
    const options = {
      case: 'Sc', 
      parent: false,
      alwaysPrefix: false,
    };
    const prefixedKeys1 = prefixCommonKeys(table, keys, common, options);
    expect(prefixedKeys1).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys same on valid input with default or given option 1', () => { 
    const table = 'table';
    const keys = [
      'id', 
      'id_user', 
      'slope_pct'
    ];
    const common = [
      'id', 
      'id_user'
    ];
    const expectedResult = [
      'table.id as table_id', // default is child, child prefixes on common
      'table.id_user as table_id_user', 
      'slope_pct'
    ];
    const options = {
      case: 'Sc', 
      parent: false,
      alwaysPrefix: false,
    };
    const prefixedKeys = prefixCommonKeys(table, keys, common, options);
    expect(prefixedKeys).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys prefixes parent input but not output', () => { 
    const table = 'table';
    const keys = [
      'id', 
      'id_user', 
      'slope_pct'
    ];
    const common = [
      'id', 
      'id_user'
    ];
    const expectedResult = [
      'table.id as id', 
      'table.id_user as id_user', 
      'slope_pct'
    ];
    const options = {case: 'Sc', parent: true};
    const prefixedKeys1 = prefixCommonKeys(table, keys, common, options);
    expect(prefixedKeys1).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys prefixes parent input and output if always', () => { 
    const table = 'table';
    const keys = [
      'id', 
      'id_user', 
      'slope_pct'
    ];
    const common = [
      'id', 
      'id_user'
    ];
    const expectedResult = [
      'table.id as table_id', 
      'table.id_user as table_id_user', 
      'slope_pct as table_slope_pct'
    ];
    const options = {
      case: 'Sc', 
      parent: true,
      alwaysPrefix: true
    };
    const prefixedKeys1 = prefixCommonKeys(table, keys, common, options);
    expect(prefixedKeys1).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys prefixes common if child', () => { 
    const table = 'table';
    const keys = [
      'id', 
      'id_user', 
      'slope_pct'
    ];
    const common = [
      'id', 
      'id_user'
    ];
    const expectedResult = [
      'table.id as table_id', 
      'table.id_user as table_id_user', 
      'slope_pct'
    ];
    const options = {
      case: 'Sc', 
      parent: false,
      alwaysPrefix: false,
    };
    const prefixedKeys1 = prefixCommonKeys(table, keys, common, options);
    expect(prefixedKeys1).to.deep.equal(expectedResult);
  });
  it('prefixCommonKeys prefixes all if child and always', () => { 
    const table = 'table';
    const keys = [
      'id', 
      'id_user', 
      'slope_pct'
    ];
    const common = [
      'id', 
      'id_user'
    ];
    const expectedResult = [
      'table.id as table_id', 
      'table.id_user as table_id_user', 
      'slope_pct as table_slope_pct'
    ];
    const options = {
      case: 'Sc', 
      parent: false,
      alwaysPrefix: true,
    };
    const prefixedKeys1 = prefixCommonKeys(table, keys, common, options);
    expect(prefixedKeys1).to.deep.equal(expectedResult);
  });

  it('createSqlFetchTableKeys joinTo 000, keyLoc 000', ()=> { 
    const tables = ['profiles', 'cassettes', 'tests'];
    const keysToFetch = [
      'profiles.id as id',
      'cassettes.id as cassettesId',
      'tests.id as testsId',
      'mediaCfSf',
      'wtAstmDry',
    ];
    const matchingKey  = 'id';
    const joinTosArray = [0,0,0];
    const keyLocsArray = [0,0,0];
    const expectedResult = {
      fetch: 'profiles.id as id, cassettes.id as cassettesId, tests.id as testsId, mediaCfSf, wtAstmDry',
      table: 'profiles',
      // first 0 in joinToing says cassettes joins to 0 of tables (profiles); the 1 in joinToing says join tests to cassettes (not profiles); the 1 in keyLocping says the foreign key is in tests, not cassettes
      join: 'left join cassettes on profiles.id_cassette = cassettes.id left join tests on profiles.id_test = tests.id',
    };
    const result1 = createSqlFetchTableKeys({tables, keysToFetch, matchingKey, joinTosArray, keyLocsArray});
    const result2 = createSqlFetchTableKeys({tables, keysToFetch, matchingKey, joinTosArray});
    const result3 = createSqlFetchTableKeys({tables, keysToFetch, matchingKey});
    expect(result1).to.deep.equal(expectedResult);
    expect(result2).to.deep.equal(expectedResult);
    expect(result3).to.deep.equal(expectedResult);
  });
  it('createSqlFetchTableKeys joinTo 001, keyLoc 002', ()=> { 
    const tables = ['profiles', 'cassettes', 'tests'];
    const keysToFetch = [
      'profiles.id as id',
      'cassettes.id as cassettesId',
      'tests.id as testsId',
      'mediaCfSf',
      'wtAstmDry',
    ];
    const matchingKey  = 'id';
    const joinTosArray = [0,0,1];
    const keyLocsArray = [0,0,2];
    const expectedResult = {
      fetch: 'profiles.id as id, cassettes.id as cassettesId, tests.id as testsId, mediaCfSf, wtAstmDry',
      table: 'profiles',
      // first 0 in joinToing says cassettes joins to 0 of tables (profiles); the 1 in joinToing says join tests to cassettes (not profiles); the 1 in keyLocping says the foreign key is in tests, not cassettes
      join: 'left join cassettes on profiles.id_cassette = cassettes.id left join tests on cassettes.id = tests.id_cassette',
    };
    const result = createSqlFetchTableKeys({tables, keysToFetch, matchingKey, joinTosArray, keyLocsArray});
    expect(result).to.deep.equal(expectedResult);
  });
  it('createSqlFetchTableKeys joinTo 000, keyLoc 002', ()=> { 
    const tables = ['profiles', 'cassettes', 'tests'];
    const keysToFetch = [
      'profiles.id as id',
      'cassettes.id as cassettesId',
      'tests.id as testsId',
      'mediaCfSf',
      'wtAstmDry',
    ];
    const matchingKey  = 'id';
    const joinTosArray = [0,0,0];
    const keyLocsArray = [0,0,2];
    const expectedResult = {
      fetch: 'profiles.id as id, cassettes.id as cassettesId, tests.id as testsId, mediaCfSf, wtAstmDry',
      table: 'profiles',
      // first 0 in joinToing says cassettes joins to 0 of tables (profiles); the 1 in joinToing says join tests to cassettes (not profiles); the 1 in keyLocping says the foreign key is in tests, not cassettes
      join: 'left join cassettes on profiles.id_cassette = cassettes.id left join tests on profiles.id = tests.id_profile',
    };
    const result = createSqlFetchTableKeys({tables, keysToFetch, matchingKey, joinTosArray, keyLocsArray});
    expect(result).to.deep.equal(expectedResult);
  });
  it('createSqlFetchTableKeys joinTo 001, keyLoc 002', ()=> { 
    const tables = ['profiles', 'cassettes', 'tests'];
    const keysToFetch = [
      'profiles.id as id',
      'cassettes.id as cassettesId',
      'tests.id as testsId',
      'mediaCfSf',
      'wtAstmDry',
    ];
    const matchingKey  = 'id';
    const joinTosArray = [0,0,1];
    const keyLocsArray = [0,0,2];
    const expectedResult = {
      fetch: 'profiles.id as id, cassettes.id as cassettesId, tests.id as testsId, mediaCfSf, wtAstmDry',
      table: 'profiles',
      // first 0 in joinToing says cassettes joins to 0 of tables (profiles); the 1 in joinToing says join tests to cassettes (not profiles); the 1 in keyLocping says the foreign key is in tests, not cassettes
      join: 'left join cassettes on profiles.id_cassette = cassettes.id left join tests on cassettes.id = tests.id_cassette',
    };
    const result = createSqlFetchTableKeys({tables, keysToFetch, matchingKey, joinTosArray, keyLocsArray});
    expect(result).to.deep.equal(expectedResult);
  });
  it('createSqlFetchTableKeys undefined on tables', ()=> { 
    const tables = 'tables';
    const keysToFetch = [
      'profiles.id as id',
      'cassettes.id as cassettesId',
      'tests.id as testsId',
      'mediaCfSf',
      'wtAstmDry',
    ];
    const matchingKey  = 'id';
    const joinTosArray = [0,0,1];
    const keyLocsArray = [0,0,1];
    const result = createSqlFetchTableKeys({tables, keysToFetch, matchingKey, joinTosArray, keyLocsArray});
    expect(result).to.deep.equal(undefined);
  });
  it('createSqlFetchTableKeys undefined on no key array', ()=> { 
    const tables = ['profiles', 'cassettes', 'tests'];
    const keysToFetch  = 'not an array';
    const matchingKey  = 'id';
    const joinTosArray = [0,0,1];
    const keyLocsArray = [0,0,1];
    const result = createSqlFetchTableKeys({tables, keysToFetch, matchingKey, joinTosArray, keyLocsArray});
    expect(result).to.deep.equal(undefined);
  });
  it('createSqlFetchTableKeys undefined on match key not a string', ()=> { 
    const tables = ['profiles', 'cassettes', 'tests'];
    const keysToFetch = [
      'profiles.id as id',
      'cassettes.id as cassettesId',
      'tests.id as testsId',
      'mediaCfSf',
      'wtAstmDry',
    ];
    const matchingKey  = 3; // not a string
    const joinTosArray = [0,0,1];
    const keyLocsArray = [0,0,1];
    const result = createSqlFetchTableKeys({tables, keysToFetch, matchingKey, joinTosArray, keyLocsArray});
    expect(result).to.deep.equal(undefined);
  });


  it('createTimeframes', () => {

  });
  
  it('createRetentionRawSql', () => {

  });

  it('validateLinkUpdate', () => {

  });

});