/**
 * 🎯 BookingAttributionService
 * 
 * Service responsable de l'attribution professionnelle des réservations :
 * - Déclenchement de l'attribution après paiement
 * - Préparation des données RGPD (complètes/limitées)
 * - Extraction des coordonnées
 * - Détermination du type de service
 * 
 * ✅ PHASE 2 - Extraction depuis BookingService
 */

import { Booking } from '../../../../domain/entities/Booking';
import { QuoteRequest } from '../../../../domain/entities/QuoteRequest';
import { ServiceType } from '../../../../domain/enums/ServiceType';
import { logger } from '@/lib/logger';
import { AttributionUtils } from '@/bookingAttribution/AttributionUtils';
import { bookingTypeMapper } from '../mapping/BookingTypeMapper';
import { serviceTypeExtractor } from '../mapping/ServiceTypeExtractor';
import { bookingCoordinatesService } from './BookingCoordinatesService';
import { UnifiedDataService, ConfigurationCategory } from '@/quotation/infrastructure/services/UnifiedDataService';
import { PricingFactorsConfigKey } from '@/quotation/domain/configuration/ConfigurationKey';

/**
 * Service d'attribution professionnelle
 */
export class BookingAttributionService {
  private readonly unifiedDataService: UnifiedDataService;

  constructor(
    private readonly quoteRequestRepository: {
      findByBookingId: (bookingId: string) => Promise<QuoteRequest | null>;
    }
  ) {
    this.unifiedDataService = UnifiedDataService.getInstance();
  }

