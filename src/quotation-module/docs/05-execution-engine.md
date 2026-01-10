# ⚙️ Système d'exécution

**Version** : 2.0
**Date** : 2025-01-XX
**Statut** : 🟢 Implémenté (Mode Incrémental)

---

## Architecture des Moteurs

Le système utilise deux moteurs avec un **mode incrémental** pour optimiser les performances :

```
┌─────────────────────────────────────────────────────────────────┐
│                        QuoteEngine                              │
│  ─────────────────────────────────────────────────────────────  │
│  Moteur d'exécution des modules avec 2 modes :                  │
│                                                                  │
│  MODE COMPLET (par défaut) :                                    │
│  • Initialise ctx.computed vide                                 │
│  • Exécute TOUS les modules applicables                         │
│  • Utilisé par BaseCostEngine                                   │
│                                                                  │
│  MODE INCRÉMENTAL (startFromContext + skipModules) :            │
│  • Réutilise ctx.computed existant                              │
│  • Ignore les modules dans skipModules                          │
│  • Exécute uniquement les modules additionnels                  │
│  • Utilisé par MultiQuoteService                                │
└─────────────────────────────────────────────────────────────────┘
          ▲                                    ▲
          │                                    │
┌─────────┴─────────┐              ┌──────────┴──────────┐
│  BaseCostEngine   │              │  MultiQuoteService  │
│  (MODE COMPLET)   │──────────────│ (MODE INCRÉMENTAL)  │
│                   │  context     │                     │
│  Calcule baseCost │  .computed   │  Génère 6 variantes │
└───────────────────┘──────────────└─────────────────────┘
```

---

## ⚙️ QuoteEngine (Moteur principal)

### Options du QuoteEngine

```typescript
interface QuoteEngineOptions {
  // Phase temporelle d'exécution (défaut: QUOTE)
  executionPhase?: 'QUOTE' | 'CONTRACT' | 'OPERATIONS';

  // Modules explicitement activés (pour scénarios)
  enabledModules?: string[];

  // Modules explicitement désactivés
  disabledModules?: string[];

  // MODE INCRÉMENTAL : Modules à ignorer (déjà exécutés)
  skipModules?: string[];

  // MODE INCRÉMENTAL : Contexte computed à réutiliser
  startFromContext?: ComputedContext;

  // Taux de marge (défaut: 30%)
  marginRate?: number;

  // Mode debug
  debug?: boolean;
}
```

### Modes d'exécution

**Mode Complet** (par défaut) :
```typescript
const engine = new QuoteEngine(modules);
const result = engine.execute(ctx);
// → Initialise ctx.computed
// → Exécute tous les modules applicables
```

**Mode Incrémental** (pour multi-offres) :
```typescript
const engine = new QuoteEngine(modules, {
  startFromContext: baseCostResult.computed, // Réutilise le contexte
  skipModules: BASE_COST_MODULES,            // Ignore les modules de base
  enabledModules: scenario.enabledModules,
  marginRate: scenario.marginRate,
});
const result = engine.execute(ctx);
// → Réutilise ctx.computed existant
// → Exécute UNIQUEMENT les modules additionnels
```

### 1. Implémentation QuoteEngine

