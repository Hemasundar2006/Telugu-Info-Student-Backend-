const Joi = require('joi');

const registerSchema = Joi.object({
  name: Joi.string().required().trim(),
  phone: Joi.string().required().trim(),
  state: Joi.string().valid('AP', 'TS').default('AP'),
  role: Joi.string().valid('USER', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN').default('USER'),
  email: Joi.string().email().trim().lowercase().optional(),
  password: Joi.string().min(6).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().optional(),
  password: Joi.string().when('email', { is: Joi.exist(), then: Joi.required(), otherwise: Joi.optional() }),
  phone: Joi.string().trim().optional(),
}).or('email', 'phone'); // at least one of email or phone

module.exports = { registerSchema, loginSchema };
