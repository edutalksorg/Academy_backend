const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructor.controller');
const authJwt = require('../middlewares/authJwt');
const roleCheck = require('../middlewares/roleCheck');

router.use(authJwt, roleCheck('instructor'));

router.get('/stats', instructorController.getStats);

module.exports = router;
