import { body, query, param } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';
import {
  FOOD_CATEGORIES,
  FOOD_UNITS,
  STORAGE_REQUIREMENTS,
  ALLERGENS,
  DIETARY_TAGS
} from '../constants/listingConstants.js';

export const validateCreateListing = [
  body('title')
    .trim()
    .notEmpty().withMessage('Listing title is required')
    .isLength({ min: 3, max: 140 }).withMessage('Title must be between 3 and 140 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(FOOD_CATEGORIES).withMessage(`Category must be one of: ${FOOD_CATEGORIES.join(', ')}`),

  body('quantity')
    .notEmpty().withMessage('Quantity is required')
    .isInt({ min: 1 }).withMessage('Quantity must be an integer of at least 1'),

  body('unit')
    .notEmpty().withMessage('Unit of measure is required')
    .isIn(FOOD_UNITS).withMessage(`Unit must be one of: ${FOOD_UNITS.join(', ')}`),

  body('pickupWindow.startTime')
    .notEmpty().withMessage('Pickup window start time is required')
    .isISO8601().withMessage('Start time must be a valid ISO 8601 date'),

  body('pickupWindow.endTime')
    .notEmpty().withMessage('Pickup window end time is required')
    .isISO8601().withMessage('End time must be a valid ISO 8601 date')
    .custom((endTime, { req }) => {
      const end = new Date(endTime);
      const start = new Date(req.body.pickupWindow?.startTime);
      const now = new Date();

      if (end <= start) {
        throw new Error('Pickup window end time must be after start time');
      }
      if (end <= now) {
        throw new Error('Pickup window end time must be in the future');
      }
      return true;
    }),

  body('storageRequirements')
    .notEmpty().withMessage('Storage requirement is required')
    .isIn(STORAGE_REQUIREMENTS).withMessage(`Storage must be one of: ${STORAGE_REQUIREMENTS.join(', ')}`),

  body('allergens')
    .optional()
    .isArray().withMessage('Allergens must be an array'),

  body('dietaryInfo')
    .optional()
    .isArray().withMessage('Dietary info must be an array'),

  body('location.coordinates')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]')
    .custom(([lng, lat]) => {
      if (typeof lng !== 'number' || typeof lat !== 'number') {
        throw new Error('Coordinates must be numeric numbers [lng, lat]');
      }
      if (lng < -180 || lng > 180) throw new Error('Longitude must be between -180 and 180');
      if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
      return true;
    }),

  handleValidation
];

export const validateUpdateListing = [
  param('id')
    .isMongoId().withMessage('Invalid listing ID format'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 140 }).withMessage('Title must be between 3 and 140 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),

  body('storageRequirements')
    .optional()
    .isIn(STORAGE_REQUIREMENTS).withMessage(`Storage must be one of: ${STORAGE_REQUIREMENTS.join(', ')}`),

  handleValidation
];

export const validateListingsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),

  query('category')
    .optional()
    .isIn([...FOOD_CATEGORIES, 'all']).withMessage('Invalid category filter'),

  query('storageRequirements')
    .optional()
    .isIn([...STORAGE_REQUIREMENTS, 'all']).withMessage('Invalid storage requirement filter'),

  query('lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  query('lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  query('maxDistance')
    .optional()
    .isFloat({ min: 100 }).withMessage('Max distance must be at least 100 meters'),

  handleValidation
];

export const validateCreateReservation = [
  body('listingId')
    .notEmpty().withMessage('Listing ID is required')
    .isMongoId().withMessage('Invalid listing ID format'),

  body('quantityReserved')
    .notEmpty().withMessage('Reservation quantity is required')
    .isInt({ min: 1 }).withMessage('Reserved quantity must be an integer of at least 1'),

  body('recipientNotes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),

  body('idempotencyKey')
    .optional()
    .trim(),

  handleValidation
];
