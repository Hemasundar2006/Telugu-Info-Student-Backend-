const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/adminAuth');
const {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  checkMatchingStudents,
} = require('../controllers/adminJobController');

// All routes are protected with adminAuth middleware

// POST /api/admin/jobs - Create job and auto-notify
router.post('/jobs', adminAuth, createJob);

// GET /api/admin/jobs - Get all jobs with filters
router.get('/jobs', adminAuth, getAllJobs);

// GET /api/admin/jobs/:jobId - Get single job
router.get('/jobs/:jobId', adminAuth, getJobById);

// PUT /api/admin/jobs/:jobId - Update job
router.put('/jobs/:jobId', adminAuth, updateJob);

// DELETE /api/admin/jobs/:jobId - Soft delete job
router.delete('/jobs/:jobId', adminAuth, deleteJob);

// POST /api/admin/jobs/check-matching - Check matching students count
router.post('/jobs/check-matching', adminAuth, checkMatchingStudents);

module.exports = router;
