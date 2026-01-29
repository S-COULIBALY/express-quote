/**
 * BaseCostEngine - Moteur de calcul des coûts de base (opérationnels)
 *
 * ARCHITECTURE EN 2 ÉTAPES :
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ ÉTAPE 1: /api/quotation/calculate                                   │
 * │ ──────────────────────────────────────────────────────────────────── │
 * │ BaseCostEngine → baseCost + context.computed                        │
 * │ Calcule les coûts opérationnels purs (volume, distance, transport)  │
 * └─────────────────────────────────────────────────────────────────────┘
 *                              ↓
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ ÉTAPE 2: /api/quotation/multi-offers                                │
 * │ ──────────────────────────────────────────────────────────────────── │
 * │ MultiQuoteService (mode incrémental)                                │
 * │ - Réutilise context.computed de l'étape 1                           │
 * │ - Exécute UNIQUEMENT les modules additionnels par scénario          │
 * │ - Génère les 6 variantes avec marges différentes                    │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Responsabilités:
 * 1. Calculer UNIQUEMENT le coût opérationnel brut d'un déménagement
 * 2. Initialiser ctx.computed avec toutes les données calculées
 * 3. Retourner un contexte réutilisable par MultiQuoteService
 *
 * Modules exécutés (coûts de base UNIQUEMENT) :
 * - PHASE 1 : Normalisation (InputSanitization, DateValidation, AddressNormalization)
 * - PHASE 2 : Volume (VolumeEstimation)
 * - PHASE 3 : Distance & Transport (Distance, Fuel, Tolls)
 * - PHASE 6 : Main d'œuvre de base (Vehicle, Workers, LaborBase)
 *
 * Modules EXCLUS (ajoutés par les scénarios via QuoteEngine en mode incrémental) :
 * - Cross-selling (Packing, Cleaning, Storage, Dismantling)
 * - Objets spéciaux (HighValueItemHandling)
 * - Monte-meubles (FurnitureLift)
 * - Assurance (InsurancePremium)
 * - Garantie flexibilité (CrewFlexibility)
 * - Ajustements temporels (Weekend, EndOfMonth)
 * - Arrêt nuit (OvernightStop)
 */

import { QuoteContext } from "./QuoteContext";
import { QuoteModule } from "./QuoteModule";
import { createEmptyComputedContext } from "./ComputedContext";
import { devLog } from "@/lib/conditional-logger";

/**
 * Liste des modules de base (coûts opérationnels purs)
 *
 * ARCHITECTURE :
 * - Ces modules calculent le VRAI coût opérationnel du déménagement
 * - Toutes les contraintes d'accès sont incluses (étage, ascenseur, rue étroite, etc.)
 * - Le monte-meubles ANNULE les pénalités d'étage (logique métier réelle)
 * - MultiQuoteService ajoute ensuite les SERVICES du catalogue (emballage, nettoyage, etc.)
 */
const BASE_COST_MODULES = [
  // PHASE 1 - Normalisation
  "input-sanitization",
  "date-validation",
  "address-normalization",

  // PHASE 2 - Volume
  "volume-estimation",

  // PHASE 3 - Distance & Transport
  "distance-calculation",
  "long-distance-threshold",
  "fuel-cost",
  "toll-cost",

  // PHASE 4 - Contraintes d'accès (NOUVEAU)
  // Ces contraintes sont des coûts RÉELS qui s'appliquent à TOUS les scénarios
  "no-elevator-pickup", // Détection absence ascenseur départ
  "no-elevator-delivery", // Détection absence ascenseur arrivée
  "navette-required", // Navette si rue étroite/zone piétonne
  "traffic-idf", // Surcoût trafic IDF (heures de pointe)

  // PHASE 5 - Monte-meubles et pénalités d'étage (NOUVEAU)
  // Logique métier : le monte-meubles ANNULE les pénalités d'étage
  "monte-meubles-recommendation", // Recommande monte-meubles si nécessaire
  "furniture-lift-cost", // Coût du monte-meubles (si accepté)
  "floor-penalty-cost", // Pénalités d'étage (ANNULÉES si monte-meubles)

  // PHASE 6 - Main d'œuvre de base
  "vehicle-selection",
  "workers-calculation",
  "labor-base",
  "labor-access-penalty", // Pénalités accès (distance portage, etc.)
];

