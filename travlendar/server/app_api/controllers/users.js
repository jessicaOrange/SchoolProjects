'use strict';

const mongoose = require('mongoose');
const Travlendar = mongoose.model('Travlendar');
const util = require('../../utils/utils');
const authToken = require ('../../app_server/controllers/authorization');
const MODE = require('../../app').environment;
const clients = require('../../app').clients;

module.exports.isCurrentUser = function (g_username, callback) {
  Travlendar.findOne({g_username}, 'termsOfService', function (err, user) {
    if (err) return callback (err);

    if (!user) return callback (null, null);

    // Create new authorization for user
    authToken.newAuthorizationToken(user._id, function (err, auth) {
      if (err) return callback (err);

      // Save the new authorization token
      if (auth) {
        Travlendar
          .findById(user._id)
          .select('-__v +termsOfService +g_username +authorization +settings +calendar +calendar.gWatch')
          .exec(function (err, user) {
            let currUser = JSON.parse(JSON.stringify(user));
            if (currUser.settings) {
              currUser['hasSettings'] = true;
              delete currUser.settings;
            }

            delete currUser.calendar;
            util.debugConsole("Yes settings is included: ".toUpperCase() + currUser.hasSettings);
            callback (err, currUser);
            if (MODE ==='prod' && (user.calendar && (!user.calendar.gWatch ||
                (+user.calendar.gWatch.expiration < Date.now())))) {
              const noti = require('../../app_api/controllers/notification');
              noti.createNotification (user, params, function (err, saved) {
                util.debugConsole('Watch started: ' + (err == null));
              });
            }
            return;
          });
      }
    });
  });
}

// Read information for a specific user
module.exports.getUserName = function (userid, callback) {
  if (!userid) {
    return callback({'message': 'no userid present'}, null);
  }

  Travlendar
    .findById(userid)
    .select('username')
    .exec(function (err, userInfo) {
      if (err) {
        return callback(err, null);
      }

      if (!userInfo) {
        err =  {'message': 'no user found'};
      }

      return callback(err, userInfo.username);
    });
};

// Read information for a specific user
module.exports.getUserToken = function (userid, callback) {
  if (!userid) {
    return callback({'message': 'no userid present'}, null);
  }

  Travlendar
    .findById(userid)
    .select('+authorization')
    .exec(function (err, userInfo) {
      if (err) {
        return callback(err, null);
      }

      if (!userInfo) {
        err =  {'message': 'no user found'};
      }

      return callback(err, userInfo.authorization);
    });
};

// Update information for a specific user
module.exports.saveUserToken = function (userid, access_token, callback) {
  Travlendar
    .findById(userid)
    .exec(function (err, user) {
        if (err) return callback (err);

        if (!user) return callback ({'message': 'userid not found'});

        user.authorization = {
          'token': access_token.access_token,
          'expiry_time': access_token.expiry_time
        };

        // writing changes to the database
        user.save(function (err, userInfo) {
          util.debugConsole('app_api/controller/user.js -> saveUserToken'.toUpperCase());
          util.debugConsole('Authorization Saved');
          util.debugConsole(err);
          util.debugConsole(userInfo.authorization);
          if (err) callback (err);
          return callback (null, userInfo);
        });
      }
    );
};

// Update information for a specific user
module.exports.updateGoogleCredentials = function (userid, gCred, callback) {
  Travlendar
    .findById(userid)
    .select('+credentials')
    .exec(function (err, user) {
        if (err) return callback (err);
        if (!user) return callback ({'message': 'userid not found'});

        user.credentials = gCred;
        // writing changes to the database
        user.save(function (err, userInfo) {
          if (err) return callback (err);
          return callback (null, userInfo.credentials);
        });
      }
    );
};

