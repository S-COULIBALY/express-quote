import PDFDocument from 'pdfkit'
import { CleaningQuote } from '@/types/quote'
import { dateUtils } from './dateUtils'
import { priceUtils } from './priceUtils'

interface PDFOptions {
  quote: CleaningQuote
  paymentDetails: {
    transactionId: string
    depositAmount: number
    paymentDate: string
  }
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
    website: string
  }
}

export const pdfUtils = {
  async generateQuotePDF(options: PDFOptions): Promise<Buffer> {
    return new Promise((resolve) => {
      const { quote, paymentDetails, companyInfo } = options
      const doc = new PDFDocument({ margin: 50 })
      const chunks: Buffer[] = []

      // Collecter les chunks
      doc.on('data', chunk => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))

      // En-tête
      doc
        .fontSize(20)
        .text(companyInfo.name, { align: 'right' })
        .fontSize(10)
        .text(companyInfo.address, { align: 'right' })
        .text(companyInfo.phone, { align: 'right' })
        .text(companyInfo.email, { align: 'right' })
        .moveDown(2)

      // Informations du devis
      doc
        .fontSize(16)
        .text('Cleaning Service Quote', { align: 'center' })
        .moveDown()
        .fontSize(10)
        .text(`Quote ID: ${quote.id}`)
        .text(`Date: ${dateUtils.format(quote.createdAt, 'long')}`)
        .moveDown()

      // Détails du service
      doc
        .fontSize(12)
        .text('Service Details', { underline: true })
        .moveDown()
        .fontSize(10)
        .text(`Property Type: ${quote.propertyType}`)
        .text(`Service Type: ${quote.cleaningType}`)
        .text(`Square Meters: ${quote.squareMeters}`)
        .text(`Rooms: ${quote.numberOfRooms}`)
        .text(`Bathrooms: ${quote.numberOfBathrooms}`)
        .text(`Preferred Date: ${dateUtils.format(quote.preferredDate, 'long')}`)
        .text(`Preferred Time: ${quote.preferredTime}`)
        .moveDown()

      // Prix et paiement
      const { tax, total } = priceUtils.calculateTotal(quote.estimatedPrice)
      
      doc
        .fontSize(12)
        .text('Payment Details', { underline: true })
        .moveDown()
        .fontSize(10)
        .text('Subtotal: ' + priceUtils.format(quote.estimatedPrice))
        .text('TVA (7.7%): ' + priceUtils.format(tax))
        .text('Total: ' + priceUtils.format(total))
        .moveDown()
        .text('Deposit Paid: ' + priceUtils.format(paymentDetails.depositAmount))
        .text('Transaction ID: ' + paymentDetails.transactionId)
        .text('Payment Date: ' + dateUtils.format(paymentDetails.paymentDate, 'long'))
        .moveDown()
        .text('Balance Due: ' + priceUtils.format(total - paymentDetails.depositAmount))
        .moveDown(2)

      // Conditions générales
      doc
        .fontSize(12)
        .text('Terms and Conditions', { underline: true })
        .moveDown()
        .fontSize(8)
        .text('1. The remaining balance is due upon completion of the service.')
        .text('2. Cancellations must be made at least 24 hours before the scheduled service.')
        .text('3. Additional charges may apply for extra services or areas not included in the original quote.')
        .moveDown(2)

      // Pied de page
      doc
        .fontSize(8)
        .text(
          `Generated on ${dateUtils.format(new Date(), 'datetime')}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        )

      doc.end()
    })
  }
} 