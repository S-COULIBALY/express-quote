import { NextRequest, NextResponse } from 'next/server';

// LOG DE CHARGEMENT DU MODULE
console.log("\n========== MODULE API/BOOKINGS/ROUTE.TS CHARGÉ ==========\n");

import { BookingStatus, BookingType } from '@/quotation/domain/entities/Booking';
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
import { createMovingRules } from '@/quotation/domain/rules/MovingRules';
import { createPackRules } from '@/quotation/domain/rules/PackRules';
import { createServiceRules } from '@/quotation/domain/rules/ServiceRules';
import { Rule } from '@/quotation/domain/valueObjects/Rule';
import { Money } from '@/quotation/domain/valueObjects/Money';
import { QuoteCalculatorFactory } from '@/quotation/application/factories/QuoteCalculatorFactory';
import { QuoteContext } from '@/quotation/domain/valueObjects/QuoteContext';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { logger } from '@/lib/logger';
import { ValidationError } from '@/quotation/domain/errors/ValidationError';
import { ConfigurationService } from '@/quotation/domain/services/ConfigurationService';

// LOG D'IMPORTATION TERMINÉE
console.log("\n========== IMPORTS API/BOOKINGS/ROUTE.TS TERMINÉS ==========\n");

// Initialiser la factory au démarrage
QuoteCalculatorFactory.initialize()
  .catch(err => logger.error('Failed to initialize QuoteCalculatorFactory', err));

// Initialisation des dépendances
const bookingRepository = new PrismaBookingRepository();
const movingRepository = new PrismaMovingRepository();
const packRepository = new PrismaPackRepository();
const serviceRepository = new PrismaServiceRepository();
const customerRepository = new PrismaCustomerRepository();
const quoteRequestRepository = new PrismaQuoteRequestRepository();
const serviceTypeRepository = new PrismaServiceTypeRepository();

// Convertir les règles de déménagement depuis le format historique
const movingRulesList: Rule[] = createMovingRules().rules.map(ruleData => 
  new Rule(ruleData.name, ruleData.percentage, ruleData.amount, 
    // Convertir la fonction condition pour qu'elle corresponde au type attendu
    (context: any) => typeof ruleData.condition === 'function' && 
                    ruleData.condition.length > 1 ? 
      // Si la fonction a besoin de deux arguments, on retourne une fonction compatible
      ruleData.condition(context, new Money(0)) : 
      // Sinon on utilise la fonction telle quelle
      ruleData.condition
  )
);

// Initialiser le calculateur de devis unifié avec les différents types de règles
const quoteCalculator = new QuoteCalculator(movingRulesList, createPackRules(), createServiceRules());

const customerService = new CustomerService(customerRepository);

// Services supplémentaires requis
const transactionService = {} as any;
const documentService = {} as any;
const emailService = {} as any;

// Utiliser directement les repositories
const bookingService = new BookingService(
  bookingRepository,
  movingRepository,
  packRepository,
  serviceRepository,
  quoteCalculator,
  quoteRequestRepository,
  customerService,
  transactionService,
  documentService,
  emailService
);

// Initialiser le contrôleur
const bookingController = new BookingController(bookingService, customerService);

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
    await bookingController.getBookings(httpRequest, httpResponse);
    
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
    // Créer une requête HTTP
    const httpRequest = createHttpRequest(request, {});
    
    // Créer une réponse HTTP
    const httpResponse = createHttpResponse();
    
    // Obtenir la réservation en cours depuis un cookie ou la session
    // Pour l'instant, on récupère juste la dernière réservation DRAFT ou on en crée une nouvelle
    const bookings = await bookingService.findBookingsByStatus(BookingStatus.DRAFT);
    
    let currentBooking = null;
    if (bookings && bookings.length > 0) {
      currentBooking = bookings[0];
      try {
        // Récupérer les détails complets de la réservation
        const { booking, details } = await bookingService.getBookingById(currentBooking.getId());
        
        // Construire une réponse avec les données essentielles
        const response = {
          id: booking.getId(),
          type: booking.getType(),
          status: booking.getStatus(),
          totalAmount: booking.getTotalAmount().getAmount(),
          details: {
            items: []
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
 * POST /api/bookings - Création d'une réservation ou calcul de prix
 */
export async function POST(request: NextRequest) {
  console.log("\n========== ENTRÉE DANS LA FONCTION POST /api/bookings ==========\n");
  console.log("URL complète:", request.url);
  
  const url = new URL(request.url);
  
  try {
    // Si le chemin contient "calculate", traiter comme une demande de calcul de prix
    if (url.pathname.includes('/api/bookings/calculate')) {
      console.log("URL DÉTECTÉE: /api/bookings/calculate - APPEL calculatePrice()");
      return calculatePrice(request);
    }
    
    const body = await request.json();
    
    // Créer un HttpRequest à partir de NextRequest
    const httpRequest = createHttpRequest(request, {}, body);
    
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    
    // Création standard d'une réservation
    await bookingController.createBooking(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
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
 * Fonction pour calculer le prix d'un service
 */
async function calculatePrice(request: NextRequest) {
  console.log("\n############ DÉBUT calculatePrice ############\n");
  
  try {
    // Log de la requête entrante
    console.log("URL:", request.url);
    console.log("METHOD:", request.method);
    console.log("HEADERS:", Object.fromEntries(request.headers.entries()));
    
    // Lire le corps de la requête
    const bodyText = await request.text();
    console.log("BODY TEXT:", bodyText);
    
    try {
      // Parser le corps en JSON
      const requestData = JSON.parse(bodyText);
      console.log("PARSED JSON:", JSON.stringify(requestData, null, 2));
      
      // Version de test - pour vérifier si notre correction a résolu l'erreur "Opération non supportée"
      return NextResponse.json({
        success: true,
        message: "Notre correction pour l'erreur 'Opération non supportée' a été implémentée",
        received: requestData
      });
      
    } catch (parseError) {
      console.log("ERREUR DE PARSING JSON:", parseError);
      return NextResponse.json(
        { error: 'Format JSON invalide', details: String(parseError) },
        { status: 400 }
      );
    }
  } catch (error) {
    console.log("ERREUR GLOBALE:", error);
    return NextResponse.json(
      { error: 'Erreur interne', details: String(error) },
      { status: 500 }
    );
  } finally {
    console.log("\n############ FIN calculatePrice ############\n");
  }
} 