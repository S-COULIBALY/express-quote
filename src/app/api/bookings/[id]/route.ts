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
    
    logger.info('🏗️ BookingController [id] initialisé avec architecture DDD');
  }
  
  return controllerInstance;
}

/**
 * GET /api/bookings/{id} - Récupérer une réservation par ID
 * Utilise le BookingController DDD pour la récupération
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info(`🔍 GET /api/bookings/${params.id} - Récupération réservation via DDD Controller`);
    
    const controller = getController();
    return await controller.getBookingById(request, { params });
    
  } catch (error) {
    logger.error(`❌ Erreur dans GET /api/bookings/${params.id}:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération de la réservation',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bookings/{id} - Mettre à jour une réservation
 * Utilise le BookingController DDD pour la mise à jour
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info(`🔄 PUT /api/bookings/${params.id} - Mise à jour réservation via DDD Controller`);
    
    const controller = getController();
    return await controller.updateBooking(request, { params });
    
  } catch (error) {
    logger.error(`❌ Erreur dans PUT /api/bookings/${params.id}:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la mise à jour de la réservation',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bookings/{id} - Supprimer une réservation
 * Utilise le BookingController DDD pour la suppression
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    logger.info(`🗑️ DELETE /api/bookings/${params.id} - Suppression réservation via DDD Controller`);
    
    const controller = getController();
    return await controller.deleteBooking(request, { params });
    
  } catch (error) {
    logger.error(`❌ Erreur dans DELETE /api/bookings/${params.id}:`, error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la suppression de la réservation',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}