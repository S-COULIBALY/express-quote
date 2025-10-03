// Import des presets
import { MovingPreset, movingSummaryConfig, movingDefaultValues, movingStyles } from "./moving-service/movingPresets";
import { CleaningPreset, cleaningSummaryConfig, cleaningDefaultValues, cleaningStyles } from "./cleaning-service/cleaningPresets";
import { CatalogueMovingItemPreset, catalogueMovingItemSummaryConfig, catalogueMovingItemDefaultValues, catalogueMovingItemStyles } from "./catalogueMovingItem-service/catalogueMovingItemPresets";
import { CatalogueCleaningItemPreset, catalogueCleaningItemSummaryConfig, catalogueCleaningItemDefaultValues, catalogueCleaningItemStyles } from "./catalogueCleaningItem-service/catalogueCleaningItemPresets";
import { CatalogueDeliveryItemPreset, catalogueDeliveryItemSummaryConfig, catalogueDeliveryItemDefaultValues, catalogueDeliveryItemStyles } from "./catalogueDeliveryItem-service/catalogueDeliveryItemPresets";
import { ContactPreset, contactSummaryConfig, contactDefaultValues, contactStyles } from "./contact";
import { DefaultPreset, defaultSummaryConfig, defaultValues, defaultStyles } from "./_shared/default";
import { demenagementSurMesureSummaryConfig, demenagementSurMesureDefaultValues, demenagementSurMesureStyles } from "./demenagement-sur-mesure-service";
import { menageSurMesureSummaryConfig, menageSurMesureDefaultValues, menageSurMesureStyles } from "./menage-sur-mesure-service";
import { globalFormPreset, mergeWithGlobalPreset } from "./_shared/globalPreset";
import { IndustryPreset, PresetConfig, FormSummaryConfig } from "../types";

// Import des nouveaux presets sur mesure
import { DemenagementSurMesurePreset, getDemenagementSurMesureServiceConfig } from "./demenagement-sur-mesure-service";
import { MenageSurMesurePreset, getMenageSurMesureServiceConfig } from "./menage-sur-mesure-service";

// 🆕 Import des nouvelles utilitaires partagées
import * as SharedFields from "./_shared/sharedFields";
import * as SharedValidation from "./_shared/sharedValidation";

// Export des presets complets
export { MovingPreset, CleaningPreset, CatalogueMovingItemPreset, CatalogueCleaningItemPreset, CatalogueDeliveryItemPreset, ContactPreset, DefaultPreset };

// Export des nouveaux presets sur mesure
export { 
  DemenagementSurMesurePreset, 
  MenageSurMesurePreset,
  getDemenagementSurMesureServiceConfig,
  getMenageSurMesureServiceConfig
};

// 🌍 Export du preset global et de ses utilitaires
export { globalFormPreset, mergeWithGlobalPreset };

// 🆕 Export des utilitaires partagées
export { SharedFields, SharedValidation };

// Export du preset catalogueCleaningItem-service
export * from './catalogueCleaningItem-service';

// Export des nouveaux presets spécialisés
export * from './moving-service';
export * from './cleaning-service';
export * from './catalogueMovingItem-service';
export * from './catalogueDeliveryItem-service';

// Export des nouveaux presets sur mesure
export * from './demenagement-sur-mesure-service';
export * from './menage-sur-mesure-service';

// Export des configurations individuelles pour compatibilité
export { 
  movingSummaryConfig,
  cleaningSummaryConfig, 
  catalogueMovingItemSummaryConfig,
  catalogueCleaningItemSummaryConfig,
  catalogueDeliveryItemSummaryConfig,
  contactSummaryConfig, 
  defaultSummaryConfig,
  movingDefaultValues,
  cleaningDefaultValues,
  catalogueMovingItemDefaultValues,
  catalogueCleaningItemDefaultValues,
  catalogueDeliveryItemDefaultValues,
  contactDefaultValues,
  defaultValues,
  movingStyles,
  cleaningStyles,
  catalogueMovingItemStyles,
  catalogueCleaningItemStyles,
  catalogueDeliveryItemStyles,
  contactStyles,
  defaultStyles
};

