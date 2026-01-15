// ============================================================================
// PRESETS INDEX - Express Quote
// ============================================================================
// Seul le service DEMENAGEMENT SUR MESURE est actif.
// Les services CLEANING, DELIVERY, PACKING, MOVING (packs catalogue) ont été abandonnés.
// Voir: docs/PLAN_REFACTORISATION_ANCIEN_SYSTEME.md
// ============================================================================

// Import des presets par défaut
import {
  ContactPreset,
  contactSummaryConfig,
  contactDefaultValues,
  contactStyles,
} from "./contact";
import {
  DefaultPreset,
  defaultSummaryConfig,
  defaultValues,
  defaultStyles,
} from "./_shared/default";

// Import du preset sur mesure (SEUL SERVICE ACTIF)
import {
  demenagementSurMesureSummaryConfig,
  demenagementSurMesureDefaultValues,
  demenagementSurMesureStyles,
  DemenagementSurMesurePreset,
  getDemenagementSurMesureServiceConfig,
} from "./demenagement-sur-mesure-service";

// Import du preset global et des utilitaires
import {
  globalFormPreset,
  mergeWithGlobalPreset,
} from "./_shared/globalPreset";
import { IndustryPreset, FormSummaryConfig } from "../types";

// Import des utilitaires partagés
import * as SharedFields from "./_shared/sharedFields";
import * as SharedValidation from "./_shared/sharedValidation";

// Export des presets par défaut
export { ContactPreset, DefaultPreset };

// Export du preset sur mesure (SEUL SERVICE ACTIF)
export {
  DemenagementSurMesurePreset,
  getDemenagementSurMesureServiceConfig,
};

// Export du preset global et des utilitaires
export { globalFormPreset, mergeWithGlobalPreset };
export { SharedFields, SharedValidation };

// Export des presets spécialisés
export * from "./demenagement-sur-mesure-service";

// Export des configurations individuelles
export {
  contactSummaryConfig,
  defaultSummaryConfig,
  contactDefaultValues,
  defaultValues,
  contactStyles,
  defaultStyles,
  demenagementSurMesureSummaryConfig,
  demenagementSurMesureDefaultValues,
  demenagementSurMesureStyles,
};

// Export des données des presets
export const presetData = {
  "demenagement-sur-mesure": {
    summary: demenagementSurMesureSummaryConfig,
    defaults: demenagementSurMesureDefaultValues,
    styles: demenagementSurMesureStyles,
  },
  contact: {
    summary: contactSummaryConfig,
    defaults: contactDefaultValues,
    styles: contactStyles,
  },
  default: {
    summary: defaultSummaryConfig,
    defaults: defaultValues,
    styles: defaultStyles,
  },
};

// Fonction helper pour obtenir la configuration de summary
export const getPresetSummary = (
  industry: IndustryPreset,
): FormSummaryConfig => {
  const data = presetData[industry as keyof typeof presetData] || presetData.default;
  return data.summary;
};

// Liste des presets disponibles (seul déménagement sur mesure est actif)
export const availablePresets: Array<{
  id: IndustryPreset;
  name: string;
  description: string;
  category: "catalogue" | "default" | "sur-mesure";
}> = [
  // Service Sur Mesure (SEUL SERVICE ACTIF)
  {
    id: "demenagement-sur-mesure",
    name: "Déménagement Sur Mesure",
    description: "Service de déménagement personnalisé selon vos besoins",
    category: "sur-mesure",
  },
  // Defaults
  {
    id: "contact",
    name: "Contact",
    description: "Formulaires de contact et demandes d'information",
    category: "default",
  },
  {
    id: "default",
    name: "Générique",
    description: "Preset par défaut pour tous types de formulaires",
    category: "default",
  },
];
