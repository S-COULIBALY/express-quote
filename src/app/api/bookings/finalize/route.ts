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

// Initialisation des dépendances (factoriser l'initialisation pour éviter les duplications)
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
    console.log("⚠️ BookingService non initialisé pour l'API de finalisation, initialisation...");
    
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
    
    console.log("✅ BookingService initialisé avec succès pour l'API de finalisation");
  }
  
  return bookingServiceInstance;
}

/**
 * POST /api/bookings/finalize - Finalise une réservation après paiement
 */
export async function POST(request: NextRequest) {
  try {
    // S'assurer que le service est initialisé
    const service = await ensureBookingServiceAvailable();
    
    // Lecture du corps de la requête
    const body = await request.json();
    const { sessionId } = body;
    
    // Valider les données
    if (!sessionId) {
      return NextResponse.json(
        { error: 'L\'ID de session de paiement est obligatoire' },
        { status: 400 }
      );
    }
    
    console.log(`🔄 API - Finalisation de la réservation pour la session de paiement: ${sessionId}`);
    
    // Créer la réservation après paiement
    const booking = await service.createBookingAfterPayment(sessionId);
    
    // Construire une réponse avec les informations pertinentes
    const response = {
      id: booking.getId(),
      type: booking.getType(),
      status: booking.getStatus(),
      customer: {
        id: booking.getCustomer().getId(),
        firstName: booking.getCustomer().getContactInfo().getFirstName(),
        lastName: booking.getCustomer().getContactInfo().getLastName()
      },
      totalAmount: booking.getTotalAmount().getAmount(),
      createdAt: booking.getCreatedAt()
    };
    
    console.log(`✅ API - Réservation ${booking.getId()} finalisée avec succès`);
    
    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    logger.error('Error in bookings/finalize API:', error);
    console.error('Error in bookings/finalize API:', error);
    
    return NextResponse.json(
      { error: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/finalize/callback - Point d'entrée pour les callbacks de paiement
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Paramètre session_id manquant' },
        { status: 400 }
      );
    }
    
    // S'assurer que le service est initialisé
    const service = await ensureBookingServiceAvailable();
    
    // Créer la réservation après paiement
    const booking = await service.createBookingAfterPayment(sessionId);
    
    // Rediriger vers la page de succès
    return NextResponse.redirect(new URL(`/success?id=${booking.getId()}`, request.url));
  } catch (error: any) {
    logger.error('Error in bookings/finalize/callback API:', error);
    console.error('Error in bookings/finalize/callback API:', error);
    
    // Rediriger vers la page d'erreur
    return NextResponse.redirect(new URL('/error?message=payment_processing_failed', request.url));
  }
} 