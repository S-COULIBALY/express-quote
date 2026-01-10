'use server'

import { MODULES_CONFIG, type ModulesConfig } from '@/quotation-module/config/modules.config';
import { UnifiedDataService, ConfigurationCategory } from '@/quotation/infrastructure/services/UnifiedDataService';
import { logger } from '@/lib/logger';

/**
 * Interface pour la structure de MODULES_CONFIG
 */
export type ModulesConfigValue = string | number | boolean | ModulesConfigValue[] | { [key: string]: ModulesConfigValue };

export interface ModulesConfigPath {
  category: string;
  key: string;
  path: string; // Chemin complet (ex: "distance.DEFAULT_DISTANCE_KM")
  value: ModulesConfigValue; // Valeur actuelle (avec override si présent)
  overrideValue?: ModulesConfigValue; // Valeur de surcharge depuis Configuration
  defaultValue: ModulesConfigValue; // Valeur par défaut depuis MODULES_CONFIG
  description?: string;
  type: 'number' | 'string' | 'boolean' | 'object' | 'array';
  unit?: string; // Unité de mesure (€, km, m³, etc.)
}

/**
 * Récupère la valeur à un chemin donné dans MODULES_CONFIG
 */
function getNestedValue(obj: any, path: string[]): ModulesConfigValue | undefined {
  let current = obj;
  for (const key of path) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Récupère les overrides depuis la table Configuration
 */
async function getOverrides(): Promise<Record<string, ModulesConfigValue>> {
  try {
    const unifiedService = UnifiedDataService.getInstance();
    const overrides = await unifiedService.getConfigurations({
      category: ConfigurationCategory.PRICING_FACTORS, // Utiliser PRICING_FACTORS pour les overrides MODULES_CONFIG
      onlyActive: true,
    });

    const overrideMap: Record<string, ModulesConfigValue> = {};
    for (const override of overrides) {
      // Format de clé : MODULES_CONFIG.{category}.{key}
      // Seuls les overrides actifs sont retournés par getConfigurations (onlyActive: true)
      if (override.key.startsWith('MODULES_CONFIG.')) {
        const path = override.key.replace('MODULES_CONFIG.', '');
        overrideMap[path] = override.value as ModulesConfigValue;
      }
    }

    return overrideMap;
  } catch (error) {
    logger.error(error as Error, '❌ Erreur lors de la récupération des overrides');
    return {};
  }
}

/**
 * Récupère toutes les valeurs configurables de MODULES_CONFIG avec leurs overrides
 */
export async function getModulesConfig(): Promise<ModulesConfigPath[]> {
  try {
    const configs: ModulesConfigPath[] = [];
    const overrides = await getOverrides();

    // Mapping des unités par catégorie/clé
    const unitMap: Record<string, string> = {
      'distance.DEFAULT_DISTANCE_KM': 'km',
      'distance.MAX_DISTANCE_KM': 'km',
      'distance.LONG_DISTANCE_THRESHOLD_KM': 'km',
      'distance.OVERNIGHT_STOP_THRESHOLD_KM': 'km',
      'distance.AVERAGE_SPEED_KMH': 'km/h',
      'fuel.PRICE_PER_LITER': '€/L',
      'fuel.VEHICLE_CONSUMPTION_L_PER_100KM': 'L/100km',
      'tolls.COST_PER_KM': '€/km',
      'tolls.HIGHWAY_PERCENTAGE': '%',
      'vehicle.VEHICLE_COSTS.CAMION_12M3': '€',
      'vehicle.VEHICLE_COSTS.CAMION_20M3': '€',
      'vehicle.VEHICLE_COSTS.CAMION_30M3': '€',
      'labor.BASE_HOURLY_RATE': '€/h',
      'labor.BASE_WORK_HOURS': 'h',
      'labor.VOLUME_PER_WORKER': 'm³',
      'furnitureLift.BASE_LIFT_COST': '€',
      'crossSelling.PACKING_COST_PER_M3': '€/m³',
      'crossSelling.CLEANING_COST_PER_M2': '€/m²',
      'crossSelling.STORAGE_COST_PER_M3_PER_MONTH': '€/m³/mois',
      'temporal.WEEKEND_SURCHARGE_PERCENTAGE': '%',
      'temporal.END_OF_MONTH_SURCHARGE_PERCENTAGE': '%',
    };

    function traverse(obj: any, currentPath: string[] = [], category: string = ''): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = [...currentPath, key];
        const pathString = fullPath.join('.');

        if (value === null || value === undefined) {
          continue;
        }

        if (typeof value === 'object' && !Array.isArray(value)) {
          // Si c'est un objet, continuer la traversée
          const newCategory = currentPath.length === 0 ? key : category;
          traverse(value, fullPath, newCategory);
        } else {
          // Valeur terminale
          let type: 'number' | 'string' | 'boolean' | 'object' | 'array';
          if (Array.isArray(value)) {
            type = 'array';
          } else if (typeof value === 'object' && value !== null) {
            type = 'object';
          } else {
            type = typeof value as 'number' | 'string' | 'boolean';
          }
          
          const overrideValue = overrides[pathString];
          const unit = unitMap[pathString];
          
          // S'assurer que value est un ModulesConfigValue valide
          const defaultValue: ModulesConfigValue = value as ModulesConfigValue;
          const finalValue: ModulesConfigValue = overrideValue !== undefined ? overrideValue : defaultValue;

          configs.push({
            category: category || 'root',
            key,
            path: pathString,
            value: finalValue,
            overrideValue: overrideValue !== undefined ? overrideValue : undefined,
            defaultValue: defaultValue,
            type,
            unit,
          });
        }
      }
    }

    traverse(MODULES_CONFIG);

    return configs;
  } catch (error) {
    logger.error(error as Error, '❌ Erreur lors de la récupération de MODULES_CONFIG');
    throw error;
  }
}

