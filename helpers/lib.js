'use strict';
const { helpersFile } = require('../config');
const logger          = require('../comm/logger').createLogger(helpersFile); // logs to a file

// @@@@@@@@@@@@@@@ TYPES @@@@@@@@@@@@@@@@

const isPrimitiveNumber = number => {
  const isNumberOrNull = !isNaN(number); // limits to Arrays, numbers, null
  const isNotNull = number !== null; // limits to Arrays, null
  const typeIsNumber = typeof number === 'number'; // eliminates Arrays
  return isNumberOrNull && isNotNull && typeIsNumber;
};

const isObjectLiteral = object => {
  const isObject = object instanceof Object;
  const isNotArray = !Array.isArray(object);
  return isObject && isNotArray;
};

// @@@@@@@@@@@@@@@ STRINGS @@@@@@@@@@@@@@@@

const titleCaseWord = (word, option) => {
  // input: string
  // option: 'cC' if the string is snake_case and you want camelCase (returned as SnakeCase or CamelCase)
  // output: capitalized string
  if(typeof word !== 'string') return;
  const end = word.slice(1,word.length);
  const endCase = option === 'cC' ? convertScToCc(end) : end ;
  const front = word.slice(0,1);
  return `${front.toUpperCase()}${endCase}`;
};

const convertScToCc = word => {
  // input: string in snake_case
  // disregards any other type of formatting, such as spaces and hyphens
  if(isPrimitiveNumber(word)) return `${word}`;
  if(typeof word !== 'string') return '';
  const array = word.split('_');
  const first = array[0];
  const others = array.slice(1,array.length);
  const othersCamel = others.map(word=>titleCaseWord(word));
  return `${first}${othersCamel.join('')}`;
};

const convertCcToSc = word => {
  // input: string in camelCase
  // disregards any other type of formatting, such as spaces and hyphens
  if(isPrimitiveNumber(word)) return `${word}`;
  if(typeof word !== 'string') return '';
  // const theWord = 'theWord';
  let newWord = '';
  const caps  = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const lower = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']; 
  for(let i=0; i<= word.length; i++ ) {
    const char =
      caps.includes(word.charAt(i)) ?
        `_${lower[caps.findIndex(letter=>letter===word.charAt(i))]}`
        : word.charAt(i);
    newWord += char;
  }
  return newWord;
};

// @@@@@@@@@@@@@@@ NUMBERS @@@@@@@@@@@@@@@@

const precisionRound = (number, precision) => {
  if(!isPrimitiveNumber(number) || !isPrimitiveNumber(precision)) return 0;
  const factor = Math.pow(10, precision);
  if(factor === 0) return 0;
  return Math.round(number * factor) / factor;
};

// @@@@@@@@@@@@@@@ OBJECT KEYS @@@@@@@@@@@@@@@@

const convertObjectKeyCase = (object, caseOption='cC') => {
  if(!isObjectLiteral(object)) return {};
  const c = caseOption === 'cC' ? 'cC' : 'Sc';
  const newObject = {};
  for(let key in object){
    if(c==='cC'){
      const newKey = key.includes('_') ?
        convertScToCc(key) : key ;
      newObject[newKey] = object[key];
    } else {
      const newKey = convertCcToSc(key);
      newObject[newKey] = object[key];
    }
  }
  return newObject;
};

const shiftObjectKeysColumn = (object, keys, key, position1, position2) => {
  // object: object with keys, 
  // keys: all keys
  // key: to look up in keys, 
  // position1 is from in array, position2 is to in array
  // output: object with keys shifted from position1 to position2, limited to position2 present

  // validate
  if(!isObjectLiteral(keys)) {
    logger.info('shiftObjectKeysColumn FAILED: keys is not instanceof Object');
    return{};
  }
  if(!(Array.isArray(keys[key]))) {
    logger.error(`shiftObjectKeysColumn FAILED: keys[${key}] is not an array`);
    return{};
  }
  if(!(Array.isArray(keys[key][0]))){
  // position 1 must be a number, and must be valid index
    logger.error(`shiftObjectKeysColumn FAILED: keys[${key}][0] is an array`);
    return {};
  }
  if(isNaN(position1) || isNaN(position2)) {
    logger.error(`shiftObjectKeysColumn FAILED: ${position1} or ${position2} is NaN`);
    return {};
  }
  if(typeof keys[key][0][position1] !== 'string') {
    logger.error(`shiftObjectKeysColumn FAILED: keys[${key}][0][${position1}] is a not string (${keys[key][0][position1]})`);
    return{};
  }
  if(typeof keys[key][0][position2] !== 'string') {
    logger.error(`shiftObjectKeysColumn FAILED: keys[${key}][0][${position2}] is a not string (${keys[key][0][position2]})`);
    return {};
  }
  if(object instanceof Object){
    let newObject = {};

    keys[key].forEach(rowOfKeys=>{
      if(object[rowOfKeys[position1]] !== undefined) {
        newObject[rowOfKeys[position2]] = object[rowOfKeys[position1]];
      }
    });
    return newObject;

  } else {
    return {};
  }

};

