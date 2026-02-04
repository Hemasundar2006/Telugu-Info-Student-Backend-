const Joi = require('joi');

const createTicketSchema = Joi.object({
  title: Joi.string().required().trim(),
  description: Joi.string().trim().allow('').optional(),
});

const idParamSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
});

const completeTicketSchema = Joi.object({
  resolutionNote: Joi.string().trim().allow('').optional(),
});

module.exports = { createTicketSchema, idParamSchema, completeTicketSchema };
