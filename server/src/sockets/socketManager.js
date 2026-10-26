import { Server } from 'socket.io';
import cookie from 'cookie';
import { verifyToken, COOKIE_NAME } from '../utils/token.js';
import { ENV } from '../config/env.js';

let io = null;

const parseSocketOrigins = () => {
  const defaults = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
    'http://127.0.0.1:4173'
  ];
  if (!ENV.CLIENT_URL) return defaults;
  const configured = ENV.CLIENT_URL.split(',')
    .map(u => u.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return Array.from(new Set([...defaults, ...configured]));
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, '');
        const allowed = parseSocketOrigins();
        if (
          allowed.includes(cleanOrigin) ||
          (ENV.NODE_ENV !== 'production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))
        ) {
          return callback(null, true);
        }
        return callback(new Error(`WebSocket origin '${origin}' not allowed`), false);
      },
      credentials: true
    }
  });

  // Socket.IO Authentication Middleware
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth?.token;

      // Check cookie header if token not in handshake auth
      if (!token && socket.handshake.headers.cookie) {
        const parsedCookies = cookie.parse(socket.handshake.headers.cookie);
        token = parsedCookies[COOKIE_NAME];
      }

      if (!token) {
        return next(new Error('Authentication required for socket connection'));
      }

      const decoded = verifyToken(token);
      socket.user = { id: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      return next(new Error('Invalid or expired socket authentication token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const role = socket.user.role;

    // Join personal room and role room
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    // Allow joining a specific listing room for live inventory updates
    socket.on('join_listing', (listingId) => {
      if (listingId) {
        socket.join(`listing:${listingId}`);
      }
    });

    socket.on('leave_listing', (listingId) => {
      if (listingId) {
        socket.leave(`listing:${listingId}`);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
};

export const getIO = () => {
  return io;
};

// Realtime Event Emitter Helpers (Safe: No-op if socket server not initialized in tests)
export const notifyUser = (userId, event, payload) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, payload);
  }
};

export const notifyRole = (role, event, payload) => {
  if (io && role) {
    io.to(`role:${role}`).emit(event, payload);
  }
};

export const notifyListing = (listingId, event, payload) => {
  if (io && listingId) {
    io.to(`listing:${listingId.toString()}`).emit(event, payload);
  }
};

export const broadcastLiveUpdate = (event, payload) => {
  if (io) {
    io.emit(event, payload);
  }
};
