const { Test, Question, Option } = require('../models');

async function createTest({ title, description, instructorId, collegeId, timeLimit, status = 'draft' }) {
  return Test.create({ title, description, instructorId, collegeId, timeLimit, status });
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

const { Op } = require('sequelize');

async function listPublishedTests({ collegeId, q, limit = 50, offset = 0 } = {}) {
  const where = { status: 'published' };
  if (collegeId) where.collegeId = collegeId;
  if (q) {
    where[Op.or] = [
      { title: { [Op.like]: `%${q}%` } },
      { description: { [Op.like]: `%${q}%` } }
    ];
  }
  return Test.findAndCountAll({ where, limit, offset, include: [{ model: Question, include: [Option] }] });
}

module.exports = { createTest, updateTest, deleteTest, addQuestionWithOptions, getTestWithQuestions, listPublishedTests };

