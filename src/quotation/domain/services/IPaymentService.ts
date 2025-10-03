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
} 