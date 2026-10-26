import { Router } from 'express';
import { submitReport, getMyReports } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Incident reporting endpoints
router.post('/', authenticateToken, submitReport);
router.get('/my', authenticateToken, getMyReports);

export default router;
