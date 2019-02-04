'use strict';

const util = require('./utils');
const crypto = require('crypto');
const MODE = require('../app').environment;
const SECRET = (MODE === 'prod' ? process.env.CAPSTONE : 'TRAVLENDAR-2017-TEAM1');

module.exports.letsEncrypt = function (data, callback = null) {
  let encrypted = '';

  const cipher = crypto.createCipher('aes192', SECRET);
  cipher.on('readable', function() {
    const data = cipher.read();
    if (data)  encrypted += data.toString('hex');
  });

  cipher.on('end', function () {
    if (typeof callback === 'function')  return callback (null, encrypted);
  });

  try {
    cipher.write(data);
    cipher.end();
  } catch (err) {
    util.debugConsole('app_server/utils/encryptor.js -> letsEncrypt'.toUpperCase());
    util.debugConsole("CIPHER ERROR HAPPENED")
    util.debugConsole(err.message);

    if (typeof callback === 'function') {
      return callback({message: "error occured while ciphering"}, null);
    }
  }
};

module.exports.letsDecrypt = function (data, callback = null) {
  let decrypted = '';

  const decipher = crypto.createDecipher('aes192', SECRET);
  decipher.on('readable',  function () {
    const data = decipher.read();
    if (data)  decrypted += data.toString('utf8');
  });

  decipher.on('end', function () {
    if (typeof callback === 'function') return callback(null, decrypted);
  });

  try {
    decipher.write(data, 'hex');
    decipher.end();
  } catch (err) {
    util.debugConsole('app_server/utils/encryptor.js -> letsDecrypt'.toUpperCase());
    util.debugConsole("DECIPHER ERROR HAPPENED")
    util.debugConsole(err);

    if (typeof callback === 'function') {
      return callback({message: "error occured while deciphering"}, null);
    }
  }
};

