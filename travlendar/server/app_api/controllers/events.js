'use strict';

const mongoose = require('mongoose');
const Travlendar = mongoose.model('Travlendar');
const crypto = require('../../utils/encryptor');
const util = require('../../utils/utils');
const auth = require('../../app_server/controllers/gAuth');
const gEvent = require('../../app_server/controllers/gEvents');
const moment = require('moment-timezone');
const eventArr = require('../../utils/link_events');
const travelEvent = require('./travel_events');
const io = require("../../app").io;
const clients = require("../../app").clients;

const ONEDAY = 60 * 60 * 24 * 1000;

// export events without REST
module.exports.getEvents = function (user) {
  let eventList = [];
  user.events.forEach(function (item) {
    if (item.eventEnd.getTime() >= Date.now()) {
      let allDay = isThisAllDay(item.eventStart, item.eventEnd);
      eventList.push({
        _id: item._id,
        summary: item.eventSummary,
        start: item.eventStart,
        end: allDay ? item.eventEnd - 1 : allDay,
        isConflict: item.isConflict,
        isAllDayEvent: allDay,
        location: item.eventEndLocation
      });
    }
  });

  return checkIsWarning(eventList, false, function (list) {
    return list;
  });
}

// Read Travlendar Calendar for all Events
module.exports.getTravlendarEventsInfo =  function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+events')
    .exec(function (err, user) {
      if (err) return util.sendJsonResponse(res, 404, err);

      if (!user) {
        return util.sendJsonResponse(res, 404, {
          'message': 'user not found'
        });
      }

      if (!user.events) {
        return util.sendJsonResponse(res, 404, {
          'message': 'user does not have any events to show'
        });
      }

      if (user.events && user.events.length > 0) {
        let eventList = [];
        user.events.forEach(function (item) {
          if (item.eventEnd.getTime() >= Date.now()) {
            let allDay = isThisAllDay(item.eventStart, item.eventEnd);
            eventList.push({
              _id: item._id,
              summary: item.eventSummary,
              start: item.eventStart,
              end: allDay ? item.eventEnd - 1 : item.eventEnd,
              isConflict: item.isConflict,
              isAllDayEvent: allDay,
              location: item.eventEndLocation
            });
          }
        });

        checkIsWarning(eventList, false, function (list) {
          return util.sendJsonResponse(res, 200, {'message': {event: list}});
        });
      } else {
        return util.sendJsonResponse(res, 200, {'message': {event: []}});
      }
    });
};

module.exports.getTravlendarEvent =  function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+events +calendar +credentials')
    .exec(function (err, user) {
      if (err) return util.sendJsonResponse(res, 404, err);

      if (!user) return util.sendJsonResponse(res, 404, {'message': 'user not found'});

      if (!user.events) return util.sendJsonResponse(res, 404, {'message': 'user does not have any Events to pull'});

      if (user.events && user.events.length > 0) {
        let event = user.events.id(req.params.eventid);

        if (!event) return util.sendJsonResponse(res, 404, {'message' : 'event not found to retrieve details for'});

        crypto.letsDecrypt(user.credentials, function (err, cred) {
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
              eventId: event.gEvent_id
            };

            gEvent.getCalEvent(params, function (err, theEvent) {
              if (err) return util.sendJsonResponse(res, 404, err);

              // New token received, we need to save it to the user's datastore
              if (auth.oauth2Client.credentials.id_token) {
                util.saveCredentials(req.params.userid, auth.oauth2Client.credentials, cred, res);
              }

              let location = null;
              if (theEvent.location) {
                let temp = theEvent.location.split(', ');
                location = {
                  street: temp[0],
                  city: temp[1] ? temp[1] : '',
                  state: temp[2] ? temp[2].split(' ')[0] : '',
                  zipcode: temp[2] ? temp[2].split(' ')[1] : '',
                  country: temp[3] ? temp[3] : ''
                }
              }

              var transportationOverride = event.transportationOverride;

              let sendEvent = {
                resource: {
                  summary: theEvent.summary,
                  start: event.eventStart,
                  end: event.eventEnd,
                  description: theEvent.description,
                  reminders: theEvent.reminders,
                  location: theEvent.location,
                  recurrence: theEvent.recurrence
                },
                isAllDayEvent: isThisAllDay(event.eventStart, event.eventEnd),
                isFloating: event.isFloating,
                floatingConstraints: {start: null, end: null, duration: null},
                overrideStartLocation: (event.overrideStartLocation)? event.overrideStartLocation : null,
                transportation: {usingRecommendation: (!transportationOverride),
                  override: (transportationOverride)? transportationOverride : ''},
                notification: {hasNotification: false, minutesPrior: 5},
                endLocation: location ? location :
                  event.eventEndLocation ? event.eventEndLocation : {street: '', city: '', state: '', zipcode: ''},
                startLocation: event.eventStartLocation ? event.eventStartLocation: {street: '', city: '', state: '', zipcode: ''},
                _id: req.params.eventid
              };

              return util.sendJsonResponse(res, 201, {'message': {event: sendEvent}});
            });

        });
      }
    });
};

