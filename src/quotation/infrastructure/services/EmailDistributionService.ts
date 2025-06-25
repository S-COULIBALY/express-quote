import { injectable, inject } from 'tsyringe';
import { EmailService } from '../adapters/EmailService';
import { EmailConfigService } from '../../application/services/EmailConfigService';
import { MessageType, NotificationChannel } from '../../application/dtos/EmailConfigDTO';
import { Booking } from '../../domain/entities/Booking';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { logger } from '@/lib/logger';
import { differenceInCalendarDays } from 'date-fns';

// Logger
const emailDistributionLogger = logger.withContext ? 
  logger.withContext('EmailDistribution') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[EmailDistribution]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[EmailDistribution]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[EmailDistribution]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[EmailDistribution]', msg, ...args)
  };

/**
 * Service responsable de la distribution des emails aux différents destinataires
 * et de la gestion des rappels de rendez-vous
 */
@injectable()
export class EmailDistributionService {
  constructor(
    @inject('EmailService') private emailService: EmailService,
    @inject('EmailConfigService') private emailConfigService: EmailConfigService
  ) {}

  /**
   * Distribue un email de confirmation de devis aux destinataires appropriés
   */
  async distributeQuoteConfirmation(quoteRequest: QuoteRequest, template?: string): Promise<void> {
    try {
      const quoteData = quoteRequest.getQuoteData();
      const clientEmail = quoteData?.email;
      
      // Envoyer au client
      if (clientEmail) {
        await this.emailService.sendQuoteConfirmation(quoteRequest, template);
        emailDistributionLogger.info(`Email de confirmation de devis envoyé au client: ${clientEmail}`);
      }
      
      // Envoyer aux destinataires internes
      const internalRecipients = await this.getActiveRecipients('quote_request');
      for (const recipient of internalRecipients) {
        const internalQuoteRequest = this.createInternalQuoteRequest(quoteRequest, recipient);
        await this.emailService.sendQuoteConfirmation(internalQuoteRequest, template);
        emailDistributionLogger.info(`Email de confirmation de devis envoyé en interne à: ${recipient}`);
      }

      // Envoyer aux prestataires externes
      const externalRecipients = await this.getActiveRecipients('quote_request');
      for (const recipient of externalRecipients) {
        const externalQuoteRequest = this.createExternalQuoteRequest(quoteRequest, recipient);
        await this.emailService.sendQuoteConfirmation(externalQuoteRequest, template);
        emailDistributionLogger.info(`Email de confirmation de devis envoyé au prestataire externe: ${recipient}`);
      }
    } catch (error) {
      emailDistributionLogger.error('Erreur lors de la distribution des emails de confirmation de devis:', error);
    }
  }

  /**
   * Distribue un email de confirmation de réservation
   */
  async distributeBookingConfirmation(booking: Booking, template?: string): Promise<void> {
    try {
      emailDistributionLogger.info(`Envoi de la confirmation de réservation pour ${booking.getId()}`);
      
      // Envoyer au client
      const customer = booking.getCustomer();
      const clientEmail = customer?.getEmail();
      if (clientEmail) {
        await this.emailService.sendBookingConfirmation(booking, template);
        emailDistributionLogger.info(`Confirmation de réservation envoyée au client: ${clientEmail}`);
      }
      
      // Envoyer en interne
      const internalRecipients = await this.getActiveRecipients('booking');
      for (const recipient of internalRecipients) {
        const internalBooking = this.createInternalBooking(booking, recipient);
        await this.emailService.sendBookingConfirmation(internalBooking, template);
        emailDistributionLogger.info(`Confirmation de réservation envoyée en interne à: ${recipient}`);
      }
      
      // Envoyer aux prestataires externes
      const externalRecipients = await this.getActiveRecipients('booking');
      for (const recipient of externalRecipients) {
        const externalBooking = this.createExternalBooking(booking, recipient);
        await this.emailService.sendBookingConfirmation(externalBooking, template);
        emailDistributionLogger.info(`Confirmation de réservation envoyée au prestataire externe: ${recipient}`);
      }
      
      // Envoyer aux professionnels
      await this.distributeToProfessionals(booking, 'bookingConfirmation', template);
    } catch (error) {
      emailDistributionLogger.error(`Erreur lors de l'envoi de la confirmation de réservation:`, error);
    }
  }

