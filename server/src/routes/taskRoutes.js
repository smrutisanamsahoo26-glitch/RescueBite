import { Router } from 'express';
import {
  getTaskBoard,
  getMyTasks,
  getTaskById,
  claimTask,
  updateTaskStatus,
  logTemperature
} from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Available tasks board for volunteers
router.get(
  '/board',
  authenticateToken,
  requireRoles(ROLES.VOLUNTEER, ROLES.ADMIN),
  getTaskBoard
);

// Volunteer's claimed tasks
router.get(
  '/my',
  authenticateToken,
  requireRoles(ROLES.VOLUNTEER),
  getMyTasks
);

// Get task details
router.get('/:id', authenticateToken, getTaskById);

// Volunteer claims task atomically
router.post(
  '/:id/claim',
  authenticateToken,
  requireRoles(ROLES.VOLUNTEER),
  claimTask
);

// Advance task status (code verification & handover confirmation)
router.patch(
  '/:id/status',
  authenticateToken,
  updateTaskStatus
);

// Log temperature check during transit
router.post(
  '/:id/temp-log',
  authenticateToken,
  requireRoles(ROLES.VOLUNTEER, ROLES.ADMIN),
  logTemperature
);

export default router;
