import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

router.post('/request-otp', authRateLimiter, (req, res, next) => {
  authController.requestOtp(req, res, next);
});

router.post('/verify-otp', authRateLimiter, (req, res, next) => {
  authController.verifyOtp(req, res, next);
});

export const authRoutes = router;