  /**
   * Distribue un email de confirmation de paiement
   */
  async distributePaymentConfirmation(booking: Booking, transactionId: string, template?: string): Promise<void> {
    try {
      const customer = booking.getCustomer();
      const clientEmail = customer?.getEmail();
      
      // Envoyer au client
      if (clientEmail) {
        await this.emailService.sendPaymentConfirmation(booking, transactionId, template);
        emailDistributionLogger.info(`Email de confirmation de paiement envoyé au client: ${clientEmail}`);
      }
      
      // Envoyer aux destinataires internes
      const internalRecipients = await this.getActiveRecipients('payment');
      for (const recipient of internalRecipients) {
        const internalBooking = this.createInternalBooking(booking, recipient);
        await this.emailService.sendPaymentConfirmation(internalBooking, transactionId, template);
        emailDistributionLogger.info(`Email de confirmation de paiement envoyé en interne à: ${recipient}`);
      }

      // Envoyer aux prestataires externes
      const externalRecipients = await this.getActiveRecipients('payment');
      for (const recipient of externalRecipients) {
        const externalBooking = this.createExternalBooking(booking, recipient);
        await this.emailService.sendPaymentConfirmation(externalBooking, transactionId, template);
        emailDistributionLogger.info(`Email de confirmation de paiement envoyé au prestataire externe: ${recipient}`);
      }
    } catch (error) {
      emailDistributionLogger.error('Erreur lors de la distribution des emails de confirmation de paiement:', error);
    }
  }

  /**
   * Distribue un email de notification d'annulation
   */
  async distributeCancellationNotification(booking: Booking, reason?: string, template?: string): Promise<void> {
    try {
      const customer = booking.getCustomer();
      const clientEmail = customer?.getEmail();
      
      // Envoyer au client
      if (clientEmail) {
        await this.emailService.sendCancellationNotification(booking, reason, template);
        emailDistributionLogger.info(`Email d'annulation envoyé au client: ${clientEmail}`);
      }
      
      // Envoyer aux destinataires internes
      const internalRecipients = await this.getActiveRecipients('cancellation');
      for (const recipient of internalRecipients) {
        const internalBooking = this.createInternalBooking(booking, recipient);
        await this.emailService.sendCancellationNotification(internalBooking, reason, template);
        emailDistributionLogger.info(`Email d'annulation envoyé en interne à: ${recipient}`);
      }

      // Envoyer aux prestataires externes
      const externalRecipients = await this.getActiveRecipients('cancellation');
      for (const recipient of externalRecipients) {
        const externalBooking = this.createExternalBooking(booking, recipient);
        await this.emailService.sendCancellationNotification(externalBooking, reason, template);
        emailDistributionLogger.info(`Email d'annulation envoyé au prestataire externe: ${recipient}`);
      }
      
      // Envoyer aux professionnels
      await this.distributeToProfessionals(booking, 'cancellationNotification', template, { reason });
    } catch (error) {
      emailDistributionLogger.error('Erreur lors de la distribution des emails d\'annulation:', error);
    }
  }

  /**
   * Envoie des rappels de rendez-vous
   */
  async sendAppointmentReminders(bookings: Booking[], template?: string): Promise<void> {
    const today = new Date();
    emailDistributionLogger.info(`Vérification des rappels pour ${bookings.length} réservations`);
    
    for (const booking of bookings) {
      try {
        const scheduledDate = booking.getScheduledDate();
        if (!scheduledDate) {
          emailDistributionLogger.warn(`Réservation ${booking.getId()} sans date programmée, ignorée pour les rappels`);
          continue;
        }
        
        const daysUntilAppointment = differenceInCalendarDays(scheduledDate, today);
          const customer = booking.getCustomer();
          const clientEmail = customer?.getEmail();
          
        // Envoyer au client
        if (clientEmail) {
          await this.emailService.sendAppointmentReminder(booking, daysUntilAppointment, template);
            emailDistributionLogger.info(`Rappel de rendez-vous envoyé au client: ${clientEmail}`);
          }
          
          // Envoyer aux destinataires internes
          const internalRecipients = await this.getActiveRecipients('reminder');
          for (const recipient of internalRecipients) {
            const internalBooking = this.createInternalBooking(booking, recipient);
          await this.emailService.sendAppointmentReminder(internalBooking, daysUntilAppointment, template);
            emailDistributionLogger.info(`Rappel de rendez-vous envoyé en interne à: ${recipient}`);
          }

          // Envoyer aux prestataires externes
          const externalRecipients = await this.getActiveRecipients('reminder');
          for (const recipient of externalRecipients) {
            const externalBooking = this.createExternalBooking(booking, recipient);
          await this.emailService.sendAppointmentReminder(externalBooking, daysUntilAppointment, template);
            emailDistributionLogger.info(`Rappel de rendez-vous envoyé au prestataire externe: ${recipient}`);
          }
          
        // Envoyer aux professionnels
        await this.distributeToProfessionals(booking, 'appointmentReminder', template, { daysUntilAppointment });
      } catch (error) {
        emailDistributionLogger.error(`Erreur lors de l'envoi des rappels pour la réservation ${booking.getId()}:`, error);
      }
    }
  }

