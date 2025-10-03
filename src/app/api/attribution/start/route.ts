/**
 * 🎯 API pour déclencher l'attribution aux prestataires après paiement
 * POST /api/attribution/start
 *
 * Responsabilité :
 * - Valide les données d'attribution avec informations restreintes
 * - Lance le processus d'attribution via AttributionService
 * - Suit le même pattern que les autres APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { AttributionService } from '@/bookingAttribution/AttributionService';
import { logger } from '@/lib/logger';

export interface AttributionStartRequest {
  bookingId: string;
  serviceType: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  maxDistanceKm?: number;
  bookingData: {
    bookingReference: string;
    totalAmount: number;
    scheduledDate: string; // ISO string
    scheduledTime: string;
    priority: 'normal' | 'high' | 'urgent';

    // Données complètes (usage interne uniquement)
    fullClientData: {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      fullPickupAddress: string;
      fullDeliveryAddress?: string;
    };

    // Données limitées (pour prestataires)
    limitedClientData: {
      customerName: string;
      pickupAddress: string;
      deliveryAddress?: string;
      serviceType: string;
      quoteDetails: {
        estimatedAmount: number;
        currency: string;
        serviceCategory: string;
      };
    };

    additionalInfo?: any;
  };
}

/**
 * Démarre l'attribution d'une réservation aux prestataires
 */
export async function POST(request: NextRequest) {
  const requestLogger = logger.withContext('AttributionStartAPI');

  try {
    requestLogger.info('🎯 Demande de démarrage attribution');

    const body: AttributionStartRequest = await request.json();

    // Validation des données requises
    const { bookingId, serviceType, coordinates, bookingData } = body;
    if (!bookingId || !serviceType || !coordinates) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données manquantes (bookingId, serviceType, coordinates requis)'
        },
        { status: 400 }
      );
    }

    if (!coordinates.latitude || !coordinates.longitude) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coordonnées GPS manquantes'
        },
        { status: 400 }
      );
    }

    if (!bookingData || !bookingData.fullClientData || !bookingData.limitedClientData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Données client manquantes (fullClientData et limitedClientData requis)'
        },
        { status: 400 }
      );
    }

    requestLogger.info('✅ Validation réussie', {
      bookingId,
      serviceType,
      hasFullData: !!bookingData.fullClientData,
      hasLimitedData: !!bookingData.limitedClientData
    });

    // Préparer les données pour AttributionService
    const attributionRequest = {
      bookingId,
      serviceType,
      serviceLatitude: coordinates.latitude,
      serviceLongitude: coordinates.longitude,
      maxDistanceKm: body.maxDistanceKm || 150,
      bookingData: {
        // Données étendues pour le nouveau flux
        bookingId,
        bookingReference: bookingData.bookingReference,
        serviceDate: new Date(bookingData.scheduledDate),
        serviceTime: bookingData.scheduledTime,
        totalAmount: bookingData.totalAmount,
        priority: bookingData.priority,
        fullClientData: bookingData.fullClientData,
        limitedClientData: bookingData.limitedClientData,
        additionalInfo: bookingData.additionalInfo,

        // Compatibilité avec l'interface existante
        locationAddress: bookingData.fullClientData.fullPickupAddress,
        customerFirstName: bookingData.fullClientData.customerName.split(' ')[0],
        customerLastName: bookingData.fullClientData.customerName.split(' ').slice(1).join(' '),
        customerPhone: bookingData.fullClientData.customerPhone,
        scheduledDate: new Date(bookingData.scheduledDate)
      }
    };

    // Déléguer au service d'attribution
    const attributionService = new AttributionService();
    const attributionId = await attributionService.startAttribution(attributionRequest);

    requestLogger.info('✅ Attribution démarrée avec succès', {
      attributionId,
      bookingId,
      professionalNotificationsSent: true
    });

    return NextResponse.json({
      success: true,
      attributionId,
      bookingId,
      message: 'Attribution démarrée avec succès',
      details: {
        serviceType,
        maxDistanceKm: body.maxDistanceKm || 150,
        dataType: 'restricted', // Confirme que les données sont restreintes
        notificationMethod: 'payment-confirmation-api'
      }
    });

  } catch (error) {
    requestLogger.error('❌ Erreur démarrage attribution', {
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

/**
 * Récupère les informations sur le système d'attribution
 */
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      service: 'Attribution API',
      version: '2.0',
      features: [
        'Données client restreintes pour prestataires',
        'Révélation progressive des informations',
        'PDF sécurisés avec données limitées',
        'Rappels automatiques jour J',
        'Attribution géographique intelligente'
      ],
      endpoints: {
        start: 'POST /api/attribution/start',
        accept: 'GET/POST /api/attribution/[id]/accept',
        refuse: 'GET/POST /api/attribution/[id]/refuse',
        status: 'GET /api/attribution/[id]/status'
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération des informations'
    }, { status: 500 });
  }
}