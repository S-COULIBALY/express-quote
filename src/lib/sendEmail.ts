interface EmailData {
  to: string
  subject: string
  pdfBuffer: Buffer
  context: {
    clientName: string
    quoteId: string
    amount: number
    serviceDate: string
    serviceTime: string
  }
}

export async function sendEmail(data: EmailData): Promise<void> {
  try {
    // TODO: Implémenter l'envoi d'email
    // Utiliser un service comme SendGrid, AWS SES, etc.
    
    console.log('Email sent to:', data.to)
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
} 