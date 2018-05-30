'use strict';
const logger = require('../comm/logger').createLogger();

const respondToError = (err, res) => {
  if(!err.message){
    logger.info('err', err); 
    res.status(500).json({message: `Internal server error: ${err}`});
  } else if(typeof err.message !== 'string') {
    res.status(500).json({message: `Internal server error: ${err.message}`});
  } else if(
    err.message.includes('incorrect') ||
    err.message.includes('invalid') 
  ){
    res.status(400).json({message: `Error: ${err.message}`});
  } else if(
    err.message.includes('not found')
  ){
    res.status(400).json({message: `Error: ${err.message}`});
  } else {
    res.status(500).json({message: `Internal server error: ${err.message}`});
  } 
  return;
};

module.exports = {
  respondToError
};