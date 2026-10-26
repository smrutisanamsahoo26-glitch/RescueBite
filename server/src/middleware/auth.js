import { verifyToken, COOKIE_NAME } from '../utils/token.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/appError.js';

export const authenticateToken = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie first
    if (req.cookies && req.cookies[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }
    // 2. Fallback to Authorization: Bearer <token>
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please log in to proceed.', 401));
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return next(new AppError('Invalid or expired authentication token. Please log in again.', 401));
    }

    // 4. Verify user still exists and account is active
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('The account belonging to this token no longer exists.', 401));
    }

    if (user.status === 'suspended') {
      return next(new AppError('Your account has been suspended. Please contact platform administration.', 403));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
