import { validationResult } from 'express-validator';
import { AppError } from '../utils/appError.js';

export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    const primaryMessage = formatted.map(f => f.message).filter(Boolean).join('. ') || 'Invalid input provided';
    return next(new AppError(primaryMessage, 400, formatted));
  }
  next();
};
