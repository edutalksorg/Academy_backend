const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submission.controller');
const authJwt = require('../middlewares/authJwt');

// All submission routes require authentication
router.use(authJwt);

// Run code (Transient execution)
router.post('/run', submissionController.runCode);

// Submit solution (Validate against test cases)
router.post('/submit', submissionController.submitCode);

module.exports = router;
