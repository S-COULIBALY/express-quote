import { Money } from '../valueObjects/Money';

/**
 * Interface pour les services de paiement
 * Définit les méthodes que tout service de paiement doit implémenter
 */
export interface IPaymentService {
  /**
   * Crée une intention de paiement
   * @param bookingId Identifiant de la réservation
   * @param amount Montant à payer
   * @param description Description du paiement
   */
  createPaymentIntent(
    bookingId: string,
    amount: Money,
    description?: string
  ): Promise<{ clientSecret: string; id: string }>;
  
  /**
   * Récupère les détails d'une intention de paiement
   * @param paymentIntentId Identifiant de l'intention de paiement
   */
  retrievePaymentIntent(paymentIntentId: string): Promise<any>;
  
  /**
   * Vérifie si un paiement a été effectué avec succès
   * @param paymentIntentId Identifiant de l'intention de paiement
   */
  verifyPaymentIntent(paymentIntentId: string): Promise<boolean>;
  
  /**
   * Annule une intention de paiement
   * @param paymentIntentId Identifiant de l'intention de paiement
   */
  cancelPaymentIntent(paymentIntentId: string): Promise<boolean>;

  /**
   * Vérifie le statut détaillé d'une intention de paiement
   * @param paymentIntentId Identifiant de l'intention de paiement
   * @returns Détails sur le statut du paiement
   */
  checkPaymentIntentStatus(paymentIntentId: string): Promise<{
    status: 'succeeded' | 'processing' | 'requires_payment_method' | 'requires_confirmation' | 'canceled' | 'requires_action';
    amount?: number;
    bookingId?: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }>;

  /**
   * Effectue un remboursement
   * @param paymentIntentId Identifiant de l'intention de paiement
   * @param amount Montant à rembourser (optionnel, remboursement total par défaut)
   * @returns Informations sur le remboursement
   */
  createRefund(paymentIntentId: string, amount?: number): Promise<{ id: string }>;
} 