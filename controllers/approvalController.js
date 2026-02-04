const Document = require('../models/DocumentModel');
const asyncHandler = require('../middleware/asyncHandler');
const cloudinary = require('../config/cloudinary');
const { logActivity } = require('../middleware/activityLogger');

/**
 * POST /api/docs/upload
 * SUPPORT or SUPER_ADMIN only. Uploads file (Multer), then creates document with status PENDING.
 */
exports.uploadDocument = asyncHandler(async (req, res, next) => {
  let fileUrl = req.body.fileUrl; // optional: if client already has URL

  if (!fileUrl && (!req.file || !req.file.buffer)) {
    const err = new Error('Provide either a file upload or fileUrl');
    err.statusCode = 400;
    return next(err);
  }

  if (!fileUrl && process.env.CLOUDINARY_CLOUD_NAME && req.file?.buffer) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'telugu-info-docs', resource_type: 'auto' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      uploadStream.end(req.file.buffer);
    });
    fileUrl = result.secure_url;
  }

  if (!fileUrl) {
    const err = new Error('File upload failed. Configure Cloudinary or provide fileUrl.');
    err.statusCode = 400;
    return next(err);
  }

  const { title, docType, state } = req.body;
  const doc = await Document.create({
    title,
    fileUrl,
    docType,
    state,
    status: 'PENDING',
    uploadedBy: req.user._id,
  });

  // Log document upload activity
  await logActivity(req, 'DOCUMENT_UPLOAD', 'DOCUMENT', doc._id, `${req.user.name} uploaded document: ${title}`, { docType, state, status: 'PENDING' });

  res.status(201).json({ success: true, data: doc });
});

/**
 * GET /api/docs/pending
 * SUPER_ADMIN only. Returns all documents where status === PENDING.
 * RBAC ensures a student (USER) can never access this even with valid JWT.
 */
exports.getPendingDocuments = asyncHandler(async (req, res, next) => {
  const docs = await Document.find({ status: 'PENDING' })
    .populate('uploadedBy', 'name phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: docs.length, data: docs });
});

/**
 * PATCH /api/docs/:id/approve
 * SUPER_ADMIN only. Sets status to APPROVED and approvedBy to current user.
 */
exports.approveDocument = asyncHandler(async (req, res, next) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) {
    const err = new Error('Document not found');
    err.statusCode = 404;
    return next(err);
  }
  doc.status = 'APPROVED';
  doc.approvedBy = req.user._id;
  await doc.save();
  
  // Log document approval activity
  await logActivity(req, 'DOCUMENT_APPROVE', 'DOCUMENT', doc._id, `${req.user.name} approved document: ${doc.title}`, { docType: doc.docType, state: doc.state, uploadedBy: doc.uploadedBy });
  
  res.json({ success: true, data: doc });
});
