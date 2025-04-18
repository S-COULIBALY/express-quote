import { Money } from './Money';
import { QuoteContext } from './QuoteContext';

/**
 * Représente une règle de calcul pour un devis
 */
export class Rule {
  constructor(
    public readonly name: string,
    public readonly serviceType: string,
    public readonly value: number,
    private readonly condition?: string | ((context: QuoteContext) => boolean),
    public readonly isActive: boolean = true,
    public readonly id?: string
  ) {}

  /**
   * Vérifie si deux règles sont égales
   */
  public equals(other: Rule): boolean {
    return this.id === other.id || (this.name === other.name && this.serviceType === other.serviceType);
  }

  /**
   * Vérifie si la règle s'applique au contexte donné
   */
  public isApplicable(context: QuoteContext): boolean {
    if (!this.isActive) return false;

    if (!this.condition) return true;

    if (typeof this.condition === 'function') {
      return this.condition(context);
    }

    try {
      // Si la condition est une chaîne, tenter de l'évaluer comme une expression
      // Note: ce n'est pas sécurisé et devrait être remplacé par une solution plus robuste
      const conditionFn = new Function('context', `return ${this.condition}`);
      return conditionFn(context);
    } catch (error) {
      console.error(`Error evaluating rule condition: ${this.condition}`, error);
      return false;
    }
  }

  /**
   * Applique la règle au prix donné
   */
  public apply(basePrice: Money, context: QuoteContext): { isApplied: boolean; newPrice: Money; impact: number } {
    if (!this.isApplicable(context)) {
      return { isApplied: false, newPrice: basePrice, impact: 0 };
    }

    let newPrice: Money;
    let impact: number = 0;

    if (this.isPercentage()) {
      // Si c'est un pourcentage, calculer l'impact proportionnel au prix de base
      impact = Math.round(basePrice.getAmount() * (this.value / 100));
      newPrice = basePrice.add(new Money(impact));
    } else {
      // Si c'est un montant fixe, l'appliquer directement
      impact = this.value;
      newPrice = basePrice.add(new Money(impact));
    }

    return { isApplied: true, newPrice, impact };
  }

  /**
   * Vérifie si la règle est un pourcentage
   */
  public isPercentage(): boolean {
    // On considère qu'une règle est un pourcentage si sa valeur est entre -100 et 100
    return this.value >= -100 && this.value <= 100;
  }

  get percentage(): number | undefined {
    return this.isPercentage() ? this.value : undefined;
  }

  get amount(): number | undefined {
    return this.isPercentage() ? undefined : this.value;
  }
}