import nodemailer from 'nodemailer';
import { SmtpOptions } from 'nodemailer-smtp-transport';

/**
 * Service d'infrastructure pour l'envoi d'emails
 */
export class MailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  /**
   * Constructeur avec injection des dépendances
   */
  constructor(smtpConfig: SmtpOptions, fromEmail: string) {
    this.transporter = nodemailer.createTransport(smtpConfig);
    this.fromEmail = fromEmail;
  }

  /**
   * Envoie un email
   */
  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
    attachments: Array<{
      filename: string;
      content: Buffer;
      contentType?: string;
    }> = []
  ): Promise<{ messageId: string }> {
    try {
      const mailOptions = {
        from: this.fromEmail,
        to,
        subject,
        text,
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email envoyé: %s', info.messageId);
      
      return {
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw new Error(`Erreur lors de l'envoi de l'email: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie la configuration SMTP
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Configuration SMTP vérifiée avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification de la configuration SMTP:', error);
      return false;
    }
  }
} 