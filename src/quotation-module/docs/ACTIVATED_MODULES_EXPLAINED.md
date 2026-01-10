# 📋 EXPLICATION COMPLÈTE : `activatedModules`

## 🎯 Qu'est-ce que `activatedModules` ?

`activatedModules` est un **tableau de traçabilité** qui enregistre **tous les modules qui ont été exécutés** pendant le calcul d'un devis. C'est comme un **journal d'audit** complet du processus de calcul.

---

## 📍 Où se trouve-t-il ?

### 1. Définition dans le type

**Fichier** : `src/quotation-module/core/ComputedContext.ts:137`

```typescript
export interface ComputedContext {
  // ... autres champs ...

  // ============================================================================
  // OPÉRATIONNEL & TRAÇABILITÉ
  // ============================================================================
  operationalFlags: string[]; // "LIFT_REQUIRED", "PARKING_AUTHORIZATION_NEEDED", etc.
  activatedModules: string[]; // IDs des modules exécutés (traçabilité)
  metadata: Record<string, any>;
}
```

### 2. Initialisation par le moteur

**Fichier** : `src/quotation-module/core/QuoteEngine.ts:57`

```typescript
execute(ctx: QuoteContext): QuoteContext {
  // 1. Initialiser ctx.computed (CRITIQUE - fait uniquement ici)
  let enrichedCtx: QuoteContext = {
    ...ctx,
    computed: createEmptyComputedContext(), // activatedModules: []
  };

  // ... suite de l'exécution
}
```

**Fichier** : `src/quotation-module/core/ComputedContext.ts:145`

```typescript
export function createEmptyComputedContext(): ComputedContext {
  return {
    costs: [],
    adjustments: [],
    riskContributions: [],
    legalImpacts: [],
    insuranceNotes: [],
    requirements: [],
    crossSellProposals: [],
    operationalFlags: [],
    activatedModules: [], // ← Tableau vide initialisé ici
    metadata: {},
  };
}
```

### 3. Alimentation par les modules

**Exemple** : `src/quotation-module/modules/normalization/DateValidationModule.ts:45-52`

```typescript
export class DateValidationModule implements QuoteModule {
  readonly id = 'date-validation';
  readonly priority = 11;

  apply(ctx: QuoteContext): QuoteContext {
    // ... logique de validation ...

    return {
      ...ctx,
      movingDate: normalizedDate.toISOString(),
      activatedModules: [
        ...(ctx.activatedModules || []),  // Copier les modules déjà activés
        {
          id: this.id,                    // 'date-validation'
          priority: this.priority,         // 11
          timestamp: new Date().toISOString() // '2025-12-20T16:30:00.000Z'
        }
      ]
    };
  }
}
```

### 4. Vérification par le moteur (garde-fou)

**Fichier** : `src/quotation-module/core/QuoteEngine.ts:110-116`

```typescript
// Exécuter le module
enrichedCtx = module.apply(enrichedCtx);

// Ajouter à la traçabilité (au cas où le module l'aurait oublié)
if (
  enrichedCtx.computed &&
  !enrichedCtx.computed.activatedModules.includes(module.id)
) {
  enrichedCtx.computed.activatedModules.push(module.id);
}
```

**Note** : Le moteur a un garde-fou qui ajoute automatiquement le module si celui-ci a oublié de le faire.

---

## 🔧 À quoi sert `activatedModules` ?

### 1. ✅ Traçabilité Complète

Permet de savoir **exactement quels modules ont participé** au calcul du devis.

**Exemple de résultat** :

```typescript
result.computed.activatedModules = [
  'input-sanitization',      // Module 1 exécuté
  'date-validation',         // Module 2 exécuté
  'volume-estimation',       // Module 3 exécuté
  'distance-calculation',    // Module 4 exécuté
  'fuel-cost',              // Module 5 exécuté
  'vehicle-selection',      // Module 6 exécuté
  'workers-calculation',    // Module 7 exécuté
  'labor-base',             // Module 8 exécuté
  'insurance-premium'       // Module 9 exécuté
];
```

**Avantage** : On peut reconstituer **tout le processus de calcul** après coup.

---

### 2. ✅ Vérification des Dépendances

Le moteur vérifie qu'un module dépendant a bien ses prérequis avant de l'exécuter.

**Fichier** : `src/quotation-module/core/QuoteEngine.ts:192-196`

