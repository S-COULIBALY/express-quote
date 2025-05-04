import { Money } from '@/quotation/domain/valueObjects/Money';

/**
 * Commande pour créer une intention de paiement
 */
export interface CreatePaymentIntentCommand {
  bookingId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Commande pour vérifier le statut d'un paiement
 */
export interface VerifyPaymentCommand {
  paymentIntentId: string;
}

/**
 * Commande pour annuler une intention de paiement
 */
export interface CancelPaymentCommand {
  paymentIntentId: string;
}

/**
 * Commande pour effectuer un remboursement
 */
export interface RefundPaymentCommand {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

/**
 * Réponse à la commande CreatePaymentIntentCommand
 */
export interface PaymentIntentResult {
  clientSecret: string;
  id: string;
  amount: number;
}

/**
 * Réponse à la commande VerifyPaymentCommand
 */
export interface PaymentStatusResult {
  status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'canceled' | 'requires_action';
  amount?: number;
  bookingId?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

/**
 * Réponse à la commande RefundPaymentCommand
 */
export interface RefundResult {
  id: string;
  amount?: number;
  status: 'succeeded' | 'pending' | 'failed';
} 