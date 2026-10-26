import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import yamljs from 'yamljs';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { ENV } from './config/env.js';
import { generalRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { AppError } from './utils/appError.js';
import { sendSuccess } from './utils/apiResponse.js';

import authRoutes from './routes/authRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 1. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for swagger-ui-express styling
    crossOriginEmbedderPolicy: false
  })
);

// 2. CORS Configuration
const parseAllowedOrigins = () => {
  const localDefaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173'
  ];
  if (!ENV.CLIENT_URL) return localDefaults;
  const configured = ENV.CLIENT_URL.split(',')
    .map(u => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return Array.from(new Set([...localDefaults, ...configured]));
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      const cleanOrigin = origin.replace(/\/+$/, '');
      const allowed = parseAllowedOrigins();
      if (
        allowed.includes(cleanOrigin) ||
        (ENV.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
      ) {
        return callback(null, true);
      }
      // Untrusted cross-origin request rejected
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Idempotency-Key']
  })
);

// 3. Body Parsing & Cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Rate Limiting
app.use(
  ['/api', '/auth', '/organizations', '/listings', '/reservations', '/tasks', '/admin', '/reports', '/analytics'],
  generalRateLimiter
);

// 5. Swagger API Documentation
try {
  const swaggerDocument = yamljs.load(path.join(__dirname, '../swagger.yaml'));
  app.use(['/api/docs', '/docs'], swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (err) {
  console.warn('[Swagger] Documentation file could not be loaded:', err.message);
}

// 6. Health Check Endpoint (With Database Connectivity Verification)
app.get(['/api/health', '/health'], (req, res) => {
  const dbReadyState = mongoose.connection.readyState;
  const isDbConnected = dbReadyState === 1;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const payload = {
    status: isDbConnected ? 'UP' : 'DOWN',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
    database: {
      status: dbStatusMap[dbReadyState] || 'unknown'
    }
  };

  if (!isDbConnected) {
    return res.status(503).json({
      success: false,
      message: 'RescueBite API Server degraded: MongoDB database connection unavailable',
      data: payload
    });
  }

  return sendSuccess(res, {
    message: 'RescueBite API Server is operational',
    data: payload
  });
});

// 7. Mount Core API Routers (supports both /api/* and root fallback /*)
const mountRouter = (path, router) => {
  app.use(`/api${path}`, router);
  app.use(path, router);
};

mountRouter('/auth', authRoutes);
mountRouter('/organizations', orgRoutes);
mountRouter('/listings', listingRoutes);
mountRouter('/reservations', reservationRoutes);
mountRouter('/tasks', taskRoutes);
mountRouter('/admin', adminRoutes);
mountRouter('/reports', reportRoutes);
mountRouter('/analytics', analyticsRoutes);

// 8. 404 Route Handler
app.use((req, res, next) => {
  next(new AppError(`Endpoint '${req.method} ${req.originalUrl}' does not exist on this server.`, 404));
});

// 9. Centralized Error Handler
app.use(errorHandler);

export default app;
