const Joi = require('joi');

// Query validation for /api/companies/search
const companySearchSchema = Joi.object({
  q: Joi.string().trim().optional(),
  industry: Joi.string().trim().optional(),
  location: Joi.string().trim().optional(),
  verificationStatus: Joi.string()
    .valid('PENDING', 'VERIFIED', 'REJECTED')
    .insensitive()
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
});

module.exports = { companySearchSchema };

