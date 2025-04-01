import { IEmailService } from '../../domain/interfaces/IEmailService';
import { Booking } from '../../domain/entities/Booking';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';

export class EmailService implements IEmailService {
    private readonly smtpHost: string;
    private readonly smtpPort: number;
    private readonly smtpUser: string;
    private readonly smtpPassword: string;
    private readonly fromEmail: string;
    private readonly isDevelopment: boolean;

    constructor(
        smtpHost: string,
        smtpPort: number,
        smtpUser: string,
        smtpPassword: string,
        fromEmail: string,
        isDevelopment: boolean = false
    ) {
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
        this.smtpUser = smtpUser;
        this.smtpPassword = smtpPassword;
        this.fromEmail = fromEmail;
        this.isDevelopment = isDevelopment;
    }

    public async sendQuoteConfirmation(quoteRequest: QuoteRequest, pdfPath?: string): Promise<void> {
        try {
            const quoteData = quoteRequest.getQuoteData();
            const recipientEmail = quoteData?.email || quoteData?.contactInfo?.email;
            
            if (!recipientEmail) {
                throw new Error('No recipient email available for quote confirmation');
            }

            console.log(`[Email] Sending quote confirmation to ${recipientEmail}`);
            
            if (this.isDevelopment) {
                console.log('[Email] Development mode - not sending actual email');
                console.log(`[Email] Quote PDF: ${pdfPath || 'No PDF attached'}`);
                return;
            }

            // Ici, ajoutez le code pour envoyer un vrai email
            await this.delay(500);
            console.log(`[Email] Quote confirmation sent to ${recipientEmail}`);
        } catch (error) {
            console.error('[Email] Failed to send quote confirmation:', error);
            throw new Error(`Failed to send quote confirmation: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async sendBookingConfirmation(booking: Booking): Promise<void> {
        try {
            const recipientEmail = booking.getCustomer().getEmail();
            console.log(`[Email] Sending booking confirmation to ${recipientEmail}`);
            
            if (this.isDevelopment) {
                console.log('[Email] Development mode - not sending actual email');
                return;
            }

            // Ici, ajoutez le code pour envoyer un vrai email
            await this.delay(500);
            console.log(`[Email] Booking confirmation sent to ${recipientEmail}`);
        } catch (error) {
            console.error('[Email] Failed to send booking confirmation:', error);
            throw new Error(`Failed to send booking confirmation: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async sendPaymentConfirmation(booking: Booking, transactionId: string): Promise<void> {
        try {
            const recipientEmail = booking.getCustomer().getEmail();
            console.log(`[Email] Sending payment confirmation to ${recipientEmail} for transaction ${transactionId}`);
            
            if (this.isDevelopment) {
                console.log('[Email] Development mode - not sending actual email');
                return;
            }

            // Ici, ajoutez le code pour envoyer un vrai email
            await this.delay(500);
            console.log(`[Email] Payment confirmation sent to ${recipientEmail}`);
        } catch (error) {
            console.error('[Email] Failed to send payment confirmation:', error);
            throw new Error(`Failed to send payment confirmation: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public async sendCancellationNotification(booking: Booking, reason?: string): Promise<void> {
        try {
            const recipientEmail = booking.getCustomer().getEmail();
            console.log(`[Email] Sending cancellation notification to ${recipientEmail}`);
            
            if (this.isDevelopment) {
                console.log('[Email] Development mode - not sending actual email');
                console.log(`[Email] Cancellation reason: ${reason || 'Not specified'}`);
                return;
            }

            // Ici, ajoutez le code pour envoyer un vrai email
            await this.delay(500);
            console.log(`[Email] Cancellation notification sent to ${recipientEmail}`);
        } catch (error) {
            console.error('[Email] Failed to send cancellation notification:', error);
            throw new Error(`Failed to send cancellation notification: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
} 