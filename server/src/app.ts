import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { CONFIG } from './config/config';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import paymentRoutes from './routes/payment.routes';
import foodRoutes from './routes/food.routes';
import busRoutes from './routes/bus.routes';
import { apiRateLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

const app = express();

// 1. Security Headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://checkout.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com", "https://checkout.razorpay.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://www.svgrepo.com", "https://api.qrserver.com"],
      connectSrc: ["'self'", "http://localhost:5000", "http://localhost:3000", "http://localhost:8080", "https://api.razorpay.com", "https://lumberjack.razorpay.com"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 2. Strict CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || CONFIG.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS Error: Origin not allowed by security policy.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Cookie Parser & Body Parsing with payload limits to prevent DoS
app.use(cookieParser(CONFIG.COOKIE_SECRET));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 4. Global API Rate Limiter
app.use('/api', apiRateLimiter);

// 5. Route Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/food', foodRoutes);
app.use('/api/v1/buses', busRoutes);

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Resource not found.' });
});

// 6. Global Error Handler (Sanitizes error details in production)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled Application Error', err);
  res.status(err.status || 500).json({
    success: false,
    error: 'SERVER_ERROR',
    message: CONFIG.IS_PRODUCTION ? 'An internal error occurred.' : err.message
  });
});

export default app;
