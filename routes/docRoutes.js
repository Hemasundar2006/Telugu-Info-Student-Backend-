const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  uploadDocument,
  getPendingDocuments,
  approveDocument,
} = require('../controllers/approvalController');
const { listApprovedDocs } = require('../controllers/docsController');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { uploadSchema, approveParamsSchema } = require('../validators/docValidator');

const router = express.Router();

// ——— Approval workflow (SUPPORT / SUPER_ADMIN) ———
// POST /api/docs/upload: SUPPORT, ADMIN, or SUPER_ADMIN. Status defaults to PENDING.
router.post(
  '/upload',
  protect,
  authorize('SUPER_ADMIN', 'ADMIN', 'SUPPORT'),
  upload.single('file'),
  validate(uploadSchema),
  uploadDocument
);

// GET /api/docs/pending: SUPER_ADMIN only. Admin uploads go here for super admin approval.
router.get(
  '/pending',
  protect,
  authorize('SUPER_ADMIN'),
  getPendingDocuments
);

// PATCH /api/docs/:id/approve: SUPER_ADMIN only.
router.patch(
  '/:id/approve',
  protect,
  authorize('SUPER_ADMIN'),
  validate(approveParamsSchema, 'params'),
  approveDocument
);

// ——— Student interface ———
// GET /api/docs/list: Authenticated users; returns only APPROVED docs matching req.user.state.
router.get('/list', protect, listApprovedDocs);

module.exports = router;
