const attemptService = require('../services/attempt.service');
const testService = require('../services/test.service');

async function getStats(req, res, next) {
    try {
        const userId = req.user.id;

        // Get attempts
        const attemptsData = await attemptService.getAttemptsByUser(userId, { limit: 1000 }); // Get all for stats
        const attempts = attemptsData.rows;

        const completedTests = attempts.filter(a => a.status === 'completed').length;

        let avgScore = 0;
        if (completedTests > 0) {
            const totalPercentage = attempts
                .filter(a => a.status === 'completed')
                .reduce((sum, a) => {
                    const totalMarks = a.Test?.totalMarks || 100;
                    const percentage = (a.totalScore / totalMarks) * 100;
                    return sum + percentage;
                }, 0);
            avgScore = totalPercentage / completedTests;
        }

        // Get available tests count (Total Active Tests)
        const publishedTests = await testService.getPublishedTestIds();
        const availableTests = publishedTests.length;

        res.json({
            success: true,
            data: {
                completedTests,
                avgScore,
                availableTests
            }
        });
    } catch (err) {
        next(err);
    }
}

async function getRecentTests(req, res, next) {
    try {
        const userId = req.user.id;
        const attemptsData = await attemptService.getAttemptsByUser(userId, { limit: 5 });
        res.json({
            success: true,
            data: attemptsData.rows
        });
    } catch (err) {
        next(err);
    }
}

async function getAttempts(req, res, next) {
    try {
        const userId = req.user.id;
        const { limit, offset } = req.query;
        const attemptsData = await attemptService.getAttemptsByUser(userId, {
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        });
        res.json({
            success: true,
            data: attemptsData
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getStats,
    getRecentTests,
    getAttempts
};
