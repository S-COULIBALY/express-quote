import { Money } from "../valueObjects/Money";
import { Rule, RuleApplyResult } from "../valueObjects/Rule";
import { QuoteContext } from "../valueObjects/QuoteContext";
import { AppliedRule, RuleValueType } from "../valueObjects/AppliedRule";
import {
  RuleExecutionResult,
  RuleExecutionResultBuilder,
  AppliedRuleDetail,
  AppliedRuleType,
} from "../interfaces/RuleExecutionResult";
import { logger } from "../../../lib/logger";
import { calculationDebugLogger } from "../../../lib/calculation-debug-logger";
import { AutoDetectionService, AddressData } from "./AutoDetectionService";

// Temporary compatibility aliases (to be removed after full migration)
import { Discount, DiscountType } from "../valueObjects/Discount";

/**
 * Moteur d'exécution des règles métier
 * Applique les règles sur un prix de base pour obtenir un prix final
 */
export class RuleEngine {
  constructor(private rules: Rule[]) {
    // Trier les règles par priorité - les règles de tarif minimum doivent être appliquées en dernier
    this.rules.sort((a, b) => {
      // Priorité spéciale pour la règle de tarif minimum
      if (a.name === "Tarif minimum") return 1;
      if (b.name === "Tarif minimum") return -1;

      // Priorité pour les règles en pourcentage par rapport aux règles en montant fixe
      if (a.isPercentage() && !b.isPercentage()) return -1;
      if (!a.isPercentage() && b.isPercentage()) return 1;

      return 0;
    });
  }

