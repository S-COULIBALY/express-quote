import { NextResponse } from 'next/server'
import { generatePDF } from '@/lib/generatePDF'
import { sendEmail } from '@/lib/sendEmail'
import type { CleaningQuote } from '@/types/quote'

// Ajout du type pour le devis mis à jour
interface UpdatedQuote extends CleaningQuote {
  paymentId: string
  depositPaid: number
  updatedAt: string
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { quoteId, ...paymentDetails } = data

    // TODO: Récupérer les informations du devis
    const quote = {
      id: quoteId,
      estimatedPrice: 250,
      preferredDate: '2024-04-01',
      preferredTime: '09:00',
      propertyType: 'apartment',
      cleaningType: 'standard',
      status: 'pending',
      // ... autres propriétés requises de CleaningQuote
    } as CleaningQuote

    // TODO: Calculer le montant du dépôt (30%)
    const depositAmount = quote.estimatedPrice * 0.3

    // TODO: Traiter le paiement avec un service de paiement
    // Simuler un traitement de paiement réussi
    const paymentResult = {
      success: true,
      transactionId: `tr_${Math.random().toString(36).substr(2, 9)}`,
      amount: depositAmount
    }

    if (!paymentResult.success) {
      throw new Error('Payment processing failed')
    }

    // TODO: Mettre à jour le statut du devis dans la base de données
    const updatedQuote: UpdatedQuote = {
      ...quote,
      status: 'paid',
      paymentId: paymentResult.transactionId,
      depositPaid: depositAmount,
      updatedAt: new Date().toISOString()
    }

    // Générer le PDF du devis
    const pdfBuffer = await generatePDF({
      quoteId,
      quote: updatedQuote,
      paymentDetails: {
        ...paymentDetails,
        transactionId: paymentResult.transactionId,
        amount: paymentResult.amount
      }
    })

    // Envoyer l'email de confirmation
    await sendEmail({
      to: paymentDetails.email,
      subject: 'Cleaning Service Booking Confirmation',
      pdfBuffer,
      context: {
        clientName: paymentDetails.fullName,
        quoteId,
        amount: depositAmount,
        serviceDate: updatedQuote.preferredDate,
        serviceTime: updatedQuote.preferredTime
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      quote: updatedQuote
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
} 