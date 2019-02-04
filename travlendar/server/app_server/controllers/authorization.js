'use strict';

const crypto = require("../../utils/encryptor");
const userName = require("../../app_api/controllers/users");

const EXPIRED = 60 * 60 * 1000;
const EXPIRED_RANGE = (50 / 60) * EXPIRED;
let info = {};

module.exports.newAuthorizationToken = function (userid, callback) {
  if (!userid) {
    return info.callFunction ({message: "invalid information presented"});
  }

  info.startTime = Date.now();
  decryptToken(userid, null, callback);
};

module.exports.verifyCurrentToken = function (userid, headers, callback) {
  if (!userid) {
    return info.callFunction ({message: 'userid missing'});
  }

  if (!headers) {
    return info.callFunction ({message: 'no headers presented'});
  }

  if (!headers.authorization) {
    return info.callFunction ({message: 'headers missing authorization'});
  }

  info.startTime = Date.now();
  info.authorization = JSON.parse(headers.authorization);
  decryptToken(userid, info.authorization, callback);
}

var decryptToken  = function (userid, authorization, callFunction) {
  info.userid = userid;
  if (callFunction) info.callFunction = callFunction;

  if (authorization && authorization.token) {
    crypto.letsDecrypt(authorization.token, verifyToken);
  } else {
    verifyToken(null, null);
  }
};

var verifyToken = function (err, oldToken) {
  if (err) return info.callFunction (err);

  info.expiration = Date.now() + EXPIRED;  // expires in an hour or 3600 seconds, so call for new token
  let tokenDetails = null;

  if (oldToken) {
    tokenDetails = oldToken.split(' ');
    info.userid = tokenDetails[2];
  }

  userName.getUserName(info.userid, function(err, user) {
    if (err) return info.callFunction (err);

    // Creating a new token for a user
    if (!oldToken) {
      return crypto.letsEncrypt(info.expiration + ' ' + user + ' ' + info.userid, createToken);
    }

    if (tokenDetails[2] === info.userid && tokenDetails[1] === user) {
      userName.getUserToken(info.userid, function(err, token) {
        if (err) return info.callFunction (err);

        if (info.expiration - tokenDetails[0] < EXPIRED_RANGE) {
          return info.callFunction (null, {'messsage': 'token is still valid'});
        } else if (info.expiration - tokenDetails[0] < EXPIRED) {
          return crypto.letsEncrypt(info.expiration + ' ' + user + ' ' + info.userid, createToken);
        } else if (info.expiration - tokenDetails[0] > EXPIRED) { //callback or not, expired is expired
          return info.callFunction ({message: 'token expired'});
        }

        if (token.token !== info.authorization.token && info.callFunction) {
          return ({message: 'invalid token presented'});
        }

        if (token.token === info.authorization.token && info.callFunction) {
          return info.callFunction(err, token);
        }
      });
    } else {
      info.callFunction ({message: 'invalid token presented'});
    }
  });
};

var createToken = function (err, token) {
  if (err) return err;

  const access_token = {
    token_type: 'Basic',
    expiry_time: info.expiration,
    access_token: token
  };

  userName.saveUserToken(info.userid, access_token, function (err, auth) {
    if (err) info.callFunction (err);
    return info.callFunction (null, auth)
  });
};