/**
 * Modules dont le coût est EXCLU du baseCost retourné
 * car ils varient selon le scénario et seront recalculés
 */
const VARIABLE_COST_MODULES = [
  "workers-calculation", // Nombre de déménageurs varie selon ECO/STANDARD
  "labor-base", // Coût main d'œuvre dépend du nombre de déménageurs
];

export interface BaseCostResult {
  /**
   * Coût opérationnel brut total (sans marge)
   */
  baseCost: number;

  /**
   * Contexte enrichi avec les résultats des modules de base
   */
  context: QuoteContext;

  /**
   * Détail des coûts par catégorie
   */
  breakdown: {
    volume: {
      baseVolume: number;
      adjustedVolume: number;
    };
    distance: {
      km: number;
      isLongDistance: boolean;
    };
    transport: {
      fuel: number;
      tolls: number;
      vehicle: number;
    };
    labor: {
      workers: number;
      hours: number;
      cost: number;
    };
  };

  /**
   * Liste des modules exécutés
   */
  activatedModules: string[];
}

export class BaseCostEngine {
  private modules: QuoteModule[];
  private baseModuleIds: Set<string>;

  constructor(modules: QuoteModule[]) {
    this.modules = modules;
    this.baseModuleIds = new Set(BASE_COST_MODULES);
  }

