/**
 * Service principal pour la gestion de l'attribution des réservations aux professionnels
 * Architecture simple sans DDD ni IoC
 */

import { PrismaClient } from '@prisma/client';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { ProfessionalLocationService } from './ProfessionalLocationService';
import { BlacklistService } from './BlacklistService';
import { AttributionNotificationService } from './AttributionNotificationService';
import { AttributionUtils } from './AttributionUtils';

export interface AttributionRequest {
  bookingId: string;
  serviceType: ServiceType;
  serviceLatitude: number;
  serviceLongitude: number;
  maxDistanceKm?: number;
  bookingData: {
    // Nouvelles données étendues pour le flux en 2 étapes
    bookingId?: string;
    bookingReference?: string;
    serviceDate?: Date;
    serviceTime?: string;
    priority?: 'normal' | 'high' | 'urgent';

    // Données complètes (usage interne uniquement)
    fullClientData?: {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      fullPickupAddress: string;
      fullDeliveryAddress?: string;
    };

    // Données limitées (pour prestataires)
    limitedClientData?: {
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

    // Données existantes (pour compatibilité)
    totalAmount: number;
    scheduledDate: Date;
    locationAddress: string;
    customerFirstName?: string;
    customerLastName?: string;
    customerPhone?: string;
    additionalInfo?: any;
  };
}

export interface EligibleProfessional {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  distanceKm: number;
}

export class AttributionService {
  private prisma: PrismaClient;
  private locationService: ProfessionalLocationService;
  private blacklistService: BlacklistService;
  private notificationService: AttributionNotificationService;

  constructor() {
    this.prisma = new PrismaClient();
    this.locationService = new ProfessionalLocationService();
    this.blacklistService = new BlacklistService();
    this.notificationService = new AttributionNotificationService();
  }

  /**
   * Lance l'attribution d'une réservation après paiement
   */
  async startAttribution(request: AttributionRequest): Promise<string> {
    console.log(`🎯 Démarrage attribution pour booking ${request.bookingId}`);

    // 1. Créer l'enregistrement d'attribution
    const attribution = await this.prisma.bookingAttribution.create({
      data: {
        bookingId: request.bookingId,
        serviceType: request.serviceType,
        maxDistanceKm: request.maxDistanceKm || 150,
        serviceLatitude: request.serviceLatitude,
        serviceLongitude: request.serviceLongitude,
        status: 'BROADCASTING'
      }
    });

    // 2. Lancer la diffusion
    await this.broadcastToEligibleProfessionals(attribution.id, request);

    return attribution.id;
  }

  /**
   * Diffuse la réservation à tous les professionnels éligibles
   */
  async broadcastToEligibleProfessionals(attributionId: string, request: AttributionRequest): Promise<void> {
    console.log(`📡 Diffusion pour attribution ${attributionId}`);

    // 1. Récupérer l'attribution actuelle
    const attribution = await this.prisma.bookingAttribution.findUnique({
      where: { id: attributionId },
      include: { booking: true }
    });

    if (!attribution || attribution.status !== 'BROADCASTING') {
      console.log(`⚠️ Attribution ${attributionId} non éligible pour diffusion`);
      return;
    }

    // 2. Récupérer les professionnels exclus (blacklist + précédents refus)
    const excludedIds = Array.isArray(attribution.excludedProfessionals) 
      ? attribution.excludedProfessionals as string[]
      : [];

    const blacklistedIds = await this.blacklistService.getBlacklistedProfessionals(request.serviceType);
    const allExcludedIds = [...new Set([...excludedIds, ...blacklistedIds])];

    // 3. Trouver les professionnels éligibles
    const eligibleProfessionals = await this.locationService.findEligibleProfessionals({
      serviceType: request.serviceType,
      serviceLatitude: request.serviceLatitude,
      serviceLongitude: request.serviceLongitude,
      maxDistanceKm: request.maxDistanceKm || 150,
      excludedProfessionalIds: allExcludedIds
    });

    console.log(`👥 ${eligibleProfessionals.length} professionnels éligibles trouvés`);

    if (eligibleProfessionals.length === 0) {
      // Aucun professionnel disponible
      await this.prisma.bookingAttribution.update({
        where: { id: attributionId },
        data: { status: 'EXPIRED' }
      });
      console.log(`❌ Aucun professionnel disponible pour attribution ${attributionId}`);
      return;
    }

    // 4. Envoyer les notifications avec données étendues
    const notificationData = {
      bookingId: request.bookingData.bookingId || request.bookingId,
      bookingReference: request.bookingData.bookingReference || `BK-${request.bookingId.slice(0, 8)}`,
      serviceType: request.serviceType,
      serviceDate: request.bookingData.serviceDate || request.bookingData.scheduledDate,
      serviceTime: request.bookingData.serviceTime || '09:00',
      totalAmount: request.bookingData.totalAmount,
      priority: request.bookingData.priority || 'normal',

      // Données complètes (usage interne)
      fullClientData: request.bookingData.fullClientData || {
        customerName: `${request.bookingData.customerFirstName} ${request.bookingData.customerLastName}`.trim(),
        customerEmail: '', // Sera rempli si disponible
        customerPhone: request.bookingData.customerPhone,
        fullPickupAddress: request.bookingData.locationAddress,
        fullDeliveryAddress: undefined
      },

      // Données limitées (pour prestataires)
      limitedClientData: request.bookingData.limitedClientData || {
        customerName: `${request.bookingData.customerFirstName?.charAt(0)}. ${request.bookingData.customerLastName}`.trim(),
        pickupAddress: AttributionUtils.extractCityFromAddress(request.bookingData.locationAddress),
        deliveryAddress: undefined,
        serviceType: request.serviceType,
        quoteDetails: {
          estimatedAmount: Math.round(request.bookingData.totalAmount * 0.85), // Estimation sans marge
          currency: 'EUR',
          serviceCategory: AttributionUtils.getServiceCategory(request.serviceType)
        }
      }
    };

    await this.notificationService.sendAttributionNotifications(
      attributionId,
      eligibleProfessionals,
      notificationData
    );

    console.log(`✅ Diffusion terminée pour attribution ${attributionId}`);
  }

