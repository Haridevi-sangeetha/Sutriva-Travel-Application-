import rateLimit from 'express-rate-limit';

const isTestEnv = process.env.NODE_ENV === 'test';

/**
 * Strict Rate Limiter for Login Endpoint (5 attempts per 15 minutes per IP)
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

/**
 * Strict Rate Limiter for OTP Requests (3 requests per 10 minutes per IP)
 */
export const otpRequestLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many OTP requests. Please wait before requesting another OTP.'
  }
});

/**
 * Rate Limiter for Token Refresh Endpoint (20 requests per 15 minutes per IP)
 */
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Too many token refresh requests. Please re-authenticate.'
  }
});

/**
 * General API Rate Limiter (100 requests per 15 minutes per IP)
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isTestEnv,
  message: {
    success: false,
    error: 'TOO_MANY_REQUESTS',
    message: 'Rate limit exceeded. Please slow down your requests.'
  }
});

