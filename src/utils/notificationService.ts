/**
 * Utilitaire de gestion des notifications multi-canaux
 */

import { PrismaClient } from '@prisma/client';
import { ConsentType } from '@/quotation/domain/enums/ConsentType';
import { PrismaConsentRepository } from '@/quotation/infrastructure/repositories/PrismaConsentRepository';
import { ConsentService } from '@/quotation/application/services/ConsentService';

// Initialiser les services
const prisma = new PrismaClient();
const consentRepository = new PrismaConsentRepository(prisma);
const consentService = new ConsentService(consentRepository);

type NotificationType = 
  | 'quote_request' 
  | 'quoteConfirmation'
  | 'booking'
  | 'bookingConfirmation'
  | 'payment'
  | 'paymentConfirmation'
  | 'cancellation'
  | 'reminder';

type NotificationChannel = 'email' | 'whatsapp' | 'both';

interface NotificationData {
  // Données obligatoires
  type: NotificationType;
  channels: NotificationChannel[];
  
  // Informations du destinataire (au moins un des deux est requis)
  email?: string;
  phone?: string;
  clientName?: string;
  
  // Données contextuelles
  bookingId?: string;
  quoteId?: string;
  serviceDate?: string | Date;
  serviceAddress?: string;
  serviceType?: string;
  amount?: number;
  
  // Templates et paramètres
  emailTemplate?: string;
  whatsappTemplate?: string;
  whatsappParameters?: any[];
  whatsappLanguage?: string;
  
  // Options spéciales
  useFallback?: boolean;
  preferredChannel?: 'email' | 'whatsapp';
  
  // Données de consentement
  whatsappOptIn?: boolean;
  
  // Données supplémentaires
  metadata?: Record<string, any>;
}

interface SendQuoteConfirmationParams {
  email: string;
  phone?: string;
  clientName: string;
  quoteId: string;
  serviceDate?: string | Date;
  serviceAddress?: string;
  amount?: number;
  channels?: NotificationChannel[];
  whatsappOptIn?: boolean;
  additionalDetails?: string;
}

/**
 * Service de notification unifié
 */
