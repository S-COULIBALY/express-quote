import { injectable, inject } from 'tsyringe';
import { logger } from '@/lib/logger';
// import { IWhatsAppDistributionService } from '../../../domain/interfaces/whatsapp/IWhatsAppDistributionService';
import { WhatsAppService } from '@/quotation/infrastructure/adapters/WhatsAppService';
import { QuoteRequest } from '../../../domain/entities/QuoteRequest';
import { Booking } from '../../../domain/entities/Booking';
import { WhatsAppTemplate } from '../../../domain/interfaces/whatsapp/types';
import { TeamService } from '../TeamService';
import { ProviderService } from '../ProviderService';

const distributionLogger = logger.withContext('WhatsAppDistributionService');

@injectable()
// TODO: Réadapter l'interface IWhatsAppDistributionService si besoin
export class WhatsAppDistributionService {
    constructor(
        @inject('WhatsAppService') private whatsappService: WhatsAppService,
        @inject('TeamService') private teamService: TeamService,
        @inject('ProviderService') private providerService: ProviderService
    ) {}

    // Harmonisation : Méthodes publiques similaires à EmailDistributionService
    async distributeQuoteConfirmation(quoteRequest: QuoteRequest, template?: WhatsAppTemplate): Promise<void> {
        try {
            // Client
            const clientPhone = this.getClientPhone(quoteRequest);
            if (clientPhone) {
                await this.sendClientMessage(clientPhone, 'quote_request', quoteRequest, template);
                distributionLogger.info(`WhatsApp de confirmation de devis envoyé au client: ${clientPhone}`);
            }
            // Interne
            const teamPhones = await this.teamService.getTeamPhones();
            for (const phone of teamPhones) {
                await this.sendTeamMessage(phone, 'quote_request', quoteRequest);
                distributionLogger.info(`WhatsApp de confirmation de devis envoyé à l'équipe: ${phone}`);
            }
            // Prestataires
            const providerPhones = await this.providerService.getProviderPhones(quoteRequest);
            for (const phone of providerPhones) {
                await this.sendProviderMessage(phone, 'quote_request', quoteRequest);
                distributionLogger.info(`WhatsApp de confirmation de devis envoyé au prestataire: ${phone}`);
            }
        } catch (error) {
            distributionLogger.error('Erreur lors de la distribution WhatsApp de confirmation de devis:', error);
        }
    }

    async distributeBookingConfirmation(booking: Booking, template?: WhatsAppTemplate): Promise<void> {
        try {
            const clientPhone = this.getClientPhone(booking);
                if (clientPhone) {
                await this.sendClientMessage(clientPhone, 'booking', booking, template);
                distributionLogger.info(`WhatsApp de confirmation de réservation envoyé au client: ${clientPhone}`);
            }
                const teamPhones = await this.teamService.getTeamPhones();
                for (const phone of teamPhones) {
                await this.sendTeamMessage(phone, 'booking', booking);
                distributionLogger.info(`WhatsApp de confirmation de réservation envoyé à l'équipe: ${phone}`);
            }
            const providerPhones = await this.providerService.getProviderPhones(booking);
                for (const phone of providerPhones) {
                await this.sendProviderMessage(phone, 'booking', booking);
                distributionLogger.info(`WhatsApp de confirmation de réservation envoyé au prestataire: ${phone}`);
            }
            await this.distributeToProfessionals(booking, 'booking');
        } catch (error) {
            distributionLogger.error('Erreur lors de la distribution WhatsApp de confirmation de réservation:', error);
        }
    }

    async distributePaymentConfirmation(booking: Booking, transactionId: string, template?: WhatsAppTemplate): Promise<void> {
        try {
            const clientPhone = this.getClientPhone(booking);
            if (clientPhone) {
                await this.sendClientMessage(clientPhone, 'payment', booking, template);
                distributionLogger.info(`WhatsApp de confirmation de paiement envoyé au client: ${clientPhone}`);
            }
            const teamPhones = await this.teamService.getTeamPhones();
            for (const phone of teamPhones) {
                await this.sendTeamMessage(phone, 'payment', booking, { transactionId });
                distributionLogger.info(`WhatsApp de confirmation de paiement envoyé à l'équipe: ${phone}`);
            }
            const providerPhones = await this.providerService.getProviderPhones(booking);
            for (const phone of providerPhones) {
                await this.sendProviderMessage(phone, 'payment', booking, { transactionId });
                distributionLogger.info(`WhatsApp de confirmation de paiement envoyé au prestataire: ${phone}`);
            }
        } catch (error) {
            distributionLogger.error('Erreur lors de la distribution WhatsApp de confirmation de paiement:', error);
        }
    }

