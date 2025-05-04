import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { StripePaymentService } from '@/quotation/infrastructure/services/StripePaymentService';
import { stripeConfig } from '@/config/stripe';
import { logger } from '@/lib/logger';

const webhookLogger = logger.withContext('StripeWebhook');

/**
 * Route webhook pour Stripe
 * Reçoit et traite les événements envoyés par Stripe
 */
export async function POST(request: NextRequest) {
  try {
    if (!stripeConfig.webhookSecret) {
      webhookLogger.error('Secret webhook non configuré');
      return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 });
    }

    // Récupérer le corps brut de la requête
    const text = await request.text();
    
    // Récupérer la signature Stripe depuis les headers
    const headersList = headers();
    const signature = headersList.get('stripe-signature');
    
    if (!signature) {
      webhookLogger.warn('Requête sans signature Stripe');
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
      webhookLogger.error('Erreur lors de la validation de la signature webhook', err as Error);
      return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
    }

    webhookLogger.info(`Événement Stripe reçu: ${event.type}`);
    
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
        webhookLogger.info(`Événement Stripe non traité: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    webhookLogger.error('Erreur lors du traitement du webhook', error as Error);
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
  webhookLogger.info(`Paiement réussi: ${paymentIntent.id}`);
  const bookingId = paymentIntent.metadata?.bookingId;
  
  if (bookingId) {
    // Ici, vous pourriez mettre à jour le statut de la réservation dans votre base de données
    // ou déclencher d'autres actions comme l'envoi d'emails de confirmation
    webhookLogger.info(`Mise à jour de la réservation ${bookingId} avec le paiement ${paymentIntent.id}`);
    
    // Exemple: Vous pourriez appeler une API interne pour mettre à jour le statut
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/bookings/${bookingId}/payment-success`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: 'succeeded'
        })
      });
    } catch (error) {
      webhookLogger.error(`Erreur lors de la mise à jour de la réservation ${bookingId}`, error as Error);
    }
  }
}

/**
 * Gère les paiements échoués
 */
async function handlePaymentIntentFailed(paymentIntent: any) {
  webhookLogger.info(`Paiement échoué: ${paymentIntent.id}`);
  const bookingId = paymentIntent.metadata?.bookingId;
  
  if (bookingId) {
    // Mettre à jour le statut de la réservation ou notifier l'utilisateur
    webhookLogger.info(`Notification d'échec pour la réservation ${bookingId}`);
    
    // Vous pourriez implémenter une logique similaire à celle du succès
  }
}

/**
 * Gère les sessions de paiement complétées
 */
async function handleCheckoutSessionCompleted(session: any) {
  webhookLogger.info(`Session de paiement complétée: ${session.id}`);
  const bookingId = session.metadata?.bookingId;
  
  if (bookingId && session.payment_status === 'paid') {
    webhookLogger.info(`Paiement confirmé pour la réservation ${bookingId} via la session ${session.id}`);
    
    // Vous pourriez implémenter une logique similaire à celle du succès de payment_intent
  }
} 