const shiftArrayKeysColumn = (array, keys, key, position1, position2) => {
  if(!Array.isArray(array))        return [];
  if(!isObjectLiteral(keys))       return [];
  if(typeof key !== 'string')      return array;
  if(!isPrimitiveNumber(position1))return array;
  if(!isPrimitiveNumber(position2))return array;
  if(!Array.isArray(keys[key]))    return array;
  const keyMap = {};
  keys[key].forEach(row=>{
    keyMap[row[position1]] = row[position2];
  });
  const newArray = array.map(string=>keyMap[string]);
  return newArray;
};

const getKeyArray = (keys, key, position1, position2) => {
  // input: key to look up in keys, 1 or 2 positions in the array of keys
  // output: array of keys
  // validate
  // keys must be an object
  if(!(keys instanceof Object)) return [];
  // key within keys must be array of arrays
  if(!(Array.isArray(keys[key]))) return [];
  if(!(Array.isArray(keys[key][0]))) return [];
  // position 1 must be a number, and must be valid index
  if(isNaN(position1)) return [];
  if(!(keys[key][0][position1])) return [];
  // position 2 can be undefined, but if defined, must be a number and must exist
  if(position2 !== undefined){
    if(isNaN(position2)) return [];
    if(keys[key][0][position2]===undefined) return [];
  }
  // read pattern
  const column1 = 
    typeof keys[key][0][position1] === 'string' ? 'field' : null ;
  const column2 = 
    position2 === undefined ? 'list' :
    // EXCEPTION!!! IMPROVE THIS!!!
      position2 === 7 ? 'object list' :
        typeof keys[key][0][position2] === 'string' ? 'field' :
          typeof keys[key][0][position2] === 'boolean' ? 'filter' :
            null;

  if(column1 !== 'field') return [];
  if(column2 === 'list') {
    return keys[key].map(array=>array[position1]);
  }
  if(column2 === 'field') {
    return keys[key].map(array=>{
      if(array[position1]===array[position2]) return array[position1];
      return `${array[position1]} as ${array[position2]}`;
    });
  }
  if(column2 === 'filter') {
    let newArray = [];
    keys[key].forEach(array=>{
      if(array[position2]===true) newArray.push(array[position1]);
    });
    return newArray;
  }
  if(column2 === 'object list') {
    let newObject = {};
    keys[key].forEach(array=>{
      if(array[position2] instanceof Object) newObject[array[position1]] = array[position2];
    });
    return newObject;
  }
  return [];
};

const validateObjectKeysPresent = (object, arrayOfKeys) => {
  if(!Array.isArray(arrayOfKeys)) return {
    message: 'Missing array of keys',
  };
  if(!isObjectLiteral(object)) return {
    message: 'Invalid input',
  };
  const missingField = arrayOfKeys.find(key => (!(key in object)));
  if (missingField) {
    const response = {
      message: 'Missing field',
      location: missingField
    };
    return response;
  }
  return 'ok';
};

const validateObjectKeys = (object, type, rowOfKeys) => { // type = new or existing
  if(!isObjectLiteral(object)) return {
    message: 'Invalid input',
  };
  // input: object to validate
  // input: type: new or not
  // input: rowOfKeys: array of keys to check against.
  // checks object to ensure all keys are present.
  // output: ok if validated, else response object identifying missing keys
  if(!(Array.isArray(rowOfKeys))) return 'ok';
  if(rowOfKeys.length <= 0) return 'ok';
  const isPresent = type === 'new' ?
    validateObjectKeysPresent(object, rowOfKeys) :
    'ok';
  if (isPresent !== 'ok' && type === 'new') {
    return isPresent; 
  } else {
    return 'ok';
  }
};

const limitObjectKeys = (object, limitingKeys) => {
  if(!isObjectLiteral(object)) return {};
  if(!Array.isArray(limitingKeys)) return object;
  const limitedObject = {};
  for(let key in object){
    if(limitingKeys.includes(key)){
      limitedObject[key] = object[key];
    }
  }
  return limitedObject;
};

