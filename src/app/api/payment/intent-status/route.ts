import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-08-27.basil'
});

/**
 * GET /api/payment/intent-status?payment_intent=pi_xxx
 * Récupère le statut et le montant d'un PaymentIntent pour vérification
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'payment_intent requis' },
        { status: 400 }
      );
    }

    logger.info('🔍 [INTENT_STATUS] Récupération PaymentIntent:', { paymentIntentId });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    logger.info('🔍 [INTENT_STATUS] PaymentIntent récupéré:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata
    });

    return NextResponse.json({
      success: true,
      id: paymentIntent.id,
      amount: paymentIntent.amount, // En centimes
      amountInEuros: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata
    });

  } catch (error) {
    logger.error('❌ Erreur récupération PaymentIntent:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du PaymentIntent',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

