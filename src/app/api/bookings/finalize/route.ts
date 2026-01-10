import { NextRequest } from 'next/server';
import { BookingController } from '@/quotation/interfaces/http/controllers/BookingController';
import { BookingService } from '@/quotation/application/services/BookingService';
import { CustomerService } from '@/quotation/application/services/CustomerService';
import { PrismaBookingRepository } from '@/quotation/infrastructure/repositories/PrismaBookingRepository';
import { PrismaCustomerRepository } from '@/quotation/infrastructure/repositories/PrismaCustomerRepository';
import { PrismaQuoteRequestRepository } from '@/quotation/infrastructure/repositories/PrismaQuoteRequestRepository';

/**
 * POST /api/bookings/finalize
 * Finalise une réservation après confirmation du paiement Stripe
 * ⚠️ Appelé UNIQUEMENT par le webhook Stripe
 */
export async function POST(request: NextRequest) {
  // Initialiser les dépendances
  const bookingRepository = new PrismaBookingRepository();
  const customerRepository = new PrismaCustomerRepository();
  const quoteRequestRepository = new PrismaQuoteRequestRepository();

  const customerService = new CustomerService(customerRepository);
  const bookingService = new BookingService(
    bookingRepository,
    customerRepository,
    undefined, // QuoteCalculator - sera injecté par défaut
    quoteRequestRepository,
    customerService
  );

  const controller = new BookingController(bookingService, customerService);

  // Appeler le controller
  return await controller.finalizeBooking(request);
}
