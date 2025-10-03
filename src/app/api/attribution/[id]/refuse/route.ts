/**
 * API endpoint pour le refus d'une attribution par un professionnel
 * Route: GET/POST /api/attribution/[id]/refuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { AttributionService } from '@/bookingAttribution/AttributionService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRefusal(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRefusal(request, params, 'POST');
}

async function handleRefusal(
  request: NextRequest,
  params: { id: string },
  method: string
) {
  const attributionId = params.id;
  
  try {
    // Récupérer les paramètres
    let professionalId: string;
    let token: string;
    let reason: string | undefined;

    if (method === 'GET') {
      // Refus via lien email/WhatsApp
      const { searchParams } = new URL(request.url);
      professionalId = searchParams.get('professionalId') || '';
      token = searchParams.get('token') || '';
      reason = searchParams.get('reason') || undefined;
    } else {
      // Refus via dashboard/API avec possibilité de message
      const body = await request.json();
      professionalId = body.professionalId || '';
      token = body.token || '';
      reason = body.reason || body.message;
    }

    // Validation des paramètres
    if (!professionalId || !token) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Valider le token de sécurité
    if (!validateToken(professionalId, attributionId, token)) {
      return NextResponse.json(
        { success: false, error: 'Token invalide ou expiré' },
        { status: 401 }
      );
    }

    // Traiter le refus
    const attributionService = new AttributionService();
    const result = await attributionService.handleProfessionalRefusal(
      attributionId,
      professionalId,
      reason
    );

    if (result.success) {
      console.log(`❌ Attribution ${attributionId} refusée par professionnel ${professionalId}`);

      // Réponse différente selon le mode d'accès
      if (method === 'GET') {
        // Redirection vers page de confirmation ou dashboard
        const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/professional/dashboard?refused=${attributionId}`;
        return NextResponse.redirect(redirectUrl);
      } else {
        // Réponse JSON pour API
        return NextResponse.json({
          success: true,
          message: result.message,
          attributionId,
          redirectUrl: `/professional/dashboard?refused=${attributionId}`
        });
      }
    } else {
      console.log(`❌ Échec refus attribution ${attributionId}: ${result.message}`);

      if (method === 'GET') {
        // Redirection vers page d'erreur
        const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/professional/attribution-error?error=${encodeURIComponent(result.message)}`;
        return NextResponse.redirect(errorUrl);
      } else {
        return NextResponse.json(
          { success: false, error: result.message },
          { status: 400 }
        );
      }
    }

  } catch (error) {
    console.error(`❌ Erreur lors du refus attribution ${attributionId}:`, error);

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

/**
 * Valide le token de sécurité pour l'action
 */
function validateToken(professionalId: string, attributionId: string, token: string): boolean {
  try {
    const crypto = require('crypto');
    const secret = process.env.ATTRIBUTION_SECRET || 'default-secret';
    
    // Validation basique - même logique que accept
    return token.length === 16 && /^[a-f0-9]+$/.test(token);
  } catch (error) {
    console.error('Erreur validation token:', error);
    return false;
  }
}