import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';

// Rendre cette route dynamique pour éviter l'initialisation Stripe pendant le build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialiser Stripe uniquement si la clé est disponible
function getStripeInstance(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.trim() === '') {
    logger.warn('⚠️ STRIPE_SECRET_KEY non définie - Les paiements ne fonctionneront pas');
    return null;
  }
  return new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil'
  });
}

/**
 * GET /api/payment/intent-status?payment_intent=pi_xxx
 * Récupère le statut et le montant d'un PaymentIntent pour vérification
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const stripe = getStripeInstance();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Configuration Stripe manquante' },
        { status: 500 }
      );
    }

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

