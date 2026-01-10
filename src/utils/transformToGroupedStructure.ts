/**
 * Transforme les données du formulaire en structure groupée et explicite
 *
 * AVANT (structure plate):
 * {
 *   pickupAddress: "...",
 *   pickupFloor: 8,
 *   pickupLogisticsConstraints: { "uuid1": true },
 *   additionalServices: { "uuid2": true }
 * }
 *
 * APRÈS (structure groupée):
 * {
 *   pickup: {
 *     address: "...",
 *     floor: 8,
 *     rules: [{ id: "uuid1", name: "Escalier difficile" }]
 *   },
 *   globalServices: [{ id: "uuid2", name: "Piano" }]
 * }
 */

import { getRuleName } from '@/lib/caches';

export interface RuleReference {
  id: string;
  name: string;
}

export interface AddressData {
  address: string;
  floor?: number;
  elevator?: string;
  carryDistance?: string;
  rules: RuleReference[];
}

export interface GroupedPricingData {
  // Données globales
  serviceType: string;
  volume?: number;
  distance?: number;
  scheduledDate?: string;
  duration?: number;
  workers?: number;
  defaultPrice?: number;

  // Données par adresse
  pickup?: AddressData;
  delivery?: AddressData;

  // Services globaux
  globalServices: RuleReference[];

  // Autres champs pass-through
  [key: string]: any;
}

/**
 * Enrichit un objet {uuid: true} avec les noms des règles
 * Utilise le cache global côté client
 */
export function enrichRulesWithNames(
  rulesObject: Record<string, boolean> | undefined
): RuleReference[] {
  if (!rulesObject || typeof rulesObject !== 'object') {
    return [];
  }

  const selectedIds = Object.keys(rulesObject).filter(key => rulesObject[key] === true);

  if (selectedIds.length === 0) {
    return [];
  }

  return selectedIds.map(id => ({
    id,
    name: getRuleName(id)  // Utilise le cache global de @/lib/caches
  }));
}

/**
 * Transforme les données plates du formulaire en structure groupée
 */
export function transformToGroupedStructure(
  formData: any
): GroupedPricingData {
  console.log('🔄 [transformToGroupedStructure] FormData reçu:', formData);
  console.log('🔄 [transformToGroupedStructure] Transformation des données:', {
    hasPickupAddress: !!formData.pickupAddress,
    hasDeliveryAddress: !!formData.deliveryAddress,
    hasPickupConstraints: !!formData.pickupLogisticsConstraints,
    hasDeliveryConstraints: !!formData.deliveryLogisticsConstraints,
    hasAdditionalServices: !!formData.additionalServices,
    pickupConstraintsValue: formData.pickupLogisticsConstraints,
    deliveryConstraintsValue: formData.deliveryLogisticsConstraints,
    additionalServicesValue: formData.additionalServices
  });

  // Enrichir les règles avec leurs noms depuis le cache
  const pickupRules = enrichRulesWithNames(formData.pickupLogisticsConstraints);
  const deliveryRules = enrichRulesWithNames(formData.deliveryLogisticsConstraints);
  const globalServices = enrichRulesWithNames(formData.additionalServices);

  console.log('🎯 [transformToGroupedStructure] Règles enrichies:', {
    pickupRules,
    deliveryRules,
    globalServices
  });

  // Construire la structure groupée
  const grouped: GroupedPricingData = {
    // Données globales
    serviceType: formData.serviceType,
    volume: formData.volume,
    distance: formData.distance,
    scheduledDate: formData.scheduledDate,
    duration: formData.duration,
    workers: formData.workers,
    defaultPrice: formData.defaultPrice,

    // Services globaux
    globalServices,

    // Garder les autres champs (promotions, etc.)
    promotionCode: formData.promotionCode,
    promotionValue: formData.promotionValue,
    promotionType: formData.promotionType,
    isPromotionActive: formData.isPromotionActive,
    __presetSnapshot: formData.__presetSnapshot
  };

  // Ajouter pickup si l'adresse existe
  if (formData.pickupAddress) {
    grouped.pickup = {
      address: formData.pickupAddress,
      floor: formData.pickupFloor,
      elevator: formData.pickupElevator,
      carryDistance: formData.pickupCarryDistance,
      rules: pickupRules
    };
  }

  // Ajouter delivery si l'adresse existe
  if (formData.deliveryAddress) {
    grouped.delivery = {
      address: formData.deliveryAddress,
      floor: formData.deliveryFloor,
      elevator: formData.deliveryElevator,
      carryDistance: formData.deliveryCarryDistance,
      rules: deliveryRules
    };
  }

  console.log('✅ [transformToGroupedStructure] Structure groupée créée:', {
    hasPickup: !!grouped.pickup,
    hasDelivery: !!grouped.delivery,
    pickupRulesCount: pickupRules.length,
    deliveryRulesCount: deliveryRules.length,
    globalServicesCount: globalServices.length
  });

  return grouped;
}

/**
 * Transforme la structure groupée vers la structure plate (pour rétrocompatibilité)
 */
export function transformToFlatStructure(grouped: GroupedPricingData): any {
  const flat: any = {
    serviceType: grouped.serviceType,
    volume: grouped.volume,
    distance: grouped.distance,
    scheduledDate: grouped.scheduledDate,
    duration: grouped.duration,
    workers: grouped.workers,
    defaultPrice: grouped.defaultPrice,

    // Promotions
    promotionCode: grouped.promotionCode,
    promotionValue: grouped.promotionValue,
    promotionType: grouped.promotionType,
    isPromotionActive: grouped.isPromotionActive,
    __presetSnapshot: grouped.__presetSnapshot
  };

  // Extraire pickup
  if (grouped.pickup) {
    flat.pickupAddress = grouped.pickup.address;
    flat.pickupFloor = grouped.pickup.floor;
    flat.pickupElevator = grouped.pickup.elevator;
    flat.pickupCarryDistance = grouped.pickup.carryDistance;

    // Convertir rules en format {uuid: true}
    flat.pickupLogisticsConstraints = grouped.pickup.rules.reduce((acc, rule) => {
      acc[rule.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }

  // Extraire delivery
  if (grouped.delivery) {
    flat.deliveryAddress = grouped.delivery.address;
    flat.deliveryFloor = grouped.delivery.floor;
    flat.deliveryElevator = grouped.delivery.elevator;
    flat.deliveryCarryDistance = grouped.delivery.carryDistance;

    // Convertir rules en format {uuid: true}
    flat.deliveryLogisticsConstraints = grouped.delivery.rules.reduce((acc, rule) => {
      acc[rule.id] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }

  // Extraire global services
  flat.additionalServices = grouped.globalServices.reduce((acc, service) => {
    acc[service.id] = true;
    return acc;
  }, {} as Record<string, boolean>);

  return flat;
}
