import nodemailer from 'nodemailer'
import { emailTemplates } from './emailTemplates'

interface EmailOptions {
  to: string
  subject: string
  template: keyof typeof emailTemplates
  templateData: any
  attachments?: Array<{
    filename: string
    content: Buffer
  }>
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

  async sendBookingConfirmation(to: string, templateData: any, pdfBuffer?: Buffer): Promise<void> {
    const attachments = pdfBuffer ? [{
      filename: 'booking-confirmation.pdf',
      content: pdfBuffer
    }] : undefined

    await this.sendEmail({
      to,
      subject: 'Booking Confirmation - Cleaning Service',
      template: 'bookingConfirmation',
      templateData,
      attachments
    })
  },

  async sendPaymentReceipt(to: string, templateData: any, pdfBuffer: Buffer): Promise<void> {
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