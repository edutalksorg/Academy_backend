const { Attempt, AttemptAnswer, Question, Option, Test, sequelize } = require('../models');

async function startAttempt(testId, userId, timeLimitMinutes) {
  const startedAt = new Date();
  const expiresAt = timeLimitMinutes ? new Date(startedAt.getTime() + timeLimitMinutes * 60000) : null;
  const attempt = await Attempt.create({ testId, userId, startedAt, status: 'in-progress' });
  return attempt;
}

async function submitAttempt(attemptId, answers) {
  return sequelize.transaction(async (t) => {
    const attempt = await Attempt.findByPk(attemptId, {
      include: [{ model: Test, include: [{ model: Question, include: [Option] }] }],
      transaction: t
    });
    if (!attempt) throw { status: 404, message: 'Attempt not found' };
    if (attempt.status === 'completed') throw { status: 400, message: 'Attempt already completed' };

    let total = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    const questionResults = [];

    for (const ans of answers) {
      const q = await Question.findByPk(ans.questionId, {
        include: [Option],
        transaction: t
      });
      const selected = ans.selectedOptionId ? await Option.findByPk(ans.selectedOptionId, { transaction: t }) : null;
      const correctOption = q.Options.find(opt => opt.isCorrect);
      const isCorrect = selected ? !!selected.isCorrect : false;
      const marksAwarded = isCorrect ? (q.marks || 1) : 0;
      total += marksAwarded;

      if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      // Store detailed result for this question
      questionResults.push({
        questionId: q.id,
        questionText: q.text,
        options: q.Options.map(opt => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect
        })),
        selectedOptionId: ans.selectedOptionId || null,
        correctOptionId: correctOption ? correctOption.id : null,
        isCorrect,
        marksAwarded
      });

      await AttemptAnswer.create({ attemptId, questionId: q.id, selectedOptionId: ans.selectedOptionId || null, isCorrect, marksAwarded }, { transaction: t });
    }

    attempt.totalScore = total;
    attempt.status = 'completed';
    attempt.completedAt = new Date();
    await attempt.save({ transaction: t });

    // Return attempt with additional calculated fields and detailed results
    return {
      ...attempt.toJSON(),
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      questionResults
    };
  });
}

async function getAttemptsByUser(userId, { limit = 50, offset = 0 } = {}) {
  return Attempt.findAndCountAll({
    where: { userId },
    limit,
    offset,
    include: [{
      model: Test,
      include: [{ model: Question }] // Include questions to calculate total valid score
    }],
    order: [['createdAt', 'DESC']]
  });
}

async function getResultsByTest(testId) {
  return Attempt.findAll({ where: { testId, status: 'completed' }, include: [{ model: AttemptAnswer }] });
}

async function incrementTabSwitches(attemptId) {
  const attempt = await Attempt.findByPk(attemptId);
  if (!attempt) throw { status: 404, message: 'Attempt not found' };
  if (attempt.status !== 'in-progress') throw { status: 400, message: 'Cannot track switches for completed attempt' };

  attempt.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;
  await attempt.save();
  return attempt;
}

module.exports = { startAttempt, submitAttempt, getAttemptsByUser, getResultsByTest, incrementTabSwitches };
