// Thin Sentry wrapper — only active when SENTRY_DSN is set and @sentry/node is
// installed. Kept optional (not a hard dependency) so the app runs fine without
// it during local dev; install `@sentry/node` and set SENTRY_DSN before deploying.
let Sentry = null;
let initialized = false;

function init() {
  if (initialized || !process.env.SENTRY_DSN) return;
  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1
    });
    initialized = true;
  } catch (e) {
    console.warn('[ErrorTracking] SENTRY_DSN is set but @sentry/node is not installed — run `npm install @sentry/node`.');
  }
}

function captureException(err) {
  init();
  if (Sentry) Sentry.captureException(err);
}

module.exports = { init, captureException };
