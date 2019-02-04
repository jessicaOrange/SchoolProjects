'use strict';

var mongoose = require ('mongoose');

/**
 * This includes defined schemas for Travlendar application.
 * Serves as a structure of the MongoDB Document, as MongoDB
 * itself does not contain a schema.
 */

// Adding watch{} for Google Notifications
var watchSchema = new mongoose.Schema({
  channelId: String,
  resourceId: String,
  nextSyncToken: String,
  expiration: String
},{ _id : false });

// Address information from the user or events
var addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  zipCode: String
},{ _id : false });

// Information we expect to store from a Calendar
// Linking calendar to Google via gCal_id
var authorizationSchema = new mongoose.Schema({
  token: String,
  expiry_time: Number
},{ _id : false });

// Information we expect to store from a Calendar
// Linking calendar to Google via gCal_id
var calendarSchema = new mongoose.Schema({
  gCal_id: String,
  gCal_summary: String,
  gCal_key: String,
  gWatch: {type: watchSchema, select: false}
},{ _id : false });

// Travlendar user settings preference for personalization
var settingSchema = new mongoose.Schema({
  defaultCalView: String,
  modeOfTravel: [String],
  preferredTransitModes: [String],
  startAddress:  addressSchema,
  cloneCalendar: [calendarSchema],
  addressCoord: {type: [Number], index: '2dsphere'}
},{ _id : false });

// Information we expect to use from a specific event
// Linking event to Google via gEvent_id
var eventSchema = new mongoose.Schema({
  clonedFrom: String,
  eventSummary: String,

  eventStart: Date,
  eventStartLocation: addressSchema,
  eventEnd: Date,
  eventEndLocation: addressSchema,

  nextEvent_id: String,
  previousEvent_id: String,
  eventLocationCoord: {type: [Number], index: '2dsphere'},				// 2dsphere [longitude, latitude]
  eventStartLocationCoord: {type: [Number], index: '2dsphere'},
  nextEventLocationCoord: {type: [Number], index: '2dsphere'},
  previousEventLocationCoord: {type: [Number], index: '2dsphere'},

  overrideStartLocationEvent: Boolean,
  transportationOverride: String,

  isFloatingEvent: Boolean,
  floatingConstraints: {start: Date, end: Date, duration: Number},
  isWarning: Boolean,
  isConflict: Boolean,

  gEvent_id: String
});

// Information we expect to use from Travel event
var travelSchema = new mongoose.Schema({
  travelMode: String,
  travelTimeEstimate: Number,
  travelStartTime: Date,
  travelEndTime: Date,
  travelStartLocationCoord: {type: [Number], index: '2dsphere'},
  travelEndLocationCoord: {type: [Number], index: '2dsphere'},
  event_id: String,
  gEvent_id: String
});

// the Travlendar user
var userSchema = new mongoose.Schema({
  username: String,
  name: String,
  termsOfService: {type: Boolean, default: false, select: false},
  termsOfServiceDate: {type: Date, select: false},
  deletedUser: {type: Boolean, default: false, select: false},
  g_username: {type: String, unique: true, select: false},
  settings: {type: settingSchema, select: false},
  calendar: {type: calendarSchema, select: false},
  events: {type: [eventSchema], select: false},
  travelEvents: {type: [travelSchema], select: false},
  credentials: {type: String, select: false},
  authorization: {type: authorizationSchema, select: false}
});

mongoose.model('Travlendar', userSchema);
