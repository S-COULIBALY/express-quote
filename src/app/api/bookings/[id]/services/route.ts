import { NextRequest, NextResponse } from 'next/server';
import { BookingController } from '@/quotation/interfaces/http/controllers/BookingController';
import { BookingService } from '@/quotation/application/services/BookingService';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { logger } from '@/lib/logger';

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: BookingController | null = null;

function getController(): BookingController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const bookingRepository = new PrismaBookingRepository();
    const customerRepository = new PrismaCustomerRepository();
    const quoteRequestRepository = new PrismaQuoteRequestRepository();

    const customerService = new CustomerService(customerRepository);
    const bookingService = new BookingService(
      bookingRepository,
      customerRepository,
      quoteRequestRepository,
      customerService
    );
    
    controllerInstance = new BookingController(bookingService, customerService);
    
    logger.info('🏗️ BookingController [id]/services initialisé avec architecture DDD');
  }
  
  return controllerInstance;
}

/**
 * POST /api/bookings/{id}/services - Ajouter un service à une réservation
 * Migré vers l'architecture DDD
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info(`🔧 POST /api/bookings/${params.id}/services - Ajout service via DDD Controller`);
    
    const controller = getController();
    return await controller.addServiceToBooking(request, { params });
    
  } catch (error) {
    logger.error(`❌ Erreur dans POST /api/bookings/${params.id}/services:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de l\'ajout du service',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/{id}/services - Récupérer les services d'une réservation
 * Migré vers l'architecture DDD
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info(`🔍 GET /api/bookings/${params.id}/services - Récupération services via DDD Controller`);
    
    const controller = getController();
    return await controller.getBookingServices(request, { params });
    
  } catch (error) {
    logger.error(`❌ Erreur dans GET /api/bookings/${params.id}/services:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération des services',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}