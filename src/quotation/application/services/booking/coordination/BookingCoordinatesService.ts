/**
 * 📍 BookingCoordinatesService
 * 
 * Service responsable de la gestion des coordonnées géographiques des réservations :
 * - Extraction des coordonnées depuis différentes sources
 * - Géocodage d'adresses
 * - Validation du rayon de 50km autour de Paris
 * - Stockage des coordonnées dans additionalInfo
 * 
 * ✅ PHASE 2 - Extraction depuis BookingService
 */

import { Booking, BookingType } from '../../../../domain/entities/Booking';
import { logger } from '@/lib/logger';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Service de gestion des coordonnées géographiques
 */
export class BookingCoordinatesService {
  /**
   * Extrait les coordonnées géographiques d'une réservation
   *
   * PRIORITÉ 1: additionalInfo.coordinates (déjà stockées par storeCoordinates())
   * PRIORITÉ 1.5: additionalInfo.quoteData.coordinates (fallback si storeCoordinates() pas encore appelé)
   * PRIORITÉ 2: Moving.pickupCoordinates (pour MOVING_QUOTE)
   * PRIORITÉ 3: Géocodage de l'adresse (locationAddress ou pickupAddress)
   *
   * @param booking - La réservation dont on veut extraire les coordonnées
   * @returns Les coordonnées extraites, ou null si impossible
   */
  async extractCoordinates(
    booking: Booking
  ): Promise<Coordinates | null> {
    try {
      // 1. Essayer d'extraire depuis les données additionnelles (coordonnées déjà stockées)
      const additionalInfo = (booking as any).additionalInfo as any;

      // PRIORITÉ 1: Coordonnées stockées par storeCoordinates() dans additionalInfo.coordinates
      if (
        additionalInfo?.coordinates?.latitude &&
        additionalInfo?.coordinates?.longitude
      ) {
        const coordinates = {
          latitude: additionalInfo.coordinates.latitude,
          longitude: additionalInfo.coordinates.longitude,
        };

        // Valider que les coordonnées sont dans le rayon de 50km de Paris
        if (await this.validateParisRadius(coordinates.latitude, coordinates.longitude)) {
          logger.info(
            `✅ Coordonnées trouvées dans additionalInfo.coordinates: (${coordinates.latitude}, ${coordinates.longitude})`
          );
          return coordinates;
        } else {
          logger.warn(
            `⚠️ Coordonnées dans additionalInfo.coordinates hors du rayon de 50km de Paris: (${coordinates.latitude}, ${coordinates.longitude})`
          );
        }
      }

      // PRIORITÉ 1.5: Fallback sur additionalInfo.quoteData.coordinates
      //
      // ✅ CORRECTION : Ajout d'un fallback supplémentaire avant le géocodage coûteux.
      // Cas où storeCoordinates() n'a pas encore été appelé ou a échoué.
      //
      // Ce fallback évite de faire un géocodage si les coordonnées sont déjà disponibles
      // dans quoteData (même si elles n'ont pas été stockées dans coordinates).
      if (
        additionalInfo?.quoteData?.coordinates?.latitude &&
        additionalInfo?.quoteData?.coordinates?.longitude
      ) {
        const coordinates = {
          latitude: additionalInfo.quoteData.coordinates.latitude,
          longitude: additionalInfo.quoteData.coordinates.longitude,
        };

        // Valider que les coordonnées sont dans le rayon de 50km de Paris
        if (await this.validateParisRadius(coordinates.latitude, coordinates.longitude)) {
          logger.info(
            `✅ Coordonnées trouvées dans additionalInfo.quoteData.coordinates (fallback): (${coordinates.latitude}, ${coordinates.longitude})`
          );
          return coordinates;
        } else {
          logger.warn(
            `⚠️ Coordonnées dans additionalInfo.quoteData.coordinates hors du rayon de 50km de Paris: (${coordinates.latitude}, ${coordinates.longitude})`
          );
        }
      }

      // 2. Pour MOVING_QUOTE, récupérer depuis la table Moving
      const bookingType = booking.getType();
      if (bookingType === BookingType.MOVING_QUOTE) {
        const coordinates = await this.extractFromMoving(booking);
        if (coordinates) {
          return coordinates;
        }
      }

      // 3. Géocoder l'adresse si disponible (camelCase Prisma)
      const bookingData = booking as any;
      const address =
        bookingData.locationAddress || bookingData.pickupAddress;
      if (address) {
        const coordinates = await this.geocodeAddress(address);
        if (coordinates) {
          return coordinates;
        }
      }

      // 4. Dernier recours: retourner null
      logger.error(
        `❌ Impossible d'extraire les coordonnées pour booking ${booking.getId()}`
      );
      return null;
    } catch (error) {
      logger.error('❌ Erreur extraction coordonnées:', error);
      return null;
    }
  }

