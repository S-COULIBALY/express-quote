import { PresetConfig, GlobalFormConfig, IndustryPreset } from "../types";
import { globalFormPreset, mergeWithGlobalPreset } from "../presets";

// 🔍 Utilitaire pour analyser les duplications dans les presets

/**
 * Analyse un preset pour identifier les configurations qui pourraient être déplacées vers le global
 */
export const analyzePresetForDuplications = (preset: PresetConfig): {
  duplications: string[];
  uniqueConfigs: string[];
  recommendations: string[];
} => {
  const duplications: string[] = [];
  const uniqueConfigs: string[] = [];
  const recommendations: string[] = [];

  // Vérifier les styles vides (peuvent être supprimés)
  if (preset.styles === "") {
    duplications.push("Styles CSS vides - peuvent être supprimés");
    recommendations.push("Supprimer la propriété 'styles' vide");
  }

  // Vérifier la version (si < 2.0.0, pas encore migré)
  if (preset.meta.version.startsWith("1.")) {
    duplications.push("Version 1.x - pas encore migré vers le preset global");
    recommendations.push("Migrer vers globalConfig avec mergeWithGlobalPreset()");
  }

  // Vérifier la présence de globalConfig
  if (!preset.form.globalConfig) {
    duplications.push("Pas de globalConfig - utilise probablement des configs manuelles");
    recommendations.push("Ajouter globalConfig: mergeWithGlobalPreset({...})");
  }

  return {
    duplications,
    uniqueConfigs,
    recommendations
  };
};

/**
 * Génère automatiquement une configuration migrée pour un preset
 */
export const generateMigratedPreset = (
  preset: PresetConfig,
  customizations: Partial<GlobalFormConfig> = {}
): PresetConfig => {
  return {
    ...preset,
    form: {
      ...preset.form,
      globalConfig: mergeWithGlobalPreset(customizations)
    },
    meta: {
      ...preset.meta,
      version: "2.0.0",
      description: `${preset.meta.description} (hérite du global)`
    }
  };
};

/**
 * Préconfigurations pour différents types de services
 */
export const servicePreconfigs = {
  moving: {
    appearance: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1D4ED8',
      borderRadius: 16
    },
    layout: {
      type: 'two-column' as const,
      sidebar: true,
      mobileFixedHeader: true
    },
    uiElements: {
      showServiceIcon: true,
      submitButtonStyle: 'filled' as const,
      headerAppearance: 'blur' as const
    }
  },
  
  cleaning: {
    appearance: {
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      borderRadius: 12
    },
    layout: {
      type: 'two-column' as const,
      sidebar: true
    },
    uiElements: {
      showServiceIcon: true,
      submitButtonStyle: 'filled' as const,
      headerAppearance: 'normal' as const
    }
  },
  
  catalogue: {
    appearance: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#7C3AED',
      borderRadius: 18
    },
    layout: {
      type: 'two-column' as const,
      sidebar: true,
      mobile: {
        singleColumn: true,
        optionDisplay: 'cards' as const
      }
    },
    uiElements: {
      showServiceIcon: true,
      submitButtonStyle: 'flat' as const,
      showBreadcrumbs: true
    }
  },
  
  contact: {
    appearance: {
      primaryColor: '#6B7280',
      secondaryColor: '#4B5563',
      borderRadius: 12
    },
    layout: {
      type: 'single-column' as const,
      sidebar: false
    },
    uiElements: {
      showServiceIcon: false,
      submitButtonStyle: 'filled' as const
    }
  }
};

/**
 * Génère rapidement un preset migré basé sur le type de service
 */
export const quickMigratePreset = (
  preset: PresetConfig,
  serviceType: keyof typeof servicePreconfigs
): PresetConfig => {
  const preconfig = servicePreconfigs[serviceType];
  return generateMigratedPreset(preset, preconfig);
};

/**
 * Valide qu'un preset migré conserve ses fonctionnalités essentielles
 */
