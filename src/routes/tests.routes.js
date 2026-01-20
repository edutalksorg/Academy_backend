const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const authJwt = require('../middlewares/authJwt');
const roleCheck = require('../middlewares/roleCheck');

// management (instructor) - defined BEFORE generic /:id route
router.get('/my-tests', authJwt, roleCheck('instructor'), testController.listMyTests);

// public: list published tests
router.get('/', testController.listPublished);

router.get('/:id', testController.getTest);

// management (instructor)
router.use(authJwt, roleCheck('instructor'));
const validateBody = require('../middlewares/validateBody');
const Joi = require('joi');

const createTestSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow('', null),
    timeLimit: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('draft', 'published').default('draft'),
    startTime: Joi.date().allow(null),
    endTime: Joi.date().allow(null)
});
const addQuestionSchema = Joi.object({
    questionText: Joi.string().required(),
    marks: Joi.number().integer().min(0).default(1),
    type: Joi.string().valid('MCQ', 'CODING').default('MCQ'),
    // MCQ fields
    options: Joi.array().items(Joi.object({
        text: Joi.string().required(),
        isCorrect: Joi.boolean().default(false)
    })).when('type', {
        is: 'MCQ',
        then: Joi.array().min(2).required(),
        otherwise: Joi.optional()
    }),
    // Coding fields
    description: Joi.string().allow('', null),
    constraints: Joi.string().allow('', null),
    codeTemplate: Joi.string().allow('', null),
    language: Joi.string().default('javascript'),
    testCases: Joi.array().items(Joi.object({
        input: Joi.string().allow('', null),
        expectedOutput: Joi.string().allow('', null),
        explanation: Joi.string().allow('', null),
        isPublic: Joi.boolean().default(false)
    })).when('type', {
        is: 'CODING',
        then: Joi.array().required(),
        otherwise: Joi.optional()
    })
});

router.post('/', validateBody(createTestSchema), testController.createTest);
router.put('/:id', testController.updateTest);
router.delete('/:id', testController.deleteTest);
router.delete('/questions/:questionId', testController.deleteQuestion);
router.post('/:testId/questions', validateBody(addQuestionSchema), testController.addQuestion);

module.exports = router;
