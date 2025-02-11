import { NextResponse } from 'next/server'
import { generatePDF } from '@/lib/generatePDF'
import { sendEmail } from '@/lib/sendEmail'
import type { MovingQuote } from '@/types/quote'

interface PaymentDetails {
  email: string
  fullName: string
  transactionId: string
  amount: number
}

interface PaymentRequest {
  quoteId: string
  paymentDetails: PaymentDetails
}

interface PaymentResponse {
  success: boolean
  message: string
  error?: string
}

export async function POST(request: Request): Promise<NextResponse<PaymentResponse>> {
  try {
    const data = await request.json() as PaymentRequest
    const { quoteId, paymentDetails } = data

    // Récupérer les détails du devis
    const quote = await getQuoteFromDB(quoteId)

    // Générer le PDF
    const pdfBuffer = await generatePDF({
      quote,
      paymentDetails,
      type: 'payment'
    })

    // Envoyer l'email
    await sendEmail({
      to: paymentDetails.email,
      subject: 'Confirmation de paiement - Devis de déménagement',
      pdfBuffer,
      context: {
        clientName: paymentDetails.fullName,
        quoteId,
        amount: quote.totalCost,
        serviceDate: quote.movingDate,
        serviceTime: '09:00'
      }
    })

    // Utiliser le quoteId ou le préfixer avec underscore si non utilisé
    const updatedQuote = {
      ...quote,
      id: quoteId, // Utilisation du quoteId
      status: 'paid',
      paymentDetails: {
        ...paymentDetails,
        transactionId: paymentResult.transactionId,
        amount: depositAmount
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Paiement traité avec succès'
    })
  } catch (error) {
    console.error('Erreur de traitement du paiement:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Échec du traitement du paiement',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

async function getQuoteFromDB(quoteId: string): Promise<MovingQuote> {
  // TODO: Implémenter la récupération depuis la base de données
  const quoteData = localStorage.getItem('movingQuote')
  if (!quoteData) {
    throw new Error('Devis non trouvé')
  }
  return JSON.parse(quoteData)
} 