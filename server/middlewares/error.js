const ErrorResponse = require('../utils/errorResponse');
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  const log = req.logger || logger;
  
  const statusCode = error.statusCode || 500;
  const logMethod = statusCode >= 500 ? 'error' : 'warn';
  
  log[logMethod]({
    err: {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
    },
    requestId: req.id,
    url: req.originalUrl,
    method: req.method,
  }, `Error: ${error.message}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = errorHandler;
