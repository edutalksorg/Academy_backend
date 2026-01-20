const attemptService = require('../services/attempt.service');

async function start(req, res, next) {
  try {
    const testId = parseInt(req.params.testId, 10);
    const attempt = await attemptService.startAttempt(testId, req.user.id);
    res.status(201).json({ success: true, data: attempt });
  } catch (err) { next(err); }
}

async function submit(req, res, next) {
  try {
    const attemptId = parseInt(req.params.attemptId, 10);
    const { answers } = req.body; // [{questionId, selectedOptionId, answerText}, ...]
    const result = await attemptService.submitAttempt(attemptId, answers || []);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function myAttempts(req, res, next) {
  try {
    const data = await attemptService.getAttemptsByUser(req.user.id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
}

async function recordTabSwitch(req, res, next) {
  try {
    const attemptId = parseInt(req.params.attemptId, 10);
    const attempt = await attemptService.incrementTabSwitches(attemptId);
    res.json({ success: true, data: { tabSwitchCount: attempt.tabSwitchCount } });
  } catch (err) { next(err); }
}

module.exports = { start, submit, myAttempts, recordTabSwitch };