```typescript
/**
 * Vérifie les dépendances explicites d'un module
 */
private hasDependencies(module: QuoteModule, ctx: QuoteContext): boolean {
  if (!module.dependencies || module.dependencies.length === 0) {
    return true;
  }

  if (!ctx.computed) {
    return false;
  }

  // Vérifie que TOUS les modules dépendants sont dans activatedModules
  return module.dependencies.every((depId) =>
    ctx.computed!.activatedModules.includes(depId)
  );
}
```

**Exemple concret** :

```typescript
// Module qui dépend de 'distance-calculation'
export class FuelCostModule implements QuoteModule {
  readonly id = 'fuel-cost';
  readonly priority = 33;
  readonly dependencies = ['distance-calculation']; // ← Dépendance explicite

  apply(ctx: QuoteContext): QuoteContext {
    // ✅ Ce module ne s'exécute QUE SI 'distance-calculation'
    //    est dans activatedModules

    const distance = ctx.computed.distanceKm; // Sûr d'exister !

    const fuelCost = this.calculateFuelCost(distance);

    ctx.computed.costs.push({
      moduleId: this.id,
      label: 'Carburant aller-retour',
      amount: fuelCost,
      category: 'TRANSPORT',
    });

    ctx.computed.activatedModules.push(this.id);
    return ctx;
  }
}
```

**Scénario d'échec** :

```typescript
// Si 'distance-calculation' n'a PAS été exécuté
activatedModules = ['input-sanitization', 'date-validation', 'volume-estimation'];

// Le moteur vérifie
hasDependencies(FuelCostModule, ctx)
// → dependencies.includes('distance-calculation')
// → activatedModules.includes('distance-calculation') = false
// → return false
// → Module FuelCostModule IGNORÉ avec warning
```

---

### 3. 🐛 Debugging et Diagnostic

Permet de comprendre **pourquoi un prix a été calculé d'une certaine façon**.

**Exemple** :

```typescript
// En cas de prix inattendu
console.log('Prix final:', result.computed.finalPrice); // 2 580 €
console.log('Modules activés:', result.computed.activatedModules);

// Output:
// [
//   'volume-estimation',
//   'distance-calculation',
//   'no-elevator-pickup',        // ← Ah ! Pas d'ascenseur au départ
//   'manual-handling-risk',      // ← Monte-meubles refusé
//   'labor-access-penalty',      // ← Surcoût accès difficile
//   'insurance-premium'
// ]

// → Explication : Le prix élevé vient du refus du monte-meubles
//                 + accès difficile (pas d'ascenseur)
```

**Comparaison entre deux devis** :

```typescript
// Devis A : 1 850 €
devisA.computed.activatedModules = [
  'volume-estimation', 'distance-calculation',
  'vehicle-selection', 'labor-base'
];

// Devis B : 2 580 €
devisB.computed.activatedModules = [
  'volume-estimation', 'distance-calculation',
  'no-elevator-pickup',       // ← Différence 1
  'manual-handling-risk',     // ← Différence 2
  'labor-access-penalty',     // ← Différence 3
  'vehicle-selection', 'labor-base'
];

// → Différence de prix expliquée par 3 modules supplémentaires
```

---

### 4. ⚖️ Audit Juridique et Conformité

Preuve **légale** de ce qui a été calculé et affiché au client.

**Exemple d'enregistrement en base de données** :

```typescript
// Sauvegarde du devis avec traçabilité complète
const auditLog = {
  devisId: '12345',
  clientId: 'CLI-789',
  date: '2025-12-20T16:30:00Z',

  // Données client
  departureAddress: '123 Rue de la République, 75011 Paris',
  arrivalAddress: '456 Avenue Montaigne, 75008 Paris',

  // Résultats
  finalPrice: 2580,
  basePrice: 2100,

  // ✅ TRAÇABILITÉ COMPLÈTE
  activatedModules: result.computed.activatedModules,

  // Détails des coûts
  costs: result.computed.costs,
  adjustments: result.computed.adjustments,

  // Impacts juridiques
  legalImpacts: result.computed.legalImpacts,
};

// Permet de prouver plus tard :
// - Quels modules ont été appliqués
// - Quel calcul a été fait
// - Si l'assurance a bien été proposée
// - Si le monte-meubles a été refusé
```

