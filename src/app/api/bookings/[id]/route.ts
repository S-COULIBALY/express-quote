import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/bookings/[id] - Récupérer une réservation spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const booking = await prisma.booking.findUnique({
      where: { id },
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

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/bookings/[id] - Mettre à jour une réservation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    const { 
      status, 
      scheduledDate, 
      originAddress, 
      destAddress, 
      customerId, 
      professionalId 
    } = data;

    // Vérifier que la réservation existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Mettre à jour la réservation
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(scheduledDate !== undefined && { scheduledDate: new Date(scheduledDate) }),
        ...(originAddress !== undefined && { originAddress }),
        ...(destAddress !== undefined && { destAddress }),
        ...(customerId !== undefined && { customerId }),
        ...(professionalId !== undefined && { professionalId }),
      },
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

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/bookings/[id] - Annuler ou supprimer une réservation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Vérifier que la réservation existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        services: true,
      },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (force) {
      // Supprimer d'abord les services associés à la réservation
      if (existingBooking.services.length > 0) {
        await prisma.bookingService.deleteMany({
          where: { bookingId: id },
        });
      }

      // Supprimer la réservation
      await prisma.booking.delete({
        where: { id },
      });

      return NextResponse.json({
        message: 'Booking deleted successfully',
      });
    } else {
      // Annuler la réservation au lieu de la supprimer
      const canceledBooking = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELED' },
      });

      return NextResponse.json({
        message: 'Booking canceled successfully',
        booking: canceledBooking,
      });
    }
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH /api/bookings/[id] - Ajouter ou supprimer un service d'une réservation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    const { action, serviceId, serviceDate, address } = data;

    // Vérifier que la réservation existe
    const existingBooking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (action === 'addService') {
      // Vérifier que le service existe
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }

      // Vérifier si le service est déjà attaché à la réservation
      const existingBookingService = await prisma.bookingService.findFirst({
        where: {
          bookingId: id,
          serviceId,
        },
      });

      if (existingBookingService) {
        return NextResponse.json(
          { error: 'Service already added to this booking' },
          { status: 400 }
        );
      }

      // Ajouter le service à la réservation
      await prisma.bookingService.create({
        data: {
          bookingId: id,
          serviceId,
          serviceDate: serviceDate ? new Date(serviceDate) : existingBooking.scheduledDate,
          address: address || existingBooking.destAddress,
        },
      });

      // Récupérer la réservation mise à jour
      const updatedBooking = await prisma.booking.findUnique({
        where: { id },
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

      return NextResponse.json({
        message: 'Service added to booking successfully',
        booking: updatedBooking,
      });
    } else if (action === 'removeService') {
      // Vérifier que le service est attaché à la réservation
      const bookingService = await prisma.bookingService.findFirst({
        where: {
          bookingId: id,
          serviceId,
        },
      });

      if (!bookingService) {
        return NextResponse.json(
          { error: 'Service not found in this booking' },
          { status: 404 }
        );
      }

      // Supprimer le service de la réservation
      await prisma.bookingService.delete({
        where: { id: bookingService.id },
      });

      // Récupérer la réservation mise à jour
      const updatedBooking = await prisma.booking.findUnique({
        where: { id },
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

      return NextResponse.json({
        message: 'Service removed from booking successfully',
        booking: updatedBooking,
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "addService" or "removeService"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating booking services:', error);
    return NextResponse.json(
      { error: 'Failed to update booking services' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 