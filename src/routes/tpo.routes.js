const express = require('express');
const router = express.Router();
const tpoController = require('../controllers/tpo.controller');
const authJwt = require('../middlewares/authJwt');
const roleCheck = require('../middlewares/roleCheck');

router.use(authJwt, roleCheck('tpo'));

router.get('/students', tpoController.getCollegeStudents);

module.exports = router;