// Export des données des presets pour usage indépendant
export const presetData = {
  moving: {
    summary: movingSummaryConfig,
    defaults: movingDefaultValues,
    styles: movingStyles
  },
  cleaning: {
    summary: cleaningSummaryConfig,
    defaults: cleaningDefaultValues,
    styles: cleaningStyles
  },
  catalogueMovingItem: {
    summary: catalogueMovingItemSummaryConfig,
    defaults: catalogueMovingItemDefaultValues,
    styles: catalogueMovingItemStyles
  },
  catalogueCleaningItem: {
    summary: catalogueCleaningItemSummaryConfig,
    defaults: catalogueCleaningItemDefaultValues,
    styles: catalogueCleaningItemStyles
  },
  catalogueDeliveryItem: {
    summary: catalogueDeliveryItemSummaryConfig,
    defaults: catalogueDeliveryItemDefaultValues,
    styles: catalogueDeliveryItemStyles
  },
  contact: {
    summary: contactSummaryConfig,
    defaults: contactDefaultValues,
    styles: contactStyles
  },
  'demenagement-sur-mesure': {
    summary: demenagementSurMesureSummaryConfig,
    defaults: demenagementSurMesureDefaultValues,
    styles: demenagementSurMesureStyles
  },
  'menage-sur-mesure': {
    summary: menageSurMesureSummaryConfig,
    defaults: menageSurMesureDefaultValues,
    styles: menageSurMesureStyles
  },
  default: {
    summary: defaultSummaryConfig,
    defaults: defaultValues,
    styles: defaultStyles
  }
};

// Fonction helper pour obtenir les données d'un preset
export const getPresetData = (industry: IndustryPreset) => {
  return presetData[industry] || presetData.default;
};

// Fonction helper pour obtenir un preset complet
export const getPreset = (industry: IndustryPreset): PresetConfig => {
  switch (industry) {
    case 'moving':
      return MovingPreset;
    case 'cleaning':
      return CleaningPreset;
    case 'catalogueMovingItem':
      return CatalogueMovingItemPreset;
    case 'catalogueCleaningItem':
      return CatalogueCleaningItemPreset;
    case 'catalogueDeliveryItem':
      return CatalogueDeliveryItemPreset;
    case 'demenagement-sur-mesure':
      return DemenagementSurMesurePreset;
    case 'menage-sur-mesure':
      return MenageSurMesurePreset;
    case 'contact':
      return ContactPreset;
    default:
      return DefaultPreset;
  }
};

// Fonction helper pour obtenir seulement la configuration de summary
export const getPresetSummary = (industry: IndustryPreset): FormSummaryConfig => {
  return getPresetData(industry).summary;
};

// Fonction helper pour obtenir seulement les valeurs par défaut
export const getPresetDefaults = (industry: IndustryPreset): Record<string, any> => {
  return getPresetData(industry).defaults;
};

// Fonction helper pour obtenir seulement les styles
export const getPresetStyles = (industry: IndustryPreset): string => {
  return getPresetData(industry).styles;
};

// Liste de tous les presets disponibles
export const availablePresets: Array<{ id: IndustryPreset; name: string; description: string; category: 'premium' | 'catalogue' | 'default' | 'sur-mesure' }> = [
  // Services Premium
  {
    id: "moving",
    name: "Déménagement Premium",
    description: "Service complet de déménagement avec adresses pickup/delivery",
    category: "premium"
  },
  {
    id: "cleaning",
    name: "Nettoyage Premium",
    description: "Service complet de nettoyage professionnel",
    category: "premium"
  },
  // Services du Catalogue
  {
    id: "catalogueMovingItem",
    name: "Pack Déménagement",
    description: "Éléments de déménagement du catalogue (packs prédéfinis)",
    category: "catalogue"
  },
  {
    id: "catalogueCleaningItem",
    name: "Service Nettoyage",
    description: "Éléments de nettoyage du catalogue (services sur mesure)",
    category: "catalogue"
  },
  {
    id: "catalogueDeliveryItem",
    name: "Service Livraison",
    description: "Éléments de livraison du catalogue (transport/livraison)",
    category: "catalogue"
  },
  // Services Sur Mesure
  {
    id: "demenagement-sur-mesure",
    name: "Déménagement Sur Mesure",
    description: "Service de déménagement personnalisé selon vos besoins",
    category: "sur-mesure"
  },
  {
    id: "menage-sur-mesure",
    name: "Ménage Sur Mesure",
    description: "Service de nettoyage personnalisé selon vos besoins",
    category: "sur-mesure"
  },
  // Defaults
  {
    id: "contact",
    name: "Contact",
    description: "Formulaires de contact et demandes d'information",
    category: "default"
  },
  {
    id: "default",
    name: "Générique",
    description: "Preset par défaut pour tous types de formulaires",
    category: "default"
  }
];

// Helpers pour distinguer les services premium des services du catalogue
export const getPremiumServices = () => availablePresets.filter(p => p.category === 'premium');
export const getCatalogueServices = () => availablePresets.filter(p => p.category === 'catalogue');
export const getDefaultServices = () => availablePresets.filter(p => p.category === 'default');

export const isPresetPremium = (industry: IndustryPreset): boolean => {
  return availablePresets.find(p => p.id === industry)?.category === 'premium';
};

export const isPresetCatalogue = (industry: IndustryPreset): boolean => {
  return availablePresets.find(p => p.id === industry)?.category === 'catalogue';
};