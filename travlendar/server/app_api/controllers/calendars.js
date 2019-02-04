'use strict';

const mongoose = require('mongoose');
const Travlendar = mongoose.model('Travlendar');
const crypto = require('../../utils/encryptor');
const util = require('../../utils/utils');
const auth = require('../../app_server/controllers/gAuth');
const gCal = require('../../app_server/controllers/gCalendar');
const io = require('../../app').io;
const clients = require('../../app').clients;

const MODE = require("../../app").environment;

// Read Travlendar Calendar information for a specific user
module.exports.getTravlendarCalendarInfo = function (req, res) {

  // connectSocket();
  Travlendar
    .findById(req.params.userid)
    .select('+calendar +settings')
    .exec(function (err, user) {
      if (err) return util.sendJsonResponse(res, 404, err);
      if (!user) {
        return util.sendJsonResponse(res, 404, {'message': 'user not found'});
      }

      if (!user.calendar) {
        return util.sendJsonResponse(res, 404, {
          'message': 'user does not have a Travlendar Calendar setup'
        });

        return util.sendJsonResponse(res, 200, {'message': user});
      }

      return util.sendJsonResponse(res, 200, {'message': user});
    });
};

// Create new Travlendar Calendar for user
module.exports.createTravlendarCalendar = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+credentials +settings +calendar +calendar.gWatch')
    .exec(function (err, user) {
        if (err) {
          return util.sendJsonResponse(res, 400, err);
        }

        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'userid not found'
          });
        }

        crypto.letsDecrypt(user.credentials, function(err, cred) {
          if (err) return util.sendJsonResponse(res, 404, err);

          cred = JSON.parse(cred);
          auth.oauth2Client.setCredentials(cred);

          //No need to send refresh token, current token is still valid
          if ((Date.now() - cred.expiry_date) < 0) {
            delete auth.oauth2Client.credentials.refresh_token;
          }

          let params = { userId: 'me', auth: auth.oauth2Client };
          console.log('Calendar checking - line 67: '.toUpperCase() + req.body);

          // Getting list of calendars to check if Travlendar Calendar already exists
          gCal.listCalenders(params, function (err, cals) {
            if (err) return util.sendJsonResponse(res, 404, err);

            if (auth.oauth2Client.credentials.id_token) {
              util.saveCredentials(req.params.userid, auth.oauth2Client.credentials, cred, res);
            }

            let isFound = false;
            let calendar = {};

            for (let i = 0; i < cals.items.length; i++) {
              if (cals.items[i].description && cals.items[i].description.includes('TRAVLENDAR-CALENDAR-')) {
                let inHashKey = /TRAVLENDAR-CALENDAR-(.{16})/.exec(cals.items[i].description);
                if(MODE == "prod" && (inHashKey != null && user.calendar && (inHashKey[0] === user.calendar.gCal_key))) {
                  isFound = true;
                  calendar.gCal_id = cals.items[i].id;
                  calendar.gCal_summary = cals.items[i].summary;
                  break;
                } else {
                  util.debugConsole('Error: Found a calendar, but hash key does not match db');
                }
              }
            };

            // Travlendar Calendar exists, else add it to Google Calendar
            if (isFound) {
              // Save the calendar to Travlendar now
              user.calendar = calendar;
              saveCalendarChanges(user, function (err, isSaved) {
                if (err) return util.sendJsonResponse(res, 409, err);
                if (user.settings) calendar.defaultCalView = user.settings.defaultCalView;
                return util.sendJsonResponse(res, 201, {'message': {calendar: calendar}});
              });
            } else {
              params.resource = req.body;

              gCal.addTravlendarCalendar (params, function (err, travlendar) {
                console.log('Adding Calendar - line 107'.toUpperCase());
                console.log(err);
                console.log(travlendar);

                if (err) return util.sendJsonResponse(res, 404, err);

                // Save the calendar to Travlendar now
                user.calendar = {
                  gCal_id: travlendar.id,
                  gCal_summary: travlendar.summary,
                  gCal_key: req.body.key
                };

                saveCalendarChanges(user, function (err, isSaved) {
                  if (err) util.sendJsonResponse(res, 409, err);
                  util.sendJsonResponse(res, 201, {'message': user});
                });

                // start watching for events here
                if (MODE ==='prod' && !user.calendar.gWatch) {
                  const noti = require('./notification');
                  return noti.createNotification (user, params, function (err, saved) {
                    util.debugConsole('Watch started: ' + (err == null));
                  });
                }
              });
            }
          });
        });
      }
    );
};

// Update calendar information for a specific user
module.exports.updateTravlendarCalendar = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+calendar +settings')
    .exec(function (err, user) {
        if (err) return util.sendJsonResponse(res, 400, err);

        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'userid not found'
          });
        }

        if (!user.calendar) {
          return util.sendJsonResponse(res, 404, {
            'message': 'user has no Travlendar Calendar to update'
          });
        }

        saveCalendarChanges(user, function (err, isSaved) {
          if (err) return util.sendJsonResponse(res, 409, err);
          return util.sendJsonResponse(res, 200, {'message': user});
        });
      }
    );
};

// Delete Travlendar calendar indromation for a specific user
module.exports.deleteTravlendarCalendar = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+calendar')
    .exec(function (err, user) {
        if (err) return util.sendJsonResponse(res, 400, err);

        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'userid not found'
          });
        }

        if (!user.calendar) {
          return util.sendJsonResponse(res, 404, {
            'message': 'user has no Travlendar Calendar to delete'
          });
        }

        user.calendar.remove();
        saveCalendarChanges(user, function (err, isSaved) {
          if (err) return util.sendJsonResponse(res, 404, err);
          return util.sendJsonResponse(res, 204, null);
        });
      }
    );
};

module.exports.saveWatchToCalendar = function (user, callback) {
  // writing changes to the database
  return saveCalendarChanges(user, function (err, isSaved) {
    if (err) return callback(false);
    util.debugConsole('Calendar Watch is saved'.toUpperCase());
    return callback(null, true);
  });
};

var saveCalendarChanges = function (user, callback) {
  // writing changes to the database
  user.save (function (err, user) {
    if (err) return callback (err);
    return callback (null, true);
  });
};

var connectSocket = function () {
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
      console.log('Added client - line 222: ' + socket.id);
      clients.push({'uid': uid, 'sid': socket.id});
    }
  });
};