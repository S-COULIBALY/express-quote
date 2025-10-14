# 🔥 Analyse de Performance Critique - DetailForm

## 📊 PROBLÈME IDENTIFIÉ : N+1 Queries

### **Symptômes**

- Page `/catalogue/[catalogId]` charge en **~5 secondes** au lieu de < 1s
- **11 requêtes API identiques** à `/api/rules/unified`
- Chaque requête retourne les **mêmes 76 règles**
- Total : **~3.5 secondes** perdues en requêtes redondantes

---

## 🔍 ANALYSE DÉTAILLÉE DES LOGS

### Timeline de Chargement

```
┌─────────────────────────────────────────────────────────────────┐
│              CHRONOLOGIE DU CHARGEMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  0ms    ─── Page Load                                           │
│  2000ms ─── ✓ Compiled /catalogue/[catalogId] (2455 modules)   │
│  3300ms ─── ✓ GET /api/catalogue/[catalogId] (1.3s) ✅         │
│            └─> SELECT catalogue_selection + item                │
│                                                                  │
│  3300ms ─┬─ 🔴 POST /api/rules/unified #1  (332ms)             │
│  3720ms ─├─ 🔴 POST /api/rules/unified #2  (420ms)             │
│  3807ms ─├─ 🔴 POST /api/rules/unified #3  (87ms)              │
│  4241ms ─├─ 🔴 POST /api/rules/unified #4  (434ms)             │
│  4646ms ─├─ 🔴 POST /api/rules/unified #5  (405ms)             │
│  5104ms ─├─ 🔴 POST /api/rules/unified #6  (458ms)             │
│  5532ms ─├─ 🔴 POST /api/rules/unified #7  (428ms)             │
│  5593ms ─├─ 🔴 POST /api/rules/unified #8  (61ms)              │
│  5663ms ─├─ 🔴 POST /api/rules/unified #9  (70ms)              │
│  5737ms ─├─ 🔴 POST /api/rules/unified #10 (74ms)              │
│  5816ms ─└─ 🔴 POST /api/rules/unified #11 (79ms)              │
│                                                                  │
│  5816ms ─── ✓ Page Ready (TROP LENT !)                         │
└─────────────────────────────────────────────────────────────────┘

TOTAL: ~5.8 secondes 🔥
GASPILLAGE: ~3.5 secondes (11 requêtes × ~300ms)
```

---

## 🔬 CAUSE RACINE

### 1. Hook `useUnifiedRules` Appelé 11 Fois

**Fichier** : `src/hooks/useUnifiedRules.ts`

```typescript
// Ligne 42-100
useEffect(() => {
  const loadRules = async () => {
    // 🔴 PROBLÈME : Fetch SANS cache
    const response = await fetch("/api/rules/unified", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ruleType, // Ex: 'CONSTRAINT'
        serviceType, // Ex: 'MOVING'
        condition, // Ex: { type: 'pickup' }
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setRules(data);
    }
  };

  loadRules();
}, [ruleType, serviceType, JSON.stringify(condition)]);
```

**Problème** :

- ❌ Pas de cache
- ❌ Chaque composant refetch les mêmes données
- ❌ 11 composants = 11 requêtes

---

### 2. Composants Déclencheurs

**Fichier** : `src/components/form-generator/components/AccessConstraintsModal.tsx`

```typescript
// Ce composant est rendu 11 fois (1 par champ d'adresse)
const AccessConstraintsModal = () => {
  const { rules: pickupConstraints } = useUnifiedRules({
    ruleType: RuleType.CONSTRAINT,
    serviceType: ServiceType.MOVING,
    condition: { type: "pickup" },
  });

  const { rules: deliveryConstraints } = useUnifiedRules({
    ruleType: RuleType.CONSTRAINT,
    serviceType: ServiceType.MOVING,
    condition: { type: "delivery" },
  });

  // ... Chaque instance déclenche 2 requêtes
};
```

**Calcul** :

```
11 champs d'adresse × 2 appels (pickup + delivery) = 22 potentiels
Mais avec cache React (dépendances identiques) : ~11 requêtes réelles
```