  /**
   * Distribue un email aux professionnels assignés
   */
  async distributeToProfessionals(
    booking: Booking,
    messageType: string,
    template?: string,
    additionalData?: Record<string, any>
  ): Promise<void> {
    try {
      const professional = booking.getProfessional();
      if (!professional) {
        emailDistributionLogger.info(`Aucun professionnel assigné à la réservation ${booking.getId()}`);
        return;
      }
      
      const professionalEmail = professional.getEmail();
      if (!professionalEmail) {
        emailDistributionLogger.warn(`Le professionnel ${professional.getId()} n'a pas d'email défini`);
        return;
      }
      
      const professionalBooking = this.createInternalBooking(booking, professionalEmail);
      
      switch (messageType) {
        case 'bookingConfirmation':
          await this.emailService.sendBookingConfirmation(professionalBooking, template);
          break;
        case 'appointmentReminder':
          const daysUntilAppointment = additionalData?.daysUntilAppointment;
          await this.emailService.sendAppointmentReminder(professionalBooking, daysUntilAppointment, template);
          break;
        case 'cancellationNotification':
          const reason = additionalData?.reason;
          await this.emailService.sendCancellationNotification(professionalBooking, reason, template);
          break;
        default:
          emailDistributionLogger.warn(`Type d'email inconnu pour les professionnels: ${messageType}`);
          return;
      }
      
      emailDistributionLogger.info(`Email "${messageType}" envoyé au professionnel: ${professionalEmail}`);
    } catch (error) {
      emailDistributionLogger.error(`Erreur lors de l'envoi d'email au professionnel:`, error);
    }
  }

  // Helpers privés
  private async getActiveRecipients(messageType: MessageType, channel: NotificationChannel = 'email'): Promise<string[]> {
    const config = await this.emailConfigService.getEmailConfig();
    const recipients: string[] = [];

    // Ajouter les équipes internes
    Object.entries(config.internalTeams).forEach(([teamType, team]) => {
      if (team.config.enabled && 
          team.config.messageTypes.includes(messageType) && 
          team.config.channels.includes(channel)) {
        recipients.push(...team.emails);
      }
    });

    // Ajouter les prestataires externes
    config.externalProviders.forEach(provider => {
      if (provider.messageTypes.includes(messageType) && 
          provider.channels.includes(channel)) {
        recipients.push(provider.email);
      }
    });

    // Ajouter les professionnels
    config.professionals.forEach(professional => {
      if (professional.config.enabled && 
          professional.config.messageTypes.includes(messageType) && 
          professional.config.channels.includes(channel)) {
        recipients.push(professional.email);
      }
    });

    return [...new Set(recipients)]; // Supprimer les doublons
  }

  private createInternalQuoteRequest(original: QuoteRequest, recipient: string): QuoteRequest {
    return {
      ...original,
      getQuoteData: () => {
        const originalData = original.getQuoteData();
        return {
          ...originalData,
          email: recipient,
          subject: `[COPIE INTERNE] ${originalData.subject || 'Confirmation de devis'}`
        };
      }
    } as unknown as QuoteRequest;
  }

  private createExternalQuoteRequest(original: QuoteRequest, recipient: string): QuoteRequest {
    return {
      ...original,
      getQuoteData: () => {
        const originalData = original.getQuoteData();
        return {
          ...originalData,
          email: recipient,
          subject: `[PRESTATAIRE] ${originalData.subject || 'Devis pour prestation'}`
        };
      }
    } as unknown as QuoteRequest;
  }

  private createInternalBooking(original: Booking, recipient: string): Booking {
    return {
      ...original,
      getCustomer: () => {
        const originalCustomer = original.getCustomer();
        return {
          ...originalCustomer,
          getEmail: () => recipient,
          getContactInfo: () => {
            const originalContactInfo = originalCustomer?.getContactInfo();
            return {
              ...originalContactInfo,
              getEmail: () => recipient
            };
          }
        };
      }
    } as Booking;
  }

  private createExternalBooking(original: Booking, recipient: string): Booking {
    return {
      ...original,
      getCustomer: () => {
        const originalCustomer = original.getCustomer();
        return {
          ...originalCustomer,
          getEmail: () => recipient,
          getContactInfo: () => {
            const originalContactInfo = originalCustomer?.getContactInfo();
            return {
              ...originalContactInfo,
              getEmail: () => recipient
            };
          }
        };
      }
    } as Booking;
  }
} 