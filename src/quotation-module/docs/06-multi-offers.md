# 🎯 Multi-offres / Génération de devis parallèles

**Version** : 2.0
**Date** : 2025-01-XX
**Statut** : 🟢 Implémenté (Mode Incrémental)

---

## Architecture en 2 étapes

Le système multi-offres utilise une **architecture en 2 étapes avec mode incrémental** :

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FLUX DE CALCUL (MODE INCRÉMENTAL)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ÉTAPE 1: /api/quotation/calculate                                             │
│   ─────────────────────────────────────────────                                 │
│   BaseCostEngine → baseCost + context.computed                                  │
│   (calcule les coûts opérationnels une seule fois)                              │
│                              │                                                  │
│                              ▼                                                  │
│   ÉTAPE 2: /api/quotation/multi-offers                                          │
│   ─────────────────────────────────────────────                                 │
│   MultiQuoteService (mode incrémental)                                          │
│   • Réutilise context.computed (pas de recalcul)                                │
│   • Exécute UNIQUEMENT les modules additionnels                                 │
│   • Génère 6 variantes avec marges différentes                                  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Objectif marketing

Au lieu de produire **1 devis figé**, le système produit **6 devis parallèles**, chacun correspondant à une stratégie commerciale différente, tout en restant **juridiquement et opérationnellement cohérent**.

**Principe clé** :
- ➡️ Même formulaire
- ➡️ Même baseCost (calculé une seule fois)
- ➡️ Contexte réutilisé via mode incrémental
- ➡️ Différentes combinaisons de modules additionnels
- ➡️ Politiques de marge différentes

### Concept : QuoteScenario

Un scénario de devis est une **configuration marketing** qui :

- ✅ **Ne modifie PAS** les règles métier
- ✅ **Ne recode RIEN**
- ✅ **Sélectionne / force / neutralise** certains modules
- ✅ **Applique une politique de marge** différente
- ✅ **Permet des overrides contrôlés** du contexte

```typescript
// src/quotation-module/core/QuoteScenario.ts

export interface QuoteScenario {
  /** Identifiant unique du scénario */
  id: string;
  
  /** Libellé affiché au client */
  label: string;
  
  /** Description marketing du scénario */
  description: string;

  /** Politique de modules : modules explicitement activés */
  enabledModules?: string[];
  
  /** Politique de modules : modules explicitement désactivés */
  disabledModules?: string[];

  /** Overrides contrôlés du contexte (ex: forcer acceptation monte-meubles) */
  overrides?: Partial<QuoteContext>;

  /** Politique de prix : taux de marge appliqué */
  marginRate: number;

  /** Règles marketing : tags pour UI / analytics */
  tags: string[]; // Ex: ["LOW_PRICE", "ENTRY", "RECOMMENDED", "BALANCED", "COMFORT", "UPSELL", "SECURITY_PLUS", "PRO", "INSURANCE_INCLUDED", "PREMIUM", "ALL_INCLUSIVE", "FLEXIBILITY", "RISK_COVERED"]
}
```

### Les 6 scénarios marketing standards

#### 📊 Tableau Comparatif - Lecture Orientée Client

> **Principe** : Modules les plus souvent inclus placés en haut, lecture verticale évidente (plus on monte en gamme, plus de ✅)

| Module / Prestation              |  ECO  |  STANDARD  |  CONFORT  |  PREMIUM  |  SÉCURITÉ+  |  FLEX  |
| -------------------------------- | :---: | :--------: | :-------: | :-------: | :---------: | :----: |
| **Emballage (packing)**          |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ⭕   |
| **Fournitures (cartons, etc.)**  |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ⭕   |
| **Démontage des meubles**        |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ✅   |
| **Remontage des meubles**        |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ✅   |
| **Objets de valeur / fragiles**  |   ❌   |      ⭕     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| **Assurance renforcée**          |   ⭕   |      ⭕     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| -------------------------------- | ----- | ---------- | --------- | --------- | ----------- | ------ |
| **Nettoyage fin de prestation**  |   ❌   |      ❌     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| **Monte-meubles (si requis)**    |   ⭕*  |     ⭕*     |     ⭕*    |     ⭕*    |      ⭕*     |   ⭕*   |
| **Étape / nuit intermédiaire**   |   ❌   |      ❌     |     ⭕     |     ⭕     |      ⭕      |    ✅   |
| **Flexibilité équipe / planning**|   ❌   |      ❌     |     ⭕     |     ⭕     |      ⭕      |    ✅   |

