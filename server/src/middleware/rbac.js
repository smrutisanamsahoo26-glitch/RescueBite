import { AppError } from '../utils/appError.js';

export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required before checking permissions', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]. Your current role is '${req.user.role}'.`,
          403
        )
      );
    }

    next();
  };
};
