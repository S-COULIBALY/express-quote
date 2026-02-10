# QuoteContext vs ComputedContext : Clarification

## ❓ La Confusion

**Question** : Dans QuoteContext, est-ce que "activatedModules" et "computed" contiennent les mêmes modules et jouent le même rôle ?

**Réponse courte** : **NON !** Ils sont complètement différents.

---

## 🔍 Structure Réelle

### QuoteContext (Contexte d'entrée)

```typescript
export interface QuoteContext {
  // Données utilisateur (formulaire)
  serviceType: 'MOVING';
  region: 'IDF';
  movingDate?: string;
  estimatedVolume?: number;  // Volume (m³) – calculateur V3 ou analyse LIST/VIDEO
  departureAddress: string;
  arrivalAddress: string;
  declaredValue?: number;
  // ... 50+ autres champs ...

  // ============================================================================
  // SORTIE (INJECTÉE PAR LE MOTEUR)
  // ============================================================================
  computed?: ComputedContext;  // ← Objet ComputedContext complet

  // ============================================================================
  // MÉTADONNÉES
  // ============================================================================
  metadata?: Record<string, any>;
}
```

**Point clé** : `QuoteContext` contient **un objet** `computed` de type `ComputedContext`.

### ComputedContext (Contexte calculé)

```typescript
export interface ComputedContext {
  // Volume & Véhicules
  baseVolume?: number;
  adjustedVolume?: number;
  vehicleCount?: number;

  // Distance & Transport
  distanceKm?: number;
  estimatedTravelTimeMinutes?: number;

  // Coûts
  costs: Cost[];

  // Prix
  basePrice?: number;
  finalPrice?: number;
  adjustments: PriceAdjustment[];

  // Risque
  riskContributions: RiskContribution[];
  riskScore?: number;

  // ... autres champs ...

  // ============================================================================
  // OPÉRATIONNEL & TRAÇABILITÉ
  // ============================================================================
  operationalFlags: string[];
  activatedModules: string[];  // ← C'est ICI que se trouve activatedModules !
  metadata: Record<string, any>;
}
```

**Point clé** : `activatedModules` est **à l'intérieur** de `ComputedContext`, pas directement dans `QuoteContext`.

---

## 📊 Visualisation de la Structure

```
QuoteContext
│
├─ serviceType: "MOVING"
├─ region: "IDF"
├─ movingDate: "2025-02-15T12:00:00Z"
├─ departureAddress: "123 Rue..."
├─ arrivalAddress: "456 Avenue..."
├─ declaredValue: 15000
│
└─ computed: ComputedContext              ← Objet complet
   │
   ├─ baseVolume: 30
   ├─ adjustedVolume: 35
   ├─ distanceKm: 12
   ├─ workersCount: 3
   │
   ├─ costs: [...]                        ← Tableau de coûts
   ├─ basePrice: 2100
   ├─ finalPrice: 2580
   │
   ├─ riskScore: 45
   │
   └─ activatedModules: [                 ← Tableau d'IDs de modules
      "input-sanitization",
      "date-validation",
      "volume-estimation",
      "distance-calculation",
      "fuel-cost",
      "vehicle-selection",
      "workers-calculation",
      "labor-base",
      "insurance-premium"
   ]
```

---

## 🎯 Différences Fondamentales

### 1. `QuoteContext.computed` (L'OBJET)

**Type** : `ComputedContext` (objet complet)

**Contenu** : **TOUS les résultats calculés**
- Volume ajusté
- Distance
- Nombre de déménageurs
- **Coûts détaillés** (tableau)
- **Prix** (base et final)
- **Risques** (score et contributions)
- **Impacts juridiques**
- **Et aussi** : `activatedModules`

**Rôle** : Conteneur de **toutes les données calculées** par le moteur

**Exemple d'accès** :
```typescript
// Accéder au prix final
const price = result.computed?.finalPrice;

// Accéder au score de risque
const risk = result.computed?.riskScore;

// Accéder aux modules activés
const modules = result.computed?.activatedModules;

// Accéder aux coûts
const costs = result.computed?.costs;
```

---

### 2. `ComputedContext.activatedModules` (LE TABLEAU)

**Type** : `string[]` (tableau de chaînes)

**Contenu** : **UNIQUEMENT les IDs des modules exécutés**
```typescript
activatedModules = [
  "input-sanitization",
  "date-validation",
  "volume-estimation",
  "distance-calculation",
  "fuel-cost"
]
```

**Rôle** : **Traçabilité** - Savoir quels modules ont participé au calcul

**Exemple d'accès** :
```typescript
// Vérifier si un module a été exécuté
const hasInsurance = result.computed?.activatedModules.includes('insurance-premium');

// Compter le nombre de modules exécutés
const moduleCount = result.computed?.activatedModules.length;

// Lister les modules activés
result.computed?.activatedModules.forEach(moduleId => {
  console.log('Module activé:', moduleId);
});
```

---

## 🔑 Relation Entre Les Deux

### Hiérarchie

```
QuoteContext.computed                    (Objet parent)
    │
    ├─ baseVolume                        (Champ calculé)
    ├─ distanceKm                        (Champ calculé)
    ├─ costs                             (Tableau de coûts)
    ├─ basePrice                         (Champ calculé)
    ├─ finalPrice                        (Champ calculé)
    ├─ riskScore                         (Champ calculé)
    │
    └─ activatedModules                  (Champ de traçabilité - ENFANT)
           │
           ├─ "input-sanitization"
           ├─ "date-validation"
           ├─ "volume-estimation"
           └─ ...
```

