/**
 * API endpoint pour l'annulation d'une attribution par un professionnel qui l'avait acceptée
 * Route: POST /api/attribution/[id]/cancel
 */

import { NextRequest, NextResponse } from "next/server";
import { AttributionService } from "@/bookingAttribution/AttributionService";
import jwt from "jsonwebtoken";

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const attributionId = params.id;

  let authenticatedProfessionalId: string;
  try {
    authenticatedProfessionalId = await authenticateProfessional(request);
  } catch {
    return NextResponse.json(
      { success: false, error: "Non authentifié" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { professionalId, reason, confirmCancel } = body;

    // Validation des paramètres
    if (!professionalId) {
      return NextResponse.json(
        { success: false, error: "ID professionnel manquant" },
        { status: 400 },
      );
    }

    if (professionalId !== authenticatedProfessionalId) {
      return NextResponse.json(
        { success: false, error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    if (!confirmCancel) {
      return NextResponse.json(
        { success: false, error: "Confirmation d'annulation requise" },
        { status: 400 },
      );
    }

    // Traiter l'annulation
    const attributionService = new AttributionService();
    const result = await attributionService.handleProfessionalCancellation(
      attributionId,
      professionalId,
      reason,
    );

    if (result.success) {
      console.log(
        `🚫 Attribution ${attributionId} annulée par professionnel ${professionalId}`,
      );

      return NextResponse.json({
        success: true,
        message: result.message,
        attributionId,
        warning:
          "Cette annulation a été enregistrée et peut affecter votre réputation.",
        nextSteps: [
          "La mission a été remise en diffusion",
          "Vous ne recevrez plus de notifications pour cette mission",
          "Cette annulation est comptabilisée dans vos statistiques",
        ],
      });
    } else {
      console.log(
        `❌ Échec annulation attribution ${attributionId}: ${result.message}`,
      );

      return NextResponse.json(
        { success: false, error: result.message },
        { status: 409 }, // Conflict
      );
    }
  } catch (error) {
    console.error(
      `❌ Erreur lors de l'annulation attribution ${attributionId}:`,
      error,
    );

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
