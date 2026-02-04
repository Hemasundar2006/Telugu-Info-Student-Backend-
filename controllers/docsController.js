const Document = require('../models/DocumentModel');
const asyncHandler = require('../middleware/asyncHandler');
const { logActivity } = require('../middleware/activityLogger');

/**
 * GET /api/docs/list
 * Returns only APPROVED documents matching the student's state (AP or TS).
 * Uses index on (state, status) for fast query.
 */
exports.listApprovedDocs = asyncHandler(async (req, res, next) => {
  const state = req.user.state; // from protect middleware
  const docs = await Document.find({ state, status: 'APPROVED' })
    .select('title fileUrl docType state createdAt')
    .sort({ createdAt: -1 });
  
  // Log document view activity (batch view)
  await logActivity(req, 'DOCUMENT_VIEW', 'DOCUMENT', null, `${req.user.name} viewed approved documents`, { state, count: docs.length });
  
  res.json({ success: true, count: docs.length, data: docs });
});
