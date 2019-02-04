'use strict';

const MODE = require('../../app').environment;
const util = require('../../utils/utils');
const clients = require('../../app').clients;

var mongoose = require('mongoose');
var dbURI = (MODE === 'prod') ? 'mongodb://localhost/Travlendar' : 'mongodb://localhost/Travlendar-test';
var gracefulShutdown;

/**
 * Communication between the database and api
 */

mongoose.connect(dbURI, {
	useMongoClient: true
});

mongoose.connection.on('connected', function () {
  util.debugConsole('app_api/models/db.js -> connected'.toUpperCase());
  util.debugConsole('Mongoose connected to ' + dbURI);
});

mongoose.connection.on('error', function (err) {
  util.debugConsole('app_api/models/db.js -> error'.toUpperCase());
  util.debugConsole('Mongoose connection err: ' + err);
});

mongoose.connection.on('disconnected', function () {
  util.debugConsole('app_api/models/db.js -> disconnected'.toUpperCase());
  util.debugConsole('Mongoose connected');
});

gracefulShutdown = function (msg, callback) {
	mongoose.connection.close(function () {
    util.debugConsole('app_api/models/db.js -> gracefulShutdown'.toUpperCase());
    util.debugConsole('Mongoose disconnected through ' + msg);
		callback();
	});
};

// For nodemon restarts
process.once('SIGUSR2', function () {
  disconnectSockets(function () {
    gracefulShutdown('nodemon restart', function () {
      process.kill(process.pid, 'SIGUSR2');
    });
  });
});

// For app termination
process.on('SIGINT', function () {
  disconnectSockets(function () {
    gracefulShutdown('nodemon termination', function () {
      process.exit(0);
    });
  });
});

var disconnectSockets = function (callback) {
  util.debugConsole(`Clearing ${clients.length} from socket - line 62`.toUpperCase());
  clients.length = 0;
  return callback();
};

require('./travlendar_schema');
