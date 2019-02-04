'use strict';

const mongoose = require('mongoose');
const Travlendar = mongoose.model('Travlendar');
const util = require('../../utils/utils');
const gMap = require('../../app_server/controllers/gMaps');

/*
   routeTravelEvents takes in user data after the events have been sorted. It then
    routes to the appropriate method: CREATE, UPDATE, and DELETE, based on the method param.
 */
module.exports.routeTravelEvents = function(user, method, event, callback){
  util.debugConsole('app_api/controllers/travel_events.js -> routeTravelEvents'.toUpperCase());

  if(!user || !user.events){
      return callback(false, user);
  }else{
      var events = user.events;
      var travelEvents = (user.travelEvents)? user.travelEvents : [];

      switch(method){
          case util.CREATE:
              util.debugConsole('Route travel events to createTravelEvents'.toUpperCase());
              createTravelEvents(event, events, travelEvents, user.settings, function(ret, err){
                  if(err) return callback(false);
                  saveTravelEvents(user, ret, callback);
              });
              break;
          case util.UPDATE:
              util.debugConsole('Route travel events to updateTravelEvents'.toUpperCase());
              updateTravelEvents(event, events, travelEvents, user.settings, function(ret, err){
                  if(err) return callback(false);
                  saveTravelEvents(user, ret, callback);
              });
              break;
          case util.DELETE:
              util.debugConsole('Route travel events to deleteTravelEvents'.toUpperCase());
              deleteTravelEvents(event, events, travelEvents, user.settings, function(ret, err){
                  if(err) return callback(false);
                  saveTravelEvents(user, ret, callback);
              });
              break;
          default:
              break;
      }
  }
};

/*
   Create travel events based on the eventID and surrounding events.
    if the event has a previous and next it will always create two travelEvents so
    in case an event is inserted between two events it will handle replacing the events associated.
 */
