import { IWhatsAppService } from '../../domain/interfaces/whatsapp/IWhatsAppService';
import { Booking } from '../../domain/entities/Booking';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import { logger } from '@/lib/logger';
import { whatsappConfig } from '@/config/whatsapp-recipients';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { priceUtils } from '@/utils/priceUtils';
import { WhatsAppSessionManager } from '../services/whatsapp/WhatsAppSessionManager';
import { WhatsAppMessageQueue } from '../services/whatsapp/WhatsAppMessageQueue';
import { WhatsAppRateLimiter } from '../services/whatsapp/WhatsAppRateLimiter';
import { WhatsAppAnalytics } from '../services/whatsapp/WhatsAppAnalytics';
import { WhatsAppWebhookHandler } from '../services/whatsapp/WhatsAppWebhookHandler';
import { PDFService } from './PDFService';

const whatsappLogger = logger.withContext('WhatsAppService');

export class WhatsAppService implements IWhatsAppService {
    private readonly API_VERSION = 'v17.0';
    private readonly BASE_URL: string;
    private readonly ACCESS_TOKEN: string;
    private readonly PHONE_NUMBER_ID: string;
    private readonly enabled: boolean;
    private readonly isDevelopment: boolean;

    private sessionManager: WhatsAppSessionManager;
    private messageQueue: WhatsAppMessageQueue;
    private rateLimiter: WhatsAppRateLimiter;
    private analytics: WhatsAppAnalytics;
    private webhookHandler: WhatsAppWebhookHandler;
    private pdfService: PDFService;

    constructor(pdfService: PDFService) {
        // Initialisation des configurations
        this.ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
        this.PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
        this.BASE_URL = `https://graph.facebook.com/${this.API_VERSION}/${this.PHONE_NUMBER_ID}`;
        this.enabled = whatsappConfig.enabled;
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        this.pdfService = pdfService;

        if (!this.ACCESS_TOKEN || !this.PHONE_NUMBER_ID) {
            throw new Error('WhatsApp configuration missing');
        }

        // Initialisation des composants
        this.rateLimiter = new WhatsAppRateLimiter();
        this.sessionManager = new WhatsAppSessionManager();
        this.messageQueue = new WhatsAppMessageQueue(this.rateLimiter);
        this.analytics = new WhatsAppAnalytics();
        this.webhookHandler = new WhatsAppWebhookHandler(
            this.sessionManager,
            this.messageQueue,
            this.analytics
        );
        
        if (this.isDevelopment) {
            whatsappLogger.info('Service WhatsApp en mode développement - pas d\'envoi réel de messages');
        }

        whatsappLogger.info('WhatsApp service initialized');
    }

    // Méthodes publiques pour l'envoi de messages
    public async sendTextMessage(to: string, text: string): Promise<string> {
        if (!this.isServiceEnabled()) return '';

        const message = {
            to: this.formatPhoneNumber(to),
            type: 'text',
            text: { body: text }
        };

        return this.sendMessage(message);
    }

