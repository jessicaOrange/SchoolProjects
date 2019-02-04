'use strict';
const env = require('../app');
const crypto = require('./encryptor');

module.exports.CREATE = 0;
module.exports.UPDATE = 1;
module.exports.DELETE = 2;

module.exports.sendJsonResponse = function (res, status, content) {
  res.status(status).json(content);
};

module.exports.debugConsole = function (content) {
  let flag = true; //env.environment !== 'production' ? true : false;
  if (flag) {
    console.log('DEBUG MESSAGE ON\t-\t', content);
  }
};

module.exports.getRandomHash = function(length) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  this.debugConsole('Checking uppercase of alphanumberic: ' + text.toUpperCase());

  return text;
}

// New token received, we need to save it to the user's datastore
module.exports.saveCredentials = function (userid, tokens, cred, res) {
  delete tokens.id_token;
  tokens.refresh_token = cred.refresh_token;

  crypto.letsEncrypt(JSON.stringify(tokens), function (err, value) {
    if (err) return util.sendJsonResponse(res, 409, err);
    const currUser = require('../app_api/controllers/users');

    currUser.updateGoogleCredentials(userid, value, function(){
      // this.debugConsole('Updated Google Credentials');
      return;
    });
  });
};