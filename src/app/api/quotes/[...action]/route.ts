import { NextRequest, NextResponse } from 'next/server';
import { BookingService } from '@/quotation/application/services/BookingService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaPackRepository } from '@/quotation/infrastructure/repositories/PrismaPackRepository';
import { PrismaServiceRepository } from '@/quotation/infrastructure/repositories/PrismaServiceRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { QuoteCalculatorService } from '@/quotation/application/services/QuoteCalculatorService';
import { logger } from '@/lib/logger';
import { QuoteRequestStatus } from '@/quotation/domain/enums/QuoteRequestStatus';

// Initialisation des dépendances
const bookingRepository = new PrismaBookingRepository();
const movingRepository = new PrismaMovingRepository();
const packRepository = new PrismaPackRepository();
const serviceRepository = new PrismaServiceRepository();
const customerRepository = new PrismaCustomerRepository();
const quoteRequestRepo = new PrismaQuoteRequestRepository();
const customerService = new CustomerService(customerRepository);

// Obtenir le calculateur de devis
const calculatorService = QuoteCalculatorService.getInstance();

// Variable pour stocker le service de réservation
let bookingServiceInstance: BookingService | null = null;

// Fonction utilitaire pour s'assurer que le service est disponible
async function ensureBookingServiceAvailable(): Promise<BookingService> {
  if (!bookingServiceInstance) {
    console.log("⚠️ BookingService non initialisé pour l'API de devis, initialisation...");
    
    // Récupérer le calculateur depuis le service
    const calculator = await calculatorService.getCalculator();
    
    // Créer le service de réservation
    bookingServiceInstance = new BookingService(
      bookingRepository,
      movingRepository,
      packRepository,
      serviceRepository,
      calculator,
      quoteRequestRepo,
      customerService,
      {} as any, // transactionService - pas nécessaire ici
      {} as any, // documentService - pas nécessaire ici
      {} as any  // emailService - pas nécessaire ici
    );
    
    console.log("✅ BookingService initialisé avec succès pour l'API de devis");
  }
  
  return bookingServiceInstance;
}

/**
 * Gestion unifiée des routes de l'API de devis
 * Routes supportées:
 * GET /api/quotes/[id] - Récupération d'un devis par ID
 * POST /api/quotes/request - Création d'une demande de devis
 * POST /api/quotes/formalize - Formalisation d'un devis
 * POST /api/quotes/accept - Acceptation d'un devis
 */

