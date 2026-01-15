import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * GET /api/bookings/current - Récupération de la réservation en cours
 * Route simplifiée pour récupérer la réservation en cours via cookie de session
 */
export async function GET(request: NextRequest) {
  try {
    logger.info('🔍 GET /api/bookings/current - Récupération réservation en cours');
    
    // Lire le cookie de session
    const cookieStore = cookies();
    const bookingId = cookieStore.get('current_booking_id')?.value;
    
    // Si aucun cookie, retourner un panier vide
    if (!bookingId) {
      logger.info('Aucune réservation en cours trouvée (pas de cookie)');
      return NextResponse.json({ 
        success: true,
        data: { cart: { items: [] } }
      });
    }
    
    try {
      // Rechercher la réservation dans la base de données
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          Customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
      
      // Si la réservation n'existe pas, retourner un panier vide
      if (!booking) {
        logger.info(`Réservation ${bookingId} non trouvée dans la base de données`);
        return NextResponse.json({ 
          success: true,
          data: { cart: { items: [] } }
        });
      }
      
      // Formatter les données pour le panier
      const cartData = {
        id: booking.id,
        status: booking.status,
        customer: booking.Customer ? {
          id: booking.Customer.id,
          firstName: booking.Customer.firstName,
          lastName: booking.Customer.lastName,
          email: booking.Customer.email
        } : null,
        cart: {
          items: [
            {
              id: booking.id,
              type: booking.type,
              price: booking.totalAmount,
              name: getServiceDisplayName(booking.type),
              scheduledDate: booking.scheduledDate,
              locationAddress: booking.locationAddress
            }
          ],
          totalAmount: booking.totalAmount,
          itemCount: 1
        }
      };
      
      logger.info(`✅ Réservation en cours récupérée: ${booking.id}`);
      return NextResponse.json({
        success: true,
        data: cartData
      });
      
    } catch (dbError) {
      logger.error('Erreur lors de la récupération de la réservation:', dbError);
      // En cas d'erreur DB, retourner un panier vide
      return NextResponse.json({ 
        success: true,
        data: { cart: { items: [] } }
      });
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération de la réservation en cours:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la récupération de la réservation en cours',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}

/**
 * Obtient le nom d'affichage du service selon son type
 */
function getServiceDisplayName(serviceType: string): string {
  switch (serviceType) {
    case 'MOVING':
    case 'MOVING_QUOTE':
      return 'Déménagement';
    case 'PACK':
      return 'Pack de déménagement';
    case 'SERVICE':
      return 'Service à domicile';
    case 'CLEANING':
      return 'Ménage';
    case 'DELIVERY':
      return 'Livraison';
    default:
      return 'Service Express Quote';
  }
}