```typescript
// src/quotation-module/core/QuoteEngine.ts

import { QuoteContext } from './QuoteContext';
import { QuoteModule } from './QuoteModule';
import { logger } from '@/lib/logger';

export class QuoteEngine {
  private modules: QuoteModule[];
  private readonly PHASE_1_PRIORITY_MIN = 10;
  private readonly PHASE_1_PRIORITY_MAX = 19;

  constructor(modules: QuoteModule[]) {
    // Trier les modules par priorité
    this.modules = [...modules].sort((a, b) => a.priority - b.priority);
  }

  /**
   * Exécute tous les modules applicables sur le contexte
   * 
   * ⚠️ ORDRE STRICT : Les modules sont exécutés dans l'ordre de leur priority
   * ⚠️ VALIDATION : Dépendances et prérequis sont vérifiés avant exécution
   * ⚠️ ERREURS : PHASE 1 arrête le calcul, autres phases continuent (résilience)
   * 
   * @param ctx Le contexte de calcul
   * @param phase Phase temporelle d'exécution (défaut: QUOTE)
   * @returns Le contexte enrichi avec les résultats
   * @throws Error si une erreur critique survient en PHASE 1
   */
  execute(ctx: QuoteContext, phase: ExecutionPhase = "QUOTE"): QuoteContext {
    // ⚠️ CRITIQUE: Le moteur initialise ctx.computed, JAMAIS un module
    ctx.computed = {
      costs: [], // Coûts structurels
      adjustments: [], // Ajustements de prix
      legalImpacts: [],
      insuranceNotes: [],
      requirements: [],
      crossSellProposals: [],
      operationalFlags: [],
      riskContributions: [],
      activatedModules: [],
      metadata: {}
    };

    logger.info(`[QuoteEngine] Démarrage avec ${this.modules.length} modules (phase temporelle: ${phase})`);

    // Filtrer les modules selon la phase temporelle
    const applicableModules = this.modules.filter(m => 
      !m.executionPhase || m.executionPhase === phase
    );

    logger.debug(`[QuoteEngine] ${applicableModules.length} modules applicables pour la phase ${phase}`);

    // Exécuter chaque module dans l'ordre strict de priorité
    for (const module of applicableModules) {
      const phaseNumber = Math.floor((module.priority - 10) / 10) + 1;
      
      try {
        // 1. Vérifier les dépendances explicites
        if (!this.hasDependencies(module, ctx)) {
          logger.debug(`[QuoteEngine] Module ${module.id} (PHASE ${phaseNumber}) ignoré : dépendances non satisfaites`);
          continue;
        }

        // 2. Vérifier les prérequis implicites (garde-fous)
        if (!this.hasPrerequisites(module, ctx)) {
          logger.warn(`[QuoteEngine] Module ${module.id} (PHASE ${phaseNumber}) ignoré : prérequis manquants`);
          continue;
        }

        // 3. Vérifier l'applicabilité (optionnel par design)
        // Type A : pas de isApplicable() → toujours exécuté
        // Type B/C : isApplicable() défini → vérifier la condition
        if (module.isApplicable && !module.isApplicable(ctx)) {
          logger.debug(`[QuoteEngine] Module ${module.id} (PHASE ${phaseNumber}) non applicable`);
          continue;
        }

        // 4. Exécuter le module
        logger.debug(`[QuoteEngine] Module ${module.id} (PHASE ${phaseNumber}, priority ${module.priority}) activé`);
        const startTime = Date.now();
        module.apply(ctx);
        const duration = Date.now() - startTime;
        
        // Vérifier que le module s'est bien enregistré
        if (!ctx.computed.activatedModules.includes(module.id)) {
          logger.warn(`[QuoteEngine] Module ${module.id} exécuté mais non enregistré dans activatedModules`);
        }
        
        logger.debug(`[QuoteEngine] Module ${module.id} exécuté en ${duration}ms`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error(`[QuoteEngine] Erreur dans le module ${module.id} (PHASE ${phaseNumber}):`, errorMessage);
        
        // ⚠️ CRITIQUE : En PHASE 1, arrêter sur erreur (données invalides)
        if (module.priority >= this.PHASE_1_PRIORITY_MIN && module.priority <= this.PHASE_1_PRIORITY_MAX) {
          throw new Error(
            `Erreur critique en PHASE 1 (normalisation) - Module ${module.id}: ${errorMessage}. ` +
            `Le calcul ne peut pas continuer avec des données invalides.`
          );
        }
        
        // Pour les autres phases, continuer avec les autres modules (résilience)
        logger.warn(`[QuoteEngine] Continuation après erreur dans ${module.id} (non-critique)`);
      }
    }

    // Agrégations finales (faites par le moteur, pas par un module)
    this.calculateBasePrice(ctx); // Calcul du prix de base depuis les coûts
    this.aggregateRiskScore(ctx);
    this.calculateFinalPrice(ctx);
    this.determineManualReview(ctx);

    logger.info(
      `[QuoteEngine] Exécution terminée - ${ctx.computed.activatedModules.length}/${applicableModules.length} modules activés`
    );
    
    return ctx;
  }

  /**
   * Vérifie si les dépendances explicites d'un module sont satisfaites
   */
  private hasDependencies(module: QuoteModule, ctx: QuoteContext): boolean {
    if (!module.dependencies || module.dependencies.length === 0) {
      return true;
    }

    return module.dependencies.every(depId =>
      ctx.computed?.activatedModules.includes(depId)
    );
  }

  /**
   * Vérifie les prérequis implicites (garde-fous)
   * ⚠️ CRITIQUE : Empêche l'exécution de modules sur des données non disponibles
   * 
   * Cette méthode garantit qu'un module ne s'exécute pas si les données nécessaires
   * n'ont pas été calculées par les modules précédents.
   * 
   * Exemples :
   * - FuelCostModule nécessite distanceKm (calculé par DistanceModule)
   * - VehicleSelectionModule nécessite adjustedVolume (calculé par VolumeEstimationModule)
   * - InsurancePremiumModule nécessite declaredValue (donnée utilisateur)
   * 
   * ⚠️ IMPORTANT : Cette liste doit être maintenue à jour lors de l'ajout de nouveaux modules.
   */
  private hasPrerequisites(module: QuoteModule, ctx: QuoteContext): boolean {
    // Prérequis connus par ID de module
    const prerequisites: Record<string, (ctx: QuoteContext) => boolean> = {
      // PHASE 3 - Transport (nécessitent distanceKm)
      'FUEL_COST': (ctx) => {
        const hasDistance = !!ctx.computed?.distanceKm;
        if (!hasDistance) {
          logger.warn(`[QuoteEngine] FuelCostModule nécessite distanceKm (calculé par DistanceModule)`);
        }
        return hasDistance;
      },
      'HIGH_MILEAGE_FUEL_ADJUSTMENT': (ctx) => !!ctx.computed?.distanceKm,
      'TOLL_COST': (ctx) => !!ctx.computed?.distanceKm,
      'TRANSPORT_TIME_ESTIMATION': (ctx) => !!ctx.computed?.distanceKm,
      'DRIVER_REST_TIME': (ctx) => !!ctx.computed?.distanceKm,
      'OVERNIGHT_STOP': (ctx) => !!ctx.computed?.distanceKm,
      
      // PHASE 6 - Main d'œuvre (nécessitent volume)
      'VEHICLE_SELECTION': (ctx) => {
        const hasVolume = !!ctx.computed?.adjustedVolume;
        if (!hasVolume) {
          logger.warn(`[QuoteEngine] VehicleSelectionModule nécessite adjustedVolume (calculé par VolumeEstimationModule)`);
        }
        return hasVolume;
      },
      'LABOR_BASE': (ctx) => {
        const hasWorkers = !!ctx.computed?.workersCount;
        const hasDuration = !!ctx.computed?.baseDurationHours;
        if (!hasWorkers || !hasDuration) {
          logger.warn(`[QuoteEngine] LaborBaseModule nécessite workersCount et baseDurationHours`);
        }
        return hasWorkers && hasDuration;
      },
      
      // PHASE 4 - Contraintes (nécessitent données utilisateur)
      'NO_ELEVATOR_PICKUP': (ctx) => ctx.pickupFloor !== undefined,
      'NO_ELEVATOR_DELIVERY': (ctx) => ctx.deliveryFloor !== undefined,
      'LABOR_ACCESS_PENALTY': (ctx) => {
        // Nécessite soit étage sans ascenseur, soit distance de portage
        return (
          (ctx.pickupFloor !== undefined && ctx.pickupHasElevator === false) ||
          (ctx.deliveryFloor !== undefined && ctx.deliveryHasElevator === false) ||
          (ctx.pickupCarryDistance !== undefined && ctx.pickupCarryDistance > 0) ||
          (ctx.deliveryCarryDistance !== undefined && ctx.deliveryCarryDistance > 0)
        );
      },
      
      // PHASE 7 - Assurance (nécessitent valeur déclarée)
      'INSURANCE_PREMIUM': (ctx) => {
        const hasValue = ctx.declaredValue !== undefined && ctx.declaredValue > 0;
        if (!hasValue) {
          logger.warn(`[QuoteEngine] InsurancePremiumModule nécessite declaredValue > 0`);
        }
        return hasValue;
      },
      
      // PHASE 5 - Monte-meubles (nécessitent recommandation)
      'MONTE_MEUBLES_REFUSAL_IMPACT': (ctx) => {
        const hasRefusal = ctx.refuseLiftDespiteRecommendation === true;
        const hasRecommendation = ctx.computed?.requirements.some(r => r.type === 'LIFT_RECOMMENDED');
        return hasRefusal && hasRecommendation;
      },
      'MANUAL_HANDLING_RISK_COST': (ctx) => {
        // Nécessite refus du monte-meubles recommandé
        return (
          ctx.refuseLiftDespiteRecommendation === true &&
          ctx.computed?.requirements.some(r => r.type === 'LIFT_RECOMMENDED')
        );
      },
    };

    const check = prerequisites[module.id];
    if (check) {
      const result = check(ctx);
      if (!result) {
        logger.debug(`[QuoteEngine] Prérequis non satisfait pour ${module.id}`);
      }
      return result;
    }

    // Par défaut, accepter (certains modules n'ont pas de prérequis stricts)
    return true;
  }

  /**
   * Agrège le score de risque depuis les contributions des modules
   * ⚠️ Le risque est PRODUIT par les modules, AGRÉGÉ par le moteur
   */
  private aggregateRiskScore(ctx: QuoteContext): void {
    if (!ctx.computed) return;

    const totalRisk = ctx.computed.riskContributions.reduce(
      (sum, contribution) => sum + contribution.amount,
      0
    );

    // Plafonner à 100
    ctx.computed.riskScore = Math.min(100, Math.max(0, totalRisk));
  }

  /**
   * Détermine si une revue manuelle est nécessaire
   */
  private determineManualReview(ctx: QuoteContext): void {
    if (!ctx.computed) return;

    // Revue manuelle si risque élevé ou flags critiques
    ctx.computed.manualReviewRequired = 
      (ctx.computed.riskScore || 0) > 50 ||
      ctx.computed.operationalFlags.some(flag => flag.includes("CRITICAL")) ||
      ctx.computed.legalImpacts.some(impact => impact.type === "EXCLUSION");
  }

  /**
   * Calcule le prix de base depuis les coûts structurels + marge
   * ⚠️ Le prix de base = somme des coûts + marge, pas un calcul arbitraire
   */
  private calculateBasePrice(ctx: QuoteContext): void {
    if (!ctx.computed) return;

    // Somme de tous les coûts structurels
    const totalCosts = ctx.computed.costs.reduce(
      (sum, cost) => sum + cost.amount,
      0
    );

    // Application de la marge (configurable, par défaut 30%)
    const marginRate = 0.30; // TODO: Récupérer depuis configuration
    const basePrice = totalCosts * (1 + marginRate);

    ctx.computed.basePrice = Math.round(basePrice * 100) / 100;
  }

  /**
   * Calcule le prix final en cumulant tous les ajustements
   */
  private calculateFinalPrice(ctx: QuoteContext): void {
    if (!ctx.computed) return;

    let finalPrice = ctx.computed.basePrice || 0;

    for (const adjustment of ctx.computed.adjustments) {
      if (adjustment.type === "SURCHARGE") {
        finalPrice += adjustment.amount;
      } else if (adjustment.type === "DISCOUNT") {
        finalPrice -= adjustment.amount;
      }
    }

    // S'assurer que le prix final n'est pas négatif
    finalPrice = Math.max(0, finalPrice);

    ctx.computed.finalPrice = Math.round(finalPrice * 100) / 100; // Arrondi à 2 décimales
  }
}
```

