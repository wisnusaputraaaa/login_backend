const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt');
const { getUsersHandler, userRegistrasiHandler, login, logOut}  = require('../controllers/users');
const { verifyToken } = require('../middleware/verifyToken.js')
const { refreshToken } = require('../controllers/RefreshToken')
const dotenv = require('dotenv');

dotenv.config()

router.route("/users").get(verifyToken, getUsersHandler);

router.route("/register").post(userRegistrasiHandler);

router.route('/login').post(login);

router.route('/token').get(refreshToken);

router.route('/logout').delete(logOut);

module.exports = router;