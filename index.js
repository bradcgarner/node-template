'use strict';

const { PORT, CLIENT_ORIGIN, DATABASE_URL_MONGO } = require('./config');

const express  = require('express');
const morgan   = require('morgan');
const cors     = require('cors');
const mongoose = require('mongoose');
const logger   = require('./comm/logger').createLogger(''); // logs to console if no filename
const app      = express();

const { router: authRouter       } = require('./routers/auth');
const { router: userRouter       } = require('./routers/users');

mongoose.Promise = global.Promise;

// master toggle to disable schedules is set as env variable
if(process.env.ENABLE_SCHEDULES === 'true') { // string 'true' is correct
  require('./schedules/sample');
}

app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
    skip: (req, res) => process.env.NODE_ENV === 'test'
  })
);

app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

app.use('/api/auth' ,      authRouter);
app.use('/api/users',      userRouter);
app.use(express.static('views'));
app.use(express.static('files'));
app.get('/images/:filename', (req, res) => {
  res.sendFile(__dirname + `/views/static/images/${req.params.filename}`);
});
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});
app.use('*', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
  // return res.status(404).json({ message: 'Not Found' });
});

let server; // declare `server` here, then runServer assigns a value.

function runServer(port=PORT, url = DATABASE_URL_MONGO) {
  const mongoSettings = {
    useMongoClient: true, 
    reconnectTries: Number.MAX_VALUE, // sets how many times to try reconnecting
    reconnectInterval: 1000 // sets the delay between every retry (milliseconds)
  };
  return new Promise((resolve, reject) => {
    mongoose.connect(url, mongoSettings, err => {
      if (err) {
        logger.error(`Mongoose failed to connect: ${err}`);
        return reject(err);
      }
      server = app
        .listen(port, () => { // always
          const now = new Date();
          logger.info(`As of ${now}, your app is listening on port ${port}. Mode: ${process.env.NODE_ENV}. Database: ${process.env.DB_MODE}`);
          resolve();
        })
        .on('error', err => {
          logger.error(`Express failed to start ${err}`);
        });
    });
  });
}

function closeMongoServer() {
  return mongoose.disconnect()
    .then(() => {
      return new Promise((resolve, reject) => {
        logger.info('Closing server');
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
}

// if called directly, vs 'required as module'
if (require.main === module) { // i.e. if server.js is called directly (so indirect calls, such as testing, don't run this)
  runServer().catch(err => logger.error(err));
}

module.exports = { app, runServer, closeMongoServer };
