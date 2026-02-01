/**
 * 🗄️ Caches Globaux Partagés
 * Instances de cache réutilisables pour toute l'application
 */

import { ClientCache } from "@/utils/catalogueCache";

/**
 * Cache pour les règles unifiées
 * TTL: 10 minutes (les règles changent rarement)
 *
 * NOTE: Ce cache est conservé pour compatibilité mais n'est plus utilisé
 * par LogisticsModal qui utilise maintenant les données statiques de modal-data.ts
 */
export const rulesCache = new ClientCache<any[]>(10 * 60 * 1000);

/**
 * Cache pour le mapping UUID → Nom de règle
 * TTL: 10 minutes
 *
 * Utilisé pour enrichir les UUIDs avec les noms lors de la transformation
 * de la structure groupée
 */
export const rulesNameMapCache = new Map<string, string>();

/**
 * Initialise le cache de mapping UUID → Nom à partir des règles chargées
 */
export function initializeRulesNameMap(rules: any[]) {
  rulesNameMapCache.clear();
  rules.forEach((rule) => {
    if (rule.id && rule.name) {
      rulesNameMapCache.set(rule.id, rule.name);
    }
  });
  console.log(
    `✅ [RulesNameMapCache] ${rulesNameMapCache.size} règles mappées`,
  );
}

/**
 * Récupère le nom d'une règle depuis son UUID
 */
export function getRuleName(uuid: string): string {
  return rulesNameMapCache.get(uuid) || uuid;
}

/**
 * Cache pour le catalogue
 * TTL: 5 minutes
 *
 * Utilisé par:
 * - src/app/catalogue/page.tsx
 * - src/app/catalogue/[catalogId]/page.tsx
 */
export const catalogueItemsCache = new ClientCache<any[]>(5 * 60 * 1000);

/**
 * Cache pour un catalogue spécifique
 * TTL: 5 minutes
 */
export const catalogueDetailCache = new ClientCache<any>(5 * 60 * 1000);

/**
 * Cache pour les items
 * TTL: 5 minutes
 *
 * Utilisé par:
 * - src/app/admin/items/page.tsx
 */
export const itemsCache = new ClientCache<any[]>(5 * 60 * 1000);

/**
 * Cache pour les utilisateurs (futur)
 * TTL: 15 minutes
 */
export const userCache = new ClientCache<any>(15 * 60 * 1000);

/**
 * Cache pour les paramètres (futur)
 * TTL: 30 minutes
 */
export const settingsCache = new ClientCache<any>(30 * 60 * 1000);

/**
 * Fonction utilitaire pour invalider tous les caches
 * Utile après des mutations (POST, PUT, DELETE)
 */
export function clearAllCaches() {
  rulesCache.clear();
  catalogueItemsCache.clear();
  catalogueDetailCache.clear();
  itemsCache.clear();
  userCache.clear();
  settingsCache.clear();

  console.log("🧹 All caches cleared");
}

/**
 * Invalider uniquement les caches liés aux règles
 */
export function clearRulesCaches() {
  rulesCache.clear();
  console.log("🧹 Rules cache cleared");
}

/**
 * Invalider uniquement les caches liés au catalogue
 */
export function clearCatalogueCaches() {
  catalogueItemsCache.clear();
  catalogueDetailCache.clear();
  itemsCache.clear();
  console.log("🧹 Catalogue caches cleared");
}

/**
 * Obtenir des statistiques sur les caches
 */
export function getCacheStats() {
  return {
    rules: {
      size: rulesCache.size(),
    },
    catalogueItems: {
      size: catalogueItemsCache.size(),
    },
    catalogueDetail: {
      size: catalogueDetailCache.size(),
    },
    items: {
      size: itemsCache.size(),
    },
    users: {
      size: userCache.size(),
    },
    settings: {
      size: settingsCache.size(),
    },
  };
}

// Nettoyage automatique toutes les 5 minutes
if (typeof window !== "undefined") {
  setInterval(
    () => {
      rulesCache.cleanup();
      catalogueItemsCache.cleanup();
      catalogueDetailCache.cleanup();
      itemsCache.cleanup();
      userCache.cleanup();
      settingsCache.cleanup();

      const stats = getCacheStats();
      console.log("🧹 Auto cleanup completed. Cache stats:", stats);
    },
    5 * 60 * 1000,
  );
}
