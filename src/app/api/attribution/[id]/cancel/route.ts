/**
 * API endpoint pour l'annulation d'une attribution par un professionnel qui l'avait acceptée
 * Route: POST /api/attribution/[id]/cancel
 */

import { NextRequest, NextResponse } from 'next/server';
import { AttributionService } from '@/bookingAttribution/AttributionService';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const attributionId = params.id;
  
  try {
    const body = await request.json();
    const { professionalId, reason, confirmCancel } = body;

    // Validation des paramètres
    if (!professionalId) {
      return NextResponse.json(
        { success: false, error: 'ID professionnel manquant' },
        { status: 400 }
      );
    }

    if (!confirmCancel) {
      return NextResponse.json(
        { success: false, error: 'Confirmation d\'annulation requise' },
        { status: 400 }
      );
    }

    // TODO: Ajouter authentification professionnel
    // Vérifier que le professionnel est bien connecté et autorisé

    // Traiter l'annulation
    const attributionService = new AttributionService();
    const result = await attributionService.handleProfessionalCancellation(
      attributionId,
      professionalId,
      reason
    );

    if (result.success) {
      console.log(`🚫 Attribution ${attributionId} annulée par professionnel ${professionalId}`);

      return NextResponse.json({
        success: true,
        message: result.message,
        attributionId,
        warning: 'Cette annulation a été enregistrée et peut affecter votre réputation.',
        nextSteps: [
          'La mission a été remise en diffusion',
          'Vous ne recevrez plus de notifications pour cette mission',
          'Cette annulation est comptabilisée dans vos statistiques'
        ]
      });
    } else {
      console.log(`❌ Échec annulation attribution ${attributionId}: ${result.message}`);

      return NextResponse.json(
        { success: false, error: result.message },
        { status: 409 } // Conflict
      );
    }

  } catch (error) {
    console.error(`❌ Erreur lors de l'annulation attribution ${attributionId}:`, error);

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur interne du serveur',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  }
}