function createTravelEvents(eventID, events, travelEvents, settings, callback){
  if(events.length === 0) return callback(null);
  var travelEventCalls = [];
  var event = null;
  var previousEvent = null;
  var nextEvent = null;

  for(var a = 0; a < events.length; a++) {
    if(events[a].id === eventID){
      event = events[a];
    }
  }

  if(event){
    for(var b = 0; b < events.length; b++){
      if(event.previousEvent_id && events[b].id === event.previousEvent_id){
        previousEvent = events[b];
      }else if(event.nextEvent_id && events[b].id === event.nextEvent_id){
        nextEvent = events[b];
      }
    }

    if(previousEvent){
      var previousTravelMode = null;
      for(var t1 = 0; t1 < travelEvents.length; t1++){
        if(previousEvent.id === travelEvents[t1].event_id) previousTravelMode = travelEvents[t1].travelMode;
      }
      travelEventCalls.push(new Promise(function(resolve, reject){
        getTravelTime(previousEvent, event, settings, previousTravelMode, function (travel, err) {
          if (err || !travel){
            reject((err)? err : "travel event is null".toLocaleUpperCase());
          } else{
              var travelEvent = buildTravelEvent(previousEvent, event, travel);
                (!travelEvent.event_id || !travelEvent.travelMode)?
                    reject(new Error('travel_events.js - buildTravelEvent')) : resolve(travelEvent);
          }
        })
      }));

    } else if(settings){
      var fromDefaultEvent = {
        eventEndLocation: (settings.startAddress)? settings.startAddress: {},
        eventLocationCoord: (settings.addressCoord)? settings.addressCoord : [],
        id: 'default-start-' + getDateForCompare(event.eventStart)
      };
      for(var z = 0; z < travelEvents.length; z++){
        if(travelEvents[z].event_id === fromDefaultEvent.id) travelEvents.splice(z, 1);
      }
      travelEventCalls.push(new Promise(function(resolve, reject){
        getTravelTime(fromDefaultEvent, event, settings, null, function (travel, err) {
          if (err || !travel){
            reject((err)? err : "travel event is null".toLocaleUpperCase());
          } else{
              var travelEvent = buildTravelEvent(fromDefaultEvent, event, travel);
              (!travelEvent.event_id || !travelEvent.travelMode)?
                  reject(new Error('travel_events.js - buildTravelEvent')) : resolve(travelEvent);
          }

        })
      }));
    }

    if(nextEvent) {
      var eventTravelMode = null;
      for(var t = 0; t < travelEvents.length; t++){
        if(travelEvents[t].event_id === nextEvent.id) {
          travelEvents.splice(t, 1);
        }
      }
      for(var t2 = 0; t2 < travelEvents.length; t2++){
        if(event.id === travelEvents[t2].event_id) eventTravelMode = travelEvents[t2].travelMode;
      }
      travelEventCalls.push(new Promise(function(resolve, reject){
        getTravelTime(event, nextEvent, settings, eventTravelMode, function (travel, err) {
          if (err || !travel){
            reject((err)? err : "travel event is null".toLocaleUpperCase());
          } else{
              var travelEvent = buildTravelEvent(event, nextEvent, travel);
              (!travelEvent.event_id || !travelEvent.travelMode)?
                  reject(new Error('travel_events.js - buildTravelEvent')) : resolve(travelEvent);
          }
        })
      }));

    } else if(settings){
      var toDefaultEvent = {
        eventEndLocation: (settings.startAddress)? settings.startAddress: {},
        eventLocationCoord: (settings.addressCoord)? settings.addressCoord : [],
        id: 'default-end-' + getDateForCompare(event.eventStart)
      };
      var defaultTravelMode = null;
      var defaultStartId = 'default-start-' + getDateForCompare(event.eventStart);
      for(var m = 0; m < travelEvents.length; m++){
        if(travelEvents[m].event_id === toDefaultEvent.id) travelEvents.splice(m, 1);
      }
      for(var t3 = 0; t3 < travelEvents.length; t3++){
        if(defaultStartId === travelEvents[t3].event_id) defaultTravelMode = travelEvents[t3].travelMode;
      }
      travelEventCalls.push(new Promise(function(resolve, reject){
        getTravelTime(event, toDefaultEvent, settings, defaultTravelMode, function (travel, err) {
          if (err || !travel){
            reject((err)? err : "travel event is null".toLocaleUpperCase());
          } else{
              var travelEvent = buildTravelEvent(event, toDefaultEvent, travel);
              (!travelEvent.event_id || !travelEvent.travelMode)?
                  reject(new Error('travel_events.js - buildTravelEvent')) : resolve(travelEvent);
          }
        })
      }));
    }
  }

  Promise.all(travelEventCalls).then(function(results){
    for(var j = 0; j < results.length; j++){
      if(results[j]) travelEvents.push(results[j]);
    }
    return callback(travelEvents);
  }).catch(function(err){
    util.debugConsole(err);
    return callback(travelEvents, err)
  })
}

//Update travel deletes and travel event attached to the updated event and sends to the create function.
function updateTravelEvents(eventID, events, travelEvents, settings, callback){
  var event = null;
  for(var u = 0; u < events.length; u++){
    if(eventID === events[u].id) event = events[u];
  }
  if(!event) return callback(travelEvents);
  if(event.previousEvent_id){
    for(var e = 0; e < travelEvents.length; e++){
      if(event.id === travelEvents[e].event_id) travelEvents.splice(e, 1);
    }
  }
  createTravelEvents(eventID, events, travelEvents, settings, function(ret){
    return callback(ret);
  });
}

/*
   Delete deletes any travel event associated with the deleted event and routes based on case
    if the deleted event has a next event this event takes priority since its the event
    the travelEvent is attached to. This would go straight to create. Otherwise it goes to the update
    to prep the previous event and send it to create. (updated) - check and delete default travel events.
 */
