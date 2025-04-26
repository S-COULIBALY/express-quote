import { Money } from '../valueObjects/Money';
import { Booking } from '../entities/Booking';

export interface IPaymentService {
    /**
     * Traite un paiement pour une réservation
     * @param booking La réservation pour laquelle traiter le paiement
     * @param method La méthode de paiement (carte, virement, etc.)
     * @returns Une promesse contenant l'identifiant de la transaction
     */
    processPayment(booking: Booking, method: string): Promise<string>;
    
    /**
     * Rembourse un paiement
     * @param transactionId L'identifiant de la transaction à rembourser
     * @param amount Le montant à rembourser
     * @returns Une promesse contenant l'identifiant de la transaction de remboursement
     */
    refundPayment(transactionId: string, amount: Money): Promise<string>;
    
    /**
     * Vérifie le statut d'un paiement
     * @param transactionId L'identifiant de la transaction à vérifier
     * @returns Une promesse contenant le statut du paiement
     */
    getPaymentStatus(transactionId: string): Promise<'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED'>;
} 