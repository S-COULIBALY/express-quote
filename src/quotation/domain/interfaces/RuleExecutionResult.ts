/**
 * ============================================================================
 * INTERFACES - RÉSULTAT D'EXÉCUTION DES RÈGLES
 * ============================================================================
 *
 * Interface détaillée et explicite pour le résultat de l'exécution des règles
 */

import { Money } from "../valueObjects/Money";
import { AppliedRule } from "../valueObjects/AppliedRule";

/**
 * Type de règle appliquée
 */
export enum AppliedRuleType {
  /** Réduction (diminue le prix) */
  REDUCTION = "REDUCTION",
  /** Contrainte logistique */
  CONSTRAINT = "CONSTRAINT",
  /** Service supplémentaire */
  ADDITIONAL_SERVICE = "ADDITIONAL_SERVICE",
  /** Règle temporelle (week-end, heures de pointe) */
  TEMPORAL = "TEMPORAL",
  /** Équipement spécial (monte-meuble, etc.) */
  EQUIPMENT = "EQUIPMENT",
}

/**
 * Règle appliquée avec détails complets
 */
export interface AppliedRuleDetail {
  /** Identifiant unique de la règle */
  id: string;
  /** Nom de la règle */
  name: string;
  /** Type de règle */
  type: AppliedRuleType;
  /** Valeur (montant ou pourcentage) */
  value: number;
  /** Est-ce un pourcentage ? */
  isPercentage: boolean;
  /** Impact en euros */
  impact: Money;
  /** Description lisible */
  description: string;
  /** Adresse concernée (pickup, delivery, both) */
  address?: "pickup" | "delivery" | "both";
  /** Est consommée par une autre règle ? */
  isConsumed?: boolean;
  /** Contrainte consommée par quelle règle ? */
  consumedBy?: string;
}

/**
 * Coûts détaillés par adresse (pickup, delivery, global)
 * Chaque adresse dispose de sa propre ventilation complète
 */
export interface AddressCosts {
  // ═══════════════════════════════════════════════════════════════════════
  // SURCHARGES (contraintes logistiques + services supplémentaires)
  // ═══════════════════════════════════════════════════════════════════════

  /** Surcharges - Contraintes logistiques appliquées */
  constraints: AppliedRuleDetail[];

  /** Surcharges - Services supplémentaires appliqués */
  additionalServices: AppliedRuleDetail[];

  /** Sous-total des surcharges (constraints + additionalServices) */
  totalSurcharges: Money;

  // ═══════════════════════════════════════════════════════════════════════
  // ÉQUIPEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  /** Équipements spéciaux appliqués (monte-meuble, diable, etc.) */
  equipment: AppliedRuleDetail[];

  /** Sous-total des équipements */
  totalEquipment: Money;

  // ═══════════════════════════════════════════════════════════════════════
  // RÉDUCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  /** Réductions appliquées localement à cette adresse */
  reductions: AppliedRuleDetail[];

  /** Sous-total des réductions */
  totalReductions: Money;

  // ═══════════════════════════════════════════════════════════════════════
  // MONTE-MEUBLE (détection spécifique par adresse)
  // ═══════════════════════════════════════════════════════════════════════

  /** Monte-meuble requis pour cette adresse ? */
  furnitureLiftRequired: boolean;

  /** Raison de la détection du monte-meuble */
  furnitureLiftReason?: string;

  // ═══════════════════════════════════════════════════════════════════════
  // CONTRAINTES CONSOMMÉES (par adresse)
  // ═══════════════════════════════════════════════════════════════════════

  /** Contraintes absorbées par un équipement (ex: monte-meuble consomme escaliers) */
  consumedConstraints: string[];

  /** Raison de la consommation */
  consumptionReason?: string;

  // ═══════════════════════════════════════════════════════════════════════
  // TOTAL FINAL PAR ADRESSE
  // ═══════════════════════════════════════════════════════════════════════

  /** Total net pour cette adresse (surcharges + équipements - réductions) */
  total: Money;
}

/**
 * Résultat détaillé de l'exécution des règles
 */
export interface RuleExecutionResult {
  // ═══════════════════════════════════════════════════════════════════════
  // PRIX
  // ═══════════════════════════════════════════════════════════════════════

  /** Prix de base initial */
  basePrice: Money;

  /** Prix final après application de toutes les règles */
  finalPrice: Money;

  /** Montant total des réductions */
  totalReductions: Money;

  /** Montant total des surcharges (legacy - équivalent à totalConstraints + totalAdditionalServices) */
  totalSurcharges: Money;

  /** Montant total des contraintes logistiques */
  totalConstraints: Money;

