import http from 'http';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { ENV, validateEnv } from './config/env.js';
import { initSocket } from './sockets/socketManager.js';
import { startExpiryScheduler, stopExpiryScheduler } from './services/expiryJob.js';

const server = http.createServer(app);

// Initialize real-time Socket.IO gateway
const io = initSocket(server);

const startServer = async () => {
  try {
    // Validate required environment variables
    validateEnv();

    await connectDB();

    // Start background idempotent expiry processor
    startExpiryScheduler();

    server.listen(ENV.PORT, '0.0.0.0', () => {
      console.log(`[RescueBite Server] Running on http://0.0.0.0:${ENV.PORT}`);
      console.log(`[RescueBite Server] API Documentation: http://localhost:${ENV.PORT}/api/docs`);
      console.log(`[RescueBite Server] Health Check: http://localhost:${ENV.PORT}/api/health`);
    });
  } catch (err) {
    console.error('[RescueBite Server] Failed to start:', err.message);
    process.exit(1);
  }
};

// Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[RescueBite Server] Received ${signal}. Gracefully shutting down...`);
  stopExpiryScheduler();
  server.close(async () => {
    await disconnectDB();
    console.log('[RescueBite Server] Closed all HTTP connections and DB pool.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { server, startServer };
