const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/tests', require('./tests.routes'));
router.use('/attempts', require('./attempts.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/tpo', require('./tpo.routes'));
router.use('/student', require('./student.routes'));
router.use('/instructor', require('./instructor.routes'));
router.use('/colleges', require('./college.routes'));
router.use('/submissions', require('./submission.routes'));

module.exports = router;

