interface QuoteData {
  id: string
  propertyType: string
  cleaningType: string
  preferredDate: string
  preferredTime: string
  status: string
  estimatedPrice: number
  paymentId?: string
  depositPaid?: number
}

interface PDFData {
  quoteId: string
  quote: QuoteData
  paymentDetails: {
    fullName: string
    email: string
    transactionId: string
    amount: number
  }
}

export async function generatePDF(data: PDFData): Promise<Buffer> {
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