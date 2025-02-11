import nodemailer from 'nodemailer'
import { emailTemplates } from './emailTemplates'

interface EmailAttachment {
  filename: string
  content: Buffer
}

interface EmailOptions {
  to: string
  subject: string
  template: keyof typeof emailTemplates
  templateData: Record<string, unknown>
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
    templateData: Record<string, unknown>, 
    attachments?: EmailAttachment[]
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Booking Confirmation - Cleaning Service',
      template: 'bookingConfirmation',
      templateData,
      attachments
    })
  },

  async sendPaymentReceipt(
    to: string, 
    templateData: Record<string, unknown>, 
    pdfBuffer: Buffer
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Payment Receipt - Cleaning Service',
      template: 'paymentReceipt',
      templateData,
      attachments: [{
        filename: 'payment-receipt.pdf',
        content: pdfBuffer
      }]
    })
  }
} 