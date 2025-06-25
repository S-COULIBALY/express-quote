// Import des presets
import { MovingPreset, movingSummaryConfig, movingDefaultValues, movingStyles } from "./moving-service/movingPresets";
import { PackPreset, packSummaryConfig, packDefaultValues, packStyles } from "./pack-service/packPresets";
import { ServicePreset, serviceSummaryConfig, serviceDefaultValues, serviceStyles } from "./service-booking/servicePresets";
import { ContactPreset, contactSummaryConfig, contactDefaultValues, contactStyles } from "./contact";
import { DefaultPreset, defaultSummaryConfig, defaultValues, defaultStyles } from "./_shared/default";
import { IndustryPreset, PresetConfig, FormSummaryConfig } from "../types";

// Export des presets complets
export { MovingPreset, PackPreset, ServicePreset, ContactPreset, DefaultPreset };

// Export du preset service-booking
export * from './service-booking';

// Export des nouveaux presets spécialisés
export * from './moving-service';
export * from './pack-service';

// Export des configurations individuelles pour compatibilité
export { 
  movingSummaryConfig, 
  packSummaryConfig,
  serviceSummaryConfig,
  contactSummaryConfig, 
  defaultSummaryConfig,
  movingDefaultValues,
  packDefaultValues,
  serviceDefaultValues,
  contactDefaultValues,
  defaultValues,
  movingStyles,
  packStyles,
  serviceStyles,
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
  pack: {
    summary: packSummaryConfig,
    defaults: packDefaultValues,
    styles: packStyles
  },
  service: {
    summary: serviceSummaryConfig,
    defaults: serviceDefaultValues,
    styles: serviceStyles
  },
  contact: {
    summary: contactSummaryConfig,
    defaults: contactDefaultValues,
    styles: contactStyles
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
    case 'pack':
      return PackPreset;
    case 'service':
      return ServicePreset;
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
export const availablePresets: Array<{ id: IndustryPreset; name: string; description: string }> = [
  {
    id: "moving",
    name: "Déménagement",
    description: "Formulaires de devis de déménagement avec adresses pickup/delivery"
  },
  {
    id: "pack",
    name: "Pack Déménagement",
    description: "Formulaires de réservation de packs prédéfinis"
  },
  {
    id: "service",
    name: "Service Professionnel",
    description: "Formulaires de réservation de services sur mesure"
  },
  {
    id: "contact",
    name: "Contact",
    description: "Formulaires de contact et demandes d'information"
  },
  {
    id: "default",
    name: "Générique",
    description: "Preset par défaut pour tous types de formulaires"
  }
]; 