  /**
   * Déclenche l'attribution professionnelle après un paiement réussi
   * 
   * @param booking - La réservation pour laquelle déclencher l'attribution
   */
  async triggerAttribution(booking: Booking): Promise<void> {
    logger.info(
      `🎯 [TRACE ATTRIBUTION] Déclenchement attribution professionnelle pour booking ${booking.getId()}`
    );

    // 🔍 TRACER: Données du booking au moment de l'attribution
    const rawBooking = booking as any;
    logger.info(`🔍 [TRACE ATTRIBUTION] Booking data:`, {
      bookingId: booking.getId(),
      type: booking.getType(),
      pickupAddress: rawBooking.pickupAddress,
      locationAddress: rawBooking.locationAddress,
      additionalInfo: rawBooking.additionalInfo,
    });

    try {
      // Import dynamique pour éviter les dépendances circulaires
      const { AttributionService } = await import(
        '@/bookingAttribution/AttributionService'
      );
      const attributionService = new AttributionService();
      logger.info(`✅ [TRACE ATTRIBUTION] AttributionService chargé`);

      // Extraire les coordonnées géographiques du booking
      // 
      // 🔍 STRATÉGIE D'EXTRACTION MULTI-NIVEAUX :
      // 1. PRIORITÉ 1: additionalInfo.coordinates (stockées par storeCoordinates() lors de la création)
      // 2. PRIORITÉ 1.5: additionalInfo.quoteData.coordinates (fallback si storeCoordinates() pas encore appelé)
      // 3. PRIORITÉ 2: Moving.pickupCoordinates (pour MOVING_QUOTE)
      // 4. PRIORITÉ 3: Géocodage de l'adresse (locationAddress ou pickupAddress)
      //
      // ⚠️ PROBLÈME RÉSOLU : Parfois les coordonnées ne sont pas stockées lors de la création du booking
      // → Solution : Fallback depuis QuoteRequest si extractCoordinates() retourne null
      logger.info(`🔍 [TRACE ATTRIBUTION] Extraction des coordonnées...`);
      let coordinates = await bookingCoordinatesService.extractCoordinates(booking);
      
      // ✅ FALLBACK CRITIQUE: Si les coordonnées ne sont pas dans le booking, les récupérer depuis le QuoteRequest
      // 
      // CONTEXTE : Cette correction résout le problème où l'attribution était annulée faute de coordonnées.
      // Le fallback garantit que même si storeCoordinates() n'a pas été appelé ou a échoué,
      // on peut toujours récupérer les coordonnées depuis le QuoteRequest associé.
      //
      // FLUX :
      // 1. extractCoordinates() essaie d'abord les sources standards (additionalInfo, Moving, géocodage)
      // 2. Si aucune coordonnée trouvée → Fallback sur QuoteRequest.quoteData.coordinates
      // 3. Si coordonnées trouvées → Stockage dans booking.additionalInfo pour éviter de refaire cette recherche
      // 4. Si toujours aucune coordonnée → Attribution annulée (log error détaillé)
      if (!coordinates) {
        logger.warn(
          `⚠️ [TRACE ATTRIBUTION] Coordonnées non trouvées dans booking, tentative depuis QuoteRequest...`
        );
        try {
          const quoteRequest = await this.quoteRequestRepository.findByBookingId(booking.getId()!);
          if (quoteRequest) {
            const quoteData = quoteRequest.getQuoteData() as any;
            if (quoteData?.coordinates?.latitude && quoteData?.coordinates?.longitude) {
              coordinates = {
                latitude: quoteData.coordinates.latitude,
                longitude: quoteData.coordinates.longitude,
              };
              logger.info(
                `✅ [TRACE ATTRIBUTION] Coordonnées récupérées depuis QuoteRequest: (${coordinates.latitude}, ${coordinates.longitude})`
              );
              
              // Stocker les coordonnées dans le booking pour les prochaines fois
              // Cela évite de refaire cette requête QuoteRequest à chaque fois
              await bookingCoordinatesService.updateAdditionalInfo(booking, {
                coordinates: {
                  ...coordinates,
                  source: 'quoteRequest_fallback', // Trace de la source pour debugging
                  storedAt: new Date().toISOString(),
                },
              });
            }
          }
        } catch (quoteRequestError) {
          // Non-bloquant : on log un warning mais on continue
          // Si les coordonnées sont toujours null après ce fallback, l'attribution sera annulée
          logger.warn(
            `⚠️ [TRACE ATTRIBUTION] Erreur récupération QuoteRequest:`,
            quoteRequestError
          );
        }
      }
      
      if (!coordinates) {
        logger.error(
          `❌ [TRACE ATTRIBUTION] Coordonnées non disponibles pour booking ${booking.getId()}, attribution annulée`
        );
        logger.error(
          `   📍 pickup_address: ${rawBooking.pickup_address || 'undefined'}`
        );
        logger.error(
          `   📍 location_address: ${rawBooking.location_address || 'undefined'}`
        );
        logger.error(
          `   📍 additionalInfo.coordinates: ${JSON.stringify(
            rawBooking.additionalInfo?.coordinates || 'undefined'
          )}`
        );
        logger.error(`   📍 Type: ${booking.getType()}`);
        return;
      }

      logger.info(
        `✅ [TRACE ATTRIBUTION] Coordonnées extraites: (${coordinates.latitude}, ${coordinates.longitude})`
      );

      // Valider que les coordonnées sont dans le rayon de 50km de Paris
      const isValid = await bookingCoordinatesService.validateParisRadius(
        coordinates.latitude,
        coordinates.longitude
      );
      if (!isValid) {
        logger.error(
          `❌ Coordonnées hors du rayon de 50km de Paris pour booking ${booking.getId()}`
        );
        logger.error(
          `   Coordonnées: (${coordinates.latitude}, ${coordinates.longitude})`
        );
        const bookingData = booking as any;
        logger.error(
          `   Adresse: ${bookingData.location_address || bookingData.pickup_address || 'Non spécifiée'}`
        );
        // Pour l'instant, on continue quand même (validation business à faire ailleurs)
        // Mais on log l'erreur pour monitoring
      } else {
        logger.info(
          `✅ Coordonnées validées (rayon 50km): (${coordinates.latitude}, ${coordinates.longitude})`
        );
      }

      // Déterminer le type de service pour l'attribution
      const serviceType = await this.determineServiceType(booking);

      // Préparer les données avec séparation complète/limitée pour le flux en 2 étapes
      const bookingData = await this.prepareAttributionData(booking);

      // Lancer l'attribution
      logger.info(`🚀 [TRACE ATTRIBUTION] Appel startAttribution avec:`, {
        bookingId: booking.getId()!,
        serviceType,
        coordinates: { lat: coordinates.latitude, lon: coordinates.longitude },
        maxDistanceKm: 100
      });
      
      const attributionId = await attributionService.startAttribution({
        bookingId: booking.getId()!,
        serviceType,
        serviceLatitude: coordinates.latitude,
        serviceLongitude: coordinates.longitude,
        maxDistanceKm: 100, // Distance par défaut
        bookingData,
      });

      logger.info(
        `✅ Attribution professionnelle créée: ${attributionId} pour booking ${booking.getId()}`
      );
    } catch (error) {
      logger.error(
        `❌ Erreur attribution professionnelle pour booking ${booking.getId()}:`,
        error
      );
      // Ne pas propager l'erreur pour ne pas affecter le paiement
    }
  }

