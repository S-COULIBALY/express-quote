import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/services/[id] - Récupérer un service spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        bookingServices: {
          select: {
            booking: {
              select: {
                id: true,
                scheduledDate: true,
                status: true,
                customerId: true,
                customer: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            serviceDate: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/services/[id] - Mettre à jour un service
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    const { name, description, price, serviceType, durationDays, peopleCount, active } = data;

    // Vérifier que le service existe
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Mettre à jour le service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(serviceType !== undefined && { serviceType }),
        ...(durationDays !== undefined && { durationDays: durationDays ? parseInt(durationDays) : null }),
        ...(peopleCount !== undefined && { peopleCount: peopleCount ? parseInt(peopleCount) : null }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/services/[id] - Supprimer ou désactiver un service
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Vérifier si des réservations utilisent ce service
    const bookingsWithService = await prisma.bookingService.count({
      where: { serviceId: id },
    });

    if (bookingsWithService > 0) {
      // Si des réservations utilisent ce service, on le désactive au lieu de le supprimer
      const deactivatedService = await prisma.service.update({
        where: { id },
        data: { active: false },
      });
      
      return NextResponse.json({
        message: `Service désactivé car utilisé par ${bookingsWithService} réservation(s)`,
        service: deactivatedService,
      });
    } else {
      // Si aucune réservation n'utilise ce service, on peut le supprimer
      await prisma.service.delete({
        where: { id },
      });
      
      return NextResponse.json({
        message: 'Service supprimé avec succès',
      });
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 