/**
 * Récupère la valeur d'une configuration spécifique
 */
export async function getModulesConfigValue(pathString: string): Promise<ModulesConfigValue | null> {
  try {
    const path = pathString.split('.');
    const value = getNestedValue(MODULES_CONFIG, path);
    return value ?? null;
  } catch (error) {
    logger.error(error as Error, `❌ Erreur lors de la récupération de ${pathString}`);
    return null;
  }
}

/**
 * Met à jour une valeur dans MODULES_CONFIG via un override dans Configuration
 * 
 * ⚠️ IMPORTANT : Cette fonction crée un override dans la table Configuration
 * L'override prendra effet immédiatement au runtime (pas besoin de redéploiement)
 * Pour revenir à la valeur par défaut, supprimer l'override
 */
export async function updateModulesConfigValue(
  pathString: string,
  value: ModulesConfigValue
): Promise<{ success: boolean; message: string }> {
  try {
    const path = pathString.split('.');
    
    // Vérifier que le chemin existe dans MODULES_CONFIG
    const currentValue = getNestedValue(MODULES_CONFIG, path);
    if (currentValue === undefined) {
      return {
        success: false,
        message: `Le chemin ${pathString} n'existe pas dans MODULES_CONFIG`,
      };
    }

    // Valider le type
    const expectedType = typeof currentValue;
    if (typeof value !== expectedType && !(Array.isArray(currentValue) && Array.isArray(value))) {
      return {
        success: false,
        message: `Type invalide. Attendu : ${expectedType}, reçu : ${typeof value}`,
      };
    }

    // Convertir la valeur si nécessaire
    let convertedValue: ModulesConfigValue = value;
    if (expectedType === 'number' && typeof value === 'string') {
      convertedValue = parseFloat(value);
      if (isNaN(convertedValue as number)) {
        return {
          success: false,
          message: `La valeur "${value}" n'est pas un nombre valide`,
        };
      }
    }

    // Créer ou mettre à jour l'override dans Configuration
    const unifiedService = UnifiedDataService.getInstance();
    const overrideKey = `MODULES_CONFIG.${pathString}`;
    
    await unifiedService.updateConfiguration(
      ConfigurationCategory.PRICING_FACTORS,
      overrideKey,
      convertedValue,
      `Override pour MODULES_CONFIG.${pathString} (valeur par défaut: ${JSON.stringify(currentValue)})`
    );

    logger.info(`✅ Override créé : MODULES_CONFIG.${pathString} = ${JSON.stringify(convertedValue)}`);
    
    return {
      success: true,
      message: `Valeur mise à jour avec succès. L'override prendra effet immédiatement.`,
    };

  } catch (error) {
    logger.error(error as Error, `❌ Erreur lors de la mise à jour de ${pathString}`);
    return {
      success: false,
      message: `Erreur lors de la mise à jour : ${(error as Error).message}`,
    };
  }
}

/**
 * Supprime un override (revient à la valeur par défaut de MODULES_CONFIG)
 */
export async function removeModulesConfigOverride(
  pathString: string
): Promise<{ success: boolean; message: string }> {
  try {
    const unifiedService = UnifiedDataService.getInstance();
    const overrideKey = `MODULES_CONFIG.${pathString}`;
    
    // Désactiver l'override en le mettant à isActive: false
    // Accéder directement à Prisma via l'instance UnifiedDataService
    const prisma = (unifiedService as any).prisma;
    if (!prisma) {
      throw new Error('Prisma client non disponible');
    }

    await prisma.configuration.updateMany({
      where: {
        category: ConfigurationCategory.PRICING_FACTORS,
        key: overrideKey,
        isActive: true,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
    
    // Invalider le cache
    (unifiedService as any).configCache?.clear();
    (unifiedService as any).configTimestamp?.clear();

    logger.info(`✅ Override supprimé : MODULES_CONFIG.${pathString}`);
    
    return {
      success: true,
      message: `Override supprimé. La valeur par défaut de MODULES_CONFIG sera utilisée.`,
    };

  } catch (error) {
    logger.error(error as Error, `❌ Erreur lors de la suppression de l'override ${pathString}`);
    return {
      success: false,
      message: `Erreur lors de la suppression : ${(error as Error).message}`,
    };
  }
}

/**
 * Récupère les catégories de MODULES_CONFIG
 */
export async function getModulesConfigCategories(): Promise<string[]> {
  try {
    const categories = Object.keys(MODULES_CONFIG);
    return categories;
  } catch (error) {
    logger.error(error as Error, '❌ Erreur lors de la récupération des catégories');
    return [];
  }
}

/**
 * Récupère les configurations d'une catégorie spécifique
 */
export async function getModulesConfigByCategory(category: string): Promise<Record<string, ModulesConfigValue>> {
  try {
    const categoryConfig = (MODULES_CONFIG as any)[category];
    if (!categoryConfig) {
      return {};
    }
    return categoryConfig as Record<string, ModulesConfigValue>;
  } catch (error) {
    logger.error(error as Error, `❌ Erreur lors de la récupération de la catégorie ${category}`);
    return {};
  }
}
