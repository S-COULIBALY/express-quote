/**
 * API endpoint pour consulter le statut d'une attribution
 * Route: GET /api/attribution/[id]/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { AttributionService } from '@/bookingAttribution/AttributionService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const attributionId = params.id;
  
  try {
    const { searchParams } = new URL(request.url);
    const professionalId = searchParams.get('professionalId');

    // Récupérer le statut de l'attribution
    const attributionService = new AttributionService();
    const attribution = await attributionService.getAttributionStatus(attributionId);

    if (!attribution) {
      return NextResponse.json(
        { success: false, error: 'Attribution non trouvée' },
        { status: 404 }
      );
    }

    // Préparer la réponse selon qui fait la demande
    const response: any = {
      success: true,
      attribution: {
        id: attribution.id,
        status: attribution.status,
        serviceType: attribution.serviceType,
        broadcastCount: attribution.broadcastCount,
        lastBroadcastAt: attribution.lastBroadcastAt,
        createdAt: attribution.createdAt,
        maxDistanceKm: attribution.maxDistanceKm
      }
    };

    // Informations sur la réservation (limitées)
    if (attribution.booking) {
      response.booking = {
        id: attribution.booking.id,
        type: attribution.booking.type,
        totalAmount: attribution.booking.totalAmount,
        scheduledDate: attribution.booking.scheduledDate,
        locationAddress: attribution.booking.locationAddress,
        status: attribution.booking.status
      };

      // Informations client (seulement si professionnel accepté)
      if (attribution.status === 'ACCEPTED' && attribution.acceptedProfessionalId === professionalId) {
        response.customer = {
          firstName: attribution.booking.customer?.firstName,
          lastName: attribution.booking.customer?.lastName,
          email: attribution.booking.customer?.email,
          phone: attribution.booking.customer?.phone
        };
      }
    }

    // Informations sur le professionnel accepté
    if (attribution.acceptedProfessional) {
      response.acceptedProfessional = {
        id: attribution.acceptedProfessional.id,
        companyName: attribution.acceptedProfessional.companyName,
        city: attribution.acceptedProfessional.city
      };
    }

    // Statistiques des réponses
    response.responses = {
      total: attribution.responses?.length || 0,
      accepted: attribution.responses?.filter(r => r.responseType === 'ACCEPTED').length || 0,
      refused: attribution.responses?.filter(r => r.responseType === 'REFUSED').length || 0
    };

    // Si demande spécifique d'un professionnel, ajouter ses infos
    if (professionalId) {
      const professionalResponse = attribution.responses?.find(
        r => r.professionalId === professionalId
      );

      if (professionalResponse) {
        response.yourResponse = {
          type: professionalResponse.responseType,
          responseTime: professionalResponse.responseTime,
          message: professionalResponse.responseMessage
        };
      }

      // Indiquer si le professionnel peut encore agir
      response.canAct = {
        canAccept: attribution.status === 'BROADCASTING' && !professionalResponse,
        canRefuse: attribution.status === 'BROADCASTING' && !professionalResponse,
        canCancel: attribution.status === 'ACCEPTED' && attribution.acceptedProfessionalId === professionalId,
        isExcluded: Array.isArray(attribution.excludedProfessionals) && 
                   (attribution.excludedProfessionals as string[]).includes(professionalId)
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error(`❌ Erreur lors de la consultation attribution ${attributionId}:`, error);

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