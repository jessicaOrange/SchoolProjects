'use strict';

const gapi = require('googleapis');
const OAuth2Client = gapi.auth.OAuth2;
const fs = require('fs');
const cryptor = require('../../utils/encryptor');
const path = require('path');
const file = path.normalize('../config/');
const util = require ('../../utils/utils');
const io = require('../../app').io;
const apiUser = require ('../../app_api/controllers/users');
const clients = require('../../app').clients;

let CLIENT_ID = '';
let CLIENT_SECRET = '';
let oauth2Client = '';
let params;
const MODE = require('../../app').environment;
const strFilename = path.resolve(file + 'client_secret_' + MODE);
const REDIRECT_URL = (MODE === 'prod') ? 'https://travlendar.me/oauth' : 'http://localhost:4200/oauth';
const plus = require('./gPlus');

let SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

//'https://www.googleapis.com/auth/script'
SCOPES = SCOPES.join(" ");

fs.readFile(strFilename, 'utf8', function (err, data) {
  if (err) throw err;

  cryptor.letsDecrypt(data, function (err, value) {
    if (err) throw err;

    let jsonVal = JSON.parse(value);
    CLIENT_ID = jsonVal.web.client_id;
    CLIENT_SECRET = jsonVal.web.client_secret;

    oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);
    module.exports.oauth2Client = oauth2Client;
  });
});

const getAccessToken = function (req, res) {
  if (typeof req.query.code === 'string') {
    oauth2Client.getToken(req.query.code, function (err, tokens) {
        if (err) {
          return util.sendJsonResponse(res, 401, err);
        }

        delete tokens.id_token;
        oauth2Client.setCredentials(tokens);

        cryptor.letsEncrypt(JSON.stringify(tokens), function (err, value) {
          // Getting Google Plus details for authenticated user
          if (err) {
            return util.sendJsonResponse(res, 400, err);
          }

          params = {
            userId: 'me',
            auth: oauth2Client
          };

          plus.listPlus(params, function (err, plus) {
            if (err) {
              return util.sendJsonResponse(res, 402, err);
            }

            // Checking to see if user already exists
            const apiUser = require('../../app_api/controllers/users');
            apiUser.isCurrentUser(plus.g_username, function (err, user) {
              if (err) {
                return util.sendJsonResponse(res, 402, err);
              }

              util.debugConsole("User is: ");
              util.debugConsole(user);

              if (user) {
                return util.sendJsonResponse(res, 200, {'message': user});
              } else {
                plus.termsOfService = false;
                plus.credentials = value;
                return util.sendJsonResponse(res, 200, {'message': plus});
              }
            });
          });
        });
      }
    );
  }
};

module.exports.oAuth = function (req, res) {
  if (req.query && req.query.code) {
    getAccessToken(req, res);
  } else {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // will return a refresh token
      scope: SCOPES
    });

    util.sendJsonResponse(res, 201, {"message": url});
  }
};

module.exports.logoutUser = function (req, res) {
  apiUser.logoutUser(req, function (err, authorizationRemoved) {
    if (err) return util.sendJsonResponse(res, 404, err);
    return util.sendJsonResponse(res, 200, {"message": authorizationRemoved});
  })
}