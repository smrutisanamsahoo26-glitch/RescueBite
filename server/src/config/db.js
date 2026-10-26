import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async (uri = ENV.MONGODB_URI, retryCount = 0) => {
  if (!uri && ENV.NODE_ENV !== 'test') {
    console.error('[MongoDB Atlas] MONGODB_URI is not set. Please configure your MONGODB_URI environment variable.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: ENV.MONGODB_DB_NAME || 'rescuebite',
      autoIndex: true,
      serverSelectionTimeoutMS: 8000
    });
    // Sanitize: print host and DB name only, never credentials or full URI
    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Atlas] Connection failed: ${error.message}`);
    if (ENV.NODE_ENV !== 'test') {
      const nextDelay = Math.min(30000, 2000 * Math.pow(1.5, retryCount));
      console.log(`[MongoDB Atlas] Retrying connection in ${(nextDelay / 1000).toFixed(1)}s (Attempt #${retryCount + 1})...`);
      console.log('[MongoDB Atlas] Troubleshooting: Ensure IP 0.0.0.0/0 is whitelisted in MongoDB Atlas -> Network Access.');
      setTimeout(() => {
        connectDB(uri, retryCount + 1).catch(() => {});
      }, nextDelay);
    } else {
      throw error;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('[MongoDB] Connection closed successfully.');
  } catch (error) {
    console.error('[MongoDB] Error during disconnection:', error.message);
  }
};
