const jwt = require('jsonwebtoken');
const config = require('../config/config');

function sign(payload, expiresIn = config.jwt.expiresIn) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn });
}

function verify(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { sign, verify };
