import { Booking } from '../entities/Booking';
import { QuoteRequest } from '../entities/QuoteRequest';

export interface IEmailService {
    /**
     * Envoie un email de confirmation de devis
     * @param quoteRequest La demande de devis confirmée
     * @param pdfPath Le chemin optionnel vers le PDF du devis
     * @returns Une promesse qui se résout lorsque l'email a été envoyé
     */
    sendQuoteConfirmation(quoteRequest: QuoteRequest, pdfPath?: string): Promise<void>;
    
    /**
     * Envoie un email de confirmation de réservation
     * @param booking La réservation confirmée
     * @returns Une promesse qui se résout lorsque l'email a été envoyé
     */
    sendBookingConfirmation(booking: Booking): Promise<void>;
    
    /**
     * Envoie un email de confirmation de paiement
     * @param booking La réservation concernée
     * @param transactionId L'identifiant de la transaction
     * @returns Une promesse qui se résout lorsque l'email a été envoyé
     */
    sendPaymentConfirmation(booking: Booking, transactionId: string): Promise<void>;
    
    /**
     * Envoie un email de notification d'annulation
     * @param booking La réservation annulée
     * @param reason La raison optionnelle de l'annulation
     * @returns Une promesse qui se résout lorsque l'email a été envoyé
     */
    sendCancellationNotification(booking: Booking, reason?: string): Promise<void>;
} 