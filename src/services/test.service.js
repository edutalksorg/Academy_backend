const { Test, Question, Option, Attempt } = require('../models');
const { Op } = require('sequelize');

async function createTest({ title, description, instructorId, collegeId, timeLimit, status = 'draft', startTime, endTime }) {
  return Test.create({ title, description, instructorId, collegeId, timeLimit, status, startTime, endTime });
}

async function updateTest(id, payload) {
  const test = await Test.findByPk(id);
  if (!test) throw { status: 404, message: 'Test not found' };
  Object.assign(test, payload);
  await test.save();
  return test;
}

async function deleteTest(id) {
  const test = await Test.findByPk(id);
  if (!test) throw { status: 404, message: 'Test not found' };
  await test.destroy();
  return true;
}

async function addQuestionWithOptions(testId, { text, marks, options }) {
  const q = await Question.create({ testId, text, marks });
  const opts = options.map(o => ({ questionId: q.id, text: o.text, isCorrect: !!o.isCorrect }));
  await Option.bulkCreate(opts);
  return await Question.findByPk(q.id, { include: [Option] });
}

async function getTestWithQuestions(id) {
  return Test.findByPk(id, { include: [{ model: Question, include: [Option] }] });
}

async function listPublishedTests({ collegeId, q, limit = 50, offset = 0, userId } = {}) {
  const now = new Date();
  const where = {
    status: 'published',
    [Op.or]: [
      { endTime: null },
      { endTime: { [Op.gt]: now } }
    ]
  };

  if (collegeId) where.collegeId = collegeId;

  if (userId) {
    const completedAttempts = await Attempt.findAll({
      where: { userId, status: 'completed' },
      attributes: ['testId']
    });
    const completedTestIds = completedAttempts.map(a => a.testId);
    if (completedTestIds.length > 0) {
      where.id = { [Op.notIn]: completedTestIds };
    }
  }

  if (q) {
    where[Op.and] = [
      {
        [Op.or]: [
          { title: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } }
        ]
      }
    ];
  }
  return Test.findAndCountAll({ where, limit, offset, include: [{ model: Question, include: [Option] }] });
}

async function listTestsByInstructor(instructorId) {
  return Test.findAll({
    where: { instructorId },
    order: [['createdAt', 'DESC']],
    include: [{ model: Question }]
  });
}

async function getPublishedTestIds({ collegeId } = {}) {
  const now = new Date();
  const where = {
    status: 'published',
    [Op.or]: [
      { endTime: null },
      { endTime: { [Op.gt]: now } }
    ]
  };
  if (collegeId) where.collegeId = collegeId;
  return Test.findAll({
    where,
    attributes: ['id']
  });
}

module.exports = { createTest, updateTest, deleteTest, addQuestionWithOptions, getTestWithQuestions, listPublishedTests, listTestsByInstructor, getPublishedTestIds };