// Create new Event onto Travlendar Calendar
module.exports.createTravlendarEvent =  function (req, res) {
  if (!req.query && !req.query.payload) {
    return util.sendJsonResponse(res, 404, {
      'message': 'No calendar specified to create'
    });
  }

  Travlendar
    .findById(req.params.userid)
    .select('+events +credentials +calendar +settings +travelEvents +authorization')
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

          let tmpStart = new Date(req.body.resource.start);
          let tmpEnd = new Date(req.body.resource.end);
          let resource = req.body.resource;

          resource.start = null;
          resource.end = null;

          if (req.body.isAllDayEvent) {
            resource.start = {date: tmpStart.toLocaleDateString()};
            resource.end = {date: tmpEnd.toLocaleDateString()};
          } else if(req.body.isFloating) {
            util.debugConsole("Scheduling floating event");
            let success = scheduleFloatingEvent(resource);
            if(!success) {
              util.debugConsole("Failed to schedule floating event");
              resource.start = {date: tmpStart.toLocaleDateString()};
              resource.end = {date: tmpEnd.toLocaleDateString()};
            } else {
              util.debugConsole("Scheduled floating event successfully");;
              util.debugConsole("Start: " + resource.start);
              util.debugConsole("End: " + resource.end);
            }
          } else {
            resource.start = {dateTime: tmpStart.toISOString()};
            resource.end = {dateTime: tmpEnd.toISOString()};

            if (req.body.resource.recurrence) {
              resource.start.timeZone = moment.tz.guess();
              resource.end.timeZone = moment.tz.guess();
            }
          }

          util.debugConsole(resource);

          let params = {
            userId: 'me',
            auth: auth.oauth2Client,
            calendarId: user.calendar.gCal_id,
            resource: resource
          };

          gEvent.insertCalEvent (params, function (err, newEvent) {
            if (err) return util.sendJsonResponse(res, 404, err);

            // New token received, we need to save it to the user's datastore
            if (auth.oauth2Client.credentials.id_token) {
              util.saveCredentials(req.params.userid, auth.oauth2Client.credentials, cred, res);
            }

            // Save the calendar to Travlendar now
            if (user.events == null) user.events = [];
            let address = newEvent.location.split(', ');
            let lat = req.body.endLocation.lat ? req.body.endLocation.lat : null;
            let lon = req.body.endLocation.lon ? req.body.endLocation.lon : null;

            //override start location lat/lon for travel.
            var latStart = req.body.startLocation.lat ? req.body.startLocation.lat : null;
            var lonStart = req.body.startLocation.lon ? req.body.startLocation.lon : null;

            var transportationOverride = null;
            if(!req.body.transportation.usingRecommendation){
              if(req.body.transportation.override) transportationOverride = req.body.transportation.override;
            }

            var startingAddress;
            if(req.body.startLocation){
              startingAddress = {};
              startingAddress.street = (req.body.startLocation.street)? req.body.startLocation.street : null;
              startingAddress.city = (req.body.startLocation.city)? req.body.startLocation.city : null;
              startingAddress.state = (req.body.startLocation.state)? req.body.startLocation.state : null;
              startingAddress.zipCode = (req.body.startLocation.zipcode)? req.body.startLocation.zipcode : null;
              if(JSON.stringify(startingAddress).indexOf(null) !== -1){
                startingAddress = null;
              }
            }

            let event = {
              eventSummary: newEvent.summary,
              eventStart: tmpStart.toLocaleString(),
              eventEnd: tmpEnd.toLocaleString(),
              eventStartLocation: (startingAddress)? startingAddress : null,
              eventEndLocation: newEvent.location ? {
                street: address[0],
                city: address[1],
                state: address[2].split(' ')[0],
                zipCode: address[2].split(' ')[1]
              } : null,
              transportationOverride: transportationOverride,
              gEvent_id: newEvent.id,
              isFloating: req.body.isFloating ? req.body.isFloating : false,
              floatingConstraints: req.body.floatingConstraints ? req.body.floatingConstraints: null,
              overrideStartLocation: req.body.overrideStartLocation ? req.body.overrideStartLocation : false,
              nextEvent_id: null,
              previousEvent_id: null,
              eventLocationCoord: lat && lon ? [lon, lat] : undefined,
              eventStartLocationCoord: (lonStart && latStart)? [lonStart, latStart] : null,
              nextEventLocationCoord: undefined,
              previousEventLocationCoord: undefined
            };

            user.events.push(event);
            var eventID = user.events[user.events.length-1].id;
            saveEventChanges (user, function (err, saved) {
              if (err) return util.sendJsonResponse(res, 409, err);
              util.sendJsonResponse(res, 201, {'message': {
                  event: {
                    _id: eventID,
                    summary: event.eventSummary,
                    start: event.eventStart,
                    end: event.eventEnd,
                    isAllDayEvent: isThisAllDay(event.eventStart, event.eventEnd)
                  }
                }
              });

              travelEvent.routeTravelEvents(user, util.CREATE, eventID, function(saved){
                if(saved){
                  sendTravelEventResponse(user);
                  util.debugConsole("travel events creating - line 339".toUpperCase());
                } else{
                  util.debugConsole('Create Travlendar Event Error: travel events saved: '.toUpperCase()+saved);
                }
              });
            });
          });
        });
      }
    );
};

