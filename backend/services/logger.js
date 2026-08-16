const pino = require('pino');

// Structured logging so production logs are queryable (Render/Railway both ingest
// JSON logs directly) instead of ad-hoc console.log/console.error scattered
// through routes and services.
const isProd = process.env.NODE_ENV === 'production';

// pino-pretty is a devDependency (not installed in production builds). Only use
// it if it's actually resolvable, regardless of NODE_ENV — a misconfigured env
// var on the host should never be able to crash the process at boot.
let prettyAvailable = false;
if (!isProd) {
  try {
    require.resolve('pino-pretty');
    prettyAvailable = true;
  } catch {
    prettyAvailable = false;
  }
}

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  ...(prettyAvailable ? {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
    }
  } : {})
});

module.exports = logger;