    public async sendTemplateMessage(
        phoneNumber: string, 
        template: any
    ): Promise<string> {
        if (!this.isServiceEnabled()) return '';
        if (!this.sessionManager.canSendTemplate(phoneNumber)) {
            throw new Error('Cannot send template message during active session');
        }

        // Si la template est un objet avec name, on extrait le nom
        const templateName = typeof template === 'string' ? template : template.name;
        // Si la template a des paramètres, on les utilise
        const templateParams = typeof template === 'string' ? {} : 
            (template.components && template.components.length > 0 && template.components[0].parameters) ?
            template.components[0].parameters.reduce((params: any, param: any) => {
                params[param.key || param.name || `param${Object.keys(params).length}`] = param.text || param.value;
                return params;
            }, {}) : {};

        const message = {
            to: this.formatPhoneNumber(phoneNumber),
            type: 'template',
            template: {
                name: templateName,
                language: { code: template.language?.code || 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([_, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            }
        };

        return this.sendMessage(message);
    }

    // Méthodes pour l'envoi de documents
    public async sendQuoteDocument(to: string, quoteRequest: QuoteRequest): Promise<string> {
        if (!this.isServiceEnabled()) return '';

        const pdfPath = await this.pdfService.generateQuotePDF(quoteRequest);
        const mediaMessage = {
            type: 'document',
            url: pdfPath,
            caption: 'Votre devis détaillé'
        };
        return this.sendMediaMessage(to, mediaMessage);
    }

    public async sendBookingDocument(to: string, booking: Booking): Promise<string> {
        if (!this.isServiceEnabled()) return '';

        const pdfPath = await this.pdfService.generateBookingPDF(booking);
        const mediaMessage = {
            type: 'document',
            url: pdfPath,
            caption: 'Votre confirmation de réservation'
        };
        return this.sendMediaMessage(to, mediaMessage);
    }

    public async sendInvoiceDocument(to: string, booking: Booking): Promise<string> {
        if (!this.isServiceEnabled()) return '';

        const pdfPath = await this.pdfService.generateInvoicePDF(booking);
        const mediaMessage = {
            type: 'document',
            url: pdfPath,
            caption: 'Votre facture'
        };
        return this.sendMediaMessage(to, mediaMessage);
    }

    public async sendReminderDocument(to: string, booking: Booking): Promise<string> {
        if (!this.isServiceEnabled()) return '';

        // Utilise generateBookingPDF car generateReminderPDF n'existe pas
        const pdfPath = await this.pdfService.generateBookingPDF(booking);
        const mediaMessage = {
            type: 'document',
            url: pdfPath,
            caption: 'Rappel de votre rendez-vous'
        };
        return this.sendMediaMessage(to, mediaMessage);
    }

    // Méthodes métier
    async sendQuoteRequestNotification(phoneNumber: string, quoteRequest: QuoteRequest): Promise<void> {
        try {
            const quoteData = quoteRequest.getQuoteData();
            if (!quoteData) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: données de devis manquantes');
                return;
            }

            const clientName = `${quoteData.firstName || ''} ${quoteData.lastName || ''}`.trim() || 'Client';
            
            const templateParams = {
                client_name: clientName,
                quote_id: quoteRequest.getId(),
                service_type: quoteData.type || 'Service'
            };
            
            const template = {
                name: whatsappConfig.templates.quoteRequest.name,
                language: { code: 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            };
            
            await this.sendTemplateMessage(phoneNumber, template);
            
            whatsappLogger.info(`Message WhatsApp de confirmation de demande de devis envoyé à ${phoneNumber}`);
        } catch (error) {
            this.handleError('confirmation de demande de devis', error);
        }
    }

    /**
     * Envoie un message WhatsApp pour confirmer un devis
     */
    async sendQuoteConfirmation(phoneNumber: string, quoteRequest: QuoteRequest): Promise<void> {
        try {
            if (!this.isServiceEnabled()) return;
            
            const quoteData = quoteRequest.getQuoteData();
            if (!quoteData) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: données de devis manquantes');
                return;
            }

            const clientName = `${quoteData.firstName || ''} ${quoteData.lastName || ''}`.trim() || 'Client';
            const amount = quoteData.price || 0;
            const total = priceUtils.calculateTotal(amount).total;
            
            // URL de paiement (à adapter selon la logique de l'application)
            const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/payment/${quoteRequest.getId()}`;
            
            // Paramètres du template
            const templateParams = {
                client_name: clientName,
                quote_id: quoteRequest.getId(),
                total_amount: priceUtils.format(total),
                payment_link: paymentLink
            };
            
            const template = {
                name: whatsappConfig.templates.quoteConfirmation.name,
                language: { code: 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            };
            
            // Envoi du message
            await this.sendTemplateMessage(phoneNumber, template);
            
            whatsappLogger.info(`Message WhatsApp de confirmation de devis envoyé à ${phoneNumber}`);
        } catch (error) {
            this.handleError('confirmation de devis', error);
        }
    }

    /**
     * Envoie un message WhatsApp pour le suivi d'un devis
     */
    async sendQuoteFollowUp(phoneNumber: string, quoteRequest: QuoteRequest): Promise<void> {
        try {
            if (!this.isServiceEnabled()) return;
            
            const quoteData = quoteRequest.getQuoteData();
            if (!quoteData) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: données de devis manquantes');
                return;
            }

            const clientName = `${quoteData.firstName || ''} ${quoteData.lastName || ''}`.trim() || 'Client';
            
            // Date d'expiration (30 jours après création)
            const createdAt = quoteRequest.getCreatedAt();
            const expiryDate = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
            const formattedExpiryDate = format(expiryDate, 'PPP', { locale: fr });
            
            // Paramètres du template
            const templateParams = {
                client_name: clientName,
                quote_id: quoteRequest.getId(),
                expiry_date: formattedExpiryDate
            };
            
            const template = {
                name: whatsappConfig.templates.quoteFollowUp.name,
                language: { code: 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            };
            
            // Envoi du message
            await this.sendTemplateMessage(phoneNumber, template);
            
            whatsappLogger.info(`Message WhatsApp de suivi de devis envoyé à ${phoneNumber}`);
        } catch (error) {
            this.handleError('suivi de devis', error);
        }
    }

    /**
     * Envoie un message WhatsApp pour confirmer une réservation
     */
    async sendBookingConfirmation(phoneNumber: string, booking: Booking): Promise<void> {
        try {
            if (!this.isServiceEnabled()) return;
            
            const customer = booking.getCustomer();
            if (!customer) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: client manquant');
                return;
            }

            const clientName = customer.getContactInfo().getFullName() || 'Client';
            const scheduledDate = booking.getScheduledDate();
            
            // Formater la date et l'heure
            const formattedDate = scheduledDate ? format(scheduledDate, 'PPP', { locale: fr }) : 'À confirmer';
            const formattedTime = scheduledDate ? format(scheduledDate, 'HH:mm', { locale: fr }) : 'À confirmer';
            
            // Paramètres du template
            const templateParams = {
                client_name: clientName,
                booking_id: booking.getId(),
                service_date: formattedDate,
                service_time: formattedTime
            };
            
            const template = {
                name: whatsappConfig.templates.bookingConfirmation.name,
                language: { code: 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            };
            
            // Envoi du message
            await this.sendTemplateMessage(phoneNumber, template);
            
            whatsappLogger.info(`Message WhatsApp de confirmation de réservation envoyé à ${phoneNumber}`);
        } catch (error) {
            this.handleError('confirmation de réservation', error);
        }
    }

    /**
     * Envoie un message WhatsApp pour confirmer un paiement
     */
    async sendPaymentConfirmation(phoneNumber: string, booking: Booking, transactionId: string): Promise<void> {
        try {
            if (!this.isServiceEnabled()) return;
            
            const customer = booking.getCustomer();
            if (!customer) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: client manquant');
                return;
            }

            const clientName = customer.getContactInfo().getFullName() || 'Client';
            const scheduledDate = booking.getScheduledDate();
            
            // Montant payé (acompte ou total)
            const depositAmount = booking.getDepositAmount();
            const amount = depositAmount ? depositAmount.getAmount() : booking.getTotalAmount().getAmount() * 0.3;
            
            // Formater la date
            const formattedDate = scheduledDate ? format(scheduledDate, 'PPP', { locale: fr }) : 'À confirmer';
            
            // Paramètres du template
            const templateParams = {
                client_name: clientName,
                amount: priceUtils.format(amount),
                booking_id: booking.getId(),
                service_date: formattedDate
            };
            
            const template = {
                name: whatsappConfig.templates.paymentConfirmation.name,
                language: { code: 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            };
            
            // Envoi du message
            await this.sendTemplateMessage(phoneNumber, template);
            
            whatsappLogger.info(`Message WhatsApp de confirmation de paiement envoyé à ${phoneNumber}`);
        } catch (error) {
            this.handleError('confirmation de paiement', error);
        }
    }

    /**
     * Envoie un message WhatsApp pour notifier une annulation
     */
    async sendCancellationNotification(phoneNumber: string, booking: Booking, reason?: string): Promise<void> {
        try {
            if (!this.isServiceEnabled()) return;
            
            const customer = booking.getCustomer();
            if (!customer) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: client manquant');
                return;
            }

            const clientName = customer.getContactInfo().getFullName() || 'Client';
            
            // Paramètres du template
            const templateParams = {
                client_name: clientName,
                booking_ref: booking.getId(),
                reason: reason || 'Annulation demandée'
            };
            
            const template = {
                name: whatsappConfig.templates.cancellationNotification.name,
                language: { code: 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            };
            
            // Envoi du message
            await this.sendTemplateMessage(phoneNumber, template);
            
            whatsappLogger.info(`Message WhatsApp de notification d'annulation envoyé à ${phoneNumber}`);
        } catch (error) {
            this.handleError('notification d\'annulation', error);
        }
    }

    /**
     * Envoie un message WhatsApp pour rappeler un rendez-vous à venir
     */
    async sendAppointmentReminder(phoneNumber: string, booking: Booking, daysUntilAppointment: number): Promise<void> {
        try {
            if (!this.isServiceEnabled()) return;
            
            const customer = booking.getCustomer();
            if (!customer) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: client manquant');
                return;
            }

            const clientName = customer.getContactInfo().getFullName() || 'Client';
            const scheduledDate = booking.getScheduledDate();
            
            if (!scheduledDate) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: date de rendez-vous manquante');
                return;
            }
            
            // Choisir le template en fonction du nombre de jours restants
            let templateName = '';
            
            if (daysUntilAppointment > 5) {
                // Pas de template pour les rappels trop lointains
                return;
            } else if (daysUntilAppointment >= 2) {
                // J-3 ou plus: rappel à mi-chemin
                templateName = whatsappConfig.templates.midwayReminder.name;
                const formattedDate = format(scheduledDate, 'PPP', { locale: fr });
                
                // Paramètres du template
                const templateParams = {
                    client_name: clientName,
                    service_date: formattedDate,
                    booking_ref: booking.getId()
                };
                
                const template = {
                    name: templateName,
                    language: { code: 'fr' },
                    components: [{
                        type: 'body',
                        parameters: Object.entries(templateParams).map(([key, value]) => ({
                            type: 'text',
                            text: value
                        }))
                    }]
                };
                
                // Envoi du message
                await this.sendTemplateMessage(phoneNumber, template);
            } else {
                // J-1: rappel la veille
                templateName = whatsappConfig.templates.dayBeforeReminder.name;
                const formattedTime = format(scheduledDate, 'HH:mm', { locale: fr });
                const location = booking.getLocation() || 'Adresse enregistrée';
                
                // On utilise un numéro de contact du professionnel (à adapter)
                const contactName = 'Notre équipe';
                
                // Paramètres du template
                const templateParams = {
                    client_name: clientName,
                    time: formattedTime,
                    address: location,
                    contact_name: contactName
                };
                
                const template = {
                    name: templateName,
                    language: { code: 'fr' },
                    components: [{
                        type: 'body',
                        parameters: Object.entries(templateParams).map(([key, value]) => ({
                            type: 'text',
                            text: value
                        }))
                    }]
                };
                
                // Envoi du message
                await this.sendTemplateMessage(phoneNumber, template);
            }
            
            whatsappLogger.info(`Message WhatsApp de rappel de rendez-vous envoyé à ${phoneNumber} (J-${daysUntilAppointment})`);
        } catch (error) {
            this.handleError('rappel de rendez-vous', error);
        }
    }

