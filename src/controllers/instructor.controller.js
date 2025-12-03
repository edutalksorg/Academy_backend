const { Test, Attempt } = require('../models');

async function getStats(req, res, next) {
    try {
        const instructorId = req.user.id;

        // Get all tests by this instructor
        const tests = await Test.findAll({
            where: { instructorId: instructorId }
        });

        const totalTests = tests.length;
        const publishedTests = tests.filter(t => t.status === 'published').length;

        // Get all attempts for these tests
        const testIds = tests.map(t => t.id);
        const attempts = await Attempt.findAll({
            where: { testId: testIds },
            attributes: ['totalScore']
        });

        const totalAttempts = attempts.length;
        const totalScore = attempts.reduce((sum, a) => sum + (a.totalScore || 0), 0);
        const avgScore = totalAttempts > 0 ? (totalScore / totalAttempts) : 0;

        res.json({
            success: true,
            data: {
                totalTests: totalTests,
                publishedTests: publishedTests,
                totalAttempts: totalAttempts,
                avgScore: avgScore
            }
        });
    } catch (err) {
        console.error('Error in getStats:', err);
        next(err);
    }
}

module.exports = { getStats };