  /**
   * Exécute toutes les règles applicables sur le prix
   */
  execute(context: QuoteContext, basePrice: Money): RuleExecutionResult {
    console.log("\n==== DÉBUT RULEENGINE.EXECUTE ====");
    console.log("📋 CONTEXTE:", context.getAllData());
    console.log("💰 PRIX DE BASE:", basePrice.getAmount());
    console.log("📋 NOMBRE DE RÈGLES À VÉRIFIER:", this.rules.length);

    // Démarrer le logging détaillé du moteur de règles
    calculationDebugLogger.startRulesEngine(
      this.rules,
      basePrice.getAmount(),
      context.getAllData(),
    );

    // ✅ UTILISATION D'AUTODETECTIONSERVICE: Analyser les contraintes consommées UNE SEULE FOIS
    const contextData = context.getAllData();

    // Construire les données d'adresse pour pickup et delivery
    const pickupData: AddressData = {
      floor:
        typeof contextData.pickupFloor === "number"
          ? contextData.pickupFloor
          : parseInt(String(contextData.pickupFloor || "0"), 10) || 0,
      elevator: (contextData.pickupElevator || "no") as
        | "no"
        | "small"
        | "medium"
        | "large",
      carryDistance: contextData.pickupCarryDistance as any as
        | "0-10"
        | "10-30"
        | "30+"
        | undefined,
      constraints: (contextData.pickupLogisticsConstraints || []) as string[],
    };

    const deliveryData: AddressData = {
      floor:
        typeof contextData.deliveryFloor === "number"
          ? contextData.deliveryFloor
          : parseInt(String(contextData.deliveryFloor || "0"), 10) || 0,
      elevator: (contextData.deliveryElevator || "no") as
        | "no"
        | "small"
        | "medium"
        | "large",
      carryDistance: contextData.deliveryCarryDistance as any as
        | "0-10"
        | "10-30"
        | "30+"
        | undefined,
      constraints: (contextData.deliveryLogisticsConstraints || []) as string[],
    };

    // Détecter avec AutoDetectionService
    const pickupDetection = AutoDetectionService.detectFurnitureLift(
      pickupData,
      contextData.volume,
    );
    const deliveryDetection = AutoDetectionService.detectFurnitureLift(
      deliveryData,
      contextData.volume,
    );

    // Combiner les contraintes consommées des deux adresses
    const allConsumedConstraints = new Set<string>([
      ...(pickupDetection.consumedConstraints || []),
      ...(deliveryDetection.consumedConstraints || []),
    ]);

    const furnitureLiftRequired =
      pickupDetection.furnitureLiftRequired ||
      deliveryDetection.furnitureLiftRequired;

    // ✅ Enrichir les contraintes logistiques avec furniture_lift_required si nécessaire
    const enrichedPickupConstraints = [
      ...(contextData.pickupLogisticsConstraints || []),
    ];
    const enrichedDeliveryConstraints = [
      ...(contextData.deliveryLogisticsConstraints || []),
    ];

    if (
      pickupDetection.furnitureLiftRequired &&
      !enrichedPickupConstraints.includes("furniture_lift_required")
    ) {
      enrichedPickupConstraints.push("furniture_lift_required");
    }
    if (
      deliveryDetection.furnitureLiftRequired &&
      !enrichedDeliveryConstraints.includes("furniture_lift_required")
    ) {
      enrichedDeliveryConstraints.push("furniture_lift_required");
    }

    // ✅ Enrichir le context avec les contraintes consommées
    // Cela sera utilisé par Rule.isApplicable() pour éviter la double facturation
    const enrichedContextData = {
      ...contextData,
      pickupLogisticsConstraints: enrichedPickupConstraints,
      deliveryLogisticsConstraints: enrichedDeliveryConstraints,
      monte_meuble_requis: furnitureLiftRequired,
      consumedConstraints: allConsumedConstraints,
    };

    // ✨ AFFICHAGE OPTIMISÉ: Contexte des contraintes consommées (une seule fois)
    if (furnitureLiftRequired && allConsumedConstraints.size > 0) {
      console.log("\n🏗️ [CONTEXTE] MONTE-MEUBLE REQUIS");
      console.log(
        `   📦 Contraintes consommées: [${Array.from(allConsumedConstraints)
          .map((c) => `'${c}'`)
          .join(", ")}]`,
      );
      console.log(
        `   ℹ️  Les règles liées à ces contraintes seront automatiquement ignorées\n`,
      );
    }

    try {
      // Valider le contexte
      try {
        console.log("🔍 VALIDATION DU CONTEXTE...");
        context.validate();
        console.log("✅ CONTEXTE VALIDÉ");
      } catch (error) {
        console.log("❌ ERREUR DE VALIDATION DU CONTEXTE:", error);
        throw error;
      }

      // ✅ NOUVEAU: Utiliser le Builder pour construire le résultat
      const builder = new RuleExecutionResultBuilder(basePrice);

      // Préparer les variables de résultat (pour la logique de calcul)
      const discounts: Discount[] = []; // Temporary - for backward compatibility
      const basePriceAmount = basePrice.getAmount(); // Prix de base constant
      let totalImpact = 0; // Accumuler tous les impacts
      const appliedRules: string[] = [];
      let minimumPrice: number | null = null; // Stocker le prix minimum

      console.log("🔄 TRAITEMENT DE CHAQUE RÈGLE...");

      // Traiter chaque règle
      try {
        for (const rule of this.rules) {
          // ✅ VÉRIFICATION: Contraintes consommées par le monte-meubles
          if (
            furnitureLiftRequired &&
            this.isRuleConstraintConsumed(rule, allConsumedConstraints)
          ) {
            calculationDebugLogger.logRuleSkipped(
              rule,
              "Contrainte consommée par le monte-meuble",
            );
            continue;
          }

          try {
            // ✅ Vérifier si la règle est applicable avec le context enrichi
            const isApplicable = rule.isApplicable(enrichedContextData);

            if (isApplicable) {
              // Application de la règle - les détails sont loggés par calculationDebugLogger

              try {
                // ✅ CORRECTION: Toujours appliquer les règles sur le prix de base
                const currentPrice = basePriceAmount + totalImpact;

                // Appliquer la règle sur le prix de base (pour les pourcentages)
                const ruleResult: RuleApplyResult = rule.apply(
                  new Money(currentPrice),
                  contextData,
                  basePrice,
                );

                // Vérifier si la règle définit un prix minimum
                if (ruleResult.minimumPrice !== undefined) {
                  console.log(
                    "⚠️ RÈGLE DÉFINIT UN PRIX MINIMUM:",
                    ruleResult.minimumPrice,
                  );
                  minimumPrice = ruleResult.minimumPrice;
                  calculationDebugLogger.logRuleSkipped(
                    rule,
                    `Règle de prix minimum: ${ruleResult.minimumPrice}€`,
                  );
                  // Ne pas ajouter de réduction pour les règles de prix minimum
                  continue;
                }

                // Pour les règles normales avec un impact
                if (ruleResult.isApplied && ruleResult.impact !== 0) {
                  // ✅ CORRECTION BUG: Déterminer l'adresse AVANT d'accumuler l'impact
                  // Utiliser enrichedContextData pour voir furniture_lift_required
                  const ruleAddress = this.determineAddress(rule, enrichedContextData);

                  // Si la règle s'applique aux deux adresses, doubler l'impact
                  const impactMultiplier = ruleAddress === "both" ? 2 : 1;

                  // Accumuler l'impact (doublé si les deux adresses)
                  totalImpact += ruleResult.impact * impactMultiplier;

                  // Logger l'application de la règle (format Option D)
                  // Si la règle s'applique aux deux adresses, logger une seule fois avec l'impact total
                  if (impactMultiplier === 2) {
                    // Créer un ruleResult avec l'impact doublé pour le log
                    const doubledResult = {
                      ...ruleResult,
                      impact: ruleResult.impact * 2,
                    };
                    calculationDebugLogger.logRuleApplication(
                      rule,
                      currentPrice,
                      doubledResult,
                      contextData,
                    );
                  } else {
                    calculationDebugLogger.logRuleApplication(
                      rule,
                      currentPrice,
                      ruleResult,
                      contextData,
                    );
                  }

                  // Déterminer le type de réduction
                  const discountType = rule.isPercentage()
                    ? DiscountType.PERCENTAGE
                    : DiscountType.FIXED;

                  // Créer un objet Discount avec l'impact absolu
                  try {
                    // Déterminer si c'est une réduction (impact négatif) ou une surcharge (impact positif)
                    const isReduction = ruleResult.impact < 0;
                    const absoluteImpact = Math.abs(ruleResult.impact);

                    // ✅ CORRECTION: Utiliser la valeur originale de la règle directement
                    const discountValue = Math.abs(rule.value);

                    const discount = new Discount(
                      rule.name,
                      discountType,
                      discountValue,
                      undefined, // code
                      undefined, // expirationDate
                      isReduction, // isReductionFlag
                    );

                    // Ajouter la réduction (backward compatibility)
                    discounts.push(discount);
                    appliedRules.push(rule.name);

                    // ✅ NOUVEAU: Ajouter au Builder avec détails complets
                    const appliedRuleDetail: AppliedRuleDetail = {
                      id: rule.id || "unknown",
                      name: rule.name,
                      type: this.determineRuleType(rule),
                      value: Math.abs(rule.value),
                      isPercentage: rule.isPercentage(),
                      impact: new Money(absoluteImpact),
                      description: rule.name,
                      address: ruleAddress, // Utiliser ruleAddress déjà calculé
                      isConsumed: false,
                    };

                    // ✅ CORRECTION BUG: Si la règle s'applique aux deux adresses,
                    // l'ajouter deux fois (une pour pickup, une pour delivery)
                    if (ruleAddress === "both") {
                      builder.addAppliedRule({
                        ...appliedRuleDetail,
                        address: "pickup",
                      });
                      builder.addAppliedRule({
                        ...appliedRuleDetail,
                        address: "delivery",
                      });
                    } else {
                      builder.addAppliedRule(appliedRuleDetail);
                    }
                  } catch (discountError) {
                    console.log(
                      "❌ ERREUR LORS DE LA CRÉATION DU DISCOUNT:",
                      discountError,
                    );
                    throw discountError;
                  }
                } else {
                  console.log(`ℹ️ RÈGLE "${rule.name}" SANS IMPACT:`, {
                    isApplied: ruleResult.isApplied,
                    impact: ruleResult.impact,
                  });
                  calculationDebugLogger.logRuleSkipped(
                    rule,
                    `Règle sans impact: isApplied=${ruleResult.isApplied}, impact=${ruleResult.impact}`,
                  );
                }
              } catch (applyError) {
                console.log(
                  "❌ ERREUR LORS DE L'APPLICATION DE LA RÈGLE:",
                  applyError,
                );
                if (applyError instanceof Error) {
                  console.log("📋 TYPE D'ERREUR:", applyError.constructor.name);
                  console.log("📋 MESSAGE:", applyError.message);
                  console.log("📋 STACK:", applyError.stack);
                }

                // Erreur spécifique à vérifier
                if (
                  applyError instanceof Error &&
                  (applyError.message.includes("is not a function") ||
                    applyError.message.includes("is not defined"))
                ) {
                  console.log(
                    "🚨 ERREUR D'OPÉRATION DÉTECTÉE - Opération non supportée",
                  );
                  throw new Error("Opération non supportée");
                }

                throw applyError;
              }
            } else {
              // Logger l'évaluation pour les règles non applicables seulement
              calculationDebugLogger.logRuleEvaluation(
                rule,
                contextData,
                false,
              );
            }
          } catch (ruleError) {
            console.log("❌ ERREUR SPÉCIFIQUE À UNE RÈGLE:", ruleError);
            calculationDebugLogger.logRuleEvaluation(
              rule,
              context.getAllData(),
              false,
              ruleError,
            );
            throw ruleError;
          }
        }

        // Calculer le prix final = prix de base + tous les impacts
        let finalPrice = basePriceAmount + totalImpact;

        // Vérifier que le prix final n'est pas inférieur au prix minimum
        console.log("🔍 VÉRIFICATION DU PRIX FINAL...");
        const priceBeforeMinimumCheck = finalPrice;
        if (minimumPrice !== null && finalPrice < minimumPrice) {
          console.log(
            `⚠️ PRIX FINAL (${finalPrice}) INFÉRIEUR AU MINIMUM (${minimumPrice}) - AJUSTEMENT`,
          );
          finalPrice = minimumPrice;
          calculationDebugLogger.logMinimumPriceCheck(
            priceBeforeMinimumCheck,
            minimumPrice,
            finalPrice,
          );
        }
        // Vérifier que le prix final n'est pas négatif
        else if (finalPrice < 0) {
          console.log("⚠️ PRIX NÉGATIF DÉTECTÉ - Ajustement à 0");
          finalPrice = 0;
        } else if (minimumPrice !== null) {
          calculationDebugLogger.logMinimumPriceCheck(
            priceBeforeMinimumCheck,
            minimumPrice,
            finalPrice,
          );
        }

        console.log("✅ EXECUTION TERMINÉE - Résultat:");
        console.log("💰 PRIX FINAL:", finalPrice);
        console.log("📋 RÈGLES APPLIQUÉES:", discounts.length);
        if (discounts.length > 0) {
          // Séparer les surcharges des réductions
          const surcharges = discounts.filter(
            (d) => d.getAmount().getAmount() > 0,
          );
          const reductions = discounts.filter(
            (d) => d.getAmount().getAmount() < 0,
          );

          if (surcharges.length > 0) {
            console.log("📈 SURCHARGES APPLIQUÉES:", surcharges.length);
            console.log(
              "📈 DÉTAIL DES SURCHARGES:",
              surcharges.map((d) => ({
                nom: d.getName(),
                type:
                  d.getType() === DiscountType.PERCENTAGE
                    ? "pourcentage"
                    : "montant fixe",
                valeur: d.getAmount().getAmount(),
              })),
            );
          }

          if (reductions.length > 0) {
            console.log("📉 RÉDUCTIONS APPLIQUÉES:", reductions.length);
            console.log(
              "📉 DÉTAIL DES RÉDUCTIONS:",
              reductions.map((d) => ({
                nom: d.getName(),
                type:
                  d.getType() === DiscountType.PERCENTAGE
                    ? "pourcentage"
                    : "montant fixe",
                valeur: Math.abs(d.getAmount().getAmount()), // Afficher en valeur absolue pour les réductions
              })),
            );
          }
        }
        console.log("==== FIN RULEENGINE.EXECUTE (SUCCÈS) ====\n");

        // ✅ NOUVEAU: Finaliser le résultat avec le Builder
        builder.setFinalPrice(new Money(finalPrice));

        // Ajouter les contraintes consommées (global)
        if (allConsumedConstraints.size > 0) {
          builder.setConsumedConstraints(
            Array.from(allConsumedConstraints),
            "Consommées par le Monte-meuble",
          );
        }

        // Ajouter les informations sur le monte-meuble (global)
        builder.setFurnitureLift(
          furnitureLiftRequired,
          pickupDetection.furnitureLiftReason ||
            deliveryDetection.furnitureLiftReason,
        );

        // Ajouter les informations spécifiques par adresse
        if (pickupDetection.furnitureLiftRequired) {
          builder.setAddressFurnitureLift(
            "pickup",
            true,
            pickupDetection.furnitureLiftReason,
          );
          builder.setAddressConsumedConstraints(
            "pickup",
            pickupDetection.consumedConstraints || [],
            "Consommées par le Monte-meuble (départ)",
          );
        }

        if (deliveryDetection.furnitureLiftRequired) {
          builder.setAddressFurnitureLift(
            "delivery",
            true,
            deliveryDetection.furnitureLiftReason,
          );
          builder.setAddressConsumedConstraints(
            "delivery",
            deliveryDetection.consumedConstraints || [],
            "Consommées par le Monte-meuble (arrivée)",
          );
        }

        // Ajouter le prix minimum si applicable
        if (minimumPrice !== null && finalPrice >= minimumPrice) {
          builder.setMinimumPrice(true, new Money(minimumPrice));
        }

        // Construire le résultat complet
        const result = builder.build();

        // ✅ COMPATIBILITÉ: Ajouter la propriété discounts pour le code existant
        (result as any).discounts = discounts;

        return result;
      } catch (rulesError) {
        console.log("❌ ERREUR PENDANT LE TRAITEMENT DES RÈGLES:", rulesError);
        if (rulesError instanceof Error) {
          console.log("📋 TYPE D'ERREUR:", rulesError.constructor.name);
          console.log("📋 MESSAGE:", rulesError.message);
          console.log("📋 STACK:", rulesError.stack);

          // Si c'est l'erreur "Opération non supportée", la propager
          if (rulesError.message.includes("Opération non supportée")) {
            console.log("🚨 PROPAGATION DE L'ERREUR 'Opération non supportée'");
          }
        }
        throw rulesError;
      }
    } catch (error) {
      console.log("❌ ERREUR GÉNÉRALE DANS RULEENGINE.EXECUTE:", error);
      if (error instanceof Error) {
        console.log("📋 TYPE D'ERREUR:", error.constructor.name);
        console.log("📋 MESSAGE:", error.message);
        console.log("📋 STACK:", error.stack);
      }
      console.log("==== FIN RULEENGINE.EXECUTE (ERREUR) ====\n");
      throw new Error(
        `Impossible d'exécuter les règles: ${error instanceof Error ? error.message : "Erreur inconnue"}`,
      );
    }
  }

