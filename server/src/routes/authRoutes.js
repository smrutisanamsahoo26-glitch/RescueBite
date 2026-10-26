import { Router } from 'express';
import { register, login, logout, getCurrentUser, updateProfile } from '../controllers/authController.js';
import { validateRegister, validateLogin, validateProfileUpdate } from '../validators/authValidator.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public Auth Endpoints
router.post('/register', authRateLimiter, validateRegister, register);
router.post('/login', authRateLimiter, validateLogin, login);

// Authenticated Endpoints
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, validateProfileUpdate, updateProfile);

export default router;
