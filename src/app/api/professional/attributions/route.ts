/**
 * API endpoint pour les attributions d'un professionnel
 * Route: GET /api/professional/attributions
 */

import { NextRequest, NextResponse } from "next/server";
import { AttributionService } from "@/bookingAttribution/AttributionService";
import jwt from "jsonwebtoken";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";

async function authenticateProfessional(request: NextRequest): Promise<string> {
  const token =
    request.cookies.get("professional_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new Error("Non authentifié");
  }

  const jwtSecret = process.env.JWT_SECRET || process.env.SIGNATURE_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET ou SIGNATURE_SECRET manquant");
  }

  const decoded = jwt.verify(token, jwtSecret) as any;
  if (decoded.type !== "professional") {
    throw new Error("Type de token invalide");
  }

  return decoded.professionalId;
}

export async function GET(request: NextRequest) {
  try {
    let authenticatedProfessionalId: string;
    try {
      authenticatedProfessionalId = await authenticateProfessional(request);
    } catch {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get("professionalId");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status"); // 'accepted', 'refused', 'all'

    if (!professionalId) {
      return NextResponse.json(
        { success: false, error: "ID professionnel requis" },
        { status: 400 },
      );
    }

    if (professionalId !== authenticatedProfessionalId) {
      return NextResponse.json(
        { success: false, error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const attributionService = new AttributionService();
    const attributions = await attributionService.getProfessionalAttributions(
      professionalId,
      limit,
    );

    // Filtrer par statut si demandé
    let filteredAttributions = attributions;
    if (status && status !== "all") {
      filteredAttributions = attributions.filter(
        (attr: any) => attr.responseType === status.toUpperCase(),
      );
    }

    // Formater la réponse
    const formattedAttributions = filteredAttributions.map((attr: any) => ({
      id: attr.id,
      attributionId: attr.attributionId,
      responseType: attr.responseType,
      responseTime: attr.responseTime,
      responseMessage: attr.responseMessage,
      distanceKm: attr.distanceKm,
      attribution: {
        id: attr.attribution.id,
        status: attr.attribution.status,
        serviceType: attr.attribution.serviceType,
        max_distance_km: attr.attribution.max_distance_km,
        createdAt: attr.attribution.createdAt,
        booking: {
          id: attr.attribution.booking.id,
          type: attr.attribution.booking.type,
          totalAmount: attr.attribution.booking.totalAmount,
          scheduledDate: attr.attribution.booking.scheduledDate,
          locationAddress: attr.attribution.booking.locationAddress,
          status: attr.attribution.booking.status,
        },
      },
    }));

    // Statistiques du professionnel
    const stats = {
      total: attributions.length,
      accepted: attributions.filter((a: any) => a.responseType === "ACCEPTED")
        .length,
      refused: attributions.filter((a: any) => a.responseType === "REFUSED")
        .length,
      acceptanceRate:
        attributions.length > 0
          ? Math.round(
              (attributions.filter((a: any) => a.responseType === "ACCEPTED")
                .length /
                attributions.length) *
                100,
            )
          : 0,
    };

    return NextResponse.json({
      success: true,
      attributions: formattedAttributions,
      stats,
      pagination: {
        limit,
        count: formattedAttributions.length,
        hasMore: attributions.length === limit,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des attributions:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    );
  }
}