  /**
   * Récupérer toutes les règles
   */
  getRules(): Rule[] {
    return [...this.rules];
  }

  /**
   * Ajouter une règle
   */
  addRule(rule: Rule): void {
    this.rules.push(rule);
  }

  /**
   * Supprimer une règle
   */
  removeRule(ruleToRemove: Rule): void {
    this.rules = this.rules.filter((rule) => !rule.equals(ruleToRemove));
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  /**
   * Détermine le type d'une règle appliquée pour le nouveau système
   */
  private determineRuleType(rule: Rule): AppliedRuleType {
    const name = rule.name.toLowerCase();

    // Vérifier si c'est une réduction
    if (rule.value < 0) {
      return AppliedRuleType.REDUCTION;
    }

    // Equipment (Monte-meuble)
    if (name.includes("monte-meuble") || name.includes("monte meuble")) {
      return AppliedRuleType.EQUIPMENT;
    }

    // Temporal (Week-end, période spéciale)
    if (
      name.includes("weekend") ||
      name.includes("week-end") ||
      name.includes("samedi") ||
      name.includes("dimanche") ||
      name.includes("férié") ||
      name.includes("nuit")
    ) {
      return AppliedRuleType.TEMPORAL;
    }

    // Constraints (Escaliers, ascenseur, distance)
    if (
      name.includes("escalier") ||
      name.includes("ascenseur") ||
      name.includes("étage") ||
      name.includes("distance") ||
      name.includes("accès") ||
      name.includes("parking") ||
      name.includes("zone piétonne")
    ) {
      return AppliedRuleType.CONSTRAINT;
    }

    // Additional Services (Emballage, démontage, nettoyage)
    if (
      name.includes("emballage") ||
      name.includes("démontage") ||
      name.includes("montage") ||
      name.includes("nettoyage") ||
      name.includes("stockage") ||
      name.includes("piano") ||
      name.includes("assurance")
    ) {
      return AppliedRuleType.ADDITIONAL_SERVICE;
    }

    // Par défaut, c'est une surcharge
    return AppliedRuleType.SURCHARGE;
  }

  /**
   * Détermine l'adresse concernée par une règle (pickup, delivery, both)
   */
  private determineAddress(
    rule: Rule,
    contextData: Record<string, unknown>,
  ): "pickup" | "delivery" | "both" | undefined {
    const name = rule.name.toLowerCase();

    // Analyse le nom de la règle pour détecter les mentions d'adresse
    const hasPickupMention =
      name.includes("départ") ||
      name.includes("chargement") ||
      name.includes("pickup");
    const hasDeliveryMention =
      name.includes("arrivée") ||
      name.includes("livraison") ||
      name.includes("delivery");

    if (hasPickupMention && !hasDeliveryMention) return "pickup";
    if (hasDeliveryMention && !hasPickupMention) return "delivery";
    if (hasPickupMention && hasDeliveryMention) return "both";

    // Analyse la condition de la règle si disponible
    const condition = rule.condition;
    if (typeof condition === "object" && condition !== null) {
      const conditionStr = JSON.stringify(condition).toLowerCase();
      if (conditionStr.includes("pickup") && !conditionStr.includes("delivery"))
        return "pickup";
      if (conditionStr.includes("delivery") && !conditionStr.includes("pickup"))
        return "delivery";
    }

    // ✅ NOUVEAU: Vérifier si la contrainte est présente dans le contexte
    // Extraire le nom de la contrainte depuis la condition de la règle
    const constraintName = this.extractConstraintNameFromCondition(
      rule.condition,
    );

    if (constraintName) {
      const pickupConstraints =
        (contextData.pickupLogisticsConstraints as string[]) || [];
      const deliveryConstraints =
        (contextData.deliveryLogisticsConstraints as string[]) || [];

      const isInPickup = pickupConstraints.includes(constraintName);
      const isInDelivery = deliveryConstraints.includes(constraintName);

      // Si la contrainte est présente aux deux adresses, retourner "both"
      if (isInPickup && isInDelivery) return "both";
      if (isInPickup) return "pickup";
      if (isInDelivery) return "delivery";
    }

    return undefined;
  }

  /**
   * ✅ Vérifie si une règle doit être ignorée car sa contrainte est consommée par le monte-meuble
   * Cette logique est conservée car elle ne concerne que l'évaluation des règles,
   * pas la détection du monte-meubles (gérée par AutoDetectionService)
   */
  private isRuleConstraintConsumed(
    rule: Rule,
    consumedConstraints: Set<string>,
  ): boolean {
    // Si cette règle est la règle du monte-meuble elle-même, ne pas l'ignorer
    if (
      rule.condition === "furniture_lift_required" ||
      rule.name === "Monte-meuble" ||
      rule.name === "Supplément monte-meuble"
    ) {
      return false;
    }

    // ✅ CORRECTION: Gérer les conditions JSON (objet) en les mappant vers des noms de contraintes
    const constraintName = this.extractConstraintNameFromCondition(
      rule.condition,
    );

    if (constraintName && consumedConstraints.has(constraintName)) {
      return true;
    }

    return false;
  }

  /**
   * ✅ Extrait le nom de contrainte d'une condition de règle (objet JSON ou string)
   * Utilise la même logique que Rule.mapJsonConditionToConstraintName()
   */
  private extractConstraintNameFromCondition(condition: any): string | null {
    // Si la condition est un string simple, c'est déjà le nom de la contrainte
    if (typeof condition === "string") {
      return condition;
    }

    // Si c'est un objet JSON, le mapper vers le nom de contrainte
    if (typeof condition === "object" && condition !== null) {
      const type = condition.type;

      // Vehicle Access
      if (type === "vehicle_access") {
        if (condition.zone === "pedestrian") return "pedestrian_zone";
        if (condition.road === "narrow") return "narrow_inaccessible_street";
        if (condition.parking === "difficult") return "difficult_parking";
        if (condition.parking === "limited") return "limited_parking";
        if (condition.traffic === "complex") return "complex_traffic";
      }

      // Building
      if (type === "building") {
        if (condition.elevator === "unavailable") return "elevator_unavailable";
        if (condition.elevator === "small") return "elevator_unsuitable_size";
        if (condition.elevator === "forbidden")
          return "elevator_forbidden_moving";
        if (condition.stairs === "difficult") return "difficult_stairs";
        if (condition.corridors === "narrow") return "narrow_corridors";
      }

      // Distance
      if (type === "distance") {
        if (condition.carrying === "long") return "long_carrying_distance";
        if (condition.access === "indirect") return "indirect_exit";
        if (condition.access === "multilevel")
          return "complex_multilevel_access";
      }

      // Security
      if (type === "security") {
        if (condition.access === "strict") return "access_control";
        if (condition.permit === "required") return "administrative_permit";
        if (condition.time === "restricted") return "time_restrictions";
        if (condition.floor === "fragile") return "fragile_floor";
      }

      // Equipment
      if (type === "equipment") {
        if (condition.lift === "required") return "furniture_lift_required";
      }

      // Service - Handling
      if (type === "service") {
        if (condition.handling === "bulky") return "bulky_furniture";
        if (condition.handling === "disassembly")
          return "furniture_disassembly";
        if (condition.handling === "reassembly") return "furniture_reassembly";
        if (condition.handling === "piano") return "transport_piano";

        // Service - Packing
        if (condition.packing === "departure")
          return "professional_packing_departure";
        if (condition.packing === "arrival")
          return "professional_unpacking_arrival";
        if (condition.packing === "supplies") return "packing_supplies";
        if (condition.packing === "artwork") return "artwork_packing";

        // Service - Protection
        if (condition.protection === "fragile") return "fragile_valuable_items";
        if (condition.protection === "heavy") return "heavy_items";
        if (condition.protection === "insurance") return "additional_insurance";
        if (condition.protection === "inventory") return "photo_inventory";

        // Service - Storage
        if (condition.storage === "temporary")
          return "temporary_storage_service";

        // Service - Cleaning
        if (condition.cleaning === "post_move") return "post_move_cleaning";

        // Service - Admin
        if (condition.admin === "management")
          return "administrative_management";

        // Service - Transport
        if (condition.transport === "animals") return "animal_transport";
      }
    }

    return null;
  }
}
