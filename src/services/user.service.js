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

  // Send email notification to user for instructor/TPO approval
  if (user.role === 'instructor' || user.role === 'tpo') {
    const emailService = require('./email.service');

    // Send notification (non-blocking - don't wait for email to complete)
    emailService.sendApprovalNotificationToUser(user)
      .catch(err => console.error('Approval email notification failed:', err.message));
  }

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
  const { College, Test, Attempt, Question } = require('../models');

  // 1. College Info
  const college = await College.findByPk(collegeId);

  // 2. Students & Instructors counts
  const totalStudents = await User.count({ where: { collegeId, role: 'student' } });
  const totalInstructors = await User.count({ where: { collegeId, role: 'instructor' } });

  // 3. Tests created by instructors of this college
  const instructors = await User.findAll({
    where: { collegeId, role: 'instructor' },
    attributes: ['id']
  });
  const instructorIds = instructors.map(i => i.id);

  let activeTests = 0;
  let testsCreated = 0;
  let instructorTests = [];

  if (instructorIds.length > 0) {
    activeTests = await Test.count({ where: { instructorId: { [Op.in]: instructorIds }, status: 'published' } });
    testsCreated = await Test.count({ where: { instructorId: { [Op.in]: instructorIds } } });

    // Fetch tests to get totalMarks
    instructorTests = await Test.findAll({
      where: { instructorId: { [Op.in]: instructorIds } },
      attributes: ['id', 'totalMarks'],
      include: [{
        model: Question,
        attributes: ['marks']
      }]
    });
  }

  // Create map for test total marks
  const testMap = {};
  instructorTests.forEach(t => {
    let calculatedMarks = t.totalMarks;
    if (!calculatedMarks || calculatedMarks === 0) {
      calculatedMarks = t.Questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || 100;
    }
    testMap[t.id] = calculatedMarks > 0 ? calculatedMarks : 100;
  });

  // 4. Attempts & Scores
  const students = await User.findAll({
    where: { collegeId, role: 'student' },
    attributes: ['id'],
    include: [{
      model: Attempt,
      attributes: ['totalScore', 'testId'],
      required: false
    }]
  });

  let totalAttempts = 0;
  let totalScoreSum = 0; // Sum of percentages
  let highPerformers = 0; // >= 80%
  let mediumPerformers = 0; // 50-79% (User requested 50-80 range)
  let lowPerformers = 0; // < 50%

  students.forEach(student => {
    const attempts = student.Attempts || [];
    totalAttempts += attempts.length;

    if (attempts.length > 0) {
      const studentPercentages = attempts.map(a => {
        const totalMarks = testMap[a.testId] || 100; // Default to 100 if test not found (e.g. deleted)
        return (a.totalScore / totalMarks) * 100;
      });

      const studentAvg = studentPercentages.reduce((sum, p) => sum + p, 0) / studentPercentages.length;
      totalScoreSum += studentAvg;

      if (studentAvg >= 80) highPerformers++;
      else if (studentAvg >= 50) mediumPerformers++;
      else lowPerformers++;
    }
  });

  // Avg Score (Average of student averages)
  const studentsWithAttempts = students.filter(s => s.Attempts?.length > 0).length;
  const avgScore = studentsWithAttempts > 0 ? (totalScoreSum / studentsWithAttempts) : 0;

  // Completion rate: (total_attempts_by_students) / (total_students * active_tests)
  // Only count attempts on currently active tests for accuracy? 
  // For simplicity and consistency with previous logic, we use totalAttempts on *published* tests

  // Refined Completion Rate:
  // Count unique tests attempted by each student vs active tests? 
  // Let's stick to the previous formula but ensure safeguards
  const possibleAttempts = totalStudents * activeTests;
  const completionRate = possibleAttempts > 0 ? Math.min((totalAttempts / possibleAttempts) * 100, 100) : 0;

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

    // 1. Total Students
    const totalStudents = await User.count({ where: { collegeId, role: 'student' } });

    // 2. Get students with attempts
    const students = await User.findAll({
      where: { collegeId, role: 'student' },
      attributes: ['id'],
      include: [{
        model: Attempt,
        as: 'Attempts',
        where: attemptWhere,
        required: false,
        attributes: ['id', 'totalScore', 'testId', 'createdAt']
      }]
    });

    // 3. Fetch Test Details (Total Marks Correction)
    // Extract all unique test IDs from attempts
    const testIds = new Set();
    students.forEach(s => {
      if (s.Attempts) s.Attempts.forEach(a => testIds.add(a.testId));
    });

    const testMap = {}; // testId -> { title, totalMarks }
    if (testIds.size > 0) {
      const tests = await Test.findAll({
        where: { id: { [Op.in]: Array.from(testIds) } },
        attributes: ['id', 'title', 'totalMarks'],
        include: [{
          model: Question,
          attributes: ['marks']
        }]
      });

      tests.forEach(t => {
        // Calculate total marks from questions if test.totalMarks is 0 or missing
        let calculatedMarks = t.totalMarks;
        if (!calculatedMarks || calculatedMarks === 0) {
          calculatedMarks = t.Questions?.reduce((sum, q) => sum + (q.marks || 1), 0) || 100;
        }
        testMap[t.id] = {
          title: t.title,
          totalMarks: calculatedMarks > 0 ? calculatedMarks : 100
        };
      });
    }

    let totalTests = 0;
    let totalScoreSum = 0;
    let passedTests = 0;

    let excellent = 0; // 80%+
    let good = 0; // 60-80%
    let average = 0; // 40-60%
    let belowAverage = 0; // <40%

    const testStatsMap = {};

    students.forEach(student => {
      const attempts = student.Attempts || [];

      // Performance Breakdown (Student Level)
      if (attempts.length > 0) {
        const studentPercentages = attempts.map(a => {
          const testInfo = testMap[a.testId];
          const totalMarks = testInfo?.totalMarks || 100;
          return (a.totalScore / totalMarks) * 100;
        });

        const studentAvg = studentPercentages.reduce((sum, p) => sum + p, 0) / studentPercentages.length;

        if (studentAvg >= 80) excellent++;
        else if (studentAvg >= 60) good++;
        else if (studentAvg >= 40) average++;
        else belowAverage++;
      }

      // Aggregate Global Stats
      attempts.forEach(attempt => {
        const testInfo = testMap[attempt.testId];
        if (!testInfo) return; // Should not happen

        totalTests++;

        const totalMarks = testInfo.totalMarks;
        const scorePercentage = (attempt.totalScore / totalMarks) * 100;
        totalScoreSum += scorePercentage;

        if (scorePercentage >= 40) passedTests++;

        // Test-wise stats
        if (!testStatsMap[testInfo.title]) {
          testStatsMap[testInfo.title] = { testName: testInfo.title, attempts: 0, totalPercentage: 0 };
        }
        testStatsMap[testInfo.title].attempts++;
        testStatsMap[testInfo.title].totalPercentage += scorePercentage;
      });
    });

    const avgScore = totalTests > 0 ? totalScoreSum / totalTests : 0;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const testStats = Object.values(testStatsMap).map(t => ({
      testName: t.testName,
      attempts: t.attempts,
      avgScore: t.attempts > 0 ? t.totalPercentage / t.attempts : 0
    })).sort((a, b) => b.attempts - a.attempts);

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

async function deleteUser(id) {
  const user = await User.findByPk(id);
  if (!user) throw { status: 404, message: 'User not found' };

  await user.destroy();
  return { message: 'User deleted successfully' };
}

module.exports = { getPendingUsers, approveUser, findById, findStudentsByCollege, getCollegeStats, getCollegeReport, deleteUser };