// Update Travlendar Event on Calendar
module.exports.updateTravlendarEvent =  function (req, res) {
  if (!req.query && !req.query.payload) {
    return util.sendJsonResponse(res, 404, {
      'message': 'No calendar specified to create'
    });
  }

  Travlendar
    .findById(req.params.userid)
    .select('+events +credentials +calendar +settings +travelEvents +authorization')
    .exec(function (err, user) {
        if (err) {
          return util.sendJsonResponse(res, 400, err);
        }

        if (!user) {
          return util.sendJsonResponse(res, 404, {
            'message': 'userid not found'
          });
        }

        if (user.events == null) {
          return util.sendJsonResponse(res, 404, {
            'message': 'user has no events to update'
          })
        }

        if (user.events && user.events.length > 0) {
          let event = user.events.id(req.params.eventid);

          if (!event) return util.sendJsonResponse(res, 200, {'message': 'no such event to remove'});

          crypto.letsDecrypt(user.credentials, function(err, cred) {
            if (err) return util.sendJsonResponse(res, 404, err);

            cred = JSON.parse(cred);
            auth.oauth2Client.setCredentials(cred);

            //No need to send refresh token, current token is still valid
            if ((Date.now() - cred.expiry_date) < 0) {
              delete auth.oauth2Client.credentials.refresh_token;
            }

            let tmpStart = new Date(req.body.resource.start);
            let tmpEnd = new Date(req.body.resource.end);
            let resource = req.body.resource;

            resource.start = null;
            resource.end = null;

            if (req.body.isAllDayEvent) {
              resource.start = {date: tmpStart.toLocaleDateString()};
              resource.end = {date: tmpEnd.toLocaleDateString()};
            } else {
              resource.start = {dateTime: tmpStart.toISOString()};
              resource.end = {dateTime: tmpEnd.toISOString()};

              if (req.body.resource.recurrence) {
                resource.start.timeZone = moment.tz.guess();
                resource.end.timeZone = moment.tz.guess();
              }
            }

            let params = {
              userId: 'me',
              auth: auth.oauth2Client,
              calendarId: user.calendar.gCal_id,
              eventId: event.gEvent_id,
              resource: resource
            };

            gEvent.updateCalEvent(params, function (err, newEvent) {
              if (err) return util.sendJsonResponse(res, 404, err);

              // New token received, we need to save it to the user's datastore
              if (auth.oauth2Client.credentials.id_token) {
                util.saveCredentials(req.params.userid, auth.oauth2Client.credentials, cred, res);
              }

              let address = newEvent.location.split(', ');
              let lat, lon;
              if (req.body.endLocation) {
                lat = req.body.endLocation.lat ? req.body.endLocation.lat : -1;
                lon = req.body.endLocation.lon ? req.body.endLocation.lon : -1;
              }

              var latStart = req.body.startLocation.lat ? req.body.startLocation.lat : null;
              var lonStart = req.body.startLocation.lon ? req.body.startLocation.lon : null;

              var transportationOverride = null;
              if(!req.body.transportation.usingRecommendation && req.body.transportation.override) {
                transportationOverride = req.body.transportation.override;
              }

              var startingAddress;
              if(req.body.startLocation){
                startingAddress = {};
                startingAddress.street = (req.body.startLocation.street)? req.body.startLocation.street : null;
                startingAddress.city = (req.body.startLocation.city)? req.body.startLocation.city : null;
                startingAddress.state = (req.body.startLocation.state)? req.body.startLocation.state : null;
                startingAddress.zipCode = (req.body.startLocation.zipcode)? req.body.startLocation.zipcode : null;
                if(JSON.stringify(startingAddress).indexOf(null) !== -1){
                  startingAddress = null;
                }
              }

              // Save the calendar to Travlendar now
              event.eventSummary = newEvent.summary ? newEvent.summary : event.eventSummary;
              event.eventStart = tmpStart.toLocaleString();
              event.eventEnd = tmpEnd.toLocaleString();
              event.eventStartLocation = (startingAddress)? startingAddress : null;
              event.eventEndLocation = newEvent.location ? {
                street: address[0],
                city: address[1],
                state: address[2].split(' ')[0],
                zipCode: address[2].split(' ')[1]
              } : event.eventEndLocation;
              event.transportationOverride = transportationOverride;
              event.isFloating = req.body.isFloating ? req.body.isFloating : false;
              event.floatingConstraints = req.body.floatingConstraints ? req.body.floatingConstraints : null, event.overrideStartLocation = req.body.overrideStartLocation ? req.body.overrideStartLocation : event.overrideStartLocation;

              event.nextEvent_id = null;
              event.previousEvent_id = null;
              event.eventLocationCoord = lat && lon ? [lon, lat] : event.eventLocationCoord;
              event.startLocationCoord = (lonStart && latStart)? [lonStart, latStart] : event.startLocationCoord;
              event.nextEventLocationCoord = undefined;
              event.previousEventLocationCoord = undefined;

              saveEventChanges(user, function (err, saved) {
                if (err) return util.sendJsonResponse(res, 409, err);

                let updatedEvent = {
                  _id: req.params.eventid,
                    summary: event.eventSummary,
                    start: event.eventStart,
                    end: event.eventEnd,
                    location: event.eventEndLocation,
                    description: resource.description,
                    isAllDayEvent: req.body.isAllDayEvent
                };

                checkIsWarning(new Array(updatedEvent), true, function (list) {
                  util.sendJsonResponse(res, 200, {
                    'message': {event: list[0]}
                  });
                });

                travelEvent.routeTravelEvents(user, util.UPDATE, req.params.eventid, function(saved){
                  if(saved){
                    sendTravelEventResponse(user);
                    util.debugConsole("travel events updating - line 509".toUpperCase());
                  } else{
                    util.debugConsole('Update Travlendar Event Error: travel events saved: '.toUpperCase()+saved);
                  }
                });
              });
            });
          });
        }
      }
    );
};