export const validateMigratedPreset = (
  originalPreset: PresetConfig,
  migratedPreset: PresetConfig
): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} => {
  const warnings: string[] = [];
  const errors: string[] = [];

  // Vérifier que les defaultValues sont conservées
  if (JSON.stringify(originalPreset.defaultValues) !== JSON.stringify(migratedPreset.defaultValues)) {
    errors.push("Les defaultValues ont été modifiées lors de la migration");
  }

  // Vérifier que la summaryConfig est conservée
  if (JSON.stringify(originalPreset.summary) !== JSON.stringify(migratedPreset.summary)) {
    errors.push("La summaryConfig a été modifiée lors de la migration");
  }

  // Vérifier que le serviceType est conservé
  if (originalPreset.form.serviceType !== migratedPreset.form.serviceType) {
    errors.push("Le serviceType a été modifié lors de la migration");
  }

  // Vérifier la présence de globalConfig dans le preset migré
  if (!migratedPreset.form.globalConfig) {
    errors.push("Pas de globalConfig dans le preset migré");
  }

  // Vérifier l'incrémentation de version
  if (migratedPreset.meta.version <= originalPreset.meta.version) {
    warnings.push("La version n'a pas été incrémentée");
  }

  return {
    isValid: errors.length === 0,
    warnings,
    errors
  };
};

/**
 * Génère un rapport de migration pour tous les presets
 */
export const generateMigrationReport = (presets: Record<string, PresetConfig>): {
  migrated: string[];
  needsMigration: string[];
  totalDuplicationsFound: number;
  recommendations: string[];
} => {
  const migrated: string[] = [];
  const needsMigration: string[] = [];
  let totalDuplicationsFound = 0;
  const recommendations: string[] = [];

  Object.entries(presets).forEach(([name, preset]) => {
    const analysis = analyzePresetForDuplications(preset);
    
    if (preset.meta.version.startsWith("2.") && preset.form.globalConfig) {
      migrated.push(name);
    } else {
      needsMigration.push(name);
      totalDuplicationsFound += analysis.duplications.length;
      recommendations.push(`${name}: ${analysis.recommendations.join(", ")}`);
    }
  });

  return {
    migrated,
    needsMigration,
    totalDuplicationsFound,
    recommendations
  };
};

/**
 * Helper pour créer rapidement un nouveau preset basé sur le global
 */
export const createNewPreset = (
  name: string,
  industry: IndustryPreset,
  customizations: Partial<GlobalFormConfig> = {},
  serviceType: "moving" | "cleaning" | "package" | "maintenance" | "general" = "general"
): PresetConfig => {
  return {
    form: {
      title: `Formulaire ${name}`,
      description: `Configuration personnalisée pour ${name}`,
      serviceType,
      globalConfig: mergeWithGlobalPreset(customizations)
    },
    defaultValues: {},
    summary: {
      title: `Récapitulatif ${name}`,
      sections: []
    },
    styles: "",
    meta: {
      industry,
      name,
      description: `Preset ${name} basé sur le preset global`,
      version: "2.0.0"
    }
  };
};

// 📊 Exemples d'usage des utilitaires
export const migrationExamples = {
  // Exemple 1: Analyser un preset existant
  analyze: `
    import { analyzePresetForDuplications } from './migrationHelper';
    const analysis = analyzePresetForDuplications(MyPreset);
    console.log(analysis.recommendations);
  `,
  
  // Exemple 2: Migration rapide
  quickMigrate: `
    import { quickMigratePreset } from './migrationHelper';
    const migratedPreset = quickMigratePreset(CleaningPreset, 'cleaning');
  `,
  
  // Exemple 3: Créer un nouveau preset
  createNew: `
    import { createNewPreset } from './migrationHelper';
    const newPreset = createNewPreset('Maintenance', 'maintenance', {
      appearance: { primaryColor: '#F59E0B' }
    });
  `,
  
  // Exemple 4: Valider une migration
  validate: `
    import { validateMigratedPreset } from './migrationHelper';
    const validation = validateMigratedPreset(original, migrated);
    if (!validation.isValid) {
      console.error(validation.errors);
    }
  `
}; 