// Gestion des requêtes GET
export async function GET(
  request: NextRequest,
  { params }: { params: { action: string[] } }
) {
  console.log(`🔄 API - Début GET /api/quotes/${params.action.join('/')}`);

  try {
    // S'assurer que le service est initialisé
    const service = await ensureBookingServiceAvailable();
    
    // L'ID est le premier (et normalement le seul) segment du chemin
    const quoteRequestId = params.action[0];
    
    if (!quoteRequestId) {
      return NextResponse.json(
        { error: 'ID de demande de devis manquant' },
        { status: 400 }
      );
    }
    
    try {
      // Récupérer la demande de devis via le repository
      const quoteRequest = await service['quoteRequestRepository'].findById(quoteRequestId);
      
      if (!quoteRequest) {
        console.error(`❌ API - Demande de devis non trouvée: ${quoteRequestId}`);
        return NextResponse.json(
          { error: 'Demande de devis non trouvée' },
          { status: 404 }
        );
      }
      
      // Récupérer les données de la demande
      const quoteData = quoteRequest.getQuoteData();
      const quoteType = quoteRequest.getType();
      
      // Construire une réponse avec les informations pertinentes
      const response = {
        id: quoteRequestId,
        status: quoteRequest.getStatus(),
        type: quoteType,
        expiresAt: quoteRequest.getExpiresAt(),
        // Ajout des données spécifiques en fonction du type
        ...quoteData,
        serviceId: quoteData.serviceId || quoteData.service?.id,
        scheduledDate: quoteData.scheduledDate || quoteData.date,
        calculatedPrice: quoteData.calculatedPrice || quoteData.price
      };
      
      console.log(`✅ API - Détails de la demande de devis récupérés avec succès - ID: ${quoteRequestId}`);
      
      return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
      console.error(`❌ API - Erreur lors de la récupération de la demande de devis: ${error.message}`);
      
      return NextResponse.json(
        { error: `Échec de la récupération de la demande de devis: ${error.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    logger.error('Error in quotes API GET:', error);
    console.error('Error in quotes API GET:', error);
    
    return NextResponse.json(
      { error: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

// Gestion des requêtes POST
export async function POST(
  request: NextRequest,
  { params }: { params: { action: string[] } }
) {
  try {
    // S'assurer que le service est initialisé
    const service = await ensureBookingServiceAvailable();
    
    // L'action est le premier segment du chemin
    const action = params.action[0];
    
    console.log(`🔄 API - Traitement d'une action POST "${action}" pour les devis`);
    
    // Lecture du corps de la requête
    const body = await request.json();
    
    // Traiter l'action en fonction du paramètre
    switch (action) {
      case 'request':
        return handleCreateQuoteRequest(service, body);
      case 'formalize':
        return handleFormalizeQuote(service, body);
      case 'accept':
        return handleAcceptQuote(service, body);
      default:
        return NextResponse.json(
          { error: 'Action non reconnue. Utilisez /request, /formalize ou /accept' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('Error in quotes API POST:', error);
    console.error('Error in quotes API POST:', error);
    
    return NextResponse.json(
      { error: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

/**
 * Gère la création d'une demande de devis anonyme
 */
async function handleCreateQuoteRequest(service: BookingService, body: any) {
  console.log('🔄 API - Début handleCreateQuoteRequest avec:', JSON.stringify(body));
  
  // Récupérer les données du service depuis le corps de la requête
  const serviceData = body.service ? { ...body.service, type: body.type } : body;
  
  // Valider les données
  if (!serviceData.serviceId) {
    console.log('❌ API - Erreur: serviceId manquant');
    return NextResponse.json(
      { error: 'L\'ID du service est obligatoire' },
      { status: 400 }
    );
  }
  
  try {
    // Créer la demande de devis
    const quoteRequest = await service.createQuoteRequest(serviceData);
    
    // Récupérer et vérifier l'ID
    const quoteRequestId = quoteRequest.getId();
    
    if (!quoteRequestId) {
      console.error('❌ API - Erreur: l\'ID de la demande de devis est null ou undefined');
      return NextResponse.json(
        { error: 'Impossible de créer la demande de devis: ID manquant' },
        { status: 500 }
      );
    }
    
    // Construire une réponse avec les informations pertinentes
    const response = {
      id: quoteRequestId,
      status: quoteRequest.getStatus(),
      type: quoteRequest.getType(),
      expiresAt: quoteRequest.getExpiresAt(),
      serviceId: serviceData.serviceId,
      calculatedPrice: serviceData.calculatedPrice
    };
    
    console.log(`✅ API - Demande de devis créée avec succès - ID: ${quoteRequestId}`);
    
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('❌ API - Erreur lors de la création de la demande de devis:', error);
    
    return NextResponse.json(
      { error: `Échec de la création de la demande de devis: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Gère la formalisation d'un devis à partir d'une demande
 */
async function handleFormalizeQuote(service: BookingService, body: any) {
  // Valider les données
  if (!body.quoteRequestId || !body.customerDetails) {
    return NextResponse.json(
      { error: 'L\'ID de la demande de devis et les détails du client sont obligatoires' },
      { status: 400 }
    );
  }
  
  try {
    // Récupérer la demande de devis via le repository du service
    const quoteRequest = await service['quoteRequestRepository'].findById(body.quoteRequestId);
    
    if (!quoteRequest) {
      return NextResponse.json(
        { error: 'Demande de devis non trouvée' },
        { status: 404 }
      );
    }
    
    // Vérifier l'état de la demande
    if (quoteRequest.getStatus() !== QuoteRequestStatus.TEMPORARY) {
      return NextResponse.json(
        { 
          error: 'Cette demande de devis ne peut pas être formalisée dans son état actuel',
          status: quoteRequest.getStatus()
        },
        { status: 400 }
      );
    }
    
    // Créer un devis formel
    const quote = await service.createFormalQuote(
      body.quoteRequestId,
      body.customerDetails
    );
    
    // Construire une réponse avec les informations pertinentes
    const response = {
      id: body.quoteRequestId, // Utiliser l'ID de la demande comme ID du devis formel
      quoteRequestId: body.quoteRequestId,
      totalAmount: quote.totalAmount ? quote.totalAmount.getAmount() : 0,
      customer: {
        firstName: body.customerDetails.firstName,
        lastName: body.customerDetails.lastName,
        email: body.customerDetails.email
      },
      status: quote.status || 'CONFIRMED'
    };
    
    console.log(`✅ API - Devis formalisé avec succès pour la demande ${body.quoteRequestId}`);
    
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de la formalisation du devis:', error);
    
    return NextResponse.json(
      { error: `Échec de la formalisation du devis: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Gère l'acceptation d'un devis et l'initialisation du paiement
 */
async function handleAcceptQuote(service: BookingService, body: any) {
  // Valider les données
  if (!body.quoteId) {
    return NextResponse.json(
      { error: 'L\'ID du devis est obligatoire' },
      { status: 400 }
    );
  }
  
  try {
    // Accepter le devis et initialiser le paiement
    const paymentMethod = body.paymentMethod || 'card';
    const session = await service.acceptQuoteAndInitiatePayment(
      body.quoteId,
      paymentMethod
    );
    
    if (!session) {
      return NextResponse.json(
        { error: 'Échec de l\'initialisation du paiement' },
        { status: 500 }
      );
    }
    
    console.log(`✅ API - Paiement initialisé pour le devis ${body.quoteId}`);
    
    // Renvoyer les informations de session pour redirection
    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url
    }, { status: 200 });
  } catch (error: any) {
    console.error('Erreur lors de l\'acceptation du devis:', error);
    
    return NextResponse.json(
      { error: `Échec de l\'acceptation du devis: ${error.message}` },
      { status: 500 }
    );
  }
} 