// Delete Travlendar Event from Calendar
module.exports.deleteTravlendarEvent =  function (req, res) {
  Travlendar
    .findById(req.params.userid)
    .select('+events +calendar +credentials +settings +travelEvents +authorization')
    .exec(function (err, user) {
      if (err) return util.sendJsonResponse(res, 404, err);

      if (!user) return util.sendJsonResponse(res, 404, {'message': 'user not found'});

      if (!user.events) return util.sendJsonResponse(res, 404, {'message': 'user does not have any Events to delete'});

      if (user.events && user.events.length > 0) {
        let event = user.events.id(req.params.eventid);

        if (!event) return util.sendJsonResponse(res, 200, {'message': 'no such event to remove'});

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
            eventId: event.gEvent_id
          };

          gEvent.deleteCalEvent(params, function (err, code) {
            if (err) console.log('Event not found on Google');

            // New token received, we need to save it to the user's datastore
            if (auth.oauth2Client.credentials.id_token) {
              util.saveCredentials(req.params.userid, auth.oauth2Client.credentials, cred, res);
            }

            user.events.id(req.params.eventid).remove();
            saveEventChanges(user, function (err, saved) {
              if (err) return util.sendJsonResponse(res, 404, err);
              util.sendJsonResponse(res, 204, null);

              travelEvent.routeTravelEvents(user, util.DELETE, event, function(saved){
                if(saved) {
                  sendTravelEventResponse(user);
                  console.log("travel events deleting - line 580: ".toUpperCase());
                } else{
                  util.debugConsole('Delete Travlendar Event Error: travel events saved: '.toUpperCase()+saved);
                }
              });
            });
          });
        });
      }
    });
};

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function getEventsForDay(user, day) {
  var allEvents = getEvents(user);
  var dayEvents = [];

  for(var i = 0; i < day.length; i++) {
    var event = allEvents[i];
    if(isSameDay(event.start, day)) {
      dayEvents.push(event);
    }
  }

  return dayEvents;
}

