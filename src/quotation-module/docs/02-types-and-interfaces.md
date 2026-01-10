# 🔧 Types fondamentaux

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## Vue d'ensemble

Ce document définit tous les types TypeScript fondamentaux du système modulaire de devis.

Pour comprendre les principes d'architecture, voir [Vue d'ensemble](./01-overview.md).

---

## 1. QuoteContext (Contexte d'entrée)

Le contexte d'entrée contient toutes les données collectées depuis le formulaire client.

```typescript
// src/quotation-module/core/QuoteContext.ts

export interface QuoteContext {
  /* ---- Identification ---- */
  serviceType: "MOVING";
  region: "IDF"; // Point de départ : IDF uniquement
  // Point d'arrivée peut être IDF ou Province (détecté automatiquement)

  /* ---- Date & planning ---- */
  moveDate: Date;
  flexibility?: "NONE" | "PLUS_MINUS_3" | "PLUS_MINUS_7";

  /* ---- Logement ---- */
  housingType: "STUDIO" | "F2" | "F3" | "F4" | "HOUSE";
  surface: number;
  rooms?: number;

  /* ---- Volume ---- */
  volumeMethod: "FORM" | "LIST" | "VIDEO";
  estimatedVolume?: number;
  volumeConfidence?: "LOW" | "MEDIUM" | "HIGH";

  /* ---- Adresses (DÉPART) ---- */
  departureAddress: string;
  pickupFloor?: number;
  pickupHasElevator?: boolean;
  pickupElevatorSize?: "SMALL" | "STANDARD" | "LARGE";
  pickupCarryDistance?: number;
  pickupStreetNarrow?: boolean;
  pickupParkingAuthorizationRequired?: boolean;
  pickupSyndicTimeSlot?: boolean;

  /* ---- Adresses (ARRIVÉE) ---- */
  arrivalAddress: string;
  deliveryFloor?: number;
  deliveryHasElevator?: boolean;
  deliveryElevatorSize?: "SMALL" | "STANDARD" | "LARGE";
  deliveryCarryDistance?: number;
  deliveryStreetNarrow?: boolean;
  deliveryParkingAuthorizationRequired?: boolean;
  deliverySyndicTimeSlot?: boolean;

  /* ---- Zone urbaine ---- */
  urbanZoneType?: "PARIS" | "DENSE" | "SUBURB";

  /* ---- Inventaire ---- */
  bulkyFurniture?: boolean;
  piano?: boolean;
  safe?: boolean;
  artwork?: boolean;
  builtInAppliances?: boolean;

  /* ---- Logistique ---- */
  multiplePickupPoints?: boolean;
  temporaryStorage?: boolean;
  storageDurationDays?: number;

  /* ---- Services ---- */
  packing?: boolean;
  unpacking?: boolean;
  cleaningEnd?: boolean;

  /* ---- Juridique ---- */
  declaredValue?: number;
  refuseLiftDespiteRecommendation?: boolean;

  /* ---- Champs calculés (sortie) ---- */
  computed?: ComputedContext;
}
```

---

## 2. ComputedContext (Contexte calculé)

Le contexte calculé contient tous les résultats produits par les modules.