**Cas d'usage juridique** :

```typescript
// Litige client : "Vous ne m'avez pas proposé l'assurance !"

// Vérification
const hasInsurance = devisAuditLog.activatedModules.includes('insurance-premium');

if (hasInsurance) {
  console.log('✅ Module d\'assurance exécuté le', devisAuditLog.date);
  console.log('✅ Prime calculée:', devisAuditLog.costs.find(c => c.moduleId === 'insurance-premium'));
  // → Preuve légale que l'assurance a bien été calculée et affichée
}
```

---

### 5. 📊 Statistiques et Analytics

Analyser quels modules sont **les plus utilisés** pour optimiser le système.

**Exemple d'analyse sur 1000 devis** :

```typescript
// Agrégation des modules activés sur 1000 devis
const allDevis = await fetchDevis({ limit: 1000 });

const moduleStats = allDevis.reduce((acc, devis) => {
  devis.computed.activatedModules.forEach(moduleId => {
    acc[moduleId] = (acc[moduleId] || 0) + 1;
  });
  return acc;
}, {});

console.log(moduleStats);

// Résultat:
// {
//   'volume-estimation': 1000,          // 100% (toujours activé)
//   'distance-calculation': 1000,       // 100% (toujours activé)
//   'no-elevator-pickup': 450,          // 45% (ascenseur manquant au départ)
//   'no-elevator-delivery': 320,        // 32% (ascenseur manquant à l'arrivée)
//   'weekend-surcharge': 120,           // 12% (déménagements week-end)
//   'end-of-month-surcharge': 85,       // 8.5% (fin de mois)
//   'monte-meubles-refusal': 78,        // 7.8% (refus monte-meubles)
//   'long-distance': 45,                // 4.5% (IDF → Province)
//   'packing-cost': 230,                // 23% (emballage choisi)
//   'insurance-premium': 1000           // 100% (toujours calculé)
// }
```

**Insights business** :

```typescript
// Modules à forte activation = opportunités d'optimisation
if (moduleStats['no-elevator-pickup'] > 400) {
  console.log('⚠️ 40%+ des déménagements sans ascenseur');
  console.log('💡 Suggestion: Promouvoir le monte-meubles de manière proactive');
}

// Modules de refus = friction utilisateur
if (moduleStats['monte-meubles-refusal'] > 50) {
  console.log('⚠️ 5%+ refusent le monte-meubles recommandé');
  console.log('💡 Suggestion: Améliorer la communication sur les risques');
}

// Modules cross-sell = revenus additionnels
const packingRevenue = allDevis
  .filter(d => d.computed.activatedModules.includes('packing-cost'))
  .reduce((sum, d) => sum + d.computed.costs.find(c => c.moduleId === 'packing-cost').amount, 0);

console.log('💰 Revenus emballage:', packingRevenue, '€');
```

---

## 🔄 Flux Complet d'Exécution

### Étape par étape

```
┌─────────────────────────────────────────────────────────────┐
│ 1. QuoteEngine initialise ctx.computed                     │
│    └─> activatedModules = []                               │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Module InputSanitizationModule s'exécute                │
│    └─> activatedModules = ['input-sanitization']           │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Module DateValidationModule s'exécute                   │
│    └─> activatedModules = [                                │
│        'input-sanitization',                                │
│        'date-validation'                                    │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Module VolumeEstimationModule s'exécute                 │
│    └─> activatedModules = [                                │
│        'input-sanitization',                                │
│        'date-validation',                                   │
│        'volume-estimation'                                  │
│    ]                                                        │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Module DistanceModule s'exécute                         │
│    └─> activatedModules = [..., 'distance-calculation']    │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Module FuelCostModule vérifie ses dépendances           │
│    ├─> dependencies = ['distance-calculation']             │
│    ├─> activatedModules.includes('distance-calculation')?  │
│    │    ✅ Oui, présent                                     │
│    └─> S'exécute et ajoute 'fuel-cost'                     │
└─────────────────────────────────────────────────────────────┘
                         ↓
                      ... etc
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ Résultat final                                              │
│                                                             │
│ activatedModules = [                                        │
│   'input-sanitization',                                     │
│   'date-validation',                                        │
│   'volume-estimation',                                      │
│   'distance-calculation',                                   │
│   'fuel-cost',                                              │
│   'vehicle-selection',                                      │
│   'workers-calculation',                                    │
│   'labor-base',                                             │
│   'insurance-premium'                                       │
│ ]                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ Points Critiques

### 1. Chaque module DOIT s'ajouter à `activatedModules`

**❌ FAUX - Module oublie de s'ajouter** :

```typescript
export class BadModule implements QuoteModule {
  readonly id = 'bad-module';
  readonly priority = 50;

