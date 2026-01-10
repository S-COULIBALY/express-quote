/**
 * QuoteEngine - Moteur d'exécution des modules de calcul de devis
 *
 * Supporte deux modes d'exécution :
 *
 * 1. Mode COMPLET (par défaut) :
 *    - Initialise ctx.computed
 *    - Exécute tous les modules applicables
 *    - Utilisé par BaseCostEngine pour le calcul initial
 *
 * 2. Mode INCRÉMENTAL (pour multi-offres) :
 *    - Réutilise un ctx.computed existant (startFromContext)
 *    - Ignore les modules déjà exécutés (skipModules)
 *    - Exécute uniquement les modules additionnels (cross-selling, assurance, etc.)
 *    - Évite le recalcul des coûts de base
 *
 * Responsabilités:
 * 1. Initialiser ctx.computed (sauf en mode incrémental)
 * 2. Trier les modules par priorité
 * 3. Filtrer selon la phase temporelle
 * 4. Vérifier les dépendances et prérequis
 * 5. Exécuter séquentiellement les modules applicables
 * 6. Agréger les résultats finaux (risque, prix)
 */

import { QuoteContext } from './QuoteContext';
import { QuoteModule } from './QuoteModule';
import { ComputedContext, createEmptyComputedContext } from './ComputedContext';
import { PriceAggregator } from '../services/PriceAggregator';
import { devLog } from '@/lib/conditional-logger';

export interface QuoteEngineOptions {
  /**
   * Phase temporelle d'exécution
   * Par défaut: QUOTE
   */
  executionPhase?: 'QUOTE' | 'CONTRACT' | 'OPERATIONS';

  /**
   * Modules explicitement activés (pour multi-offres)
   */
  enabledModules?: string[];

  /**
   * Modules explicitement désactivés (pour multi-offres)
   * PRIORITAIRE sur enabledModules
   */
  disabledModules?: string[];

  /**
   * Modules à ignorer (déjà exécutés par BaseCostEngine)
   * Utilisé en mode incrémental pour éviter le recalcul
   */
  skipModules?: string[];

  /**
   * Contexte computed existant à réutiliser (mode incrémental)
   * Si fourni, les modules de base ne seront pas recalculés
   */
  startFromContext?: ComputedContext;

  /**
   * Taux de marge à appliquer (pour multi-offres)
   * Par défaut: 0.30 (30%)
   */
  marginRate?: number;

  /**
   * Mode debug (logs détaillés)
   */
  debug?: boolean;
}

/**
 * Options résolues avec valeurs par défaut
 */
interface ResolvedQuoteEngineOptions {
  executionPhase: 'QUOTE' | 'CONTRACT' | 'OPERATIONS';
  enabledModules: string[];
  disabledModules: string[];
  skipModules: string[];
  startFromContext: ComputedContext | undefined;
  marginRate: number;
  debug: boolean;
}

export class QuoteEngine {
  private modules: QuoteModule[];
  private options: ResolvedQuoteEngineOptions;

  constructor(modules: QuoteModule[], options: QuoteEngineOptions = {}) {
    this.modules = modules;
    this.options = {
      executionPhase: options.executionPhase || 'QUOTE',
      enabledModules: options.enabledModules || [],
      disabledModules: options.disabledModules || [],
      skipModules: options.skipModules || [],
      startFromContext: options.startFromContext,
      marginRate: options.marginRate ?? 0.3,
      debug: options.debug ?? false,
    };
  }

  /**
   * Vérifie si le moteur est en mode incrémental
   */
  get isIncrementalMode(): boolean {
    return !!this.options.startFromContext;
  }

