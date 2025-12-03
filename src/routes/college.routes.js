const express = require('express');
const router = express.Router();
const { getAllColleges } = require('../controllers/college.controller');

router.get('/', getAllColleges);

module.exports = router;
