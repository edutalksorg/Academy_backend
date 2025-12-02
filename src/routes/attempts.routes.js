const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attempt.controller');
const authJwt = require('../middlewares/authJwt');
const roleCheck = require('../middlewares/roleCheck');

// Students start and submit attempts
router.post('/tests/:testId/start', authJwt, roleCheck('student'), attemptController.start);
router.post('/submit/:attemptId', authJwt, roleCheck('student'), attemptController.submit);
router.get('/me', authJwt, roleCheck('student'), attemptController.myAttempts);

module.exports = router;
