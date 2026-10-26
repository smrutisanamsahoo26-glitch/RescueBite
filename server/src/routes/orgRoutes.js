import { Router } from 'express';
import {
  applyVerification,
  getMyOrg,
  getOrgById,
  getVerificationQueue,
  verifyOrganization
} from '../controllers/orgController.js';
import { validateOrgApplication, validateOrgVerificationDecision } from '../validators/orgValidator.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Recipient / Donor submit or update organization profile and verification documents
router.post(
  '/apply',
  authenticateToken,
  requireRoles(ROLES.DONOR, ROLES.RECIPIENT),
  validateOrgApplication,
  applyVerification
);

// Get current user's organization
router.get('/my-org', authenticateToken, getMyOrg);

// Admin-only verification queue (paginated with status filter)
router.get(
  '/admin/queue',
  authenticateToken,
  requireRoles(ROLES.ADMIN),
  getVerificationQueue
);

// Admin-only verification decision (supports both /verify and /decision)
router.patch(
  ['/admin/:id/verify', '/admin/:id/decision'],
  authenticateToken,
  requireRoles(ROLES.ADMIN),
  validateOrgVerificationDecision,
  verifyOrganization
);

// Public organization details lookup
router.get('/:id', getOrgById);

export default router;
