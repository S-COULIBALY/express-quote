import { NextRequest, NextResponse } from 'next/server';
import { BookingController } from '@/quotation/interfaces/http/controllers/BookingController';
import { BookingService } from '@/quotation/application/services/BookingService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaMovingRepository } from '@/quotation/infrastructure/repositories/PrismaMovingRepository';
import { PrismaPackRepository } from '@/quotation/infrastructure/repositories/PrismaPackRepository';
import { PrismaServiceRepository } from '@/quotation/infrastructure/repositories/PrismaServiceRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';
import { QuoteCalculator } from '@/quotation/domain/calculators/MovingQuoteCalculator';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { BookingStatus } from '@/quotation/domain/enums/BookingStatus';
import { logger } from '@/lib/logger';
import { ConfigurationService } from '@/quotation/domain/services/ConfigurationService';

/**
 * GET /api/bookings/current - Récupération de la réservation en cours
 */
export async function GET(request: NextRequest) {
  try {
    // Initialiser les repositories
    const bookingRepository = new PrismaBookingRepository();
    const movingRepository = new PrismaMovingRepository();
    const packRepository = new PrismaPackRepository();
    const serviceRepository = new PrismaServiceRepository();
    const quoteRequestRepository = new PrismaQuoteRequestRepository();
    const customerRepository = new PrismaCustomerRepository();

    // Initialiser le service de configuration
    const configService = new ConfigurationService();
    
    // Initialiser les calculateurs
    const quoteCalculator = new QuoteCalculator(configService, [], [], []);
    
    // Initialiser les services
    const customerService = new CustomerService(customerRepository);
    const transactionService = {} as any;
    const documentService = {} as any;
    const emailService = {} as any;
    
    // Initialiser le service principal
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
    const bookingController = new BookingController(
      bookingService, 
      customerService
    );
    
    // Créer un adaptateur pour les requêtes/réponses HTTP
    const httpRequest = {
      body: {},
      params: {},
      query: {}
    };
    
    const httpResponse = {
      status: function(code: number) {
        return {
          json: function(data: any) {
            return { statusCode: code, data };
          }
        };
      }
    };
    
    // Rechercher les réservations en cours (DRAFT)
    const bookings = await bookingService.findBookingsByStatus(BookingStatus.DRAFT);
    
    // S'il y a une réservation en cours, la retourner
    if (bookings && bookings.length > 0) {
      const currentBooking = bookings[0];
      const { booking, details } = await bookingService.getBookingById(currentBooking.getId());
      
      // Ajouter les propriétés workers et duration selon le type de réservation
      const responseData = {
        id: booking.getId(),
        type: booking.getType(),
        status: booking.getStatus(),
        totalAmount: booking.getTotalAmount().getAmount(),
        details: {
          ...details,
          // Valeurs par défaut pour éviter l'erreur "Cannot read properties of undefined"
          workers: 2,  // Valeur par défaut
          duration: 1, // Valeur par défaut
          items: [{
            id: details ? (details as any).getId?.() || booking.getId() : booking.getId(),
            type: booking.getType(),
            itemId: details ? (details as any).getId?.() || booking.getId() : booking.getId(),
            data: {
              ...details,
              // Aussi ajouter ces propriétés dans l'objet data
              workers: (details as any)?.workers || 2,
              duration: (details as any)?.duration || 1
            }
          }]
        }
      };
      
      // Ajouter les informations du client si disponibles
      try {
        const customer = booking.getCustomer?.();
        if (customer) {
          responseData.details.customer = {
            id: customer.getId(),
            firstName: customer.getContactInfo().getFirstName(),
            lastName: customer.getContactInfo().getLastName(),
            email: customer.getContactInfo().getEmail(),
            phone: customer.getContactInfo().getPhone()
          };
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des informations client:", error);
      }
      
      return NextResponse.json(responseData, { status: 200 });
    }
    
    // Pas de réservation en cours
    return NextResponse.json(
      { error: 'Aucune réservation en cours' },
      { status: 404 }
    );
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error('Erreur inconnue');
    logger.error('Erreur dans GET /api/bookings/current', errorObj);
    
    return NextResponse.json(
      { 
        error: 'Une erreur est survenue lors de la récupération de la réservation en cours',
        details: errorObj.message
      },
      { status: 500 }
    );
  }
} 