**Légende :**
- ✅ = **Inclus d'office** dans la formule
- ❌ = **Non disponible** dans cette formule
- ⭕ = **Disponible en option** (selon vos besoins)
- ⭕* = **Conditionnel technique** (recommandé automatiquement si nécessaire, ex: étage ≥3 ou ≥5)

**Lecture Client Immédiate :**
- **ECO** : Transport uniquement
- **STANDARD** : Participation client
- **CONFORT** : Déménageur fait l'essentiel
- **PREMIUM** : Prise en charge complète
- **SÉCURITÉ+** : Premium + Protection maximale
- **FLEX** : Devis sur mesure

---

#### 🟦 Scénario 1 — Économique sécurisé

**Objectif** : Attirer les clients sensibles au prix, minimiser les options.

```typescript
{
  id: "ECO",
  label: "Économique",
  description: "Le prix le plus bas possible, sans options non indispensables",
  marginRate: 0.20,
  disabledModules: [
    "PACKING_COST",
    "CLEANING_COST",
    "DISMANTLING_COST"
  ],
  tags: ["LOW_PRICE", "ENTRY"]
}
```

#### 🟩 Scénario 2 — Standard recommandé

**Objectif** : Offre par défaut, meilleur équilibre prix / sécurité.

```typescript
{
  id: "STANDARD",
  label: "Standard recommandé",
  description: "Le meilleur équilibre prix / sécurité",
  marginRate: 0.30,
  tags: ["RECOMMENDED", "BALANCED"]
}
```

#### 🟨 Scénario 3 — Confort

**Objectif** : "Vous ne vous occupez de rien".

```typescript
{
  id: "CONFORT",
  label: "Confort",
  description: "Vous ne vous occupez de rien",
  marginRate: 0.35,
  enabledModules: [
    "PACKING_COST",
    "DISMANTLING_COST",
    "HIGH_VALUE_ITEM_HANDLING"
  ],
  tags: ["COMFORT", "UPSELL"]
}
```

#### 🟥 Scénario 4 — Sécurité maximale

**Objectif** : "Zéro risque, zéro discussion".

**Spécificité clé** : Protection maximale avec emballage, nettoyage, fournitures et assurance incluse. Monte-meubles conditionnel selon contraintes techniques.

```typescript
{
  id: "SECURITY_PLUS",
  label: "Sécurité+",
  description: "Protection maximale avec assurance incluse",
  marginRate: 0.32,
  enabledModules: [
    "packing-cost",
    "cleaning-end-cost",
    "dismantling-cost",
    "reassembly-cost",
    "high-value-item-handling",
    "supplies-cost",
    "insurance-premium"
  ],
  overrides: {
    packing: true,
    cleaningEnd: true,
    dismantling: true,
    reassembly: true,
    declaredValueInsurance: true,
    declaredValue: 50000,
    crossSellingSuppliesTotal: 100
  },
  tags: ["SECURITY_PLUS", "PRO", "INSURANCE_INCLUDED"]
}
```

#### 🟪 Scénario 5 — Premium clé en main

**Objectif** : "On gère tout, vous ne touchez à rien".

```typescript
{
  id: "PREMIUM",
  label: "Premium clé en main",
  description: "On gère tout, vous ne touchez à rien",
  marginRate: 0.40,
  enabledModules: [
    "PACKING_COST",
    "CLEANING_COST",
    "DISMANTLING_COST",
    "DELIVERY_TIME_WINDOW_CONSTRAINT"
  ],
  tags: ["PREMIUM", "ALL_INCLUSIVE"]
}
```

#### 🟫 Scénario 6 — Flex / terrain

**Objectif** : "Adapté aux imprévus".

```typescript
{
  id: "FLEX",
  label: "Flexible",
  description: "Adapté aux imprévus",
  marginRate: 0.38,
  enabledModules: [
    "OVERNIGHT_STOP",
    "CREW_SIZE_ADJUSTMENT"
  ],
  tags: ["FLEXIBILITY", "RISK_COVERED"]
}
```

---

### Exécution technique (Mode Incrémental)

