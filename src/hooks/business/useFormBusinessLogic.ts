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
 * Extrait de DetailForm.tsx pour réduire la complexité
 */
export const useFormBusinessLogic = (
  catalogData: CatalogData,
  presetType: string
) => {
  const [formData, setFormData] = useState<any>({});

  /**
   * Enrichit les données du formulaire avec calculs automatiques
   */
  const enrichFormData = useCallback(async (currentFormData: any) => {
    let enrichedData = { ...currentFormData };

    // 1. Calcul automatique de distance pour Moving/Delivery
    if ((presetType === 'catalogueMovingItem-service' ||
         presetType === 'catalogueDeliveryItem-service') &&
        currentFormData.pickupAddress &&
        currentFormData.deliveryAddress &&
        currentFormData.pickupAddress !== currentFormData.deliveryAddress) {

      devLog.debug('FormBusinessLogic', 'Calcul de distance requis');

      try {
        const { calculateDistance } = await import('@/actions/distanceCalculator');
        const calculatedDistance = await calculateDistance(
          currentFormData.pickupAddress,
          currentFormData.deliveryAddress
        );

        enrichedData.distance = calculatedDistance;
        devLog.debug('FormBusinessLogic', 'Distance calculée:', calculatedDistance, 'km');

      } catch (error) {
        devLog.error('Erreur calcul distance:', error);
        enrichedData.distance = 0;
      }
    }

    // 2. Validation hasEnoughData
    const hasEnoughData = validateEnoughData(presetType, enrichedData);
    if (!hasEnoughData) {
      return enrichedData;
    }

    // 3. Fusion des contraintes pickup/delivery
    enrichedData = fuseConstraints(enrichedData, presetType);

    return enrichedData;
  }, [presetType]);

  /**
   * Gère le changement d'un champ du formulaire
   */
  const handleFieldChange = useCallback(async (
    fieldName: string,
    value: any,
    allFormData: any
  ) => {
    devLog.debug('FormBusinessLogic', 'Field change:', fieldName);

    // Gérer les données séparées des modals pickup/delivery
    if (fieldName === 'pickupLogisticsConstraints' || fieldName === 'deliveryLogisticsConstraints') {
      if (value && typeof value === 'object' && ('addressConstraints' in value || 'globalServices' in value)) {
        devLog.debug('FormBusinessLogic', 'Fusion des règles séparées pour', fieldName);

        const { addressConstraints, globalServices } = value;

        // Mettre à jour les contraintes d'adresse
        allFormData[fieldName] = addressConstraints || {};

        // Fusionner les services globaux (éviter les doublons)
        const existingGlobalServices = allFormData.additionalServices || {};
        const mergedGlobalServices = { ...existingGlobalServices, ...globalServices };
        allFormData.additionalServices = mergedGlobalServices;

        devLog.debug('FormBusinessLogic', 'Règles fusionnées:', {
          [fieldName]: Object.keys(allFormData[fieldName] || {}),
          additionalServices: Object.keys(allFormData.additionalServices || {})
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
function validateEnoughData(presetType: string, data: any): boolean {
  if (presetType === 'catalogueMovingItem-service') {
    return !!(data.scheduledDate && data.pickupAddress && data.deliveryAddress);
  }
  return !!(data.scheduledDate && data.location);
}

/**
 * Fusionne les contraintes pickup/delivery en format plat
 */
function fuseConstraints(data: any, presetType: string): any {
  if (presetType !== 'catalogueMovingItem-service' &&
      presetType !== 'catalogueDeliveryItem-service') {
    return data;
  }

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
  for (const constraint of pickupConstraints) {
    if (typeof constraint === 'string') {
      fusedData.pickupServices[constraint] = true;
    }
  }

  for (const constraint of deliveryConstraints) {
    if (typeof constraint === 'string') {
      fusedData.deliveryServices[constraint] = true;
    }
  }

  return fusedData;
}
