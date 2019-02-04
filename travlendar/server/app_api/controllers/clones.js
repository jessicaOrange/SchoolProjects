'use strict';

const mongoose = require('mongoose');
const Travlendar = mongoose.model('Travlendar');
const crypto = require('../../utils/encryptor');
const auth = require('../../app_server/controllers/gAuth');
const gEvent = require('../../app_server/controllers/gEvents');
const currUser = require('./users');
const clients = require('../../app').clients;
const io = require('../../app').io;
const eventController = require('./events');
const utils = require('../../utils/utils')

const eventArr = require('../../utils/link_events');

const me = this;

// request to create new Google Watch channel for push notifications
module.exports.calendarsToClone = function (userid, unclonedList) {
  Travlendar
    .findById(userid)
    .select('+events +settings +credentials +authorization +calendar')
    .exec(function (err, user) {
      if (err) return err;

      if (!user) return ({'message': 'userid not found'});

      crypto.letsDecrypt(user.credentials, function (err, cred) {
        if (err) return callback(err);

        cred = JSON.parse(cred);
        auth.oauth2Client.setCredentials(cred);

        //No need to send refresh token, current token is still valid
        if ((Date.now() - cred.expiry_date) < 0) {
          delete auth.oauth2Client.credentials.refresh_token;
        }

        removeUnclonedItems(user, unclonedList, user.calendar.gCal_id, function (err) {
          if (err) return err;
          user.save();

          sendFromSocket(user);

          let params = {
            userId: 'me',
            auth: auth.oauth2Client
          };

          let temp = [], isFound = false, itemDate = null, tempDate = new Date(Date.now());
          user.settings.cloneCalendar.forEach(function (cloneItem, index) {
            if (!cloneItem.gCal_summary.startsWith('Travlendar Calendar')) {
              params.calendarId = cloneItem.gCal_id;
              gEvent.listCalEvents(params, function (err, events) {
                if (err)
                  return err;

                // New token received, we need to save it to the user's datastore
                if (auth.oauth2Client.credentials.id_token) {
                  saveCredentials(userid, auth.oauth2Client.credentials, cred, function (err) {
                    if (err) return err;
                  });
                }

                events.items.forEach(function (item, count) {
                  temp = item.location ? item.location.split(', ') : [];
                  if (item.end) {
                    itemDate = item.end.date ? item.end.date : item.end.dateTime;
                  } else {
                    itemDate = new Date(Date.now());
                  }
                  isFound = false;

                  if (item.status !== 'cancelled' && ((convertAllDay(itemDate)).getTime() >= tempDate.getTime())) {
                    for (let i = 0; i < user.events.length; i++) {
                      if (item.summary === user.events[i].eventSummary && cloneItem.gCal_id === user.events[i].clonedFrom) {
                        user.events[i].clonedFrom = cloneItem;
                        user.events[i].eventSummary = item.summary;
                        user.events[i].eventStart = item.start.date ? item.start.date : item.start.dateTime;
                        user.events[i].eventEnd = item.end.date ? item.end.date : item.end.dateTime;
                        user.events[i].eventEndLocation = {
                          street: temp[0] ? temp[0] : '',
                          city: temp[1] ? temp[1] : '',
                          state: temp[2] ? temp[2].split(' ')[0] : '',
                          zipcode: temp[2] ? temp[2].split(' ')[1] : ''
                        };

                        isFound = true;
                        break;
                      }
                    }

                    if (!isFound) {
                      addToList(item, cloneItem.gCal_id, user.calendar.gCal_id, temp, function (err, addItem) {
                        if (err) return;
                        user.events.push(addItem);
                        return saveWatchObject(user, function () {
                          sendFromSocket(user);
                        })
                      });
                    }

                    if (index + 1 === user.settings.cloneCalendar.length && count + 1 === events.items.length) {
                      sendFromSocket(user);
                    }
                  }
                });
              });
            }
          });
        });
      });
    });
}

// remove uncloned events from the events list after calendar is no longer cloned
var removeUnclonedItems = function (user, unclonedList, calendarId, callback) {
  let params = {
    userId: 'me',
    auth: auth.oauth2Client,
    calendarId: calendarId
  };

  let itemArray = [];
  for (let i = 0; i < unclonedList.length; i++) {
    for (let index = 0; index < user.events.length; index++) {
      if (user.events[index].clonedFrom === unclonedList[i].gCal_id) {
        itemArray.push(user.events[index]);
        params.eventId = user.events[index].gEvent_id.toString();
        gEvent.deleteCalEvent(params, function() {
        });
      }
    }
  }

  for (let i = 0; i < itemArray.length; i++) {
    let temp = user.events.indexOf(itemArray[i]);
    console.log('Temp index: ' + temp);
    if (temp !== -1) {
      user.events[temp].remove();
    }
  }

  return callback(null);
}

// adding new item to the event list
var addToList = function (item, cal, calendarId, temp, callback) {
  return saveCloneEventToTravlendarGoogle (item, calendarId, function (err, newEvent) {
    if (err) return callback(err);

    return callback (null, {
      clonedFrom: cal,
      eventSummary: item.summary,
      eventStart: item.start.date ? convertAllDay(item.start.date) : item.start.dateTime,
      eventEnd: item.end.date ? convertAllDay(item.end.date) : item.end.dateTime,
      eventEndLocation: {
        street: temp[0] ? temp[0] : '',
        city: temp[1] ? temp[1] : '',
        state: temp[2] ? temp[2].split(' ')[0] : '',
        zipcode: temp[2] ? temp[2].split(' ')[1] : ''
      },
      gEvent_id: newEvent.id,
    });
  })
};

var saveCloneEventToTravlendarGoogle = function (item, calendarId, callback) {
  let resource = {
    summary: item.summary,
    description: item.description,
    start: item.start,
    end: item.end,
    recurrence: item.recurrence,
    location: item.location,
    reminders: { useDefault: true}
  };

  let params = {
    userId: 'me',
    auth: auth.oauth2Client,
    calendarId: calendarId,
    resource: resource
  };

  gEvent.insertCalEvent (params, function (err, newEvent) {
    return callback(err, newEvent);
  });
};

// converting Google All Day event to the appropriate format
var convertAllDay = function (theDate) {
  var moment = require('moment-timezone');
  return new Date(moment.tz(theDate, moment.tz.guess()));
};

// save items to the database
var saveWatchObject = function (user, callback = null) {
  eventArr.link (user.events, function (events) {
    user.events = events;
    user.save (function (err) {
      if (err) return callback ? callback (err) : false;
      return callback ? callback(null, true) : true;
    });
  });
};

var saveCredentials = function (userid, tokens, cred, callback=null) {
  delete tokens.id_token;
  tokens.refresh_token = cred.refresh_token;

  crypto.letsEncrypt(JSON.stringify(tokens), function (err, value) {
    if (err) return callback(false);

    currUser.updateGoogleCredentials(req.params.userid, value, function (err, isSaved) {
      return callback(err, isSaved);
    });
  });
};

var sendFromSocket = function (user) {
  if (user.authorization) {
    for (let x = 0; x < clients.length; x++) {
      if (clients[x].uid.toString() === user._id.toString()) {
        utils.debugConsole('Socket found, sending data next...');
        io.sockets.connected[clients[x].sid].emit('travlendar', {
          'message': 'clones', 'data' : eventController.getEvents(user)
        });
        return;
      }
    }
  }
};
