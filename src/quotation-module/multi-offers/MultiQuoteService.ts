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

import { QuoteContext } from "../core/QuoteContext";
import { QuoteEngine } from "../core/QuoteEngine";
import { QuoteModule } from "../core/QuoteModule";
import { QuoteScenario } from "./QuoteScenario";
import {
  ScenarioRecommendationEngine,
  RecommendationResult,
  ScenarioScore,
} from "../services/ScenarioRecommendationEngine";

/**
 * Modules de base calculés par BaseCostEngine (à ignorer en mode incrémental)
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

  // PHASE 4 - Contraintes d'accès (coûts RÉELS qui s'appliquent à TOUS les scénarios)
  "no-elevator-pickup",
  "no-elevator-delivery",
  "navette-required",
  "time-slot-syndic",
  "traffic-idf",
  "access-constraints-penalty",

  // PHASE 5 - Monte-meubles et pénalités d'étage
  // Logique métier : le monte-meubles ANNULE les pénalités d'étage
  "monte-meubles-recommendation",
  "furniture-lift-cost",
  "floor-penalty-cost",

  // PHASE 6 - Main d'œuvre de base
  "vehicle-selection",
  // 'workers-calculation' retiré pour permettre l'ajustement selon le scénario
  // 'labor-base' retiré car dépend de workersCount qui varie selon le scénario
  "labor-access-penalty",
];

/**
 * Flags de services cross-selling qui peuvent être sélectionnés par le client
 * dans le catalogue et qui doivent être traités différemment selon les scénarios
 */
const CROSS_SELLING_SERVICE_FLAGS = [
  "packing",
  "dismantling",
  "reassembly",
  "cleaningEnd",
  "temporaryStorage",
] as const;

/**
 * Variante de devis générée
 */
export interface QuoteVariant {
  scenarioId: string;
  label: string;
  description: string;
  context: QuoteContext;
  finalPrice: number;
  basePrice: number;
  marginRate: number;
  tags: string[];
  /** Coûts additionnels (options, cross-selling) ajoutés au baseCost */
  additionalCosts?: number;
}

export class MultiQuoteService {
  private modules: QuoteModule[];

  constructor(modules: QuoteModule[]) {
    this.modules = modules;
  }

  /**
   * Prépare le contexte en sauvegardant les sélections cross-selling du client
   * et en nettoyant les flags du contexte de base.
   *
   * Cette méthode est cruciale pour éviter que les sélections du catalogue
   * n'affectent les scénarios qui ne doivent pas les prendre en compte.
   *
   * @param ctx Contexte de base avec les sélections cross-selling
   * @returns Contexte préparé avec métadonnées et flags nettoyés
   */
  private prepareContextWithCrossSellingMetadata(
    ctx: QuoteContext,
  ): QuoteContext {
    // Sauvegarder les sélections cross-selling du client dans les métadonnées
    const clientCrossSellingSelection = {
      packing: ctx.packing === true,
      dismantling: ctx.dismantling === true,
      reassembly: ctx.reassembly === true,
      cleaningEnd: ctx.cleaningEnd === true,
      temporaryStorage: ctx.temporaryStorage === true,
      // Objets spéciaux sélectionnés dans le catalogue
      piano: ctx.piano === true,
      safe: ctx.safe === true,
      artwork: ctx.artwork === true,
      // Fournitures sélectionnées
      suppliesTotal: ctx.crossSellingSuppliesTotal || 0,
      suppliesDetails: ctx.crossSellingSuppliesDetails || [],
      servicesTotal: ctx.crossSellingServicesTotal || 0,
      grandTotal: ctx.crossSellingGrandTotal || 0,
    };

    // Log des sélections client sauvegardées
    const hasClientSelection = Object.entries(clientCrossSellingSelection)
      .filter(([key]) => CROSS_SELLING_SERVICE_FLAGS.includes(key as any))
      .some(([, value]) => value === true);

    if (hasClientSelection) {
      console.log("\n📦 CROSS-SELLING CLIENT SAUVEGARDÉ:");
      if (clientCrossSellingSelection.packing)
        console.log("   ✓ Emballage professionnel");
      if (clientCrossSellingSelection.dismantling)
        console.log("   ✓ Démontage meubles");
      if (clientCrossSellingSelection.reassembly)
        console.log("   ✓ Remontage meubles");
      if (clientCrossSellingSelection.cleaningEnd)
        console.log("   ✓ Nettoyage fin de bail");
      if (clientCrossSellingSelection.temporaryStorage)
        console.log("   ✓ Stockage temporaire");
      if (clientCrossSellingSelection.suppliesTotal > 0) {
        console.log(
          `   ✓ Fournitures: ${clientCrossSellingSelection.suppliesTotal}€`,
        );
      }
    }

    // Retourner le contexte avec les métadonnées et les flags NETTOYÉS
    // Les flags seront restaurés dans generateSingleVariantFromBaseCost selon le scénario
    return {
      ...ctx,
      // Nettoyer les flags cross-selling du contexte de base
      // Ils seront restaurés selon le scénario (overrides ou sélection client)
      packing: false,
      dismantling: false,
      reassembly: false,
      cleaningEnd: false,
      // NOTE: temporaryStorage et objets spéciaux (piano, safe, artwork) ne sont pas nettoyés
      // car ils représentent une réalité physique du déménagement, pas un service optionnel
      metadata: {
        ...ctx.metadata,
        clientCrossSellingSelection,
      },
    };
  }

