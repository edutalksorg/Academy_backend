const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authJwt = require('../middlewares/authJwt');
const roleCheck = require('../middlewares/roleCheck');

router.use(authJwt, roleCheck('superadmin'));

router.get('/pending-users', adminController.getPendingUsers);
router.post('/approve-user/:id', adminController.approveUser);

module.exports = router;
