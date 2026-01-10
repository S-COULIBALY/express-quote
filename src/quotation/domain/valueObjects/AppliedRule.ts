import { Entity, UniqueId } from "../entities/Entity";
import { Money } from "./Money";

/**
 * Type de valeur d'une règle appliquée
 */
export enum RuleValueType {
  /** Montant fixe en euros */
  FIXED = "FIXED",
  /** Pourcentage du prix */
  PERCENTAGE = "PERCENTAGE",
  /** Réduction fidélité */
  LOYALTY = "LOYALTY",
  /** Promotion */
  PROMOTIONAL = "PROMOTIONAL",
}

/**
 * Règle appliquée lors du calcul d'un devis
 * Peut être une réduction, une surcharge, une contrainte, un service, etc.
 */
export class AppliedRule extends Entity {
  constructor(
    private readonly name: string,
    private readonly type: RuleValueType,
    private readonly value: number,
    private readonly code?: string,
    private readonly expirationDate?: Date,
    private readonly isReductionFlag: boolean = true,
    id?: UniqueId,
  ) {
    super(id);
    this.validate();
  }

  /**
   * Combine plusieurs règles appliquées en un montant total
   */
  public static combine(appliedRules: AppliedRule[]): Money {
    if (!appliedRules || appliedRules.length === 0) {
      return new Money(0);
    }

    return appliedRules.reduce((total, rule) => {
      if (rule.isExpired()) {
        return total;
      }
      return total.add(rule.getAmount());
    }, new Money(0));
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Applied rule name is required");
    }
    if (!Object.values(RuleValueType).includes(this.type)) {
      throw new Error("Invalid rule value type");
    }
    if (typeof this.value !== "number" || this.value <= 0) {
      throw new Error("Rule value must be a positive number");
    }
    if (this.type === RuleValueType.PERCENTAGE && this.value > 100) {
      console.error(
        `❌ PERCENTAGE RULE ERROR: name="${this.name}", value=${this.value}%, type=${this.type}`,
      );
      console.error(
        `❌ Validation failed: percentage value ${this.value}% exceeds 100%`,
      );
      throw new Error(
        `Percentage rule cannot exceed 100% (rule: "${this.name}", value: ${this.value}%)`,
      );
    }
    if (this.expirationDate && this.expirationDate < new Date()) {
      throw new Error("Expiration date cannot be in the past");
    }
  }

  /**
   * Applique la règle à un prix
   * Pour les réductions: soustrait
   * Pour les surcharges: ajoute
   */
  public apply(price: Money): Money {
    if (this.isExpired()) {
      return price;
    }

    switch (this.type) {
      case RuleValueType.FIXED:
        if (this.isReductionFlag) {
          return price.subtract(new Money(this.value, price.getCurrency()));
        } else {
          return price.add(new Money(this.value, price.getCurrency()));
        }
      case RuleValueType.PERCENTAGE:
        if (this.isReductionFlag) {
          const factor = 1 - this.value / 100;
          return price.multiply(factor);
        } else {
          const factor = 1 + this.value / 100;
          return price.multiply(factor);
        }
      default:
        return price;
    }
  }

  public isExpired(): boolean {
    return this.expirationDate ? new Date() > this.expirationDate : false;
  }

  public getName(): string {
    return this.name;
  }

  public getType(): RuleValueType {
    return this.type;
  }

  public getValue(): number {
    return this.value;
  }

  public getAmount(): Money {
    return new Money(this.value);
  }

  public getDescription(): string {
    const typeStr = this.type === RuleValueType.PERCENTAGE ? "%" : "€";
    const sign = this.isReductionFlag ? "-" : "+";
    return `${this.name} (${sign}${this.value}${typeStr})`;
  }

  public getCode(): string | undefined {
    return this.code;
  }

  public getExpirationDate(): Date | undefined {
    return this.expirationDate ? new Date(this.expirationDate) : undefined;
  }

  public isReduction(): boolean {
    return this.isReductionFlag;
  }

  public isSurcharge(): boolean {
    return !this.isReductionFlag;
  }
}

// ============================================================================
// ALIAS DE COMPATIBILITÉ (À SUPPRIMER APRÈS MIGRATION COMPLÈTE)
// ============================================================================

/**
 * @deprecated Utiliser AppliedRule à la place
 */
export type Discount = AppliedRule;

/**
 * @deprecated Utiliser RuleValueType à la place
 */
export const DiscountType = RuleValueType;
