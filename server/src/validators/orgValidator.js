import { body, param } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';
import { ORG_TYPES, VERIFICATION_STATUS } from '../constants/orgStatus.js';

export const validateOrgApplication = [
  body('name')
    .trim()
    .notEmpty().withMessage('Organization name is required')
    .isLength({ min: 2, max: 150 }).withMessage('Organization name must be between 2 and 150 characters'),

  body('type')
    .notEmpty().withMessage('Organization type is required')
    .isIn(ORG_TYPES).withMessage(`Type must be one of: ${ORG_TYPES.join(', ')}`),

  body('registrationNumber')
    .trim()
    .notEmpty().withMessage('Official registration or tax ID number is required'),

  body('contactEmail')
    .trim()
    .notEmpty().withMessage('Contact email is required')
    .isEmail().withMessage('Must be a valid contact email')
    .normalizeEmail(),

  body('contactPhone')
    .trim()
    .notEmpty().withMessage('Contact phone number is required'),

  body('verificationDocuments')
    .optional()
    .isArray().withMessage('Verification documents must be an array'),

  handleValidation
];

export const validateOrgVerificationDecision = [
  param('id')
    .isMongoId().withMessage('Invalid organization ID format'),

  body('status')
    .notEmpty().withMessage('Decision status is required')
    .isIn([VERIFICATION_STATUS.APPROVED, VERIFICATION_STATUS.REJECTED])
    .withMessage(`Decision status must be either '${VERIFICATION_STATUS.APPROVED}' or '${VERIFICATION_STATUS.REJECTED}'`),

  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Review notes cannot exceed 500 characters'),

  handleValidation
];
