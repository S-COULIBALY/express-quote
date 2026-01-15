/**
 * API endpoint pour le dashboard du staff interne
 * Route: GET /api/internal/dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ProfessionalAuthService } from '@/lib/auth/ProfessionalAuthService';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const authResult = await ProfessionalAuthService.authenticateFromRequest(request);

    if (!authResult.success || !authResult.user) {
      return ProfessionalAuthService.unauthenticatedResponse();
    }

    const user = authResult.user;

    // Vérifier que c'est du staff interne
    if (!ProfessionalAuthService.isInternalStaff(user)) {
      return ProfessionalAuthService.unauthorizedResponse('Accès réservé au staff interne');
    }

    // Récupérer les données du dashboard selon les permissions
    const dashboardData = await getDashboardData(user);

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Erreur dashboard interne:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

async function getDashboardData(user: any) {
  const isAdmin = ProfessionalAuthService.isAdmin(user);
  const userServices = user.service_types || [];

  // Filtrer les réservations selon les permissions
  const bookingWhereClause = isAdmin ? {} : {
    OR: userServices.map((serviceType: string) => ({
      type: mapServiceTypeToBookingType(serviceType)
    }))
  };

  // Missions en attente d'attribution (après paiement)
  const pendingMissions = await prisma.booking.findMany({
    where: {
      ...bookingWhereClause,
      status: 'PAYMENT_COMPLETED',
      professionalId: null // Pas encore assigné
    },
    include: {
      Customer: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Missions assignées aux professionnels
  const assignedMissions = await prisma.booking.findMany({
    where: {
      ...bookingWhereClause,
      status: 'PAYMENT_COMPLETED',
      professionalId: { not: null }
    },
    include: {
      Customer: true,
      Professional: true
    },
    orderBy: { updatedAt: 'desc' },
    take: 10
  });

  // Documents récents
  const recentDocuments = await prisma.document.findMany({
    where: isAdmin ? {} : {
      Booking: {
        ...bookingWhereClause
      }
    },
    include: {
      Booking: {
        select: {
          id: true,
          type: true,
          Customer: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 6
  });

  // Statistiques
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const stats = await calculateStats(bookingWhereClause, startOfMonth, isAdmin);

  // Formater les données pour le frontend
  return {
    user: {
      id: user.id,
      firstName: user.name ? user.name.split(' ')[0] : 'Prénom',
      lastName: user.name ? user.name.split(' ').slice(1).join(' ') : 'Nom',
      email: user.email,
      role: user.role,
      department: user.department,
      service_types: user.service_types || []
    },
    pendingMissions: pendingMissions.map(formatMissionForDashboard),
    assignedMissions: assignedMissions.map(formatAssignedMissionForDashboard),
    recentDocuments: recentDocuments.map(formatDocumentForDashboard),
    stats
  };
}

function formatMissionForDashboard(booking: any) {
  return {
    id: booking.id,
    reference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
    serviceType: getServiceTypeLabel(booking.type),
    amount: booking.totalAmount,
    location: booking.locationAddress || booking.pickupAddress || 'Adresse non spécifiée',
    date: booking.scheduledDate
      ? new Date(booking.scheduledDate).toLocaleDateString('fr-FR')
      : 'À planifier',
    customerName: `${booking.Customer?.firstName || ''} ${booking.Customer?.lastName || ''}`,
    status: 'EN_ATTENTE',
    createdAt: booking.createdAt
  };
}

function formatAssignedMissionForDashboard(booking: any) {
  return {
    id: booking.id,
    reference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
    serviceType: getServiceTypeLabel(booking.type),
    amount: booking.totalAmount,
    location: booking.locationAddress || booking.pickupAddress || 'Adresse non spécifiée',
    date: booking.scheduledDate
      ? new Date(booking.scheduledDate).toLocaleDateString('fr-FR')
      : 'À planifier',
    customerName: `${booking.Customer?.firstName || ''} ${booking.Customer?.lastName || ''}`,
    professionalName: booking.Professional?.companyName || 'Professionnel non assigné',
    status: 'ASSIGNEE',
    acceptedAt: null
  };
}

function formatDocumentForDashboard(document: any) {
  return {
    id: document.id,
    type: getDocumentTypeLabel(document.type),
    filename: document.filename,
    createdAt: new Date(document.createdAt).toLocaleDateString('fr-FR'),
    bookingReference: `EQ-${document.Booking?.id?.slice(-8)?.toUpperCase() || 'N/A'}`,
    customerName: `${document.Booking?.Customer?.firstName || ''} ${document.Booking?.Customer?.lastName || ''}`
  };
}

async function calculateStats(whereClause: any, startOfMonth: Date, isAdmin: boolean) {
  const [
    pendingCount,
    assignedCount,
    completedThisMonth,
    totalThisMonth,
    documentsCount
  ] = await Promise.all([
    // Missions en attente
    prisma.booking.count({
      where: {
        ...whereClause,
        status: 'PAYMENT_COMPLETED',
        professionalId: null
      }
    }),

    // Missions assignées
    prisma.booking.count({
      where: {
        ...whereClause,
        status: 'PAYMENT_COMPLETED',
        professionalId: { not: null }
      }
    }),

    // Missions complétées ce mois
    prisma.booking.count({
      where: {
        ...whereClause,
        status: 'COMPLETED',
        updatedAt: { gte: startOfMonth }
      }
    }),

    // Total missions ce mois
    prisma.booking.count({
      where: {
        ...whereClause,
        createdAt: { gte: startOfMonth }
      }
    }),

    // Documents générés ce mois
    prisma.document.count({
      where: {
        createdAt: { gte: startOfMonth },
        ...(isAdmin ? {} : { Booking: whereClause })
      }
    })
  ]);

  const successRate = totalThisMonth > 0
    ? Math.round((completedThisMonth / totalThisMonth) * 100)
    : 0;

  return {
    pendingCount,
    assignedCount,
    completedThisMonth,
    totalThisMonth,
    documentsCount,
    successRate
  };
}

function mapServiceTypeToBookingType(serviceType: string): string {
  const mapping: Record<string, string> = {
    MOVING: 'MOVING_QUOTE',
    PACKING: 'PACKING',
    CLEANING: 'SERVICE',
    DELIVERY: 'SERVICE',
    SERVICE: 'SERVICE'
  };
  return mapping[serviceType] || 'SERVICE';
}

function getServiceTypeLabel(bookingType: string): string {
  const labels: Record<string, string> = {
    MOVING_QUOTE: 'Déménagement',
    PACKING: 'Emballage',
    SERVICE: 'Service'
  };
  return labels[bookingType] || bookingType;
}

function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    BOOKING_CONFIRMATION: 'Confirmation',
    INVOICE: 'Facture',
    CONTRACT: 'Contrat',
    OTHER: 'Autre'
  };
  return labels[documentType] || documentType;
}
