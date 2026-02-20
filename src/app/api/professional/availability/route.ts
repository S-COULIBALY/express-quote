/**
 * API endpoint pour la gestion de disponibilité des professionnels
 * Route: GET/PUT /api/professional/availability
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// Middleware d'authentification
async function authenticateProfessional(request: NextRequest) {
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
    const professionalId = await authenticateProfessional(request);

    const professional = await prisma.professional.findUnique({
      where: { id: professionalId },
      select: {
        id: true,
        companyName: true,
        is_available: true,
        service_types: true,
        max_distance_km: true,
        city: true,
      },
    });

    if (!professional) {
      return NextResponse.json(
        { success: false, error: "Professionnel non trouvé" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      availability: {
        is_available: professional.is_available,
        service_types: professional.service_types,
        max_distance_km: professional.max_distance_km,
        location: professional.city,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentifié")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 },
      );
    }

    console.error("❌ Erreur lors de la récupération de disponibilité:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const professionalId = await authenticateProfessional(request);
    const { is_available, max_distance_km, service_types } =
      await request.json();

    // Validation
    if (typeof is_available !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Statut de disponibilité invalide" },
        { status: 400 },
      );
    }

    const updateData: any = { is_available };

    if (max_distance_km !== undefined) {
      if (
        typeof max_distance_km !== "number" ||
        max_distance_km < 0 ||
        max_distance_km > 500
      ) {
        return NextResponse.json(
          { success: false, error: "Distance maximale invalide (0-500km)" },
          { status: 400 },
        );
      }
      updateData.max_distance_km = max_distance_km;
    }

    if (service_types !== undefined) {
      if (!Array.isArray(service_types)) {
        return NextResponse.json(
          { success: false, error: "Types de service invalides" },
          { status: 400 },
        );
      }
      updateData.service_types = service_types;
    }

    const updatedProfessional = await prisma.professional.update({
      where: { id: professionalId },
      data: updateData,
      select: {
        id: true,
        companyName: true,
        is_available: true,
        service_types: true,
        max_distance_km: true,
      },
    });

    console.log(
      `🔄 Disponibilité mise à jour pour ${updatedProfessional.companyName}: ${is_available ? "DISPONIBLE" : "INDISPONIBLE"}`,
    );

    return NextResponse.json({
      success: true,
      message: "Disponibilité mise à jour",
      availability: {
        is_available: updatedProfessional.is_available,
        service_types: updatedProfessional.service_types,
        max_distance_km: updatedProfessional.max_distance_km,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("authentifié")) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 },
      );
    }

    console.error("❌ Erreur lors de la mise à jour de disponibilité:", error);
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
