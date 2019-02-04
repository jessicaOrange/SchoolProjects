'use strict';

const mongoose = require('mongoose');
const Travlendar = mongoose.model('Travlendar');
const crypto = require('../../utils/encryptor');
const util = require('../../utils/utils');
const auth = require('../../app_server/controllers/gAuth');
const gCal = require('../../app_server/controllers/gCalendar');
const currUser = require('./users');
const clones = require('./clones');

// DELETE user settings from the database
module.exports.deleteUserSettings = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+settings')
    .exec(function (err, user) {
        if (err) {
          return util.sendJsonResponse(res, 400, err);
        }

        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'userid not found'
          });
        }

        if (!user.settings) {
          return util.sendJsonResponse(res, 404, {
            'message': 'user has no settings to delete'
          });
        }

        user.settings.remove();

        // writing changes to the database
        user.save (function (err, user) {
          if (err) {
            return util.sendJsonResponse(res, 404, err);
          } else {
            return util.sendJsonResponse(res, 204, null);
          }
        });
      }
    );
};

// READ and retrieve user settings from the database
module.exports.getUserSettings = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+settings +credentials')
    .exec(function (err, user) {
        if (err) return util.sendJsonResponse(res, 404, '');

        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'user not found'
          });
        }

        crypto.letsDecrypt(user.credentials, function(err, cred) {
          if (err) {
            if (!user.settings) {
              return util.sendJsonResponse(res, 404, {
                "message": "user has no settings defined"
              });
              return util.sendJsonResponse(res, 404, err);
            }
          }

          cred = JSON.parse(cred);
          auth.oauth2Client.setCredentials(cred);

          //No need to send refresh token, current token is still valid
          if ((Date.now() - cred.expiry_date) < 0) {
            delete auth.oauth2Client.credentials.refresh_token;
          }

          let params = { userId: 'me', auth: auth.oauth2Client };

          gCal.listCalenders(params, function (err, cals) {
            if (err) return util.sendJsonResponse(res, 404, err);

            // New token received, we need to save it to the user's datastore
            if (auth.oauth2Client.credentials.id_token) {
              util.saveCredentials(req.params.userid, auth.oauth2Client.credentials, cred, res);
            }

            let calendars = [];
            for (let i = 0; i < cals.items.length; i++) {
              calendars.push({
                "gCal_id" : cals.items[i].id,
                "gCal_summary": cals.items[i].summary
              });

              if (i + 1 === cals.items.length) {
                return util.sendJsonResponse(res, 200, {'message' : {
                    'settings': user.settings ? user.settings : null,
                    'gCalendars': calendars
                  }
                });
              }
            }
          });
        });
      }
    );
};

// CREATE and add user settings to the database
module.exports.createUserSettings = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+authorization +events')
    .exec(function (err, user) {
        if (err) {
          return util.sendJsonResponse(res, 400, err);
        }

        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'userid not found'
          });
        }

        user.settings = {};
        saveSettings(req, res, user);
      }
    );
};

// PUT and update user settings in the database
module.exports.updateUserSettings = function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+settings +authorization +events')
    .exec(function (err, user) {
        if (err) {
          return util.sendJsonResponse(res, 400, err);
        }

        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'userid not found'
          });
        }

        if (!user.settings) {
          return util.sendJsonResponse(res, 404, {
            'message': 'user has no settings to update'
          });
        }

        saveSettings(req, res, user);
      }
    );
};

var saveSettings = function (req, res, user) {
  const resCode = req.method.toUpperCase() === 'POST' ? 201 : 200;
  let diffOfClones = diffCloneArray(user.settings.cloneCalendar, req.body.cloneCalendar);

  if (req.body.defaultCalView) user.settings.defaultCalView = req.body.defaultCalView;
  if (req.body.modeOfTravel) user.settings.modeOfTravel = req.body.modeOfTravel;
  if (req.body.startAddress) user.settings.startAddress = req.body.startAddress;
  if (req.body.cloneCalendar) user.settings.cloneCalendar = req.body.cloneCalendar;
  if (req.body.startAddress.lat && req.body.startAddress.lon)  {
    user.settings.addressCoord = [req.body.startAddress.lon, req.body.startAddress.lat];
  }
  user.settings.preferredTransitModes = req.body.preferredTransitModes;

  // writing changes to the database
  user.save (function (err, user) {
    if (err) return util.sendJsonResponse(res, 404, err);

    util.sendJsonResponse(res, resCode, {
      'message': user.settings
    });

    clones.calendarsToClone(user._id, diffOfClones);
  });
};

var diffCloneArray = function (oldCloneList, newCloneList) {
  let diffOfClones = [];
  let isFound = null;
  for (let i = 0; i < oldCloneList.length; i++) {
    isFound = false;
    for (let x = 0; x < newCloneList.length; x++) {
      if (oldCloneList[i].gCal_id.toString() === newCloneList[x].gCal_id.toString()) {
        isFound = true;
        break;
      }
    }

    if (!isFound) {
      diffOfClones.push(oldCloneList[i]);
    }
  }
  return diffOfClones;
}