  /**
   * Traite l'acceptation d'un professionnel
   */
  async handleProfessionalAcceptance(attributionId: string, professionalId: string): Promise<{ success: boolean; message: string }> {
    console.log(`✋ Tentative d'acceptation par professionnel ${professionalId} pour attribution ${attributionId}`);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Vérifier l'état de l'attribution
      const attribution = await tx.bookingAttribution.findUnique({
        where: { id: attributionId },
        include: { booking: true }
      });

      if (!attribution) {
        return { success: false, message: 'Attribution non trouvée' };
      }

      if (attribution.status !== 'BROADCASTING' && attribution.status !== 'RE_BROADCASTING') {
        return { success: false, message: 'Cette mission n\'est plus disponible' };
      }

      if (attribution.acceptedProfessionalId) {
        return { success: false, message: 'Mission déjà acceptée par un autre professionnel' };
      }

      // 2. Accepter l'attribution
      await tx.bookingAttribution.update({
        where: { id: attributionId },
        data: {
          status: 'ACCEPTED',
          acceptedProfessionalId: professionalId
        }
      });

      // 3. Assigner le professionnel à la réservation
      await tx.booking.update({
        where: { id: attribution.bookingId },
        data: { professionalId: professionalId }
      });

      // 4. Enregistrer la réponse
      await tx.attributionResponse.create({
        data: {
          attributionId: attributionId,
          professionalId: professionalId,
          responseType: 'ACCEPTED',
          responseTime: new Date()
        }
      });

      // 5. Réinitialiser le compteur de refus consécutifs pour ce professionnel
      await this.blacklistService.resetConsecutiveRefusals(professionalId, attribution.serviceType);

      console.log(`🎉 Attribution ${attributionId} acceptée par professionnel ${professionalId}`);

      // 6. Notifier les autres professionnels que la mission est prise (WebSocket)
      await this.notificationService.notifyAttributionTaken(attributionId, professionalId);

      return { success: true, message: 'Mission acceptée avec succès' };
    });
  }

  /**
   * Traite le refus d'un professionnel
   */
  async handleProfessionalRefusal(attributionId: string, professionalId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    console.log(`❌ Refus par professionnel ${professionalId} pour attribution ${attributionId}`);

    // 1. Enregistrer la réponse
    await this.prisma.attributionResponse.create({
      data: {
        attributionId: attributionId,
        professionalId: professionalId,
        responseType: 'REFUSED',
        responseTime: new Date(),
        responseMessage: reason
      }
    });

    // 2. Récupérer l'attribution
    const attribution = await this.prisma.bookingAttribution.findUnique({
      where: { id: attributionId }
    });

    if (!attribution) {
      return { success: false, message: 'Attribution non trouvée' };
    }

    // 3. Gérer la blacklist
    await this.blacklistService.handleRefusal(professionalId, attribution.serviceType, attributionId);

    // 4. Ajouter à la liste des exclus pour cette attribution
    const currentExcluded = Array.isArray(attribution.excludedProfessionals) 
      ? attribution.excludedProfessionals as string[]
      : [];
    
    const updatedExcluded = [...new Set([...currentExcluded, professionalId])];

    await this.prisma.bookingAttribution.update({
      where: { id: attributionId },
      data: {
        excludedProfessionals: updatedExcluded
      }
    });

    console.log(`✅ Refus enregistré pour professionnel ${professionalId}`);
    return { success: true, message: 'Refus enregistré' };
  }

  /**
   * Traite l'annulation par un professionnel qui avait accepté
   */
  async handleProfessionalCancellation(attributionId: string, professionalId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    console.log(`🚫 Annulation par professionnel ${professionalId} pour attribution ${attributionId}`);

    return await this.prisma.$transaction(async (tx) => {
      // 1. Vérifier que ce professionnel a bien accepté cette attribution
      const attribution = await tx.bookingAttribution.findUnique({
        where: { id: attributionId },
        include: { booking: true }
      });

      if (!attribution || attribution.acceptedProfessionalId !== professionalId) {
        return { success: false, message: 'Vous n\'êtes pas assigné à cette mission' };
      }

      if (attribution.status !== 'ACCEPTED') {
        return { success: false, message: 'Cette mission ne peut plus être annulée' };
      }

      // 2. Remettre en diffusion
      await tx.bookingAttribution.update({
        where: { id: attributionId },
        data: {
          status: 'RE_BROADCASTING',
          acceptedProfessionalId: null,
          broadcastCount: { increment: 1 },
          lastBroadcastAt: new Date()
        }
      });

      // 3. Retirer l'assignation de la réservation
      await tx.booking.update({
        where: { id: attribution.bookingId },
        data: { professionalId: null }
      });

      // 4. Ajouter à la liste des exclus
      const currentExcluded = Array.isArray(attribution.excludedProfessionals) 
        ? attribution.excludedProfessionals as string[]
        : [];
      
      const updatedExcluded = [...new Set([...currentExcluded, professionalId])];

      await tx.bookingAttribution.update({
        where: { id: attributionId },
        data: {
          excludedProfessionals: updatedExcluded
        }
      });

      // 5. Pénaliser plus sévèrement l'annulation qu'un simple refus
      await this.blacklistService.handleCancellation(professionalId, attribution.serviceType, attributionId);

      console.log(`🔄 Remise en diffusion pour attribution ${attributionId}`);

      // 6. Relancer la diffusion
      // Note: On utilise les données de la réservation existante
      const bookingData = {
        totalAmount: attribution.booking.totalAmount,
        scheduledDate: attribution.booking.scheduledDate || new Date(),
        locationAddress: attribution.booking.locationAddress || 'Non spécifié',
        additionalInfo: attribution.booking.additionalInfo
      };

      await this.broadcastToEligibleProfessionals(attributionId, {
        bookingId: attribution.bookingId,
        serviceType: attribution.serviceType,
        serviceLatitude: attribution.serviceLatitude!,
        serviceLongitude: attribution.serviceLongitude!,
        maxDistanceKm: attribution.maxDistanceKm,
        bookingData
      });

      return { success: true, message: 'Mission annulée et remise en diffusion' };
    });
  }

  /**
   * Récupère le statut d'une attribution
   */
  async getAttributionStatus(attributionId: string) {
    const attribution = await this.prisma.bookingAttribution.findUnique({
      where: { id: attributionId },
      include: {
        booking: {
          include: {
            customer: true
          }
        },
        acceptedProfessional: true,
        responses: {
          include: {
            professional: true
          },
          orderBy: {
            responseTime: 'desc'
          }
        }
      }
    });

    return attribution;
  }

  /**
   * Récupère les attributions pour un professionnel
   */
  async getProfessionalAttributions(professionalId: string, limit: number = 20) {
    const responses = await this.prisma.attributionResponse.findMany({
      where: { professionalId },
      include: {
        attribution: {
          include: {
            booking: true
          }
        }
      },
      orderBy: {
        responseTime: 'desc'
      },
      take: limit
    });

    return responses;
  }

  // Note: Les utilitaires communs sont maintenant dans AttributionUtils
}