#### 1. Modules de base (calculés une seule fois par BaseCostEngine)

Ces modules sont exécutés à l'étape 1 et **ignorés à l'étape 2** via `skipModules` :

```typescript
const BASE_COST_MODULES = [
  'input-sanitization',
  'date-validation',
  'address-normalization',
  'volume-estimation',
  'distance-calculation',
  'long-distance-threshold',
  'fuel-cost',
  'toll-cost',
  'vehicle-selection',
  'workers-calculation',
  'labor-base',
];
```

#### 2. Service de génération multi-offres (Mode Incrémental)

```typescript
// src/quotation-module/multi-offers/MultiQuoteService.ts

/**
 * MultiQuoteService - Service de génération de devis multiples
 *
 * Génère 6 variantes de devis à partir d'un baseCost pré-calculé.
 *
 * Architecture :
 * 1. /api/quotation/calculate → BaseCostEngine → baseCost + context.computed
 * 2. /api/quotation/multi-offers → MultiQuoteService.generateMultipleQuotesFromBaseCost()
 *
 * Mode incrémental :
 * - Réutilise le ctx.computed de BaseCostEngine (évite le recalcul)
 * - Exécute UNIQUEMENT les modules additionnels (cross-selling, assurance, etc.)
 * - Les modules de base sont ignorés via skipModules
 */
export class MultiQuoteService {
  /**
   * Génère plusieurs devis à partir d'un baseCost pré-calculé
   *
   * @param baseCtx Contexte de base (avec computed rempli par BaseCostEngine)
   * @param scenarios Scénarios à appliquer
   * @param baseCost Coût opérationnel de base (venant de /calculate)
   */
  generateMultipleQuotesFromBaseCost(
    baseCtx: QuoteContext,
    scenarios: QuoteScenario[],
    baseCost: number
  ): QuoteVariant[] {
    return scenarios.map((scenario) =>
      this.generateSingleVariantFromBaseCost(baseCtx, scenario, baseCost)
    );
  }

  /**
   * Génère une variante de devis (MODE INCRÉMENTAL)
   */
  private generateSingleVariantFromBaseCost(
    baseCtx: QuoteContext,
    scenario: QuoteScenario,
    baseCost: number
  ): QuoteVariant {
    // 1. Extraire le computed pour le réutiliser
    const { computed: baseComputed, ...ctxWithoutComputed } = baseCtx;
    const ctxClone = structuredClone(ctxWithoutComputed) as QuoteContext;

    // 2. Appliquer les overrides si présents
    if (scenario.overrides) {
      Object.assign(ctxClone, scenario.overrides);
    }

    // 3. Créer le moteur en MODE INCRÉMENTAL
    const engine = new QuoteEngine(this.modules, {
      // Mode incrémental
      startFromContext: baseComputed,     // Réutilise le computed
      skipModules: BASE_COST_MODULES,     // Ignore les modules de base
      // Configuration du scénario
      enabledModules: scenario.enabledModules,
      disabledModules: scenario.disabledModules,
      marginRate: scenario.marginRate,
    });

    // 4. Exécuter (UNIQUEMENT modules additionnels)
    const enrichedCtx = engine.execute(ctxClone);

    // 5. Calculer les coûts additionnels
    const additionalCosts = enrichedCtx.computed?.costs
      ?.filter((c) => !BASE_COST_MODULES.includes(c.moduleId))
      .reduce((sum, c) => sum + c.amount, 0) || 0;

    // 6. Calculer le prix final
    const basePrice = baseCost + additionalCosts;
    const finalPrice = basePrice * (1 + scenario.marginRate);

    return {
      scenarioId: scenario.id,
      label: scenario.label,
      description: scenario.description,
      context: enrichedCtx,
      finalPrice,
      basePrice,
      marginRate: scenario.marginRate,
      tags: scenario.tags,
      additionalCosts,
    };
  }
}
```

#### 3. Avantages du mode incrémental

| Aspect | Ancien (recalcul) | Nouveau (incrémental) |
|--------|-------------------|----------------------|
| **Calcul modules base** | 6× (une fois par scénario) | 1× (une seule fois) |
| **Performance** | ~6× plus lent | Optimal |
| **Cohérence** | Risque de divergence | Garanti (même contexte) |
| **Maintenance** | Liste duplicated | Liste centralisée |

---