### Analogie

Pensez à `computed` comme un **rapport d'audit complet** :

```
📄 Rapport de Calcul de Devis (computed)
├─ 📊 Données techniques
│  ├─ Volume: 30 m³
│  ├─ Distance: 12 km
│  └─ Déménageurs: 3
│
├─ 💰 Détails financiers
│  ├─ Coûts: [transport 150€, main-d'œuvre 800€, ...]
│  ├─ Prix de base: 2100€
│  └─ Prix final: 2580€
│
├─ ⚠️ Analyse de risque
│  └─ Score: 45/100
│
└─ 📋 Journal d'audit (activatedModules)    ← Section traçabilité
   ├─ Module 1: input-sanitization
   ├─ Module 2: date-validation
   ├─ Module 3: volume-estimation
   └─ ...
```

`activatedModules` est **une section** du rapport complet `computed`, pas un doublon.

---

## 📝 Exemples Pratiques

### Exemple 1 : Accéder aux données

```typescript
const context: QuoteContext = {
  serviceType: 'MOVING',
  region: 'IDF',
  departureAddress: '123 Rue...',
  // ... autres données utilisateur ...
};

// Exécuter le moteur
const engine = createStandardQuoteEngine();
const result = engine.execute(context);

// ✅ Accéder à l'objet computed complet
console.log(result.computed);
// Output: { baseVolume: 30, distanceKm: 12, costs: [...], activatedModules: [...], ... }

// ✅ Accéder au prix (qui est DANS computed)
console.log(result.computed?.finalPrice);
// Output: 2580

// ✅ Accéder aux modules activés (qui sont DANS computed)
console.log(result.computed?.activatedModules);
// Output: ["input-sanitization", "date-validation", ...]

// ✅ Accéder à un module spécifique
const hasDistanceModule = result.computed?.activatedModules.includes('distance-calculation');
console.log('Distance calculée:', hasDistanceModule);
// Output: true
```

### Exemple 2 : Erreur de confusion courante

```typescript
// ❌ FAUX - activatedModules n'est PAS directement dans QuoteContext
console.log(result.activatedModules);  // undefined !

// ✅ CORRECT - activatedModules est dans computed
console.log(result.computed?.activatedModules);  // ["input-sanitization", ...]

// ❌ FAUX - computed n'est PAS un tableau
result.computed.forEach(module => { ... });  // Erreur TypeScript !

// ✅ CORRECT - computed est un objet
console.log(result.computed.finalPrice);     // 2580
console.log(result.computed.distanceKm);     // 12
console.log(result.computed.activatedModules);  // ["input-sanitization", ...]
```

### Exemple 3 : Utilisation complète

```typescript
// Après exécution du moteur
const result = engine.execute(context);

// 1. Vérifier que le calcul s'est bien passé
if (!result.computed) {
  throw new Error('Calcul échoué');
}

// 2. Extraire les données calculées (de computed)
const {
  finalPrice,
  basePrice,
  distanceKm,
  workersCount,
  riskScore,
  activatedModules,  // ← Aussi dans computed !
  costs,
  legalImpacts
} = result.computed;

// 3. Afficher les résultats
console.log('Prix final:', finalPrice);
console.log('Distance:', distanceKm, 'km');
console.log('Déménageurs:', workersCount);
console.log('Score de risque:', riskScore);

// 4. Analyser les modules exécutés (de activatedModules)
console.log('Modules exécutés:', activatedModules.length);
activatedModules.forEach(moduleId => {
  console.log(`  - ${moduleId}`);
});

// 5. Vérifier des modules critiques
if (activatedModules.includes('monte-meubles-refusal')) {
  console.warn('⚠️ Monte-meubles refusé - responsabilité limitée');
}

// 6. Détailler les coûts
costs.forEach(cost => {
  console.log(`${cost.label}: ${cost.amount}€ (${cost.category})`);
});
```

---

## 🎓 Résumé Final

| Aspect | `QuoteContext.computed` | `ComputedContext.activatedModules` |
|--------|------------------------|-----------------------------------|
| **Type** | `ComputedContext` (objet) | `string[]` (tableau) |
| **Contenu** | **Tous** les résultats calculés | **Uniquement** les IDs de modules |
| **Inclut** | Volume, distance, prix, coûts, risque, **et** activatedModules | Liste de strings (IDs) |
| **Rôle** | Conteneur de données | Traçabilité |
| **Accès** | `result.computed` | `result.computed?.activatedModules` |
| **Relation** | **Parent** (contient tout) | **Enfant** (champ de traçabilité) |

### Points Clés

1. ✅ `computed` est un **objet** qui contient **tous les résultats calculés**
2. ✅ `activatedModules` est un **tableau** qui est **à l'intérieur** de `computed`
3. ✅ `activatedModules` est **une partie** de `computed`, pas un doublon
4. ✅ Pour accéder à `activatedModules`, il faut passer par `computed` : `result.computed?.activatedModules`
5. ✅ `computed` contient bien plus que juste `activatedModules` (prix, coûts, risque, etc.)

### Mnémotechnique

```
QuoteContext
    └─ computed (le rapport complet) 📄
        ├─ Données techniques 📊
        ├─ Données financières 💰
        ├─ Données de risque ⚠️
        └─ activatedModules (le journal d'audit) 📋
```

**En un mot** : `computed` est le **rapport complet**, `activatedModules` est **une section** de ce rapport (le journal d'audit des modules exécutés).
