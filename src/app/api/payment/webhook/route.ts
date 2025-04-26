import { NextRequest, NextResponse } from 'next/server';
import { StripePaymentService } from '@/quotation/infrastructure/services/StripePaymentService';
import { BookingService } from '@/quotation/application/services/BookingService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaPackRepository } from '@/quotation/infrastructure/repositories/PrismaPackRepository';
import { PrismaServiceRepository } from '@/quotation/infrastructure/repositories/PrismaServiceRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { QuoteCalculatorService } from '@/quotation/application/services/QuoteCalculatorService';
import { HttpRequest, HttpResponse } from '@/quotation/interfaces/http/types';
import { logger } from '@/lib/logger';

// Initialiser les dépendances
const bookingRepository = new PrismaBookingRepository();
const movingRepository = new PrismaMovingRepository();
const packRepository = new PrismaPackRepository();
const serviceRepository = new PrismaServiceRepository();
const quoteRequestRepository = new PrismaQuoteRequestRepository();
const customerRepository = new PrismaCustomerRepository();
const customerService = new CustomerService(customerRepository);

// Services supplémentaires
const transactionService = {} as any;
const documentService = {} as any;
const emailService = {} as any;

// Obtenir le calculateur depuis le service centralisé
const calculatorService = QuoteCalculatorService.getInstance();

// Variable pour stocker le service de réservation
let bookingServiceInstance: BookingService | null = null;

// Fonction utilitaire pour s'assurer que le service est disponible
async function ensureBookingServiceAvailable(): Promise<BookingService> {
  if (!bookingServiceInstance) {
    logger.info("⚠️ BookingService non initialisé pour le webhook, initialisation...");
    
    // Récupérer le calculateur depuis le service
    const calculator = await calculatorService.getCalculator();
    
    // Créer le service de réservation
    bookingServiceInstance = new BookingService(
      bookingRepository,
      movingRepository,
      packRepository,
      serviceRepository,
      calculator,
      quoteRequestRepository,
      customerService,
      transactionService,
      documentService,
      emailService
    );
    
    logger.info("✅ BookingService initialisé avec succès pour le webhook");
  }
  
  return bookingServiceInstance;
}

// Initialiser le service de paiement Stripe
const stripePaymentService = new StripePaymentService(
  process.env.STRIPE_SECRET_KEY || '',
  process.env.FRONTEND_URL || ''
);

// Adaptateur pour convertir une requête NextJS en HttpRequest
function createHttpRequest(request: NextRequest, body?: any): HttpRequest {
  return {
    body: body,
    params: {},
    query: {},
    headers: Object.fromEntries(request.headers.entries())
  };
}

// Adaptateur pour convertir NextResponse en HttpResponse
function createHttpResponse(): HttpResponse & { getStatus: () => number, getData: () => any } {
  let statusCode = 200;
  let responseData: any = null;
  
  const response = {
    status: function(code: number) {
      statusCode = code;
      return response;
    },
    json: function(data: any) {
      responseData = data;
      return response;
    },
    send: function() {
      return response;
    },
    getStatus: function() {
      return statusCode;
    },
    getData: function() {
      return responseData;
    }
  };
  
  return response;
}

export async function POST(request: NextRequest) {
  try {
    // Récupérer la signature de la requête dans les en-têtes
    const signature = request.headers.get('stripe-signature');
    
    // Vérifier que la signature est présente
    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Récupérer le corps de la requête brut
    const rawBody = await request.text();
    
    // Vérifier le webhook avec la clé secrète
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const event = stripePaymentService.createWebhookEvent(rawBody, signature, webhookSecret);

    // S'assurer que le service de réservation est disponible
    const bookingService = await ensureBookingServiceAvailable();

    // Traiter l'événement selon son type
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (!session.metadata?.bookingId) {
          return NextResponse.json(
            { error: 'Missing bookingId in session metadata' },
            { status: 400 }
          );
        }

        logger.info(`Webhook - Session de paiement complétée: ${session.id}`);
        
        // Mettre à jour le statut de la réservation en 'PAYMENT_COMPLETED'
        await bookingService.handlePaymentCallback(session.id as string);
        return NextResponse.json({ received: true });
      }
      
      case 'payment_intent.succeeded': {
        logger.info(`Webhook - Intention de paiement réussie`);
        // Traiter le succès du paiement
        return NextResponse.json({ received: true });
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const sessionId = paymentIntent.metadata?.checkout_session as string;
        
        logger.info(`Webhook - Échec d'intention de paiement pour la session: ${sessionId}`);
        
        // Si l'ID de session est disponible, mettre à jour le statut de la réservation
        if (sessionId) {
          try {
            // Utiliser la nouvelle méthode pour gérer l'échec du paiement
            const updatedBooking = await bookingService.handlePaymentFailure(sessionId);
            if (updatedBooking) {
              logger.info(`Webhook - Statut de réservation mis à jour après échec de paiement: ${updatedBooking.getId()}`);
            } else {
              logger.warn(`Webhook - Impossible de mettre à jour la réservation pour la session: ${sessionId}`);
            }
          } catch (paymentError) {
            logger.error('Webhook - Erreur lors du traitement de l\'échec de paiement:', 
              paymentError instanceof Error ? paymentError : new Error('Erreur inconnue'));
          }
        }
        
        return NextResponse.json({ received: true });
      }
      
      default:
        logger.info(`Webhook - Événement non traité: ${event.type}`);
        // Événement non traité
        return NextResponse.json({ received: true });
    }
  } catch (error: any) {
    logger.error('Error processing webhook:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 400 }
    );
  }
} 