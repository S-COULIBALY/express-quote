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
        serviceType: attribution.service_type,
        broadcastCount: attribution.broadcast_count,
        lastBroadcastAt: attribution.last_broadcast_at,
        createdAt: attribution.created_at,
        max_distance_km: attribution.max_distance_km
      }
    };

    // Informations sur la réservation (limitées)
    if (attribution.Booking) {
      response.booking = {
        id: attribution.Booking.id,
        type: attribution.Booking.type,
        totalAmount: attribution.Booking.totalAmount,
        scheduledDate: attribution.Booking.scheduledDate,
        locationAddress: attribution.Booking.locationAddress,
        status: attribution.Booking.status
      };

      // Informations client (seulement si professionnel accepté)
      if (attribution.status === 'ACCEPTED' && attribution.accepted_professional_id === professionalId) {
        response.customer = {
          firstName: attribution.Booking.Customer?.firstName,
          lastName: attribution.Booking.Customer?.lastName,
          email: attribution.Booking.Customer?.email,
          phone: attribution.Booking.Customer?.phone
        };
      }
    }

    // Informations sur le professionnel accepté
    if (attribution.Professional) {
      response.acceptedProfessional = {
        id: attribution.Professional.id,
        companyName: attribution.Professional.companyName,
        city: attribution.Professional.city
      };
    }

    // Statistiques des réponses
    response.responses = {
      total: attribution.attribution_responses?.length || 0,
      accepted: attribution.attribution_responses?.filter((r: any) => r.response_type === 'ACCEPTED').length || 0,
      refused: attribution.attribution_responses?.filter((r: any) => r.response_type === 'REFUSED').length || 0
    };

    // Si demande spécifique d'un professionnel, ajouter ses infos
    if (professionalId) {
      const professionalResponse = attribution.attribution_responses?.find(
        (r: any) => r.professional_id === professionalId
      );

      if (professionalResponse) {
        response.yourResponse = {
          type: professionalResponse.response_type,
          responseTime: professionalResponse.response_time,
          message: professionalResponse.response_message
        };
      }

      // Indiquer si le professionnel peut encore agir
      response.canAct = {
        canAccept: attribution.status === 'BROADCASTING' && !professionalResponse,
        canRefuse: attribution.status === 'BROADCASTING' && !professionalResponse,
        canCancel: attribution.status === 'ACCEPTED' && attribution.accepted_professional_id === professionalId,
        isExcluded: Array.isArray(attribution.excluded_professionals) &&
                   (attribution.excluded_professionals as string[]).includes(professionalId)
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
