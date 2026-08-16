const pino = require('pino');

// Structured logging so production logs are queryable (Render/Railway both ingest
// JSON logs directly) instead of ad-hoc console.log/console.error scattered
// through routes and services.
const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  ...(isProd ? {} : {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' }
    }
  })
});

module.exports = logger;
