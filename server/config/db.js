const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      logger.warn('MongoDB URI not found. Running without database in development mode.');
      return;
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Log MongoDB connection events
    mongoose.connection.on('error', (err) => {
      logger.error({ err }, 'MongoDB connection error');
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });
    
  } catch (error) {
    logger.error({ err: error }, `MongoDB Connection Error: ${error.message}`);
    
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Running in development mode without database connection.');
    } else {
      logger.fatal('Database connection failed in production mode. Exiting application.');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
