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
import { movingRules } from '@/quotation/domain/services/rules/movingRules';
import { packRules } from '@/quotation/domain/valueObjects/packRules';
import { serviceRules } from '@/quotation/domain/valueObjects/serviceRules';
import { Rule } from '@/quotation/domain/valueObjects/Rule';

// Initialisation des dépendances
const bookingRepository = new PrismaBookingRepository();
const movingRepository = new PrismaMovingRepository();
const packRepository = new PrismaPackRepository();
const serviceRepository = new PrismaServiceRepository();
const customerRepository = new PrismaCustomerRepository();
const quoteRequestRepository = new PrismaQuoteRequestRepository();
const serviceTypeRepository = new PrismaServiceTypeRepository();

// Convertir les règles de déménagement depuis le format historique
const movingRulesList: Rule[] = movingRules.rules.map(ruleData => 
  new Rule(ruleData.name, ruleData.percentage, ruleData.amount, ruleData.condition)
);

// Initialiser le calculateur de devis unifié avec les différents types de règles
const quoteCalculator = new QuoteCalculator(movingRulesList, packRules, serviceRules);

const customerService = new CustomerService(customerRepository);

const bookingService = new BookingService(
  bookingRepository,
  movingRepository,
  packRepository,
  serviceRepository,
  quoteCalculator,
  quoteRequestRepository,
  customerService
);

// Initialiser le contrôleur
const bookingController = new BookingController(bookingService, customerService);

// Fonction de sérialisation d'une réservation et ses détails (à conserver)
function serializeBooking(booking: Booking, details?: any) {
  // Base commune à toutes les réservations
  const serialized = {
    id: booking.getId(),
    type: booking.getType(),
    status: booking.getStatus(),
    customer: {
      id: booking.getCustomer().getId(),
      firstName: booking.getCustomer().getFirstName(),
      lastName: booking.getCustomer().getLastName(),
      email: booking.getCustomer().getEmail(),
      phone: booking.getCustomer().getPhone()
    },
    professional: booking.getProfessional() ? {
      id: booking.getProfessional()?.getId(),
      companyName: booking.getProfessional()?.getCompanyName(),
      email: booking.getProfessional()?.getEmail(),
      phone: booking.getProfessional()?.getPhone()
    } : null,
    totalAmount: booking.getTotalAmount().getAmount(),
    createdAt: booking.getCreatedAt()?.toISOString(),
    updatedAt: booking.getUpdatedAt()?.toISOString()
  };

  // Ajouter les détails spécifiques selon le type
  if (details) {
    switch (booking.getType()) {
      case BookingType.MOVING_QUOTE:
        return {
          ...serialized,
          moveDate: details.getMoveDate()?.toISOString(),
          pickupAddress: details.getPickupAddress(),
          deliveryAddress: details.getDeliveryAddress(),
          distance: details.getDistance(),
          volume: details.getVolume(),
          pickupFloor: details.getPickupFloor(),
          deliveryFloor: details.getDeliveryFloor(),
          pickupElevator: details.hasPickupElevator(),
          deliveryElevator: details.hasDeliveryElevator()
        };
      case BookingType.PACK:
        return {
          ...serialized,
          name: details?.getName() || "",
          description: details?.getDescription() || "",
          price: details?.getPrice()?.getAmount() || 0,
          includes: details?.getIncludedItems() || [],
          scheduledDate: details?.getScheduledDate()?.toISOString() || new Date().toISOString(),
          pickupAddress: details?.getPickupAddress() || "",
          deliveryAddress: details?.getDeliveryAddress() || ""
        };
      case BookingType.SERVICE:
        return {
          ...serialized,
          name: details.getName(),
          description: details.getDescription(),
          price: details.getPrice(),
          duration: details.getDuration(),
          includes: details.getIncludes(),
          scheduledDate: details.getScheduledDate()?.toISOString(),
          location: details.getLocation()
        };
      default:
        return serialized;
    }
  }

  return serialized;
}

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

// POST - Traiter les différentes routes selon le chemin
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    const body = await request.json();
    
    // Déterminer quelle action effectuer selon le chemin
    if (path.includes('/api/bookings/quote')) {
      // Création d'une demande de devis temporaire
      const httpRequest = createHttpRequest(request, {}, body);
      await bookingController.createQuoteRequest(httpRequest, httpResponse);
    } 
    else if (path.includes('/api/bookings/finalize')) {
      // Finalisation d'une réservation avec les informations client
      const httpRequest = createHttpRequest(request, {}, body);
      await bookingController.finalizeBooking(httpRequest, httpResponse);
    }
    else if (path.includes('/api/bookings/payment')) {
      // Traitement du paiement d'une réservation
      const httpRequest = createHttpRequest(request, {}, body);
      await bookingController.processPayment(httpRequest, httpResponse);
    }
    else {
      // Création standard d'une réservation
      const httpRequest = createHttpRequest(request, {}, body);
      await bookingController.createBooking(httpRequest, httpResponse);
    }
    
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

// GET - Récupération des réservations
export async function GET(request: NextRequest) {
  try {
    // Extraction des paramètres de recherche
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    // Créer un HttpRequest à partir de NextRequest
    const httpRequest = createHttpRequest(request, id ? { id } : {});
    
    // Créer un HttpResponse
    const httpResponse = createHttpResponse();
    
    // Utiliser le contrôleur
    if (id) {
      await bookingController.getBookingById(httpRequest, httpResponse);
    } else {
      await bookingController.getBookings(httpRequest, httpResponse);
    }
    
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

// PUT - Mise à jour d'une réservation
export async function PUT(request: NextRequest) {
  try {
    // Extraire l'ID de la réservation depuis l'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
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
    
    // Utiliser le contrôleur
    await bookingController.updateBooking(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: `Une erreur est survenue lors de la mise à jour de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

// DELETE - Suppression d'une réservation
export async function DELETE(request: NextRequest) {
  try {
    // Extraire l'ID de la réservation depuis l'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
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
    
    // Utiliser le contrôleur
    await bookingController.deleteBooking(httpRequest, httpResponse);
    
    // Extraire le code de statut du HttpResponse
    const statusCode = httpResponse.getStatus();
    
    // Retourner une réponse NextResponse
    return new NextResponse(null, { status: statusCode });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: `Une erreur est survenue lors de la suppression de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour du statut d'une réservation
export async function PATCH(request: NextRequest) {
  try {
    // Extraire l'ID de la réservation depuis l'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
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
    
    // Utiliser le contrôleur
    await bookingController.updateBookingStatus(httpRequest, httpResponse);
    
    // Extraire les données et le code de statut du HttpResponse
    const responseData = httpResponse.getData();
    const statusCode = httpResponse.getStatus();
    
    // Retourner une réponse NextResponse
    return NextResponse.json(responseData, { status: statusCode });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: `Une erreur est survenue lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
} 