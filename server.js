require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const docRoutes = require('./routes/docRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const activityRoutes = require('./routes/activityRoutes');
const companyRoutes = require('./routes/companyRoutes');
const predictRoutes = require('./routes/predictRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');
const postRoutes = require('./routes/postRoutes');
const followRoutes = require('./routes/followRoutes');
const userStatsRoutes = require('./routes/userStatsRoutes');
const { verifyWebhook } = require('./controllers/paymentController');

connectDB();

const app = express();

// Security & body parsing
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());
app.use(express.json({ limit: '10mb' }));

// ——— Routes ———
app.use('/api/auth', authRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api', predictRoutes); // POST /api/predict
app.use('/api/user-profiles', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/users', userStatsRoutes);

// Razorpay webhook: must verify signature using raw body (never use parsed JSON for signature).
app.post(
  '/api/payments/verify',
  express.raw({ type: 'application/json' }),
  (req, res, next) => {
    req.rawBody = req.body;
    try {
      req.body = req.body && req.body.length ? JSON.parse(req.body.toString()) : {};
    } catch (e) {
      req.body = {};
    }
    next();
  },
  verifyWebhook
);
app.use('/api/payments', paymentRoutes);

// 404
app.use((req, res, next) => {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
