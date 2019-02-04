'use strict';

const MODE = require ('../../app').environment;

var router = require ('express').Router();
var authToken = require('../../app_server/controllers/authorization');
var util = require('../../utils/utils');

var ctrlUsers = require ('../controllers/users');
var ctrlSettings = require ('../controllers/settings');
var ctrlCalendars = require ('../controllers/calendars');
var ctrlEvents = require ('../controllers/events');
var ctrlNotification = require ('../controllers/notification');
var ctrlTravels = require ('../controllers/travel');

const notificationURL = (MODE === 'prod') ?
  'https://travlendar.me/prod/notification' : 'https://travlendar.me/notification';

/**
 * Using CRUD to facilitate persitent storage and responses
 * Create - using router.post to write contents sent by REST call
 * Read - using router.get to retrieve contents requested by REST call
 * Update - using router.put to update contents of data sent by REST call
 * Delete - router.delete to delete contents sent by REST call
 */

router.use('/user/:userid', function (req, res, next) {
  if (!req.params) {
    return util.sendJsonResponse(res, 404, {message: 'Not found, parameters missing'});
  }

  if (!req.params.userid) {
    return util.sendJsonResponse(res, 404, {message: 'Not found, userid missing'});
  }
  if (req.method === 'OPTIONS') {
    next();
  } else if (req.headers && req.headers.authorization === 'skip') {
    next();
  } else {
    authToken.verifyCurrentToken(req.params.userid, req.headers, function(err, token) {
      if (err) return util.sendJsonResponse(res, 401, err);

      if (token.authorization) {
        res.set('Authorization', JSON.stringify(token.authorization));
      } else {
        res.set("Authorization", null);
      }

      next();
    });
  }
});

// user
router.post ('/user', ctrlUsers.createUser);
router.get ('/user', ctrlUsers.checkIfUserExist);
router.get ('/user/:userid', ctrlUsers.getUserInfo);
router.put ('/user/:userid', ctrlUsers.updateUser);
router.delete ('/user/:userid', ctrlUsers.deleteUser);

// setting
router.post ('/user/:userid/settings', ctrlSettings.createUserSettings);
router.get ('/user/:userid/settings', ctrlSettings.getUserSettings);
router.put ('/user/:userid/settings', ctrlSettings.updateUserSettings);
router.delete ('/user/:userid/settings', ctrlSettings.deleteUserSettings);

// calendar
router.post('/user/:userid/calendar', ctrlCalendars.createTravlendarCalendar);
router.get('/user/:userid/calendar', ctrlCalendars.getTravlendarCalendarInfo);
router.put('/user/:userid/calendar', ctrlCalendars.updateTravlendarCalendar);
router.delete('/user/:userid/calendar', ctrlCalendars.deleteTravlendarCalendar);

// events
router.post('/user/:userid/event', ctrlEvents.createTravlendarEvent);
router.get('/user/:userid/event', ctrlEvents.getTravlendarEventsInfo);
router.get('/user/:userid/event/:eventid', ctrlEvents.getTravlendarEvent);
router.put('/user/:userid/event/:eventid', ctrlEvents.updateTravlendarEvent);
router.delete('/user/:userid/event/:eventid', ctrlEvents.deleteTravlendarEvent);

// travel events
router.get('/user/:userid/travel', ctrlTravels.getTravelEvents);
router.get('/user/:userid/travel/:travelid', ctrlTravels.getTravelEvent);
router.delete('/user/:userid/travel/:travelid', ctrlTravels.deleteTravelEvent);

// Google Notification
router.post ('/notification', function (req, res) {
  let id = req.headers['x-goog-channel-id'].split('-')[0];
  util.sendJsonResponse(res, 201, 'OKAY');
  ctrlNotification.notificationReturned (id, res);
});

module.exports = router;