    async distributeCancellationNotification(booking: Booking, reason?: string, template?: WhatsAppTemplate): Promise<void> {
        try {
            const clientPhone = this.getClientPhone(booking);
            if (clientPhone) {
                await this.sendClientMessage(clientPhone, 'cancellation', booking, template);
                distributionLogger.info(`WhatsApp d'annulation envoyé au client: ${clientPhone}`);
            }
            const teamPhones = await this.teamService.getTeamPhones();
            for (const phone of teamPhones) {
                await this.sendTeamMessage(phone, 'cancellation', booking, { reason });
                distributionLogger.info(`WhatsApp d'annulation envoyé à l'équipe: ${phone}`);
            }
            const providerPhones = await this.providerService.getProviderPhones(booking);
            for (const phone of providerPhones) {
                await this.sendProviderMessage(phone, 'cancellation', booking, { reason });
                distributionLogger.info(`WhatsApp d'annulation envoyé au prestataire: ${phone}`);
            }
            await this.distributeToProfessionals(booking, 'cancellation', undefined, { reason });
        } catch (error) {
            distributionLogger.error('Erreur lors de la distribution WhatsApp d\'annulation:', error);
        }
    }

    async sendAppointmentReminders(bookings: Booking[], template?: WhatsAppTemplate): Promise<void> {
        const today = new Date();
        for (const booking of bookings) {
            try {
                const scheduledDate = booking.getScheduledDate();
                if (!scheduledDate) continue;
                const daysUntilAppointment = Math.max(0, Math.floor((scheduledDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                const clientPhone = this.getClientPhone(booking);
                if (clientPhone) {
                    await this.sendClientMessage(clientPhone, 'reminder', booking, template);
                    distributionLogger.info(`WhatsApp de rappel envoyé au client: ${clientPhone}`);
                }
                const teamPhones = await this.teamService.getTeamPhones();
                for (const phone of teamPhones) {
                    await this.sendTeamMessage(phone, 'reminder', booking, { daysUntilAppointment });
                    distributionLogger.info(`WhatsApp de rappel envoyé à l'équipe: ${phone}`);
                }
                const providerPhones = await this.providerService.getProviderPhones(booking);
                for (const phone of providerPhones) {
                    await this.sendProviderMessage(phone, 'reminder', booking, { daysUntilAppointment });
                    distributionLogger.info(`WhatsApp de rappel envoyé au prestataire: ${phone}`);
                }
                await this.distributeToProfessionals(booking, 'reminder', undefined, { daysUntilAppointment });
            } catch (error) {
                distributionLogger.error(`Erreur lors de l'envoi du rappel WhatsApp pour la réservation ${booking.getId()}:`, error);
            }
        }
    }

    async distributeToProfessionals(
        booking: Booking,
        messageType: string,
        template?: WhatsAppTemplate,
        additionalData?: Record<string, any>
    ): Promise<void> {
        // À implémenter selon la logique métier (ex: récupérer les professionnels assignés et leur envoyer le message)
        // Pour l'exemple, on log juste
        distributionLogger.info(`(TODO) WhatsApp ${messageType} aux professionnels pour la réservation ${booking.getId()}`);
    }

    // Helpers privés (inchangés)
    private getClientPhone(data: QuoteRequest | Booking): string | undefined {
        if (data instanceof QuoteRequest) {
            return (data as any).getClientPhone ? (data as any).getClientPhone() : undefined;
        } else if (data instanceof Booking) {
            const customer = data.getCustomer();
            return customer?.getContactInfo().getPhone();
        }
        return undefined;
    }

    private async sendClientMessage(
        phone: string,
        messageType: string,
        data: QuoteRequest | Booking,
        template?: WhatsAppTemplate
    ): Promise<string> {
        try {
            let messageId = '';
            if (template) {
                messageId = await this.whatsappService.sendTemplateMessage(phone, template);
            } else {
                const defaultTemplate = this.getDefaultTemplate(messageType, data);
                messageId = await this.whatsappService.sendTemplateMessage(phone, defaultTemplate);
            }

            // Envoyer le document approprié
            if (data instanceof QuoteRequest) {
                await this.whatsappService.sendQuoteDocument(phone, data);
            } else if (data instanceof Booking) {
                switch (messageType) {
                    case 'booking':
                        await this.whatsappService.sendBookingDocument(phone, data);
                        break;
                    case 'payment':
                        await this.whatsappService.sendInvoiceDocument(phone, data);
                        break;
                    case 'reminder':
                        await this.whatsappService.sendReminderDocument(phone, data);
                        break;
                }
            }

            return messageId;
        } catch (error) {
            distributionLogger.error('Erreur lors de l\'envoi du message et des documents', error);
            throw error;
        }
    }

    private async sendTeamMessage(
        phone: string,
        messageType: string,
        data: QuoteRequest | Booking,
        metadata?: Record<string, any>
    ): Promise<string> {
        try {
            const message = this.formatTeamMessage(messageType, data, metadata);
            const messageId = await this.whatsappService.sendTextMessage(phone, message);

            // Envoyer le document approprié
            if (data instanceof QuoteRequest) {
                await this.whatsappService.sendQuoteDocument(phone, data);
            } else if (data instanceof Booking) {
                switch (messageType) {
                    case 'booking':
                        await this.whatsappService.sendBookingDocument(phone, data);
                        break;
                    case 'payment':
                        await this.whatsappService.sendInvoiceDocument(phone, data);
                        break;
                    case 'reminder':
                        await this.whatsappService.sendReminderDocument(phone, data);
                        break;
                }
            }

            return messageId;
        } catch (error) {
            distributionLogger.error("Erreur lors de l'envoi du message à l'équipe", error);
            throw error;
        }
    }

    private async sendProviderMessage(
        phone: string,
        messageType: string,
        data: QuoteRequest | Booking,
        metadata?: Record<string, any>
    ): Promise<string> {
        try {
            const message = this.formatProviderMessage(messageType, data, metadata);
            const messageId = await this.whatsappService.sendTextMessage(phone, message);

            // Envoyer le document approprié
            if (data instanceof QuoteRequest) {
                await this.whatsappService.sendQuoteDocument(phone, data);
            } else if (data instanceof Booking) {
                switch (messageType) {
                    case 'booking':
                        await this.whatsappService.sendBookingDocument(phone, data);
                        break;
                    case 'payment':
                        await this.whatsappService.sendInvoiceDocument(phone, data);
                        break;
                    case 'reminder':
                        await this.whatsappService.sendReminderDocument(phone, data);
                        break;
                }
            }

            return messageId;
        } catch (error) {
            distributionLogger.error('Erreur lors de l\'envoi du message au prestataire', error);
            throw error;
        }
    }

    private getDefaultTemplate(
        messageType: string,
        data: QuoteRequest | Booking
    ): WhatsAppTemplate {
        // Logique de sélection du template par défaut selon le type de message
        // À implémenter selon les besoins spécifiques
        return {
            name: `default_${messageType}_template`,
            language: {
                code: 'fr'
            },
            components: []
        };
    }

    private formatTeamMessage(
        messageType: string,
        data: QuoteRequest | Booking,
        metadata?: Record<string, any>
    ): string {
        // Formater le message pour l'équipe selon le type
        let message = `[${messageType.toUpperCase()}] `;
        
        if (data instanceof QuoteRequest) {
            message += `Nouvelle demande de devis #${data.getId()}`;
        } else if (data instanceof Booking) {
            message += `Réservation #${data.getId()}`;
        }

        if (metadata) {
            message += `\nInfos: ${JSON.stringify(metadata)}`;
        }

        return message;
    }

    private formatProviderMessage(
        messageType: string,
        data: QuoteRequest | Booking,
        metadata?: Record<string, any>
    ): string {
        // Formater le message pour les prestataires selon le type
        let message = `[${messageType.toUpperCase()}] `;
        
        if (data instanceof Booking) {
            message += `Nouvelle mission #${data.getId()}`;
            const scheduledDate = data.getScheduledDate();
            if (scheduledDate) {
                message += `\nDate: ${scheduledDate.toLocaleDateString()}`;
            }
        }

        if (metadata) {
            message += `\nInfos: ${JSON.stringify(metadata)}`;
        }

        return message;
    }
} 