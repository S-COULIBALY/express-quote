import { CleaningQuote } from '@/types/quote'
import { dateUtils } from './dateUtils'
import { priceUtils } from './priceUtils'

interface EmailTemplateData {
  quote: CleaningQuote
  clientName: string
  paymentDetails?: {
    transactionId: string
    depositAmount: number
  }
}

export const emailTemplates = {
  bookingConfirmation(data: EmailTemplateData): string {
    const { clientName, paymentDetails } = data
    const { tax: _tax, total } = priceUtils.calculateTotal(data.quote.estimatedPrice)

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a; text-align: center;">Booking Confirmation</h1>
        
        <p>Dear ${clientName},</p>
        
        <p>Thank you for choosing our cleaning service. Your booking has been confirmed with the following details:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #334155; margin-top: 0;">Service Details</h2>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Service Type:</strong> ${data.quote.cleaningType}</li>
            <li><strong>Property Type:</strong> ${data.quote.propertyType}</li>
            <li><strong>Date:</strong> ${dateUtils.format(data.quote.preferredDate, 'long')}</li>
            <li><strong>Time:</strong> ${data.quote.preferredTime}</li>
          </ul>
          
          <h3 style="color: #334155;">Payment Summary</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Subtotal:</strong> ${priceUtils.format(data.quote.estimatedPrice)}</li>
            <li><strong>TVA (7.7%):</strong> ${priceUtils.format(tax)}</li>
            <li><strong>Total:</strong> ${priceUtils.format(total)}</li>
            ${paymentDetails ? `
              <li><strong>Deposit Paid:</strong> ${priceUtils.format(paymentDetails.depositAmount)}</li>
              <li><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</li>
              <li><strong>Balance Due:</strong> ${priceUtils.format(total - paymentDetails.depositAmount)}</li>
            ` : ''}
          </ul>
        </div>

        <h3 style="color: #334155;">What's Next?</h3>
        <ol style="color: #475569;">
          <li>Our team will arrive at your location on the scheduled date and time</li>
          <li>Please ensure access to all areas that need to be cleaned</li>
          <li>The remaining balance will be collected after the service is completed</li>
        </ol>

        <p style="margin-top: 20px;">
          If you need to modify or cancel your booking, please contact us at least 24 hours before the scheduled service.
        </p>

        <div style="text-align: center; margin-top: 30px; color: #64748b;">
          <p>Thank you for your business!</p>
          <p>
            <small>This is an automated email, please do not reply directly to this message.</small>
          </p>
        </div>
      </div>
    `
  },

  paymentReceipt(data: EmailTemplateData): string {
    const { quote, clientName, paymentDetails } = data
    if (!paymentDetails) throw new Error('Payment details required for receipt')

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a; text-align: center;">Payment Receipt</h1>
        
        <p>Dear ${clientName},</p>
        
        <p>We have received your payment for the cleaning service. Here are your payment details:</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #334155; margin-top: 0;">Payment Details</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Amount Paid:</strong> ${priceUtils.format(paymentDetails.depositAmount)}</li>
            <li><strong>Transaction ID:</strong> ${paymentDetails.transactionId}</li>
            <li><strong>Date:</strong> ${dateUtils.format(new Date(), 'long')}</li>
          </ul>
        </div>

        <p style="color: #475569;">
          A PDF copy of your receipt is attached to this email for your records.
        </p>

        <div style="text-align: center; margin-top: 30px; color: #64748b;">
          <p>Thank you for your payment!</p>
        </div>
      </div>
    `
  }
} 