  /**
   * Applique les sélections cross-selling du client au contexte selon le scénario.
   * Seul le scénario FLEX (useClientSelection: true) prend en compte la sélection client.
   *
   * @param ctx Contexte cloné pour le scénario
   * @param scenario Scénario (useClientSelection définit si la sélection client est appliquée)
   * @returns Contexte avec les flags cross-selling appropriés
   */
  private applyClientCrossSellingForScenario(
    ctx: QuoteContext,
    scenario: QuoteScenario,
  ): QuoteContext {
    const clientSelection = ctx.metadata?.clientCrossSellingSelection;

    // Si pas de sélection client, retourner le contexte tel quel
    if (!clientSelection) {
      return ctx;
    }

    // Seul le scénario avec useClientSelection: true (FLEX) applique la sélection client
    if (scenario.useClientSelection !== true) {
      console.log(
        `   📦 ${scenario.id}: Sélection client non prise en compte (formule fixe)`,
      );
      return ctx;
    }

    // FLEX : on applique les sélections du client
    {
      const appliedServices: string[] = [];

      // Restaurer les flags selon la sélection client
      const updatedCtx = { ...ctx };

      if (clientSelection.packing) {
        updatedCtx.packing = true;
        appliedServices.push("emballage");
      }
      if (clientSelection.dismantling) {
        updatedCtx.dismantling = true;
        appliedServices.push("démontage");
      }
      if (clientSelection.reassembly) {
        updatedCtx.reassembly = true;
        appliedServices.push("remontage");
      }
      if (clientSelection.cleaningEnd) {
        updatedCtx.cleaningEnd = true;
        appliedServices.push("nettoyage");
      }
      if (clientSelection.temporaryStorage) {
        updatedCtx.temporaryStorage = true;
        appliedServices.push("stockage");
      }

      if (appliedServices.length > 0) {
        console.log(
          `   📦 ${scenario.id}: Sélection client APPLIQUÉE (${appliedServices.join(", ")})`,
        );
      } else {
        console.log(
          `   📦 ${scenario.id}: Aucune sélection client à appliquer`,
        );
      }

      return updatedCtx;
    }
  }

