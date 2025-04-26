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
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/bookings/current - Récupération de la réservation en cours
 */
export async function GET(request: NextRequest) {
  try {
    // Lire le cookie de session
    const cookieStore = cookies();
    const bookingId = cookieStore.get('current_booking_id')?.value;
    
    // Si aucun cookie, retourner un panier vide
    if (!bookingId) {
      console.log('Aucune réservation en cours trouvée (pas de cookie)');
      return NextResponse.json({ cart: { items: [] } });
    }
    
    try {
      // Rechercher la réservation dans la base de données
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          quote: true
        }
      });
      
      // Si la réservation n'existe pas, retourner un panier vide
      if (!booking) {
        console.log(`Réservation ${bookingId} non trouvée dans la base de données`);
        return NextResponse.json({ cart: { items: [] } });
      }
      
      // Formatter les données pour le panier
      const cartData = {
        id: booking.id,
        status: booking.status,
        customer: booking.customer ? {
          firstName: booking.customer.firstName,
          lastName: booking.customer.lastName,
          email: booking.customer.email
        } : null,
        details: {
          items: [
            {
              id: booking.id,
              type: booking.type,
              price: booking.totalAmount,
              name: booking.type === 'PACK' ? 'Pack de déménagement' : 
                    booking.type === 'SERVICE' ? 'Service à domicile' : 'Déménagement'
            }
          ]
        }
      };
      
      return NextResponse.json(cartData);
    } catch (error) {
      console.error('Erreur lors de la récupération de la réservation:', error);
      // En cas d'erreur, retourner un panier vide
      return NextResponse.json({ cart: { items: [] } });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la réservation en cours:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la réservation en cours' },
      { status: 500 }
    );
  }
} 