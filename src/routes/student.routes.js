const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const authJwt = require('../middlewares/authJwt');

router.use(authJwt);

router.get('/stats', studentController.getStats);
router.get('/recent-tests', studentController.getRecentTests);
router.get('/attempts', studentController.getAttempts);

module.exports = router;