### ⚠️ Clarifications importantes et cas limites (25 points)

#### 1. Priorité entre `enabledModules` et `disabledModules`

**Règle** : Si un module est dans `enabledModules` ET dans `disabledModules`, il est **désactivé** (priorité à `disabledModules`).

**Exemple** :
```typescript
{
  enabledModules: ["PACKING_COST"],
  disabledModules: ["PACKING_COST"] // ❌ PACKING_COST sera désactivé
}
```

#### 2. Modules obligatoires toujours activés

**Règle** : Certains modules sont **toujours activés**, même s'ils sont dans `disabledModules` :
- ✅ Modules de PHASE 1 (normalisation) : Toujours activés
- ✅ Modules structurels critiques : `DistanceModule`, `FuelCostModule`, `LaborBaseModule`, `InsurancePremiumModule`

**Raison** : Ces modules sont nécessaires pour garantir la cohérence et la validité du devis.

#### 3. Impact des `overrides` sur les modules conditionnels

**Règle** : Les `overrides` modifient le contexte **AVANT** l'exécution des modules, donc ils peuvent changer le comportement de `isApplicable()`.

**Exemple** :
```typescript
// Scénario SÉCURITÉ+ : Monte-meubles conditionnel selon contraintes techniques
// Le monte-meubles est géré par les règles métier (seuils d'étage), pas forcé par le scénario
{
  // Pas d'override pour monte-meubles - reste conditionnel
}
// → MonteMeublesRefusalImpactModule ne s'activera pas
```

#### 4. Clonage profond du contexte

**Règle** : Le contexte doit être cloné en profondeur pour éviter les mutations entre scénarios.

**Important** : Ne pas utiliser `Object.assign()` ou spread shallow, car les objets imbriqués seraient partagés.

#### 5. Ordre d'exécution des scénarios

**Règle** : Les scénarios sont exécutés **séquentiellement** pour garantir la reproductibilité.

**Note** : L'exécution parallèle est possible mais nécessite un clonage encore plus strict.

#### 6. Modules activés par `enabledModules` mais non applicables

**Règle** : Si un module est dans `enabledModules` mais que `isApplicable()` retourne `false`, le module ne s'exécute pas.

**Raison** : `enabledModules` force l'activation si applicable, mais ne force pas l'applicabilité.

#### 7. Modules désactivés par `disabledModules` mais requis par dépendances

**Règle** : Si un module est dans `disabledModules` mais requis par une dépendance, le moteur peut lever une erreur ou continuer selon la criticité.

**Recommandation** : Éviter de désactiver des modules critiques.

#### 8. Impact de `marginRate` sur les coûts structurels

**Règle** : `marginRate` s'applique uniquement au calcul du prix de base, pas aux ajustements.

**Formule** : `basePrice = sum(costs) * (1 + marginRate)`

#### 9. Modules cross-selling et scénarios

**Règle** : Les modules cross-selling (PHASE 8) peuvent être activés/désactivés par scénario, mais les requirements métier restent.

**Exemple** : Scénario ECO désactive `PACKING_COST`, mais `PackingRequirementModule` peut toujours déclarer un requirement.

#### 10. Overrides et validation du contexte

**Règle** : Les `overrides` doivent respecter la structure de `QuoteContext` et ne peuvent pas introduire de valeurs invalides.

**Validation** : Le moteur valide le contexte après application des overrides.

#### 11. Scénarios avec modules incompatibles

**Règle** : Si un scénario active des modules incompatibles (ex: monte-meubles refusé ET accepté), le moteur applique les règles de priorité.

**Recommandation** : Concevoir les scénarios pour éviter les incompatibilités.

#### 12. Marge négative ou nulle

**Règle** : `marginRate` peut être négatif (promotion) mais le prix final ne peut pas être négatif.

**Garde-fou** : Le moteur garantit `finalPrice >= 0`.

#### 13. Modules temporels et scénarios

**Règle** : Les modules avec `executionPhase` différent de "QUOTE" ne s'exécutent pas lors de la génération multi-offres (phase QUOTE par défaut).

**Note** : Pour générer des devis en phase CONTRACT, passer `phase: "CONTRACT"` à `generateMultipleQuotes()`.

#### 14. Traçabilité des scénarios

**Règle** : Chaque `QuoteVariant` contient `activatedModules` pour traçabilité complète.

