import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Database connection configuration
 */
const DB_CONFIG = {
  maxRetries: 3,
  retryDelayMs: 1000, // Base delay for exponential backoff
  connectionOptions: {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4, // Use IPv4
  }
};

/**
 * Sleep utility for retry delays
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {number} baseDelay - Base delay in milliseconds
 */
const getBackoffDelay = (attempt, baseDelay) => {
  // Exponential backoff with jitter: baseDelay * 2^attempt + random jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 1000;
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
};

/**
 * Setup MongoDB connection event listeners
 */
const setupConnectionListeners = () => {
  const connection = mongoose.connection;

  connection.on('connected', () => {
    console.log('MongoDB: Connection established successfully');
  });

  connection.on('disconnected', () => {
    console.warn('MongoDB: Connection disconnected');
  });

  connection.on('reconnected', () => {
    console.log('MongoDB: Connection re-established');
  });

  connection.on('error', (err) => {
    console.error('MongoDB: Connection error:', err.message);
  });

  // Log when connection is fully open
  connection.once('open', () => {
    console.log('MongoDB: Connection is open and ready');
  });
};

/**
 * Setup graceful shutdown handlers
 */
const setupGracefulShutdown = () => {
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Closing MongoDB connection...`);
    try {
      await mongoose.connection.close();
      console.log('MongoDB: Connection closed gracefully');
      process.exit(0);
    } catch (error) {
      console.error('MongoDB: Error during graceful shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught Exception:', error);
    await mongoose.connection.close();
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit, just log - let the application decide how to handle
  });
};

/**
 * Connect to MongoDB with retry logic
 * @param {number} retryCount - Current retry attempt
 */
const connectDB = async (retryCount = 0) => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('MongoDB: MONGODB_URI environment variable is not set');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.warn('MongoDB: Running without database connection (development mode)');
    return null;
  }

  // Setup listeners before first connection attempt
  if (retryCount === 0) {
    setupConnectionListeners();
    setupGracefulShutdown();
  }

  try {
    console.log(`MongoDB: Attempting to connect (attempt ${retryCount + 1}/${DB_CONFIG.maxRetries})...`);
    
    const conn = await mongoose.connect(mongoUri, DB_CONFIG.connectionOptions);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`MongoDB Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`MongoDB: Connection attempt ${retryCount + 1} failed:`, error.message);

    if (retryCount < DB_CONFIG.maxRetries - 1) {
      const delay = getBackoffDelay(retryCount, DB_CONFIG.retryDelayMs);
      console.log(`MongoDB: Retrying in ${Math.round(delay / 1000)} seconds...`);
      await sleep(delay);
      return connectDB(retryCount + 1);
    }

    console.error(`MongoDB: All ${DB_CONFIG.maxRetries} connection attempts failed`);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('MongoDB: Exiting process due to database connection failure in production');
      process.exit(1);
    }
    
    throw error;
  }
};

/**
 * Check if database is connected
 * @returns {boolean}
 */
export const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get database connection status
 * @returns {string}
 */
export const getConnectionStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Disconnect from database
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('MongoDB: Disconnected successfully');
  }
};

export default connectDB;
