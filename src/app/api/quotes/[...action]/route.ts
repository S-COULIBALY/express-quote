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
import { PDFService } from '@/quotation/infrastructure/adapters/PDFService';
import { EmailService } from '@/quotation/infrastructure/adapters/EmailService';

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

// Initialisation des services
const pdfService = new PDFService();
const emailService = new EmailService();

// Logger sécurisé
const quoteLogger = logger.withContext ? 
  logger.withContext('QuoteAPI') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[QuoteAPI]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[QuoteAPI]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[QuoteAPI]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[QuoteAPI]', msg, ...args)
  };

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
      
      // S'assurer que le montant total est défini
      let totalAmount = 0;
      
      if (quoteData.totalAmount) {
        totalAmount = typeof quoteData.totalAmount === 'string' ? parseFloat(quoteData.totalAmount) : quoteData.totalAmount;
      } else if (quoteData.calculatedPrice) {
        totalAmount = typeof quoteData.calculatedPrice === 'string' ? parseFloat(quoteData.calculatedPrice) : quoteData.calculatedPrice;
      } else if (quoteData.price) {
        totalAmount = typeof quoteData.price === 'string' ? parseFloat(quoteData.price) : quoteData.price;
      }
      
      console.log(`API - Montant total du devis: ${totalAmount}€ (type: ${typeof totalAmount})`);
      
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
        calculatedPrice: quoteData.calculatedPrice || quoteData.price,
        totalAmount: totalAmount // Ajout explicite du montant total
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
    const action = params.action;
    
    console.log(`🔄 API - Traitement d'une action POST "${action.join('/')}" pour les devis`);
    
    // Lecture du corps de la requête
    const body = await request.json();
    
    // Traiter l'action en fonction du paramètre
    switch (action[0]) {
      case 'request':
        return handleCreateQuoteRequest(service, body);
      case 'formalize':
        return handleFormalizeQuote(service, body);
      case 'accept':
        return handleAcceptQuote(service, body);
      case 'create':
      case 'submit':
        return handleCreateQuoteRequest(service, body);
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
    
    // Après la création réussie, générer et envoyer le PDF
    try {
      // Générer le PDF du devis
      const pdfPath = await pdfService.generateQuotePDF(quoteRequest);
      
      // Récupérer les données du client
      const quoteData = quoteRequest.getQuoteData();
      const clientEmail = quoteData?.email;
      
      if (clientEmail) {
        quoteLogger.info(`Envoi du devis par email à ${clientEmail}`);
        
        // Envoyer l'email avec le PDF joint
        await emailService.sendQuoteConfirmation(quoteRequest, pdfPath);
        
        quoteLogger.info(`Email de devis envoyé avec succès à ${clientEmail}`);
      } else {
        quoteLogger.warn(`Impossible d'envoyer l'email de confirmation: email client non disponible`);
      }
    } catch (emailError) {
      // Ne pas bloquer le flux principal en cas d'erreur d'email
      quoteLogger.error(`Erreur lors de l'envoi de l'email de devis:`, emailError);
    }
    
    // Dans la section POST où le devis est créé avec succès
    if (action[0] === 'create' || action[0] === 'submit') {
      // Après la création réussie du devis et avant de renvoyer la réponse
      try {
        // Envoyer le devis par email et générer le PDF si les services sont disponibles
        if (quoteRequest && quoteRequest.getQuoteData()?.email) {
          const pdfService = new PDFService();
          const emailService = new EmailService();
          
          // Générer le PDF du devis
          try {
            const pdfPath = await pdfService.generateQuotePDF(quoteRequest);
            
            // Envoyer l'email avec le PDF
            await emailService.sendQuoteConfirmation(quoteRequest, pdfPath);
            
            console.log(`Email de devis envoyé à ${quoteRequest.getQuoteData().email}`);
            
            // Ajouter l'info dans la réponse
            response.emailSent = true;
          } catch (pdfError) {
            console.error('Erreur lors de la génération ou de l\'envoi du PDF:', pdfError);
            // Ne pas bloquer le flux principal
            response.emailSent = false;
          }
        }
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation de devis:', emailError);
        // Ne pas bloquer le flux principal
      }
    }
    
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
  console.log('🔄 API - Début handleFormalizeQuote avec body:', JSON.stringify(body));
  
  // Valider les données
  if (!body.quoteRequestId || !body.customerDetails) {
    console.error('❌ API - Données manquantes:', { quoteRequestId: !!body.quoteRequestId, customerDetails: !!body.customerDetails });
    return NextResponse.json(
      { error: 'L\'ID de la demande de devis et les détails du client sont obligatoires' },
      { status: 400 }
    );
  }
  
  // Vérifier si customerDetails contient email
  console.log('📧 API - customerDetails:', JSON.stringify(body.customerDetails));
  
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
    
    // Extraire les détails du client directement
    const customerDetails = body.customerDetails;
    
    // S'assurer que l'email est défini
    if (!customerDetails.email || typeof customerDetails.email !== 'string' || !customerDetails.email.trim()) {
      console.error('❌ [API] Email manquant ou invalide:', customerDetails);
      return NextResponse.json(
        { error: 'L\'email du client est obligatoire' },
        { status: 400 }
      );
    }
    
    // Récupérer l'option d'assurance
    const hasInsurance = body.hasInsurance === true;
    
    // Récupérer les données du devis
    const quoteData = quoteRequest.getQuoteData();
    
    // Si l'option d'assurance est activée, mettre à jour le prix
    if (hasInsurance) {
      // Généralement l'assurance coûte 30€ en plus, mais cela devrait être défini dans une constante
      const INSURANCE_PRICE = 30;
      // Mettre à jour le montant total avec l'assurance incluse
      quoteData.totalAmount = (quoteData.totalAmount || 0) + INSURANCE_PRICE;
      
      console.log(`💰 Prix mis à jour avec assurance: ${quoteData.totalAmount}€ (+ ${INSURANCE_PRICE}€ d'assurance)`);
    }
    
    console.log('Données client pour formalisation:', customerDetails);
    console.log('Option assurance:', hasInsurance);
    
    // Créer un devis formel avec l'option d'assurance
    const quote = await service.createFormalQuote(
      body.quoteRequestId,
      customerDetails,
      { hasInsurance }
    );
    
    // Construire une réponse avec les informations pertinentes
    const response = {
      id: body.quoteRequestId, // Utiliser l'ID de la demande comme ID du devis formel
      quoteRequestId: body.quoteRequestId,
      totalAmount: quote.totalAmount ? quote.totalAmount.getAmount() : 0,
      customer: {
        firstName: customerDetails.firstName,
        lastName: customerDetails.lastName,
        email: customerDetails.email
      },
      hasInsurance: hasInsurance,
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