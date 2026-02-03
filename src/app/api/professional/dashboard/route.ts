/**
 * API endpoint pour le dashboard des professionnels externes
 * Route: GET /api/professional/dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { ProfessionalAuthService } from "@/lib/auth/ProfessionalAuthService";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Authentification
    const authResult =
      await ProfessionalAuthService.authenticateFromRequest(request);

    if (!authResult.success || !authResult.user) {
      return ProfessionalAuthService.unauthenticatedResponse();
    }

    const user = authResult.user;

    // Vérifier que c'est un professionnel externe
    if (!ProfessionalAuthService.isExternalProfessional(user)) {
      return ProfessionalAuthService.unauthorizedResponse(
        "Accès réservé aux professionnels externes",
      );
    }

    // Récupérer les données du dashboard
    const dashboardData = await getDashboardDataForProfessional(user.id);

    return NextResponse.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("❌ Erreur dashboard professionnel:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

async function getDashboardDataForProfessional(professional_id: string) {
  // Récupérer les informations du professionnel
  const professional = await prisma.professional.findUnique({
    where: { id: professional_id },
    select: {
      id: true,
      companyName: true,
      email: true,
      city: true,
      businessType: true,
      is_available: true,
      service_types: true,
      max_distance_km: true,
      total_attributions: true,
      accepted_attributions: true,
      cancelled_attributions: true,
    },
  });

  if (!professional) {
    throw new Error("Professionnel non trouvé");
  }

  // 1. Missions disponibles (attributions en cours de diffusion)
  const availableMissions = await prisma.booking_attributions.findMany({
    where: {
      status: { in: ["BROADCASTING", "RE_BROADCASTING"] },
      service_type: { in: professional.service_types as any },
    },
    include: {
      Booking: {
        include: {
          Customer: true,
        },
      },
      attribution_responses: {
        where: { professional_id },
        select: { response_type: true },
      },
    },
    orderBy: { created_at: "desc" },
    take: 10,
  });

  // Filtrer celles où le professionnel n'a pas encore répondu
  const filteredAvailableMissions = availableMissions.filter(
    (attr: any) =>
      attr.attribution_responses.length === 0 && professional.is_available,
  );

  // 2. Missions du professionnel (acceptées)
  const myMissions = await prisma.booking_attributions.findMany({
    where: {
      accepted_professional_id: professional_id,
      status: "ACCEPTED",
    },
    include: {
      Booking: {
        include: {
          Customer: true,
        },
      },
    },
    orderBy: { updated_at: "desc" },
    take: 10,
  });

  // 3. Historique des réponses
  const missionHistory = await prisma.attribution_responses.findMany({
    where: { professional_id },
    include: {
      booking_attributions: {
        include: {
          Booking: true,
        },
      },
    },
    orderBy: { response_time: "desc" },
    take: 20,
  });

  // 4. Statistiques
  const stats = await calculateProfessionalStats(professional_id, professional);

  return {
    user: professional,
    availableMissions: filteredAvailableMissions.map(formatAvailableMission),
    myMissions: myMissions.map(formatMyMission),
    missionHistory: missionHistory.map(formatMissionHistory),
    stats,
  };
}

function formatAvailableMission(attribution: any) {
  const booking = attribution.booking;
  const customer = booking.customer;

  // Calculer le temps écoulé depuis la diffusion
  const diffusedAt = new Date(attribution.last_broadcast_at);
  const now = new Date();
  const minutesAgo = Math.floor(
    (now.getTime() - diffusedAt.getTime()) / (1000 * 60),
  );

  let timeAgo = "";
  if (minutesAgo < 60) {
    timeAgo = `${minutesAgo} min`;
  } else if (minutesAgo < 1440) {
    timeAgo = `${Math.floor(minutesAgo / 60)}h`;
  } else {
    timeAgo = `${Math.floor(minutesAgo / 1440)}j`;
  }

  return {
    attributionId: attribution.id,
    service_type: getServiceTypeLabel(attribution.service_type),
    amount: booking.totalAmount,
    location: extractLocationSummary(
      booking.locationAddress || booking.pickupAddress,
    ),
    scheduledDate: booking.scheduledDate
      ? new Date(booking.scheduledDate).toLocaleDateString("fr-FR")
      : "À planifier",
    distanceKm: attribution.max_distance_km || 100,
    timeAgo,
    priority: attribution.status === "RE_BROADCASTING" ? "high" : "normal",
    // Informations client masquées jusqu'à acceptation
    customerInitials: `${customer.firstName.charAt(0)}.${customer.lastName.charAt(0)}.`,
    broadcast_count: attribution.broadcast_count,
  };
}

function formatMyMission(attribution: any) {
  const booking = attribution.booking;
  const customer = booking.customer;

  return {
    id: booking.id,
    attributionId: attribution.id,
    reference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
    service_type: getServiceTypeLabel(attribution.service_type),
    amount: booking.totalAmount,
    location:
      booking.locationAddress || booking.pickupAddress || "Adresse à préciser",
    scheduledDate: booking.scheduledDate
      ? new Date(booking.scheduledDate).toLocaleDateString("fr-FR")
      : "À planifier",
    // Informations client complètes après acceptation
    customerName: `${customer.firstName} ${customer.lastName}`,
    customerPhone: customer.phone,
    customerEmail: customer.email,
    status: attribution.status,
    acceptedAt: new Date(attribution.updated_at).toLocaleDateString("fr-FR"),
    canCancel: true, // Pour l'instant, toujours possible
  };
}

function formatMissionHistory(response: any) {
  const attribution = response.attribution;
  const booking = attribution.booking;

  return {
    id: response.id,
    bookingId: booking.id,
    reference: `EQ-${booking.id.slice(-8).toUpperCase()}`,
    service_type: getServiceTypeLabel(attribution.service_type),
    amount: booking.totalAmount,
    location: extractLocationSummary(
      booking.locationAddress || booking.pickupAddress,
    ),
    date: new Date(response.response_time).toLocaleDateString("fr-FR"),
    response_type: response.response_type,
    status: response.response_type === "ACCEPTED" ? "ACCEPTED" : "REFUSED",
    response_message: response.response_message,
  };
}

async function calculateProfessionalStats(
  professional_id: string,
  professional: any,
) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Revenus du mois (missions acceptées via attributions)
  const monthlyAttributions = await prisma.booking_attributions.findMany({
    where: {
      accepted_professional_id: professional_id,
      status: { in: ["ACCEPTED", "COMPLETED"] },
      updated_at: { gte: startOfMonth },
    },
    include: {
      Booking: {
        select: { totalAmount: true, status: true },
      },
    },
  });

  const monthlyEarnings = monthlyAttributions
    .filter((attr: any) => attr.Booking.status === "COMPLETED")
    .reduce((sum: number, attr: any) => sum + attr.Booking.totalAmount, 0);

  // Taux d'acceptation
  const acceptanceRate =
    professional.total_attributions > 0
      ? Math.round(
          (professional.accepted_attributions /
            professional.total_attributions) *
            100,
        )
      : 0;

  // Taux d'annulation
  const cancellationRate =
    professional.accepted_attributions > 0
      ? Math.round(
          (professional.cancelled_attributions /
            professional.accepted_attributions) *
            100,
        )
      : 0;

  return {
    monthlyEarnings,
    acceptanceRate,
    cancellationRate,
    totalMissions: professional.total_attributions,
    completedMissions: monthlyAttributions.filter(
      (attr: any) => attr.Booking.status === "COMPLETED",
    ).length,
    reliability: Math.max(0, 100 - cancellationRate), // Score de fiabilité
  };
}

function getServiceTypeLabel(service_type: string): string {
  const labels: Record<string, string> = {
    MOVING: "Déménagement",
    MOVING_PREMIUM: "Déménagement sur mesure",
  };
  return labels[service_type] || "Déménagement";
}

function extractLocationSummary(address: string): string {
  if (!address) return "Lieu non spécifié";

  // Extraire la ville (dernier élément après virgule)
  const parts = address.split(",");
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }

  // Sinon, tronquer l'adresse
  return address.length > 30 ? address.substring(0, 30) + "..." : address;
}
