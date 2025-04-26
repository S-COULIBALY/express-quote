import { CleaningQuote, MovingQuote } from '@/types/quote'

interface PDFData {
  quoteId: string
  quote: CleaningQuote | MovingQuote
  paymentDetails: {
    fullName: string
    email: string
    transactionId: string
    amount: number
  }
}

export async function generatePDF(_data: PDFData): Promise<Buffer> {
  try {
    // TODO: Implémenter la génération de PDF
    // Utiliser une bibliothèque comme PDFKit ou html-pdf
    
    // Pour l'exemple, on retourne un buffer vide
    return Buffer.from('')
  } catch (error) {
    console.error('PDF generation error:', error)
    throw error
  }
} 