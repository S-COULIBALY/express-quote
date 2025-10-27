import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { StripePaymentService } from '@/quotation/infrastructure/services/StripePaymentService';
import { BookingService } from '@/quotation/application/services/BookingService';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { BookingStatus } from '@/quotation/domain/enums/BookingStatus';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaItemRepository } from '@/quotation/infrastructure/repositories/PrismaItemRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { stripeConfig } from '@/config/stripe';
import { logger } from '@/lib/logger';

// Instance partagée du BookingService avec injection de dépendances DDD
let bookingServiceInstance: BookingService | null = null;

function getBookingService(): BookingService {
  if (!bookingServiceInstance) {
    // Injection de dépendances selon l'architecture DDD
    const bookingRepository = new PrismaBookingRepository();
    const customerRepository = new PrismaCustomerRepository();
    const movingRepository = new PrismaMovingRepository();
    const itemRepository = new PrismaItemRepository();
    const quoteRequestRepository = new PrismaQuoteRequestRepository();
    
    const customerService = new CustomerService(customerRepository);
    bookingServiceInstance = new BookingService(
      bookingRepository,
      movingRepository,
      itemRepository,
      customerRepository,
      undefined, // QuoteCalculator - sera injecté par défaut
      quoteRequestRepository,
      customerService
    );
    
    logger.info('🏗️ BookingService initialisé dans webhook Stripe avec architecture DDD');
  }
  
  return bookingServiceInstance;
}

/**
 * Route webhook pour Stripe
 * Reçoit et traite les événements envoyés par Stripe
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripeConfig.webhookSecret) {
      logger.error('Secret webhook non configuré');
      return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 });
    }

    // Récupérer le corps brut de la requête
    const text = await request.text();
    
    // Récupérer la signature Stripe depuis les headers
    const headersList = headers();
    const signature = headersList.get('stripe-signature');
    
    if (!signature) {
      logger.warn('Requête sans signature Stripe');
      return NextResponse.json({ error: 'Signature Stripe manquante' }, { status: 400 });
    }

    // Initialiser le service Stripe
    const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
    const stripeService = new StripePaymentService(frontendUrl);
    
    // Vérifier et construire l'événement
    let event;
    try {
      event = stripeService.createWebhookEvent(text, signature, stripeConfig.webhookSecret);
    } catch (err) {
      logger.error('Erreur lors de la validation de la signature webhook', err as Error);
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
    }

    logger.info(`Événement Stripe reçu: ${event.type}`);
    
    // Traiter différents types d'événements
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
        
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      // Ajouter d'autres types d'événements au besoin
      default:
        logger.info(`Événement Stripe non traité: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Erreur lors du traitement du webhook', error as Error);
    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement du webhook',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Gère les paiements réussis
 */
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  logger.info(`Paiement réussi: ${paymentIntent.id}`);
  const bookingId = paymentIntent.metadata?.bookingId;
  
  if (bookingId) {
    logger.info(`Confirmation de paiement pour la réservation ${bookingId} via BookingService DDD`);
    
    try {
      const bookingService = getBookingService();
      await bookingService.confirmPaymentSuccess(bookingId, {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Stripe stocke en centimes
        status: 'succeeded'
      });
      
      logger.info(`✅ Paiement confirmé et notifications envoyées pour la réservation ${bookingId}`);
    } catch (error) {
      logger.error(`❌ Erreur lors de la confirmation de paiement pour ${bookingId}:`, error as Error);
      // Ne pas faire échouer le webhook, Stripe va retry
    }
  } else {
    logger.warn('⚠️ Aucun bookingId trouvé dans les métadonnées du paiement');
  }
}

/**
 * Gère les paiements échoués
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  logger.info(`Paiement échoué: ${paymentIntent.id}`);
  const bookingId = paymentIntent.metadata?.bookingId;
  
  if (bookingId) {
    logger.info(`Gestion de l'échec de paiement pour la réservation ${bookingId}`);
    
    try {
      const bookingService = getBookingService();
      // Mettre à jour le statut de la réservation vers PAYMENT_FAILED
      await bookingService.updateBooking(bookingId, { 
        status: BookingStatus.PAYMENT_FAILED 
      });
      
      logger.info(`✅ Statut mis à jour vers PAYMENT_FAILED pour la réservation ${bookingId}`);
    } catch (error) {
      logger.error(`❌ Erreur lors de la mise à jour d'échec pour ${bookingId}:`, error as Error);
    }
  } else {
    logger.warn('⚠️ Aucun bookingId trouvé dans les métadonnées du paiement échoué');
  }
}

/**
 * Gère les sessions de paiement complétées
 */
async function handleCheckoutSessionCompleted(session: any) {
  logger.info(`Session de paiement complétée: ${session.id}`);
  const bookingId = session.metadata?.bookingId;
  
  if (bookingId && session.payment_status === 'paid') {
    logger.info(`Paiement confirmé pour la réservation ${bookingId} via la session ${session.id}`);
    
    try {
      const bookingService = getBookingService();
      await bookingService.confirmPaymentSuccess(bookingId, {
        paymentIntentId: session.id,
        amount: session.amount_total / 100, // Stripe stocke en centimes
        status: 'succeeded'
      });
      
      logger.info(`✅ Session de paiement confirmée et notifications envoyées pour la réservation ${bookingId}`);
    } catch (error) {
      logger.error(`❌ Erreur lors de la confirmation de session pour ${bookingId}:`, error as Error);
    }
  }
} 