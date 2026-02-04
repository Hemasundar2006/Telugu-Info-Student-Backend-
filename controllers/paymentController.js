const crypto = require('crypto');
const User = require('../models/UserModel');
const asyncHandler = require('../middleware/asyncHandler');
const Activity = require('../models/ActivityModel');

/**
 * POST /api/payments/verify
 * Handles Razorpay/UPI webhook: verifies signature and updates user tier on successful payment.
 * Use env: RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET.
 */
exports.verifyWebhook = asyncHandler(async (req, res, next) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    const err = new Error('Webhook secret not configured');
    err.statusCode = 500;
    return next(err);
  }

  // Use raw body for signature (set by server.js for this route); fallback to stringify for tests
  const rawBody = req.rawBody ? (Buffer.isBuffer(req.rawBody) ? req.rawBody.toString() : req.rawBody) : JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    const err = new Error('Invalid webhook signature');
    err.statusCode = 400;
    return next(err);
  }

  const event = req.body.event;
  if (event !== 'payment.captured') {
    return res.json({ success: true, message: 'Event ignored' });
  }

  const payload = req.body.payload?.payment?.entity || req.body.payload?.entity;
  const amount = payload.amount / 100; // paise to rupees
  const notes = payload.notes || {};
  const userId = notes.userId;

  if (!userId) {
    return res.status(200).json({ success: true, message: 'No userId in notes' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(200).json({ success: true, message: 'User not found' });
  }

  if (amount >= 9) {
    user.tier = '9_RUPEE';
  } else if (amount >= 1) {
    user.tier = '1_RUPEE';
  }
  await user.save();

  // Log payment verification activity (webhook, no req.user)
  try {
    await Activity.create({
      userId: user._id,
      userRole: user.role,
      userName: user.name,
      action: 'PAYMENT_VERIFY',
      resourceType: 'PAYMENT',
      resourceId: user._id,
      description: `Payment verified: ₹${amount}, tier updated to ${user.tier}`,
      metadata: { amount, tier: user.tier, paymentId: payload.id },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent') || 'Razorpay Webhook',
    });
  } catch (error) {
    console.error('Activity logging error:', error.message);
  }

  res.json({ success: true, message: 'Tier updated', tier: user.tier });
});
