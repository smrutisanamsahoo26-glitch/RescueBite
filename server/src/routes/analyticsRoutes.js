import { Router } from 'express';
import { getPlatformAnalytics } from '../controllers/analyticsController.js';

const router = Router();

// Public or authenticated analytics endpoint
router.get('/', getPlatformAnalytics);

export default router;
