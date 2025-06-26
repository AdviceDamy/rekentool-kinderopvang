import { Router } from 'express';
import { login, loginValidation, me } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/login
router.post('/login', loginValidation, login);

// GET /api/auth/me
router.get('/me', authenticateToken, me);

export default router; 