    /**
     * Envoie un message WhatsApp pour demander un feedback après le service
     */
    async sendServiceCompletionFeedback(phoneNumber: string, booking: Booking): Promise<void> {
        try {
            if (!this.isServiceEnabled()) return;
            
            const customer = booking.getCustomer();
            if (!customer) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: client manquant');
                return;
            }

            const clientName = customer.getContactInfo().getFullName() || 'Client';
            
            // URL de feedback (à adapter selon la logique de l'application)
            const feedbackLink = `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${booking.getId()}`;
            
            // Paramètres du template
            const templateParams = {
                client_name: clientName,
                booking_ref: booking.getId(),
                feedback_link: feedbackLink
            };
            
            const template = {
                name: whatsappConfig.templates.serviceCompletionFeedback.name,
                language: { code: 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            };
            
            // Envoi du message
            await this.sendTemplateMessage(phoneNumber, template);
            
            whatsappLogger.info(`Message WhatsApp de demande de feedback envoyé à ${phoneNumber}`);
        } catch (error) {
            this.handleError('demande de feedback', error);
        }
    }

    /**
     * Envoie un message WhatsApp pour rappeler de donner un feedback
     */
    async sendFeedbackReminder(phoneNumber: string, booking: Booking): Promise<void> {
        try {
            if (!this.isServiceEnabled()) return;
            
            const customer = booking.getCustomer();
            if (!customer) {
                whatsappLogger.warn('Impossible d\'envoyer le message WhatsApp: client manquant');
                return;
            }

            const clientName = customer.getContactInfo().getFullName() || 'Client';
            
            // URL de feedback (à adapter selon la logique de l'application)
            const feedbackLink = `${process.env.NEXT_PUBLIC_APP_URL}/feedback/${booking.getId()}`;
            
            // Paramètres du template
            const templateParams = {
                client_name: clientName,
                booking_ref: booking.getId(),
                feedback_link: feedbackLink
            };
            
            const template = {
                name: whatsappConfig.templates.feedbackReminder.name,
                language: { code: 'fr' },
                components: [{
                    type: 'body',
                    parameters: Object.entries(templateParams).map(([key, value]) => ({
                        type: 'text',
                        text: value
                    }))
                }]
            };
            
            // Envoi du message
            await this.sendTemplateMessage(phoneNumber, template);
            
            whatsappLogger.info(`Message WhatsApp de rappel de feedback envoyé à ${phoneNumber}`);
        } catch (error) {
            this.handleError('rappel de feedback', error);
        }
    }

