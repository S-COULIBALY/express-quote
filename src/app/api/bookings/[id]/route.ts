import { NextRequest, NextResponse } from 'next/server';
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
import { ConfigurationService } from '@/quotation/domain/services/ConfigurationService';
import { EmailService } from '@/quotation/application/services/EmailService';
import { logger } from '@/lib/logger';
import { emailService } from '@/config/services';

// Initialisation des dépendances
const bookingRepository = new PrismaBookingRepository();
const movingRepository = new PrismaMovingRepository();
const packRepository = new PrismaPackRepository();
const serviceRepository = new PrismaServiceRepository();
const customerRepository = new PrismaCustomerRepository();
const quoteRequestRepository = new PrismaQuoteRequestRepository();
const serviceTypeRepository = new PrismaServiceTypeRepository();

// Initialiser le service de configuration
const configService = new ConfigurationService();

// Créer les règles à partir des fonctions
const movingRulesList = createMovingRules();
const packRulesList = createPackRules();
const serviceRulesList = createServiceRules();

// Initialiser le calculateur de devis unifié avec les différents types de règles
const quoteCalculator = new QuoteCalculator(configService, movingRulesList, packRulesList, serviceRulesList);

const customerService = new CustomerService(customerRepository);

// Services supplémentaires requis
const transactionService = {} as any;
const documentService = {} as any;

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

// Ajouter un logger
const bookingLogger = logger.withContext ? 
  logger.withContext('BookingAPI') : 
  {
    debug: (msg: string, ...args: any[]) => console.debug('[BookingAPI]', msg, ...args),
    info: (msg: string, ...args: any[]) => console.info('[BookingAPI]', msg, ...args),
    warn: (msg: string, ...args: any[]) => console.warn('[BookingAPI]', msg, ...args),
    error: (msg: string | Error, ...args: any[]) => console.error('[BookingAPI]', msg, ...args)
  };

/**
 * GET /api/bookings/[id] - Récupération d'une réservation spécifique par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de réservation manquant' },
        { status: 400 }
      );
    }

    // Vérifier si l'endpoint contient un sous-chemin
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Si la route contient /services, traiter comme une demande de service spécifique
    if (path.includes(`/api/bookings/${id}/services`)) {
      return getBookingServices(request, id);
    }

    // Créer un HttpRequest à partir de NextRequest
    const httpRequest = createHttpRequest(request, { id });
    
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    
    // Utiliser le contrôleur pour obtenir une réservation spécifique
    await bookingController.getBookingById(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la récupération de la réservation',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bookings/[id] - Mise à jour complète d'une réservation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de réservation manquant' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Créer un HttpRequest à partir de NextRequest
    const httpRequest = createHttpRequest(request, { id }, body);
    
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    
    // Utiliser le contrôleur pour mettre à jour la réservation
    await bookingController.updateBooking(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error in PUT /api/bookings/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la mise à jour de la réservation',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/[id] - Suppression d'une réservation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de réservation manquant' },
        { status: 400 }
      );
    }
    
    // Créer un HttpRequest à partir de NextRequest
    const httpRequest = createHttpRequest(request, { id });
    
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    
    // Utiliser le contrôleur pour supprimer la réservation
    await bookingController.deleteBooking(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData || { success: true }, { status: statusCode });
  } catch (error) {
    console.error('Error in DELETE /api/bookings/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la suppression de la réservation',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/bookings/[id] - Mise à jour partielle d'une réservation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer l'ID de la réservation
    const bookingId = params.id;
    
    // Récupérer le corps de la requête
    const body = await request.json();
    
    bookingLogger.info(`Mise à jour de la réservation ${bookingId}`, { 
      status: body.status,
      hasCancellationReason: !!body.cancellationReason
    });
    
    // Initialiser les services nécessaires
    const bookingService = new BookingService();
    
    // Mettre à jour la réservation
    const booking = await bookingService.updateBooking(bookingId, body);
    
    // Si la mise à jour concerne une annulation, envoyer un email
    if (body.status === BookingStatus.CANCELED) {
      try {
        bookingLogger.info(`Envoi de notification d'annulation pour la réservation ${bookingId}`);
        await emailService.sendCancellationNotification(
          booking,
          body.cancellationReason || "Annulation demandée par le client ou l'administrateur."
        );
        bookingLogger.info(`Notification d'annulation envoyée pour la réservation ${bookingId}`);
      } catch (emailError) {
        bookingLogger.error(`Erreur lors de l'envoi de l'email d'annulation:`, emailError);
        // Ne pas bloquer la réponse même si l'envoi d'email échoue
      }
    }
    
    return NextResponse.json(booking);
  } catch (error) {
    bookingLogger.error('Erreur lors de la mise à jour de la réservation:', error);
    return NextResponse.json(
      { 
        error: "Une erreur est survenue lors de la mise à jour de la réservation",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings/[id]/services - Ajouter un service à une réservation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID de réservation manquant' },
        { status: 400 }
      );
    }
    
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Si la route contient /services, traiter comme un ajout de service
    if (path.includes(`/api/bookings/${id}/services`)) {
      return addServiceToBooking(request, id);
    }
    
    // Sinon, retourner une erreur
    return NextResponse.json(
      { error: 'Opération non supportée' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de l\'opération',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Ajout d'un service à une réservation existante
 */
async function addServiceToBooking(request: NextRequest, bookingId: string) {
  try {
    const serviceData = await request.json();
    
    // Vérifier que l'ID de service est fourni
    if (!serviceData.serviceId) {
      return NextResponse.json(
        { error: 'ID de service manquant' },
        { status: 400 }
      );
    }
    
    // Chercher la réservation
    const { booking } = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }
    
    // Ajouter le service à la réservation
    const updatedBooking = await bookingService.addServiceToBooking(bookingId, serviceData);
    
    return NextResponse.json({
      id: updatedBooking.getId(),
      status: updatedBooking.getStatus(),
      totalAmount: updatedBooking.getTotalAmount().getAmount(),
      message: 'Service ajouté avec succès'
    }, { status: 200 });
  } catch (error) {
    console.error('Error adding service to booking:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de l\'ajout du service',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Récupération des services d'une réservation
 */
async function getBookingServices(request: NextRequest, bookingId: string) {
  try {
    // Chercher la réservation
    const { booking, details } = await bookingService.getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 }
      );
    }
    
    // Si c'est une réservation de type SERVICE, on retourne les détails du service
    if (booking.getType() === BookingType.SERVICE && details) {
      return NextResponse.json({
        services: [{
          id: details.getId ? details.getId() : null,
          name: details.getName ? details.getName() : null,
          description: details.getDescription ? details.getDescription() : null,
          price: details.getPrice ? details.getPrice() : null,
          duration: details.getDuration ? details.getDuration() : null,
          scheduledDate: details.getScheduledDate ? details.getScheduledDate() : null,
          location: details.getLocation ? details.getLocation() : null
        }]
      }, { status: 200 });
    }
    
    // Pour les autres types de réservation, retourner une liste vide pour l'instant
    return NextResponse.json({ services: [] }, { status: 200 });
  } catch (error) {
    console.error('Error getting booking services:', error);
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la récupération des services',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
} 