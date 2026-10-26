import { Router } from 'express';
import {
  getAdminOverview,
  getReports,
  resolveReport,
  updateUserStatus,
  getAuditLogs
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticateToken, requireRoles(ROLES.ADMIN));

router.get('/overview', getAdminOverview);
router.get('/reports', getReports);
router.patch('/reports/:id', resolveReport);
router.patch('/users/:id/status', updateUserStatus);
router.get('/audit-logs', getAuditLogs);

export default router;