  /**
   * Calcule le coût opérationnel de base
   *
   * @param ctx Contexte d'entrée (données formulaire)
   * @returns Résultat avec baseCost et breakdown
   */
  execute(ctx: QuoteContext): BaseCostResult {
    // 1. Initialiser ctx.computed
    let enrichedCtx: QuoteContext = {
      ...ctx,
      computed: createEmptyComputedContext(),
    };

    // 2. Filtrer uniquement les modules de base, triés par priorité
    const baseModules = this.modules
      .filter((m) => this.baseModuleIds.has(m.id))
      .sort((a, b) => a.priority - b.priority);

    // Vérifier les modules manquants
    const foundModuleIds = baseModules.map((m) => m.id);
    const missingModules = BASE_COST_MODULES.filter(
      (id) => !foundModuleIds.includes(id),
    );

    console.log("\n🔧 CALCUL DU COÛT DE BASE (OPÉRATIONNEL)");
    console.log("═══════════════════════════════════════════════");
    console.log(
      `Modules à exécuter: ${baseModules.length}/${BASE_COST_MODULES.length}`,
    );
    console.log(`   ${baseModules.map((m) => m.id).join(", ")}`);
    if (missingModules.length > 0) {
      console.log(
        `   ⚠️ Modules manquants dans le registre: ${missingModules.join(", ")}`,
      );
    }
    console.log("");

    // 3. Exécuter séquentiellement les modules de base
    const executedModules: { id: string; duration: number }[] = [];
    const skippedModules: { id: string; reason: string }[] = [];

    for (const quoteModule of baseModules) {
      const startTime = Date.now();

      try {
        // Vérifier les prérequis avec raison détaillée
        const prereqResult = this.checkPrerequisites(quoteModule, enrichedCtx);
        if (!prereqResult.satisfied) {
          console.log(`⏭️  [${quoteModule.id}] Ignoré: ${prereqResult.reason}`);
          skippedModules.push({
            id: quoteModule.id,
            reason: prereqResult.reason,
          });
          continue;
        }

        // Vérifier les dépendances avec raison détaillée
        const depResult = this.checkDependencies(quoteModule, enrichedCtx);
        if (!depResult.satisfied) {
          console.log(`⏭️  [${quoteModule.id}] Ignoré: ${depResult.reason}`);
          skippedModules.push({ id: quoteModule.id, reason: depResult.reason });
          continue;
        }

        console.log(
          `\n▶️  [${quoteModule.id}] Exécution (priorité ${quoteModule.priority})`,
        );

        // Exécuter le module
        enrichedCtx = quoteModule.apply(enrichedCtx);

        // Ajouter à la traçabilité
        if (
          enrichedCtx.computed &&
          !enrichedCtx.computed.activatedModules.includes(quoteModule.id)
        ) {
          enrichedCtx.computed.activatedModules.push(quoteModule.id);
        }

        const duration = Date.now() - startTime;
        executedModules.push({ id: quoteModule.id, duration });
        console.log(`   ✅ [${quoteModule.id}] Terminé (${duration}ms)`);
      } catch (error) {
        // PHASE 1 : Erreur critique → arrêt
        if (quoteModule.priority >= 10 && quoteModule.priority < 20) {
          throw new Error(
            `[BaseCostEngine] Erreur critique PHASE 1 (module ${quoteModule.id}): ${
              error instanceof Error ? error.message : "Erreur inconnue"
            }`,
          );
        }

        // Autres phases : Continuer (résilience)
        devLog.warn(
          "BaseCostEngine",
          `⚠️ Erreur dans module ${quoteModule.id}`,
          {
            error: error instanceof Error ? error.message : "Erreur inconnue",
          },
        );
        skippedModules.push({
          id: quoteModule.id,
          reason: `erreur: ${error instanceof Error ? error.message : "inconnue"}`,
        });
      }
    }

    // Récapitulatif de l'exécution
    console.log("\n📋 RÉCAPITULATIF EXÉCUTION MODULES DE BASE:");
    console.log(
      `   ✅ Exécutés: ${executedModules.length} (${executedModules.map((m) => m.id).join(", ")})`,
    );
    if (skippedModules.length > 0) {
      console.log(`   ⏭️  Ignorés: ${skippedModules.length}`);
      skippedModules.forEach((m) => {
        console.log(`      → [${m.id}] ${m.reason}`);
      });
    }
    const totalDuration = executedModules.reduce(
      (sum, m) => sum + m.duration,
      0,
    );
    console.log(`   ⏱️  Durée totale: ${totalDuration}ms`);

    // 4. Calculer le coût de base total
    // IMPORTANT: Exclure les coûts des modules variables (recalculés par scénario)
    const costs = enrichedCtx.computed?.costs || [];
    const fixedCosts = costs.filter(
      (c) => !VARIABLE_COST_MODULES.includes(c.moduleId),
    );
    const variableCosts = costs.filter((c) =>
      VARIABLE_COST_MODULES.includes(c.moduleId),
    );
    const baseCost = fixedCosts.reduce((sum, c) => sum + c.amount, 0);
    const variableCostTotal = variableCosts.reduce(
      (sum, c) => sum + c.amount,
      0,
    );

    // 5. Construire le breakdown
    const breakdown = this.buildBreakdown(enrichedCtx);

    // 6. Log récapitulatif
    console.log("\n📊 RÉCAPITULATIF COÛT DE BASE:");
    console.log(`   Volume estimé: ${breakdown.volume.adjustedVolume} m³`);
    console.log(`   Distance: ${breakdown.distance.km} km`);
    console.log(`   Carburant: ${breakdown.transport.fuel.toFixed(2)}€`);
    console.log(`   Péages: ${breakdown.transport.tolls.toFixed(2)}€`);
    console.log(`   Véhicule: ${breakdown.transport.vehicle.toFixed(2)}€`);
    console.log(
      `   Main d'œuvre (référence): ${breakdown.labor.cost.toFixed(2)}€ (${breakdown.labor.workers} pers. × ${breakdown.labor.hours.toFixed(1)}h)`,
    );
    console.log(
      `      ⚠️ Coût variable: recalculé par scénario (ECO: max 2, STANDARD: 50%)`,
    );
    console.log(
      `\n💰 COÛT OPÉRATIONNEL FIXE (baseCost): ${baseCost.toFixed(2)}€`,
    );
    console.log(
      `   (exclu du baseCost: ${variableCostTotal.toFixed(2)}€ de main d'œuvre variable)\n`,
    );

    return {
      baseCost,
      context: enrichedCtx,
      breakdown,
      activatedModules: enrichedCtx.computed?.activatedModules || [],
    };
  }

