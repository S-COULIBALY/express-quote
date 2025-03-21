import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/customers - Récupérer tous les clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    const where = email ? { email } : {};
    
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/customers - Créer ou récupérer un client
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email, firstName, lastName, phone } = data;

    // Validation des données
    if (!email || !firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'Email, firstName, lastName, and phone are required' },
        { status: 400 }
      );
    }

    // Vérifier si le client existe déjà
    let customer = await prisma.customer.findUnique({
      where: { email }
    });

    // Si le client n'existe pas, le créer
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          email,
          firstName,
          lastName,
          phone
        }
      });
    } else {
      // Mise à jour optionnelle si le client existe déjà
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          firstName,
          lastName,
          phone
        }
      });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create/update customer' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 