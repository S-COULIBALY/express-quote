import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia'
});

/**
 * POST /api/payment/create-session
 * Crée une session Stripe Checkout avec les données client
 * Appelé automatiquement au chargement de la page /booking/[temporaryId]
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { temporaryId, customerData, amount, quoteData } = await request.json();

    logger.info('💳 Création session Stripe', {
      temporaryId,
      amount,
      customerEmail: customerData?.email
    });

    // Validation des données
    if (!temporaryId) {
      return NextResponse.json(
        { success: false, error: 'temporaryId requis' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Montant invalide' },
        { status: 400 }
      );
    }

    if (!customerData || !customerData.email) {
      return NextResponse.json(
        { success: false, error: 'Données client requises' },
        { status: 400 }
      );
    }

    // Récupérer le QuoteRequest pour vérifier qu'il existe
    const quoteResponse = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/quotesRequest/${temporaryId}`,
      { cache: 'no-store' }
    );

    if (!quoteResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Devis non trouvé ou expiré' },
        { status: 404 }
      );
    }

    const quoteRequestData = await quoteResponse.json();
    if (!quoteRequestData.success) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération du devis' },
        { status: 500 }
      );
    }

    const quoteRequest = quoteRequestData.data;

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerData.email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réservation ${quoteRequest.type}`,
              description: getServiceDescription(quoteRequest),
            },
            unit_amount: Math.round(amount * 100), // Montant en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/booking/${temporaryId}?canceled=true`,
      metadata: {
        temporaryId,
        customerFirstName: customerData.firstName,
        customerLastName: customerData.lastName,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        quoteType: quoteRequest.type,
        amount: amount.toString(),
      },
      // Permettre les codes promo
      allow_promotion_codes: true,
    });

    logger.info('✅ Session Stripe créée', {
      sessionId: session.id,
      temporaryId,
      amount
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      clientSecret: session.client_secret,
      url: session.url
    });

  } catch (error) {
    logger.error('❌ Erreur création session Stripe:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création de la session de paiement',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Génère une description du service pour Stripe
 */
function getServiceDescription(quoteRequest: any): string {
  const type = quoteRequest.type;
  const quoteData = quoteRequest.quoteData || {};

  switch (type) {
    case 'MOVING':
      return `Déménagement - ${quoteData.pickupAddress || 'Adresse de départ'} → ${quoteData.deliveryAddress || 'Adresse d\'arrivée'}`;
    case 'CLEANING':
      return `Ménage - ${quoteData.cleaningType || 'Service de ménage'}`;
    case 'DELIVERY':
      return `Livraison - ${quoteData.pickupAddress || 'Départ'} → ${quoteData.deliveryAddress || 'Arrivée'}`;
    case 'PACKING':
      return `Emballage - Service d'emballage professionnel`;
    default:
      return `Service ${type}`;
  }
}
