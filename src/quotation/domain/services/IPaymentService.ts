import { Money } from '../valueObjects/Money';

/**
 * Interface pour le service de paiement
 * Migration vers le système Template/Item
 */

export interface IPaymentService {
  createPaymentSession(data: any): Promise<{ sessionId: string; url: string }>;
  processPayment(sessionId: string): Promise<any>;
  getPaymentStatus(sessionId: string): Promise<any>;
  refundPayment(paymentId: string): Promise<any>;
  createPaymentIntent(bookingId: string, amount: Money, description?: string): Promise<{ clientSecret: string; id: string }>;
  checkPaymentIntentStatus(paymentIntentId: string): Promise<{
    status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'canceled' | 'requires_action';
    amount?: number;
    bookingId?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }>;
  cancelPaymentIntent(paymentIntentId: string): Promise<boolean>;
  createRefund(paymentIntentId: string, amount?: number, reason?: string): Promise<{ id: string; status: string; amount: number }>;
} 