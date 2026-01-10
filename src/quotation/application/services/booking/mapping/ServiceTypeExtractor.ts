/**
 * 🔍 ServiceTypeExtractor
 * 
 * Service responsable de l'extraction du type de service depuis différentes sources :
 * - QuoteRequest (source de vérité)
 * - AdditionalInfo du booking
 * - Données de booking
 * 
 * ✅ PHASE 1 - Extraction depuis BookingService
 */

import { ServiceType } from '../../../../domain/enums/ServiceType';
import { Booking } from '../../../../domain/entities/Booking';
import { QuoteRequest } from '../../../../domain/entities/QuoteRequest';
import { logger } from '@/lib/logger';

/**
 * Service d'extraction du type de service depuis différentes sources
 */
export class ServiceTypeExtractor {
  /**
   * Extrait le type de service depuis un QuoteRequest (source de vérité)
   * 
   * @param quoteRequest - Le QuoteRequest dont on veut extraire le type
   * @returns Le ServiceType correspondant, ou null si non trouvé
   */
  extractFromQuoteRequest(quoteRequest: QuoteRequest): ServiceType | null {
    if (!quoteRequest || !quoteRequest.getType()) {
      return null;
    }

    const quoteRequestType = quoteRequest.getType();
    return this.mapQuoteRequestTypeToServiceType(quoteRequestType);
  }

  /**
   * Extrait le type de service depuis les données du booking (additionalInfo)
   * 
   * Cette méthode est utilisée comme PRIORITÉ 2/3 quand le QuoteRequest n'est pas disponible.
   * 
   * @param booking - Le booking dont on veut extraire le type de service
   * @param fallbackServiceType - Le type de service par défaut si l'extraction échoue
   * @returns Le ServiceType extrait ou le fallback
   */
  extractFromBookingData(
    booking: Booking,
    fallbackServiceType: ServiceType
  ): ServiceType {
    try {
      // ✅ CORRECTION: booking.getAdditionalInfo() n'existe pas, utiliser (booking as any).additionalInfo
      const additionalInfo = (booking as any).additionalInfo;

      // Essayer d'extraire depuis additionalInfo.serviceType ou quoteData.serviceType
      if (additionalInfo && typeof additionalInfo === 'object') {
        const serviceTypeFromInfo =
          (additionalInfo as any).serviceType ||
          (additionalInfo as any).quoteData?.serviceType;

        if (serviceTypeFromInfo) {
          const normalizedType = String(serviceTypeFromInfo).toUpperCase();
          const mappedType = this.mapStringToServiceType(normalizedType);

          if (mappedType) {
            logger.info(
              `✅ Type de service extrait depuis additionalInfo: ${normalizedType} → ${mappedType}`
            );
            return mappedType;
          }
        }
      }

      // Si aucun type trouvé, utiliser le fallback
      logger.warn(
        `⚠️ Impossible d'extraire le type de service depuis les données du booking, utilisation du fallback: ${fallbackServiceType}`
      );
      return fallbackServiceType;
    } catch (error) {
      logger.warn(
        `⚠️ Erreur lors de l'extraction du type de service depuis les données du booking: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`
      );
      return fallbackServiceType;
    }
  }

  /**
   * Extrait le type de service avec fallback en cascade
   * 
   * PRIORITÉ 1: QuoteRequest (source de vérité)
   * PRIORITÉ 2: AdditionalInfo du booking
   * PRIORITÉ 3: Fallback fourni
   * 
   * @param booking - Le booking dont on veut extraire le type
   * @param quoteRequest - Le QuoteRequest associé (optionnel)
   * @param fallbackServiceType - Le type par défaut si toutes les extractions échouent
   * @returns Le ServiceType extrait ou le fallback
   */
  extractWithFallback(
    booking: Booking,
    quoteRequest: QuoteRequest | null,
    fallbackServiceType: ServiceType
  ): ServiceType {
    // PRIORITÉ 1: QuoteRequest
    if (quoteRequest) {
      const serviceType = this.extractFromQuoteRequest(quoteRequest);
      if (serviceType) {
        logger.info(
          `✅ Type de service déterminé depuis QuoteRequest: ${quoteRequest.getType()} → ${serviceType}`
        );
        return serviceType;
      }
    }

    // PRIORITÉ 2: AdditionalInfo
    const serviceTypeFromData = this.extractFromBookingData(
      booking,
      fallbackServiceType
    );
    if (serviceTypeFromData !== fallbackServiceType) {
      return serviceTypeFromData;
    }

    // PRIORITÉ 3: Fallback
    logger.warn(
      `⚠️ Utilisation du fallback pour le type de service: ${fallbackServiceType}`
    );
    return fallbackServiceType;
  }

  /**
   * Mappe un type QuoteRequest (string) vers ServiceType
   * 
   * @param quoteRequestType - Le type du QuoteRequest (ex: 'CLEANING', 'MOVING', etc.)
   * @returns Le ServiceType correspondant, ou null si non reconnu
   */
  private mapQuoteRequestTypeToServiceType(
    quoteRequestType: string
  ): ServiceType | null {
    const normalizedType = quoteRequestType.toUpperCase();

    if (normalizedType === 'CLEANING' || normalizedType === 'CLEANING_PREMIUM') {
      return ServiceType.CLEANING;
    } else if (
      normalizedType === 'MOVING' ||
      normalizedType === 'MOVING_PREMIUM'
    ) {
      return ServiceType.MOVING;
    } else if (normalizedType === 'DELIVERY') {
      return ServiceType.DELIVERY;
    } else if (normalizedType === 'PACKING' || normalizedType === 'PACK') {
      return ServiceType.PACKING;
    } else if (normalizedType === 'SERVICE') {
      return ServiceType.SERVICE;
    }

    return null;
  }

  /**
   * Mappe une string normalisée vers ServiceType
   * 
   * @param normalizedType - Le type normalisé en majuscules
   * @returns Le ServiceType correspondant, ou null si non reconnu
   */
  private mapStringToServiceType(normalizedType: string): ServiceType | null {
    if (
      normalizedType === 'CLEANING' ||
      normalizedType === 'CLEANING_PREMIUM'
    ) {
      return ServiceType.CLEANING;
    } else if (
      normalizedType === 'MOVING' ||
      normalizedType === 'MOVING_PREMIUM'
    ) {
      return ServiceType.MOVING;
    } else if (normalizedType === 'DELIVERY') {
      return ServiceType.DELIVERY;
    } else if (normalizedType === 'PACKING' || normalizedType === 'PACK') {
      return ServiceType.PACKING;
    } else if (normalizedType === 'SERVICE') {
      return ServiceType.SERVICE;
    }

    return null;
  }
}

/**
 * Instance singleton de l'extracteur
 */
export const serviceTypeExtractor = new ServiceTypeExtractor();

