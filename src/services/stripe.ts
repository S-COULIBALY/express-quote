import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

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

// Initialiser l'instance Stripe avec la clé secrète
// Utiliser 'latest' comme apiVersion pour éviter les problèmes de compatibilité
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

/**
 * Interface pour les paramètres de création d'une session Checkout Stripe
 */
interface CreateCheckoutSessionParams {
  bookingId: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  bookingType: 'QUOTE' | 'PACK' | 'SERVICE'; // Types acceptés depuis l'API
  description: string;
  metadata?: Record<string, string>;
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Interface pour le résultat de la création d'une session Checkout Stripe
 */
interface CheckoutSessionResult {
  url: string;
  sessionId: string;
}

/**
 * Crée une session de paiement Stripe Checkout
 * @param params Paramètres de la session
 * @returns URL de la session Checkout et ID de session
 */
export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResult> {
  try {
    const {
      bookingId,
      customerId,
      customerEmail,
      amount,
      bookingType,
      description,
      metadata = {},
      successUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/moving/success`,
      cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/moving/payment`,
    } = params;

    // Convertir le type de réservation fourni en valeur d'enum
    let bookingTypeEnum: BookingType;
    switch (bookingType.toUpperCase()) {
      case 'QUOTE':
        bookingTypeEnum = BookingType.QUOTE;
        break;
      case 'PACK':
        bookingTypeEnum = BookingType.PACK;
        break;
      case 'SERVICE':
        bookingTypeEnum = BookingType.SERVICE;
        break;
      default:
        throw new Error(`Type de réservation non valide: ${bookingType}`);
    }

    // Vérifier que la réservation existe et n'est pas déjà payée
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new Error('Réservation introuvable');
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      throw new Error('Cette réservation a déjà été payée');
    }

    // Mettre à jour le statut de la réservation
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.AWAITING_PAYMENT,
      },
    });

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: customerId,
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réservation ${getBookingTypeName(bookingType)}`,
              description: description,
            },
            unit_amount: Math.round(amount * 100), // Montant en centimes
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId,
        bookingType: bookingTypeEnum,
        customerId,
        ...metadata
      },
      success_url: `${successUrl}?id=${bookingId}`,
      cancel_url: `${cancelUrl}?id=${bookingId}&status=cancelled`,
    });

    // Enregistrer la transaction en attente
    try {
      await prisma.$transaction(async (tx: any) => {
        // Créer la transaction
        await tx.transaction.create({
          data: {
            bookingId,
            amount,
            currency: 'EUR',
            status: TransactionStatus.PENDING,
            paymentMethod: 'card',
            paymentProvider: 'stripe',
            externalId: session.id,
            externalReference: session.payment_intent as string || '',
            metadata: {
              sessionId: session.id,
              customerEmail
            }
          }
        });
      });
    } catch (error) {
      console.error("Erreur lors de la création de la transaction, schéma probablement pas à jour:", error);
      // On continue même si la transaction n'a pas pu être enregistrée
    }

    return {
      url: session.url || '',
      sessionId: session.id
    };
  } catch (error) {
    console.error('Erreur lors de la création de la session Stripe:', error);
    throw new Error('Erreur lors de la création de la session de paiement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
  }
}

/**
 * Récupère les détails d'une session Checkout
 * @param sessionId ID de la session Stripe
 * @returns Détails de la session
 */
export async function getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    console.error('Erreur lors de la récupération de la session Stripe:', error);
    throw new Error('Erreur lors de la récupération de la session: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
  }
}

/**
 * Vérifie le statut d'un paiement
 * @param paymentIntentId ID de l'intention de paiement
 * @returns Statut du paiement
 */
export async function checkPaymentStatus(paymentIntentId: string): Promise<string> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut du paiement:', error);
    throw new Error('Erreur lors de la vérification du paiement: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
  }
}

/**
 * Converti le type de réservation en libellé lisible
 * @param type Type de réservation
 * @returns Libellé du type de réservation
 */
function getBookingTypeName(type: 'QUOTE' | 'PACK' | 'SERVICE'): string {
  const types: Record<string, string> = {
    QUOTE: 'Devis personnalisé',
    PACK: 'Pack de déménagement',
    SERVICE: 'Service',
  };
  return types[type.toUpperCase()] || type;
} 