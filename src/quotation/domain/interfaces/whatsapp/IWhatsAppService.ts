import { Booking } from '../../entities/Booking';
import { QuoteRequest } from '../../entities/QuoteRequest';
import { WhatsAppMessage, WhatsAppTemplate, WhatsAppMediaMessage, InteractiveTemplate } from './types';

/**
 * Interface pour les services WhatsApp
 */
export interface IWhatsAppService {
    /**
     * Envoie un message WhatsApp pour confirmer une demande de devis
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param quoteRequest La demande de devis concernée
     */
    sendQuoteRequestNotification(phoneNumber: string, quoteRequest: QuoteRequest): Promise<void>;
    
    /**
     * Envoie un message WhatsApp pour confirmer un devis
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param quoteRequest La demande de devis concernée
     */
    sendQuoteConfirmation(phoneNumber: string, quoteRequest: QuoteRequest): Promise<void>;
    
    /**
     * Envoie un message WhatsApp pour le suivi d'un devis
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param quoteRequest La demande de devis concernée
     */
    sendQuoteFollowUp(phoneNumber: string, quoteRequest: QuoteRequest): Promise<void>;
    
    /**
     * Envoie un message WhatsApp pour confirmer une réservation
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param booking La réservation concernée
     */
    sendBookingConfirmation(phoneNumber: string, booking: Booking): Promise<void>;
    
    /**
     * Envoie un message WhatsApp pour confirmer un paiement
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param booking La réservation concernée
     * @param transactionId L'identifiant de la transaction
     */
    sendPaymentConfirmation(phoneNumber: string, booking: Booking, transactionId: string): Promise<void>;
    
    /**
     * Envoie un message WhatsApp pour notifier une annulation
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param booking La réservation annulée
     * @param reason La raison de l'annulation
     */
    sendCancellationNotification(phoneNumber: string, booking: Booking, reason?: string): Promise<void>;
    
    /**
     * Envoie un message WhatsApp pour rappeler un rendez-vous à venir
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param booking La réservation concernée
     * @param daysUntilAppointment Le nombre de jours avant le rendez-vous
     */
    sendAppointmentReminder(phoneNumber: string, booking: Booking, daysUntilAppointment: number): Promise<void>;
    
    /**
     * Envoie un message WhatsApp pour demander un feedback après le service
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param booking La réservation concernée
     */
    sendServiceCompletionFeedback(phoneNumber: string, booking: Booking): Promise<void>;
    
    /**
     * Envoie un message WhatsApp pour rappeler de donner un feedback
     * @param phoneNumber Le numéro de téléphone du destinataire
     * @param booking La réservation concernée
     */
    sendFeedbackReminder(phoneNumber: string, booking: Booking): Promise<void>;

    // Nouvelles méthodes
    sendTemplateMessage(phoneNumber: string, template: WhatsAppTemplate): Promise<string>;
    sendInteractiveMessage(phoneNumber: string, template: InteractiveTemplate): Promise<string>;
    sendMediaMessage(phoneNumber: string, message: WhatsAppMediaMessage): Promise<string>;
    
    // Gestion des sessions
    isSessionActive(phoneNumber: string): Promise<boolean>;
    refreshSession(phoneNumber: string): Promise<void>;
    
    // Gestion des statuts
    getMessageStatus(messageId: string): Promise<{
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: Date;
        error?: string;
    }>;
    
    // Gestion des contacts
    markOptIn(phoneNumber: string): Promise<void>;
    markOptOut(phoneNumber: string): Promise<void>;
    getContactStatus(phoneNumber: string): Promise<'opted_in' | 'opted_out' | 'unknown'>;
    
    // Analytics
    getMessageStats(period: 'day' | 'week' | 'month'): Promise<{
        sent: number;
        delivered: number;
        read: number;
        failed: number;
        responseRate: number;
    }>;
} 