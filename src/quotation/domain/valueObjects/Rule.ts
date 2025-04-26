import { Money } from './Money';
import { QuoteContext } from './QuoteContext';

/**
 * Résultat de l'application d'une règle
 */
export interface RuleApplyResult {
  success: boolean;
  modified: boolean;
  price: number;
  message?: string;
  isApplied: boolean;
  impact: number;
  newPrice: Money;
  minimumPrice?: number;
}

/**
 * Classe représentant une règle de tarification
 * Une règle peut être un discount (réduction) ou une surcharge (majoration)
 */
export class Rule {
  // Fonction optionnelle qui peut être utilisée à la place de la condition en chaîne
  private applyFunction?: ((context: any) => RuleApplyResult);
  
  constructor(
    public readonly name: string,
    public readonly serviceType: string,
    public readonly value: number,
    public readonly condition: string = '',
    public readonly isActive: boolean = true,
    public readonly id?: string
  ) {}

  /**
   * Détermine si une règle est applicable en fonction du contexte
   * @param context Contexte contenant les données pour évaluer la condition
   */
  isApplicable(context: any): boolean {
    // Si on a une fonction d'application personnalisée, l'utiliser
    if (typeof this.applyFunction === 'function') {
      const result = this.applyFunction(context);
      return result.success && result.modified;
    }

    // Si aucune condition n'est spécifiée, la règle est toujours applicable
    if (!this.condition || this.condition.trim() === '') {
      return true;
    }

    try {
      // Extraire la date programmée du contexte
      let scheduledDate: Date | null = null;
      
      if (context.scheduledDate) {
        scheduledDate = new Date(context.scheduledDate);
      } else if (context.date) {
        scheduledDate = new Date(context.date);
      } else if (context.booking?.date) {
        scheduledDate = new Date(context.booking.date);
      }
      
      // Extraire le prix par défaut du contexte
      let defaultPrice = 0;
      if (context.defaultPrice) {
        defaultPrice = typeof context.defaultPrice === 'object' && context.defaultPrice.getAmount 
          ? context.defaultPrice.getAmount() 
          : parseFloat(context.defaultPrice);
      }
      
      const now = new Date();
      
      // Créer un contexte enrichi pour l'évaluation
      const evalContext = {
        ...context,
        // Ajouter la valeur de la règle au contexte
        value: this.value,
        // Variables temporelles
        date: scheduledDate,
        now: now,
        day: scheduledDate ? scheduledDate.getDay() : now.getDay(),
        hour: scheduledDate ? scheduledDate.getHours() : now.getHours(),
        diffDays: scheduledDate ? Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        diffHours: scheduledDate ? Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60)) : 0,
        // Prix
        price: context.price || defaultPrice || 0,
        duration: context.duration || 1,
        // Informations client
        isReturningCustomer: context.isReturningCustomer || false
      };
      
      // Évaluer la condition
      const evalFunction = new Function(...Object.keys(evalContext), `return (${this.condition});`);
      return evalFunction(...Object.values(evalContext));
    } catch (error) {
      console.error(`Error evaluating rule condition: ${this.condition}`, error);
      return false;
    }
  }

  /**
   * Applique la règle au prix en fonction de sa valeur
   * @param price Prix actuel
   * @param context Contexte de la demande (optionnel)
   * @returns Résultat de l'application de la règle
   */
  apply(price: Money, context?: any): RuleApplyResult {
    if (!this.isActive) {
      return {
        success: false,
        modified: false,
        message: "Rule is inactive",
        price: price.getAmount(),
        isApplied: false,
        impact: 0,
        newPrice: new Money(price.getAmount())
      };
    }
    
    const priceAmount = price.getAmount();
    let newPrice = priceAmount;
    
    if (this.isPercentage()) {
      // Si la valeur est un pourcentage
      newPrice = Math.round(priceAmount * (1 + this.value));
    } else {
      // Si la valeur est un montant fixe
      newPrice = Math.round(priceAmount + this.value);
    }
    
    const impact = newPrice - priceAmount;
    
    return {
      success: true,
      modified: impact !== 0,
      price: newPrice,
      isApplied: impact !== 0,
      impact: impact,
      newPrice: new Money(newPrice)
    };
  }

  /**
   * Détermine si la valeur de la règle est un pourcentage
   */
  isPercentage(): boolean {
    return this.value > -1 && this.value < 1;
  }

  /**
   * Détermine si c'est une remise ou une majoration
   */
  isDiscount(): boolean {
    return this.value < 0;
  }
  
  /**
   * Compare deux règles pour vérifier si elles sont identiques
   * @param other Autre règle à comparer
   * @returns True si les règles sont identiques
   */
  equals(other: Rule): boolean {
    if (!other) return false;
    
    return (
      this.id === other.id &&
      this.name === other.name &&
      this.serviceType === other.serviceType &&
      this.value === other.value &&
      this.condition === other.condition &&
      this.isActive === other.isActive
    );
  }
}