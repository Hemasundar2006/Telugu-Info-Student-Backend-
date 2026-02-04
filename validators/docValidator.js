const Joi = require('joi');

const uploadSchema = Joi.object({
  title: Joi.string().required().trim(),
  docType: Joi.string().valid('HALL_TICKET', 'RESULT', 'ROADMAP').required(),
  state: Joi.string().valid('AP', 'TS').required(),
  fileUrl: Joi.string().uri().optional(), // if client uploads URL directly
});

const approveParamsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

module.exports = { uploadSchema, approveParamsSchema };
