'use strict';

const logger = require('../comm/logger').createLogger('conversions.log'); // logs to a file

const chai = require('chai');
const expect = chai.expect;

const { 
  galsToInches,
  galsToLbs,
  lbsToGals,
} = require('../helpers/conversions'
);
const {precisionRound} = require('../helpers/lib');
const {
  numbers, 
  nonNumbers, 
  nonObjects,
  nonNumberObjects, 
  nonNumberArrays,
  nonStringPrimitives,
  lowerStrings,
  upperStrings
} = require('../test/helpers');
process.env.DB_MODE = 'test';

// Clear the console before each run
// process.stdout.write('\x1Bc\n');

describe('conversions', function() { // mocha has built-in promise handling in before, after, beforeEach, afterEach, and it

  it('galsToInches undefined if no params', function() { 
    const inches = galsToInches();
    expect(inches).to.equal(undefined);
  });
  it('galsToInches undefined on nonNumbers', function() { 
    nonNumbers.forEach(item=>{
      const num = galsToInches(item, item);
      expect(num).to.equal(undefined);
    });
  });
  it('galsToInches undefined on nonNumberObjects', function() { 
    nonNumberObjects.forEach(item=>{
      const num = galsToInches(item, item);
      expect(num).to.equal(undefined);
    });
  });
  it('galsToInches undefined on nonNumberArrays', function() { 
    nonNumberArrays.forEach(item=>{
      const num = galsToInches(item, item);
      expect(num).to.equal(undefined);
    });
  });
  it('galsToInches true on numbers', function() { 
    const gallons = 33;
    const squareFeet = 200;
    const expectedResult = 0.2647; //  0.26469 rounded to 4
    const inches = galsToInches(gallons, squareFeet);
    expect(precisionRound(inches,5)).to.equal(expectedResult);
  });
  

  it('galsToLbs undefined if no params', function() { 
    const lbs = galsToLbs();
    expect(lbs).to.equal(undefined);
  });
  it('galsToLbs undefined on nonNumbers', function() { 
    nonNumbers.forEach(item=>{
      const num = galsToLbs(item);
      expect(num).to.equal(undefined);
    });
  });
  it('galsToLbs undefined on nonNumberObjects', function() { 
    nonNumberObjects.forEach(item=>{
      const num = galsToLbs(item);
      expect(num).to.equal(undefined);
    });
  });
  it('galsToLbs undefined on nonNumberArrays', function() { 
    nonNumberArrays.forEach(item=>{
      const num = galsToLbs(item);
      expect(num).to.equal(undefined);
    });
  });
  it('galsToLbs true on number', function() { 
    const gallons = 10;
    const expectedResult = 83.4;
    const lbs = galsToLbs(gallons);
    expect(lbs).to.equal(expectedResult);
  });
  

  it('lbsToGals undefined if no params', function() { 
    const gals = lbsToGals();
    expect(gals).to.equal(undefined);
  });
  it('lbsToGals undefined on nonNumbers', function() { 
    nonNumbers.forEach(item=>{
      const num = lbsToGals(item);
      expect(num).to.equal(undefined);
    });
  });
  it('lbsToGals undefined on nonNumberObjects', function() { 
    nonNumberObjects.forEach(item=>{
      const num = lbsToGals(item);
      expect(num).to.equal(undefined);
    });
  });
  it('lbsToGals undefined on nonNumberArrays', function() { 
    nonNumberArrays.forEach(item=>{
      const num = lbsToGals(item);
      expect(num).to.equal(undefined);
    });
  });
  it('lbsToGals true on arrays', function() { 
    const lbs = 83.4;
    const expectedResult = 10;
    const gals = lbsToGals(lbs);
    expect(gals).to.equal(expectedResult);
  });
  
});