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
    return next(new AppError('Invalid input provided', 400, formatted));
  }
  next();
};
