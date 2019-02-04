'use strict';

const mongoose = require('mongoose');
const Travlendar = mongoose.model('Travlendar');
const crypto = require('../../utils/encryptor');
const util = require('../../utils/utils');
const auth = require('../../app_server/controllers/gAuth');
const gEvent = require('../../app_server/controllers/gEvents');
const currUser = require('./users');
const eventController = require('./events');

const eventArr = require('../../utils/link_events');
const MODE = require("../../app").environment;
const io = require("../../app").io;
const clients = require("../../app").clients;

const EXPIRE = 60 * 60 * 24 * 1000;   // expiring watch notification in 24 hours
const RENEW = EXPIRE - (0.50 * 60 * 1000); //renew 30 seconds before it expires
const notificationAddress = (MODE === 'prod') ? 'https://travlendar.me/prod/api/notification' :
  'https://travlendar.me/notification';

const interval = [];
const me = this;
var cred = null;

// request to create new Google Watch channel for push notifications
module.exports.createNotification = function (user, params, callback = null) {
  params.calendarId = user.calendar.gCal_id;
  params['resource'] = {
    id: user._id + '-' + util.getRandomHash(5),
    type: 'web_hook',
    address: notificationAddress,
    params: {
      ttl: EXPIRE.toString()
    }
  }

  let nextSyncToken = (user.calendar.gWatch) ? user.calendar.gWatch.nextSyncToken : null;

  gEvent.watchCalEvents(params, function (err, watch) {
    if (err) return util.debugConsole('Watch Error Occured!!!'.toUpperCase());
    util.debugConsole(watch);

    user.calendar.gWatch = {
      channelId: watch.id,
      resourceId: watch.resourceId,
      expiration: watch.expiration,
      nextSyncToken: nextSyncToken
    }

    return saveWatchObject(user, function (err, isSaved) {
      if (err) return (null);

      checkExpiryInterval(user.calendar.gWatch.channelId);
      return callback ? callback(err, isSaved) : true;
    });
  });
}

// saving the gWatch object (channelId, resourceId, etc...)
module.exports.saveWatchToCalendar = function (user, callback) {
  return saveWatchObject(user, function (err, isSaved) {
    if (err) return callback(false);
    return callback(null, true);
  });
};

// Google returned some sync items
module.exports.notificationReturned = function (id) {
  Travlendar
    .findById(id)
    .select('+events +credentials +calendar +calendar.gWatch +authorization')
    .exec(function (err, user) {
      if (err || !user.credentials) return;

      crypto.letsDecrypt(user.credentials, function (err, creds) {
        if (err) return;

        cred = JSON.parse(creds);
        auth.oauth2Client.setCredentials(cred);

        if ((Date.now() - cred.expiry_date) < 0) {
          delete auth.oauth2Client.credentials.refresh_token;
        }

        let params = {
          userId: 'me',
          auth: auth.oauth2Client,
          calendarId: user.calendar.gCal_id,
          syncToken: user.calendar.gWatch.nextSyncToken
        };

        if (user.events.length === 0) {
          user.events = [];
        }

        return syncNewCalendarEvents(user, params);
      });
    });
}

