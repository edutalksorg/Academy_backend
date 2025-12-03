const userService = require('../services/user.service');
const { User, College, Test, Attempt } = require('../models');

async function getStats(req, res, next) {
  try {
    const totalColleges = await College.count();
    const totalUsers = await User.count();
    const pendingApprovals = await User.count({ where: { status: 'pending' } });
    const activeTests = await Test.count({ where: { status: 'published' } });

    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalInstructors = await User.count({ where: { role: 'instructor' } });
    const totalTPOs = await User.count({ where: { role: 'tpo' } });
    const totalAttempts = await Attempt.count();

    console.log('Stats calculated:', {
      totalColleges,
      totalUsers,
      pendingApprovals,
      activeTests,
      totalStudents,
      totalInstructors,
      totalTPOs,
      totalAttempts
    });

    res.json({
      success: true,
      data: {
        totalColleges,
        totalUsers,
        pendingApprovals,
        activeTests,
        totalStudents,
        totalInstructors,
        totalTPOs,
        totalAttempts
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getPendingUsers(req, res, next) {
  try {
    const { q, limit = 50, offset = 0 } = req.query;
    const data = await userService.getPendingUsers({ q, limit: parseInt(limit, 10), offset: parseInt(offset, 10) });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function approveUser(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await userService.approveUser(id);
    res.json({ success: true, message: 'User approved' });
  } catch (err) { next(err); }
}

async function getTpoActivity(req, res, next) {
  try {
    const { ActivityLog, User, College } = require('../models');
    const logs = await ActivityLog.findAll({
      include: [{
        model: User,
        where: { role: 'tpo' },
        attributes: ['name', 'email'],
        include: [{ model: College, attributes: ['name'] }]
      }],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: logs });
  } catch (err) { next(err); }
}

async function getInstructorData(req, res, next) {
  try {
    const { User, Test } = require('../models');
    const instructors = await User.findAll({
      where: { role: 'instructor' },
      attributes: ['id', 'name', 'email'],
      include: [{
        model: Test,
        attributes: ['id', 'title', 'status', 'createdAt']
      }]
    });
    res.json({ success: true, data: instructors });
  } catch (err) { next(err); }
}

module.exports = { getPendingUsers, approveUser, getStats, getTpoActivity, getInstructorData };
