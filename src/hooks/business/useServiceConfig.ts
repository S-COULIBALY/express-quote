import { useMemo } from 'react';
import { CatalogData } from '@/hooks/useCatalogPreFill';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import {
  getDemenagementSurMesureServiceConfig,
  getMenageSurMesureServiceConfig,
  getCatalogueMovingItemConfig,
  getCatalogueCleaningItemConfig,
  getCatalogueDeliveryItemServiceConfig
} from '@/components/form-generator';
import {
  transformCatalogDataToCatalogueMovingItem,
  transformCatalogDataToCatalogueCleaningItem,
  transformCatalogDataToCatalogueDeliveryItem,
  transformCatalogDataToDemenagementSurMesure,
  transformCatalogDataToMenageSurMesure
} from '@/utils/catalogTransformers';
import {
  createCatalogueMovingItemSubmissionConfig,
  createCatalogueCleaningItemSubmissionConfig,
  createCatalogueDeliveryItemSubmissionConfig,
  createDemenagementSurMesureSubmissionConfig,
  createMenageSurMesureSubmissionConfig
} from '@/hooks/business';

/**
 * Hook pour la configuration du service
 *
 * Responsabilités:
 * - Déterminer le bon preset selon la catégorie
 * - Transformer les données du catalogue
 * - Retourner la config complète (form + submission + serviceType)
 *
 * Extrait de DetailForm.tsx pour réduire la complexité
 */
export const useServiceConfig = (
  presetType: string,
  catalogData: CatalogData,
  distance: number = 0
) => {
  // Sélectionner le mapping de configuration
  const config = useMemo(() => {
    const mapping = CONFIG_MAPPINGS[presetType];

    if (!mapping) {
      console.error(`Preset inconnu: ${presetType}, fallback sur cleaning`);
      return CONFIG_MAPPINGS['catalogueCleaningItem-service'];
    }

    return mapping;
  }, [presetType]);

  // Transformer les données du catalogue
  const transformedData = useMemo(() => {
    try {
      return config.transformer(catalogData);
    } catch (error) {
      console.error('useServiceConfig: Erreur lors de la transformation des données', error);
      return null;
    }
  }, [config, catalogData.catalogSelection.id, catalogData.item?.id]);

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
 * Configuration mapping consolidée
 * Remplace le gigantesque switch case de DetailForm.tsx
 */
const CONFIG_MAPPINGS = {
  'catalogueMovingItem-service': {
    getConfig: getCatalogueMovingItemConfig,
    transformer: transformCatalogDataToCatalogueMovingItem,
    createSubmissionConfig: createCatalogueMovingItemSubmissionConfig,
    serviceType: ServiceType.PACKING
  },
  'catalogueCleaningItem-service': {
    getConfig: getCatalogueCleaningItemConfig,
    transformer: transformCatalogDataToCatalogueCleaningItem,
    createSubmissionConfig: createCatalogueCleaningItemSubmissionConfig,
    serviceType: ServiceType.CLEANING
  },
  'catalogueDeliveryItem-service': {
    getConfig: getCatalogueDeliveryItemServiceConfig,
    transformer: transformCatalogDataToCatalogueDeliveryItem,
    createSubmissionConfig: createCatalogueDeliveryItemSubmissionConfig,
    serviceType: ServiceType.DELIVERY
  },
  'demenagement-sur-mesure': {
    getConfig: getDemenagementSurMesureServiceConfig,
    transformer: transformCatalogDataToDemenagementSurMesure,
    createSubmissionConfig: createDemenagementSurMesureSubmissionConfig,
    serviceType: ServiceType.MOVING_PREMIUM
  },
  'menage-sur-mesure': {
    getConfig: getMenageSurMesureServiceConfig,
    transformer: transformCatalogDataToMenageSurMesure,
    createSubmissionConfig: createMenageSurMesureSubmissionConfig,
    serviceType: ServiceType.CLEANING_PREMIUM
  }
} as const;
