import { NextRequest, NextResponse } from 'next/server';
import { BookingController } from '@/quotation/interfaces/http/controllers/BookingController';
import { BookingService } from '@/quotation/application/services/BookingService';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaItemRepository } from '@/quotation/infrastructure/repositories/PrismaItemRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { logger } from '@/lib/logger';

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: BookingController | null = null;

function getController(): BookingController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const bookingRepository = new PrismaBookingRepository();
    const customerRepository = new PrismaCustomerRepository();
    const movingRepository = new PrismaMovingRepository();
    const itemRepository = new PrismaItemRepository();
    const quoteRequestRepository = new PrismaQuoteRequestRepository();
    
    const customerService = new CustomerService(customerRepository);
    const bookingService = new BookingService(
      bookingRepository,
      movingRepository,
      itemRepository,
      customerRepository,
      undefined, // QuoteCalculator - sera injecté par défaut
      quoteRequestRepository,
      customerService
    );
    
    controllerInstance = new BookingController(bookingService, customerService);
    
    logger.info('🏗️ BookingController initialisé avec architecture DDD');
  }
  
  return controllerInstance;
}

/**
 * POST /api/bookings - Créer une nouvelle réservation
 * Utilise le BookingController DDD pour orchestrer la logique métier
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('🔄 POST /api/bookings - Création réservation via DDD Controller');
    
    const controller = getController();
    return await controller.createBooking(request);
    
  } catch (error) {
    logger.error('❌ Erreur dans POST /api/bookings:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la création de la réservation',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings - Rechercher des réservations
 * Utilise le BookingController DDD pour la recherche avec critères
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    logger.info('🔍 GET /api/bookings - Recherche réservations via DDD Controller');
    
    const controller = getController();
    return await controller.searchBookings(request);
    
  } catch (error) {
    logger.error('❌ Erreur dans GET /api/bookings:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la recherche des réservations',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}