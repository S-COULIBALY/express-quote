/**
 * API endpoint pour le dashboard des professionnels externes
 * Route: GET /api/professional/dashboard
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

    // Vérifier que c'est un professionnel externe
    if (!ProfessionalAuthService.isExternalProfessional(user)) {
      return ProfessionalAuthService.unauthorizedResponse('Accès réservé aux professionnels externes');
    }

    // Récupérer les données du dashboard
    const dashboardData = await getDashboardDataForProfessional(user.id);

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Erreur dashboard professionnel:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

async function getDashboardDataForProfessional(professionalId: string) {
  // Récupérer les informations du professionnel
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      companyName: true,
      email: true,
      city: true,
      businessType: true,
      isAvailable: true,
      serviceTypes: true,
      maxDistanceKm: true,
      totalAttributions: true,
      acceptedAttributions: true,
      cancelledAttributions: true
    }
  });

  if (!professional) {
    throw new Error('Professionnel non trouvé');
  }

  // 1. Missions disponibles (attributions en cours de diffusion)
  const availableMissions = await prisma.bookingAttribution.findMany({
    where: {
      status: { in: ['BROADCASTING', 'RE_BROADCASTING'] },
      serviceType: { in: professional.serviceTypes as string[] },
      // Correction: Syntaxe PostgreSQL pour JSON array
      NOT: {
        excludedProfessionals: {
          path: ['$'],
          array_contains: professionalId
        }
      }
    },
    include: {
      booking: {
        include: {
          customer: true
        }
      },
      responses: {
        where: { professionalId },
        select: { responseType: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  // Filtrer celles où le professionnel n'a pas encore répondu
  const filteredAvailableMissions = availableMissions.filter(attr => 
    attr.responses.length === 0 && professional.isAvailable
  );

  // 2. Missions du professionnel (acceptées)
  const myMissions = await prisma.bookingAttribution.findMany({
    where: {
      acceptedProfessionalId: professionalId,
      status: 'ACCEPTED'
    },
    include: {
      booking: {
        include: {
          customer: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 10
  });

  // 3. Historique des réponses
  const missionHistory = await prisma.attributionResponse.findMany({
    where: { professionalId },
    include: {
      attribution: {
        include: {
          booking: true
        }
      }
    },
    orderBy: { responseTime: 'desc' },
    take: 20
  });

  // 4. Statistiques
  const stats = await calculateProfessionalStats(professionalId, professional);

  return {
    user: professional,
    availableMissions: filteredAvailableMissions.map(formatAvailableMission),
    myMissions: myMissions.map(formatMyMission),
    missionHistory: missionHistory.map(formatMissionHistory),
    stats
  };
}

function formatAvailableMission(attribution: any) {
  const booking = attribution.booking;
  const customer = booking.customer;
  
  // Calculer le temps écoulé depuis la diffusion
  const diffusedAt = new Date(attribution.lastBroadcastAt);
  const now = new Date();
  const minutesAgo = Math.floor((now.getTime() - diffusedAt.getTime()) / (1000 * 60));
  
  let timeAgo = '';
  if (minutesAgo < 60) {
    timeAgo = `${minutesAgo} min`;
  } else if (minutesAgo < 1440) {
    timeAgo = `${Math.floor(minutesAgo / 60)}h`;
  } else {
    timeAgo = `${Math.floor(minutesAgo / 1440)}j`;
  }

  return {
    attributionId: attribution.id,
    serviceType: getServiceTypeLabel(attribution.serviceType),
    amount: booking.totalAmount,
    location: extractLocationSummary(booking.locationAddress || booking.pickupAddress),
    scheduledDate: booking.scheduledDate ? 
      new Date(booking.scheduledDate).toLocaleDateString('fr-FR') : 
      'À planifier',
    distanceKm: attribution.maxDistanceKm || 100,
    timeAgo,
    priority: attribution.status === 'RE_BROADCASTING' ? 'high' : 'normal',
    // Informations client masquées jusqu'à acceptation
    customerInitials: `${customer.firstName.charAt(0)}.${customer.lastName.charAt(0)}.`,
    broadcastCount: attribution.broadcastCount
  };
}

function formatMyMission(attribution: any) {
  const booking = attribution.booking;
  const customer = booking.customer;
  
  return {
    id: booking.id,
    attributionId: attribution.id,
    reference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
    serviceType: getServiceTypeLabel(attribution.serviceType),
    amount: booking.totalAmount,
    location: booking.locationAddress || booking.pickupAddress || 'Adresse à préciser',
    scheduledDate: booking.scheduledDate ? 
      new Date(booking.scheduledDate).toLocaleDateString('fr-FR') : 
      'À planifier',
    // Informations client complètes après acceptation
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    status: attribution.status,
    acceptedAt: new Date(attribution.updatedAt).toLocaleDateString('fr-FR'),
    canCancel: true // Pour l'instant, toujours possible
  };
}

function formatMissionHistory(response: any) {
  const attribution = response.attribution;
  const booking = attribution.booking;
  
  return {
    id: response.id,
    bookingId: booking.id,
    reference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
    serviceType: getServiceTypeLabel(attribution.serviceType),
    amount: booking.totalAmount,
    location: extractLocationSummary(booking.locationAddress || booking.pickupAddress),
    date: new Date(response.responseTime).toLocaleDateString('fr-FR'),
    responseType: response.responseType,
    status: response.responseType === 'ACCEPTED' ? 'ACCEPTED' : 'REFUSED',
    responseMessage: response.responseMessage
  };
}

async function calculateProfessionalStats(professionalId: string, professional: any) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Revenus du mois (missions acceptées via attributions)
  const monthlyAttributions = await prisma.bookingAttribution.findMany({
    where: {
      acceptedProfessionalId: professionalId,
      status: { in: ['ACCEPTED', 'COMPLETED'] },
      updatedAt: { gte: startOfMonth }
    },
    include: {
      booking: {
        select: { totalAmount: true, status: true }
      }
    }
  });

  const monthlyEarnings = monthlyAttributions
    .filter(attr => attr.booking.status === 'COMPLETED')
    .reduce((sum, attr) => sum + attr.booking.totalAmount, 0);

  // Taux d'acceptation
  const acceptanceRate = professional.totalAttributions > 0 ?
    Math.round((professional.acceptedAttributions / professional.totalAttributions) * 100) : 0;

  // Taux d'annulation
  const cancellationRate = professional.acceptedAttributions > 0 ?
    Math.round((professional.cancelledAttributions / professional.acceptedAttributions) * 100) : 0;

  return {
    monthlyEarnings,
    acceptanceRate,
    cancellationRate,
    totalMissions: professional.totalAttributions,
    completedMissions: monthlyAttributions.filter(attr => attr.booking.status === 'COMPLETED').length,
    reliability: Math.max(0, 100 - cancellationRate) // Score de fiabilité
  };
}

function getServiceTypeLabel(serviceType: string): string {
  const labels: Record<string, string> = {
    'MOVING': 'Déménagement',
    'CLEANING': 'Ménage',
    'DELIVERY': 'Livraison',
    'TRANSPORT': 'Transport',
    'PACKING': 'Emballage',
    'SERVICE': 'Service'
  };
  return labels[serviceType] || serviceType;
}

function extractLocationSummary(address: string): string {
  if (!address) return 'Lieu non spécifié';
  
  // Extraire la ville (dernier élément après virgule)
  const parts = address.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  
  // Sinon, tronquer l'adresse
  return address.length > 30 ? address.substring(0, 30) + '...' : address;
}