'use strict';

const helpers = require('./lib');

const galsToInches = (gallons, squareFeet) => {
  // input: numbers, output: either a number or undefined;
  // precision: 4 decimal places, set here
  if(!helpers.isPrimitiveNumber(gallons) || !helpers.isPrimitiveNumber(squareFeet)) return;
  if(squareFeet === 0) return 0;
  const squareInches = squareFeet * 144;
  const cubicInches = gallons * 231;
  return helpers.precisionRound(cubicInches / squareInches, 4);
}; 

const galsToLbs = gallons => {
  // input: number, output: either a number or undefined;
  // precision: 4 decimal places, set here
  if(!helpers.isPrimitiveNumber(gallons)) return;
  return  helpers.precisionRound(gallons * 8.34, 4);
};

const lbsToGals = lbs => {
  // input: number, output: either a number or undefined;
  // precision: 4 decimal places, set here
  if(!helpers.isPrimitiveNumber(lbs)) return;
  return helpers.precisionRound(lbs / 8.34, 4);
};

module.exports = {
  galsToInches,
  galsToLbs,
  lbsToGals,
};