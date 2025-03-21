import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/packs/[id] - Récupérer un pack spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const pack = await prisma.pack.findUnique({
      where: { id },
      include: {
        bookings: {
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
      },
    });

    if (!pack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pack);
  } catch (error) {
    console.error('Error fetching pack:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pack' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/packs/[id] - Mettre à jour un pack
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const data = await request.json();
    const { name, description, price, truckSize, moversCount, driverIncluded, active } = data;

    // Vérifier que le pack existe
    const existingPack = await prisma.pack.findUnique({
      where: { id },
    });

    if (!existingPack) {
      return NextResponse.json(
        { error: 'Pack not found' },
        { status: 404 }
      );
    }

    // Mettre à jour le pack
    const updatedPack = await prisma.pack.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(truckSize !== undefined && { truckSize: truckSize ? parseInt(truckSize) : null }),
        ...(moversCount !== undefined && { moversCount: moversCount ? parseInt(moversCount) : null }),
        ...(driverIncluded !== undefined && { driverIncluded: Boolean(driverIncluded) }),
        ...(active !== undefined && { active: Boolean(active) }),
      },
    });

    return NextResponse.json(updatedPack);
  } catch (error) {
    console.error('Error updating pack:', error);
    return NextResponse.json(
      { error: 'Failed to update pack' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/packs/[id] - Supprimer ou désactiver un pack
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Vérifier si des réservations utilisent ce pack
    const bookingsWithPack = await prisma.booking.count({
      where: { packId: id },
    });

    if (bookingsWithPack > 0) {
      // Si des réservations utilisent ce pack, on le désactive au lieu de le supprimer
      const deactivatedPack = await prisma.pack.update({
        where: { id },
        data: { active: false },
      });
      
      return NextResponse.json({
        message: `Pack désactivé car utilisé par ${bookingsWithPack} réservation(s)`,
        pack: deactivatedPack,
      });
    } else {
      // Si aucune réservation n'utilise ce pack, on peut le supprimer
      await prisma.pack.delete({
        where: { id },
      });
      
      return NextResponse.json({
        message: 'Pack supprimé avec succès',
      });
    }
  } catch (error) {
    console.error('Error deleting pack:', error);
    return NextResponse.json(
      { error: 'Failed to delete pack' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 