function getTravelTimeWrapper(i, event, resource) {
  let index = i;
  getTravelTime(event, resource, null, null, function(time, err) {
    floatingEventTimesCalculated++;
    floatingEventDayEvents[index].time = time;
    if(floatingEventTimesCalculated >= floatingEventTimesNeeded) {
      scheduleFloatingEventCalculated();
    }
  });
}

var floatingEventTimesCalculated = -1;
var floatingEventTimesNeeded = -1;
var floatingEventResource = null;
var floatingEventDayEvents = [];

function scheduleFloatingEvent(resource) {
  if(!resource.isFloating || !resource.floatingConstraints) {
    resource.start = {dateTime: tmpStart.toISOString()};
    resource.end = {dateTime: tmpEnd.toISOString()};
    return false;
  }

  floatingEventDayEvents = getEventsForDay(user, resource.floatingConstraints.start);
  floatingEventTimesCalculated = 0;
  floatingEventTimesNeeded = floatingEventDayEvents.length;
  floatingEventResource = resource;
  for(var i = 0; i < floatingEventDayEvents.length; i++) {
    floatingEventDayEvents[i] = {"event" : floatingEventDayEvents[i], "time" : -1};
    getTravelTimeWrapper(i, floatingEventDayEvents[i], resource);
  }
}

