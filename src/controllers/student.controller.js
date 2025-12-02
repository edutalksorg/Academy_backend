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
            const totalScore = attempts
                .filter(a => a.status === 'completed')
                .reduce((sum, a) => sum + (a.totalScore || 0), 0);
            avgScore = totalScore / completedTests;
        }

        // Get available tests count
        // Assuming listPublishedTests returns { count, rows }
        const publishedTests = await testService.listPublishedTests({ limit: 1 });
        const availableTests = publishedTests.count;

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
