'use strict';

const gapi = require('googleapis');
const plus = gapi.plus('v1');

// return user's profile information
module.exports.listPlus = function (params, callback) {
  plus.people.get(params, function (err, profile) {
    return callback(err, {
      'name': profile.displayName,
      'g_username': profile.emails[0].value
    });
  });
};