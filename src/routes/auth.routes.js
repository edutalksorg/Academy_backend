const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', require('../controllers/auth.controller').refreshToken);
router.post('/logout', require('../middlewares/authJwt'), require('../controllers/auth.controller').logout);

module.exports = router;
