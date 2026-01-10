/**
 * 🗺️ BookingTypeMapper
 *
 * Service responsable du mapping entre les différents types utilisés dans l'application :
 * - ServiceType (enum des services)
 * - ItemType (types d'items)
 * - BookingType (types de réservation)
 *
 * ✅ SERVICES ACTIFS (2026-01-10):
 * - MOVING : Déménagement standard
 * - MOVING_PREMIUM : Déménagement sur mesure
 *
 * ❌ SERVICES ABANDONNÉS : PACKING, CLEANING, DELIVERY, SERVICE
 * Supprimés définitivement du système (2026-01-10)
 *
 * ✅ PHASE 1 - Extraction depuis BookingService
 */

import { ServiceType } from '../../../../domain/enums/ServiceType';
import { ItemType } from '../../../../domain/entities/Item';
import { BookingType } from '../../../../domain/enums/BookingType';

/**
 * Service de mapping entre les différents types de l'application
 */
export class BookingTypeMapper {
  /**
   * Mappe ServiceType vers ItemType
   *
   * Tous les services actifs (MOVING, MOVING_PREMIUM) sont mappés vers DEMENAGEMENT
   *
   * @param serviceType - Le type de service à mapper
   * @returns L'ItemType correspondant (toujours DEMENAGEMENT)
   */
  mapServiceTypeToItemType(serviceType: ServiceType): ItemType {
    // Tous les services actifs sont des déménagements
    return ItemType.DEMENAGEMENT;
  }

  /**
   * Mappe ItemType vers BookingType pour compatibilité avec Prisma
   * 
   * @param itemType - Le type d'item à mapper
   * @returns Le BookingType correspondant (toujours MOVING_QUOTE)
   */
  mapItemTypeToBookingType(itemType: ItemType): BookingType {
    // Tous les items sont mappés vers MOVING_QUOTE
    return BookingType.MOVING_QUOTE;
  }

  /**
   * Mappe BookingType vers ServiceType pour l'attribution professionnelle
   * 
   * @param bookingType - Le type de réservation à mapper
   * @returns Le ServiceType correspondant (toujours MOVING)
   */
  mapBookingTypeToServiceType(bookingType: BookingType): ServiceType {
    // Tous les bookings sont des déménagements
    return ServiceType.MOVING;
  }
}

/**
 * Instance singleton du mapper
 */
export const bookingTypeMapper = new BookingTypeMapper();

