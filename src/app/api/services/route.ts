import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/services - Récupérer tous les services actifs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const where = {
      active: true,
      ...(type ? { serviceType: type } : {}),
    };

    const services = await prisma.service.findMany({
      where,
      orderBy: { price: 'asc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/services - Créer un nouveau service
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { name, description, price, serviceType, durationDays, peopleCount } = data;

    // Validation des données
    if (!name || !description || !price || !serviceType) {
      return NextResponse.json(
        { error: 'Name, description, price and serviceType are required' },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        serviceType,
        durationDays: durationDays ? parseInt(durationDays) : null,
        peopleCount: peopleCount ? parseInt(peopleCount) : null,
        active: true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 