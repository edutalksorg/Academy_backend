const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authJwt = require('../middlewares/authJwt');
const roleCheck = require('../middlewares/roleCheck');

// TPO access
router.get('/tpo/college-report', authJwt, roleCheck('tpo'), reportController.collegeReport);
// SuperAdmin access
router.get('/admin/global-report', authJwt, roleCheck('superadmin'), reportController.globalReport);

module.exports = router;
