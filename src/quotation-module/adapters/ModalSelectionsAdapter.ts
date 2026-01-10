/**
 * ModalSelectionsAdapter - Adaptateur pour convertir les sélections des modals en QuoteContext
 * 
 * Rôle : Mapper les sélections des modals (addressConstraints, addressServices, globalServices)
 * vers les champs QuoteContext utilisés par les modules du moteur de devis.
 */

import { QuoteContext } from '../core/QuoteContext';

/**
 * Structure des sélections du modal
 */
export interface ModalSelections {
  pickup?: {
    addressConstraints?: Record<string, boolean>;
    addressServices?: Record<string, boolean>;
    globalServices?: Record<string, boolean>;
  };
  delivery?: {
    addressConstraints?: Record<string, boolean>;
    addressServices?: Record<string, boolean>;
    globalServices?: Record<string, boolean>;
  };
  // Services globaux partagés (piano, stockage)
  globalServices?: Record<string, boolean>;
}

/**
 * IDs des services dans modal-data.ts
 */
const SERVICE_IDS = {
  // Services objets spéciaux
  PIANO: 'service-8', // Transport piano
  SAFE: 'service-10', // Objets très lourds
  ARTWORK: 'service-4', // Emballage œuvres d'art
  BULKY_FURNITURE: 'service-7', // Meubles encombrants
  DISMANTLING: 'service-5', // Démontage de meubles
  REASSEMBLY: 'service-6', // Remontage de meubles
  
  // Services additionnels
  PACKING_DEPARTURE: 'service-1', // Emballage professionnel départ
  UNPACKING_ARRIVAL: 'service-2', // Déballage professionnel arrivée
  CLEANING_END: 'service-13', // Nettoyage après déménagement
  STORAGE: 'service-14', // Stockage temporaire
  
  // Autres services
  PACKING_SUPPLIES: 'service-3', // Fournitures d'emballage
  INVENTORY: 'service-11', // Inventaire avec photos
  ADMINISTRATIVE: 'service-15', // Gestion administrative
  PETS: 'service-16', // Transport animaux
  MONTE_MEUBLE: 'service-12', // Monte-meuble
} as const;

/**
 * Convertit les sélections des modals en QuoteContext partiel
 * 
 * @param modalSelections Sélections des modals (pickup, delivery, globalServices)
 * @returns QuoteContext partiel avec les champs mappés depuis les modals
 */
export function modalSelectionsToQuoteContext(
  modalSelections: ModalSelections
): Partial<QuoteContext> {
  const ctx: Partial<QuoteContext> = {};

  // Fusionner tous les services globaux (pickup, delivery, global)
  const allGlobalServices: Record<string, boolean> = {
    ...modalSelections.globalServices,
    ...modalSelections.pickup?.globalServices,
    ...modalSelections.delivery?.globalServices,
  };

  // Fusionner les services d'adresse (pickup + delivery)
  const allAddressServices: Record<string, boolean> = {
    ...modalSelections.pickup?.addressServices,
    ...modalSelections.delivery?.addressServices,
  };

  // ============================================================================
  // OBJETS SPÉCIAUX
  // ============================================================================

  // Piano (service global)
  if (allGlobalServices[SERVICE_IDS.PIANO] || allAddressServices[SERVICE_IDS.PIANO]) {
    ctx.piano = true;
  }

  // Coffre-fort / Objets très lourds (service global ou adresse)
  if (allGlobalServices[SERVICE_IDS.SAFE] || allAddressServices[SERVICE_IDS.SAFE]) {
    ctx.safe = true;
  }

  // Œuvres d'art (service adresse, généralement pickup)
  if (allAddressServices[SERVICE_IDS.ARTWORK] || modalSelections.pickup?.addressServices?.[SERVICE_IDS.ARTWORK]) {
    ctx.artwork = true;
  }

  // Meubles encombrants (service global ou adresse)
  if (allGlobalServices[SERVICE_IDS.BULKY_FURNITURE] || allAddressServices[SERVICE_IDS.BULKY_FURNITURE]) {
    ctx.bulkyFurniture = true;
  }

  // Démontage de meubles (service pickup)
  if (modalSelections.pickup?.addressServices?.[SERVICE_IDS.DISMANTLING]) {
    // Note: builtInAppliances pourrait être déduit du démontage
    // Pour l'instant, on ne le mappe pas automatiquement
  }

  // Remontage de meubles (service delivery)
  if (modalSelections.delivery?.addressServices?.[SERVICE_IDS.REASSEMBLY]) {
    // Note: pourrait être utilisé pour déduire unpacking
  }

  // ============================================================================
  // SERVICES ADDITIONNELS
  // ============================================================================

  // Emballage professionnel départ (service pickup)
  if (modalSelections.pickup?.addressServices?.[SERVICE_IDS.PACKING_DEPARTURE]) {
    ctx.packing = true;
  }

  // Déballage professionnel arrivée (service delivery)
  if (modalSelections.delivery?.addressServices?.[SERVICE_IDS.UNPACKING_ARRIVAL]) {
    ctx.unpacking = true;
  }

  // Nettoyage après déménagement (service pickup)
  if (modalSelections.pickup?.addressServices?.[SERVICE_IDS.CLEANING_END]) {
    ctx.cleaningEnd = true;
  }

  // Stockage temporaire (service global)
  if (allGlobalServices[SERVICE_IDS.STORAGE]) {
    ctx.temporaryStorage = true;
    // Note: storageDurationDays doit être saisi séparément dans le formulaire
    // car c'est une valeur numérique qui ne peut pas être dans le modal
  }

  // ============================================================================
  // CONTRAINTES (pour référence future)
  // ============================================================================

  // Les contraintes sont stockées mais ne sont pas directement mappées dans QuoteContext
  // Elles sont utilisées par les modules pour calculer les surcoûts
  // Exemple: pickupStreetNarrow, deliveryParkingAuthorizationRequired, etc.
  // Ces champs pourraient être mappés si nécessaire dans le futur

  return ctx;
}

/**
 * Vérifie si un service spécifique est sélectionné dans les modals
 * 
 * @param modalSelections Sélections des modals
 * @param serviceId ID du service (ex: 'service-8' pour piano)
 * @returns true si le service est sélectionné
 */
export function isServiceSelected(
  modalSelections: ModalSelections,
  serviceId: string
): boolean {
  const allGlobalServices: Record<string, boolean> = {
    ...modalSelections.globalServices,
    ...modalSelections.pickup?.globalServices,
    ...modalSelections.delivery?.globalServices,
  };

  const allAddressServices: Record<string, boolean> = {
    ...modalSelections.pickup?.addressServices,
    ...modalSelections.delivery?.addressServices,
  };

  return !!(allGlobalServices[serviceId] || allAddressServices[serviceId]);
}

/**
 * Obtient tous les IDs de services sélectionnés
 * 
 * @param modalSelections Sélections des modals
 * @returns Array d'IDs de services sélectionnés
 */
export function getSelectedServiceIds(modalSelections: ModalSelections): string[] {
  const allGlobalServices: Record<string, boolean> = {
    ...modalSelections.globalServices,
    ...modalSelections.pickup?.globalServices,
    ...modalSelections.delivery?.globalServices,
  };

  const allAddressServices: Record<string, boolean> = {
    ...modalSelections.pickup?.addressServices,
    ...modalSelections.delivery?.addressServices,
  };

  const allServices = { ...allGlobalServices, ...allAddressServices };
  return Object.keys(allServices).filter(id => allServices[id] === true);
}