    // Méthodes utilitaires
    private async sendMessage(message: any): Promise<string> {
        try {
            if (!await this.rateLimiter.canSendMessage(message.type)) {
                throw new Error('Rate limit exceeded');
            }

            const messageId = await this.messageQueue.addMessage(message);

            if (this.isDevelopment) {
                whatsappLogger.info('Simulation d\'envoi de message WhatsApp:', message);
                return messageId;
            }

            const response = await this.makeApiRequest('messages', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                ...message
            });

            this.sessionManager.updateSession(message.to, 'outgoing');
            await this.analytics.trackOutgoingMessage({
                messageId: response.messages[0].id,
                to: message.to,
                type: message.type,
                timestamp: new Date()
            });

            await this.rateLimiter.incrementCounter(message.type);
            whatsappLogger.info(`Message sent successfully: ${messageId}`);
            return messageId;

        } catch (error) {
            whatsappLogger.error('Error sending message:', error);
            throw error;
        }
    }

    private async makeApiRequest(endpoint: string, data: any): Promise<any> {
        try {
            const response = await fetch(`${this.BASE_URL}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erreur API WhatsApp: ${JSON.stringify(errorData)}`);
            }

            return response.json();
        } catch (error) {
            whatsappLogger.error('API request failed:', error);
            throw error;
        }
    }

    private formatPhoneNumber(phoneNumber: string): string {
        const digitsOnly = phoneNumber.replace(/\D/g, '');
        return digitsOnly.startsWith('0') ? `33${digitsOnly.substring(1)}` : digitsOnly;
    }

    private isServiceEnabled(): boolean {
        if (!this.enabled) {
            whatsappLogger.info('Service WhatsApp désactivé');
            return false;
        }
        
        if (!this.ACCESS_TOKEN || !this.PHONE_NUMBER_ID) {
            whatsappLogger.warn('Service WhatsApp non configuré (clés manquantes)');
            return false;
        }
        
        return true;
    }

    private handleError(operationType: string, error: unknown): never {
        whatsappLogger.error(`Erreur lors de l'envoi du message WhatsApp de ${operationType}:`, error);
        throw new Error(`Échec d'envoi du message WhatsApp de ${operationType}: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Méthodes de monitoring et d'analytics
    public getSessionStats() {
        return this.sessionManager.getSessionStats();
    }

    public getQueueStats() {
        return this.messageQueue.getQueueStats();
    }

    public getRateLimitStatus() {
        return this.rateLimiter.getLimitStatus();
    }

    public getAnalytics(period?: { start: Date; end: Date }) {
        // Méthode à implémenter sur WhatsAppAnalytics
        return this.analytics.getMetrics ? this.analytics.getMetrics(period) : { 
            messages: { total: 0, sent: 0, delivered: 0, read: 0, failed: 0 },
            sessions: { total: 0, active: 0, completed: 0 },
            contacts: { total: 0, opted_in: 0, opted_out: 0 }
        };
    }

    /**
     * Vérifie le token de webhook lors de l'enregistrement par Meta
     */
    public verifyWebhook(
        mode: string | null, 
        token: string | null, 
        challenge: string | null
    ): string | null {
        if (mode !== 'subscribe' || token !== process.env.WHATSAPP_VERIFY_TOKEN) {
            whatsappLogger.warn('Webhook verification failed: invalid mode or token');
            return null;
        }
        
        whatsappLogger.info('Webhook verified successfully');
        return challenge;
    }

    /**
     * Traite les événements du webhook WhatsApp
     */
    public async handleWebhook(payload: any): Promise<void> {
        try {
            // Gérer le webhook en mode sécurisé
            whatsappLogger.info('Traitement de l\'événement webhook WhatsApp');
            
            // Implémentation générique pour éviter les erreurs
            const event = payload.entry?.[0]?.changes?.[0]?.value;
            if (!event) {
                whatsappLogger.warn('Format de webhook non reconnu');
                return;
            }
            
            // Traitement des messages entrants
            if (event.messages && event.messages.length > 0) {
                for (const message of event.messages) {
                    const from = message.from;
                    const type = message.type;
                    
                    // Mise à jour de la session
                    if (this.sessionManager.updateSession) {
                        this.sessionManager.updateSession(from, 'incoming');
                    }
                    
                    // Mise à jour des analytics
                    if (this.analytics.trackIncomingMessage) {
                        this.analytics.trackIncomingMessage({
                            from: from,
                            type: type,
                            timestamp: new Date(message.timestamp * 1000)
                        });
                    }
                    
                    whatsappLogger.info(`Message WhatsApp reçu de ${from} de type ${type}`);
                }
            }
            
            // Traitement des statuts
            if (event.statuses && event.statuses.length > 0) {
                for (const status of event.statuses) {
                    const recipient = status.recipient_id;
                    const state = status.status;
                    
                    // Mise à jour des analytics
                    if (this.analytics.trackMessageStatus) {
                        this.analytics.trackMessageStatus({
                            messageId: status.id,
                            recipientId: recipient,
                            status: state,
                            timestamp: new Date()
                        });
                    }
                    
                    whatsappLogger.info(`Statut de message mis à jour pour ${recipient}: ${state}`);
                }
            }
        } catch (error) {
            whatsappLogger.error('Error processing webhook:', error);
            throw error;
        }
    }

    // Méthode pour l'envoi de messages média (documents, images, etc.)
    public async sendMediaMessage(to: string, mediaMessage: any): Promise<string> {
        if (!this.isServiceEnabled()) return '';

        const message = {
            to: this.formatPhoneNumber(to),
            type: mediaMessage.type,
            [mediaMessage.type]: {
                link: mediaMessage.url,
                caption: mediaMessage.caption
            }
        };

        return this.sendMessage(message);
    }

    public async sendInteractiveMessage(phoneNumber: string, template: any): Promise<string> {
        if (!this.isServiceEnabled()) return '';

        const message = {
            to: this.formatPhoneNumber(phoneNumber),
            type: 'interactive',
            interactive: template
        };

        return this.sendMessage(message);
    }

    public async isSessionActive(phoneNumber: string): Promise<boolean> {
        return this.sessionManager.isSessionActive(phoneNumber);
    }

    public async refreshSession(phoneNumber: string): Promise<void> {
        // Simulation pour l'interface
        whatsappLogger.info(`Rafraîchissement de la session pour ${phoneNumber}`);
    }

    public async getMessageStatus(messageId: string): Promise<{
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: Date;
        error?: string;
    }> {
        return {
            status: 'sent',
            timestamp: new Date(),
        };
    }

    public async markOptIn(phoneNumber: string): Promise<void> {
        // Implémentation à compléter
    }

    public async markOptOut(phoneNumber: string): Promise<void> {
        // Implémentation à compléter
    }

    public async getContactStatus(phoneNumber: string): Promise<'opted_in' | 'opted_out' | 'unknown'> {
        return 'opted_in';
    }

    public async getMessageStats(period: 'day' | 'week' | 'month'): Promise<{
        sent: number;
        delivered: number;
        read: number;
        failed: number;
        responseRate: number;
    }> {
        return {
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
            responseRate: 0
        };
    }
} 