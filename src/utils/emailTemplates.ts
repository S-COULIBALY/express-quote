import { CleaningQuote } from '@/types/quote'
import { dateUtils } from './dateUtils'
import { priceUtils } from './priceUtils'

export interface EmailTemplateData {
  quote: CleaningQuote
  clientName: string
  paymentDetails?: {
    transactionId: string
    depositAmount: number
  }
  cancellationReason?: string
  serviceDate?: string
  serviceAddress?: string
}

export const emailTemplates = {
  bookingConfirmation(data: EmailTemplateData): string {
    const { clientName, paymentDetails } = data
    const { tax, total } = priceUtils.calculateTotal(data.quote.estimatedPrice)

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
    const { clientName, paymentDetails } = data
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
  },

  quoteConfirmation(data: EmailTemplateData): string {
    const { clientName } = data
    const { tax, total } = priceUtils.calculateTotal(data.quote.estimatedPrice)

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a; text-align: center;">Votre devis est prêt</h1>
        
        <p>Bonjour ${clientName},</p>
        
        <p>Nous vous remercions de votre intérêt pour nos services. Votre devis est maintenant disponible.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="color: #334155; margin-top: 0;">Détails du service</h2>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Type de service :</strong> ${data.quote.cleaningType}</li>
            <li><strong>Type de propriété :</strong> ${data.quote.propertyType}</li>
            <li><strong>Date souhaitée :</strong> ${dateUtils.format(data.quote.preferredDate, 'long')}</li>
            <li><strong>Heure souhaitée :</strong> ${data.quote.preferredTime}</li>
          </ul>
          
          <h3 style="color: #334155;">Résumé des coûts</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Sous-total :</strong> ${priceUtils.format(data.quote.estimatedPrice)}</li>
            <li><strong>TVA (7.7%) :</strong> ${priceUtils.format(tax)}</li>
            <li><strong>Total :</strong> ${priceUtils.format(total)}</li>
          </ul>
        </div>

        <p>
          Un PDF de votre devis est joint à cet email. Pour confirmer cette réservation, veuillez cliquer sur le bouton "Accepter et payer" dans le devis ou vous connecter à votre compte client.
        </p>

        <p>
          Ce devis est valable pour une durée de 30 jours à compter de la date d'émission.
        </p>

        <div style="text-align: center; margin-top: 30px; color: #64748b;">
          <p>Merci de votre confiance !</p>
          <p>
            <small>Ceci est un email automatique, merci de ne pas y répondre directement.</small>
          </p>
        </div>
      </div>
    `
  },

  serviceConfirmation(data: EmailTemplateData): string {
    const { clientName, serviceDate, serviceAddress } = data

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a; text-align: center;">Confirmation de votre service</h1>
        
        <p>Bonjour ${clientName},</p>
        
        <p>Nous vous confirmons que votre service aura lieu comme prévu :</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #334155; margin-top: 0;">Détails du rendez-vous</h3>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Date :</strong> ${serviceDate || 'Date à confirmer'}</li>
            <li><strong>Adresse :</strong> ${serviceAddress || 'Adresse indiquée lors de la réservation'}</li>
          </ul>
        </div>

        <h3 style="color: #334155;">Préparation</h3>
        <ol style="color: #475569;">
          <li>Notre équipe arrivera à l'heure prévue</li>
          <li>Veuillez assurer l'accès à tous les espaces concernés</li>
          <li>Le solde restant sera à régler après la réalisation du service</li>
        </ol>

        <p style="margin-top: 20px;">
          Pour toute modification ou question, n'hésitez pas à nous contacter au moins 24h avant le service.
        </p>

        <div style="text-align: center; margin-top: 30px; color: #64748b;">
          <p>Merci pour votre confiance !</p>
          <p>
            <small>Ceci est un email automatique, merci de ne pas y répondre directement.</small>
          </p>
        </div>
      </div>
    `
  },

  cancellationNotification(data: EmailTemplateData): string {
    const { clientName, cancellationReason } = data

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444; text-align: center;">Annulation de votre réservation</h1>
        
        <p>Bonjour ${clientName},</p>
        
        <p>Nous vous informons que votre réservation a été annulée.</p>
        
        ${cancellationReason ? `
        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #b91c1c; margin-top: 0;">Motif de l'annulation</h3>
          <p style="color: #ef4444;">${cancellationReason}</p>
        </div>
        ` : ''}

        <p>
          Si vous avez effectué un paiement d'acompte, celui-ci vous sera remboursé dans un délai de 5 à 10 jours ouvrables.
        </p>

        <p>
          Si vous souhaitez reprogrammer un service ou avez des questions concernant cette annulation, n'hésitez pas à nous contacter.
        </p>

        <div style="text-align: center; margin-top: 30px; color: #64748b;">
          <p>Merci de votre compréhension.</p>
          <p>
            <small>Ceci est un email automatique, merci de ne pas y répondre directement.</small>
          </p>
        </div>
      </div>
    `
  }
} 