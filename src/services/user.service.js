const { User } = require('../models');

const { Op } = require('sequelize');

async function getPendingUsers({ q, limit = 50, offset = 0 } = {}) {
  const where = { status: 'pending' };
  if (q) {
    where[Op.or] = [
      { name: { [Op.like]: `%${q}%` } },
      { email: { [Op.like]: `%${q}%` } }
    ];
  }
  return User.findAndCountAll({ where, attributes: ['id', 'name', 'email', 'role', 'collegeId', 'createdAt'], limit, offset });
}

async function approveUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw { status: 404, message: 'User not found' };
  user.status = 'active';
  await user.save();
  return user;
}

async function findById(id) {
  return User.findByPk(id);
}

async function findStudentsByCollege(collegeId, { limit = 20, offset = 0 } = {}) {
  const { Attempt } = require('../models');
  // optional: support q search
  const where = { collegeId, role: 'student' };
  if (arguments[1] && arguments[1].q) {
    const q = arguments[1].q;
    where[Op.or] = [{ name: { [Op.like]: `%${q}%` } }, { email: { [Op.like]: `%${q}%` } }];
  }
  return User.findAndCountAll({
    where,
    limit,
    offset,
    attributes: ['id', 'name', 'email', 'status', 'createdAt'],
    include: [{
      model: Attempt,
      as: 'Attempts',
      attributes: ['id', 'totalScore', 'createdAt', 'tabSwitchCount'],
      required: false
    }],
    order: [['createdAt', 'DESC']]
  });
}

async function getCollegeStats(collegeId) {
  const { College, Test, Attempt } = require('../models');

  // 1. College Info
  const college = await College.findByPk(collegeId);

  // 2. Students & Instructors counts
  const totalStudents = await User.count({ where: { collegeId, role: 'student' } });
  const totalInstructors = await User.count({ where: { collegeId, role: 'instructor' } });

  // 3. Tests created by instructors of this college
  // First find all instructor IDs
  const instructors = await User.findAll({
    where: { collegeId, role: 'instructor' },
    attributes: ['id']
  });
  const instructorIds = instructors.map(i => i.id);

  let activeTests = 0;
  let testsCreated = 0;

  if (instructorIds.length > 0) {
    activeTests = await Test.count({ where: { instructorId: { [Op.in]: instructorIds }, status: 'published' } });
    testsCreated = await Test.count({ where: { instructorId: { [Op.in]: instructorIds } } });
  }

  // 4. Attempts & Scores
  // Find all students of this college
  const students = await User.findAll({
    where: { collegeId, role: 'student' },
    attributes: ['id'],
    include: [{
      model: Attempt,
      attributes: ['totalScore'],
      required: false
    }]
  });

  let totalAttempts = 0;
  let totalScoreSum = 0;
  let highPerformers = 0; // >= 80%
  let mediumPerformers = 0; // 50-79%
  let lowPerformers = 0; // < 50%

  students.forEach(student => {
    const attempts = student.Attempts || [];
    totalAttempts += attempts.length;

    if (attempts.length > 0) {
      const studentTotal = attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
      const studentAvg = studentTotal / attempts.length;
      totalScoreSum += studentAvg; // Sum of averages for overall average

      if (studentAvg >= 80) highPerformers++;
      else if (studentAvg >= 50) mediumPerformers++;
      else lowPerformers++;
    }
  });

  const avgScore = students.length > 0 && totalAttempts > 0 ? (totalScoreSum / students.filter(s => s.Attempts?.length > 0).length) : 0;

  // Completion rate (rough estimate: attempts / (students * active_tests))
  // Avoid division by zero
  const possibleAttempts = totalStudents * activeTests;
  const completionRate = possibleAttempts > 0 ? (totalAttempts / possibleAttempts) * 100 : 0;

  return {
    collegeName: college?.name,
    totalStudents,
    totalInstructors,
    activeTests,
    testsCreated,
    totalAttempts,
    avgScore,
    completionRate,
    highPerformers,
    mediumPerformers,
    lowPerformers
  };
}

async function getCollegeReport(collegeId, { dateFrom, dateTo } = {}) {
  try {
    console.log('getCollegeReport called with:', { collegeId, dateFrom, dateTo });
    const { Test, Attempt, Question } = require('../models');

    // Date filter for attempts
    const attemptWhere = {};
    if (dateFrom && dateTo) {
      attemptWhere.createdAt = {
        [Op.between]: [new Date(dateFrom), new Date(dateTo + 'T23:59:59.999Z')]
      };
    } else if (dateFrom) {
      attemptWhere.createdAt = { [Op.gte]: new Date(dateFrom) };
    } else if (dateTo) {
      attemptWhere.createdAt = { [Op.lte]: new Date(dateTo + 'T23:59:59.999Z') };
    }
    console.log('Attempt where clause:', attemptWhere);

    // 1. Total Students
    const totalStudents = await User.count({ where: { collegeId, role: 'student' } });

    // 2. Get all students with their attempts within date range
    const students = await User.findAll({
      where: { collegeId, role: 'student' },
      attributes: ['id'],
      include: [{
        model: Attempt,
        as: 'Attempts',
        where: attemptWhere,
        required: false, // Include students even if they have no attempts in range
        include: [{
          model: Test,
          attributes: ['title', 'totalMarks'] // Include totalMarks to calculate percentage
        }]
      }]
    });

    let totalTests = 0;
    let totalScoreSum = 0;
    let passedTests = 0;

    let excellent = 0; // 80%+
    let good = 0; // 60-80%
    let average = 0; // 40-60%
    let belowAverage = 0; // <40%

    // Test-wise stats aggregation
    const testMap = {};

    students.forEach(student => {
      const attempts = student.Attempts || [];

      // Calculate student average for performance breakdown
      if (attempts.length > 0) {
        const studentScores = attempts.map(a => {
          const totalMarks = a.Test?.totalMarks || 100;
          return (a.totalScore / totalMarks) * 100;
        });
        const studentAvg = studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length;

        if (studentAvg >= 80) excellent++;
        else if (studentAvg >= 60) good++;
        else if (studentAvg >= 40) average++;
        else belowAverage++;
      }

      attempts.forEach(attempt => {
        totalTests++;

        // Convert raw score to percentage
        const totalMarks = attempt.Test?.totalMarks || 100;
        const scorePercentage = (attempt.totalScore / totalMarks) * 100;
        totalScoreSum += scorePercentage;

        // Check pass/fail - using default passing score of 40%
        if (scorePercentage >= 40) {
          passedTests++;
        }

        // Aggregate test-wise stats
        if (attempt.Test) {
          const testName = attempt.Test.title;
          if (!testMap[testName]) {
            testMap[testName] = { testName, attempts: 0, totalScore: 0 };
          }
          testMap[testName].attempts++;
          testMap[testName].totalScore += scorePercentage;
        }
      });
    });

    const avgScore = totalTests > 0 ? totalScoreSum / totalTests : 0;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Format test stats
    const testStats = Object.values(testMap).map(t => ({
      testName: t.testName,
      attempts: t.attempts,
      avgScore: t.attempts > 0 ? t.totalScore / t.attempts : 0
    })).sort((a, b) => b.attempts - a.attempts); // Sort by most attempted

    return {
      totalStudents,
      totalTests,
      avgScore,
      passRate,
      excellent,
      good,
      average,
      belowAverage,
      testStats
    };
  } catch (error) {
    console.error('Error in getCollegeReport:', error);
    throw error;
  }
}

module.exports = { getPendingUsers, approveUser, findById, findStudentsByCollege, getCollegeStats, getCollegeReport };
