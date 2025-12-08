const express = require('express');
const router = express.Router();
const tpoController = require('../controllers/tpo.controller');
const authJwt = require('../middlewares/authJwt');
const roleCheck = require('../middlewares/roleCheck');

router.use(authJwt, roleCheck('tpo'));

router.get('/students', tpoController.getCollegeStudents);
router.get('/stats', tpoController.getDashboardStats);
router.get('/college-report', tpoController.getCollegeReport);
router.get('/allowed-students', tpoController.getAllowedStudents);
router.post('/allowed-students', tpoController.uploadStudents);

module.exports = router;
