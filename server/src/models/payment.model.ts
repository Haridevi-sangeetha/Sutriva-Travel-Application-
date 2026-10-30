export type PaymentStatus = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface PaymentRecord {
  id: string;
  bookingId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number; // in INR rupees
  currency: string;
  status: PaymentStatus;
  itemTitle: string;
  userEmail: string;
  userName: string;
  method?: string;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-Memory Secure Payment Store (OWASP Compliant: No sensitive payment credentials stored)
class PaymentRepository {
  private payments: Map<string, PaymentRecord> = new Map();
  private bookingIndex: Map<string, string> = new Map(); // bookingId -> paymentId
  private orderIndex: Map<string, string> = new Map();   // razorpayOrderId -> paymentId

  public save(payment: PaymentRecord): PaymentRecord {
    payment.updatedAt = new Date();
    this.payments.set(payment.id, payment);
    this.bookingIndex.set(payment.bookingId, payment.id);
    this.orderIndex.set(payment.razorpayOrderId, payment.id);
    return payment;
  }

  public findById(id: string): PaymentRecord | undefined {
    return this.payments.get(id);
  }

  public findByBookingId(bookingId: string): PaymentRecord | undefined {
    const paymentId = this.bookingIndex.get(bookingId);
    return paymentId ? this.payments.get(paymentId) : undefined;
  }

  public findByOrderId(orderId: string): PaymentRecord | undefined {
    const paymentId = this.orderIndex.get(orderId);
    return paymentId ? this.payments.get(paymentId) : undefined;
  }

  public getAll(): PaymentRecord[] {
    return Array.from(this.payments.values());
  }
}

export const paymentRepo = new PaymentRepository();
