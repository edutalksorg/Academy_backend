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
const addQuestionSchema = Joi.object({ questionText: Joi.string().required(), marks: Joi.number().integer().min(0).default(1), options: Joi.array().items(Joi.object({ text: Joi.string().required(), isCorrect: Joi.boolean().default(false) })).min(2).required() });

router.post('/', validateBody(createTestSchema), testController.createTest);
router.put('/:id', testController.updateTest);
router.delete('/:id', testController.deleteTest);
router.post('/:testId/questions', validateBody(addQuestionSchema), testController.addQuestion);

module.exports = router;
