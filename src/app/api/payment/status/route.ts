import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/payment/status?payment_intent=pi_xxx
 * Vérifie si un Booking a été créé pour un PaymentIntent donné
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('🔍 [PAYMENT_STATUS] Début de la vérification du statut de paiement');

    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('payment_intent');

    console.log('🔍 [PAYMENT_STATUS] PaymentIntentId reçu:', paymentIntentId);

    if (!paymentIntentId) {
      console.log('❌ [PAYMENT_STATUS] PaymentIntentId manquant');
      return NextResponse.json(
        { success: false, error: 'payment_intent requis' },
        { status: 400 }
      );
    }

    logger.info('🔍 Vérification statut paiement', { paymentIntentId });

    // Vérifier la connexion Prisma
    console.log('🔍 [PAYMENT_STATUS] Test de connexion Prisma...');
    try {
      await prisma.$connect();
      console.log('✅ [PAYMENT_STATUS] Connexion Prisma OK');
    } catch (prismaError) {
      console.error('❌ [PAYMENT_STATUS] Erreur connexion Prisma:', prismaError);
      throw prismaError;
    }

    // MÉTHODE 1: Chercher une transaction avec ce PaymentIntent (findFirst car pas de contrainte unique)
    console.log('🔍 [PAYMENT_STATUS] Recherche de la transaction...');
    const transaction = await prisma.transaction.findFirst({
      where: { paymentIntentId },
      select: {
        id: true,
        bookingId: true,
        status: true,
        amount: true,
        createdAt: true,
        Booking: {
          select: {
            id: true,
            status: true,
            quoteRequestId: true
          }
        }
      }
    });

    console.log('🔍 [PAYMENT_STATUS] Transaction trouvée:', transaction);

    if (transaction && transaction.Booking) {
      logger.info('✅ Booking trouvé pour PaymentIntent via Transaction', {
        paymentIntentId,
        bookingId: transaction.bookingId,
        bookingStatus: transaction.Booking.status
      });

      console.log('✅ [PAYMENT_STATUS] Booking trouvé via Transaction, retour du succès');
      return NextResponse.json({
        success: true,
        bookingId: transaction.bookingId,
        bookingStatus: transaction.Booking.status,
        paymentStatus: transaction.status
      });
    }

    // MÉTHODE 2: Si pas de Transaction, récupérer le PaymentIntent depuis Stripe pour obtenir le temporaryId
    // puis chercher le Booking via le QuoteRequest
    console.log('🔍 [PAYMENT_STATUS] Transaction non trouvée, récupération du PaymentIntent depuis Stripe...');

    try {
      // Importer Stripe dynamiquement pour éviter les problèmes d'initialisation
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2024-11-20.acacia'
      });

      // Récupérer le PaymentIntent complet depuis Stripe pour obtenir les metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const temporaryId = paymentIntent.metadata?.temporaryId;

      console.log('🔍 [PAYMENT_STATUS] PaymentIntent récupéré:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
        temporaryId
      });

      if (temporaryId) {
        // Chercher le QuoteRequest avec ce temporaryId
        const quoteRequest = await prisma.quoteRequest.findUnique({
          where: { temporaryId },
          select: {
            id: true,
            temporaryId: true,
            Booking: {
              select: {
                id: true,
                status: true
              },
              orderBy: {
                createdAt: 'desc'
              },
              take: 1 // Prendre le Booking le plus récent
            }
          }
        });

        console.log('🔍 [PAYMENT_STATUS] QuoteRequest trouvé:', quoteRequest);

        // Si un Booking existe pour ce QuoteRequest
        if (quoteRequest && quoteRequest.Booking && quoteRequest.Booking.length > 0) {
          const booking = quoteRequest.Booking[0];

          logger.info('✅ Booking trouvé pour PaymentIntent via temporaryId', {
            paymentIntentId,
            temporaryId,
            bookingId: booking.id,
            bookingStatus: booking.status
          });

          console.log('✅ [PAYMENT_STATUS] Booking trouvé via temporaryId, retour du succès');
          return NextResponse.json({
            success: true,
            bookingId: booking.id,
            bookingStatus: booking.status,
            paymentStatus: 'completed' // Inféré puisque le Booking existe
          });
        } else {
          console.log('⏳ [PAYMENT_STATUS] QuoteRequest trouvé mais pas de Booking associé');
        }
      } else {
        console.log('⚠️ [PAYMENT_STATUS] temporaryId manquant dans les metadata du PaymentIntent');
      }
    } catch (stripeError) {
      console.error('❌ [PAYMENT_STATUS] Erreur lors de la récupération du PaymentIntent depuis Stripe:', stripeError);
      // Continuer vers le statut 202 en cas d'erreur
    }

    // Pas encore de Booking - le webhook n'a pas encore traité
    logger.info('⏳ Booking pas encore créé pour PaymentIntent', { paymentIntentId });
    console.log('⏳ [PAYMENT_STATUS] Booking pas encore créé, retour 202');

    return NextResponse.json({
      success: false,
      message: 'Booking en cours de création',
      processing: true
    }, { status: 202 }); // 202 Accepted - traitement en cours

  } catch (error) {
    console.error('❌ [PAYMENT_STATUS] Erreur détaillée:', error);
    console.error('❌ [PAYMENT_STATUS] Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');

    logger.error('❌ Erreur vérification statut paiement:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la vérification du statut',
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}