  /**
   * Stocke les coordonnées dans additionalInfo lors de la création du booking
   * 
   * ✅ CORRECTION : Cette méthode résout le problème où les coordonnées n'étaient pas toujours disponibles
   * lors de l'attribution. En stockant les coordonnées dès la création du booking, on évite d'avoir
   * à les récupérer depuis le QuoteRequest plus tard (via le fallback dans BookingAttributionService).
   * 
   * STRATÉGIE DE STOCKAGE :
   * PRIORITÉ 1: Coordonnées depuis quoteData.coordinates (déjà géocodées)
   * PRIORITÉ 2: Géocodage de l'adresse depuis quoteData (pickupAddress, locationAddress, ou address)
   * 
   * FORMAT DE STOCKAGE :
   * additionalInfo.coordinates = {
   *   latitude: number,
   *   longitude: number,
   *   source: 'quoteData' | 'geocoding',
   *   storedAt: ISO string
   * }
   * 
   * NOTE : Cette méthode est non-bloquante. Si le stockage échoue, un warning est loggé
   * mais la création du booking continue. Le fallback dans BookingAttributionService prendra le relais.
   * 
   * @param booking - La réservation à mettre à jour
   * @param quoteData - Les données du devis contenant les coordonnées ou l'adresse
   */
  async storeCoordinates(
    booking: Booking,
    quoteData: any
  ): Promise<void> {
    try {
      // 1. Vérifier si les coordonnées sont déjà dans quoteData
      if (
        quoteData?.coordinates?.latitude &&
        quoteData?.coordinates?.longitude
      ) {
        const coordinates = {
          latitude: quoteData.coordinates.latitude,
          longitude: quoteData.coordinates.longitude,
        };

        // Valider le rayon de 50km
        if (await this.validateParisRadius(coordinates.latitude, coordinates.longitude)) {
          await this.updateAdditionalInfo(booking, {
            coordinates: {
              ...coordinates,
              source: 'quoteData',
              storedAt: new Date().toISOString(),
            },
          });
          logger.info(
            `✅ Coordonnées stockées depuis quoteData: (${coordinates.latitude}, ${coordinates.longitude})`
          );
          return;
        } else {
          logger.warn(
            `⚠️ Coordonnées dans quoteData hors du rayon de 50km: (${coordinates.latitude}, ${coordinates.longitude})`
          );
        }
      }

      // 2. Géocoder l'adresse si disponible
      const address =
        quoteData?.pickupAddress ||
        quoteData?.locationAddress ||
        quoteData?.address;
      if (address) {
        const coordinates = await this.geocodeAddress(address);
        if (coordinates) {
          const isValid = await this.validateParisRadius(
            coordinates.latitude,
            coordinates.longitude
          );

          await this.updateAdditionalInfo(booking, {
            coordinates: {
              ...coordinates,
              source: 'geocoded',
              address: address,
              geocodedAt: new Date().toISOString(),
              ...(isValid ? {} : { warning: 'Hors rayon 50km de Paris' }),
            },
          });

          if (isValid) {
            logger.info(
              `✅ Coordonnées géocodées et stockées: ${address} → (${coordinates.latitude}, ${coordinates.longitude})`
            );
          } else {
            logger.warn(
              `⚠️ Adresse géocodée hors du rayon de 50km: ${address} → (${coordinates.latitude}, ${coordinates.longitude})`
            );
          }
        } else {
          logger.warn(`⚠️ Géocodage échoué pour adresse: ${address}`);
        }
      }
    } catch (error) {
      logger.error('❌ Erreur lors du stockage des coordonnées:', error);
      // Ne pas bloquer la création du booking si le géocodage échoue
    }
  }