  apply(ctx: QuoteContext): QuoteContext {
    // Fait son travail
    ctx.computed.costs.push({
      moduleId: this.id,
      label: 'Mon coût',
      amount: 100,
      category: 'LABOR',
    });

    // ❌ OUBLI : Ne s'ajoute pas à activatedModules
    return ctx;
  }
}
```

**✅ CORRECT - Module s'ajoute systématiquement** :

```typescript
export class GoodModule implements QuoteModule {
  readonly id = 'good-module';
  readonly priority = 50;

  apply(ctx: QuoteContext): QuoteContext {
    // Fait son travail
    ctx.computed.costs.push({
      moduleId: this.id,
      label: 'Mon coût',
      amount: 100,
      category: 'LABOR',
    });

    // ✅ CORRECT : S'ajoute à activatedModules
    ctx.computed.activatedModules.push(this.id);
    return ctx;
  }
}
```

### 2. Le moteur a un garde-fou automatique

**Fichier** : `src/quotation-module/core/QuoteEngine.ts:110-116`

```typescript
// Après l'exécution du module
enrichedCtx = module.apply(enrichedCtx);

// Garde-fou : vérifie que le module s'est bien ajouté
if (
  enrichedCtx.computed &&
  !enrichedCtx.computed.activatedModules.includes(module.id)
) {
  // Si oublié, le moteur l'ajoute automatiquement
  enrichedCtx.computed.activatedModules.push(module.id);
}
```

**Conséquence** : Même si un module oublie de s'ajouter, le système reste cohérent.

### 3. L'ordre dans `activatedModules` est important

L'ordre reflète **l'ordre réel d'exécution**, pas l'ordre de priorité.

**Exemple** :

```typescript
// Modules définis avec ces priorités
VolumeEstimationModule.priority = 20
DistanceModule.priority = 30
FuelCostModule.priority = 33

// Ordre d'exécution (par priorité croissante)
1. VolumeEstimationModule (20)
2. DistanceModule (30)
3. FuelCostModule (33)

// activatedModules reflète cet ordre
activatedModules = [
  'volume-estimation',     // 1er exécuté
  'distance-calculation',  // 2e exécuté
  'fuel-cost'              // 3e exécuté
]
```

**Important** : Si un module conditionnel n'est pas applicable, il n'apparaît PAS dans `activatedModules`.

```typescript
// Module conditionnel
export class WeekendModule implements QuoteModule {
  readonly id = 'weekend-surcharge';
  readonly priority = 85;

  isApplicable(ctx: QuoteContext): boolean {
    const day = new Date(ctx.movingDate).getDay();
    return day === 0 || day === 6; // Samedi ou Dimanche
  }

  apply(ctx: QuoteContext): QuoteContext {
    // ...
  }
}

// Si déménagement en semaine
activatedModules = [...]; // PAS de 'weekend-surcharge'

// Si déménagement le week-end
activatedModules = [..., 'weekend-surcharge']; // ✅ Présent
```

---

## 💡 Cas d'Usage Réels

### Scénario 1 : Afficher un avertissement juridique

```typescript
// Après calcul du devis
if (result.computed.activatedModules.includes('monte-meubles-refusal')) {
  // Module de refus du monte-meubles activé

  // ⚠️ Afficher avertissement juridique au client
  showWarning({
    title: 'ATTENTION : Monte-meubles refusé',
    message: 'Votre responsabilité est limitée en cas de dommages. ' +
             'L\'assurance ne couvrira que partiellement les dégâts.',
    severity: 'critical',
    requiresAcknowledgment: true
  });
}
```

### Scénario 2 : Déclencher une revue manuelle

```typescript
const criticalModules = [
  'manual-handling-risk',        // Manutention manuelle risquée
  'high-value-item-handling',    // Objets de grande valeur
  'liability-limitation',        // Limitation de responsabilité
  'long-distance'                // Longue distance (risque augmenté)
];

