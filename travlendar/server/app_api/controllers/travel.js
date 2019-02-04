'use strict';

const mongoose = require('mongoose');
const Travlendar = mongoose.model('Travlendar');
const crypto = require('../../utils/encryptor');
const util = require('../../utils/utils');
const auth = require('../../app_server/controllers/gAuth');
const gEvent = require('../../app_server/controllers/gEvents');
const currUser = require('./users');

// Read Travlendar Calendar for all Events
module.exports.getTravelEvents =  function (req, res) {
  console.log('travel REST GET - LINE 15');
  Travlendar
    .findById(req.params.userid)
    .select('+travelEvents')
    .exec(function (err, user) {
      if (err) return util.sendJsonResponse(res, 404, err);

      if (!user) {
        return util.sendJsonResponse(res, 404, {
          'message': 'user not found'
        });
      }

      if (!user.travelEvents) {
        return util.sendJsonResponse(res, 404, {
          'message': 'user does not have any events to show'
        });
      }

      if (user.travelEvents && user.travelEvents.length > 0) {
        let travelList = [];
        user.travelEvents.forEach(function (item) {
          // removing expired items
          if (item.travelEndTime.getTime() >= Date.now()) {
            travelList.push({
              _id: item._id,
              travelMode: item.travelMode,
              travelTimeEstimate: item.travelTimeEstimate,
              travelStartTime: item.travelStartTime,
              travelEndTime: item.travelEndTime,
              travelStartLocationCord: item.travelStartLocationCord,
              travelEndLocationCord: item.travelEndLocationCord,
              event_id: item.event_id
            });
          }
        });
        console.log('Creeping and creeping - LINE 49: ' + travelList.length);
        return util.sendJsonResponse(res, 200, {'message': {travel: travelList}});
      } else {
        return util.sendJsonResponse(res, 200, {'message': {travel: []}});
      }
    });
};

module.exports.getTravelEvent =  function (req, res) {
  console.log('travel REST GET ONE - LINE 55');
  Travlendar
    .findById(req.params.userid)
    .select('+travelEvents')
    .exec(function (err, user) {
      util.debugConsole(err);
      util.debugConsole(user);

      if (err) return util.sendJsonResponse(res, 404, err);

      if (!user) return util.sendJsonResponse(res, 404, {'message': 'user not found'});

      if (!user.travelEvents) return util.sendJsonResponse(res, 404, {'message': 'user does not have any Events to pull'});


      if (user.travelEvents && user.travelEvents.length > 0) {
        let item = user.travelEvents.id(req.params.travelid);
        if (item._id) {
          let travelEvent = {
            _id: item._id,
            travelMode: item.travelMode,
            travelTimeEstimate: item.travelTimeEstimate,
            travelStartTime: item.travelStartTime,
            travelEndTime: item.travelEndTime,
            travelStartLocationCord: item.travelStartLocationCord,
            travelEndLocationCord: item.travelEndLocationCord,
            event_id: item.event_id
          };
          return util.sendJsonResponse(res, 200, {'message': {travel: travelEvent}});
        } else {
          return util.sendJsonResponse(res, 200, {'message': {travel: null}});
        }
      } else {
        return util.sendJsonResponse(res, 200, {'message': {travel: null}});
      }
    });
};

// Delete Travlendar Event from Calendar
module.exports.deleteTravelEvent =  function (req, res) {
  console.log('travel REST DELETE - LINE 95');
  Travlendar
    .findById(req.params.userid)
    .select('+travelEvents +calendar +credentials')
    .exec(function (err, user) {
      if (err) return util.sendJsonResponse(res, 404, err);

      if (!user) return util.sendJsonResponse(res, 404, {'message': 'user not found'});

      if (!user.travelEvents) return util.sendJsonResponse(res, 404, {'message': 'user does not have any Events to delete'});

      if (user.travelEvents && user.travelEvents.length > 0) {
        let travelEvent = user.travelEvents.id(req.params.eventid);

        if (!travelEvent) return util.sendJsonResponse(res, 200, {'message': 'no such event to remove'});

        crypto.letsDecrypt(user.credentials, function(err, cred) {
          if (err) return util.sendJsonResponse(res, 404, err);

          cred = JSON.parse(cred);
          auth.oauth2Client.setCredentials(cred);

          //No need to send refresh token, current token is still valid
          if ((Date.now() - cred.expiry_date) < 0) {
            delete auth.oauth2Client.credentials.refresh_token;
          }

          let params = {
            userId: 'me',
            auth: auth.oauth2Client,
            calendarId: user.calendar.gCal_id,
            eventId: travelEvent.gEvent_id
          };

          gEvent.deleteCalEvent(params, function (err, code) {
            if (err) return util.sendJsonResponse(res, 404, err);

            // New token received, we need to save it to the user's datastore
            if (auth.oauth2Client.credentials.id_token) {
              let tokens = auth.oauth2Client.credentials;
              delete tokens.id_token;
              tokens.refresh_token = cred.refresh_token;

              crypto.letsEncrypt(JSON.stringify(tokens), function (err, value) {
                if (err) return util.sendJsonResponse(res, 409, err);

                currUser.updateGoogleCredentials(req.params.userid, value, function (err, isSaved) {
                  util.debugConsole('app_api/controller/events.js -> createTravlendarEvent'.toUpperCase());
                  util.debugConsole(`Saved credentials: ${isSaved !== null}`);
                });
              });
            }

            user.travelEvents.id(req.params.eventid).remove();
            user.save (function (err) {
              if (err) return util.sendJsonResponse(res, 404, err);
              return util.sendJsonResponse(res, 204, null);
            });
          });
        });
      }
    });
};
