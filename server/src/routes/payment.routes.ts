import { Router } from 'express';
import {
  createOrderController,
  verifyPaymentController,
  webhookController,
  getPaymentStatusController,
  retryPaymentController
} from '../controllers/payment.controller';

const router = Router();

// 1. Create Payment Order (POST /api/v1/payments/create-order)
router.post('/create-order', createOrderController);

// 2. Verify Payment Signature (POST /api/v1/payments/verify)
router.post('/verify', verifyPaymentController);

// 3. Webhook Listener (POST /api/v1/payments/webhook)
router.post('/webhook', webhookController);

// 4. Get Payment Status by Booking ID (GET /api/v1/payments/status/:bookingId)
router.get('/status/:bookingId', getPaymentStatusController);

// 5. Retry Payment (POST /api/v1/payments/retry)
router.post('/retry', retryPaymentController);

export default router;
