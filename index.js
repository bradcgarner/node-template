'use strict';

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
// mongoose only
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// knex
const createKnex = require('knex');

const {DATABASE_URL, PORT, CLIENT_ORIGIN} = require('./config');

const app = express();

const { router: userRouter } = require('./users');
const { router: authRouter, basicStrategy, jwtStrategy } = require('./auth');
const passport = require('passport');
passport.use(basicStrategy);
passport.use(jwtStrategy);

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

// to prevent CORS issues, particularly with React and Heroku. Might be able to delete with Netlify. Look into security issues.
app.use((req,res,next)=>{
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, PUT');
  res.header('Access-Control-Request-Headers');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// option below is to serve up html from the server, vs client
app.use(express.static('public'));
// line below is explicit, but shouldn't be needed
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.use('/api/users', userRouter);
app.use('/api/auth/', authRouter);app.use('/api/auth/', authRouter);
app.use('*', (req, res) => {
  return res.status(404).json({ message: 'Not Found' });
});

let server; // declare `server` here, then runServer assigns a value.
let knex = null;

// MONGO !!!!!
function dbConnect(url = DATABASE_URL) {
  return mongoose.connect(url, {useMongoClient: true})
    .catch(err => {
      console.error('Mongoose failed to connect');
      console.error(err);
    });
}

// POSTGRES !!!!!
// function dbConnect(url = DATABASE_URL) {
//   knex = createKnex({
//     client: 'pg',
//     connection: url
//   });
// }

function runServer(port=PORT) {
  return new Promise((resolve, reject) => {
    server = app
      .listen(port, () => { // always
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect(); // only if mongoose
        console.error('Express failed to start');
        reject(err);
      });
  });
}

// close the server, and return a promise. we'll handle the promise in integration tests.
// MONGO !!!!!
function closeServer() {
  return mongoose.disconnect()
    .then(() => { // mongoose only. why no error catch here?
      return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    });
}

// POSTGRES !!!!!
// function closeServer() {
//   return knex.destroy();
// }

// if called directly, vs 'required as module'
if (require.main === module) { // i.e. if server.js is called directly (so indirect calls, such as testing, don't run this)
  dbConnect();
  runServer().catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};
