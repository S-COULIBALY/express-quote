// Fichier de configuration des templates et destinataires WhatsApp

/**
 * Structure des templates WhatsApp
 */
export interface WhatsAppTemplate {
    name: string;         // Nom du template approuvé par Meta
    enabled: boolean;     // Si ce template est activé
    variables: string[];  // Variables utilisées dans ce template
}

/**
 * Configuration des templates WhatsApp par type
 */
export const whatsappTemplates: Record<string, WhatsAppTemplate> = {
    // Emails envoyés lors de la demande de devis
    quoteRequest: {
        name: 'quote_request_confirmation',
        enabled: true,
        variables: ['client_name', 'quote_id', 'service_type']
    },
    
    // Suivi de devis
    quoteFollowUp: {
        name: 'quote_follow_up',
        enabled: true,
        variables: ['client_name', 'quote_id', 'expiry_date']
    },
    
    // Confirmation de devis
    quoteConfirmation: {
        name: 'quote_confirmation',
        enabled: true,
        variables: ['client_name', 'quote_id', 'total_amount', 'payment_link']
    },
    
    // Confirmation de réservation
    bookingConfirmation: {
        name: 'booking_confirmation',
        enabled: true,
        variables: ['client_name', 'booking_id', 'service_date', 'service_time']
    },
    
    // Confirmation de paiement
    paymentConfirmation: {
        name: 'payment_confirmation',
        enabled: true,
        variables: ['client_name', 'amount', 'booking_id', 'service_date']
    },
    
    // Rappel à mi-chemin (J-3)
    midwayReminder: {
        name: 'midway_reminder',
        enabled: true,
        variables: ['client_name', 'service_date', 'booking_ref']
    },
    
    // Rappel la veille
    dayBeforeReminder: {
        name: 'day_before_reminder',
        enabled: true,
        variables: ['client_name', 'time', 'address', 'contact_name']
    },
    
    // Confirmation post-service
    serviceCompletionFeedback: {
        name: 'service_feedback',
        enabled: true,
        variables: ['client_name', 'booking_ref', 'feedback_link']
    },
    
    // Rappel de feedback
    feedbackReminder: {
        name: 'feedback_reminder',
        enabled: true,
        variables: ['client_name', 'booking_ref', 'feedback_link']
    },
    
    // Notification d'annulation
    cancellationNotification: {
        name: 'cancellation_notification',
        enabled: true,
        variables: ['client_name', 'booking_ref', 'reason']
    }
};

/**
 * Configuration WhatsApp générale
 */
export const whatsappConfig = {
    // Configuration de l'API
    apiKey: process.env.WHATSAPP_API_KEY || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    
    // Activation globale
    enabled: process.env.WHATSAPP_ENABLED === 'true',
    
    // Configuration des templates
    templates: whatsappTemplates,
    
    // Jours de rappel (synchronisés avec les rappels email)
    reminderDays: [7, 3, 1]
}; 