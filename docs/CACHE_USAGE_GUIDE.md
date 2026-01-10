# 📚 Guide d'Utilisation - Système de Cache Client

## 🎯 Vue d'Ensemble

Le système `ClientCache` est un cache côté client léger et typé pour améliorer les performances de l'application.

---

## 🚀 Quick Start

### 1. Import

```typescript
import { ClientCache } from "@/utils/catalogueCache";
```

### 2. Créer une Instance

```typescript
// Cache avec TTL de 5 minutes (par défaut)
const myCache = new ClientCache<MyDataType>();

// Ou avec TTL personnalisé (10 minutes)
const myCache = new ClientCache<MyDataType>(10 * 60 * 1000);
```

### 3. Utilisation Basique

```typescript
// Stocker des données
myCache.set("user-123", userData);

// Récupérer des données
const user = myCache.get("user-123");
if (user) {
  console.log("Cache hit!", user);
} else {
  console.log("Cache miss, fetching...");
}

// Vérifier l'existence
if (myCache.has("user-123")) {
  // ...
}

// Invalider
myCache.invalidate("user-123");

// Tout vider
myCache.clear();
```

---

## 📖 Exemples d'Utilisation

### Exemple 1 : Cache de Profil Utilisateur

```typescript
import { ClientCache } from "@/utils/catalogueCache";

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const userCache = new ClientCache<UserProfile>(10 * 60 * 1000); // 10 min

async function getUserProfile(userId: string): Promise<UserProfile> {
  // 1. Vérifier le cache
  const cached = userCache.get(userId);
  if (cached) {
    console.log("✅ User loaded from cache");
    return cached;
  }

  // 2. Fetcher depuis l'API
  console.log("🔄 Fetching user from API...");
  const response = await fetch(`/api/users/${userId}`);
  const user = await response.json();

  // 3. Mettre en cache
  userCache.set(userId, user);

  return user;
}
```

---

### Exemple 2 : Cache avec Stale-While-Revalidate

```typescript
import { ClientCache } from "@/utils/catalogueCache";

const productsCache = new ClientCache<Product[]>(5 * 60 * 1000);

async function getProducts(category: string): Promise<Product[]> {
  const cacheKey = `products-${category}`;

  // 1. Récupérer depuis le cache
  const cached = productsCache.get(cacheKey);

  // 2. Si cache existe, l'utiliser PUIS rafraîchir en arrière-plan
  if (cached) {
    console.log("📦 Using cached products");

    // Rafraîchir en arrière-plan (non-bloquant)
    refreshInBackground(category, cacheKey);

    return cached;
  }

  // 3. Pas de cache, fetch synchrone
  return await fetchAndCache(category, cacheKey);
}

async function fetchAndCache(
  category: string,
  cacheKey: string,
): Promise<Product[]> {
  const response = await fetch(`/api/products?category=${category}`);
  const products = await response.json();

  productsCache.set(cacheKey, products);
  return products;
}

async function refreshInBackground(
  category: string,
  cacheKey: string,
): Promise<void> {
  try {
    const products = await fetchAndCache(category, cacheKey);
    console.log("🔄 Cache updated in background");
  } catch (error) {
    console.warn("⚠️ Background refresh failed:", error);
  }
}
```

---

### Exemple 3 : Invalidation par Pattern

```typescript
import { ClientCache } from "@/utils/catalogueCache";

const apiCache = new ClientCache<any>();

// Stocker plusieurs entrées
apiCache.set("products-electronics", electronicsData);
apiCache.set("products-clothing", clothingData);
apiCache.set("products-food", foodData);
apiCache.set("user-settings", settingsData);

// Invalider tous les produits (pattern regex)
apiCache.invalidatePattern(/^products-/);

console.log(apiCache.has("products-electronics")); // false
console.log(apiCache.has("user-settings")); // true
```

---

### Exemple 4 : Monitoring du Cache

```typescript
import { ClientCache } from "@/utils/catalogueCache";

const cache = new ClientCache<any>();

// Ajouter des données
cache.set("key1", "value1");
cache.set("key2", "value2");

// Obtenir des statistiques
console.log("Cache size:", cache.size()); // 2
console.log("Key1 age:", cache.getAge("key1")); // 1234 (ms)

// Nettoyage manuel
cache.cleanup(); // Supprime les entrées expirées
```

---

### Exemple 5 : Cache avec Retry Logic

```typescript
import { ClientCache } from "@/utils/catalogueCache";

const apiCache = new ClientCache<any>(5 * 60 * 1000);

async function fetchWithRetry<T>(
  url: string,
  cacheKey: string,
  maxRetries = 3,
): Promise<T> {
  // Vérifier le cache
  const cached = apiCache.get<T>(cacheKey);
  if (cached) return cached;

  // Fetch avec retry
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Cache le résultat
      apiCache.set(cacheKey, data);

      return data;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);

      if (attempt < maxRetries - 1) {
        // Délai exponentiel : 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("All retries failed");
}

// Usage
const data = await fetchWithRetry<Product[]>(
  "/api/products",
  "products-all",
  3,
);
```

