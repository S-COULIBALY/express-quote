import nodemailer from 'nodemailer'
import { emailTemplates } from './emailTemplates'
import type { EmailTemplateData } from './emailTemplates'

interface EmailAttachment {
  filename: string
  content: Buffer
}

interface EmailOptions {
  to: string
  subject: string
  template: keyof typeof emailTemplates
  templateData: EmailTemplateData
  attachments?: EmailAttachment[]
}

// Configuration du transporteur d'email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export const emailUtils = {
  async sendEmail(options: EmailOptions): Promise<void> {
    const { to, subject, template, templateData, attachments } = options

    try {
      const html = emailTemplates[template](templateData)

      await transporter.sendMail({
        from: `"${process.env.COMPANY_NAME}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments
      })
    } catch (error) {
      console.error('Failed to send email:', error)
      throw error
    }
  },

  async sendBookingConfirmation(
    to: string, 
    templateData: EmailTemplateData,
    attachments?: EmailAttachment[]
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Confirmation de votre réservation',
      template: 'bookingConfirmation',
      templateData,
      attachments
    })
  },

  async sendPaymentReceipt(
    to: string, 
    templateData: EmailTemplateData,
    pdfBuffer: Buffer
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Reçu de paiement pour votre service',
      template: 'paymentReceipt',
      templateData,
      attachments: [{
        filename: 'paiement-recu.pdf',
        content: pdfBuffer
      }]
    })
  },

  async sendQuoteConfirmation(
    to: string,
    templateData: EmailTemplateData,
    pdfBuffer: Buffer
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Votre devis est prêt',
      template: 'quoteConfirmation',
      templateData,
      attachments: [{
        filename: 'devis.pdf',
        content: pdfBuffer
      }]
    })
  },

  async sendServiceConfirmation(
    to: string,
    templateData: EmailTemplateData
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Confirmation de votre service',
      template: 'serviceConfirmation',
      templateData
    })
  },

  async sendCancellationNotification(
    to: string,
    templateData: EmailTemplateData
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Annulation de votre réservation',
      template: 'cancellationNotification',
      templateData
    })
  }
} 