export const NotificationService = {
  /**
   * Envoie une notification via les canaux spécifiés
   */
  async sendNotification(data: NotificationData): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    try {
      // Vérification des données obligatoires
      if (!data.type || !data.channels || data.channels.length === 0) {
        throw new Error('Les champs type et channels sont requis');
      }
      
      // Vérification de la présence d'au moins un moyen de contact
      if (!data.email && !data.phone) {
        throw new Error('Au moins une adresse email ou un numéro de téléphone est requis');
      }

      // Normalisation des dates
      if (data.serviceDate && typeof data.serviceDate === 'object') {
        data.serviceDate = data.serviceDate.toISOString();
      }

      // Envoi de la requête à l'API
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      // Vérification de la réponse
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.details || errorData.error || `Erreur ${response.status}: ${response.statusText}`
        );
      }

      // Traitement de la réponse
      const result = await response.json();
      
      return {
        success: true,
        results: result
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  },

  /**
   * Envoie une notification de confirmation de devis
   */
  async sendQuoteConfirmation(data: SendQuoteConfirmationParams): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    // Déterminer les canaux de notification en respectant le consentement WhatsApp
    let channels: NotificationChannel[] = data.channels || ['email'];
    
    // Vérifier le consentement WhatsApp dans la base de données si un téléphone est disponible
    let whatsappConsent = data.whatsappOptIn === true;
    
    if (data.phone) {
      try {
        // Vérifier le consentement enregistré
        const storedConsent = await consentService.verifyConsent(
          data.phone,
          ConsentType.WHATSAPP_MARKETING
        );
        
        // Si un consentement existe en base, il prévaut sur celui du formulaire
        if (storedConsent !== undefined) {
          whatsappConsent = storedConsent;
        } 
        // Si on a un consentement du formulaire mais pas de consentement enregistré,
        // enregistrer le consentement du formulaire
        else if (data.whatsappOptIn !== undefined) {
          try {
            await fetch('/api/consent', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userIdentifier: data.phone,
                type: ConsentType.WHATSAPP_MARKETING,
                granted: data.whatsappOptIn,
                formPath: typeof window !== 'undefined' ? window.location.pathname : 'server-side',
                formText: "Formulaire de devis",
                checkboxText: "J'accepte de recevoir des notifications WhatsApp pour le suivi de mes services",
                sessionId: typeof window !== 'undefined' ? (window.sessionStorage.getItem('sessionId') || 'unknown') : 'server-side',
                formData: { ...data },
                version: "1.0"
              }),
            });
          } catch (error) {
            console.error('Erreur lors de l\'enregistrement du consentement:', error);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du consentement WhatsApp:', error);
        // En cas d'erreur, on se replie sur la valeur fournie dans les données
        whatsappConsent = data.whatsappOptIn === true;
      }
    }
    
    // Si le téléphone est disponible et l'opt-in WhatsApp est activé,
    // inclure WhatsApp dans les canaux de notification
    if (data.phone && whatsappConsent) {
      if (!channels.includes('whatsapp') && !channels.includes('both')) {
        channels = channels.includes('email') ? ['both'] : ['whatsapp'];
      }
    } else {
      // Sinon, s'assurer que WhatsApp n'est pas utilisé
      channels = channels.map(channel => 
        channel === 'both' || channel === 'whatsapp' ? 'email' : channel
      ) as NotificationChannel[];
    }
    
    return this.sendNotification({
      type: 'quoteConfirmation',
      channels,
      email: data.email,
      phone: data.phone,
      clientName: data.clientName,
      quoteId: data.quoteId,
      serviceDate: data.serviceDate,
      serviceAddress: data.serviceAddress,
      amount: data.amount,
      whatsappOptIn: whatsappConsent,
      additionalDetails: data.additionalDetails
    });
  },

  /**
   * Envoie une notification de confirmation de réservation
   */
  async sendBookingConfirmation(data: {
    email: string;
    phone?: string;
    clientName: string;
    bookingId: string;
    quoteId?: string;
    serviceDate: string | Date;
    serviceAddress: string;
    amount?: number;
    channels?: NotificationChannel[];
  }): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    return this.sendNotification({
      type: 'bookingConfirmation',
      channels: data.channels || ['both'],
      email: data.email,
      phone: data.phone,
      clientName: data.clientName,
      bookingId: data.bookingId,
      quoteId: data.quoteId,
      serviceDate: data.serviceDate,
      serviceAddress: data.serviceAddress,
      amount: data.amount
    });
  },

  /**
   * Envoie une notification de confirmation de paiement
   */
  async sendPaymentConfirmation(data: {
    email: string;
    phone?: string;
    clientName: string;
    bookingId: string;
    quoteId?: string;
    transactionId: string;
    depositAmount: number;
    totalAmount?: number;
    serviceDate?: string | Date;
    serviceAddress?: string;
    channels?: NotificationChannel[];
  }): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    return this.sendNotification({
      type: 'paymentConfirmation',
      channels: data.channels || ['both'],
      email: data.email,
      phone: data.phone,
      clientName: data.clientName,
      bookingId: data.bookingId,
      quoteId: data.quoteId,
      serviceDate: data.serviceDate,
      serviceAddress: data.serviceAddress,
      amount: data.depositAmount,
      metadata: {
        transactionId: data.transactionId,
        depositAmount: data.depositAmount,
        totalAmount: data.totalAmount
      }
    });
  },

  /**
   * Envoie une notification d'échec de paiement
   */
  async sendPaymentFailedNotification(data: {
    email: string;
    phone?: string;
    clientName: string;
    bookingId: string;
    quoteId?: string;
    paymentIntentId: string;
    failureReason?: string;
    channels?: NotificationChannel[];
  }): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    return this.sendNotification({
      type: 'payment',
      channels: data.channels || ['email'],
      email: data.email,
      phone: data.phone,
      clientName: data.clientName,
      bookingId: data.bookingId,
      quoteId: data.quoteId,
      metadata: {
        status: 'failed',
        paymentIntentId: data.paymentIntentId,
        reason: data.failureReason || 'Échec du traitement du paiement'
      }
    });
  },

  /**
   * Envoie une notification de rappel pour un service à venir
   */
  async sendServiceReminder(data: {
    email: string;
    phone?: string;
    clientName: string;
    bookingId: string;
    serviceDate: string | Date;
    serviceAddress: string;
    daysUntilService: number;
    channels?: NotificationChannel[];
  }): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    return this.sendNotification({
      type: 'reminder',
      channels: data.channels || ['both'],
      email: data.email,
      phone: data.phone,
      clientName: data.clientName,
      bookingId: data.bookingId,
      serviceDate: data.serviceDate,
      serviceAddress: data.serviceAddress,
      metadata: {
        daysUntilService: data.daysUntilService
      }
    });
  },

  /**
   * Envoie une notification d'annulation de service
   */
  async sendCancellationNotification(data: {
    email: string;
    phone?: string;
    clientName: string;
    bookingId: string;
    serviceDate?: string | Date;
    cancellationReason?: string;
    channels?: NotificationChannel[];
  }): Promise<{
    success: boolean;
    results?: any;
    error?: string;
  }> {
    return this.sendNotification({
      type: 'cancellation',
      channels: data.channels || ['both'],
      email: data.email,
      phone: data.phone,
      clientName: data.clientName,
      bookingId: data.bookingId,
      serviceDate: data.serviceDate,
      metadata: {
        cancellationReason: data.cancellationReason
      }
    });
  }
};

export default NotificationService; 