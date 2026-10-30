import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { loginRateLimiter, otpRequestLimiter, refreshRateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public Authentication Routes
router.post('/register', loginRateLimiter, (req, res) => authController.register(req, res));
router.post('/login', loginRateLimiter, (req, res) => authController.login(req, res));
router.post('/otp/request', otpRequestLimiter, (req, res) => authController.requestOtp(req, res));
router.post('/otp/verify', loginRateLimiter, (req, res) => authController.verifyOtp(req, res));
router.post('/refresh', refreshRateLimiter, (req, res) => authController.refreshToken(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

// Protected Auth Routes
router.post('/logout-all', authenticateToken, (req, res) => authController.logoutAllDevices(req, res));

export default router;
