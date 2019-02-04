'use strict';

const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const clients = [];
const MODE = (process.env.NODE_ENV === 'prod' ? 'prod' : 'dev');
module.exports = {'environment' : MODE, 'io': io, 'clients': clients};

require ('./app_api/models/db');

const routesApi = require('./app_api/routes/index');
const routesAuth = require('./app_server/routes/index');

io.on('connection', function (socket) {
  let uid = socket.request._query['uid'];
  let isFound = false;

  for (let i = 0; i < clients.length; i++) {
    if (clients[i].uid.toString() === uid.toString()) {
      isFound = true;
      break;
    }
  }

  if (!isFound) {
    console.log('Added client - line 32: ' + socket.id);
    clients.push({'uid': uid, 'sid': socket.id});
  }
});

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.disable('x-powered-by');

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Expose-Headers", "Authorization");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Authorization, Accept");

  next();
});

app.use('/api', routesApi);                            // Handling APIs
app.use('/oauth', routesAuth);                         // Handling Authentication

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.end();
  //res.render('error');
});

module.exports = {app: app, server: server};