**Usage** : Permet de comprendre pourquoi un scénario a produit un prix donné.

#### 15. Performance et génération de 6 devis

**Règle** : La génération de 6 devis prend environ 6× le temps d'un devis unique.

**Optimisation** : Le clonage et l'exécution séquentielle sont optimisés, mais restent coûteux.

#### 16. Modules de risque et scénarios

**Règle** : Les modules de risque (PHASE 7) s'exécutent dans tous les scénarios, sauf si explicitement désactivés.

**Raison** : Le risque est une donnée objective, pas une stratégie marketing.

#### 17. Modules juridiques et scénarios

**Règle** : Les modules juridiques (PHASE 7) ne peuvent pas être désactivés par scénario.

**Raison** : Les obligations légales s'appliquent indépendamment de la stratégie marketing.

#### 18. Comparaison de devis avec marges différentes

**Règle** : Les devis générés peuvent avoir des prix différents uniquement à cause de `marginRate`, même avec les mêmes modules activés.

**Exemple** : ECO (20%) vs PREMIUM (40%) sur mêmes coûts = prix différents.

#### 19. Modules requis par dépendances explicites

**Règle** : Si un module activé par `enabledModules` a des dépendances, ces dépendances sont automatiquement activées.

**Exemple** : Activer `PACKING_COST` active aussi `PackingRequirementModule` si dépendance déclarée.

#### 20. Scénarios personnalisés

**Règle** : Il est possible de créer des scénarios personnalisés en plus des 6 standards.

**Recommandation** : Suivre la même structure que les scénarios standards.

#### 21. Modules de PHASE 9 et scénarios

**Règle** : Les modules de PHASE 9 (agrégation) sont généralement exécutés par le moteur, pas par des modules.

**Note** : Ces modules peuvent être déclarés pour traçabilité mais ne modifient pas le calcul.

#### 22. Erreurs dans un scénario

**Règle** : Si un scénario génère une erreur, les autres scénarios continuent de s'exécuter.

**Gestion** : Les erreurs sont capturées et retournées dans `QuoteVariant` avec un flag d'erreur.

#### 23. Modules conditionnels et overrides

**Règle** : Les `overrides` peuvent rendre un module conditionnel applicable ou non.

**Exemple** : Forcer `refuseLiftDespiteRecommendation: false` désactive `MonteMeublesRefusalImpactModule`.

#### 24. Validation des scénarios

**Règle** : Les scénarios doivent être validés avant utilisation pour éviter les configurations invalides.

**Validation** : Vérifier que `enabledModules` et `disabledModules` ne contiennent que des IDs valides.

#### 25. Performance et cache

**Règle** : Les résultats des scénarios peuvent être mis en cache si le contexte de base n'a pas changé.

**Recommandation** : Implémenter un cache avec clé basée sur le hash du contexte.

---

### Exemple concret : Cas complexe

**Contexte** :
- Paris 11 → Lyon (IDF → Province)
- Volume : 35 m³
- 5e étage sans ascenseur au départ
- 3e étage avec ascenseur à l'arrivée
- Mobilier encombrant (piano)
- Monte-meubles recommandé mais refusé par défaut
- Valeur déclarée : 50 000€

**Résultats des 6 scénarios** :

| Scénario | Prix | Modules activés | Différence |
|----------|------|-----------------|------------|
| **ECO** | 2 450€ | Distance, Fuel, Toll, Labor, Access, Insurance | - |
| **STANDARD** | 2 850€ | + Monte-meubles recommandation | +400€ |
| **CONFORT** | 3 200€ | + Packing, Dismantling | +750€ |
| **SÉCURITÉ+** | 3 400€ | + Emballage + Nettoyage + Assurance incluse | +950€ |
| **PREMIUM** | 3 800€ | + Packing, Cleaning, Dismantling, TimeWindow | +1 350€ |
| **FLEX** | 3 400€ | + OvernightStop, CrewAdjustment | +950€ |

**Analyse** :
- **ECO** : Prix minimal, mais risque élevé (pas de monte-meubles)
- **STANDARD** : Équilibre prix/sécurité, monte-meubles recommandé mais pas forcé
- **SÉCURITÉ+** : Protection maximale avec emballage, nettoyage, fournitures et assurance incluse
- **PREMIUM** : Toutes les options incluses, prix élevé mais service complet

