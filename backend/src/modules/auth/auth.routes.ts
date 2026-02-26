import { Router } from 'express';
import { register, login, refresh, changePassword, requestPasswordReset, resetPassword } from './auth.controller.ts';
import { authRateLimit } from '../../middlewares/rate.middleware.ts';
import { requireAuth } from '../../middlewares/auth.middleware.ts';

const router = Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/refresh', authRateLimit, refresh);
router.post('/change-password', requireAuth, authRateLimit, changePassword);
router.post('/request-reset', authRateLimit, requestPasswordReset);
router.post('/reset-password', authRateLimit, resetPassword);

export default router;
