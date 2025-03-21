import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { generateBookingConfirmationPdf } from '@/services/pdf';
import { sendBookingConfirmationEmail } from '@/services/email';

// Définir les enums pour éviter les problèmes d'import
enum BookingType {
  QUOTE = 'QUOTE',
  PACK = 'PACK',
  SERVICE = 'SERVICE'
}

enum BookingStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CONFIRMED = 'CONFIRMED',
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

// Initialiser l'instance Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    // Récupérer la signature du webhook depuis les headers
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 });
    }

    // Récupérer le contenu de la requête
    const body = await req.text();

    // Vérifier la signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err: any) {
      console.error(`Erreur de signature: ${err.message}`);
      return NextResponse.json({ error: `Signature invalide: ${err.message}` }, { status: 400 });
    }

    // Traiter l'événement
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCompletedCheckout(event.data.object);
        break;
      case 'payment_intent.succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handleFailedPayment(event.data.object);
        break;
      default:
        console.log(`Événement non traité: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

/**
 * Traite un paiement complet réussi via Checkout
 * @param session Session Stripe
 */
async function handleCompletedCheckout(session: Stripe.Checkout.Session) {
  console.log('Session Checkout terminée:', session.id);

  // Récupérer l'ID de réservation des métadonnées
  const bookingId = session.metadata?.bookingId;
  
  if (!bookingId) {
    console.error('Aucun ID de réservation trouvé dans les métadonnées');
    return;
  }

  try {
    // Mettre à jour le statut de la réservation et créer la transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Mettre à jour le booking
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
        },
        include: {
          customer: true,
          quote: true,
          pack: true,
          services: {
            include: {
              service: true
            }
          }
        }
      });

      // Créer la transaction
      await tx.transaction.create({
        data: {
          bookingId: updatedBooking.id,
          amount: parseFloat(session.amount_total ? (session.amount_total / 100).toFixed(2) : '0'),
          currency: session.currency || 'eur',
          status: TransactionStatus.COMPLETED,
          paymentMethod: session.payment_method_types?.[0] || 'card',
          paymentProvider: 'stripe',
          externalId: session.id,
          externalReference: session.payment_intent as string,
          metadata: {
            paymentIntentId: session.payment_intent,
            customerEmail: session.customer_details?.email,
            customerName: session.customer_details?.name,
          }
        }
      });

      return updatedBooking;
    });

    // Préparer les données pour le PDF
    const bookingDetails = mapBookingDataForPDF(booking);

    // Générer le PDF
    const pdfBuffer = await generateBookingConfirmationPdf(bookingDetails);

    // Envoyer l'email avec le PDF en pièce jointe
    await sendBookingConfirmationEmail(
      booking.id,
      booking.customer.email,
      booking.customer.firstName,
      pdfBuffer
    );

    console.log(`Réservation ${bookingId} confirmée et email envoyé`);

  } catch (error) {
    console.error(`Erreur lors du traitement de la session ${session.id}:`, error);
  }
}

/**
 * Traite un paiement réussi via PaymentIntent
 * @param paymentIntent Intent de paiement Stripe
 */
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  console.log('Paiement réussi:', paymentIntent.id);

  // Récupérer l'ID de réservation des métadonnées
  const bookingId = paymentIntent.metadata?.bookingId;
  
  if (!bookingId) {
    console.error('Aucun ID de réservation trouvé dans les métadonnées');
    return;
  }

  try {
    // Vérifier si une transaction existe déjà pour ce paiement
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        externalReference: paymentIntent.id
      }
    });

    if (existingTransaction) {
      console.log(`Transaction ${paymentIntent.id} déjà traitée`);
      return;
    }

    // Mettre à jour le statut de la réservation et créer la transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Mettre à jour la réservation
      const updatedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
        },
        include: {
          customer: true
        }
      });

      // Créer la transaction
      await tx.transaction.create({
        data: {
          bookingId: updatedBooking.id,
          amount: parseFloat((paymentIntent.amount / 100).toFixed(2)),
          currency: paymentIntent.currency,
          status: TransactionStatus.COMPLETED,
          paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
          paymentProvider: 'stripe',
          externalId: paymentIntent.id,
          externalReference: paymentIntent.id,
          metadata: paymentIntent.metadata || {}
        }
      });

      return updatedBooking;
    });

    console.log(`Paiement ${paymentIntent.id} enregistré pour la réservation ${bookingId}`);

  } catch (error) {
    console.error(`Erreur lors du traitement du paiement ${paymentIntent.id}:`, error);
  }
}

/**
 * Traite un échec de paiement
 * @param paymentIntent Intent de paiement Stripe
 */
async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  console.log('Paiement échoué:', paymentIntent.id);

  // Récupérer l'ID de réservation des métadonnées
  const bookingId = paymentIntent.metadata?.bookingId;
  
  if (!bookingId) {
    console.error('Aucun ID de réservation trouvé dans les métadonnées');
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut de la réservation
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.PAYMENT_FAILED
        }
      });

      // Enregistrer la transaction échouée
      await tx.transaction.create({
        data: {
          bookingId,
          amount: parseFloat((paymentIntent.amount / 100).toFixed(2)),
          currency: paymentIntent.currency,
          status: TransactionStatus.FAILED,
          paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
          paymentProvider: 'stripe',
          externalId: paymentIntent.id,
          externalReference: paymentIntent.id,
          metadata: {
            error: paymentIntent.last_payment_error?.message || 'Paiement échoué',
            code: paymentIntent.last_payment_error?.code
          }
        }
      });
    });

    console.log(`Échec de paiement ${paymentIntent.id} enregistré pour la réservation ${bookingId}`);

  } catch (error) {
    console.error(`Erreur lors du traitement de l'échec de paiement ${paymentIntent.id}:`, error);
  }
}

