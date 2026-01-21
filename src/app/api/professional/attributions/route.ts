/**
 * API endpoint pour les attributions d'un professionnel
 * Route: GET /api/professional/attributions
 */

import { NextRequest, NextResponse } from "next/server";
import { AttributionService } from "@/bookingAttribution/AttributionService";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
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

    // TODO: Vérifier l'authentification du professionnel

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
