const Joi = require('joi');

function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) return res.status(400).json({ success: false, message: 'Validation error', errors: error.details });
    req.validatedBody = value;
    next();
  };
}

module.exports = validateBody;
