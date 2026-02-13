const JobPosting = require('../models/JobPosting');
const Student = require('../models/Student');
const asyncHandler = require('../middleware/asyncHandler');
const { notifyStudentsForJob } = require('../services/notificationService');

/**
 * POST /api/admin/jobs
 * Create a new job posting and auto-notify matching students
 */
exports.createJob = asyncHandler(async (req, res, next) => {
  const {
    jobTitle,
    organization,
    jobCategory,
    jobType,
    jobDescription,
    targetQualifications,
    qualifications,
    experience,
    skillsRequired,
    preferredSkills,
    ageLimit,
    categoryEligibility,
    totalPositions,
    lastApplicationDate,
    govtJobFields,
    privateJobFields,
    status,
    featured,
    tags,
  } = req.body;

  // Validate required fields
  if (!jobTitle || !organization || !jobCategory || !targetQualifications || !totalPositions || !lastApplicationDate) {
    const err = new Error('Missing required fields');
    err.statusCode = 400;
    return next(err);
  }

  // Validate targetQualifications has at least one item
  if (!Array.isArray(targetQualifications) || targetQualifications.length === 0) {
    const err = new Error('At least one target qualification must be selected');
    err.statusCode = 400;
    return next(err);
  }

  // Validate lastApplicationDate is in the future
  const lastDate = new Date(lastApplicationDate);
  if (lastDate <= new Date()) {
    const err = new Error('Last application date must be in the future');
    err.statusCode = 400;
    return next(err);
  }

  // Create job posting
  const jobData = {
    jobTitle,
    organization,
    jobCategory,
    jobType: jobType || 'Full-time',
    jobDescription,
    targetQualifications,
    qualifications: qualifications || [],
    experience: experience || { min: 0 },
    skillsRequired: skillsRequired || [],
    preferredSkills: preferredSkills || [],
    ageLimit: ageLimit || {},
    categoryEligibility: categoryEligibility || ['General'],
    totalPositions,
    lastApplicationDate: lastDate,
    status: status || 'Active',
    featured: featured || false,
    tags: tags || [],
    postedBy: req.admin._id,
  };

  // Add conditional fields based on job category
  if (jobCategory === 'Government') {
    if (!govtJobFields) {
      const err = new Error('Government job fields are required');
      err.statusCode = 400;
      return next(err);
    }
    jobData.govtJobFields = govtJobFields;
  } else if (jobCategory === 'Private') {
    if (!privateJobFields) {
      const err = new Error('Private job fields are required');
      err.statusCode = 400;
      return next(err);
    }
    jobData.privateJobFields = privateJobFields;
  }

  // Create the job
  const job = new JobPosting(jobData);
  await job.save();

  // Auto-notify matching students
  let notificationResult;
  try {
    notificationResult = await notifyStudentsForJob(job);
  } catch (error) {
    console.error('Error notifying students:', error);
    // Job is created, but notification failed - still return success
    notificationResult = {
      success: false,
      notified: 0,
      message: 'Job created but notification failed',
    };
  }

  res.status(201).json({
    success: true,
    message: `Job posted successfully! Notified ${notificationResult.notified} students via dashboard`,
    jobId: job.jobId,
    totalNotified: notificationResult.notified,
    job: job,
  });
});

/**
 * GET /api/admin/jobs
 * Get all jobs with filters and pagination
 */
exports.getAllJobs = asyncHandler(async (req, res, next) => {
  const { category, status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = {};
  if (category) {
    filter.jobCategory = category;
  }
  if (status) {
    filter.status = status;
  }

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Get jobs
  const jobs = await JobPosting.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('postedBy', 'name email')
    .select('-__v');

  // Get total count
  const totalJobs = await JobPosting.countDocuments(filter);

  res.json({
    success: true,
    jobs: jobs.map((job) => ({
      jobId: job.jobId,
      jobTitle: job.jobTitle,
      organization: job.organization,
      jobCategory: job.jobCategory,
      totalNotified: job.notificationTracking?.totalStudentsMatched || 0,
      status: job.status,
      createdAt: job.createdAt,
    })),
    totalJobs,
    currentPage: pageNum,
    totalPages: Math.ceil(totalJobs / limitNum),
  });
});

/**
 * GET /api/admin/jobs/:jobId
 * Get single job with notification status
 */
exports.getJobById = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await JobPosting.findOne({ jobId })
    .populate('postedBy', 'name email')
    .populate('notificationTracking.notificationSentTo', 'name email qualification');

  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    return next(err);
  }

  res.json({
    success: true,
    job: job,
    notificationStatus: {
      totalSent: job.notificationTracking?.notificationSentTo?.length || 0,
      sentDate: job.notificationTracking?.notificationSentDate || null,
      totalMatched: job.notificationTracking?.totalStudentsMatched || 0,
    },
  });
});

/**
 * PUT /api/admin/jobs/:jobId
 * Update job posting
 */
exports.updateJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await JobPosting.findOne({ jobId });

  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    return next(err);
  }

  // Update allowed fields
  const allowedUpdates = [
    'jobTitle',
    'organization',
    'jobType',
    'jobDescription',
    'targetQualifications',
    'qualifications',
    'experience',
    'skillsRequired',
    'preferredSkills',
    'ageLimit',
    'categoryEligibility',
    'totalPositions',
    'lastApplicationDate',
    'govtJobFields',
    'privateJobFields',
    'status',
    'featured',
    'tags',
  ];

  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'govtJobFields' || field === 'privateJobFields') {
        job[field] = { ...job[field], ...req.body[field] };
      } else {
        job[field] = req.body[field];
      }
    }
  });

  // Validate lastApplicationDate if updated
  if (req.body.lastApplicationDate) {
    const lastDate = new Date(req.body.lastApplicationDate);
    if (lastDate <= new Date()) {
      const err = new Error('Last application date must be in the future');
      err.statusCode = 400;
      return next(err);
    }
    job.lastApplicationDate = lastDate;
  }

  await job.save();

  res.json({
    success: true,
    message: 'Job updated successfully',
    job: job,
  });
});

/**
 * DELETE /api/admin/jobs/:jobId
 * Soft delete job (set status to Inactive)
 */
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const { jobId } = req.params;

  const job = await JobPosting.findOne({ jobId });

  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404;
    return next(err);
  }

  // Soft delete: set status to Closed
  job.status = 'Closed';
  await job.save();

  res.json({
    success: true,
    message: 'Job deleted successfully',
  });
});

/**
 * POST /api/admin/jobs/check-matching
 * Check how many students match before posting
 */
exports.checkMatchingStudents = asyncHandler(async (req, res, next) => {
  const { targetQualifications } = req.body;

  if (!targetQualifications || !Array.isArray(targetQualifications) || targetQualifications.length === 0) {
    const err = new Error('targetQualifications array is required');
    err.statusCode = 400;
    return next(err);
  }

  // Find matching students
  const matchingCount = await Student.countDocuments({
    qualification: { $in: targetQualifications },
    status: 'Active',
    'jobAlerts.enabled': true,
  });

  res.json({
    success: true,
    matchingCount: matchingCount,
    message: `This job will notify ${matchingCount} students`,
  });
});
