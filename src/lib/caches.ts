/**
 * 🗄️ Caches Globaux Partagés — Redis
 *
 * Remplace les caches in-memory (ClientCache) par des caches Redis
 * pour garantir la cohérence entre toutes les instances Vercel.
 */

import { ServerCache } from "./server-cache";

/**
 * Cache pour les règles unifiées — TTL 10 min
 * Conservé pour compatibilité ; le calcul de prix utilise désormais MODULES_CONFIG.
 */
export const rulesCache = new ServerCache<unknown[]>(10 * 60 * 1000, "rules");

/**
 * Cache de mapping UUID → Nom de règle
 * Conservé en Map synchrone (lookup pur, jamais peuplé côté serveur actif).
 */
export const rulesNameMapCache = new Map<string, string>();

export function initializeRulesNameMap(
  rules: { id?: string; name?: string }[],
) {
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

export function getRuleName(uuid: string): string {
  return rulesNameMapCache.get(uuid) || uuid;
}

/**
 * Cache pour le catalogue — TTL 5 min
 */
export const catalogueItemsCache = new ServerCache<unknown[]>(
  5 * 60 * 1000,
  "catalogue-items",
);

/**
 * Cache pour un catalogue spécifique — TTL 5 min
 */
export const catalogueDetailCache = new ServerCache<unknown>(
  5 * 60 * 1000,
  "catalogue-detail",
);

/**
 * Cache items (legacy) — TTL 5 min
 */
export const itemsCache = new ServerCache<unknown[]>(5 * 60 * 1000, "items");

/**
 * Cache utilisateurs — TTL 15 min
 */
export const userCache = new ServerCache<unknown>(15 * 60 * 1000, "users");

/**
 * Cache paramètres — TTL 30 min
 */
export const settingsCache = new ServerCache<unknown>(
  30 * 60 * 1000,
  "settings",
);

/**
 * Invalide tous les caches Redis de l'application.
 * Propagé à toutes les instances Vercel automatiquement.
 */
export async function clearAllCaches() {
  await Promise.all([
    rulesCache.clear(),
    catalogueItemsCache.clear(),
    catalogueDetailCache.clear(),
    itemsCache.clear(),
    userCache.clear(),
    settingsCache.clear(),
  ]);
  console.log("🧹 All caches cleared");
}

export async function clearRulesCaches() {
  await rulesCache.clear();
  console.log("🧹 Rules cache cleared");
}

export async function clearCatalogueCaches() {
  await Promise.all([
    catalogueItemsCache.clear(),
    catalogueDetailCache.clear(),
    itemsCache.clear(),
  ]);
  console.log("🧹 Catalogue caches cleared");
}

export async function getCacheStats() {
  const [rules, catalogueItems, catalogueDetail, items, users, settings] =
    await Promise.all([
      rulesCache.size(),
      catalogueItemsCache.size(),
      catalogueDetailCache.size(),
      itemsCache.size(),
      userCache.size(),
      settingsCache.size(),
    ]);

  return { rules, catalogueItems, catalogueDetail, items, users, settings };
}