// Check if user exists in Travlendar
module.exports.checkIfUserExist = function (req, res) {
  if (!req.query && !req.query.g_username) {
    return util.sendJsonResponse(res, 404, {
      'message': 'no google username supplied in the request'
    });
  }

  if (req.query && req.query.g_username) {
    Travlendar.findOne({ g_username: req.query.g_username }, 'deletedUser termsOfService', function (err, user) {
      if (err) {
        return util.sendJsonResponse(res, 400, err);
      }

      if (user != undefined &&
        typeof (user.deletedUser) != undefined &&
        !user.deletedUser) {
        return util.sendJsonResponse(res, 200, {
          'message': true
        });
      }
      return util.sendJsonResponse(res, 200, {
        'message': false
      });
    });
  }
};

// Read information for a specific user
module.exports.getUserInfo = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('-__v +termsOfService +credentials +authorization +calendar')
    .exec(function (err, userInfo) {

      util.debugConsole('app_api/controller/user.js -> getUserInfo'.toUpperCase());
      util.debugConsole('Authorization Retrieved');
      util.debugConsole(err);
      util.debugConsole(userInfo.authorization);
      if (err) return util.sendJsonResponse(res, 404, err);

      if (!userInfo) return util.sendJsonResponse(res, 404, {'message': 'user not found'});

      return util.sendJsonResponse(res, 200, {'message': userInfo});
    });
};

// Create new Travlendar user
module.exports.createUser = function (req, res) {
  if (!req.body) {
    return util.sendJsonResponse(res, 404, {
      'message': 'payload to create is required'
    });
  }

  Travlendar.create({
    username: req.body.username,
    name: req.body.name,
    termsOfService: req.body.termsOfService,
    termsOfServiceDate: Date.now(),
    g_username: req.body.g_username,
    credentials: (req.body.credentials ? req.body.credentials : null)
  }, function (err, user) {
    if (err) return util.sendJsonResponse(res, 409, err);

    // Create new authorization for user
    authToken.newAuthorizationToken(user._id, function (err, auth) {
      if (err) return util.sendJsonResponse(res, 409, err);
      // Save the new authorization token
      if (auth) {
        Travlendar
          .findById(user._id)
          .select('-__v +termsOfService +g_username +authorization')
          .exec(function (err, user) {
            util.debugConsole('app_api/controller/user.js -> createUser'.toUpperCase());
            util.debugConsole('Authorization Created');
            util.debugConsole(err);
            util.debugConsole(user);
            if (err) return util.sendJsonResponse(res, 409, err);

            return util.sendJsonResponse(res, 201, {'message': user});
          });
      }
    });
  });
};

// Update information for a specific user
module.exports.updateUser = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .exec(function (err, user) {
        if (err) {
          return util.sendJsonResponse(res, 400, err);
        }
        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'userid not found'
          });
        }
        if (req.body.username) user.username = req.body.username;
        if (req.body.name) user.name = req.body.name;
        // If tos needs to be updated
        if (req.body.termsOfService) {
          user.termsOfService = req.body.termsOfService;
          user.termsOfServiceDate = Date.now();
        }
        // writing changes to the database
        user.save(function (err, user) {
          if (err) {
            return util.sendJsonResponse(res, 404, err);
          } else {
            return util.sendJsonResponse(res, 200, {'message': user});
          }
        });
      }
    );
};

// Deleting specific user from Travlendar
module.exports.deleteUser = function (req, res) {
  Travlendar
    .findByIdAndRemove(req.params.userid)
    .exec(function (err, user) {
        if (err) {
          return util.sendJsonResponse(res, 400, err);
        }
        return util.sendJsonResponse(res, 204, null);
      }
    );
};

// remove authorization token from User
module.exports.logoutUser = function (req, callback) {
  Travlendar
    .findByIdAndUpdate(req.body.userid, {$unset: {authorization: 1}})
    .exec(function (err, user) {
      if (err) return callback(err);
      for (let i = 0; i < clients.length; i++) {
        if (user._id.toString() === clients[i].uid.toString()) {
          util.debugConsole('Removed from clients: ' + clients[i].sid);
          clients.splice(i, 1);
          break;
        }
      }
      return callback (null, {"message" : true});
    });
}