  /**
   * Construit le breakdown des coûts par catégorie
   */
  private buildBreakdown(ctx: QuoteContext): BaseCostResult["breakdown"] {
    const costs = ctx.computed?.costs || [];

    // Extraire les coûts par module
    const fuelCost = costs.find((c) => c.moduleId === "fuel-cost")?.amount || 0;
    const tollCost = costs.find((c) => c.moduleId === "toll-cost")?.amount || 0;
    const vehicleCost =
      costs.find((c) => c.moduleId === "vehicle-selection")?.amount || 0;
    const laborCost =
      costs.find((c) => c.moduleId === "labor-base")?.amount || 0;

    // Extraire les métadonnées
    const laborMeta =
      costs.find((c) => c.moduleId === "labor-base")?.metadata || {};

    return {
      volume: {
        baseVolume: ctx.computed?.baseVolume || 0,
        adjustedVolume: ctx.computed?.adjustedVolume || 0,
      },
      distance: {
        km: ctx.computed?.distanceKm || 0,
        isLongDistance: ctx.computed?.isLongDistance || false,
      },
      transport: {
        fuel: fuelCost,
        tolls: tollCost,
        vehicle: vehicleCost,
      },
      labor: {
        workers: ctx.computed?.workersCount || 2,
        hours: (laborMeta as { estimatedHours?: number }).estimatedHours || 3,
        cost: laborCost,
      },
    };
  }

  /**
   * Vérifie les dépendances explicites d'un module avec raison détaillée
   */
  private checkDependencies(
    module: QuoteModule,
    ctx: QuoteContext,
  ): { satisfied: boolean; reason: string } {
    if (!module.dependencies || module.dependencies.length === 0) {
      return { satisfied: true, reason: "" };
    }

    if (!ctx.computed) {
      return { satisfied: false, reason: "ctx.computed non initialisé" };
    }

    const missingDeps = module.dependencies.filter(
      (depId) => !ctx.computed!.activatedModules.includes(depId),
    );

    if (missingDeps.length > 0) {
      return {
        satisfied: false,
        reason: `dépendances manquantes: [${missingDeps.join(", ")}]`,
      };
    }

    return { satisfied: true, reason: "" };
  }

  /**
   * Vérifie les prérequis implicites d'un module avec raison détaillée
   */
  private checkPrerequisites(
    module: QuoteModule,
    ctx: QuoteContext,
  ): { satisfied: boolean; reason: string } {
    if (!ctx.computed) {
      return { satisfied: false, reason: "ctx.computed non initialisé" };
    }

    // Les modules de distance (sauf distance-calculation) nécessitent distanceKm
    if (
      module.id.includes("distance") &&
      module.id !== "distance-calculation" &&
      !ctx.computed.distanceKm
    ) {
      return { satisfied: false, reason: "distanceKm requis mais non calculé" };
    }

    // Les modules de fuel nécessitent distanceKm
    if (module.id.includes("fuel") && !ctx.computed.distanceKm) {
      return {
        satisfied: false,
        reason: "distanceKm requis pour calcul carburant",
      };
    }

    // Les modules de vehicle (après priorité 25) nécessitent adjustedVolume
    if (
      module.id.includes("vehicle") &&
      module.priority > 25 &&
      !ctx.computed.adjustedVolume
    ) {
      return {
        satisfied: false,
        reason: "adjustedVolume requis pour sélection véhicule",
      };
    }

    return { satisfied: true, reason: "" };
  }
}
