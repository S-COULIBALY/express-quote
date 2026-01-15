// ============================================================================
// USE FORM BUSINESS LOGIC - Express Quote
// ============================================================================
// Logique métier pour les formulaires.
// Seul le déménagement sur mesure est actif.
// ============================================================================

import { useState, useCallback } from 'react';
import { CatalogData } from '@/hooks/useCatalogPreFill';
import { devLog } from '@/lib/conditional-logger';

/**
 * Hook pour la logique métier des formulaires
 *
 * Responsabilités:
 * - Enrichissement des données formulaire (distance, validation)
 * - Fusion des contraintes (pickup/delivery → additionalServices)
 * - Gestion de l'état du formulaire
 *
 * NOTE: Seul le déménagement sur mesure est supporté.
 */
export const useFormBusinessLogic = (
  _catalogData: CatalogData,
  presetType: string
) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  /**
   * Enrichit les données du formulaire avec calculs automatiques
   */
  const enrichFormData = useCallback(async (currentFormData: Record<string, unknown>) => {
    let enrichedData = { ...currentFormData };

    // Calcul automatique de distance pour déménagement sur mesure
    if (presetType === 'demenagement-sur-mesure' &&
        currentFormData.pickupAddress &&
        currentFormData.deliveryAddress &&
        currentFormData.pickupAddress !== currentFormData.deliveryAddress) {

      devLog.debug('FormBusinessLogic', 'Calcul de distance requis');

      try {
        const { calculateDistance } = await import('@/actions/distanceCalculator');
        const calculatedDistance = await calculateDistance(
          currentFormData.pickupAddress as string,
          currentFormData.deliveryAddress as string
        );

        enrichedData.distance = calculatedDistance;
        devLog.debug('FormBusinessLogic', 'Distance calculée:', calculatedDistance, 'km');

      } catch (error) {
        devLog.error('Erreur calcul distance:', error);
        enrichedData.distance = 0;
      }
    }

    // Validation hasEnoughData
    const hasEnoughData = validateEnoughData(presetType, enrichedData);
    if (!hasEnoughData) {
      return enrichedData;
    }

    // Fusion des contraintes pickup/delivery
    enrichedData = fuseConstraints(enrichedData);

    return enrichedData;
  }, [presetType]);

  /**
   * Gère le changement d'un champ du formulaire
   */
  const handleFieldChange = useCallback(async (
    fieldName: string,
    value: unknown,
    allFormData: Record<string, unknown>
  ) => {
    devLog.debug('FormBusinessLogic', 'Field change:', fieldName);

    // Gérer les données séparées des modals pickup/delivery
    if (fieldName === 'pickupLogisticsConstraints' || fieldName === 'deliveryLogisticsConstraints') {
      if (value && typeof value === 'object' && ('addressConstraints' in value || 'globalServices' in value)) {
        devLog.debug('FormBusinessLogic', 'Fusion des règles séparées pour', fieldName);

        const { addressConstraints, globalServices } = value as {
          addressConstraints?: Record<string, unknown>;
          globalServices?: Record<string, unknown>;
        };

        // Mettre à jour les contraintes d'adresse
        allFormData[fieldName] = addressConstraints || {};

        // Fusionner les services globaux (éviter les doublons)
        const existingGlobalServices = (allFormData.additionalServices as Record<string, unknown>) || {};
        const mergedGlobalServices = { ...existingGlobalServices, ...globalServices };
        allFormData.additionalServices = mergedGlobalServices;

        devLog.debug('FormBusinessLogic', 'Règles fusionnées:', {
          [fieldName]: Object.keys((allFormData[fieldName] as Record<string, unknown>) || {}),
          additionalServices: Object.keys((allFormData.additionalServices as Record<string, unknown>) || {})
        });
      }
    }

    const enriched = await enrichFormData(allFormData);
    setFormData(enriched);
    return enriched;
  }, [enrichFormData]);

  return {
    formData,
    handleFieldChange,
    enrichFormData
  };
};

/**
 * Valide si on a assez de données pour calculer le prix
 */
function validateEnoughData(presetType: string, data: Record<string, unknown>): boolean {
  // Seul le déménagement sur mesure est supporté
  if (presetType === 'demenagement-sur-mesure') {
    return !!(data.scheduledDate && data.pickupAddress && data.deliveryAddress);
  }
  // Fallback pour d'autres types (compatibilité)
  return !!(data.scheduledDate);
}

/**
 * Fusionne les contraintes pickup/delivery en format plat
 */
function fuseConstraints(data: Record<string, unknown>): Record<string, unknown> {
  const fusedData = { ...data };

  // Initialiser les objets de services
  if (!fusedData.pickupServices) fusedData.pickupServices = {};
  if (!fusedData.deliveryServices) fusedData.deliveryServices = {};

  // Fusionner pickupLogisticsConstraints
  const pickupConstraints = Array.isArray(fusedData.pickupLogisticsConstraints)
    ? fusedData.pickupLogisticsConstraints
    : [];

  const deliveryConstraints = Array.isArray(fusedData.deliveryLogisticsConstraints)
    ? fusedData.deliveryLogisticsConstraints
    : [];

  // Mapper vers les objets de services
  const pickupServices = fusedData.pickupServices as Record<string, boolean>;
  const deliveryServices = fusedData.deliveryServices as Record<string, boolean>;

  for (const constraint of pickupConstraints) {
    if (typeof constraint === 'string') {
      pickupServices[constraint] = true;
    }
  }

  for (const constraint of deliveryConstraints) {
    if (typeof constraint === 'string') {
      deliveryServices[constraint] = true;
    }
  }

  fusedData.pickupServices = pickupServices;
  fusedData.deliveryServices = deliveryServices;

  return fusedData;
}
