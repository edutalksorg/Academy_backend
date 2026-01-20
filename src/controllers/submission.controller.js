const submissionService = require('../services/submission.service');

async function runCode(req, res, next) {
    try {
        const { code, language, input } = req.body;
        const result = await submissionService.runCode({ code, language, input });
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

async function submitCode(req, res, next) {
    try {
        const { questionId, code, language } = req.body;
        const result = await submissionService.submitSolution({ questionId, code, language });
        res.json({ success: true, data: result });
    } catch (err) { next(err); }
}

module.exports = { runCode, submitCode };