  /**
   * Détermine le type de service pour l'attribution
   * 
   * @param booking - La réservation
   * @returns Le ServiceType déterminé
   */
  private async determineServiceType(booking: Booking): Promise<ServiceType> {
    const fallbackServiceType = bookingTypeMapper.mapBookingTypeToServiceType(
      booking.getType()
    );

    let quoteRequest: QuoteRequest | null = null;
    try {
      quoteRequest = await this.quoteRequestRepository.findByBookingId(
        booking.getId()!
      );
    } catch (error) {
      logger.warn(
        '⚠️ Impossible de récupérer le QuoteRequest, utilisation du fallback',
        error
      );
    }

    return serviceTypeExtractor.extractWithFallback(
      booking,
      quoteRequest,
      fallbackServiceType
    );
  }

  /**
   * Prépare les données d'attribution avec séparation complète/limitée (RGPD)
   * 
   * @param booking - La réservation
   * @returns Les données préparées pour l'attribution
   */
  private async prepareAttributionData(booking: Booking): Promise<any> {
    const customerContactInfo = booking.getCustomer().getContactInfo();
    const customerFullName = customerContactInfo.getFullName();
    const customerFirstName = customerContactInfo.getFirstName() || '';
    const scheduledDate =
      booking.getScheduledDate() ||
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const totalAmount = booking.getTotalAmount().getAmount();
    const locationAddress = (booking as any).locationAddress || 'Adresse à préciser';

    // Récupérer le facteur d'estimation depuis la configuration
    const estimationFactor = await this.getEstimationFactor();

    return {
      // Nouvelles données étendues pour le flux en 2 étapes
      bookingId: booking.getId(),
      bookingReference:
        (booking as any).reference ||
        `EQ-${booking.getId()?.slice(-8).toUpperCase()}`,
      serviceDate: scheduledDate,
      serviceTime: '09:00', // Heure par défaut
      priority: AttributionUtils.determinePriority(scheduledDate),

      // Données complètes (usage interne uniquement)
      fullClientData: {
        customerName: customerFullName,
        customerEmail: customerContactInfo.getEmail(),
        customerPhone: booking.getCustomer().getPhone(),
        fullPickupAddress: locationAddress,
        fullDeliveryAddress: (booking as any).deliveryAddress || undefined,
      },

      // Données limitées (pour prestataires - RGPD)
      limitedClientData: {
        customerName: `${customerFirstName.charAt(0)}. ${customerContactInfo.getLastName()}`.trim(),
        pickupAddress: AttributionUtils.extractCityFromAddress(locationAddress),
        deliveryAddress: (booking as any).deliveryAddress
          ? AttributionUtils.extractCityFromAddress((booking as any).deliveryAddress!)
          : undefined,
        serviceType: booking.getType() || 'CUSTOM',
        quoteDetails: {
          estimatedAmount: Math.round(totalAmount * estimationFactor),
          currency: 'EUR',
          serviceCategory: AttributionUtils.getServiceCategory(
            booking.getType() || 'CUSTOM'
          ),
        },
      },

      // Données existantes (pour compatibilité)
      totalAmount,
      scheduledDate,
      locationAddress,
      customerFirstName: customerContactInfo.getFirstName(),
      customerLastName: customerContactInfo.getLastName(),
      customerPhone: booking.getCustomer().getPhone(),
      additionalInfo: (booking as any).additionalInfo,
    };
  }

  /**
   * Récupère le facteur d'estimation depuis la configuration
   * 
   * @returns Le facteur d'estimation (par défaut 0.85)
   */
  private async getEstimationFactor(): Promise<number> {
    try {
      const factor = await this.unifiedDataService.getConfigurationValue(
        ConfigurationCategory.PRICING_FACTORS,
        PricingFactorsConfigKey.ESTIMATION_FACTOR,
        0.85
      );
      return factor;
    } catch (error) {
      logger.warn(
        '⚠️ Erreur récupération facteur estimation, utilisation fallback:',
        error
      );
      return 0.85; // Fallback hardcodé
    }
  }
}

