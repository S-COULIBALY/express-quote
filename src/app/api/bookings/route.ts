import { NextRequest, NextResponse } from 'next/server';

// LOG DE CHARGEMENT DU MODULE
console.log("\n========== MODULE API/BOOKINGS/ROUTE.TS CHARGÉ ==========\n");

import { BookingStatus } from '@/quotation/domain/entities/Booking';
import { Booking } from '@/quotation/domain/entities/Booking';
import { BookingController } from '@/quotation/interfaces/http/controllers/BookingController';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaPackRepository } from '@/quotation/infrastructure/repositories/PrismaPackRepository';
import { PrismaServiceRepository } from '@/quotation/infrastructure/repositories/PrismaServiceRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { PrismaServiceRepository as PrismaServiceTypeRepository } from '@/quotation/infrastructure/repositories/PrismaServiceRepository';
import { BookingService } from '@/quotation/application/services/BookingService';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { QuoteCalculator } from '@/quotation/domain/calculators/MovingQuoteCalculator';
import { HttpRequest, HttpResponse } from '@/quotation/interfaces/http/types';
import { Rule } from '@/quotation/domain/valueObjects/Rule';
import { logger } from '@/lib/logger';
import { ConfigurationService } from '@/quotation/domain/services/ConfigurationService';
import { QuoteCalculatorFactory } from '@/quotation/application/factories/QuoteCalculatorFactory';
import { QuoteCalculatorService } from '@/quotation/application/services/QuoteCalculatorService';
import { FallbackCalculatorService } from '@/quotation/application/services/FallbackCalculatorService';
import { PdfService } from '@/quotation/application/services/PdfService';
import { EmailService } from '@/quotation/application/services/EmailService';

// LOG D'IMPORTATION TERMINÉE
console.log("\n========== IMPORTS API/BOOKINGS/ROUTE.TS TERMINÉS ==========\n");

// Initialisation des dépendances
const bookingRepository = new PrismaBookingRepository();
const movingRepository = new PrismaMovingRepository();
const packRepository = new PrismaPackRepository();
const serviceRepository = new PrismaServiceRepository();
const customerRepository = new PrismaCustomerRepository();
const quoteRequestRepo = new PrismaQuoteRequestRepository();
const serviceTypeRepository = new PrismaServiceTypeRepository();

// Initialiser le service de configuration
const configService = new ConfigurationService();

// Variable pour stocker le calculateur de devis
let quoteCalculator: QuoteCalculator | null = null;

// Variable pour stocker le service de réservation
let bookingServiceInstance: BookingService | null = null;

// Variable pour stocker le contrôleur
let bookingController: BookingController | null = null;

// Charger le service de calculateur
const calculatorService = QuoteCalculatorService.getInstance();
// Initialiser le service de fallback
const fallbackService = FallbackCalculatorService.getInstance();

calculatorService.initialize()
  .then(() => {
    logger.info('✅ Service de calculateur initialisé avec succès pour la route bookings');
    console.log("✅ Service de calculateur initialisé avec succès pour la route bookings");
  })
  .catch(error => {
    logger.error('⚠️ Erreur lors de l\'initialisation du service de calculateur:', error);
    console.error('⚠️ Erreur lors de l\'initialisation du service de calculateur:', error);
  });

// Services supplémentaires requis
const customerService = new CustomerService(customerRepository);
const transactionService = {} as any;
const documentService = {} as any;
const emailService = new EmailService();

// Variable pour stocker le service de génération de PDF
let pdfService: PdfService | null = null;

// Charger le service de génération de PDF
const pdfServiceInstance = PdfService.getInstance();

// Fonction utilitaire pour s'assurer que le calculateur est disponible
async function ensureCalculatorAvailable(): Promise<QuoteCalculator> {
  if (!quoteCalculator) {
    console.log("⚠️ Calculateur non initialisé, tentative d'initialisation à la demande...");
    
    try {
      // Utiliser le service centralisé au lieu d'appeler directement la factory
      quoteCalculator = await calculatorService.getCalculator();
      console.log("✅ Calculateur récupéré avec succès via QuoteCalculatorService");
    } catch (error) {
      console.error("❌ Échec de la récupération du calculateur via service:", error);
      
      // Utiliser le service FallbackCalculatorService pour obtenir un calculateur de secours
      console.log("🔄 Utilisation du service FallbackCalculatorService comme fallback");
      quoteCalculator = fallbackService.createFallbackCalculator(configService);
      
      console.log("✅ Calculateur initialisé à la demande avec le service fallback");
    }
  }
  
  // Garantir qu'on ne retourne jamais null
  if (!quoteCalculator) {
    throw new Error("Impossible d'initialiser le calculateur, même avec le fallback");
  }
  
  return quoteCalculator;
}