function deleteTravelEvents(event, events, travelEvents, settings, callback){
  if(events.length === 0) return callback(null);
  if(!event) return callback(travelEvents);
  if(!travelEvents) return callback(null);
  var deafualtEventID = null;

  if(!event.nextEvent_id){
    deafualtEventID = 'default-end-' + getDateForCompare(event.eventStart);
    for(var b = 0; b < travelEvents.length; b++){
      if(travelEvents[b].event_id === deafualtEventID) travelEvents.splice(b, 1);
    }
  }
  if(!event.previousEvent_id){
    deafualtEventID = 'default-start-' + getDateForCompare(event.eventStart);
    for(var c = 0; c < travelEvents.length; c++){
      if(travelEvents[c].event_id === deafualtEventID) travelEvents.splice(c, 1);
    }
  }

  for(var t = 0; t < travelEvents.length; t++){
    if(travelEvents[t].event_id === event.id) travelEvents.splice(t, 1);
  }

  if(event.nextEvent_id){
    for(var y = 0; y < travelEvents.length; y++){
      if(travelEvents[y].event_id === event.nextEvent_id) travelEvents.splice(y, 1);
    }
    createTravelEvents(event.nextEvent_id, events, travelEvents, settings, function(ret){
      return callback(ret);
    })
  } else if(event.previousEvent_id){
    updateTravelEvents(event.previousEvent_id, events, travelEvents, settings, function(ret){
      return callback(ret);
    })
  } else{
    return callback(travelEvents, null);
  }
}

/*
   getTravelTime parses through event and calls retrieveTravelTime for every travel mode to compare the
    fastest travel time and then returns the travel object. the case of Transit it checks
    all the preferred modes of transit and returns the best one.
    Google distance matrix references:
    https://developers.google.com/maps/documentation/distance-matrix/intro#travel_modes,
    https://github.com/googlemaps/google-maps-services-js/blob/master/spec/e2e/distance-matrix-spec.js
 */
function getTravelTime(fromEvent, toEvent, settings, prevTravel, callback){
  var travelModes = (settings && settings.modeOfTravel)? settings.modeOfTravel :
    ['walking', 'driving', 'bicycling', 'transit'];
  var transitOptions = (settings && settings.preferredTransitModes)?
    settings.preferredTransitModes : ['bus', 'rail', 'subway', 'train', 'tram'];
  var preferredTransitModes = [];
  var matrixModel;
  var travelPromises = [];
  var arrivalTime = (toEvent.eventStart)? toEvent.eventStart : new Date();
  var departureTime = (fromEvent.eventEnd)? fromEvent.eventEnd : new Date();
  var startingLatLon;

  if(prevTravel !== null){
    travelModes = [prevTravel];
  } else if (toEvent.transportationOverride) {
    travelModes = [toEvent.transportationOverride];
  } else if (toEvent.id && toEvent.id.indexOf('default') !== -1 && fromEvent.transportationOverride) {
    travelModes = [fromEvent.transportationOverride];
  }

  startingLatLon = getStartingLatLon(fromEvent, toEvent);

  for(var m = 0; m < transitOptions.length; m++){
    preferredTransitModes.push(transitOptions[m].toLowerCase());
  }

  for(var i = 0; i < travelModes.length; i++){
    matrixModel = {
      units: 'imperial',
      origins: startingLatLon,
      destinations: [{lat: toEvent.eventLocationCoord[1], lng: toEvent.eventLocationCoord[0]}]
    };

    matrixModel.mode = travelModes[i].toLowerCase();
    if(matrixModel.mode === 'transit'){
      matrixModel.transit_mode = preferredTransitModes;
      matrixModel.arrival_time = Math.floor(arrivalTime.getTime() / 1000);
    }
    if(matrixModel.mode === 'driving' && departureTime){
      matrixModel.traffic_model = 'pessimistic';
      matrixModel.departure_time = Math.floor(departureTime.getTime() / 1000);
    }
    travelPromises.push(retrieveTravelTime(matrixModel));
  }

  Promise.all(travelPromises).then(function(responses) {
    var travelCompare;
    var travelReturn;
    var err = null;
    for(var e = 0; e < responses.length; e++){
      if(responses[e].status !== 'OK')
        return callback(null, new Error('Travel object returned status ' + responses[e].status));
      var response = responses[e].rows[0].elements[0];
      if(response.status === 'OK'){
        travelCompare = response;
        travelCompare.mode = travelModes[e];
        if(travelCompare.mode.toLowerCase() === 'driving'){
          travelCompare.duration = travelCompare.duration_in_traffic;
        }
        if(!travelReturn) {
          travelReturn = travelCompare;
        }else if(travelCompare.duration < travelReturn.duration){
          travelReturn = travelCompare;
        }
      } else if(response.status === 'ZERO_RESULTS' && travelModes.length === 1){
        err = 'Zero Results for available travel modes'.toUpperCase();
      }
    }
    return callback(travelReturn, err);
  }).catch(function(err){
    util.debugConsole(err);
    return callback(null, err);
  })
}

