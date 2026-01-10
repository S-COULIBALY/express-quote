/**
 * Service pour récupérer MODULES_CONFIG avec application des overrides
 * 
 * Les overrides sont stockés dans la table Configuration avec la clé :
 * MODULES_CONFIG.{category}.{key}
 * 
 * Si un override existe, il remplace la valeur par défaut de MODULES_CONFIG
 */

import { MODULES_CONFIG } from './modules.config';
import { UnifiedDataService, ConfigurationCategory } from '@/quotation/infrastructure/services/UnifiedDataService';

let overrideCache: Record<string, any> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Récupère les overrides depuis la table Configuration
 */
async function getOverrides(): Promise<Record<string, any>> {
  const now = Date.now();
  
  // Utiliser le cache si valide
  if (overrideCache && (now - cacheTimestamp) < CACHE_TTL) {
    return overrideCache;
  }

  try {
    const unifiedService = UnifiedDataService.getInstance();
    const overrides = await unifiedService.getConfigurations({
      category: ConfigurationCategory.PRICING_FACTORS,
      onlyActive: true,
    });

    const overrideMap: Record<string, any> = {};
    for (const override of overrides) {
      // Format de clé : MODULES_CONFIG.{category}.{key}
      if (override.key.startsWith('MODULES_CONFIG.')) {
        const path = override.key.replace('MODULES_CONFIG.', '');
        overrideMap[path] = override.value;
      }
    }

    // Mettre en cache
    overrideCache = overrideMap;
    cacheTimestamp = now;

    return overrideMap;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des overrides:', error);
    return {};
  }
}

/**
 * Récupère une valeur depuis MODULES_CONFIG avec application des overrides
 */
export async function getConfigValue(path: string[]): Promise<any> {
  const overrides = await getOverrides();
  const pathString = path.join('.');

  // Vérifier si un override existe
  if (overrides[pathString] !== undefined) {
    return overrides[pathString];
  }

  // Sinon, retourner la valeur par défaut
  let current = MODULES_CONFIG as any;
  for (const key of path) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

/**
 * Récupère MODULES_CONFIG complet avec application des overrides
 */
export async function getModulesConfigWithOverrides(): Promise<any> {
  const overrides = await getOverrides();
  
  // Créer une copie profonde de MODULES_CONFIG
  const config = JSON.parse(JSON.stringify(MODULES_CONFIG));

  // Appliquer les overrides
  for (const [pathString, value] of Object.entries(overrides)) {
    const path = pathString.split('.');
    let current = config;
    
    for (let i = 0; i < path.length - 1; i++) {
      if (current[path[i]] === undefined) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
  }

  return config;
}

/**
 * Invalide le cache des overrides
 */
export function invalidateOverrideCache(): void {
  overrideCache = null;
  cacheTimestamp = 0;
}
