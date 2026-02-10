import { SubmissionConfig } from '@/utils/submissionUtils';

/**
 * Type pour les données du service déménagement sur mesure
 * Utilisé pour la configuration de soumission
 */
export interface DemenagementSurMesureData {
  id: string;
  name: string;
  description: string;
  catalogId?: string;
  isPremium?: boolean;
  requiresVolume?: boolean;
  requiresCustomPricing?: boolean;
  __presetSnapshot?: Record<string, unknown>;
}

export interface DemenagementSurMesureSubmissionExtraData {
  service: DemenagementSurMesureData;
  distance?: number;
}

export const createDemenagementSurMesureSubmissionConfig = (
  service: DemenagementSurMesureData,
  distance: number = 0
): SubmissionConfig => ({
  submissionType: 'MOVING_PREMIUM',

  validateFormData: (formData: Record<string, unknown>) => {
    // Validation de la date (supporte les deux noms de champs)
    const date = formData.dateSouhaitee || formData.scheduledDate;
    if (!date) {
      return 'Veuillez remplir la date souhaitée.';
    }

    // Validation des adresses (supporte les alias : pickupAddress / adresseDepart, etc.)
    const pickupAddr = formData.pickupAddress || formData.adresseDepart || formData.departureAddress;
    const deliveryAddr = formData.deliveryAddress || formData.adresseArrivee || formData.arrivalAddress;
    if (!pickupAddr || !deliveryAddr) {
      return 'Veuillez remplir les adresses de départ et d\'arrivée.';
    }

    return true;
  },

  prepareRequestData: (formData: Record<string, unknown>, extraData?: unknown) => {
    const extra = extraData as DemenagementSurMesureSubmissionExtraData | undefined;

    return {
      // Données du service sur mesure
      serviceId: service.id,
      serviceType: 'MOVING_PREMIUM',
      catalogId: service.catalogId,

      // Volume (calculateur V3)
      estimatedVolume: formData.estimatedVolume,

      // Planification (supporte alias dateSouhaitee / scheduledDate)
      scheduledDate: formData.dateSouhaitee || formData.scheduledDate,
      flexibilite: formData.flexibilite,
      horaire: formData.horaire,

      // Adresses (supporte alias pickupAddress / adresseDepart / departureAddress)
      pickupAddress: formData.pickupAddress || formData.adresseDepart || formData.departureAddress,
      deliveryAddress: formData.deliveryAddress || formData.adresseArrivee || formData.arrivalAddress,
      pickupPostalCode: formData.pickupPostalCode,
      pickupCity: formData.pickupCity,
      deliveryPostalCode: formData.deliveryPostalCode,
      deliveryCity: formData.deliveryCity,
      distanceEstimee: extra?.distance || distance,

      // Contraintes logistiques (noms cohérents avec le formulaire)
      pickupFloor: parseInt(String(formData.pickupFloor)) || 0,
      deliveryFloor: parseInt(String(formData.deliveryFloor)) || 0,
      pickupElevator: formData.pickupElevator,
      deliveryElevator: formData.deliveryElevator,
      pickupCarryDistance: formData.pickupCarryDistance,
      deliveryCarryDistance: formData.deliveryCarryDistance,
      pickupFurnitureLift: formData.pickupFurnitureLift,
      deliveryFurnitureLift: formData.deliveryFurnitureLift,
      pickupLogistics: formData.pickupLogistics,
      deliveryLogistics: formData.deliveryLogistics,

      // Stockage temporaire
      storageDurationDays: formData.storageDurationDays,

      // Services cross-selling (injectés depuis CrossSellingContext à la soumission)
      packing: formData.packing,
      dismantling: formData.dismantling,
      reassembly: formData.reassembly,
      cleaningEnd: formData.cleaningEnd,
      temporaryStorage: formData.temporaryStorage,
      piano: formData.piano,
      safe: formData.safe,
      artwork: formData.artwork,
      crossSellingSuppliesTotal: formData.crossSellingSuppliesTotal,
      crossSellingSuppliesDetails: formData.crossSellingSuppliesDetails,
      crossSellingServicesTotal: formData.crossSellingServicesTotal,
      crossSellingGrandTotal: formData.crossSellingGrandTotal,

      // Informations supplémentaires
      additionalInfo: formData.additionalInfo,

      // Contact
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone,

      // Prix et calculs
      calculatedPrice: formData.calculatedPrice || 0,
      totalPrice: formData.totalPrice || 0,
      selectedScenario: formData.selectedScenario,
      isDynamicPricing: true,

      // Options assurance/protection (gérées dans PaymentPriceSection)
      fragileProtection: formData.fragileProtection,
      fragileProtectionAmount: formData.fragileProtectionAmount,
      declaredValueInsurance: formData.declaredValueInsurance,
      declaredValue: formData.declaredValue,
      insurancePremium: formData.insurancePremium,

      // Données du service
      serviceName: service.name,
      serviceDescription: service.description,
      isPremium: service.isPremium,
      requiresVolume: service.requiresVolume,
      requiresCustomPricing: service.requiresCustomPricing
    };
  },

  getSuccessRedirectUrl: (responseData: Record<string, unknown>) => {
    const temporaryId = responseData.temporaryId as string | undefined;
    const id = responseData.id as string | undefined;
    return `/booking/${temporaryId || id}`;
  },

  getNotificationData: (formData: Record<string, unknown>) => {
    const pickupAddr = formData.pickupAddress || formData.adresseDepart || formData.departureAddress;
    const deliveryAddr = formData.deliveryAddress || formData.adresseArrivee || formData.arrivalAddress;
    const date = formData.dateSouhaitee || formData.scheduledDate;
    const volume = formData.estimatedVolume;
    const scenario = formData.selectedScenario || 'STANDARD';

    // Services inclus selon le scénario sélectionné et les sélections cross-selling
    const servicesInclus: string[] = [];
    if (formData.packing) servicesInclus.push('Emballage');
    if (formData.dismantling) servicesInclus.push('Démontage');
    if (formData.reassembly) servicesInclus.push('Remontage');
    if (formData.cleaningEnd) servicesInclus.push('Nettoyage');
    if (formData.temporaryStorage || formData.storageDurationDays) servicesInclus.push('Stockage');
    if (formData.declaredValueInsurance) servicesInclus.push('Assurance');
    if (formData.fragileProtection) servicesInclus.push('Protection fragiles');

    return {
      serviceDate: date,
      serviceAddress: `${pickupAddr} → ${deliveryAddr}`,
      additionalDetails: `Volume: ${volume ? `${volume} m³` : 'À estimer'}, Formule: ${scenario}${servicesInclus.length > 0 ? `, Services: ${servicesInclus.join(', ')}` : ''}${formData.storageDurationDays ? `, Stockage: ${formData.storageDurationDays} jours` : ''}`
    };
  }
});
