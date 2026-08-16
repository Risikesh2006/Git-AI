const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./services/logger');
const pinoHttp = require('pino-http')({ logger });

const authRoutes = require('./routes/auth');
const repoRoutes = require('./routes/repositories');
const aiRoutes = require('./routes/ai');
const gitRoutes = require('./routes/git');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 8000;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(pinoHttp);

// Rate limiting — keyed per authenticated user, not per IP. A global per-IP bucket
// lets one active user (or anyone behind the same NAT/proxy) starve every other
// user sharing that IP. The JWT is only decoded here for its subject claim to pick
// a rate-limit bucket, not to authenticate the request — `authenticate` in
// middleware/auth.js still verifies the signature before any route runs.
function rateLimitKey(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = JSON.parse(Buffer.from(authHeader.split(' ')[1].split('.')[1], 'base64').toString('utf8'));
      if (payload.sub) return `user:${payload.sub}`;
    } catch { /* fall through to IP-based key */ }
  }
  return `ip:${req.ip}`;
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  keyGenerator: rateLimitKey,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/repositories', repoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/git', gitRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Global error handler
app.use((err, req, res, next) => {
  req.log?.error({ err }, 'Unhandled request error');
  if (process.env.SENTRY_DSN) {
    try { require('./services/errorTracking').captureException(err); } catch { /* Sentry not installed */ }
  }
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Only bind a real port when run directly (`node server.js`) — requiring this
// module from tests (supertest binds its own ephemeral port on the app object)
// should not also start a second listener.
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Git AI backend running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

module.exports = app;
