'use strict';

let gapi = require('googleapis');
let cal = gapi.calendar('v3');
let util = require ('../../utils/utils');

// retrieve Events List from Travlendar Calendar on Google
module.exports.listCalEvents = function (params, callback) {
  util.debugConsole('app_server/controller/gEvents.js -> listCalInfos'.toUpperCase());
  
  cal.events.list(params, function (err, event) {
    return callback(err, event);
  });
};

// retrieve specific Event from Travlendar Calendar on Google
module.exports.getCalEvent  = function (params, callback) {
  util.debugConsole('app_server/controller/gEvents.js -> getCalEvent'.toUpperCase());

  cal.events.get (params, function (err, event) {
    return callback (err, event);
  });
};

// create Event on Travlendar Calendar on Google
module.exports.insertCalEvent = function (params, callback) {
  util.debugConsole('app_server/controller/gEvents.js -> insertCalEvent'.toUpperCase());

  cal.events.insert (params, function (err, event) {
    return callback (err, event);
  });
}

// update Event on Travlendar Calendar on Google
module.exports.updateCalEvent = function (params, callback) {
  util.debugConsole('app_server/controller/gEvents.js -> updateCalEvent'.toUpperCase());

  cal.events.update (params, function (err, event) {
    return callback (err, event);
  });
}

// delete Event on Travlendar Calendar on Google
module.exports.deleteCalEvent = function (params, callback) {
  util.debugConsole('app_server/controller/gEvents.js -> deleteCalEvent'.toUpperCase());

  cal.events.delete (params, function (err, event) {
    return callback (err, event);
  });
}

// try to create a watch event channel for a calendar
module.exports.watchCalEvents = function (params, callback) {
  util.debugConsole('app_server/controller/gEvents.js -> watchCalEvents'.toUpperCase());

  cal.events.watch (params, function (err, event) {
    return callback (err, event);
  });
}

// stop watching push notification on current
module.exports.stopCalWatch = function (params) {
  util.debugConsole('app_server/controller/gEvents.js -> removing old channel info'.toUpperCase());

  cal.channels.stop(params, function (err) {
    util.debugConsole(`stopped watch on channel: ${err != null}`.toUpperCase());
    return err != null;
  });
}