---

### 3. Requêtes Identiques

Analyse des paramètres envoyés :

```javascript
// Request 1, 4, 7, 8, 10 (5 fois identiques)
{
  ruleType: 'CUSTOM',
  serviceType: 'MOVING',
  condition: { type: 'pickup' }
}

// Request 2, 6, 9, 11 (4 fois identiques)
{
  ruleType: 'CONSTRAINT',
  serviceType: 'MOVING',
  condition: { type: 'delivery' }
}

// Request 3, 5 (2 fois identiques)
{
  ruleType: 'CUSTOM',
  serviceType: 'MOVING',
  condition: { type: 'delivery' }
}
```

**Résultat** :

```sql
-- Exécuté 11 fois avec le MÊME résultat (76 règles) :
SELECT * FROM rules
WHERE isActive = true
  AND (validFrom IS NULL OR validFrom <= NOW())
  AND (validTo IS NULL OR validTo >= NOW())
ORDER BY priority ASC
```

---

## 💥 IMPACT SUR LA PERFORMANCE

| Métrique                | Avant                    | Objectif | Écart    |
| ----------------------- | ------------------------ | -------- | -------- |
| **Temps de chargement** | 5.8s                     | < 1s     | **-83%** |
| **Requêtes API**        | 11                       | 1        | **-91%** |
| **Queries DB**          | 11                       | 1        | **-91%** |
| **Données transférées** | 76 rules × 11 = 836 rows | 76 rows  | **-91%** |

---

## 📈 COMPOSANTS POUVANT UTILISER `catalogueCache.ts`

### Inventaire Complet

```
src/
├── app/
│   ├── catalogue/
│   │   ├── page.tsx ✅ DÉJÀ IMPLÉMENTÉ (localStorage inline)
│   │   └── [catalogId]/
│   │       └── page.tsx 🔴 PEUT BÉNÉFICIER (cache côté serveur)
│   ├── admin/
│   │   ├── catalogue/page.tsx 🟡 POTENTIEL (liste catalogues)
│   │   ├── items/page.tsx 🟡 POTENTIEL (liste items)
│   │   └── rules-management/page.tsx 🔴 CRITIQUE (règles)
│   └── bookings/
│       └── [id]/page.tsx 🟢 FAIBLE PRIORITÉ
│
├── components/
│   ├── DetailForm.tsx 🟡 PEUT BÉNÉFICIER (transformedData)
│   ├── CatalogHero.tsx 🟢 FAIBLE PRIORITÉ (reçoit les données)
│   └── form-generator/
│       └── components/
│           └── AccessConstraintsModal.tsx 🔴 CRITIQUE (rules)
│
└── hooks/
    └── useUnifiedRules.ts 🔴 CRITIQUE (source du problème)
```

### Priorisation

**🔴 CRITIQUE (Implémenter maintenant)** :

1. `useUnifiedRules.ts` - Cache des règles unifiées
2. `AccessConstraintsModal.tsx` - Éviter les 11 requêtes

**🟡 IMPORTANT (Implémenter bientôt)** : 3. `admin/rules-management/page.tsx` - Liste des règles 4. `admin/catalogue/page.tsx` - Liste des catalogues 5. `admin/items/page.tsx` - Liste des items

**🟢 OPTIONNEL (Plus tard)** : 6. `DetailForm.tsx` - Cache des transformedData 7. `bookings/[id]/page.tsx` - Données booking

**Total : 7 composants** peuvent bénéficier du cache

---

## ✅ SOLUTION : Cache avec `catalogueCache.ts`

### Étape 1 : Créer les Instances de Cache

```typescript
// src/lib/caches.ts
import { ClientCache } from "@/utils/catalogueCache";

// Cache pour les règles unifiées (TTL 10 minutes)
export const rulesCache = new ClientCache<any[]>(10 * 60 * 1000);

// Cache pour le catalogue (TTL 5 minutes)
export const catalogueCache = new ClientCache<any>(5 * 60 * 1000);

// Cache pour les items (TTL 5 minutes)
export const itemsCache = new ClientCache<any[]>(5 * 60 * 1000);

// Fonction pour invalider tous les caches
export function clearAllCaches() {
  rulesCache.clear();
  catalogueCache.clear();
  itemsCache.clear();
  console.log("🧹 All caches cleared");
}
```