  /** Montant total des services supplémentaires */
  totalAdditionalServices: Money;

  // ═══════════════════════════════════════════════════════════════════════
  // RÈGLES APPLIQUÉES (PAR CATÉGORIE)
  // ═══════════════════════════════════════════════════════════════════════

  /** Toutes les règles appliquées */
  appliedRules: AppliedRuleDetail[];

  /** Réductions appliquées */
  reductions: AppliedRuleDetail[];

  /** Contraintes logistiques appliquées */
  constraints: AppliedRuleDetail[];

  /** Services supplémentaires appliqués */
  additionalServices: AppliedRuleDetail[];

  /** Équipements spéciaux appliqués (monte-meuble, etc.) */
  equipment: AppliedRuleDetail[];

  /** Règles temporelles appliquées (week-end, heures de pointe) */
  temporalRules: AppliedRuleDetail[];

  // ═══════════════════════════════════════════════════════════════════════
  // COÛTS PAR ADRESSE
  // ═══════════════════════════════════════════════════════════════════════

  /** Coûts détaillés pour l'adresse de départ (pickup) */
  pickupCosts: AddressCosts;

  /** Coûts détaillés pour l'adresse d'arrivée (delivery) */
  deliveryCosts: AddressCosts;

  /** Coûts globaux (non liés à une adresse spécifique) */
  globalCosts: AddressCosts;

  // ═══════════════════════════════════════════════════════════════════════
  // CONTRAINTES CONSOMMÉES (avec traçabilité déclaré/inféré)
  // ═══════════════════════════════════════════════════════════════════════

  /** Liste des contraintes consommées (non facturées séparément) */
  consumedConstraints: string[];

  /** Raison de la consommation (ex: "consommées par Monte-meuble") */
  consumptionReason?: string;

  /** ✅ NOUVEAU: Contraintes déclarées par le client */
  declaredConstraints?: string[];

  /** ✅ NOUVEAU: Contraintes inférées automatiquement */
  inferredConstraints?: string[];

  /** ✅ NOUVEAU: Métadonnées d'inférence pour audit */
  inferenceMetadata?: {
    pickup?: {
      reason: string;
      inferredAt: Date;
      allowInference: boolean;
    };
    delivery?: {
      reason: string;
      inferredAt: Date;
      allowInference: boolean;
    };
  };

  // ═══════════════════════════════════════════════════════════════════════
  // MÉTADONNÉES
  // ═══════════════════════════════════════════════════════════════════════

  /** Nombre total de règles évaluées */
  totalRulesEvaluated: number;

  /** Nombre de règles applicables */
  totalRulesApplied: number;

  /** Monte-meuble requis ? */
  furnitureLiftRequired: boolean;

  /** Raison du monte-meuble */
  furnitureLiftReason?: string;

  /** Prix minimum appliqué ? */
  minimumPriceApplied: boolean;

  /** Montant du prix minimum si appliqué */
  minimumPriceAmount?: Money;
}

/**
 * Builder pour construire progressivement un RuleExecutionResult
 */
export class RuleExecutionResultBuilder {
  private result: Partial<RuleExecutionResult>;

  constructor(basePrice: Money) {
    this.result = {
      basePrice,
      finalPrice: basePrice,
      totalReductions: new Money(0),
      totalSurcharges: new Money(0),
      totalConstraints: new Money(0),
      totalAdditionalServices: new Money(0),
      appliedRules: [],
      reductions: [],
      constraints: [],
      additionalServices: [],
      equipment: [],
      temporalRules: [],
      pickupCosts: this.createEmptyAddressCosts(),
      deliveryCosts: this.createEmptyAddressCosts(),
      globalCosts: this.createEmptyAddressCosts(),
      consumedConstraints: [],
      totalRulesEvaluated: 0,
      totalRulesApplied: 0,
      furnitureLiftRequired: false,
      minimumPriceApplied: false,
    };
  }

  private createEmptyAddressCosts(): AddressCosts {
    return {
      // Surcharges
      constraints: [],
      additionalServices: [],
      totalSurcharges: new Money(0),

      // Équipements
      equipment: [],
      totalEquipment: new Money(0),

      // Réductions
      reductions: [],
      totalReductions: new Money(0),

      // Monte-meuble
      furnitureLiftRequired: false,
      furnitureLiftReason: undefined,

      // Contraintes consommées
      consumedConstraints: [],
      consumptionReason: undefined,

      // Total final
      total: new Money(0),
    };
  }

  setFinalPrice(price: Money): this {
    this.result.finalPrice = price;
    return this;
  }

