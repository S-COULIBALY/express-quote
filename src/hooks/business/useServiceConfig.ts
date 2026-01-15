// ============================================================================
// USE SERVICE CONFIG - Express Quote
// ============================================================================
// Seul le service DEMENAGEMENT SUR MESURE est actif.
// Les services CLEANING, DELIVERY, PACKING, MOVING (packs catalogue) ont été abandonnés.
// Voir: docs/PLAN_REFACTORISATION_ANCIEN_SYSTEME.md
// ============================================================================

import { useMemo } from 'react';
import { CatalogData } from '@/hooks/useCatalogPreFill';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { getDemenagementSurMesureServiceConfig } from '@/components/form-generator';
import { transformCatalogDataToDemenagementSurMesure } from '@/utils/catalogTransformers';
import { createDemenagementSurMesureSubmissionConfig } from '@/hooks/business';

/**
 * Hook pour la configuration du service
 *
 * Responsabilités:
 * - Déterminer le bon preset selon la catégorie
 * - Transformer les données du catalogue
 * - Retourner la config complète (form + submission + serviceType)
 *
 * NOTE: Seul le déménagement sur mesure est supporté.
 */
export const useServiceConfig = (
  presetType: string,
  catalogData: CatalogData,
  distance: number = 0
) => {
  // Sélectionner le mapping de configuration (seul demenagement-sur-mesure est actif)
  const config = useMemo(() => {
    if (presetType !== 'demenagement-sur-mesure') {
      console.warn(`Preset "${presetType}" non supporté, utilisation de demenagement-sur-mesure`);
    }
    return CONFIG_MAPPING;
  }, [presetType]);

  // Transformer les données du catalogue
  const transformedData = useMemo(() => {
    try {
      return config.transformer(catalogData);
    } catch (error) {
      console.error('useServiceConfig: Erreur lors de la transformation des données', error);
      return null;
    }
  }, [config, catalogData.catalogSelection?.id, catalogData.item?.id]);

  // Générer la config du formulaire
  const formConfig = useMemo(() => {
    if (!transformedData) {
      console.error('useServiceConfig: transformedData est null, impossible de générer formConfig');
      return null;
    }
    try {
      return config.getConfig(transformedData);
    } catch (error) {
      console.error('useServiceConfig: Erreur lors de la génération de formConfig', error);
      return null;
    }
  }, [config, transformedData]);

  // Générer la config de soumission
  const submissionConfig = useMemo(() => {
    if (!transformedData) return null;
    return config.createSubmissionConfig(transformedData, distance);
  }, [config, transformedData, distance]);

  return {
    formConfig,
    submissionConfig,
    serviceType: config.serviceType,
    transformedData
  };
};

/**
 * Configuration pour le déménagement sur mesure (seul service actif)
 */
const CONFIG_MAPPING = {
  getConfig: getDemenagementSurMesureServiceConfig,
  transformer: transformCatalogDataToDemenagementSurMesure,
  createSubmissionConfig: createDemenagementSurMesureSubmissionConfig,
  serviceType: ServiceType.MOVING_PREMIUM
};