---

### Étape 2 : Refactoriser `useUnifiedRules`

**AVANT (Problématique)** :

```typescript
// src/hooks/useUnifiedRules.ts (AVANT)
useEffect(() => {
  const loadRules = async () => {
    // ❌ Pas de cache
    const response = await fetch("/api/rules/unified", {
      method: "POST",
      body: JSON.stringify({ ruleType, serviceType, condition }),
    });

    const data = await response.json();
    setRules(data);
  };

  loadRules();
}, [ruleType, serviceType, JSON.stringify(condition)]);
```

**APRÈS (Avec Cache)** :

```typescript
// src/hooks/useUnifiedRules.ts (APRÈS)
import { rulesCache } from "@/lib/caches";

useEffect(() => {
  const loadRules = async () => {
    // 1. Créer une clé de cache unique
    const cacheKey = `rules-${ruleType}-${serviceType}-${JSON.stringify(condition)}`;

    // 2. ✅ Vérifier le cache
    const cached = rulesCache.get(cacheKey);
    if (cached) {
      console.log("📦 Cache hit:", cacheKey);
      setRules(cached);
      setLoading(false);

      // Optionnel: Refresh en arrière-plan (stale-while-revalidate)
      refreshInBackground(cacheKey);
      return;
    }

    // 3. Fetch depuis l'API
    console.log("🔄 Cache miss, fetching:", cacheKey);
    const response = await fetch("/api/rules/unified", {
      method: "POST",
      body: JSON.stringify({ ruleType, serviceType, condition }),
    });

    const data = await response.json();

    // 4. ✅ Mettre en cache
    rulesCache.set(cacheKey, data);
    setRules(data);
    setLoading(false);
  };

  const refreshInBackground = async (cacheKey: string) => {
    try {
      const response = await fetch("/api/rules/unified", {
        method: "POST",
        body: JSON.stringify({ ruleType, serviceType, condition }),
      });

      if (response.ok) {
        const data = await response.json();
        rulesCache.set(cacheKey, data);
        console.log("🔄 Cache updated in background:", cacheKey);
      }
    } catch (error) {
      console.warn("⚠️ Background refresh failed:", error);
    }
  };

  loadRules();
}, [ruleType, serviceType, JSON.stringify(condition)]);
```

---

### Étape 3 : Résultat Attendu

```
AVANT (11 requêtes) :
┌─────────────────────────────────────────────────────────────┐
│  Request 1  ─── pickup/CUSTOM       ─── 332ms               │
│  Request 2  ─── delivery/CONSTRAINT ─── 420ms               │
│  Request 3  ─── delivery/CUSTOM     ─── 87ms                │
│  Request 4  ─── pickup/CONSTRAINT   ─── 434ms               │
│  ... (7 autres requêtes identiques)                         │
│  TOTAL: ~3.5 secondes 🔴                                    │
└─────────────────────────────────────────────────────────────┘

APRÈS (1 requête + cache) :
┌─────────────────────────────────────────────────────────────┐
│  Request 1  ─── pickup/CUSTOM       ─── 332ms  (API)       │
│  Request 2  ─── delivery/CONSTRAINT ─── <1ms   (CACHE) ✅  │
│  Request 3  ─── delivery/CUSTOM     ─── <1ms   (CACHE) ✅  │
│  Request 4  ─── pickup/CONSTRAINT   ─── <1ms   (CACHE) ✅  │
│  ... (7 autres depuis cache)                                │
│  TOTAL: ~350ms (-90%) 🟢                                    │
└─────────────────────────────────────────────────────────────┘

AMÉLIORATION : 3.5s → 0.35s (10x plus rapide !)
```

---

## 🧹 NETTOYAGE DES CONSOLE.LOG