  /**
   * Génère plusieurs devis à partir d'un baseCost pré-calculé
   *
   * Cette méthode est utilisée dans la nouvelle architecture où :
   * 1. /calculate retourne le baseCost (coût opérationnel pur)
   * 2. /multi-offers utilise ce baseCost pour générer les 6 scénarios
   *
   * GESTION DU CROSS-SELLING :
   * - Les sélections cross-selling du client sont sauvegardées dans metadata.clientCrossSellingSelection
   * - Seul le scénario FLEX (useClientSelection: true) applique la sélection client
   * - Tous les autres scénarios (ECO, STANDARD, CONFORT, PREMIUM, SÉCURITÉ+) ignorent la sélection
   *   et utilisent uniquement les overrides / enabledModules / disabledModules du scénario
   *
   * @param baseCtx Contexte de base (données utilisateur + computed)
   * @param scenarios Scénarios à appliquer
   * @param baseCost Coût opérationnel de base (venant de /calculate)
   * @returns Variantes de devis générées
   */
  generateMultipleQuotesFromBaseCost(
    baseCtx: QuoteContext,
    scenarios: QuoteScenario[],
    baseCost: number,
  ): QuoteVariant[] {
    // 1. Sauvegarder les sélections cross-selling du client dans les métadonnées
    const preparedCtx = this.prepareContextWithCrossSellingMetadata(baseCtx);

    const variants = scenarios.map((scenario) =>
      this.generateSingleVariantFromBaseCost(preparedCtx, scenario, baseCost),
    );

    // Log récapitulatif des prix par scénario avec formule explicite
    console.log("\n📊 COMPARAISON DES 6 VARIANTES:");
    console.log(
      `   BaseCost opérationnel (coûts de base): ${baseCost.toFixed(2)}€`,
    );
    console.log(
      `   ─────────────────────────────────────────────────────────────────────`,
    );
    console.log(`   Formule: PRIX FINAL = (baseCost + options) × (1 + marge%)`);
    console.log(
      `   ─────────────────────────────────────────────────────────────────────`,
    );
    variants.forEach((v) => {
      const optionsCost = v.additionalCosts || 0;
      const preTaxTotal = baseCost + optionsCost;
      const marginAmount = preTaxTotal * v.marginRate;
      // Calcul détaillé: (baseCost + options) × (1 + marge) = prix final
      // Marge = (baseCost + options) × marge% = montant marge
      console.log(
        `   ${v.scenarioId.padEnd(10)}: ${v.finalPrice.toFixed(2).padStart(8)}€ = (${baseCost.toFixed(2)} + ${optionsCost.toFixed(2)}) × ${(1 + v.marginRate).toFixed(2)}`,
      );
      console.log(
        `                    └─ sous-total: ${preTaxTotal.toFixed(2)}€ + marge ${(v.marginRate * 100).toFixed(0)}% (${preTaxTotal.toFixed(2)} × ${v.marginRate.toFixed(2)} = ${marginAmount.toFixed(2)}€)`,
      );
    });
    console.log("");

    return variants;
  }

