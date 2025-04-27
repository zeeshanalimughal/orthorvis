const pino = require('pino');
const path = require('path');

const levels = {
  fatal: 60,
  error: 50,
  warn: 40,
  info: 30,
  debug: 20,
  trace: 10,
};

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  base: {
    app: 'orthorvis-api',
    env: process.env.NODE_ENV || 'development',
  },
});

const createRequestLogger = (req) => {
  return logger.child({
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user ? req.user.id : 'unauthenticated',
  });
};

module.exports = {
  logger,
  createRequestLogger,
};