/*
  retrieveTravelTime sends a request for the travel time.
  Google distance matrix references:
  https://github.com/googlemaps/google-maps-services-js/blob/master/spec/e2e/distance-matrix-spec.js
*/

function retrieveTravelTime(params){
  return new Promise(function(resolve, reject){
    gMap.getTravelTime(params, function(err, res){
      if(err){
        reject(err);
      }
      else{
        resolve(res.json);
      }
    })
  })
}

//Builds the travel event
function buildTravelEvent(fromEvent, toEvent, travel) {
  var travelStart;
  var travelEnd;
  var duration = (travel.duration)? travel.duration.value : 0;
  var startingLatLon = getStartingLatLon(fromEvent, toEvent);
  var travelEvent = {};

  startingLatLon = [startingLatLon[0].lng, startingLatLon[0].lat];

  if(fromEvent.id.indexOf('default') !== -1) {
    travelEvent.event_id = (fromEvent.id) ? fromEvent.id : null;
  }else {
    travelEvent.event_id = toEvent.id ? toEvent.id : null;
  }

  if(toEvent.id.indexOf('default') !== -1){
      travelEnd = (fromEvent.eventEnd)?
          new Date(fromEvent.eventEnd.valueOf() + duration * 1000 + 1000) : null;
      travelStart = (fromEvent.eventEnd)?
          new Date(fromEvent.eventEnd.valueOf() + 1000) : null;
  }else{
      travelStart = (toEvent.eventStart)?
          new Date(toEvent.eventStart.valueOf() - duration * 1000 - 1000) : null;
      travelEnd = (toEvent.eventStart)?
          new Date(toEvent.eventStart.valueOf() - 1000) : null;
  }

  travelEvent.travelMode = (travel.mode) ? travel.mode : null;
  travelEvent.travelTimeEstimate = (travel.duration) ? travel.duration.value : null;
  travelEvent.travelStartTime = travelStart ? travelStart : null;
  travelEvent.travelEndTime = travelEnd ? travelEnd : null;
  travelEvent.travelStartLocationCoord = startingLatLon ? startingLatLon : [];
  travelEvent.travelEndLocationCoord = toEvent.eventLocationCoord ? toEvent.eventLocationCoord : [];

  return travelEvent;
}

//Helper function for getting the date in the format YEARMONTHDAY ex. 20180216
function getDateForCompare(eventDate){
  return eventDate.getFullYear()*10000
    + eventDate.getMonth()*100
    + eventDate.getDate();
}

//Checks for overridden lat lon and sets it accordingly.
function getStartingLatLon(fromEvent, toEvent){
  var startingLatLon;
  if(toEvent.eventStartLocationCoord !== undefined
    && toEvent.eventStartLocationCoord[1] !== -1
    && toEvent.eventStartLocationCoord[0] !== -1 ){
    startingLatLon = [{lat: toEvent.eventStartLocationCoord[1], lng: toEvent.eventStartLocationCoord[0]}];
  }else{
    startingLatLon = [{lat: fromEvent.eventLocationCoord[1], lng: fromEvent.eventLocationCoord[0]}];
  }
  return startingLatLon;
}

//Save the travel events.
function saveTravelEvents(user, travelEvents, callback){
    (travelEvents)? user.travelEvents = travelEvents : user.travelEvents = [];

    util.debugConsole('\n');
    util.debugConsole('------------------------------TRAVEL EVENTS SAVED-------------------------------');
    util.debugConsole(JSON.stringify(user.travelEvents));
    util.debugConsole('COUNT ' + user.travelEvents.length);
    util.debugConsole('-------------------------------------------------------------------------------\n');

    user.save(function(err) {
        return (err)? callback(false) : callback(true);
    })
}