  /**
   * Extrait les coordonnées depuis la table Moving (pour MOVING_QUOTE)
   * 
   * @param booking - La réservation de type MOVING_QUOTE
   * @returns Les coordonnées extraites, ou null si non trouvées
   */
  private async extractFromMoving(
    booking: Booking
  ): Promise<Coordinates | null> {
    try {
      const { prisma } = await import('@/lib/prisma');
      const moving = await prisma.moving.findUnique({
        where: { bookingId: booking.getId()! },
        select: { pickupCoordinates: true, deliveryCoordinates: true },
      });

      if (moving?.pickupCoordinates) {
        const coords = moving.pickupCoordinates as any;
        if (coords.latitude && coords.longitude) {
          const coordinates = {
            latitude: coords.latitude,
            longitude: coords.longitude,
          };

          // Valider le rayon de 50km
          if (await this.validateParisRadius(coordinates.latitude, coordinates.longitude)) {
            logger.info(
              `✅ Coordonnées trouvées dans Moving.pickupCoordinates: (${coordinates.latitude}, ${coordinates.longitude})`
            );
            return coordinates;
          } else {
            logger.warn(
              `⚠️ Coordonnées Moving hors du rayon de 50km de Paris: (${coordinates.latitude}, ${coordinates.longitude})`
            );
          }
        }
      }
      return null;
    } catch (movingError) {
      logger.warn(
        '⚠️ Erreur récupération coordonnées depuis Moving:',
        movingError
      );
      return null;
    }
  }

  /**
   * Géocode une adresse et valide le rayon de 50km
   * 
   * @param address - L'adresse à géocoder
   * @returns Les coordonnées géocodées, ou null si échec
   */
  private async geocodeAddress(
    address: string
  ): Promise<Coordinates | null> {
    try {
      const { ProfessionalLocationService } = await import(
        '@/bookingAttribution/ProfessionalLocationService'
      );
      const locationService = new ProfessionalLocationService();
      const coordinates = await locationService.geocodeAddress(address);

      if (coordinates) {
        const isValid = await this.validateParisRadius(
          coordinates.latitude,
          coordinates.longitude
        );

        if (isValid) {
          logger.info(
            `✅ Adresse géocodée et validée (rayon 50km): ${address} → (${coordinates.latitude}, ${coordinates.longitude})`
          );
        } else {
          logger.error(
            `❌ Adresse hors du rayon de 50km de Paris: ${address} → (${coordinates.latitude}, ${coordinates.longitude})`
          );
          // Retourner quand même les coordonnées (validation business à faire ailleurs)
        }

        return coordinates;
      } else {
        logger.warn(`⚠️ Géocodage échoué pour adresse: ${address}`);
        return null;
      }
    } catch (geocodeError) {
      logger.error('❌ Erreur lors du géocodage:', geocodeError);
      return null;
    }
  }

  /**
   * Valide que les coordonnées sont dans le rayon de 50km autour de Paris
   * 
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @returns true si dans le rayon, false sinon
   */
  async validateParisRadius(
    latitude: number,
    longitude: number
  ): Promise<boolean> {
    try {
      const { ProfessionalLocationService } = await import(
        '@/bookingAttribution/ProfessionalLocationService'
      );
      const locationService = new ProfessionalLocationService();
      return locationService.isWithinParisRadius(latitude, longitude, 50);
    } catch (error) {
      logger.warn('⚠️ Erreur validation rayon Paris:', error);
      return false;
    }
  }

  /**
   * Met à jour additionalInfo d'un booking dans la base de données
   * 
   * ✅ CORRECTION : Cette méthode est utilisée par le fallback dans BookingAttributionService
   * pour stocker les coordonnées récupérées depuis QuoteRequest.
   * 
   * STRATÉGIE DE MERGE :
   * - Les nouvelles données sont mergées avec les données existantes
   * - Les nouvelles valeurs écrasent les anciennes (shallow merge)
   * - L'entité en mémoire est mise à jour pour cohérence
   * 
   * UTILISATION :
   * - Fallback coordonnées depuis QuoteRequest
   * - Stockage coordonnées lors de la création du booking
   * - Mise à jour de toute autre métadonnée dans additionalInfo
   * 
   * @param booking - La réservation à mettre à jour
   * @param additionalInfo - Les nouvelles données à ajouter/merger (sera mergé avec existingInfo)
   */
  async updateAdditionalInfo(
    booking: Booking,
    additionalInfo: any
  ): Promise<void> {
    try {
      const { prisma } = await import('@/lib/prisma');
      const existingInfo = (booking as any).additionalInfo || {};
      const mergedInfo = {
        ...existingInfo,
        ...additionalInfo,
      };

      await prisma.booking.update({
        where: { id: booking.getId()! },
        data: {
          additionalInfo: mergedInfo,
          updatedAt: new Date(),
        },
      });

      // Mettre à jour l'entité en mémoire (pour cohérence)
      (booking as any).additionalInfo = mergedInfo;
    } catch (error) {
      logger.error('❌ Erreur mise à jour additionalInfo:', error);
      throw error;
    }
  }
}

/**
 * Instance singleton du service de coordonnées
 */
export const bookingCoordinatesService = new BookingCoordinatesService();