// Fonction utilitaire pour s'assurer que le service de réservation est disponible
async function ensureBookingServiceAvailable(): Promise<BookingService> {
  if (!bookingServiceInstance) {
    console.log("⚠️ BookingService non initialisé, tentative d'initialisation à la demande...");
    
    // S'assurer que le calculateur est disponible
    const calculator = await ensureCalculatorAvailable();
    
    // Créer le service de réservation
    bookingServiceInstance = new BookingService(
      bookingRepository,
      movingRepository,
      packRepository,
      serviceRepository,
      calculator,
      quoteRequestRepo,
      customerService,
      transactionService,
      documentService,
      emailService
    );
    
    console.log("✅ BookingService initialisé avec succès");
  }
  
  return bookingServiceInstance;
}

// Fonction utilitaire pour s'assurer que le contrôleur est disponible
async function ensureBookingControllerAvailable(): Promise<BookingController> {
  if (!bookingController) {
    console.log("⚠️ BookingController non initialisé, tentative d'initialisation à la demande...");
    
    // S'assurer que le service de réservation est disponible
    const service = await ensureBookingServiceAvailable();
    
    // Créer le contrôleur
    bookingController = new BookingController(service, customerService);
    
    console.log("✅ BookingController initialisé avec succès");
  }
  
  return bookingController;
}

// Initialiser le calculateur de devis via le service centralisé
calculatorService.getCalculator()
  .then(calculator => {
    quoteCalculator = calculator;
    logger.info('✅ Calculateur récupéré avec succès via QuoteCalculatorService');
    console.log("✅ Calculateur récupéré avec succès via QuoteCalculatorService");
    
    // Initialiser également le service et le contrôleur une fois le calculateur disponible
    ensureBookingServiceAvailable()
      .then(service => {
        return ensureBookingControllerAvailable();
      })
      .then(() => {
        console.log("✅ Initialisation complète du système");
      })
      .catch(error => {
        console.error("❌ Erreur lors de l'initialisation du système:", error);
      });
  })
  .catch(error => {
    logger.error('❌ Erreur lors de la récupération du calculateur via service, utilisation du fallback:', error);
    console.error('❌ Erreur lors de la récupération du calculateur via service, utilisation du fallback:', error);
    
    // Utiliser le service FallbackCalculatorService pour obtenir un calculateur de secours
    console.log("🔄 Utilisation du service FallbackCalculatorService comme fallback lors de l'initialisation principale");
    quoteCalculator = fallbackService.createFallbackCalculator(configService);
    
    logger.info('✅ Calculateur initialisé avec le service fallback');
    console.log("✅ Calculateur initialisé avec le service fallback");
    
    // Initialiser également le service et le contrôleur une fois le calculateur disponible
    ensureBookingServiceAvailable()
      .then(service => {
        return ensureBookingControllerAvailable();
      })
      .then(() => {
        console.log("✅ Initialisation complète du système (avec fallback)");
      })
      .catch(error => {
        console.error("❌ Erreur lors de l'initialisation du système (avec fallback):", error);
      });
  });