```typescript
// src/quotation-module/core/ComputedContext.ts

export interface PriceAdjustment {
  moduleId: string;
  label: string;
  amount: number;
  type: "SURCHARGE" | "DISCOUNT";
  metadata?: Record<string, any>;
}

/**
 * Coût structurel identifié par un module
 * ⚠️ IMPORTANT: Séparé des PriceAdjustment
 * - costs = coûts réels (transport, main-d'œuvre, véhicule, etc.)
 * - adjustments = ajustements de prix (surcharges, réductions)
 */
export interface Cost {
  moduleId: string;
  label: string;
  amount: number;
  category: "TRANSPORT" | "LABOR" | "VEHICLE" | "RISK" | "INSURANCE" | "ADMINISTRATIVE";
  metadata?: Record<string, any>;
}

export interface LegalImpact {
  type: "WARNING" | "LIMITATION" | "EXCLUSION";
  description: string;
  moduleId: string;
}

/**
 * Besoin métier identifié par un module
 * SÉPARÉ du cross-selling : c'est une vérité métier, pas une proposition de vente
 */
export interface Requirement {
  type: string; // Ex: "LIFT_RECOMMENDED", "PACKING_RECOMMENDED"
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  moduleId: string;
  metadata?: Record<string, any>;
}

/**
 * Proposition cross-selling (gérée par un module dédié, basé sur les requirements)
 */
export interface CrossSellProposal {
  id: string;
  label: string;
  reason: string;
  benefit: string;
  priceImpact: number;
  optional: boolean;
  moduleId: string;
  basedOnRequirement?: string; // ID du requirement qui a déclenché cette proposition
}

export interface ComputedContext {
  /* ---- Volume & véhicules ---- */
  baseVolume?: number;
  adjustedVolume?: number;
  vehicleCount?: number;
  vehicleTypes?: string[];

  /* ---- Temps & main-d'œuvre ---- */
  baseDurationHours?: number;
  extraDurationHours?: number;
  workersCount?: number;

  /* ---- Distance & transport ---- */
  distanceKm?: number;
  estimatedTravelTimeMinutes?: number;

  /* ---- Coûts structurels (base du calcul de prix) ---- */
  costs: Cost[];

  /* ---- Pricing ---- */
  basePrice?: number; // Calculé par le moteur = somme des costs + marge
  adjustments: PriceAdjustment[]; // Surcharges et réductions
  finalPrice?: number; // Calculé par le moteur = basePrice + adjustments

  /* ---- Risque (contributions des modules, agrégé par le moteur) ---- */
  riskContributions: Array<{
    moduleId: string;
    amount: number;
    reason: string;
  }>;
  riskScore?: number; // Calculé par le moteur = somme des contributions
  manualReviewRequired?: boolean;

  /* ---- Juridique ---- */
  legalImpacts: LegalImpact[];
  insuranceNotes: string[];

  /* ---- Besoins métier (séparés du cross-selling) ---- */
  requirements: Requirement[];

  /* ---- Cross-selling (basé sur les requirements) ---- */
  crossSellProposals: CrossSellProposal[];

  /* ---- Opérationnel ---- */
  operationalFlags: string[];

  /* ---- Traçabilité ---- */
  activatedModules: string[];
  metadata: Record<string, any>;
}
```

---

## 3. QuoteModule (Interface générique)

L'interface que tous les modules doivent implémenter.