/**
 * Prépare les données du modèle Booking pour le format attendu par le générateur de PDF
 * @param booking Données de réservation depuis la base de données
 * @returns Données formatées pour le PDF
 */
function mapBookingDataForPDF(booking: any) {
  // Déterminer le type de réservation
  let bookingType: 'QUOTE' | 'PACK' | 'SERVICE';
  
  if (booking.quoteId) {
    bookingType = 'QUOTE';
  } else if (booking.packId) {
    bookingType = 'PACK';
  } else {
    bookingType = 'SERVICE';
  }

  // Rassembler les données communes
  const bookingData = {
    id: booking.id,
    type: bookingType,
    status: booking.status,
    scheduledDate: booking.scheduledDate.toISOString(),
    scheduledTime: booking.scheduledTime || undefined,
    originAddress: booking.originAddress || undefined,
    destAddress: booking.destAddress,
    totalAmount: booking.totalAmount,
    customer: {
      firstName: booking.customer.firstName,
      lastName: booking.customer.lastName,
      email: booking.customer.email,
      phone: booking.customer.phone
    }
  };

  // Ajouter les données spécifiques au type de réservation
  if (bookingType === 'QUOTE' && booking.quote) {
    return {
      ...bookingData,
      quote: {
        basePrice: booking.quote.basePrice,
        finalPrice: booking.quote.finalPrice,
        volume: booking.quote.volume,
        distance: booking.quote.distance
      }
    };
  } else if (bookingType === 'PACK' && booking.pack) {
    return {
      ...bookingData,
      pack: {
        name: booking.pack.name,
        description: booking.pack.description,
        price: booking.pack.price
      }
    };
  } else if (bookingType === 'SERVICE' && booking.services) {
    return {
      ...bookingData,
      services: booking.services.map((bs: any) => ({
        service: {
          name: bs.service.name,
          description: bs.service.description,
          price: bs.service.price
        },
        serviceDate: bs.serviceDate.toISOString()
      }))
    };
  }

  return bookingData;
} 