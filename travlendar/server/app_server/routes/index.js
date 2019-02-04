'use strict';

let express = require('express');
const router = express.Router();

const ctrlOAuth = require('../controllers/gAuth');
const ctrlAuthotization = require('../controllers/authorization');

router.get ('/', ctrlOAuth.oAuth);
router.put ('/logout', ctrlOAuth.logoutUser);
router.get ('/authorization/:userid', ctrlAuthotization.newAuthorizationToken);

module.exports = router;