**Décision client** : Le client peut comparer directement et choisir selon son budget et ses besoins.

---

### Avantages du modèle multi-offres

#### ✅ Aucun recalcul dupliqué

- Même moteur utilisé pour tous les scénarios
- Même modules, mêmes règles métier
- Seule la sélection de modules change

#### ✅ Aucune logique marketing dans les modules métier

- Les modules restent purs (coût, risque, juridique)
- La stratégie marketing est dans les scénarios
- Séparation stricte des responsabilités

#### ✅ Comparaison directe par le client

- 6 devis générés en parallèle
- Comparaison transparente des options
- Argumentaire commercial clair

#### ✅ Augmentation mécanique du panier moyen

- Client voit la différence entre économique et premium
- Upsell naturel vers les offres supérieures
- A/B testing natif

---

### Recommandations UI

#### Présentation des devis

```typescript
interface QuoteVariantUI {
  id: string;
  label: string;
  price: number;
  security: "LOW" | "MEDIUM" | "HIGH" | "MAXIMUM";
  comfort: "NONE" | "BASIC" | "MEDIUM" | "HIGH";
  recommended?: boolean;
  tags: string[];
  features: string[];
  activatedModules: string[];
}
```

#### Tableau comparatif

| Offre | Prix | Sécurité | Confort | Recommandé |
|-------|------|----------|---------|------------|
| Éco | €€ | ⚠️ | ❌ | |
| Standard | €€€ | ✅ | ⚠️ | ⭐ |
| Sécurité | €€€€ | 🛡️ | ⚠️ | |
| Confort | €€€€ | ✅ | ✅ | |
| Premium | €€€€€ | 🛡️ | 🛡️ | |
| Flex | €€€€ | ⚠️ | ⚠️ | |

---

### Scénarios par défaut (DEFAULT_SCENARIOS)

```typescript
// src/quotation-module/services/MultiQuoteService.ts

import { QuoteScenario } from '../core/QuoteScenario';

/**
 * Les 6 scénarios marketing standards
 */
export const DEFAULT_SCENARIOS: QuoteScenario[] = [
  {
    id: "ECO",
    label: "Économique",
    description: "Le prix le plus bas possible, sans options non indispensables",
    marginRate: 0.20,
    disabledModules: [
      "PACKING_COST",
      "CLEANING_COST",
      "DISMANTLING_COST"
    ],
    tags: ["LOW_PRICE", "ENTRY"]
  },
  {
    id: "STANDARD",
    label: "Standard recommandé",
    description: "Le meilleur équilibre prix / sécurité",
    marginRate: 0.30,
    tags: ["RECOMMENDED", "BALANCED"]
  },
  {
    id: "CONFORT",
    label: "Confort",
    description: "Vous ne vous occupez de rien",
    marginRate: 0.35,
    enabledModules: [
      "PACKING_COST",
      "DISMANTLING_COST",
      "HIGH_VALUE_ITEM_HANDLING"
    ],
    tags: ["COMFORT", "UPSELL"]
  },
  {
    id: "SECURITY_PLUS",
    label: "Sécurité+",
    description: "Protection maximale avec assurance incluse",
    marginRate: 0.32,
    enabledModules: [
      "packing-cost",
      "cleaning-end-cost",
      "dismantling-cost",
      "reassembly-cost",
      "high-value-item-handling",
      "supplies-cost",
      "insurance-premium"
    ],
    overrides: {
      packing: true,
      cleaningEnd: true,
      dismantling: true,
      reassembly: true,
      declaredValueInsurance: true,
      declaredValue: 50000,
      crossSellingSuppliesTotal: 100
    },
    tags: ["SECURITY_PLUS", "PRO", "INSURANCE_INCLUDED"]
  },
  {
    id: "PREMIUM",
    label: "Premium clé en main",
    description: "On gère tout, vous ne touchez à rien",
    marginRate: 0.40,
    enabledModules: [
      "PACKING_COST",
      "CLEANING_COST",
      "DISMANTLING_COST",
      "DELIVERY_TIME_WINDOW_CONSTRAINT"
    ],
    tags: ["PREMIUM", "ALL_INCLUSIVE"]
  },
  {
    id: "FLEX",
    label: "Flexible",
    description: "Adapté aux imprévus",
    marginRate: 0.38,
    enabledModules: [
      "OVERNIGHT_STOP",
      "CREW_SIZE_ADJUSTMENT"
    ],
    tags: ["FLEXIBILITY", "RISK_COVERED"]
  }
];
```