// Sync Travlendar Calendar from Google and save new token
var syncNewCalendarEvents = function (user, params) {
  let temp = [];
  let pageToken = null;

  gEvent.listCalEvents(params, function (err, calEvents) {
    if (err) return;

    // New token received, we need to save it to the user's datastore
    if (auth.oauth2Client.credentials.id_token) {
      let tokens = auth.oauth2Client.credentials;
      delete tokens.id_token;
      tokens.refresh_token = cred.refresh_token;

      crypto.letsEncrypt(JSON.stringify(tokens), function (err, value) {
        if (err) return;

        currUser.updateGoogleCredentials(user._id, value, function (err, isSaved) {
          util.debugConsole('app_api/controller/notification.js -> syncNewCalendarEvents'.toUpperCase());
          util.debugConsole(`Saved credentials: ${isSaved !== null}`);
        });
      });
    }

    if (user.events.length === 0) {
      calEvents.items.forEach(function (item) {
        if (item.status !== 'cancelled') {
          temp = item.location ? item.location.split(', ') : [];
          user.events.push(addToList(item, temp));
        }
      });
    } else {
      let isFound = false, index, itemDate;

      calEvents.items.forEach(function (item) {
        temp = item.location ? item.location.split(', ') : [];
        itemDate = (item.end && item.end.date) ? item.end.date : item.end.dateTime;
        isFound = false;

        if (item.status !== 'cancelled' && (new Date(itemDate).getTime() >= Date.now())) {
          for (index = 0; index < user.events.length; index++) {
            if (item.id === user.events[index].gEvent_id) {
              user.events[index].eventSummary = item.summary;
              user.events[index].eventStart = item.start.date ? item.start.date : item.start.dateTime;
              user.events[index].eventEnd = item.end.date ? item.end.date : item.end.dateTime;
              user.events[index].eventEndLocation = {
                street: temp[0],
                city: temp[1] ? temp[1] : '',
                state: temp[2] ? temp[2].split(' ')[0] : '',
                zipcode: temp[2] ? temp[2].split(' ')[1] : ''
              };

              isFound = true;
              break;
            }
          }
          if (!isFound) user.events.push(addToList(item, temp));

        } else {
          for (let x = 0; x < user.events.length; x++) {
            if (item.id === user.events[x].gEvent_id) {
              user.events.splice(user.events[x], 1);
              break;
            }
          };
        }
      });
    }

    pageToken = calEvents.nextPageToken ? calEvents.nextPageToken : null;
    params.pageToken = pageToken;

    if (calEvents.nextSyncToken !== params.syncToken) {
      params.syncToken = calEvents.nextSyncToken;
      user.calendar.gWatch.nextSyncToken = calEvents.nextSyncToken;
    }

    if (pageToken != null) {
      syncNewCalendarEvents(user, params)
    }

    return saveWatchObject(user, function (err, isSaved) {
      util.debugConsole('Events completely synced: ' + (isSaved != null));
      if (user.authorization) {
        for (let x = 0; x < clients.length; x++) {
          if (clients[x].uid.toString() === user._id.toString()) {
            io.sockets.connected[clients[x].sid].emit('travlendar', {
              'message': 'notification', 'data' : eventController.getEvents(user)
            });
            break;
          }
        }
      }
    });
  });
}

// Set an interval to renew the notification
var checkExpiryInterval = function (channelId) {
  console.log(`settings interval for: ${channelId.split('-')[0]}`.toUpperCase());
  interval[channelId] = setInterval(function () {
    Travlendar
      .findById(channelId.split('-')[0])
      .select('+credentials +calendar +calendar.gWatch')
      .exec(function (err, user) {
        if (err || !user.credentials || !user.calendar) {
          return clearInterval(interval[channelId]);
        }

        crypto.letsDecrypt(user.credentials, function (err, creds) {
          if (err) return clearInterval(interval[channelId]);

          cred = JSON.parse(creds);
          auth.oauth2Client.setCredentials(cred);

          //No need to send refresh token, current token is still valid
          if ((Date.now() - cred.expiry_date) < 0) {
            delete auth.oauth2Client.credentials.refresh_token;
          }

          let params = {
            userId: 'me',
            auth: auth.oauth2Client
          };

          let old = {
            id: user.calendar.gWatch.channelId,
            resourceId: user.calendar.gWatch.resourceId
          }

          me.createNotification(user, params, function (err) {
            clearInterval(interval[channelId]);
            if (err) return;
            params.resource = old;
            gEvent.stopCalWatch(params);
          });
        });
      });
  }, RENEW);
};

// adding new item to the event list
var addToList = function (item, temp) {
  let isWarning = false;

  if (item.description.toString().trim().length === 0) {
    isWarning = true;
  }

  if (temp.length === 0 || temp[0].toString().trim().length === 0) {
    isWarning = true;
  }

  if (item.description.toString().trim().length === 0) {
    isWarning = true;
  }

  return {
    eventSummary: item.summary,
    eventStart: item.start.date ? convertAllDay(item.start.date) : item.start.dateTime,
    eventEnd: item.end.date ? convertAllDay(item.end.date) : item.end.dateTime,
    eventEndLocation: {
      street: temp[0] ? temp[0] : '',
      city: temp[1] ? temp[1] : '',
      state: temp[2] ? temp[2].split(' ')[0] : '',
      zipcode: temp[2] ? temp[2].split(' ')[1] : ''
    },
    isWarning: isWarning,
    gEvent_id: item.id
  }
}

// converting Google All Day event to the appropriate format
var convertAllDay = function (theDate) {
  var moment = require('moment-timezone');
  return new Date(moment.tz(theDate, moment.tz.guess()));
};

// save items to the database
var saveWatchObject = function (user, callback = null) {
  util.debugConsole('Saving changes to DB: ');
  if (user.events) {
    eventArr.link (user.events, function (events) {
      user.events = events;
      user.save (function (err, user) {
        if (err) return callback (err);
        return callback ? callback(null, true) : true;
      });
    });
  } else {
    user.save (function (err, user) {
      if (err) return callback (err);
      return callback ? callback(null, true) : true;
    });
  }
};