// Adaptateur pour convertir une requête NextJS en HttpRequest
function createHttpRequest(request: NextRequest, pathParams?: Record<string, string>, body?: any): HttpRequest {
  const searchParams = request.nextUrl.searchParams;
  const query: Record<string, string | string[]> = {};
  
  // Convertir les paramètres de recherche
  searchParams.forEach((value, key) => {
    query[key] = value;
  });
  
  // Créer un objet HttpRequest
  return {
    body: body,
    params: pathParams || {},
    query,
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

/**
 * GET /api/bookings - Récupération des réservations
 */
export async function GET(request: NextRequest) {
  console.log("\n========== ENTRÉE DANS LA FONCTION GET /api/bookings ==========\n");
  console.log("URL complète:", request.url);
  try {
    // S'assurer que le contrôleur est initialisé
    let controller;
    try {
      controller = await ensureBookingControllerAvailable();
    } catch (initError) {
      console.error("Erreur lors de l'initialisation du contrôleur:", initError);
      return NextResponse.json(
        { error: 'Le service est en cours d\'initialisation, veuillez réessayer dans quelques instants' },
        { status: 503 }
      );
    }
    
    // Vérifier s'il s'agit de la réservation en cours
    const url = new URL(request.url);
    if (url.pathname.includes('/api/bookings/current')) {
      return getCurrentBooking(request);
    }

    // Créer un HttpRequest à partir de NextRequest
    const httpRequest = createHttpRequest(request, {});
    
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    
    // Obtenir la liste des réservations
    await controller.getBookings(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la récupération des réservations',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/current - Récupération de la réservation en cours
 */
async function getCurrentBooking(request: NextRequest) {
  try {
    // S'assurer que le service est initialisé
    let service;
    try {
      service = await ensureBookingServiceAvailable();
    } catch (initError) {
      console.error("Erreur lors de l'initialisation du service:", initError);
      return NextResponse.json(
        { error: 'Le service est en cours d\'initialisation, veuillez réessayer dans quelques instants' },
        { status: 503 }
      );
    }
    
    // Créer une requête HTTP
    const httpRequest = createHttpRequest(request, {});
    
    // Créer une réponse HTTP
    const httpResponse = createHttpResponse();
    
    // Obtenir la réservation en cours depuis un cookie ou la session
    // Pour l'instant, on récupère juste la dernière réservation DRAFT ou on en crée une nouvelle
    const bookings = await service.findBookingsByStatus(BookingStatus.DRAFT);
    
    let currentBooking = null;
    if (bookings && bookings.length > 0) {
      currentBooking = bookings[0];
      try {
        // Récupérer les détails complets de la réservation
        const { booking, details } = await service.getBookingById(currentBooking.getId());
        
        // Construire une réponse avec les données essentielles
        const response: any = {
          id: booking.getId(),
          type: booking.getType(),
          status: booking.getStatus(),
          totalAmount: booking.getTotalAmount().getAmount(),
          details: {
            items: [] as any[],
            workers: 2, // Valeur par défaut
            duration: 1  // Valeur par défaut
          }
        };
        
        // Ajouter des propriétés supplémentaires en fonction du type
        if (details) {
          // Type-specific fields
          if (booking.getType() === 'MOVING_QUOTE') {
            response.details.workers = 2; // Default value for moving
            response.details.duration = 1; // Default in days
          } else if (booking.getType() === 'PACK') {
            response.details.workers = 2; // Default value for packs
            response.details.duration = 1; // Default in days 
          } else if (booking.getType() === 'SERVICE') {
            // Pour un service, récupérer workers et duration si disponibles
            response.details.workers = (details as any).workers || 1;
            response.details.duration = (details as any).duration || 1; // Default in hours
          }
          
          // Ajouter le client s'il existe
          const customer = booking.getCustomer();
          if (customer) {
            response.details.customer = {
              id: customer.getId(),
              firstName: customer.getContactInfo().getFirstName(),
              lastName: customer.getContactInfo().getLastName(),
              email: customer.getContactInfo().getEmail(),
              phone: customer.getContactInfo().getPhone()
            };
          }
          
          // Ajouter les items
          response.details.items = [{
            id: details.getId ? details.getId() : booking.getId(),
            type: booking.getType(),
            itemId: details.getId ? details.getId() : booking.getId(),
            data: details
          }];
        }
        
        httpResponse.status(200).json(response);
      } catch (error) {
        console.error("Erreur lors de la récupération des détails:", error);
        // En cas d'erreur, on retourne quand même les informations de base
        httpResponse.status(200).json({
          id: currentBooking.getId(),
          type: currentBooking.getType(),
          status: currentBooking.getStatus(),
          totalAmount: currentBooking.getTotalAmount().getAmount(),
          details: {
            workers: 2,  // Valeur par défaut
            duration: 1, // Valeur par défaut
            items: []
          }
        });
      }
    } else {
      // Pas de réservation en cours
      httpResponse.status(404).json({ error: 'Aucune réservation en cours' });
    }
    
    // Extraire les données et le code de statut
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error in GET /api/bookings/current:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la récupération de la réservation en cours',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings - Création d'une réservation en utilisant le flux recommandé
 * Utilise désormais le processus recommandé en 2 étapes (createQuoteRequest puis finalizeBooking)
 * via la méthode createReservation du BookingService
 */
export async function POST(request: NextRequest) {
  console.log("\n========== ENTRÉE DANS LA FONCTION POST /api/bookings ==========\n");
  console.log("URL complète:", request.url);
  
  try {
    // S'assurer que le contrôleur est initialisé
    let controller;
    try {
      controller = await ensureBookingControllerAvailable();
    } catch (initError) {
      console.error("Erreur lors de l'initialisation du contrôleur:", initError);
      return NextResponse.json(
        { error: 'Le service est en cours d\'initialisation, veuillez réessayer dans quelques instants' },
        { status: 503 }
      );
    }
    
    // Lecture du corps de la requête
    const body = await request.json();
    
    // Créer un HttpRequest à partir de NextRequest
    const httpRequest = createHttpRequest(request, {}, body);
    
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    
    // Création de réservation utilisant le flux recommandé
    await controller.createBooking(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Après avoir créé la réservation, ajouter ceci avant de renvoyer la réponse:
    if (action === 'create' || action === 'finalize') {
      try {
        // Générer le PDF de confirmation
        const pdfPath = await pdfServiceInstance.generateBookingPDF(booking);
        
        // Récupérer l'email du client
        const customer = booking.getCustomer();
        const contactInfo = customer?.getContactInfo();
        const email = contactInfo?.getEmail();
        
        if (email) {
          // Envoyer l'email avec le PDF
          await emailService.sendBookingConfirmation(booking, pdfPath);
          logger.info(`Email de confirmation de réservation envoyé à ${email}`);
        } else {
          logger.warn(`Impossible d'envoyer l'email de confirmation: email client non disponible`);
        }
      } catch (emailError) {
        logger.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
        // Ne pas bloquer le flux en cas d'erreur d'email
      }
    }
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json(
      { error: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings - Mise à jour d'une réservation
 */
export async function PATCH(request: NextRequest) {
  console.log("\n========== ENTRÉE DANS LA FONCTION PATCH /api/bookings ==========\n");
  console.log("URL complète:", request.url);
  
  try {
    // S'assurer que le contrôleur est initialisé
    let controller;
    try {
      controller = await ensureBookingControllerAvailable();
    } catch (initError) {
      console.error("Erreur lors de l'initialisation du contrôleur:", initError);
      return NextResponse.json(
        { error: 'Le service est en cours d\'initialisation, veuillez réessayer dans quelques instants' },
        { status: 503 }
      );
    }
    
    // Lecture du corps de la requête
    const body = await request.json();
    
    // Créer un HttpRequest à partir de NextRequest
    const httpRequest = createHttpRequest(request, {}, body);
    
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    
    // Mise à jour de la réservation
    await controller.updateBooking(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Dans la section qui gère la mise à jour (PATCH) avec annulation, ajouter:
    if (method === 'PATCH' && dto.status === BookingStatus.CANCELED) {
      try {
        // Récupérer l'email du client
        const customer = booking.getCustomer();
        const contactInfo = customer?.getContactInfo();
        const email = contactInfo?.getEmail();
        
        if (email) {
          // Envoyer l'email de notification d'annulation
          await emailService.sendCancellationNotification(
            booking,
            dto.cancellationReason || 'Annulation demandée par le client ou l\'administrateur.'
          );
          logger.info(`Email de notification d'annulation envoyé à ${email}`);
        } else {
          logger.warn(`Impossible d'envoyer l'email d'annulation: email client non disponible`);
        }
      } catch (emailError) {
        logger.error('Erreur lors de l\'envoi de l\'email d\'annulation:', emailError);
        // Ne pas bloquer le flux en cas d'erreur d'email
      }
    }
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error in PATCH /api/bookings:', error);
    return NextResponse.json(
      { error: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
} 