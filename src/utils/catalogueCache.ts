/**
 * 🗄️ Système de cache client pour le catalogue
 * Cache les données côté client avec TTL et invalidation
 */

export interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class ClientCache<T> {
  private cache: Map<string, CachedData<T>>;
  private readonly defaultTTL: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // 5 minutes par défaut
    this.cache = new Map();
    this.defaultTTL = ttlMs;
  }

  /**
   * Récupère une entrée du cache si elle est valide
   */
  get(key: string): T | null {
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    const now = Date.now();

    // Vérifier l'expiration
    if (now > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Stocke une entrée dans le cache
   */
  set(key: string, data: T, ttlMs?: number): void {
    const now = Date.now();
    const ttl = ttlMs ?? this.defaultTTL;

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });
  }

  /**
   * Vérifie si une clé existe et est valide
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Invalide une clé spécifique
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalide toutes les clés qui correspondent à un pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vide tout le cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Retourne le nombre d'entrées en cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Retourne l'âge d'une entrée en millisecondes
   */
  getAge(key: string): number | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    return Date.now() - cached.timestamp;
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Hook personnalisé pour utiliser le cache dans les composants React
 */
export function useCachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    staleWhileRevalidate?: boolean;
    retries?: number;
    retryDelay?: number;
  } = {}
): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
} {
  const {
    ttl = 5 * 60 * 1000,
    staleWhileRevalidate = true,
    retries = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Import dynamique de React pour éviter les dépendances circulaires
  const React = require('react');

  const fetchWithRetry = React.useCallback(
    async (attempt = 1): Promise<T> => {
      try {
        return await fetcher();
      } catch (err) {
        if (attempt < retries) {
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
          );
          return fetchWithRetry(attempt + 1);
        }
        throw err;
      }
    },
    [fetcher, retries, retryDelay]
  );

  const refetch = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchWithRetry();
      catalogueCache.set(key, result, ttl);
      setData(result);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Erreur lors du fetch");
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchWithRetry, ttl]);

  const invalidate = React.useCallback(() => {
    catalogueCache.invalidate(key);
    setData(null);
  }, [key]);

  React.useEffect(() => {
    const cachedData = catalogueCache.get<T>(key);

    if (cachedData) {
      setData(cachedData);

      // Stale-while-revalidate: afficher les données en cache et rafraîchir en arrière-plan
      if (staleWhileRevalidate) {
        refetch();
      }
    } else {
      refetch();
    }
  }, [key]);

  return { data, isLoading, error, refetch, invalidate };
}

// Instance globale du cache catalogue
export const catalogueCache = new ClientCache<any>(5 * 60 * 1000); // 5 minutes

// Nettoyage automatique toutes les minutes
if (typeof window !== "undefined") {
  setInterval(() => {
    catalogueCache.cleanup();
  }, 60 * 1000);
}
