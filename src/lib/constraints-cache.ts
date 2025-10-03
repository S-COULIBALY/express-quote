// ✅ SYSTÈME DE CACHE POUR LES CONTRAINTES BDD
// Évite les appels API répétés et améliore les performances

import { safeApiCall, quickApiErrorHandler } from './error-handling';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  source: 'database' | 'fallback';
}

interface ConstraintsData {
  constraints: any[];
  services: any[];
  allItems: any[];
  meta: {
    totalConstraints: number;
    totalServices: number;
    serviceType: string;
    serviceName: string;
    source: string;
    totalRulesInDB?: number;
  };
}

class ConstraintsCache {
  private cache = new Map<string, CacheItem<ConstraintsData>>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Clé de cache basée sur le type de service
  private getCacheKey(serviceType: 'moving' | 'cleaning'): string {
    return `constraints_${serviceType}`;
  }

  // Vérifier si les données en cache sont encore valides
  private isValid(item: CacheItem<ConstraintsData>): boolean {
    return Date.now() - item.timestamp < this.CACHE_DURATION;
  }

  // Récupérer depuis le cache ou null si expiré/inexistant
  get(serviceType: 'moving' | 'cleaning'): ConstraintsData | null {
    const key = this.getCacheKey(serviceType);
    const cached = this.cache.get(key);

    if (cached && this.isValid(cached)) {
      console.log(`🔄 [CACHE] Contraintes ${serviceType} récupérées depuis le cache (${cached.source})`);
      return cached.data;
    }

    if (cached) {
      console.log(`⏰ [CACHE] Cache ${serviceType} expiré, suppression...`);
      this.cache.delete(key);
    }

    return null;
  }

  // Stocker dans le cache
  set(serviceType: 'moving' | 'cleaning', data: ConstraintsData): void {
    const key = this.getCacheKey(serviceType);
    const cacheItem: CacheItem<ConstraintsData> = {
      data,
      timestamp: Date.now(),
      source: data.meta.source as 'database' | 'fallback'
    };

    this.cache.set(key, cacheItem);
    console.log(`💾 [CACHE] Contraintes ${serviceType} mises en cache (${data.meta.source})`);
  }

  // Invalider le cache (utile pour forcer le rechargement)
  invalidate(serviceType?: 'moving' | 'cleaning'): void {
    if (serviceType) {
      const key = this.getCacheKey(serviceType);
      this.cache.delete(key);
      console.log(`🗑️ [CACHE] Cache ${serviceType} invalidé`);
    } else {
      this.cache.clear();
      console.log(`🗑️ [CACHE] Tous les caches invalidés`);
    }
  }

  // Statistiques du cache
  getStats() {
    const stats = {
      totalItems: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        source: item.source,
        age: Math.round((Date.now() - item.timestamp) / 1000),
        valid: this.isValid(item)
      }))
    };

    console.log('📊 [CACHE] Statistiques:', stats);
    return stats;
  }
}

// Instance singleton du cache
export const constraintsCache = new ConstraintsCache();

// ✅ FONCTIONS OPTIMISÉES AVEC CACHE ET GESTION D'ERREURS AVANCÉE

export async function loadConstraintsWithCache(serviceType: 'moving' | 'cleaning'): Promise<ConstraintsData | null> {
  // 1. Vérifier le cache d'abord
  const cached = constraintsCache.get(serviceType);
  if (cached) {
    return cached;
  }

  // 2. Charger depuis l'API unifiée avec gestion d'erreurs avancée
  const apiCall = async (): Promise<ConstraintsData> => {
    console.log(`🌐 [CACHE] Chargement ${serviceType} depuis l'API unifiée...`);

    const response = await fetch(`/api/constraints?serviceType=${serviceType.toUpperCase()}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      // 3. Mettre en cache et retourner
      constraintsCache.set(serviceType, result.data);
      return result.data;
    }

    throw new Error('Invalid API response structure');
  };

  // Utiliser la gestion d'erreurs avec fallback
  const result = await quickApiErrorHandler.executeWithRetry(
    apiCall,
    `load-constraints-${serviceType}`,
    () => loadFallbackConstraints(serviceType)
  );

  return result.data;
}

// ✅ DONNÉES FALLBACK EN CAS D'ÉCHEC TOTAL DE L'API
function loadFallbackConstraints(serviceType: 'moving' | 'cleaning'): ConstraintsData {
  console.warn(`⚠️ [CACHE] Utilisation des données fallback pour ${serviceType}`);

  if (serviceType === 'moving') {
    return {
      constraints: [
        { id: 'elevator_required', name: 'Ascenseur requis', description: 'Pas d\'ascenseur disponible', category: 'building', icon: '🏢' },
        { id: 'stairs_access', name: 'Accès par escaliers', description: 'Plus de 2 étages d\'escaliers', category: 'access', icon: '📏' },
        { id: 'narrow_street', name: 'Rue étroite', description: 'Accès véhicule difficile', category: 'street', icon: '🚛' }
      ],
      services: [
        { id: 'packing_service', name: 'Service d\'emballage', description: 'Emballage professionnel', category: 'services', icon: '📦' },
        { id: 'assembly_service', name: 'Montage/démontage', description: 'Montage de meubles', category: 'services', icon: '🔧' }
      ],
      allItems: [],
      meta: {
        totalConstraints: 3,
        totalServices: 2,
        serviceType: 'MOVING',
        serviceName: 'Déménagement',
        source: 'fallback'
      }
    };
  } else {
    return {
      constraints: [
        { id: 'high_dirt', name: 'Saleté importante', description: 'Nettoyage intensif requis', category: 'conditions', icon: '🧽' },
        { id: 'no_water', name: 'Pas d\'eau', description: 'Accès eau limité', category: 'access', icon: '💧' },
        { id: 'fragile_items', name: 'Objets fragiles', description: 'Manipulation délicate', category: 'equipment', icon: '🔧' }
      ],
      services: [],
      allItems: [],
      meta: {
        totalConstraints: 3,
        totalServices: 0,
        serviceType: 'CLEANING',
        serviceName: 'Nettoyage',
        source: 'fallback'
      }
    };
  }
}

// ✅ NOUVELLE FONCTION - Charger toutes les contraintes d'un coup
export async function loadAllConstraintsWithCache(): Promise<Record<string, ConstraintsData> | null> {
  try {
    console.log('🌐 [CACHE] Chargement de toutes les contraintes depuis l\'API unifiée...');

    const response = await fetch('/api/constraints?format=grouped');
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      // Mettre chaque service en cache individuellement
      for (const [serviceKey, serviceData] of Object.entries(result.data)) {
        constraintsCache.set(serviceKey as 'moving' | 'cleaning', serviceData as ConstraintsData);
      }

      return result.data;
    }

    return null;
  } catch (error) {
    console.error('❌ [CACHE] Erreur chargement toutes contraintes:', error);
    return null;
  }
}

// ✅ NOUVELLE FONCTION - Obtenir des statistiques sur les contraintes
export async function getConstraintsSummary(): Promise<any | null> {
  try {
    const response = await fetch('/api/constraints?format=summary');
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error('❌ [CACHE] Erreur récupération statistiques:', error);
    return null;
  }
}

// Hook React pour l'utilisation du cache (optionnel)
export function useConstraintsCache(serviceType: 'moving' | 'cleaning') {
  return {
    load: () => loadConstraintsWithCache(serviceType),
    invalidate: () => constraintsCache.invalidate(serviceType),
    getStats: () => constraintsCache.getStats()
  };
}