```typescript
// src/quotation-module/core/QuoteModule.ts

/**
 * Phase d'exécution du module
 * Certains modules s'exécutent uniquement au devis, d'autres à la validation, d'autres post-vente
 */
export type ExecutionPhase = "QUOTE" | "CONTRACT" | "OPERATIONS";

export interface QuoteModule {
  /** Identifiant unique du module */
  id: string;

  /** Description métier du module */
  description: string;

  /** Priorité d'exécution (plus petit = exécuté en premier) */
  priority: number; // ⚠️ OBLIGATOIRE (pas optionnel)
  // ⚠️ CRITIQUE : La priorité détermine la PHASE du pipeline (1-9), pas le Type (A/B/C)

  /** Phase temporelle d'exécution (défaut: QUOTE) */
  executionPhase?: ExecutionPhase;
  // ⚠️ DISTINCTION : executionPhase = moment dans le cycle de vie (QUOTE/CONTRACT/OPERATIONS)
  //                  priority = ordre dans le pipeline de calcul (1-9)

  /** Modules dont ce module dépend explicitement (optionnel) */
  dependencies?: string[];
  // ⚠️ NOTE : Les dépendances sont vérifiées, mais les prérequis implicites aussi

  /**
   * Détermine si le module doit s'activer dans ce contexte
   * ⚠️ OPTIONNEL PAR DESIGN, pas par oubli
   * 
   * Type A (Modules inconditionnels) : PAS de isApplicable()
   *   - Toujours exécutés (ex: DistanceModule, FuelCostModule)
   * 
   * Type B (Modules conditionnels métier) : isApplicable() OBLIGATOIRE
   *   - Conditions explicites et lisibles (ex: NoElevatorModule)
   * 
   * Type C (Modules déclenchés par état calculé) : isApplicable() avec dépendances
   *   - Dépendent d'un autre module ou d'un choix utilisateur (ex: MonteMeublesRefusalImpactModule)
   * 
   * @param ctx Le contexte de calcul
   * @returns true si le module doit s'appliquer (défaut: true si non défini)
   */
  isApplicable?(ctx: QuoteContext): boolean;

  /**
   * Applique les effets du module sur le contexte
   * ⚠️ RÈGLES STRICTES:
   * - Ne modifie QUE ctx.computed, jamais les champs utilisateur
   * - N'initialise JAMAIS ctx.computed (fait par le moteur)
   * - Ne recalcule JAMAIS ce que d'autres modules ont produit
   * - Chaque module est responsable uniquement de ses propres effets
   * @param ctx Le contexte de calcul (modifié en place)
   */
  apply(ctx: QuoteContext): void;
}
```

---

## 4. Typologie des modules

⚠️ **IMPORTANT** : La typologie (Type A/B/C) est indépendante de la phase du pipeline.
- Un module Type C peut s'exécuter très tôt (ex: VolumeUncertaintyRiskModule en PHASE 2)
- Un module Type A peut s'exécuter tard (ex: InsurancePremiumModule en PHASE 7)
- **La priorité détermine la phase, pas le type.**

### 🟢 Type A — Modules inconditionnels (systématiques)

**Caractéristiques** :
- ✅ Toujours exécutés
- ✅ Ne nécessitent aucune condition métier
- ✅ Leur exécution dépend uniquement de l'ordre du pipeline
- ✅ **PAS de `isApplicable()`** (inutile et redondant)

**Exemples** :
- `DistanceModule` : Calcule toujours la distance
- `FuelCostModule` : Calcule toujours le coût carburant
- `InsurancePremiumModule` : Calcule toujours la prime d'assurance

**Exemple de code** :
```typescript
export class DistanceModule implements QuoteModule {
  id = "DISTANCE";
  description = "Calcul de la distance réelle";
  priority = 15;
  // ❌ PAS de isApplicable() - module systématique

  apply(ctx: QuoteContext): void {
    const km = this.computeDistance(
      ctx.departureAddress,
      ctx.arrivalAddress
    );
    ctx.computed!.distanceKm = km;
    ctx.computed!.activatedModules.push(this.id);
  }

  private computeDistance(from: string, to: string): number {
    // Calcul de distance réel (API, etc.)
    return 8; // Exemple: Paris 11 → Paris 17
  }
}
```

### 🟡 Type B — Modules conditionnels métier

**Caractéristiques** :
- ✅ Exécutés uniquement si certaines conditions sont vraies
- ✅ Conditions explicites et lisibles
- ✅ Décision métier claire
- ✅ **`isApplicable()` OBLIGATOIRE**

**Exemples** :
- `NoElevatorPickupModule` : Si étage > 0 ET pas d'ascenseur
- `MonteMeublesRecommendationModule` : Si mobilier encombrant + étage élevé
- `WeekendModule` : Si jour = samedi ou dimanche
- `EndOfMonthModule` : Si jour >= 25

