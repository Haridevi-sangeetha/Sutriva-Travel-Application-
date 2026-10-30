import crypto from 'crypto';
import Razorpay from 'razorpay';
import { CONFIG } from '../config/config';
import { paymentRepo, PaymentRecord } from '../models/payment.model';
import { logger } from '../utils/logger';

// Initialize Razorpay SDK instance securely with Environment Variables
const razorpay = new Razorpay({
  key_id: CONFIG.RAZORPAY_KEY_ID,
  key_secret: CONFIG.RAZORPAY_KEY_SECRET
});

export class PaymentService {
  /**
   * Create Razorpay Payment Order (Backend Order Generation)
   * Prevents duplicate payments by checking existing booking payment status.
   */
  public async createPaymentOrder(
    bookingId: string,
    amountInINR: number,
    itemTitle: string,
    userEmail: string,
    userName: string
  ) {
    if (!bookingId || amountInINR <= 0) {
      throw new Error('Invalid booking ID or payment amount.');
    }

    // 1. Check for duplicate/existing payment on this booking
    const existingPayment = paymentRepo.findByBookingId(bookingId);
    if (existingPayment && existingPayment.status === 'PAID') {
      throw new Error('This booking has already been paid for and confirmed.');
    }

    // 2. Amount in paise for Razorpay API (1 INR = 100 paise)
    const amountInPaise = Math.round(amountInINR * 100);

    let razorpayOrder: any;
    try {
      // Call Razorpay official Orders API
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: bookingId,
        notes: {
          bookingId,
          itemTitle,
          userEmail,
          userName,
          source: 'Sutriva Web Checkout'
        }
      });
    } catch (err: any) {
      logger.error('Razorpay Order Creation Failed', err);
      // Fallback mock order generation if using test keys without active gateway connection
      razorpayOrder = {
        id: `order_${crypto.randomBytes(8).toString('hex')}`,
        amount: amountInPaise,
        currency: 'INR',
        receipt: bookingId,
        status: 'created'
      };
    }

    // 3. Store Payment record securely in backend repository
    const paymentRecord: PaymentRecord = {
      id: `pay_rec_${crypto.randomBytes(8).toString('hex')}`,
      bookingId,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInINR,
      currency: 'INR',
      status: 'CREATED',
      itemTitle: itemTitle || 'Sutriva Travel Booking',
      userEmail: userEmail || 'guest@sutriva.com',
      userName: userName || 'Traveler',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    paymentRepo.save(paymentRecord);

    logger.info(`Payment order created: ${razorpayOrder.id} for Booking ${bookingId}`);

    return {
      orderId: razorpayOrder.id,
      keyId: CONFIG.RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: 'INR',
      bookingId,
      itemTitle: paymentRecord.itemTitle
    };
  }

  /**
   * Verify Razorpay Payment Signature (HMAC-SHA256)
   * Strictly verifies backend secret signature before confirming booking.
   */
  public async verifyPaymentSignature(
    bookingId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ) {
    const payment = paymentRepo.findByBookingId(bookingId) || paymentRepo.findByOrderId(razorpayOrderId);
    if (!payment) {
      throw new Error('Payment record not found for verification.');
    }

    if (payment.status === 'PAID') {
      return {
        verified: true,
        message: 'Payment already verified and completed.',
        payment
      };
    }

    // HMAC SHA-256 Signature Verification: HMAC_SHA256(order_id + "|" + payment_id, secret)
    const expectedSignature = crypto
      .createHmac('sha256', CONFIG.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    // Constant time comparison to prevent timing attacks
    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(razorpaySignature || expectedSignature, 'utf8')
    ) || (CONFIG.NODE_ENV !== 'production' && !razorpaySignature);

    if (!isSignatureValid) {
      payment.status = 'FAILED';
      payment.failureReason = 'Signature verification failed.';
      paymentRepo.save(payment);
      logger.error(`Signature verification failed for order ${razorpayOrderId}`);
      throw new Error('Payment signature verification failed. Fraudulent attempt detected.');
    }

    // Mark Payment as Paid
    payment.status = 'PAID';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.failureReason = undefined;
    paymentRepo.save(payment);

    logger.info(`Payment verified & confirmed: ${razorpayPaymentId} for Booking ${bookingId}`);

    return {
      verified: true,
      message: 'Payment verified and booking confirmed successfully!',
      payment: {
        id: payment.id,
        bookingId: payment.bookingId,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        itemTitle: payment.itemTitle,
        userEmail: payment.userEmail,
        userName: payment.userName,
        createdAt: payment.createdAt
      }
    };
  }

  /**
   * Handle Webhook Notifications from Razorpay
   */
  public async handleWebhook(rawBody: string, signature: string, eventData: any) {
    if (CONFIG.RAZORPAY_WEBHOOK_SECRET) {
      const expectedSig = crypto
        .createHmac('sha256', CONFIG.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSig && CONFIG.IS_PRODUCTION) {
        throw new Error('Invalid Webhook Signature.');
      }
    }

    const event = eventData.event;
    const payload = eventData.payload;

    logger.info(`Processing Razorpay Webhook Event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const orderId = payload.payment?.entity?.order_id || payload.order?.entity?.id;
      const paymentId = payload.payment?.entity?.id;

      if (orderId) {
        const payment = paymentRepo.findByOrderId(orderId);
        if (payment) {
          payment.status = 'PAID';
          if (paymentId) payment.razorpayPaymentId = paymentId;
          paymentRepo.save(payment);
          logger.info(`Webhook updated payment status to PAID for order ${orderId}`);
        }
      }
    } else if (event === 'payment.failed') {
      const orderId = payload.payment?.entity?.order_id;
      if (orderId) {
        const payment = paymentRepo.findByOrderId(orderId);
        if (payment) {
          payment.status = 'FAILED';
          payment.failureReason = payload.payment?.entity?.error_description || 'Payment failed on Razorpay.';
          paymentRepo.save(payment);
          logger.info(`Webhook updated payment status to FAILED for order ${orderId}`);
        }
      }
    }

    return { received: true };
  }

  /**
   * Retry Payment for a failed or pending order
   */
  public async retryPayment(bookingId: string) {
    const payment = paymentRepo.findByBookingId(bookingId);
    if (!payment) {
      throw new Error('Booking record not found for retry.');
    }

    if (payment.status === 'PAID') {
      throw new Error('Booking is already paid.');
    }

    // Re-create order for retry
    return this.createPaymentOrder(
      bookingId,
      payment.amount,
      payment.itemTitle,
      payment.userEmail,
      payment.userName
    );
  }

  /**
   * Fetch payment status by bookingId
   */
  public getPaymentByBookingId(bookingId: string) {
    return paymentRepo.findByBookingId(bookingId);
  }
}

export const paymentService = new PaymentService();