  /**
   * Génère une variante de devis à partir du baseCost (MODE INCRÉMENTAL)
   *
   * Utilise le mode incrémental du QuoteEngine :
   * - Réutilise ctx.computed existant (startFromContext)
   * - Ignore les modules de base (skipModules)
   * - Exécute uniquement les modules additionnels du scénario
   *
   * GESTION DU CROSS-SELLING :
   * - Seul FLEX (useClientSelection: true) restaure les sélections client avant les overrides
   * - Tous les autres scénarios : sélection client ignorée, seuls overrides/modules du scénario
   *
   * Formule : finalPrice = (baseCost + additionalCosts) * (1 + marginRate)
   *
   * @param baseCtx Contexte de base (avec computed rempli par BaseCostEngine)
   * @param scenario Scénario à appliquer
   * @param baseCost Coût opérationnel de base
   * @returns Variante de devis
   */
  private generateSingleVariantFromBaseCost(
    baseCtx: QuoteContext,
    scenario: QuoteScenario,
    baseCost: number,
  ): QuoteVariant {
    // 1. Cloner le contexte (sans computed, on le passera via startFromContext)
    const { computed: baseComputed, ...ctxWithoutComputed } = baseCtx;
    let ctxClone = structuredClone(ctxWithoutComputed) as QuoteContext;

    // 2. Injecter le scenarioId dans les métadonnées AVANT d'appliquer les sélections
    if (!ctxClone.metadata) {
      ctxClone.metadata = {};
    }
    ctxClone.metadata.scenarioId = scenario.id;

    // 3. Appliquer les sélections cross-selling du client selon le scénario
    // Uniquement si scenario.useClientSelection === true (FLEX uniquement)
    ctxClone = this.applyClientCrossSellingForScenario(ctxClone, scenario);

    // 4. Appliquer les overrides du scénario (APRÈS les sélections client pour FLEX)
    // Pour les formules fixe (ECO, STANDARD, CONFORT, etc.), les overrides imposent le contexte
    if (scenario.overrides) {
      Object.assign(ctxClone, scenario.overrides);
    }

    // 5. Créer le moteur en MODE INCRÉMENTAL
    // - startFromContext : réutilise le computed de BaseCostEngine
    // - skipModules : ignore les modules de base déjà calculés
    const engine = new QuoteEngine(this.modules, {
      // Mode incrémental
      startFromContext: baseComputed,
      skipModules: BASE_COST_MODULES,
      // Configuration du scénario
      enabledModules: scenario.enabledModules,
      disabledModules: scenario.disabledModules,
      marginRate: scenario.marginRate,
      executionPhase: "QUOTE",
      debug: false,
    });

    // 6. Exécuter le moteur (exécute UNIQUEMENT les modules additionnels)
    console.log(
      `\n🔧 Scénario ${scenario.id} (marge: ${(scenario.marginRate * 100).toFixed(1)}%) [MODE INCRÉMENTAL]`,
    );
    const enrichedCtx = engine.execute(ctxClone);

    // 7. Calculer les coûts additionnels
    // En mode incrémental, seuls les nouveaux coûts sont ajoutés
    // On filtre les modules de base pour obtenir uniquement les coûts additionnels
    const additionalCosts =
      enrichedCtx.computed?.costs
        ?.filter((c) => !BASE_COST_MODULES.includes(c.moduleId))
        .reduce((sum, c) => sum + c.amount, 0) || 0;

    // 8. Calculer le prix final
    // basePrice = baseCost (opérationnel) + additionalCosts (options)
    // finalPrice = basePrice * (1 + marginRate)
    const basePrice = baseCost + additionalCosts;
    const finalPrice = basePrice * (1 + scenario.marginRate);
    const marginAmount = basePrice * scenario.marginRate;

    // Log du prix final du scénario avec détail du calcul
    console.log(`   ────────────────────────────────`);
    console.log(
      `   PRIX FINAL ${scenario.id.toUpperCase()}: ${finalPrice.toFixed(2)}€`,
    );
    console.log(
      `      = (${baseCost.toFixed(2)}€ baseCost + ${additionalCosts.toFixed(2)}€ options) × (1 + ${(scenario.marginRate * 100).toFixed(0)}%)`,
    );
    console.log(
      `      = ${basePrice.toFixed(2)}€ × ${(1 + scenario.marginRate).toFixed(2)} = ${finalPrice.toFixed(2)}€`,
    );
    console.log(
      `      └─ marge: ${basePrice.toFixed(2)}€ × ${(scenario.marginRate * 100).toFixed(0)}% = +${marginAmount.toFixed(2)}€`,
    );

    // 9. Mettre à jour le contexte enrichi avec les bons prix
    if (enrichedCtx.computed) {
      enrichedCtx.computed.basePrice = basePrice;
      enrichedCtx.computed.finalPrice = finalPrice;
      enrichedCtx.computed.marginRate = scenario.marginRate;
    }

    // 10. Retourner la variante
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

  /**
   * Compare les variantes et retourne la moins chère et la plus chère
   *
   * @param variants Variantes à comparer
   * @returns Objet avec cheapest et mostExpensive
   */
  compareVariants(variants: QuoteVariant[]): {
    cheapest: QuoteVariant;
    mostExpensive: QuoteVariant;
    priceRange: number;
  } {
    const sorted = [...variants].sort((a, b) => a.finalPrice - b.finalPrice);

    return {
      cheapest: sorted[0],
      mostExpensive: sorted[sorted.length - 1],
      priceRange: sorted[sorted.length - 1].finalPrice - sorted[0].finalPrice,
    };
  }

  /**
   * Retourne la variante recommandée intelligemment basée sur le contexte client
   *
   * Analyse les données du formulaire (étage, ascenseur, volume, objets fragiles, distance, etc.)
   * pour recommander le scénario le plus adapté à la situation du client.
   *
   * @param variants Variantes disponibles
   * @param ctx Contexte du devis (données formulaire)
   * @returns Résultat de recommandation avec variante, raisons et scores
   */
  getSmartRecommendedVariant(
    variants: QuoteVariant[],
    ctx: QuoteContext,
  ): {
    recommended: QuoteVariant | undefined;
    alternative: QuoteVariant | undefined;
    recommendation: RecommendationResult;
    scores: ScenarioScore[];
  } {
    // Analyser le contexte avec le moteur de recommandation
    const recommendation = ScenarioRecommendationEngine.analyze(ctx);

    // Trouver les variantes correspondantes
    const recommendedVariant = variants.find(
      (v) => v.scenarioId === recommendation.recommended,
    );
    const alternativeVariant = recommendation.alternativeRecommendation
      ? variants.find(
          (v) => v.scenarioId === recommendation.alternativeRecommendation,
        )
      : undefined;

    return {
      recommended: recommendedVariant,
      alternative: alternativeVariant,
      recommendation,
      scores: recommendation.scores,
    };
  }
}
