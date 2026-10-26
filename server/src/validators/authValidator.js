import { body } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';
import { ROLE_LIST, ROLES } from '../constants/roles.js';

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain at least one letter and one number'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 7, max: 20 }).withMessage('Please provide a valid phone number'),

  body('role')
    .optional()
    .isIn([ROLES.DONOR, ROLES.RECIPIENT, ROLES.VOLUNTEER])
    .withMessage(`Role must be one of: ${ROLES.DONOR}, ${ROLES.RECIPIENT}, ${ROLES.VOLUNTEER}. Admin registration is restricted.`),

  body('organizationName')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Organization name cannot exceed 150 characters'),

  handleValidation
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidation
];

export const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7, max: 20 }).withMessage('Please provide a valid phone number'),

  body('location.coordinates')
    .optional()
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be an array of [longitude, latitude]')
    .custom(([lng, lat]) => {
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error('Longitude and Latitude must be numeric');
      }
      if (lng < -180 || lng > 180) throw new Error('Longitude must be between -180 and 180');
      if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
      return true;
    }),

  handleValidation
];
