const Joi = require('joi');

const registerSchema = Joi.object({
  // Common fields for all accounts
  name: Joi.string().required().trim(), // recruiter / user name
  phone: Joi.string().required().trim().pattern(/^\d{10}$/).message('Phone must be exactly 10 digits'),
  state: Joi.string().valid('AP', 'TS').default('AP'),
  role: Joi.string()
    .valid('USER', 'COMPANY', 'SUPPORT', 'ADMIN', 'SUPER_ADMIN')
    .default('USER'),
  // Extra field for recruiter/company accounts
  companyName: Joi.string()
    .trim()
    .when('role', {
      is: 'COMPANY',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  // For recruiters/companies we want a proper company email + password
  // For students (USER) we need email to create Student profile for job notifications
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .when('role', {
      is: Joi.valid('COMPANY', 'USER'),
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  password: Joi.string()
    .min(6)
    .when('role', {
      is: 'COMPANY',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  // For students (USER): qualification is required so job notifications can target by qualification
  qualification: Joi.string()
    .valid('10th', '12th', 'Diploma', 'B.Tech', 'B.Sc', 'B.Com', 'B.A', 'MBA', 'M.Tech')
    .when('role', {
      is: 'USER',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().trim().lowercase().optional(),
  password: Joi.string().when('email', { is: Joi.exist(), then: Joi.required(), otherwise: Joi.optional() }),
  phone: Joi.string().trim().optional(),
}).or('email', 'phone'); // at least one of email or phone

module.exports = { registerSchema, loginSchema };