// Do not call, only called after event times were calculated
function scheduleFloatingEventCalculated() {
  var resource = floatingEventResource;
  var dayEvents = floatingEventDayEvents;
  var scheduled = false;
  var eventBefore;
  var eventAfter;
  var beforeTravelTime;
  var afterTravelTime;
  // Iterate through each minute from start floating period to the end (minus duration)
  for(var i = 0; i < resource.floatingConstraints.end.getMinutes() - resource.floatingConstraints.duration - resource.floatingConstraints.start.getMinutes(); i++) {
    // Get previous event
    var tempEvent = null;
    for(var j = 0; j < dayEvents.length; j++) {
      var e = dayEvents[j];
      if(e.event.endTime < resource.floatingConstraints.start + i)
        tempEvent = e;
    }

    if(tempEvent != null && (eventBefore == null || tempEvent.event != eventBefore)) {
      eventBefore = tempEvent.event;
      beforeTravelTime = tempEvent.time;
    }

    // If the current start time we're trying is before the previous event's end time (plus travel time) continue
    if(eventBefore != null && resource.floatingConstraints.start + i < eventBefore.endTime + beforeTravelTime)
      continue;

    // Get next event
    tempEvent = null;
    for(var j = 0; j < dayEvents.length; j++) {
      var e = dayEvents[j];
      if(e.event.startTime > resource.floatingConstraints.start + i + resource.floatingConstraints.duration)
        tempEvent = e;
    }

    if(tempEvent != null && (eventAfter == null || tempEvent.event != eventAfter)) {
      eventAfter = tempEvent.event;
      afterTravelTime = tempEvent.time;
    }

    // If the current start time we're trying is after the next event's start time (plus travel time) break
    if(eventAfter != null && resource.floatingConstraints.start + i + resource.floatingConstraints.duration > eventAfter.startTime - afterTravelTime)
      break;

    resource.start = {dateTime: (resource.floatingConstraints.start + i).toISOString()};
    resource.end = {dateTime: (resource.floatingConstraints.start + i + resource.floatingConstraints.duration).toISOString()};
    scheduled = true;
  }

  return scheduled;
}

// Saving events for POST, PUSH and DELETE
var saveEventChanges = function (user, callback) {
  eventArr.link (user.events, function (events) {
    user.events = events;
    user.save (function (err) {
      if (err) return callback (err);
      return callback (null, true);
    });
  });
};

var isThisAllDay = function(startTime, endTime) {
  let isAllDay = false;
  let duration = (new Date(endTime)).getTime() - (new Date(startTime)).getTime();
  if (duration >= ONEDAY - 1000 && duration <= ONEDAY)
    isAllDay = true;

  return isAllDay;
}

//Send the travelEvents back to the front-end
var sendTravelEventResponse = function (user){
  if (user.authorization) {
    for (let x = 0; x < clients.length; x++) {
      if (clients[x].uid.toString() === user._id.toString()) {
        io.sockets.connected[clients[x].sid].emit('travlendar', {
          message: 'travel', data: travels(user)
        });
        break;
      }
    }
  }
};

var travels = function (user) {
  let travelList = [];
  util.debugConsole('Made it to travel events - line 692'.toUpperCase())
  user.travelEvents.forEach(function (item) {
    if (item.travelEndTime.getTime() >= Date.now()) {
      util.debugConsole('Pushing travel event: ' + item._id);
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

  util.debugConsole('Number of travel events: ' + travelList.length);

  return travelList;
};

var checkIsWarning = function (events, flag, callback) {
  events.forEach(function (item) {
    item.isWarning = false;

    if (flag) {
      if (!item.description) {
        console.log('description issue');
        item.isWarning = true;
      }

      if (item.description && item.description.toString().trim().length === 0) {
        console.log('description issue');
        item.isWarning = true;
      }
      delete item.description;
    }

    if (!item.start) {
      console.log('start issue');
      item.isWarning = true;
    }

    if (!item.summary) {
      console.log('summary issue');
      item.isWarning = true;
    }

    if (item.summary && item.summary.toString().trim().length === 0) {
      console.log('summary issue again');
      item.isWarning = true;
    }

    if (!item.end) {
      console.log('end issue');
      item.isWarning = true;
    }

    if (!item.location) {
      console.log('end location issue');
      item.isWarning = true;
    }

    if (item.location && item.location.street && item.location.street.toString().trim().length === 0) {
      console.log('end location issue again');
      item.isWarning = true;
    }

    delete item.location;
  });
  return callback(events);
}