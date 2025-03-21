import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/packs - Récupérer tous les packs actifs
export async function GET(request: NextRequest) {
  try {
    const packs = await prisma.pack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json(packs);
  } catch (error) {
    console.error('Error fetching packs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/packs - Créer un nouveau pack
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, price, truckSize, moversCount, driverIncluded } = data;

    // Validation des données
    if (!name || !description || !price) {
      return NextResponse.json(
        { error: 'Name, description and price are required' },
        { status: 400 }
      );
    }

    const pack = await prisma.pack.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        truckSize: truckSize ? parseInt(truckSize) : null,
        moversCount: moversCount ? parseInt(moversCount) : null,
        driverIncluded: Boolean(driverIncluded),
        active: true,
      },
    });

    return NextResponse.json(pack, { status: 201 });
  } catch (error) {
    console.error('Error creating pack:', error);
    return NextResponse.json(
      { error: 'Failed to create pack' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 