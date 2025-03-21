import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, BookingType, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Interface pour les propriétés personnalisées des réservations
interface EnhancedBooking {
  id: string;
  type: BookingType;
  status: BookingStatus;
  customerId: string;
  totalAmount: number;
  scheduledDate: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Propriétés des citations de déménagement
  pickupAddress?: string;
  deliveryAddress?: string;
  moveDate?: Date;
  distance?: number;
  volume?: number;
  items?: any;
  
  // Propriétés des packs
  packId?: string;
  packName?: string;
  
  // Propriétés des services
  serviceId?: string;
  serviceName?: string;
  description?: string;
  scheduledTime?: string;
  location?: string;
  
  // Relations
  customer: any;
  transactions: any[];
  documents: any[];
  
  [key: string]: any; // Pour gérer d'autres propriétés dynamiques
}

// GET /api/bookings - Récupérer toutes les réservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    
    const where: any = {};
    
    if (customerId) {
      where.customerId = customerId;
    }

    const rawBookings = await prisma.booking.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      include: {
        customer: true,
        transactions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        documents: {
          where: {
            type: 'BOOKING_CONFIRMATION'
          },
          take: 1
        }
      },
    });
    
    // Utiliser une assertion de type
    const bookings = rawBookings as unknown as EnhancedBooking[];

    // Transformer les données pour le format attendu par le frontend
    const formattedBookings = bookings.map(booking => {
      // Déterminer le type de réservation
      const bookingType = booking.type;
      const lastTransaction = booking.transactions[0];
      const document = booking.documents[0];
      
      let formattedBooking: any = {
        id: booking.id,
        status: booking.status,
        scheduledDate: booking.scheduledDate,
        createdAt: booking.createdAt,
        customer: {
          firstName: booking.customer.firstName,
          lastName: booking.customer.lastName,
          email: booking.customer.email,
          phone: booking.customer.phone
        },
        totalPrice: booking.totalAmount,
        paymentStatus: lastTransaction?.status || 'NONE'
      };
      
      // Ajouter des détails spécifiques au type de réservation
      if (bookingType === BookingType.QUOTE) {
        formattedBooking.type = 'quote';
        formattedBooking.originAddress = booking.pickupAddress;
        formattedBooking.destAddress = booking.deliveryAddress;
        formattedBooking.moveDate = booking.moveDate;
        formattedBooking.distance = booking.distance;
        formattedBooking.volume = booking.volume;
        formattedBooking.items = booking.items ? 
          (typeof booking.items === 'string' ? JSON.parse(booking.items) : booking.items) : 
          [];
      } 
      else if (bookingType === BookingType.PACK) {
        formattedBooking.type = 'pack';
        formattedBooking.packId = booking.packId;
        formattedBooking.packName = booking.packName;
        formattedBooking.destAddress = booking.location || booking.deliveryAddress;
      }
      else if (bookingType === BookingType.SERVICE) {
        formattedBooking.type = 'service';
        formattedBooking.serviceId = booking.serviceId;
        formattedBooking.serviceName = booking.serviceName;
        formattedBooking.description = booking.description;
        formattedBooking.scheduledTime = booking.scheduledTime;
        formattedBooking.destAddress = booking.location || booking.deliveryAddress;
      }

      // Ajouter l'URL du document si disponible
      if (document) {
        formattedBooking.documentId = document.id;
      }
      
      return formattedBooking;
    });

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/bookings - Créer une nouvelle réservation
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { 
      type, // 'quote', 'pack', or 'service'
      quoteId,
      packId,
      serviceId,
      customerId,
      scheduledDate,
      originAddress,
      destAddress,
      serviceDate,
      packName,
      serviceName,
      price,
      description
    } = data;

    // Validation des données
    if (!customerId || !scheduledDate || !destAddress) {
      return NextResponse.json(
        { error: 'Customer, scheduled date, and destination address are required' },
        { status: 400 }
      );
    }
    
    if (type === 'quote' && !quoteId) {
      return NextResponse.json(
        { error: 'Quote ID is required for quote-based bookings' },
        { status: 400 }
      );
    }
    
    if (type === 'pack' && !packId) {
      return NextResponse.json(
        { error: 'Pack ID is required for pack-based bookings' },
        { status: 400 }
      );
    }
    
    if (type === 'service' && !serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required for service-only bookings' },
        { status: 400 }
      );
    }

    // Mapper le type de la demande au type de booking
    let bookingType: BookingType;
    if (type === 'quote') {
      bookingType = BookingType.QUOTE;
    } else if (type === 'pack') {
      bookingType = BookingType.PACK;
    } else if (type === 'service') {
      bookingType = BookingType.SERVICE;
    } else {
      return NextResponse.json(
        { error: 'Invalid booking type' },
        { status: 400 }
      );
    }

    // Créer la réservation avec le nouveau modèle unifié
    const bookingData: any = {
      type: bookingType,
      status: BookingStatus.DRAFT,
      customerId,
      totalAmount: parseFloat(price || '0'),
      scheduledDate: new Date(scheduledDate)
    };
    
    // Ajouter les champs spécifiques au type de réservation en fonction du type
    if (bookingType === BookingType.QUOTE) {
      Object.assign(bookingData, {
        pickupAddress: originAddress,
        deliveryAddress: destAddress,
        quoteId: quoteId
      });
    } 
    else if (bookingType === BookingType.PACK) {
      Object.assign(bookingData, {
        packId: packId,
        packName: packName,
        location: destAddress
      });
    }
    else if (bookingType === BookingType.SERVICE) {
      Object.assign(bookingData, {
        serviceId: serviceId,
        serviceName: serviceName,
        description: description,
        scheduledTime: serviceDate ? new Date(serviceDate).toISOString() : null,
        location: destAddress
      });
    }

    // Créer la réservation
    const booking = await prisma.booking.create({
      data: bookingData,
      include: {
        customer: true
      }
    });

    return NextResponse.json({
      id: booking.id,
      status: booking.status,
      type: type,
      scheduledDate: booking.scheduledDate,
      customer: booking.customer,
      totalPrice: booking.totalAmount
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 