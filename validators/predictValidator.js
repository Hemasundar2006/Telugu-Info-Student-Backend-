const Joi = require('joi');

const predictSchema = Joi.object({
  rank: Joi.number().integer().min(1).required(),
  category: Joi.string().valid('OC', 'BC', 'SC', 'ST').required(),
  state: Joi.string().valid('AP', 'TS').required(),
  district: Joi.string().trim().optional(),
});

module.exports = { predictSchema };