### Fichiers à Nettoyer

1. **src/components/DetailForm.tsx** (48 console.log)

   ```typescript
   // ❌ À supprimer :
   console.log("🎯 [ÉTAPE 4] DetailForm - Initialisation...");
   console.log("📍 [ÉTAPE 4] catalogData reçu:", {...});
   console.log("⚙️ [ÉTAPE 4.1] Détermination du type de preset");
   // ... (45 autres)
   ```

2. **src/hooks/useUnifiedRules.ts** (5 console.log)

   ```typescript
   // ❌ À supprimer :
   console.log("🚀 Sending API request:", payload);
   console.log("✅ Règles chargées depuis l'API:", data.length);
   console.log("⚠️ Erreur API, utilisation des fallbacks:", apiError);
   // ... (2 autres)
   ```

3. **src/components/form-generator/components/FormField.tsx** (2 console.log)
   ```typescript
   // ❌ À supprimer :
   console.error("❌ [FormField] register is not a function:", register);
   console.log("🔧 [ÉTAPE 9.2] FormField - Rendu champ individuel:", {...});
   ```

### Solution : Logger Conditionnel

```typescript
// src/lib/logger.ts (créer si n'existe pas)
const isDev = process.env.NODE_ENV === "development";

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  error: (...args: any[]) => {
    if (isDev) console.error(...args);
  },
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
};

// Usage :
import { logger } from "@/lib/logger";

logger.log("🎯 [ÉTAPE 4] DetailForm - Initialisation...");
// En production : silencieux
// En dev : affiché
```

---

## 📊 IMPACT TOTAL APRÈS CORRECTIONS

| Métrique                   | Avant   | Après     | Amélioration      |
| -------------------------- | ------- | --------- | ----------------- |
| **Temps de chargement**    | 5.8s    | 1.5s      | **-74%** 🚀       |
| **Requêtes API**           | 11      | 1-3       | **-82%** 💾       |
| **Queries DB**             | 11      | 1         | **-91%** 🗄️       |
| **Console.log (prod)**     | 55      | 0         | **-100%** 🧹      |
| **Expérience utilisateur** | 😫 Lent | 😊 Rapide | **Excellente** ✅ |

---

## 🎯 PLAN D'ACTION

### Phase 1 : Correction Critique (1-2h)

- [x] Créer `src/lib/caches.ts`
- [ ] Refactoriser `useUnifiedRules.ts` avec cache
- [ ] Tester sur `/catalogue/[catalogId]`
- [ ] Vérifier les logs (doit voir "📦 Cache hit")

### Phase 2 : Nettoyage (30min)

- [ ] Créer `src/lib/logger.ts`
- [ ] Remplacer tous les `console.log` par `logger.log`
- [ ] Vérifier qu'en prod les logs sont silencieux

### Phase 3 : Optimisations Supplémentaires (Optionnel)

- [ ] Ajouter le cache dans `admin/rules-management`
- [ ] Ajouter le cache dans `admin/catalogue`
- [ ] Implémenter des métriques de cache (hits/misses)

---

## 🔬 TESTS DE VALIDATION

### Test 1 : Cache Hit

```bash
1. Charger /catalogue/[catalogId]
2. Vérifier console : "🔄 Cache miss" (première fois)
3. Recharger la page
4. Vérifier console : "📦 Cache hit" (fois suivantes)
5. ✅ Temps de chargement < 2s
```

### Test 2 : Nombre de Requêtes

```bash
1. Ouvrir DevTools > Network
2. Charger /catalogue/[catalogId]
3. Filtrer "/api/rules/unified"
4. ✅ Doit voir 1-3 requêtes (au lieu de 11)
```

### Test 3 : Logs en Production

```bash
1. npm run build
2. npm start
3. Ouvrir /catalogue/[catalogId]
4. Ouvrir console navigateur
5. ✅ Aucun log visible
```

---

**Date** : 2025-10-09
**Priorité** : 🔴 CRITIQUE
**Status** : ⏳ EN ATTENTE D'IMPLÉMENTATION
