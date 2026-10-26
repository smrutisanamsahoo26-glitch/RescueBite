import { Router } from 'express';
import {
  createReservation,
  getMyReservations,
  getDonorInboundReservations,
  approveReservation,
  rejectReservation,
  cancelReservation,
  sweepExpired
} from '../controllers/reservationController.js';
import { validateCreateReservation } from '../validators/listingValidator.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Recipient creates atomic reservation
router.post(
  '/',
  authenticateToken,
  requireRoles(ROLES.RECIPIENT),
  validateCreateReservation,
  createReservation
);

// Recipient retrieves their own reservations
router.get(
  '/my',
  authenticateToken,
  requireRoles(ROLES.RECIPIENT),
  getMyReservations
);

// Donor retrieves inbound reservation claims
router.get(
  ['/donor', '/donor/inbound'],
  authenticateToken,
  requireRoles(ROLES.DONOR),
  getDonorInboundReservations
);

// Donor approves claim
router.patch(
  '/:id/approve',
  authenticateToken,
  requireRoles(ROLES.DONOR, ROLES.ADMIN),
  approveReservation
);

// Donor rejects claim
router.patch(
  '/:id/reject',
  authenticateToken,
  requireRoles(ROLES.DONOR, ROLES.ADMIN),
  rejectReservation
);

// Recipient or Donor cancels claim
router.patch(
  '/:id/cancel',
  authenticateToken,
  cancelReservation
);

// Admin / Cron worker triggers expiry sweep
router.post(
  '/sweep-expired',
  authenticateToken,
  requireRoles(ROLES.ADMIN),
  sweepExpired
);

export default router;
