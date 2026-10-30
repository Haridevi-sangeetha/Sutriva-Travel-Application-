import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentService } from '../services/payment.service';
import { logger } from '../utils/logger';

// Input Validation Schemas via Zod
const CreateOrderSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  itemTitle: z.string().optional(),
  userEmail: z.string().email().optional().or(z.string().optional()),
  userName: z.string().optional()
});

const VerifyPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay Order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay Payment ID is required'),
  razorpaySignature: z.string().optional()
});

export const createOrderController = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const validatedData = CreateOrderSchema.parse(req.body);
    const orderData = await paymentService.createPaymentOrder(
      validatedData.bookingId,
      validatedData.amount,
      validatedData.itemTitle || 'Travel Booking',
      validatedData.userEmail || 'guest@sutriva.com',
      validatedData.userName || 'Traveler'
    );

    res.status(201).json({
      success: true,
      message: 'Razorpay payment order created successfully.',
      data: orderData
    });
  } catch (err: any) {
    logger.error('Error in createOrderController', err);
    res.status(400).json({
      success: false,
      error: 'ORDER_CREATION_FAILED',
      message: err.message || 'Failed to create payment order.'
    });
  }
};

export const verifyPaymentController = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const validatedData = VerifyPaymentSchema.parse(req.body);
    const verificationResult = await paymentService.verifyPaymentSignature(
      validatedData.bookingId,
      validatedData.razorpayOrderId,
      validatedData.razorpayPaymentId,
      validatedData.razorpaySignature || ''
    );

    res.status(200).json({
      success: true,
      message: verificationResult.message,
      data: verificationResult.payment
    });
  } catch (err: any) {
    logger.error('Error in verifyPaymentController', err);
    res.status(400).json({
      success: false,
      error: 'VERIFICATION_FAILED',
      message: err.message || 'Payment signature verification failed.'
    });
  }
};

export const webhookController = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const signature = (req.headers['x-razorpay-signature'] as string) || '';
    const rawBody = JSON.stringify(req.body);

    const result = await paymentService.handleWebhook(rawBody, signature, req.body);
    res.status(200).json(result);
  } catch (err: any) {
    logger.error('Error handling webhook', err);
    res.status(400).json({ success: false, error: 'WEBHOOK_FAILED', message: err.message });
  }
};

export const getPaymentStatusController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bookingId = req.params.bookingId;
    const payment = paymentService.getPaymentByBookingId(bookingId);

    if (!payment) {
      res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'No payment record found for this booking ID.'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err: any) {
    next(err);
  }
};

export const retryPaymentController = async (req: Request, res: Response, _next: NextFunction) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      res.status(400).json({ success: false, message: 'Booking ID is required for retry.' });
      return;
    }

    const orderData = await paymentService.retryPayment(bookingId);
    res.status(200).json({
      success: true,
      message: 'Retry payment order generated.',
      data: orderData
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: 'RETRY_FAILED',
      message: err.message || 'Failed to retry payment.'
    });
  }
};
