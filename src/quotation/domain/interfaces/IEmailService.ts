import { Booking } from '../entities/Booking';
import { QuoteRequest } from '../entities/QuoteRequest';

/**
 * Interface pour les services d'email
 */
export interface IEmailService {
    /**
     * Envoie un email pour confirmer une réservation
     * @param booking La réservation concernée
     * @param pdfPath Chemin optionnel vers un fichier PDF à joindre
     */
    sendBookingConfirmation(booking: Booking, pdfPath?: string): Promise<void>;
    
    /**
     * Envoie un email pour confirmer un devis
     * @param quoteRequest La demande de devis concernée
     * @param pdfPath Chemin optionnel vers un fichier PDF à joindre
     */
    sendQuoteConfirmation(quoteRequest: QuoteRequest, pdfPath?: string): Promise<void>;
    
    /**
     * Envoie un email pour confirmer un paiement
     * @param booking La réservation concernée
     * @param transactionId L'identifiant de la transaction
     * @param pdfPath Chemin optionnel vers un fichier PDF à joindre
     */
    sendPaymentConfirmation(booking: Booking, transactionId: string, pdfPath?: string): Promise<void>;
    
    /**
     * Envoie un email pour notifier une annulation
     * @param booking La réservation annulée
     * @param reason La raison de l'annulation
     */
    sendCancellationNotification(booking: Booking, reason?: string): Promise<void>;
    
    /**
     * Envoie un email pour rappeler un rendez-vous à venir
     * @param booking La réservation concernée
     * @param daysUntilAppointment Le nombre de jours avant le rendez-vous
     */
    sendAppointmentReminder(booking: Booking, daysUntilAppointment: number): Promise<void>;
} 