### 2. Registre des modules

```typescript
// src/quotation-module/modules/index.ts

import { QuoteModule } from '../core/QuoteModule';

// ... imports de tous les modules ...

/**
 * Retourne tous les modules disponibles, triés par priorité
 * ⚠️ CRITIQUE : Chaque module apparaît UNE SEULE FOIS
 * ⚠️ IMPORTANT: Aucun module "finalisateur" (comme RiskScoreModule)
 * Le risque est agrégé par le moteur depuis les contributions des modules
 * 
 * ORGANISATION : Par PHASE du pipeline (1-9), pas par Type (A/B/C)
 * La priorité détermine la phase, pas le type.
 */
export function getAllModules(): QuoteModule[] {
  return [
    // ============================================
    // PHASE 1 — Normalisation & Préparation (10-19)
    // ============================================
    new InputSanitizationModule(),      // 10
    new DateValidationModule(),         // 11
    new AddressNormalizationModule(),    // 12
    new UrbanZoneDetectionModule(),     // 13
    
    // ============================================
    // PHASE 2 — Volume & Charge (20-29)
    // ============================================
    new VolumeEstimationModule(),              // 20
    new VolumeConfidenceAdjustmentModule(),    // 21
    new BulkyFurnitureAdjustmentModule(),     // 22
    new SafetyMarginVolumeModule(),            // 23
    new VolumeUncertaintyRiskModule(),         // 24 (Type C - dépend de volumeConfidence)
    
    // ============================================
    // PHASE 3 — Distance & Transport (30-39)
    // ============================================
    new DistanceModule(),                      // 30
    new LongDistanceThresholdModule(),         // 31
    new RouteComplexityModule(),               // 32
    new FuelCostModule(),                      // 33
    new HighMileageFuelAdjustmentModule(),     // 34 (Type B - si distance > seuil)
    new TollCostModule(),                      // 35 (Type B - si IDF → Province)
    new TransportTimeEstimationModule(),       // 36
    new DriverRestTimeModule(),                // 37 (Type B - si distance > X km)
    new OvernightStopModule(),                 // 38 (Type B - si nécessaire)
    
    // ============================================
    // PHASE 4 — Accès & Contraintes Bâtiment (40-49)
    // ============================================
    new NoElevatorPickupModule(),              // 40 (Type B - si étage > 0 ET pas d'ascenseur)
    new NoElevatorDeliveryModule(),            // 41 (Type B - si étage > 0 ET pas d'ascenseur)
    new CarryDistancePenaltyModule(),         // 42 (Type B - si distance portage > 0)
    new StairComplexityModule(),              // 43 (Type B - si escaliers complexes)
    new ParkingAuthorizationModule(),         // 44 (Type B - si autorisation requise)
    new NavetteRequiredModule(),              // 45 (Type B - si navette nécessaire IDF)
    new TrafficIdfModule(),                  // 46 (Type B - si trafic IDF impactant)
    new TimeSlotSyndicModule(),              // 47 (Type B - si créneau syndic requis)
    new LoadingTimeEstimationModule(),       // 48 (Type A - estimation temps chargement)
    
    // ============================================
    // PHASE 5 — Monte-meubles CRITIQUE (50-59)
    // ============================================
    new MonteMeublesRecommendationModule(),  // 50 (Type B - si conditions réunies)
    new MonteMeublesCostModule(),            // 51 (Type B - si accepté)
    new MonteMeublesRefusalImpactModule(),   // 52 (Type C - si recommandé mais refusé)
    new LiabilityLimitationModule(),         // 53 (Type C - si refus malgré recommandation)
    new ManualReviewFlagModule(),            // 54 (Type C - si refus malgré recommandation)
    new ManualHandlingRiskCostModule(),      // 55 (Type C - si refus malgré recommandation)
    
    // ============================================
    // PHASE 6 — Main d'œuvre (60-69)
    // ============================================
    new VehicleSelectionModule(),            // 60 (Type A - dépend de volume)
    new WorkersCalculationModule(),          // 61 (Type A - dépend de volume)
    new LaborBaseModule(),                  // 62 (Type A - dépend de workersCount)
    new LaborIntensityModule(),             // 63 (Type B - si intensité élevée)
    new LaborOvertimeModule(),              // 64 (Type B - si heures supplémentaires)
    new TeamSizingModule(),                 // 65 (Type B - si ajustement nécessaire)
    new LaborAccessPenaltyModule(),         // 66 (Type B - si accès difficile)
    new CrewSizeAdjustmentModule(),         // 67 (Type B - ajustement opérationnel)
    
    // ============================================
    // PHASE 7 — Assurance & Risque (70-79)
    // ============================================
    new DeclaredValueValidationModule(),     // 70 (Type A - valide valeur déclarée)
    new InsurancePremiumModule(),            // 71 (Type A - calcule prime)
    new DeclaredValueInsufficientModule(),   // 72 (Type B - si valeur insuffisante)
    new HighValueItemHandlingModule(),      // 73 (Type B - si objets de valeur)
    new HighRiskManualReviewModule(),       // 74 (Type C - si risque élevé)
    new CoOwnershipRulesModule(),           // 75 (Type B - si copropriété)
    new NeighborhoodDamageRiskModule(),      // 76 (Type B - si risque voisinage)
    new PublicDomainOccupationModule(),      // 77 (Type B - si occupation domaine public)
    new DeliveryTimeWindowConstraintModule(), // 78 (Type B - si créneau horaire requis)
    
    // ============================================
    // PHASE 8 — Options & Cross-Selling (80-89)
    // ============================================
    // Modules Requirements (déclarent des besoins métier)
    new PackingRequirementModule(),         // 80 (Type B - recommande si nécessaire)
    new CleaningEndRequirementModule(),     // 81 (Type B - recommande si nécessaire)
    new StorageRequirementModule(),         // 82 (Type B - recommande si nécessaire)
    
    // Modules Cross-Selling (transforment requirements en propositions)
    new PackingCostModule(),                // 83 (Type C - si requirement PACKING_RECOMMENDED)
    new CleaningEndCostModule(),            // 84 (Type C - si requirement CLEANING_RECOMMENDED)
    new StorageCostModule(),               // 85 (Type C - si requirement STORAGE_RECOMMENDED)
    
    // Modules Options (prestations additionnelles facturées)
    new FurnitureDismantlingModule(),       // 86 (Type B - si accepté)
    new FurnitureAssemblyModule(),          // 87 (Type B - si accepté)
    new PremiumPackingModule(),            // 88 (Type B - si accepté)
    
    // ============================================
    // PHASE 9 — Agrégation & Finalisation (90-99)
    // ============================================
    // ⚠️ NOTE : Ces modules sont généralement exécutés par le moteur
    // mais peuvent être déclarés pour traçabilité
    // new PriceAggregationModule(),           // 90 (fait par le moteur)
    // new VATCalculationModule(),             // 91 (fait par le moteur)
    // new QuoteSummaryModule(),               // 92 (fait par le moteur)
    // new ComplianceCheckModule(),            // 93 (fait par le moteur)
  ];
}
```

### 3. Point d'entrée principal

```typescript
// src/quotation-module/index.ts

import { QuoteContext } from './core/QuoteContext';
import { QuoteEngine } from './core/QuoteEngine';
import { getAllModules } from './modules';

/**
 * Calcule un devis en utilisant le système modulaire
 * @param ctx Le contexte de calcul
 * @param phase Phase d'exécution (défaut: QUOTE)
 * @returns Le contexte enrichi avec les résultats
 */
export function calculateQuote(
  ctx: QuoteContext,
  phase: ExecutionPhase = "QUOTE"
): QuoteContext {
  const modules = getAllModules();
  const engine = new QuoteEngine(modules);
  return engine.execute(ctx, phase);
}

export * from './core/QuoteContext';
export * from './core/QuoteModule';
export * from './core/ComputedContext';
export * from './core/QuoteEngine';
export type { ExecutionPhase } from './core/QuoteModule';
```

---

## 🔗 Voir aussi

- [Types fondamentaux](./02-types-and-interfaces.md) - Interfaces QuoteModule, QuoteContext
- [Phases du pipeline](./04-pipeline-phases.md) - Ordre d'exécution strict
- [Multi-offres](./06-multi-offers.md) - Extension avec scénarios marketing

