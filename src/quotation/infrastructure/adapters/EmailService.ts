import { IEmailService } from '../../domain/interfaces/IEmailService';
import { Booking } from '../../domain/entities/Booking';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { logger } from '@/lib/logger';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { priceUtils } from '@/utils/priceUtils';

// Logger
const emailLogger = logger.withContext ? 
  logger.withContext('EmailService') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[EmailService]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[EmailService]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[EmailService]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[EmailService]', msg, ...args)
  };

/**
 * Service pour l'envoi d'emails
 */
export class EmailService implements IEmailService {
    private transporter: nodemailer.Transporter;
    private fromEmail: string;
    private isDevelopment: boolean;

    /**
     * Constructeur du service d'email
     * @param host Hôte SMTP
     * @param port Port SMTP
     * @param user Utilisateur SMTP
     * @param pass Mot de passe SMTP
     * @param fromEmail Adresse email d'expédition
     * @param isDevelopment Mode développement (pas d'envoi réel d'emails)
     */
    constructor(
        host: string = process.env.SMTP_HOST || 'localhost',
        port: number = Number(process.env.SMTP_PORT) || 25,
        user: string = process.env.SMTP_USER || '',
        pass: string = process.env.SMTP_PASSWORD || '',
        fromEmail: string = process.env.EMAIL_FROM || 'noreply@example.com',
        isDevelopment: boolean = process.env.NODE_ENV !== 'production'
    ) {
        this.fromEmail = fromEmail;
        this.isDevelopment = isDevelopment;

        if (isDevelopment) {
            emailLogger.info('Service Email en mode développement - pas d\'envoi réel d\'emails');
            // En développement, utiliser un transporteur qui écrit dans la console
            this.transporter = nodemailer.createTransport({
                jsonTransport: true
            });
        } else {
            // En production, utiliser un transporteur SMTP réel
            emailLogger.info(`Initialisation du transporteur SMTP: ${host}:${port}`);
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: user ? {
                    user,
                    pass
                } : undefined
            });
        }
    }

    /**
     * Envoie un email pour confirmer un devis
     * @param quoteRequest La demande de devis concernée
     * @param pdfPath Chemin optionnel vers un fichier PDF à joindre
     */
    async sendQuoteConfirmation(quoteRequest: QuoteRequest, pdfPath?: string): Promise<void> {
        try {
            const quoteData = quoteRequest.getQuoteData();
            if (!quoteData || !quoteData.email) {
                emailLogger.warn('Impossible d\'envoyer l\'email de confirmation de devis: email manquant');
                return;
            }

            const clientName = `${quoteData.firstName || ''} ${quoteData.lastName || ''}`.trim() || 'Client';
            const amount = quoteData.price || 0;
            const { total, tax } = priceUtils.calculateTotal(amount);

            emailLogger.info(`Préparation de l'email de confirmation de devis pour ${quoteData.email}`);

            // Construction du template HTML
            const html = this.getQuoteConfirmationTemplate({
                clientName,
                quoteId: quoteRequest.getId(),
                serviceType: quoteData.type || 'Service de nettoyage',
                amount,
                tax,
                total,
                scheduledDate: quoteData.scheduledDate 
                    ? format(new Date(quoteData.scheduledDate), 'PPPP', { locale: fr }) 
                    : undefined,
                location: quoteData.location
            });

            // Préparation des pièces jointes
            const attachments = this.prepareAttachments(pdfPath, `devis_${quoteRequest.getId()}.pdf`);

            // Envoi de l'email
            await this.sendEmail({
                to: quoteData.email,
                subject: `Votre devis est prêt - Réf. ${quoteRequest.getId()}`,
                html,
                attachments
            });
            
        } catch (error) {
            this.handleError('confirmation de devis', error);
        }
    }

    /**
     * Envoie un email pour confirmer une réservation
     * @param booking La réservation concernée
     * @param pdfPath Chemin optionnel vers un fichier PDF à joindre
     */
    async sendBookingConfirmation(booking: Booking, pdfPath?: string): Promise<void> {
        try {
            // Extraction des informations du client
            const { clientEmail, clientName } = this.extractClientInfo(booking, 'confirmation de réservation');
            if (!clientEmail) return;

            const scheduledDate = booking.getScheduledDate();
            const formattedDate = scheduledDate ? format(scheduledDate, 'PPPP', { locale: fr }) : 'À déterminer';
            const location = booking.getLocation() || 'À préciser';

            emailLogger.info(`Préparation de l'email de confirmation de réservation pour ${clientEmail}`);

            // Construction du template HTML
            const html = this.getBookingConfirmationTemplate({
                clientName,
                bookingId: booking.getId(),
                scheduledDate: formattedDate,
                location
            });

            // Préparation des pièces jointes
            const attachments = this.prepareAttachments(pdfPath, `reservation_${booking.getId()}.pdf`);

            // Envoi de l'email
            await this.sendEmail({
                to: clientEmail,
                subject: `Confirmation de votre réservation - Réf. ${booking.getId()}`,
                html,
                attachments
            });
            
        } catch (error) {
            this.handleError('confirmation de réservation', error);
        }
    }

    /**
     * Envoie un email pour confirmer un paiement
     * @param booking La réservation concernée
     * @param transactionId L'identifiant de la transaction
     * @param pdfPath Chemin optionnel vers un fichier PDF à joindre
     */
    async sendPaymentConfirmation(booking: Booking, transactionId: string, pdfPath?: string): Promise<void> {
        try {
            // Extraction des informations du client
            const { clientEmail, clientName } = this.extractClientInfo(booking, 'confirmation de paiement');
            if (!clientEmail) return;

            const depositAmount = booking.getDepositAmount();
            const amount = depositAmount ? depositAmount.getAmount() : booking.getTotalAmount().getAmount() * 0.3;

            emailLogger.info(`Préparation de l'email de confirmation de paiement pour ${clientEmail}`);

            // Construction du template HTML
            const html = this.getPaymentConfirmationTemplate({
                clientName,
                bookingId: booking.getId(),
                transactionId,
                amount,
                paymentDate: format(new Date(), 'Pp', { locale: fr })
            });

            // Préparation des pièces jointes
            const attachments = this.prepareAttachments(pdfPath, `recu_paiement_${booking.getId()}.pdf`);

            // Envoi de l'email
            await this.sendEmail({
                to: clientEmail,
                subject: `Confirmation de paiement - Réf. ${booking.getId()}`,
                html,
                attachments
            });
            
        } catch (error) {
            this.handleError('confirmation de paiement', error);
        }
    }

    /**
     * Envoie un email pour notifier une annulation
     * @param booking La réservation annulée
     * @param reason La raison de l'annulation
     */
    async sendCancellationNotification(booking: Booking, reason?: string): Promise<void> {
        try {
            // Extraction des informations du client
            const { clientEmail, clientName } = this.extractClientInfo(booking, 'notification d\'annulation');
            if (!clientEmail) return;

            const scheduledDate = booking.getScheduledDate();
            const formattedDate = scheduledDate ? format(scheduledDate, 'Pp', { locale: fr }) : 'Date non spécifiée';

            emailLogger.info(`Préparation de l'email de notification d'annulation pour ${clientEmail}`);

            // Construction du template HTML
            const html = this.getCancellationNotificationTemplate({
                clientName,
                bookingId: booking.getId(),
                scheduledDate: formattedDate,
                reason
            });

            // Envoi de l'email
            await this.sendEmail({
                to: clientEmail,
                subject: `Annulation de votre réservation - Réf. ${booking.getId()}`,
                html
            });
            
        } catch (error) {
            this.handleError('notification d\'annulation', error);
        }
    }

    /**
     * Envoie un email pour rappeler un rendez-vous à venir
     * @param booking La réservation concernée
     * @param daysUntilAppointment Le nombre de jours avant le rendez-vous
     */
    async sendAppointmentReminder(booking: Booking, daysUntilAppointment: number): Promise<void> {
        try {
            // Extraction des informations du client
            const { clientEmail, clientName } = this.extractClientInfo(booking, 'rappel de rendez-vous');
            if (!clientEmail) return;

            const scheduledDate = booking.getScheduledDate();
            const formattedDate = scheduledDate ? format(scheduledDate, 'PPPP', { locale: fr }) : 'Date à confirmer';
            const location = booking.getLocation() || 'À préciser';

            emailLogger.info(`Préparation de l'email de rappel pour ${clientEmail}`);

            // Construction du template HTML
            const html = this.getAppointmentReminderTemplate({
                clientName,
                bookingId: booking.getId(),
                scheduledDate: formattedDate,
                location,
                daysUntilAppointment
            });

            // Envoi de l'email
            await this.sendEmail({
                to: clientEmail,
                subject: `Rappel - Votre rendez-vous du ${formattedDate}`,
                html
            });
            
        } catch (error) {
            this.handleError('rappel de rendez-vous', error);
        }
    }

    // --- MÉTHODES PRIVÉES POUR FACTORISER LE CODE ---

    /**
     * Extrait les informations du client à partir d'une réservation
     * @param booking La réservation
     * @param operationType Type d'opération pour le message de log
     * @returns Les informations du client (email et nom)
     */
    private extractClientInfo(booking: Booking, operationType: string): { clientEmail: string | undefined; clientName: string } {
        const customer = booking.getCustomer();
        if (!customer) {
            emailLogger.warn(`Impossible d'envoyer l'email de ${operationType}: client manquant pour la réservation ${booking.getId()}`);
            return { clientEmail: undefined, clientName: 'Client' };
        }

        const contactInfo = customer.getContactInfo();
        const email = contactInfo.getEmail();
        if (!email) {
            emailLogger.warn(`Impossible d'envoyer l'email de ${operationType}: email manquant pour la réservation ${booking.getId()}`);
            return { clientEmail: undefined, clientName: 'Client' };
        }

        const clientName = contactInfo.getFullName() || 'Client';
        return { clientEmail: email, clientName };
    }

    /**
     * Prépare les pièces jointes pour un email
     * @param pdfPath Chemin optionnel vers un fichier PDF
     * @param filename Nom du fichier à utiliser pour la pièce jointe
     * @returns Liste des pièces jointes
     */
    private prepareAttachments(pdfPath?: string, filename?: string): nodemailer.Attachment[] {
        const attachments: nodemailer.Attachment[] = [];
        
        if (pdfPath && fs.existsSync(pdfPath)) {
            attachments.push({
                filename: filename || path.basename(pdfPath),
                content: fs.readFileSync(pdfPath)
            });
            emailLogger.info(`PDF joint à l'email: ${pdfPath}`);
        } else if (pdfPath) {
            emailLogger.warn(`Le fichier PDF n'existe pas: ${pdfPath}`);
        }
        
        return attachments;
    }

    /**
     * Envoie un email avec les informations fournies
     * @param options Options de l'email
     */
    private async sendEmail(options: {
        to: string;
        subject: string;
        html: string;
        attachments?: nodemailer.Attachment[];
    }): Promise<void> {
        const mailOptions = {
            from: this.fromEmail,
            ...options
        };

        if (this.isDevelopment) {
            emailLogger.info('Mode développement - Simulation d\'envoi d\'email', mailOptions);
        } else {
            await this.transporter.sendMail(mailOptions);
            emailLogger.info(`Email envoyé avec succès à ${options.to}`);
        }
    }

    /**
     * Gère les erreurs d'envoi d'email
     * @param operationType Type d'opération pour le message d'erreur
     * @param error Erreur survenue
     */
    private handleError(operationType: string, error: unknown): never {
        emailLogger.error(`Erreur lors de l'envoi de l'email de ${operationType}:`, error);
        throw new Error(`Échec de l'envoi de l'email de ${operationType}: ${error instanceof Error ? error.message : 'erreur inconnue'}`);
    }

    // --- TEMPLATES D'EMAIL ---
    
    private getQuoteConfirmationTemplate(data: {
        clientName: string;
        quoteId: string;
        serviceType: string;
        amount: number;
        tax: number;
        total: number;
        scheduledDate?: string;
        location?: string;
    }): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Votre devis est prêt</h2>
                <p>Bonjour ${data.clientName},</p>
                <p>Nous avons le plaisir de vous confirmer que votre devis pour nos services de nettoyage est maintenant disponible.</p>
                <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #333;">Détails du devis :</h3>
                    <p><strong>Numéro de devis :</strong> ${data.quoteId}</p>
                    <p><strong>Type de service :</strong> ${data.serviceType}</p>
                    <p><strong>Prix HT :</strong> ${data.amount.toFixed(2)} €</p>
                    <p><strong>TVA (${(data.tax / data.amount * 100).toFixed(2)}%) :</strong> ${data.tax.toFixed(2)} €</p>
                    <p><strong>Prix total :</strong> ${data.total.toFixed(2)} €</p>
                    ${data.scheduledDate ? `<p><strong>Date prévue :</strong> ${data.scheduledDate}</p>` : ''}
                    ${data.location ? `<p><strong>Adresse :</strong> ${data.location}</p>` : ''}
                </div>
                <p>Vous trouverez ci-joint une copie PDF de votre devis. Pour accepter ce devis et confirmer votre réservation, merci de nous contacter ou de vous connecter à votre espace client.</p>
                <p>Ce devis est valable pour une durée de 30 jours à compter de la date d'émission.</p>
                <p>Nous vous remercions de votre confiance et restons à votre disposition pour toute information complémentaire.</p>
                <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
            </div>
        `;
    }

    private getBookingConfirmationTemplate(data: {
        clientName: string;
        bookingId: string;
        scheduledDate: string;
        location: string;
    }): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Confirmation de votre réservation</h2>
                <p>Bonjour ${data.clientName},</p>
                <p>Nous avons le plaisir de vous confirmer que votre réservation a bien été enregistrée.</p>
                <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #333;">Détails de votre réservation :</h3>
                    <p><strong>Numéro de réservation :</strong> ${data.bookingId}</p>
                    <p><strong>Date de service :</strong> ${data.scheduledDate}</p>
                    <p><strong>Adresse :</strong> ${data.location}</p>
                </div>
                <p>Nous vous remercions de votre confiance et nous nous réjouissons de vous accueillir prochainement.</p>
                <p>Si vous avez des questions ou souhaitez modifier votre réservation, n'hésitez pas à nous contacter.</p>
                <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
            </div>
        `;
    }

    private getPaymentConfirmationTemplate(data: {
        clientName: string;
        bookingId: string;
        transactionId: string;
        amount: number;
        paymentDate: string;
    }): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Confirmation de votre paiement</h2>
                <p>Bonjour ${data.clientName},</p>
                <p>Nous vous remercions pour votre paiement. Votre transaction a été traitée avec succès.</p>
                <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #333;">Détails du paiement :</h3>
                    <p><strong>Numéro de réservation :</strong> ${data.bookingId}</p>
                    <p><strong>Transaction ID :</strong> ${data.transactionId}</p>
                    <p><strong>Montant payé :</strong> ${data.amount} €</p>
                    <p><strong>Date de paiement :</strong> ${data.paymentDate}</p>
                </div>
                <p>Vous trouverez ci-joint un reçu de votre paiement.</p>
                <p>Nous vous remercions de votre confiance et restons à votre disposition pour toute question.</p>
                <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
            </div>
        `;
    }

    private getCancellationNotificationTemplate(data: {
        clientName: string;
        bookingId: string;
        scheduledDate: string;
        reason?: string;
    }): string {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Annulation de votre réservation</h2>
                <p>Bonjour ${data.clientName},</p>
                <p>Nous vous informons que votre réservation a été annulée.</p>
                <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #333;">Détails de la réservation annulée :</h3>
                    <p><strong>Numéro de réservation :</strong> ${data.bookingId}</p>
                    <p><strong>Date prévue :</strong> ${data.scheduledDate}</p>
                    ${data.reason ? `<p><strong>Motif d'annulation :</strong> ${data.reason}</p>` : ''}
                </div>
                <p>Si vous avez des questions ou si vous souhaitez prévoir une nouvelle réservation, n'hésitez pas à nous contacter.</p>
                <p>Nous vous remercions de votre compréhension.</p>
                <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
            </div>
        `;
    }

    private getAppointmentReminderTemplate(data: {
        clientName: string;
        bookingId: string;
        scheduledDate: string;
        location: string;
        daysUntilAppointment: number;
    }): string {
        const timeMessage = data.daysUntilAppointment === 0 
            ? 'aujourd\'hui' 
            : data.daysUntilAppointment === 1 
                ? 'demain' 
                : `dans ${data.daysUntilAppointment} jours`;

        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
                <h2 style="color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Rappel : Votre rendez-vous approche</h2>
                <p>Bonjour ${data.clientName},</p>
                <p>Nous vous rappelons que votre rendez-vous est prévu ${timeMessage}.</p>
                <div style="background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 5px;">
                    <h3 style="margin-top: 0; color: #333;">Détails de votre rendez-vous :</h3>
                    <p><strong>Numéro de réservation :</strong> ${data.bookingId}</p>
                    <p><strong>Date :</strong> ${data.scheduledDate}</p>
                    <p><strong>Adresse :</strong> ${data.location}</p>
                </div>
                <p>Si vous avez des questions ou si vous devez modifier votre rendez-vous, veuillez nous contacter dès que possible.</p>
                <p>Nous nous réjouissons de vous accueillir prochainement.</p>
                <p style="margin-top: 20px;">Cordialement,<br>L'équipe de service</p>
            </div>
        `;
    }
} 