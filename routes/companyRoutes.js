const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { companySearchSchema } = require('../validators/companyValidator');
const { searchCompanies } = require('../controllers/companyController');

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

module.exports = router;

