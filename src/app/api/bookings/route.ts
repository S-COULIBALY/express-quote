import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/bookings - Récupérer toutes les réservations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const professionalId = searchParams.get('professionalId');
    
    const where: any = {};
    
    if (customerId) {
      where.customerId = customerId;
    }
    
    if (professionalId) {
      where.professionalId = professionalId;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      include: {
        quote: true,
        pack: true,
        customer: true,
        professional: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });

    return NextResponse.json(bookings);
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
      professionalId,
      scheduledDate,
      originAddress,
      destAddress,
      serviceDate,
    } = data;

    // Validation des données
    if (!customerId || !professionalId || !scheduledDate || !destAddress) {
      return NextResponse.json(
        { error: 'Customer, professional, scheduled date, and destination address are required' },
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

    let booking;
    
    // Créer la réservation en fonction du type
    if (type === 'quote') {
      booking = await prisma.booking.create({
        data: {
          status: 'SCHEDULED',
          scheduledDate: new Date(scheduledDate),
          originAddress,
          destAddress,
          quoteId,
          customerId,
          professionalId,
        },
        include: {
          quote: true,
          customer: true,
          professional: true,
        },
      });
    } else if (type === 'pack') {
      booking = await prisma.booking.create({
        data: {
          status: 'SCHEDULED',
          scheduledDate: new Date(scheduledDate),
          originAddress,
          destAddress,
          packId,
          customerId,
          professionalId,
        },
        include: {
          pack: true,
          customer: true,
          professional: true,
        },
      });
    } else if (type === 'service') {
      // Créer d'abord la réservation
      booking = await prisma.booking.create({
        data: {
          status: 'SCHEDULED',
          scheduledDate: new Date(scheduledDate),
          destAddress,
          customerId,
          professionalId,
        },
      });
      
      // Ensuite attacher le service
      await prisma.bookingService.create({
        data: {
          bookingId: booking.id,
          serviceId,
          serviceDate: new Date(serviceDate || scheduledDate),
          address: destAddress,
        },
      });
      
      // Récupérer la réservation complète avec le service
      booking = await prisma.booking.findUnique({
        where: { id: booking.id },
        include: {
          customer: true,
          professional: true,
          services: {
            include: {
              service: true,
            },
          },
        },
      });
    }

    return NextResponse.json(booking, { status: 201 });
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