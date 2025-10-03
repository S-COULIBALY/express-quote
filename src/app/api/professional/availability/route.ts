/**
 * API endpoint pour la gestion de disponibilité des professionnels
 * Route: GET/PUT /api/professional/availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Middleware d'authentification
async function authenticateProfessional(request: NextRequest) {
  const token = request.cookies.get('professional_token')?.value || 
               request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    throw new Error('Non authentifié');
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.SIGNATURE_SECRET || 'default-secret';
  const decoded = jwt.verify(token, jwtSecret) as any;

  if (decoded.type !== 'professional') {
    throw new Error('Type de token invalide');
  }

  return decoded.professionalId;
}

export async function GET(request: NextRequest) {
  try {
    const professionalId = await authenticateProfessional(request);

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        companyName: true,
        isAvailable: true,
        serviceTypes: true,
        maxDistanceKm: true,
        city: true
      }
    });

    if (!professional) {
      return NextResponse.json(
        { success: false, error: 'Professionnel non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      availability: {
        isAvailable: professional.isAvailable,
        serviceTypes: professional.serviceTypes,
        maxDistanceKm: professional.maxDistanceKm,
        location: professional.city
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('authentifié')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    console.error('❌ Erreur lors de la récupération de disponibilité:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const professionalId = await authenticateProfessional(request);
    const { isAvailable, maxDistanceKm, serviceTypes } = await request.json();

    // Validation
    if (typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Statut de disponibilité invalide' },
        { status: 400 }
      );
    }

    const updateData: any = { isAvailable };

    if (maxDistanceKm !== undefined) {
      if (typeof maxDistanceKm !== 'number' || maxDistanceKm < 0 || maxDistanceKm > 500) {
        return NextResponse.json(
          { success: false, error: 'Distance maximale invalide (0-500km)' },
          { status: 400 }
        );
      }
      updateData.maxDistanceKm = maxDistanceKm;
    }

    if (serviceTypes !== undefined) {
      if (!Array.isArray(serviceTypes)) {
        return NextResponse.json(
          { success: false, error: 'Types de service invalides' },
          { status: 400 }
        );
      }
      updateData.serviceTypes = serviceTypes;
    }

    const updatedProfessional = await prisma.professional.update({
      where: { id: professionalId },
      data: updateData,
      select: {
        id: true,
        companyName: true,
        isAvailable: true,
        serviceTypes: true,
        maxDistanceKm: true
      }
    });

    console.log(`🔄 Disponibilité mise à jour pour ${updatedProfessional.companyName}: ${isAvailable ? 'DISPONIBLE' : 'INDISPONIBLE'}`);

    return NextResponse.json({
      success: true,
      message: 'Disponibilité mise à jour',
      availability: {
        isAvailable: updatedProfessional.isAvailable,
        serviceTypes: updatedProfessional.serviceTypes,
        maxDistanceKm: updatedProfessional.maxDistanceKm
      }
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('authentifié')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }

    console.error('❌ Erreur lors de la mise à jour de disponibilité:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}