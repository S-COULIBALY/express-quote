/**
 * API endpoint pour récupérer les informations du professionnel connecté
 * Route: GET /api/professional/auth/me
 */

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

// Force le rendu dynamique (évite erreur de build Vercel)
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Récupérer le token depuis le cookie ou header
    const token =
      request.cookies.get("professional_token")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 },
      );
    }

    // Vérifier le token JWT
    const jwtSecret = process.env.JWT_SECRET || process.env.SIGNATURE_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        { success: false, error: "Configuration serveur invalide" },
        { status: 500 },
      );
    }
    let decoded: any;

    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (jwtError) {
      return NextResponse.json(
        { success: false, error: "Token invalide" },
        { status: 401 },
      );
    }

    // Vérifier que le token est pour un professionnel (externe ou interne)
    if (
      !decoded.type ||
      !["external_professional", "internal_staff"].includes(decoded.type)
    ) {
      return NextResponse.json(
        { success: false, error: "Type de token invalide" },
        { status: 401 },
      );
    }

    // Récupérer les informations selon le type d'utilisateur
    let userData: any = null;

    if (decoded.type === "external_professional") {
      userData = await prisma.professional.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          companyName: true,
          email: true,
          verified: true,
          is_available: true,
          city: true,
          address: true,
          postalCode: true,
          businessType: true,
          phone: true,
          website: true,
          description: true,
          service_types: true,
          max_distance_km: true,
          latitude: true,
          longitude: true,
          last_login_at: true,
          total_attributions: true,
          accepted_attributions: true,
          cancelled_attributions: true,
          createdAt: true,
        },
      });
    } else if (decoded.type === "internal_staff") {
      userData = await prisma.internal_staff.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          department: true,
          service_types: true,
          is_active: true,
          phone: true,
          last_login_at: true,
          created_at: true,
        },
      });
    }

    if (!userData) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Vérifications spécifiques selon le type
    if (decoded.type === "external_professional") {
      if (!userData.verified) {
        return NextResponse.json(
          { success: false, error: "Compte non vérifié" },
          { status: 403 },
        );
      }

      // Calculer les statistiques pour les professionnels externes
      const acceptanceRate =
        userData.total_attributions > 0
          ? Math.round(
              (userData.accepted_attributions / userData.total_attributions) *
                100,
            )
          : 0;

      const cancellationRate =
        userData.accepted_attributions > 0
          ? Math.round(
              (userData.cancelled_attributions /
                userData.accepted_attributions) *
                100,
            )
          : 0;

      return NextResponse.json({
        success: true,
        user: {
          ...userData,
          type: "external_professional",
          name: userData.companyName,
          stats: {
            acceptanceRate,
            cancellationRate,
            reliability: Math.max(0, 100 - cancellationRate),
          },
        },
      });
    } else {
      // Staff interne
      if (!userData.isActive) {
        return NextResponse.json(
          { success: false, error: "Compte désactivé" },
          { status: 403 },
        );
      }

      return NextResponse.json({
        success: true,
        user: {
          ...userData,
          type: "internal_staff",
          name: `${userData.firstName} ${userData.lastName}`,
        },
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du professionnel:", error);

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
