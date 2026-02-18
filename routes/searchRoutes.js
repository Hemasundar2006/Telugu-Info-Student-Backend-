const express = require('express');
const { protect } = require('../middleware/auth');
const { searchPeople } = require('../controllers/searchController');

const router = express.Router();

// All search routes require authentication
router.use(protect);

// Global people search (users + companies)
router.get('/people', searchPeople);

module.exports = router;