**Exemple de code** :
```typescript
export class NoElevatorPickupModule implements QuoteModule {
  id = "NO_ELEVATOR_PICKUP";
  description = "Surcoût absence d'ascenseur au départ";
  priority = 40;
  // ✅ isApplicable() OBLIGATOIRE - module conditionnel

  isApplicable(ctx: QuoteContext): boolean {
    return (
      (ctx.pickupFloor ?? 0) > 0 &&
      ctx.pickupHasElevator === false
    );
  }

  apply(ctx: QuoteContext): void {
    const floor = ctx.pickupFloor ?? 0;
    const surchargePerFloor = 50;
    const surcharge = floor * surchargePerFloor;

    ctx.computed!.costs.push({
      moduleId: this.id,
      label: `Absence d'ascenseur au départ (étage ${floor})`,
      amount: surcharge,
      category: "LABOR"
    });

    ctx.computed!.riskContributions.push({
      moduleId: this.id,
      amount: floor * 2,
      reason: `Étage ${floor} sans ascenseur`
    });

    ctx.computed!.activatedModules.push(this.id);
  }
}
```

### 🔴 Type C — Modules déclenchés par état calculé (post-modules)

**Caractéristiques** :
- ✅ Dépendent d'un autre module activé
- ✅ Dépendent d'un choix utilisateur explicite
- ✅ Dépendent d'un flag calculé
- ✅ **`isApplicable()` OBLIGATOIRE avec vérification de dépendances**

**Exemples** :
- `MonteMeublesRefusalImpactModule` : Si monte-meubles recommandé ET refusé
- `ManualReviewModule` : Si riskScore > seuil
- `InsuranceExclusionModule` : Si valeur déclarée insuffisante

**Exemple de code** :
```typescript
export class MonteMeublesRefusalImpactModule implements QuoteModule {
  id = "MONTE_MEUBLES_REFUSAL_IMPACT";
  description = "Conséquences du refus du monte-meubles recommandé";
  priority = 80;
  dependencies = ["MONTE_MEUBLES_RECOMMENDATION"];
  // ✅ isApplicable() OBLIGATOIRE - dépend d'un autre module

  isApplicable(ctx: QuoteContext): boolean {
    return (
      ctx.refuseLiftDespiteRecommendation === true &&
      ctx.computed?.activatedModules.includes("MONTE_MEUBLES_RECOMMENDATION") === true
    );
  }

  apply(ctx: QuoteContext): void {
    // Conséquences juridiques, assurance, risque, pricing
    ctx.computed!.legalImpacts.push({
      type: "LIMITATION",
      description: "Responsabilité limitée en cas de dommages liés à la manutention manuelle",
      moduleId: this.id
    });

    ctx.computed!.costs.push({
      moduleId: this.id,
      label: "Surcoût manutention sans monte-meubles",
      amount: 120,
      category: "RISK"
    });

    ctx.computed!.riskContributions.push({
      moduleId: this.id,
      amount: 25,
      reason: "Refus monte-meubles recommandé"
    });

    ctx.computed!.activatedModules.push(this.id);
  }
}
```

---

## 5. Règle de décision : Quand utiliser `isApplicable()` ?

| Type | `isApplicable()` | Justification |
|------|------------------|---------------|
| **Type A** | ❌ **PAS** | Module systématique, toujours exécuté |
| **Type B** | ✅ **OUI** | Condition métier explicite nécessaire |
| **Type C** | ✅ **OUI** | Dépendance d'un autre module ou choix utilisateur |

⚠️ **RAPPEL** : La typologie (A/B/C) est indépendante de la phase du pipeline. La priorité détermine la phase.

Pour plus de détails sur la typologie, voir [Typologie des modules](./03-module-typology.md).

---

## Liens vers les autres documents

- [Vue d'ensemble](./01-overview.md) : Principes d'architecture
- [Typologie des modules](./03-module-typology.md) : Guide détaillé sur les types A/B/C
- [Phases du pipeline](./04-pipeline-phases.md) : Ordre d'exécution des modules
- [Système d'exécution](./05-execution-engine.md) : Implémentation du moteur