  /**
   * Exécute tous les modules applicables sur le contexte
   *
   * En mode incrémental (startFromContext fourni) :
   * - Réutilise le contexte computed existant
   * - Ignore les modules dans skipModules
   * - Exécute uniquement les modules additionnels
   *
   * @param ctx Contexte d'entrée
   * @returns Contexte enrichi avec résultats calculés
   */
  execute(ctx: QuoteContext): QuoteContext {
    // 1. Initialiser ctx.computed
    // Mode incrémental : réutiliser le contexte existant (deep clone pour éviter les mutations)
    // Mode complet : créer un nouveau contexte vide
    let enrichedCtx: QuoteContext = {
      ...ctx,
      computed: this.options.startFromContext
        ? structuredClone(this.options.startFromContext)
        : createEmptyComputedContext(),
    };

    // 2. Filtrer et trier les modules
    const applicableModules = this.getApplicableModules(enrichedCtx);

    // Log du mode d'exécution
    if (this.isIncrementalMode) {
      console.log(`\n📋 MODE INCRÉMENTAL - ${this.options.skipModules.length} modules skippés (déjà calculés)`);
      console.log(`   Modules skippés: ${this.options.skipModules.slice(0, 5).join(', ')}${this.options.skipModules.length > 5 ? '...' : ''}`);
      console.log(`   Modules à exécuter: ${applicableModules.length}`);
      if (this.options.enabledModules.length > 0) {
        console.log(`   Modules forcés: ${this.options.enabledModules.join(', ')}`);
      }
      if (this.options.disabledModules.length > 0) {
        console.log(`   Modules désactivés: ${this.options.disabledModules.join(', ')}`);
      }
    }

    // 3. Exécuter séquentiellement
    const skippedModules: { id: string; reason: string }[] = [];
    const executedModules: { id: string; duration: number }[] = [];

    for (const module of applicableModules) {
      const moduleStartTime = Date.now();

      try {
        // Vérifier les prérequis implicites
        const prereqResult = this.checkPrerequisites(module, enrichedCtx);
        if (!prereqResult.satisfied) {
          console.log(`⏭️  [${module.id}] Ignoré: ${prereqResult.reason}`);
          skippedModules.push({ id: module.id, reason: prereqResult.reason });
          continue;
        }

        // Vérifier les dépendances explicites
        const depResult = this.checkDependencies(module, enrichedCtx);
        if (!depResult.satisfied) {
          console.log(`⏭️  [${module.id}] Ignoré: ${depResult.reason}`);
          skippedModules.push({ id: module.id, reason: depResult.reason });
          continue;
        }

        // Vérifier isApplicable() pour les modules avec dépendances (Type C)
        if (module.isApplicable && module.dependencies && module.dependencies.length > 0) {
          if (!module.isApplicable(enrichedCtx)) {
            const reason = this.explainApplicabilityFailure(module, enrichedCtx);
            console.log(`⏭️  [${module.id}] Ignoré: ${reason}`);
            skippedModules.push({ id: module.id, reason });
            continue;
          }
        }

        // Log début d'exécution
        console.log(`\n▶️  [${module.id}] Début exécution (priorité ${module.priority})`);

        // Exécuter le module (les logs détaillés sont dans le module lui-même)
        enrichedCtx = module.apply(enrichedCtx);

        // Ajouter à la traçabilité (au cas où le module l'aurait oublié)
        if (
          enrichedCtx.computed &&
          !enrichedCtx.computed.activatedModules.includes(module.id)
        ) {
          enrichedCtx.computed.activatedModules.push(module.id);
        }

        // Log fin d'exécution
        const moduleDuration = Date.now() - moduleStartTime;
        executedModules.push({ id: module.id, duration: moduleDuration });
        console.log(`   ✅ [${module.id}] Exécution terminée (${moduleDuration}ms)`);
      } catch (error) {
        // PHASE 1 (10-19): Erreur critique → arrêt
        if (module.priority >= 10 && module.priority < 20) {
        devLog.error('QuoteEngine', `❌ [ENGINE] Erreur critique PHASE 1 dans module ${module.id}`, {
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
          throw new Error(
            `[QuoteEngine] Erreur critique en PHASE 1 (module ${module.id}): ${
              error instanceof Error ? error.message : 'Erreur inconnue'
            }`
          );
        }

        // Autres phases: Continuer (résilience)
        devLog.warn('QuoteEngine', `⚠️ [ENGINE] Erreur dans module ${module.id} (non-critique)`, {
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    }

    // 4. Récapitulatif des modules exécutés/ignorés
    if (executedModules.length > 0 || skippedModules.length > 0) {
      console.log('\n📋 RÉCAPITULATIF EXÉCUTION MODULES:');
      console.log(`   ✅ Exécutés: ${executedModules.length} (${executedModules.map(m => m.id).join(', ') || 'aucun'})`);
      if (skippedModules.length > 0) {
        console.log(`   ⏭️  Ignorés: ${skippedModules.length}`);
        // Grouper par raison
        const byReason: Record<string, string[]> = {};
        skippedModules.forEach(m => {
          if (!byReason[m.reason]) byReason[m.reason] = [];
          byReason[m.reason].push(m.id);
        });
        Object.entries(byReason).forEach(([reason, modules]) => {
          console.log(`      → ${reason}: ${modules.join(', ')}`);
        });
      }
      const totalDuration = executedModules.reduce((sum, m) => sum + m.duration, 0);
      console.log(`   ⏱️  Durée totale: ${totalDuration}ms`);
    }

    // 5. Agrégation finale
    enrichedCtx = this.aggregateFinalResults(enrichedCtx);

    const totalCosts = enrichedCtx.computed?.costs.reduce((sum, c) => sum + c.amount, 0) || 0;
    const totalAdjustments = enrichedCtx.computed?.adjustments.reduce((sum, a) => sum + a.amount, 0) || 0;

    // Récapitulatif des coûts par catégorie (seulement si des coûts existent)
    const costsByCategory: Record<string, number> = {};
    enrichedCtx.computed?.costs.forEach(c => {
      costsByCategory[c.category] = (costsByCategory[c.category] || 0) + c.amount;
    });

    if (Object.keys(costsByCategory).length > 0) {
      console.log('\n📊 RÉCAPITULATIF DES COÛTS PAR CATÉGORIE:');
      Object.entries(costsByCategory).forEach(([category, amount]) => {
        console.log(`   ${category}: ${amount.toFixed(2)}€`);
      });
    }

    // Récapitulatif des ajustements
    if ((enrichedCtx.computed?.adjustments.length || 0) > 0) {
      console.log('\n📈 AJUSTEMENTS:');
      enrichedCtx.computed?.adjustments.forEach(a => {
        console.log(`   ${a.label}: ${a.amount.toFixed(2)}€ (${a.type})`);
      });
    }

    // Prix final - logs différenciés selon le mode
    if (this.isIncrementalMode) {
      // Mode incrémental : on calcule les coûts ADDITIONNELS (options/cross-selling)
      console.log('\n💵 CALCUL DES COÛTS ADDITIONNELS (MODE INCRÉMENTAL):');

      // Décomposer les coûts par catégorie
      if (Object.keys(costsByCategory).length > 0) {
        console.log(`   Détail des coûts additionnels:`);
        Object.entries(costsByCategory).forEach(([category, amount]) => {
          console.log(`      • ${category}: ${amount.toFixed(2)}€`);
        });
      }
      console.log(`   ────────────────────────────────`);
      console.log(`   Total coûts additionnels: ${totalCosts.toFixed(2)}€`);
      console.log(`   Ajustements temporels: ${totalAdjustments.toFixed(2)}€`);
      // Note: Le prix final du scénario sera affiché par MultiQuoteService après recalcul avec baseCost
    } else {
      // Mode complet : on calcule le baseCost opérationnel
      console.log('\n💵 CALCUL DU BASECOST OPÉRATIONNEL:');
      console.log(`   Somme des coûts: ${totalCosts.toFixed(2)}€`);
      console.log(`   Marge (${(this.options.marginRate * 100).toFixed(1)}%): ${(totalCosts * this.options.marginRate).toFixed(2)}€`);
      console.log(`   Prix de base HT: ${enrichedCtx.computed?.basePrice?.toFixed(2) || 0}€`);
      console.log(`   Ajustements: ${totalAdjustments.toFixed(2)}€`);
      console.log(`   BASECOST OPÉRATIONNEL: ${enrichedCtx.computed?.finalPrice?.toFixed(2) || 0}€\n`);
    }

    return enrichedCtx;
  }

  /**
   * Liste des modules essentiels qui doivent TOUJOURS être activés
   * (même si enabledModules est défini)
   */
  private static readonly ESSENTIAL_MODULES = [
    // PHASE 1 - Normalisation (toujours nécessaire)
    'input-sanitization',
    'date-validation',
    'address-normalization',
    // PHASE 2 - Volume (toujours nécessaire)
    'volume-estimation',
    'volume-uncertainty-risk',
    // PHASE 3 - Distance & Transport (toujours nécessaire)
    'distance-calculation',
    'long-distance-threshold',
    'fuel-cost',
    'high-mileage-fuel-adjustment',
    'toll-cost',
    // PHASE 6 - Main-d'œuvre (toujours nécessaire)
    'vehicle-selection',
    'workers-calculation',
    'labor-base',
    'labor-access-penalty',
    // PHASE 7 - Assurance (toujours nécessaire)
    'declared-value-validation',
    'insurance-premium',
  ];

  /**
   * Filtre et trie les modules applicables
   *
   * IMPORTANT : isApplicable() n'est PAS vérifié ici pour les modules avec dépendances (Type C).
   * Il sera vérifié juste avant l'exécution, après que les dépendances aient été satisfaites.
   * Cela permet aux modules Type C d'accéder aux données calculées par leurs dépendances.
   */
  private getApplicableModules(ctx: QuoteContext): QuoteModule[] {
    return this.modules
      .filter((module) => {
        // 1. Vérifier phase temporelle
        const modulePhase = module.executionPhase || 'QUOTE';
        if (modulePhase !== this.options.executionPhase) {
          return false;
        }

        // 2. Vérifier skipModules (mode incrémental - déjà exécutés par BaseCostEngine)
        if (this.options.skipModules.includes(module.id)) {
          return false;
        }

        // 3. Vérifier disabled (PRIORITAIRE)
        if (this.options.disabledModules.includes(module.id)) {
          return false;
        }

        // 4. Vérifier enabled
        // Si enabledModules est défini et non vide :
        // - Les modules essentiels sont TOUJOURS activés (sauf si en mode incrémental où ils sont skippés)
        // - Les modules dans enabledModules sont activés
        // - Les autres modules sont désactivés
        const isEssential = QuoteEngine.ESSENTIAL_MODULES.includes(module.id);
        const isEnabled = this.options.enabledModules.length === 0 ||
                         this.options.enabledModules.includes(module.id);

        if (this.options.enabledModules.length > 0 && !isEssential && !isEnabled) {
          return false;
        }

        // 5. Vérifier isApplicable() UNIQUEMENT pour les modules sans dépendances (Type A/B)
        // Les modules Type C (avec dépendances) seront vérifiés juste avant l'exécution
        if (
          module.isApplicable &&
          (!module.dependencies || module.dependencies.length === 0) &&
          !module.isApplicable(ctx)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => a.priority - b.priority); // Tri par priorité croissante
  }

  /**
   * Vérifie les dépendances explicites d'un module avec raison détaillée
   *
   * En mode incrémental, les modules skippés (déjà exécutés par BaseCostEngine)
   * sont considérés comme "activés" pour les vérifications de dépendances.
   */
  private checkDependencies(
    module: QuoteModule,
    ctx: QuoteContext
  ): { satisfied: boolean; reason: string } {
    if (!module.dependencies || module.dependencies.length === 0) {
      return { satisfied: true, reason: '' };
    }

    if (!ctx.computed) {
      return { satisfied: false, reason: 'ctx.computed non initialisé' };
    }

    // Vérifier chaque dépendance
    const missingDeps: string[] = [];
    for (const depId of module.dependencies) {
      // Une dépendance est satisfaite si :
      // 1. Elle est dans activatedModules (module exécuté dans cette session)
      // 2. OU elle est dans skipModules (module déjà exécuté par BaseCostEngine en mode incrémental)
      const isActivated = ctx.computed.activatedModules.includes(depId);
      const isSkipped = this.options.skipModules.includes(depId);

      if (!isActivated && !isSkipped) {
        missingDeps.push(depId);
      }
    }

    if (missingDeps.length > 0) {
      return {
        satisfied: false,
        reason: `dépendances manquantes: [${missingDeps.join(', ')}]`,
      };
    }

    return { satisfied: true, reason: '' };
  }

  /**
   * Vérifie les prérequis implicites d'un module avec raison détaillée
   *
   * Le moteur vérifie automatiquement que les données nécessaires
   * sont disponibles avant d'exécuter un module.
   */
  private checkPrerequisites(
    module: QuoteModule,
    ctx: QuoteContext
  ): { satisfied: boolean; reason: string } {
    if (!ctx.computed) {
      return { satisfied: false, reason: 'ctx.computed non initialisé' };
    }

    // Les modules avec "distance" dans leur ID nécessitent distanceKm
    // SAUF DistanceModule lui-même qui calcule distanceKm depuis ctx.distance
    if (
      module.id.includes('distance') &&
      module.id !== 'distance-calculation' &&
      !ctx.computed.distanceKm
    ) {
      return { satisfied: false, reason: 'distanceKm requis mais non calculé' };
    }

    // Les modules avec "fuel" nécessitent distanceKm
    if (module.id.includes('fuel') && !ctx.computed.distanceKm) {
      return { satisfied: false, reason: 'distanceKm requis pour calcul carburant' };
    }

    // Les modules avec "vehicle" nécessitent adjustedVolume
    if (
      module.id.includes('vehicle') &&
      module.priority > 25 &&
      !ctx.computed.adjustedVolume
    ) {
      return { satisfied: false, reason: 'adjustedVolume requis pour sélection véhicule' };
    }

    return { satisfied: true, reason: '' };
  }

  /**
   * Explique pourquoi isApplicable() a retourné false pour un module
   */
  private explainApplicabilityFailure(module: QuoteModule, ctx: QuoteContext): string {
    // Explications spécifiques par module
    switch (module.id) {
      case 'volume-uncertainty-risk':
        return `baseVolume=${ctx.computed?.baseVolume || 0} (doit être > 0)`;

      case 'high-mileage-fuel-adjustment':
        return `isLongDistance=${ctx.computed?.isLongDistance || false}, distance=${ctx.computed?.distanceKm || 0}km`;

      case 'overnight-stop-cost':
        return `distance=${ctx.computed?.distanceKm || 0}km (>1000km requis) OU forceOvernightStop=${ctx.forceOvernightStop || false}`;

      case 'loading-time-estimation':
        return `adjustedVolume=${ctx.computed?.adjustedVolume || 0}, workersCount=${ctx.computed?.workersCount || 0}`;

      case 'monte-meubles-refusal-impact':
        return `refuseLiftDespiteRecommendation=${ctx.refuseLiftDespiteRecommendation || false}`;

      case 'manual-handling-risk-cost':
        return `refuseLiftDespiteRecommendation=${ctx.refuseLiftDespiteRecommendation || false} ET lift recommandé requis`;

      case 'labor-access-penalty':
        const pickup = `départ: étage ${ctx.pickupFloor || 0}, ascenseur=${ctx.pickupHasElevator || false}`;
        const delivery = `arrivée: étage ${ctx.deliveryFloor || 0}, ascenseur=${ctx.deliveryHasElevator || false}`;
        return `aucune pénalité d'accès (${pickup}, ${delivery})`;

      case 'high-value-item-handling':
        return `aucun objet de valeur (piano=${ctx.piano || false}, coffre=${ctx.safe || false}, art=${ctx.artwork || false})`;

      case 'storage-cost':
        return `temporaryStorage=${ctx.temporaryStorage || false} (non demandé)`;

      case 'packing-cost':
        return `packing=${ctx.packing || false} (emballage non demandé)`;

      case 'cleaning-end-cost':
        return `cleaningEnd=${ctx.cleaningEnd || false} (nettoyage non demandé)`;

      default:
        return 'conditions métier non remplies';
    }
  }

  /**
   * Agrège les résultats finaux (risque, prix)
   */
  private aggregateFinalResults(ctx: QuoteContext): QuoteContext {
    if (!ctx.computed) {
      return ctx;
    }

    // 1. Agréger le score de risque
    ctx.computed.riskScore = ctx.computed.riskContributions.reduce(
      (sum, contribution) => sum + contribution.amount,
      0
    );

    // Plafonner à 100
    if (ctx.computed.riskScore > 100) {
      ctx.computed.riskScore = 100;
    }

    // 2. Déterminer si revue manuelle nécessaire
    ctx.computed.manualReviewRequired =
      ctx.computed.riskScore > 70 ||
      ctx.computed.legalImpacts.some((impact) => impact.severity === 'CRITICAL');

    // 3. Calculer les prix via PriceAggregator (service dédié)
    const priceResult = PriceAggregator.compute(ctx, this.options.marginRate);
    ctx.computed.basePrice = priceResult.basePrice;
    ctx.computed.finalPrice = priceResult.finalPrice;
    ctx.computed.marginRate = this.options.marginRate; // Stocker la marge pour réutilisation

    return ctx;
  }

}
