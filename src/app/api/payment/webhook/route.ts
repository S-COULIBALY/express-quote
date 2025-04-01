import { NextRequest, NextResponse } from 'next/server';
import { StripePaymentService } from '@/quotation/infrastructure/services/StripePaymentService';
import { BookingService } from '@/quotation/application/services/BookingService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { HttpRequest, HttpResponse } from '@/quotation/interfaces/http/types';

// Initialiser les dépendances
const bookingRepository = new PrismaBookingRepository();

// Mock services pour l'exemple - dans une implémentation réelle, initialisez-les correctement
const transactionService = {} as any;
const documentService = {} as any;
const emailService = {} as any;

const bookingService = new BookingService(
  bookingRepository,
  transactionService,
  documentService,
  emailService
);

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

        // Mettre à jour le statut de la réservation en 'PAYMENT_COMPLETED'
        await bookingService.handlePaymentCallback(session.id as string);
        return NextResponse.json({ received: true });
      }
      
      case 'payment_intent.succeeded': {
        // Traiter le succès du paiement
        return NextResponse.json({ received: true });
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const sessionId = paymentIntent.metadata?.checkout_session as string;
        
        // Si l'ID de session est disponible, mettre à jour le statut de la réservation
        if (sessionId) {
          // Code pour gérer l'échec du paiement
          // Par exemple, mettre à jour le statut de la réservation en 'PAYMENT_FAILED'
        }
        
        return NextResponse.json({ received: true });
      }
      
      default:
        // Événement non traité
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: `Webhook Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 400 }
    );
  }
} 