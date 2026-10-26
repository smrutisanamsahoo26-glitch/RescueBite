import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async (uri = ENV.MONGODB_URI) => {
  if (!uri && ENV.NODE_ENV !== 'test') {
    throw new Error('MONGODB_URI is not set. Please configure your MongoDB Atlas URI in server/.env.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      dbName: ENV.MONGODB_DB_NAME || 'rescuebite',
      autoIndex: true
    });
    // Sanitize: print host and DB name only, never credentials or full URI
    console.log(`[MongoDB Atlas] Connected successfully to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Atlas] Connection failed: ${error.message}`);
    if (ENV.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
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
