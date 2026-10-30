declare module 'razorpay' {
  interface RazorpayOrderOptions {
    amount: number;
    currency: string;
    receipt?: string;
    notes?: Record<string, any>;
  }

  interface RazorpayOrder {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    attempts: number;
    notes: Record<string, any>;
    created_at: number;
  }

  interface RazorpayOrders {
    create(options: RazorpayOrderOptions): Promise<RazorpayOrder>;
    fetch(orderId: string): Promise<RazorpayOrder>;
  }

  interface RazorpayPayments {
    fetch(paymentId: string): Promise<any>;
    capture(paymentId: string, amount: number, currency: string): Promise<any>;
  }

  export default class Razorpay {
    constructor(options: { key_id: string; key_secret: string });
    orders: RazorpayOrders;
    payments: RazorpayPayments;
  }
}
