const { Attempt, AttemptAnswer, Question, Option, Test, sequelize } = require('../models');

async function startAttempt(testId, userId, timeLimitMinutes) {
  const startedAt = new Date();
  const expiresAt = timeLimitMinutes ? new Date(startedAt.getTime() + timeLimitMinutes * 60000) : null;
  const attempt = await Attempt.create({ testId, userId, startedAt, status: 'in-progress' });
  return attempt;
}

async function submitAttempt(attemptId, answers) {
  return sequelize.transaction(async (t) => {
    const attempt = await Attempt.findByPk(attemptId, { transaction: t });
    if (!attempt) throw { status: 404, message: 'Attempt not found' };
    if (attempt.status === 'completed') throw { status: 400, message: 'Attempt already completed' };

    let total = 0;
    for (const ans of answers) {
      const q = await Question.findByPk(ans.questionId, { transaction: t });
      const selected = ans.selectedOptionId ? await Option.findByPk(ans.selectedOptionId, { transaction: t }) : null;
      const isCorrect = selected ? !!selected.isCorrect : false;
      const marksAwarded = isCorrect ? q.marks : 0;
      total += marksAwarded;
      await AttemptAnswer.create({ attemptId, questionId: q.id, selectedOptionId: ans.selectedOptionId || null, isCorrect, marksAwarded }, { transaction: t });
    }

    attempt.totalScore = total;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    await attempt.save({ transaction: t });
    return attempt;
  });
}

async function getAttemptsByUser(userId, { limit = 50, offset = 0 } = {}) {
  return Attempt.findAndCountAll({ where: { userId }, limit, offset, include: [Test] });
}

async function getResultsByTest(testId) {
  return Attempt.findAll({ where: { testId, status: 'completed' }, include: [ { model: AttemptAnswer } ] });
}

module.exports = { startAttempt, submitAttempt, getAttemptsByUser, getResultsByTest };
