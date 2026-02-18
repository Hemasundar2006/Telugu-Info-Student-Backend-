const Company = require('../models/CompanyModel');
const User = require('../models/UserModel');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/companies/search
 * Query: q, industry, location, verificationStatus (PENDING/VERIFIED/REJECTED), page, limit
 * Access: ADMIN / SUPER_ADMIN (typically for approval dashboard)
 */
exports.searchCompanies = asyncHandler(async (req, res) => {
  const { q, industry, location, verificationStatus, page = 1, limit = 10 } =
    req.query;

  const filter = {};

  if (industry) {
    filter.industry = industry;
  }

  if (location) {
    // match city/state/country substrings in headquarters or companySize fallback location-like fields
    const regex = new RegExp(location, 'i');
    filter.$or = [
      { 'headquarters.city': regex },
      { 'headquarters.state': regex },
      { 'headquarters.country': regex },
      { companySize: regex },
    ];
  }

  if (verificationStatus) {
    // incoming value is PENDING/VERIFIED/REJECTED, model uses lowercase
    filter.verificationStatus = verificationStatus.toLowerCase();
  }

  if (q) {
    const regex = new RegExp(q, 'i');
    filter.$or = [
      ...(filter.$or || []),
      { companyName: regex },
      { about: regex },
      { products: regex },
      { tagline: regex },
    ];
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [total, companies] = await Promise.all([
    Company.countDocuments(filter),
    Company.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
  ]);

  res.json({
    success: true,
    page: pageNum,
    pages: Math.ceil(total / limitNum) || 1,
    count: companies.length,
    total,
    data: companies.map((c) => ({
      companyId: c._id,
      companyName: c.companyName,
      email: c.email,
      phoneNumber: c.phoneNumber,
      industry: c.industry,
      companySize: c.companySize,
      website: c.website,
      verificationStatus: c.verificationStatus,
      verifiedBy: c.verifiedBy,
      verifiedAt: c.verifiedAt,
      createdAt: c.createdAt,
    })),
  });
});

/**
 * GET /api/companies/me
 * Return the company linked to the logged-in recruiter (role = COMPANY).
 * If none exists yet, auto-create a minimal pending profile so it can go for approval.
 * Access: COMPANY
 */
exports.getMyCompany = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  let company = await Company.findOne({ userId });

  if (!company) {
    // Auto-create a minimal pending company profile for this recruiter
    company = await Company.create({
      userId,
      email: req.user.email,
      phoneNumber: req.user.phone,
      accountType: 'company',
      companyName: req.body.companyName || req.user.name || undefined,
      verificationStatus: 'pending',
    });
  }

  res.json({
    success: true,
    data: company,
  });
});

/**
 * PUT /api/companies/me
 * Update the company profile linked to the logged-in recruiter.
 * After a company has been approved (verified), any profile edit will reset
 * verificationStatus back to pending so that SUPER_ADMIN can re-approve.
 * Access: COMPANY
 */
exports.updateMyCompany = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  let company = await Company.findOne({ userId });

  if (!company) {
    // Ensure a base company exists before updating
    company = await Company.create({
      userId,
      email: req.user.email,
      phoneNumber: req.user.phone,
      accountType: 'company',
      companyName: req.body.companyName || req.user.name || undefined,
      verificationStatus: 'pending',
    });
  }

  const payload = { ...req.body };

  // Prevent client from manually changing verification fields or ownership
  ['verificationStatus', 'verifiedBy', 'verifiedAt', 'verificationNote', 'userId', 'email'].forEach(
    (field) => {
      if (field in payload) {
        delete payload[field];
      }
    }
  );

  // If this company is already verified and they edit profile, move back to pending
  if (company.verificationStatus === 'verified') {
    payload.verificationStatus = 'pending';
    payload.verifiedBy = undefined;
    payload.verifiedAt = undefined;
  }

  const updated = await Company.findOneAndUpdate(
    { userId },
    { $set: payload },
    { new: true, runValidators: true }
  );

  // Sync recruiter profile photo to User.profileImage so it shows as author avatar on posts
  if (updated.recruiter?.photo) {
    await User.findByIdAndUpdate(userId, {
      profileImage: updated.recruiter.photo.trim(),
    });
  }

  res.json({
    success: true,
    message:
      company.verificationStatus === 'verified'
        ? 'Profile updated. Verification set to pending for re-approval.'
        : 'Profile updated successfully.',
    data: updated,
  });
});

/**
 * POST /api/companies/:companyId/verify
 * Body: { verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED', reason?: string }
 * Access: SUPER_ADMIN only
 */
exports.verifyCompany = asyncHandler(async (req, res, next) => {
  const { companyId } = req.params;
  const { verificationStatus, reason } = req.body || {};

  if (!verificationStatus) {
    const err = new Error('verificationStatus is required');
    err.statusCode = 400;
    return next(err);
  }

  const allowed = ['PENDING', 'VERIFIED', 'REJECTED'];
  if (!allowed.includes(verificationStatus)) {
    const err = new Error(
      `verificationStatus must be one of ${allowed.join(', ')}`
    );
    err.statusCode = 400;
    return next(err);
  }

  const mappedStatus = verificationStatus.toLowerCase(); // -> pending/verified/rejected

  const company = await Company.findById(companyId);

  if (!company) {
    const err = new Error('Company not found');
    err.statusCode = 404;
    return next(err);
  }

  company.verificationStatus = mappedStatus;

  if (mappedStatus === 'verified') {
    company.verifiedBy = req.user._id;
    company.verifiedAt = new Date();
  } else {
    company.verifiedBy = undefined;
    company.verifiedAt = undefined;
  }

  if (typeof reason === 'string' && reason.trim()) {
    company.verificationNote = reason.trim();
  }

  await company.save();

  res.json({
    success: true,
    data: company,
    message:
      mappedStatus === 'verified'
        ? 'Company approved successfully'
        : mappedStatus === 'rejected'
        ? 'Company rejected'
        : 'Company set to pending',
    reason: reason || undefined,
  });
});

