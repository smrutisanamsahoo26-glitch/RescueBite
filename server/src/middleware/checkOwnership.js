import { AppError } from '../utils/appError.js';
import { ROLES } from '../constants/roles.js';

export const checkResourceOwnership = (getOwnerIdFn) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new AppError('Authentication required', 401));
      }

      // Administrators have global management oversight
      if (req.user.role === ROLES.ADMIN) {
        return next();
      }

      const resourceOwnerId = await getOwnerIdFn(req);

      if (!resourceOwnerId) {
        return next(new AppError('Target resource not found', 404));
      }

      if (resourceOwnerId.toString() !== req.user._id.toString()) {
        return next(
          new AppError('Forbidden: You do not have ownership rights to modify or access this resource', 403)
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
