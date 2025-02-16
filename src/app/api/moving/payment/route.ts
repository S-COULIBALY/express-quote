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
    const { quoteId: _quoteId, paymentDetails } = await request.json() as PaymentRequest

    // Simuler le traitement du paiement
    const paymentResult = {
      success: true,
      transactionId: `tr_${Math.random().toString(36).slice(2, 11)}`,
      amount: paymentDetails.amount
    }

    if (!paymentResult.success) {
      throw new Error('Payment failed')
    }

    // Générer le PDF de confirmation
    const pdfBuffer = await generatePDF({
      quoteId: paymentResult.transactionId,
      paymentDetails,
      quote: await getQuoteFromDB(paymentResult.transactionId)
    })

    // Envoyer l'email de confirmation
    await sendEmail({
      to: paymentDetails.email,
      subject: 'Moving Service Booking Confirmation',
      pdfBuffer,
      context: {
        clientName: paymentDetails.fullName,
        quoteId: paymentResult.transactionId,
        amount: paymentDetails.amount,
        serviceDate: new Date().toISOString(),
        serviceTime: '09:00'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully'
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to process payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

async function getQuoteFromDB(transactionId: string): Promise<MovingQuote> {
  // TODO: Implémenter la récupération depuis la base de données
  return {
    id: transactionId,
    status: 'paid',
    createdAt: new Date().toISOString(),
    // ... autres propriétés requises
  } as MovingQuote
} 