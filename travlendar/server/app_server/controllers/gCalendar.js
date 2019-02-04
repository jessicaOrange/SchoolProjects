'use strict';

let gapi = require('googleapis');
let cal = gapi.calendar('v3');

// retrieve Calendar List
module.exports.listCalenders = function (params, callback) {
  cal.calendarList.list(params, function (err, calendar) {
    return callback(err, calendar);
  });
};

module.exports.addTravlendarCalendar = function (params, callback) {
  cal.calendars.insert(params, function (err, calendar) {
    return callback(err, calendar);
  });
}