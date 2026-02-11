const Company = require('../models/CompanyModel');
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
 * POST /api/companies/:companyId/verify
 * Body: { verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED', reason?: string }
 * Access: ADMIN / SUPER_ADMIN
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

  const company = await Company.findByIdAndUpdate(
    companyId,
    {
      verificationStatus: mappedStatus,
    },
    { new: true }
  );

  if (!company) {
    const err = new Error('Company not found');
    err.statusCode = 404;
    return next(err);
  }

  // Optionally you could log activity here later

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

