'use strict';

const { emailSetup, notificationFile } = require('../config');
const logger =     require('../comm/logger').createLogger(notificationFile); // logs to a file
const nodemailer = require('nodemailer');
const { Err } =    require('../models/err');

const environment = process.env.DB_MODE === 'production' ? '' : process.env.DB_MODE.toUpperCase() ;

const successEmail = (to = 'greenroofdiagnostics@gmail.com', subject, message, key) => ({
  from: 'greenroofdiagnostics@gmail.com',
  to,
  subject: `${environment} ${subject}`,
  text: key === 'layering' ? message : `${key}: ${message}`,
});

const failureEmail = (subject, message, key) => ({
  from: 'greenroofdiagnostics@gmail.com',
  to: ['greenroofdiagnostics@gmail.com', 'brad@greenroofdiagnostics.com', 'brad@bradgarner.com'],
  subject: `${environment} ${subject}`,
  text: `${key}: ${message}`,
  headers: {
    'x-priority': '1',
    'x-msmail-priority': 'High',
    importance: 'high'
  }
});

const resetEmail = (to, tempPw) => ({
  from: 'greenroofdiagnostics@gmail.com',
  to,
  subject: 'Password Reset',
  text: `Your StormWatch password has been temporarily reset to ${tempPw}.`,
});

const transporter = nodemailer.createTransport(emailSetup);

const stopScheduleAndThrowError = error => {
  // function to allow detection of an error, holding it in a variable, then checking that variable later to throw an error when best for the program (i.e. we might want to do some work after we find the error, like document it)
  logger.info('start stopScheduleOnError with', error);
  if(error) throw(error);  
  logger.info('no error');
};

const confirmSuccess = (subject, message, dltable, to='greenroofdiagnostics@gmail.com') => {
  const recipients =
    to === 'layering' ? ['greenroofdiagnostics@gmail.com','brad@greenroofdiagnostics.com','laura@greenroofdiagnostics.com','oscar@greenroofdiagnostics.com'] : to ;
  logger.info(`success: ${dltable}`);
  const mailOptions = successEmail(
    recipients,
    subject, 
    JSON.stringify(message), 
    dltable
  );
  transporter.sendMail(mailOptions, (error, info)=>{
    if (error) logger.info(error); 
    else logger.info('Email sent: ' + info.response);
  });
  return;
};

const logError = (subject, err, dltable) => {
  return Err.create({ err: err }) // log error in Mongo
    .then(err=>{
      const mailOptions = failureEmail(
        subject, 
        JSON.stringify(err),
        dltable
      );
      transporter.sendMail(mailOptions, (error, info)=>{
        if (error) logger.info(error); 
        else logger.info('Email sent: ' + info.response);
      });
    })
    .catch(err=>logger.info(`We're out of options! Error: ${err} in saving error to Mongo!!!`));
};

const sendPwReset = (to='greenroofdiagnostics@gmail.com', tempPw) => {
  const recipients = [to, 'greenroofdiagnostics@gmail.com','brad@greenroofdiagnostics.com'] ;
  logger.info(`sending pw reset email: ${to}`);
  const mailOptions = resetEmail(
    recipients,
    tempPw
  );
  transporter.sendMail(mailOptions, (error, info)=>{
    if (error) logger.info(error); 
    else logger.info('Email sent: ' + info.response);
  });
  return;
};

module.exports = {
  transporter,
  stopScheduleAndThrowError,
  confirmSuccess,
  logError, 
  sendPwReset,
};