const hasCriticalModule = criticalModules.some(moduleId =>
  result.computed.activatedModules.includes(moduleId)
);

if (hasCriticalModule || result.computed.riskScore > 70) {
  // Envoyer le devis en revue manuelle
  await sendToManualReview({
    devisId: result.id,
    reason: 'Modules critiques activés',
    activatedCriticalModules: criticalModules.filter(m =>
      result.computed.activatedModules.includes(m)
    ),
    riskScore: result.computed.riskScore
  });
}
```

### Scénario 3 : Générer un PDF détaillé

```typescript
// Section "Détail du calcul" dans le PDF
const calculationSteps = result.computed.activatedModules
  .map(moduleId => {
    const module = getModuleById(moduleId);
    return {
      order: module.priority,
      name: module.description,
      phase: Math.floor(module.priority / 10)
    };
  })
  .sort((a, b) => a.order - b.order);

// Génération PDF
pdf.section('Détail du calcul', () => {
  pdf.subtitle('Modules appliqués :');

  calculationSteps.forEach(step => {
    pdf.line(`✓ Phase ${step.phase} : ${step.name} (priorité ${step.order})`);
  });
});

// Résultat dans le PDF:
// ✓ Phase 1 : Sanitisation des données d'entrée (priorité 10)
// ✓ Phase 1 : Validation de la date de déménagement (priorité 11)
// ✓ Phase 2 : Estimation du volume (priorité 20)
// ✓ Phase 3 : Calcul de la distance (priorité 30)
// ✓ Phase 3 : Coût du carburant (priorité 33)
// ...
```

### Scénario 4 : A/B Testing et optimisation

```typescript
// Analyser l'impact d'un nouveau module
const devisAvant = await fetchDevis({
  dateRange: '2025-01-01 to 2025-01-31'
});

const devisApres = await fetchDevis({
  dateRange: '2025-02-01 to 2025-02-28'
});

const nouveauModuleId = 'accessibility-bonus';

const activationRate = {
  avant: 0, // Module n'existait pas
  apres: devisApres.filter(d =>
    d.computed.activatedModules.includes(nouveauModuleId)
  ).length / devisApres.length
};

console.log(`Taux d'activation du nouveau module: ${(activationRate.apres * 100).toFixed(1)}%`);

// Calcul de l'impact sur le prix moyen
const prixMoyenAvant = average(devisAvant.map(d => d.computed.finalPrice));
const prixMoyenApres = average(devisApres.map(d => d.computed.finalPrice));

console.log(`Impact sur le prix moyen: ${prixMoyenApres - prixMoyenAvant} €`);
```

---

## 📚 Résumé

### `activatedModules` est le **cœur de la traçabilité** du système

| Fonction | Description | Fichier |
|----------|-------------|---------|
| **Définition** | Tableau de strings dans ComputedContext | `core/ComputedContext.ts:137` |
| **Initialisation** | Par le QuoteEngine au début de l'exécution | `core/QuoteEngine.ts:57` |
| **Alimentation** | Chaque module s'ajoute dans sa méthode `apply()` | Tous les modules |
| **Vérification** | Le moteur vérifie les dépendances | `core/QuoteEngine.ts:192-196` |
| **Garde-fou** | Le moteur ajoute le module s'il a oublié | `core/QuoteEngine.ts:110-116` |

### Avantages critiques

1. ✅ **Traçabilité totale** : On sait toujours ce qui a été calculé
2. ✅ **Vérification des dépendances** : Sécurité d'exécution garantie
3. ✅ **Debugging facilité** : Comprendre pourquoi un prix est calculé
4. ✅ **Conformité juridique** : Preuve légale des calculs
5. ✅ **Analytics métier** : Statistiques d'utilisation des modules

### Règles absolues

- ❌ **JAMAIS** initialiser `activatedModules` dans un module
- ✅ **TOUJOURS** ajouter le module à `activatedModules` dans `apply()`
- ✅ **TOUJOURS** vérifier les dépendances avant d'exécuter un module
- ✅ **TOUJOURS** conserver l'ordre chronologique d'exécution

---

**En conclusion** : `activatedModules` garantit qu'on peut **toujours expliquer** comment et pourquoi un prix a été calculé, ce qui est **absolument critique** pour la transparence, le debugging, la conformité juridique et l'audit du système.
