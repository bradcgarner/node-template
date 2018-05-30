'use strict';

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const ErrSchema = mongoose.Schema({
  err: { type: String },
  timestampCreated: { type: String },
});

const Err = mongoose.models.Err || mongoose.model('Err', ErrSchema);

module.exports = { Err };