---

### Exemple 6 : Cache Partagé Global

```typescript
// src/lib/globalCache.ts
import { ClientCache } from "@/utils/catalogueCache";

// Créer des instances partagées
export const userCache = new ClientCache<User>(15 * 60 * 1000); // 15 min
export const productsCache = new ClientCache<Product>(5 * 60 * 1000); // 5 min
export const settingsCache = new ClientCache<Settings>(30 * 60 * 1000); // 30 min

// Fonction utilitaire pour invalider tout
export function clearAllCaches() {
  userCache.clear();
  productsCache.clear();
  settingsCache.clear();
  console.log("🧹 All caches cleared");
}
```

```typescript
// Usage dans un composant
import { userCache, clearAllCaches } from '@/lib/globalCache';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const cached = userCache.get(userId);
      if (cached) {
        setUser(cached);
        return;
      }

      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      userCache.set(userId, data);
      setUser(data);
    };

    loadUser();
  }, [userId]);

  return <div>{user?.name}</div>;
}
```

---

## 🎨 Pattern Recommandés

### 1. Cache-First Strategy

```typescript
async function loadData(key: string) {
  // Toujours vérifier le cache en premier
  const cached = cache.get(key);
  if (cached) return cached;

  // Sinon, fetch et cache
  const data = await fetch(`/api/${key}`);
  cache.set(key, data);
  return data;
}
```

### 2. Network-First Strategy

```typescript
async function loadData(key: string) {
  try {
    // Essayer de fetcher en premier
    const data = await fetch(`/api/${key}`);
    cache.set(key, data);
    return data;
  } catch (error) {
    // En cas d'erreur, utiliser le cache
    const cached = cache.get(key);
    if (cached) {
      console.warn("Using stale cache due to network error");
      return cached;
    }
    throw error;
  }
}
```

### 3. Stale-While-Revalidate (Recommandé)

```typescript
async function loadData(key: string) {
  const cached = cache.get(key);

  if (cached) {
    // Retourner le cache immédiatement
    setTimeout(() => {
      // Rafraîchir en arrière-plan
      fetch(`/api/${key}`).then((data) => cache.set(key, data));
    }, 0);

    return cached;
  }

  // Pas de cache, fetch synchrone
  const data = await fetch(`/api/${key}`);
  cache.set(key, data);
  return data;
}
```

---

## ⚙️ Configuration Avancée

### TTL Dynamique

```typescript
// TTL court pour données volatiles
cache.set("stock-prices", prices, 30 * 1000); // 30 secondes

// TTL long pour données stables
cache.set("user-settings", settings, 24 * 60 * 60 * 1000); // 24 heures
```

### Cleanup Automatique

```typescript
// Nettoyer toutes les 5 minutes
if (typeof window !== "undefined") {
  setInterval(
    () => {
      cache.cleanup();
      console.log("🧹 Cache cleaned up");
    },
    5 * 60 * 1000,
  );
}
```

---

## 🔍 Debugging

### Visualiser le Cache

```typescript
function debugCache(cache: ClientCache<any>) {
  console.log("=== Cache Debug ===");
  console.log("Size:", cache.size());

  // Note: pour voir le contenu, ajouter une méthode getAll() si nécessaire
}
```

### Logs Conditionnels

```typescript
const DEBUG = process.env.NODE_ENV === "development";

function logCacheHit(key: string) {
  if (DEBUG) {
    console.log(`📦 Cache hit: ${key}`);
  }
}
```

---

## ⚠️ Bonnes Pratiques

### ✅ DO

- Utiliser des clés descriptives (`user-123`, `products-electronics`)
- Définir des TTL appropriés selon la volatilité des données
- Invalider le cache après mutations (POST, PUT, DELETE)
- Gérer les erreurs de parsing du cache
- Implémenter stale-while-revalidate pour UX optimale

### ❌ DON'T

- Ne pas stocker de données sensibles (tokens, mots de passe)
- Ne pas cacher des données trop volumineuses (> 1MB)
- Ne pas oublier d'invalider après mutation
- Ne pas utiliser le même cache pour données différentes
- Ne pas cacher des erreurs API

---

## 📊 Monitoring

### Métriques à Suivre

```typescript
interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number; // hits / (hits + misses)
  size: number;
}

// Exemple d'implémentation
class MonitoredCache<T> extends ClientCache<T> {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    size: 0,
  };

  get(key: string): T | null {
    const value = super.get(key);

    if (value) {
      this.metrics.hits++;
    } else {
      this.metrics.misses++;
    }

    this.metrics.hitRate =
      this.metrics.hits / (this.metrics.hits + this.metrics.misses);
    this.metrics.size = this.size();

    return value;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }
}
```

---

## 🔗 Ressources

- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [Web.dev: Caching Strategies](https://web.dev/offline-cookbook/)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)

---

**Date de mise à jour** : 2025-10-09
