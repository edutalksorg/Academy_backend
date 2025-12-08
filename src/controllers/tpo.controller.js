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

async function getAllowedStudents(req, res, next) {
  try {
    const collegeId = req.user.collegeId;
    if (!collegeId) return res.status(400).json({ success: false, message: 'TPO not associated with a college' });
    const { q, limit = 50, offset = 0 } = req.query;
    const { AllowedStudent } = require('../models');
    const { Op } = require('sequelize');

    const where = { collegeId };
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } },
        { rollNumber: { [Op.like]: `%${q}%` } }
      ];
    }

    const data = await AllowedStudent.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function uploadStudents(req, res, next) {
  try {
    console.log('Received upload request body:', JSON.stringify(req.body, null, 2));
    const collegeId = req.user.collegeId;
    if (!collegeId) return res.status(400).json({ success: false, message: 'TPO not associated with a college' });
    const { students } = req.body; // Expecting array of { name, email, rollNumber }

    if (!Array.isArray(students) || students.length === 0) {
      console.error('Invalid students data:', students);
      return res.status(400).json({ success: false, message: 'Invalid students data' });
    }

    const { AllowedStudent } = require('../models');

    // Process in bulk
    const created = [];
    const errors = [];

    for (const student of students) {
      try {
        if (!student.email || !student.rollNumber || !student.name) {
          errors.push({ student, error: 'Missing required fields' });
          continue;
        }

        // Check if exists
        const existing = await AllowedStudent.findOne({
          where: {
            collegeId,
            [require('sequelize').Op.or]: [
              { email: student.email },
              { rollNumber: student.rollNumber }
            ]
          }
        });

        if (existing) {
          errors.push({ student, error: 'Student with this email or roll number already exists' });
          continue;
        }

        const newStudent = await AllowedStudent.create({
          collegeId,
          name: student.name,
          email: student.email,
          rollNumber: student.rollNumber
        });
        created.push(newStudent);
      } catch (err) {
        errors.push({ student, error: err.message });
      }
    }

    res.json({
      success: true,
      data: {
        added: created.length,
        failed: errors.length,
        errors
      }
    });
  } catch (err) { next(err); }
}

module.exports = { getCollegeStudents, getDashboardStats, getCollegeReport, getAllowedStudents, uploadStudents };