**Utilisation** :
```typescript
const service = new MultiQuoteService();
const variants = service.generateMultipleQuotes(
  baseCtx,
  DEFAULT_SCENARIOS
);
```

---

### Interdictions absolues (respectées)

Le système multi-offres **respecte strictement** toutes les interdictions absolues :

#### ✅ Pas de calcul direct dans le formulaire

Les scénarios ne modifient pas le formulaire, ils agissent uniquement sur l'exécution des modules.

#### ✅ Pas de logique métier dans le front

Les scénarios sont des configurations marketing, pas de la logique métier. La logique métier reste dans les modules.

#### ✅ Pas de dépendance circulaire

Les scénarios ne créent pas de dépendances circulaires entre modules. Ils activent/désactivent simplement des modules existants.

#### ✅ Pas de modules "fourre-tout"

Les scénarios n'introduisent pas de nouveaux modules "fourre-tout". Ils utilisent uniquement les modules existants.

---

### Intégration avec le système existant

#### Adaptateur pour PriceService

```typescript
// src/quotation-module/adapters/PriceServiceAdapter.ts

import { MultiQuoteService } from '../services/MultiQuoteService';
import { DEFAULT_SCENARIOS } from '../services/MultiQuoteService';
import { adaptPriceRequestToContext } from './PriceServiceAdapter';

/**
 * Génère plusieurs devis depuis une requête PriceService
 */
export function generateMultipleQuotesFromPriceRequest(
  request: PriceCalculationRequest
): QuoteVariant[] {
  const ctx = adaptPriceRequestToContext(request);
  const service = new MultiQuoteService();
  return service.generateMultipleQuotes(ctx, DEFAULT_SCENARIOS);
}
```

#### Adaptateur pour le frontend

```typescript
// src/quotation-module/adapters/FrontendAdapter.ts

import { MultiQuoteService } from '../services/MultiQuoteService';
import { DEFAULT_SCENARIOS } from '../services/MultiQuoteService';
import { adaptFormDataToContext } from './FrontendAdapter';

/**
 * Génère plusieurs devis depuis les données du formulaire
 */
export function generateMultipleQuotesForFrontend(formData: any): QuoteVariant[] {
  const ctx = adaptFormDataToContext(formData);
  const service = new MultiQuoteService();
  return service.generateMultipleQuotes(ctx, DEFAULT_SCENARIOS);
}
```

#### Affichage dans l'UI

```typescript
// Exemple d'utilisation dans un composant React

const QuoteComparison: React.FC = () => {
  const [variants, setVariants] = useState<QuoteVariant[]>([]);
  
  useEffect(() => {
    const quotes = generateMultipleQuotesForFrontend(formData);
    setVariants(quotes);
  }, [formData]);
  
  return (
    <div className="quote-comparison">
      {variants.map(variant => (
        <QuoteCard
          key={variant.scenarioId}
          variant={variant}
          recommended={variant.scenarioId === "STANDARD"}
        />
      ))}
    </div>
  );
};
```

---

### Conclusion stratégique

Le système multi-offres apporte **4 avantages majeurs** :

1. **Augmentation mécanique du panier moyen** : Le client voit la différence entre économique et premium, favorisant l'upsell.

2. **Transparence et confiance** : Le client comprend pourquoi un devis coûte plus cher (options, sécurité, confort).

3. **A/B testing natif** : Possibilité de tester différentes stratégies marketing sans modifier le code.

4. **Séparation stricte des responsabilités** : La logique métier reste dans les modules, la stratégie marketing dans les scénarios.

**Recommandation** : Implémenter d'abord les 6 scénarios standards, puis enrichir progressivement avec des scénarios personnalisés selon les besoins marketing.

---

## 🔗 Voir aussi

- [Système d'exécution](./05-execution-engine.md) - QuoteEngine avec support scénarios
- [Types fondamentaux](./02-types-and-interfaces.md) - QuoteScenario interface
- [Plan d'implémentation](./10-implementation-plan.md) - Stratégie MVP

