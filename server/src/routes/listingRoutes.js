import { Router } from 'express';
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  getMyListings,
  getMatchedRecipients
} from '../controllers/listingController.js';
import {
  validateCreateListing,
  validateUpdateListing,
  validateListingsQuery
} from '../validators/listingValidator.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Donor Listing Management Endpoints (Static subpaths before parameterized :id)
router.get(
  '/donor/mine',
  authenticateToken,
  requireRoles(ROLES.DONOR),
  getMyListings
);

// Public Discovery Endpoints
router.get('/', validateListingsQuery, getListings);
router.get('/:id', getListingById);

router.post(
  '/',
  authenticateToken,
  requireRoles(ROLES.DONOR),
  validateCreateListing,
  createListing
);

router.put(
  '/:id',
  authenticateToken,
  requireRoles(ROLES.DONOR, ROLES.ADMIN),
  validateUpdateListing,
  updateListing
);

router.delete(
  '/:id',
  authenticateToken,
  requireRoles(ROLES.DONOR, ROLES.ADMIN),
  deleteListing
);

// Recipient Proximity & Capacity Matching Recommendations
router.get(
  '/:id/recipient-matches',
  authenticateToken,
  requireRoles(ROLES.DONOR, ROLES.ADMIN),
  getMatchedRecipients
);

export default router;