  addAppliedRule(rule: AppliedRuleDetail): this {
    this.result.appliedRules!.push(rule);
    this.result.totalRulesApplied!++;

    // Catégoriser selon le type
    switch (rule.type) {
      case AppliedRuleType.REDUCTION:
        this.result.reductions!.push(rule);
        this.result.totalReductions = this.result.totalReductions!.add(
          rule.impact,
        );
        // Ajouter aux réductions par adresse
        this.addReductionToAddress(rule);
        break;
      case AppliedRuleType.CONSTRAINT:
        this.result.constraints!.push(rule);
        this.result.totalConstraints = this.result.totalConstraints!.add(rule.impact);
        this.result.totalSurcharges = this.result.totalSurcharges!.add(rule.impact); // Legacy
        this.addToAddressCosts(rule, "constraints");
        break;
      case AppliedRuleType.ADDITIONAL_SERVICE:
        this.result.additionalServices!.push(rule);
        this.result.totalAdditionalServices = this.result.totalAdditionalServices!.add(rule.impact);
        this.result.totalSurcharges = this.result.totalSurcharges!.add(rule.impact); // Legacy
        this.addToAddressCosts(rule, "additionalServices");
        break;
      case AppliedRuleType.EQUIPMENT:
        this.result.equipment!.push(rule);
        this.addToAddressCosts(rule, "equipment");
        break;
      case AppliedRuleType.TEMPORAL:
        this.result.temporalRules!.push(rule);
        break;
    }

    return this;
  }

  private addToAddressCosts(
    rule: AppliedRuleDetail,
    category: "constraints" | "additionalServices" | "equipment",
  ): void {
    const addressCosts = this.getAddressCosts(rule.address);

    // Ajouter la règle à la catégorie appropriée
    addressCosts[category].push(rule);

    // Mettre à jour les sous-totaux selon la catégorie
    if (category === "constraints" || category === "additionalServices") {
      // Surcharges
      addressCosts.totalSurcharges = addressCosts.totalSurcharges.add(
        rule.impact,
      );
    } else if (category === "equipment") {
      // Équipements
      addressCosts.totalEquipment = addressCosts.totalEquipment.add(
        rule.impact,
      );
    }

    // Mettre à jour le total général de l'adresse
    addressCosts.total = addressCosts.total.add(rule.impact);
  }

  private addReductionToAddress(rule: AppliedRuleDetail): void {
    const addressCosts = this.getAddressCosts(rule.address);

    // Ajouter aux réductions de l'adresse
    addressCosts.reductions.push(rule);

    // Mettre à jour les sous-totaux
    addressCosts.totalReductions = addressCosts.totalReductions.add(
      rule.impact,
    );

    // Soustraire du total (car c'est une réduction)
    addressCosts.total = addressCosts.total.subtract(rule.impact);
  }

  private getAddressCosts(
    address: "pickup" | "delivery" | "both" | undefined,
  ): AddressCosts {
    if (address === "pickup") {
      return this.result.pickupCosts!;
    } else if (address === "delivery") {
      return this.result.deliveryCosts!;
    } else {
      return this.result.globalCosts!;
    }
  }

  setConsumedConstraints(constraints: string[], reason?: string): this {
    this.result.consumedConstraints = constraints;
    this.result.consumptionReason = reason;
    return this;
  }

  setFurnitureLift(required: boolean, reason?: string): this {
    this.result.furnitureLiftRequired = required;
    this.result.furnitureLiftReason = reason;
    return this;
  }

  /**
   * Configure le monte-meuble pour une adresse spécifique
   */
  setAddressFurnitureLift(
    address: "pickup" | "delivery",
    required: boolean,
    reason?: string,
  ): this {
    const addressCosts = this.getAddressCosts(address);
    addressCosts.furnitureLiftRequired = required;
    addressCosts.furnitureLiftReason = reason;
    return this;
  }

  /**
   * Configure les contraintes consommées pour une adresse spécifique
   */
  setAddressConsumedConstraints(
    address: "pickup" | "delivery",
    constraints: string[],
    reason?: string,
  ): this {
    const addressCosts = this.getAddressCosts(address);
    addressCosts.consumedConstraints = constraints;
    addressCosts.consumptionReason = reason;
    return this;
  }

  setMinimumPrice(applied: boolean, amount?: Money): this {
    this.result.minimumPriceApplied = applied;
    this.result.minimumPriceAmount = amount;
    return this;
  }

  setTotalRulesEvaluated(count: number): this {
    this.result.totalRulesEvaluated = count;
    return this;
  }

  build(): RuleExecutionResult {
    return this.result as RuleExecutionResult;
  }
}
