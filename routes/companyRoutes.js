const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { companySearchSchema } = require('../validators/companyValidator');
const {
  searchCompanies,
  getMyCompany,
} = require('../controllers/companyController');

const router = express.Router();

// GET /api/companies/search
// Used by admin / super-admin dashboard to list companies by verification status, etc.
router.get(
  '/search',
  protect,
  authorize('ADMIN', 'SUPER_ADMIN'),
  validate(companySearchSchema, 'query'),
  searchCompanies
);

// GET /api/companies/me
// Recruiter/Company account can fetch (or auto-create) its own company profile
router.get('/me', protect, authorize('COMPANY'), getMyCompany);

module.exports = router;

