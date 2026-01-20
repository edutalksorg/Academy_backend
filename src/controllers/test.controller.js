const testService = require('../services/test.service');

async function createTest(req, res, next) {
  try {
    const body = req.validatedBody || req.body;
    const payload = { ...body, instructorId: req.user.id };
    const test = await testService.createTest(payload);
    res.status(201).json({ success: true, data: test });
  } catch (err) { next(err); }
}

async function updateTest(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await testService.updateTest(id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
}

async function deleteTest(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await testService.deleteTest(id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) { next(err); }
}

async function deleteQuestion(req, res, next) {
  try {
    const id = parseInt(req.params.questionId, 10);
    await testService.deleteQuestion(id);
    res.json({ success: true, message: 'Question deleted' });
  } catch (err) { next(err); }
}

async function addQuestion(req, res, next) {
  try {
    const testId = parseInt(req.params.testId, 10);
    const body = req.validatedBody || req.body;
    const { questionText, options, marks, type, description, constraints, codeTemplate, language, testCases } = body;
    const q = await testService.addQuestionWithOptions(testId, {
      text: questionText, marks: marks || 1, options,
      type, description, constraints, codeTemplate, language, testCases
    });
    res.status(201).json({ success: true, data: q });
  } catch (err) { next(err); }
}

async function getTest(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const t = await testService.getTestWithQuestions(id);
    res.json({ success: true, data: t });
  } catch (err) { next(err); }
}

async function listPublished(req, res, next) {
  try {
    const { collegeId, limit = 50, offset = 0, q } = req.query;
    const data = await testService.listPublishedTests({ collegeId, q, limit: parseInt(limit, 10), offset: parseInt(offset, 10) });
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function listMyTests(req, res, next) {
  try {
    const instructorId = req.user.id;
    const tests = await testService.listTestsByInstructor(instructorId);
    res.json({ success: true, data: tests });
  } catch (err) { next(err); }
}

module.exports = { createTest, updateTest, deleteTest, deleteQuestion, addQuestion, getTest, listPublished, listMyTests };
