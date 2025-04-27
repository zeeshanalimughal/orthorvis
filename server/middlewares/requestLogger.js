const { v4: uuidv4 } = require('uuid');
const { createRequestLogger } = require('../utils/logger');

/**
 * Middleware to add request ID and logger to each request
 */
const requestLogger = (req, res, next) => {
  req.id = uuidv4();
  
  res.setHeader('X-Request-ID', req.id);
  
  req.logger = createRequestLogger(req);
  
  req.logger.info({
    msg: 'Incoming request',
    query: req.query,
    params: req.params,
    body: req.body ? sanitizeBody(req.body) : undefined,
  });
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    
    req.logger.info({
      msg: 'Request completed',
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
    });
  });
  
  next();
};

/**
 * Sanitize request body to remove sensitive information
 */
const sanitizeBody = (body) => {
  const sanitized = { ...body };
  
  const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

module.exports = requestLogger;