// @@@@@@@@@@@@@@@ ARRAYS @@@@@@@@@@@@@@@@

const totalAndAverageArrays = (compoundArray, precision=4) => {
  // input: array of arrays of numbers
  // output: { totaled: single array of numbers (sum), averaged: single array of numbers (average)
  // no reinforcement of array length
  let validated = true;
  const errors = [];
  if(!Array.isArray(compoundArray)) {
    validated = false;
    errors.push('input is not an array');
  }
  if(validated){
    compoundArray.forEach(subArray=>{
      if(!Array.isArray(subArray)){
        validated = false;
        errors.push('input is not a compound array');
        return {totaled: [], averaged: [], errors };
      }
    });
  }
  if(!validated) return {totaled: [], averaged: [], errors };

  const totalsArray = [];
  compoundArray.forEach((subArray,j)=>{
    subArray.forEach((num, i)=>{
      // if not a primitive number, ignore it, but log the error
      if(!isPrimitiveNumber(num)){
        errors.push(`error at array ${j}:${i}`);
      } else if(totalsArray[i]){
        totalsArray[i] += num ;
      } else {
        totalsArray[i]  = num ;        
      }
    });
  });
  const averagesArray = totalsArray.map(num=>{
    return precisionRound(num/compoundArray.length, precision);
  });
  return {
    totaled: totalsArray,
    averaged: averagesArray,
    errors,
  };
};

const deltaArray = (array1, array2) => {
  // input: two arrays of numbers
  // output: new array containing the difference between the two numbers
  // array length is reinforced
  let validated = true;
  if(!Array.isArray(array1)) validated = false;
  if(!Array.isArray(array2)) validated = false;
  if(validated === true){
    if(array1.length !== array2.length) validated = false;
  }
  if(!validated) return [];

  const arrayOfDeltas = array1.map((num, i)=>{
    const delta = isNaN(num - array2[i]) ? null :
      precisionRound(num - array2[i], 4);
    return delta;
  });

  return arrayOfDeltas;
};

const immutableArrayInsert = (index, array, itemToUpdate) => {
  // input: index: integer to replace in array.
  // input: array: existing array to edit
  // input: itemToUpdate: what to put into the array: can be any data type
  // output: new array with item added (prepended, appended, replaced, based on index)
  // invalid index defaults to prepend
  if(!Array.isArray(array)) return [];
  if(itemToUpdate  === undefined) return array;
  if (index === null || index === undefined || isNaN(index)) {
    return [itemToUpdate, ...array];
  }
  if (index <= 0){
    const remainder = array.slice(1,array.length);
    const newArray = [itemToUpdate, ...remainder];
    return newArray;
  }
  if (index >= array.length -1){
    const remainder = array.slice(0,array.length-1);
    const newArray =  [...remainder, itemToUpdate];
    return newArray;
  }
  const remainderFront = array.slice(0,index);
  const remainderBack = array.slice(index+1,array.length);
  const newArray = [...remainderFront, itemToUpdate, ...remainderBack];
  return newArray;
};

const immutableArraySplice = (index, array) => {
  // input: index: integer to delete from array.
  // input: array: existing array to edit
  // output: new array with item removed
  // invalid index does nothing
  if(!Array.isArray(array)) return [];
  if(isNaN(index)||index<0) return array;
  if (index > array.length -1) return array;
  // console.log('index',index, 'validated')
  if (index === 0){
    // console.log('index',index, '0')
    return array.slice(1,array.length);
  }
  if (index === array.length -1){
    // console.log('index',index, 'end')
    return array.slice(0,array.length-1);
  }
  // console.log('index',index, 'middle')
  const remainderFront = array.slice(0, index);
  const remainderBack = array.slice(index+1, array.length);
  const newArray = [...remainderFront, ...remainderBack];
  // console.log('newArray',newArray)

  return newArray;
};

module.exports = { 
  precisionRound, 
  isPrimitiveNumber, 
  isObjectLiteral,
  convertScToCc,
  convertCcToSc,
  convertObjectKeyCase, 
  totalAndAverageArrays,
  deltaArray,
  shiftObjectKeysColumn,
  shiftArrayKeysColumn,
  getKeyArray, 
  titleCaseWord, 
  validateObjectKeys,
  validateObjectKeysPresent,
  limitObjectKeys,
  immutableArrayInsert,
  immutableArraySplice,
};