const userService = require('../services/user.service');

async function getCollegeStudents(req, res, next) {
  try {
    const collegeId = req.user.collegeId;
    if (!collegeId) return res.status(400).json({ success: false, message: 'TPO not associated with a college' });
    const { q, limit = 50, offset = 0 } = req.query;
    const data = await userService.findStudentsByCollege(collegeId, { limit: parseInt(limit, 10), offset: parseInt(offset, 10), q });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function getDashboardStats(req, res, next) {
  try {
    const collegeId = req.user.collegeId;
    if (!collegeId) return res.status(400).json({ success: false, message: 'TPO not associated with a college' });
    const stats = await userService.getCollegeStats(collegeId);
    res.json({ success: true, data: stats });
  } catch (err) { next(err); }
}

async function getCollegeReport(req, res, next) {
  try {
    const collegeId = req.user.collegeId;
    if (!collegeId) return res.status(400).json({ success: false, message: 'TPO not associated with a college' });
    const { dateFrom, dateTo } = req.query;
    const report = await userService.getCollegeReport(collegeId, { dateFrom, dateTo });
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
}

module.exports = { getCollegeStudents, getDashboardStats, getCollegeReport };
