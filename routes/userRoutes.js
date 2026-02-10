const express = require('express');
const {
  createUserProfile,
  getUserProfile,
  getUserProfiles,
  updateUserProfile,
  deleteUserProfile,
} = require('../controllers/userController');

const router = express.Router();

// Create profile
router.post('/', createUserProfile);

// List profiles (or query by email)
router.get('/', getUserProfiles);

// Get profile by id
router.get('/:id', getUserProfile);

// Partial update profile by id
router.patch('/:id', updateUserProfile);

// Delete profile by id
router.delete('/:id', deleteUserProfile);

module.exports = router;

