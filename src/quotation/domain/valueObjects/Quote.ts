import { Money } from './Money';
import { ServiceType } from '../enums/ServiceType';

/**
 * Représente un discount ou ajustement appliqué
 */
export interface AppliedDiscount {
  type: string;
  amount: Money;
  description: string;
}

export class Quote {
  private readonly calculatedAt: Date;

  constructor(
    private readonly basePrice: Money,
    private readonly totalPrice: Money,
    private readonly discounts: AppliedDiscount[],
    private readonly serviceType: ServiceType,
    private readonly details?: { label: string; amount: number }[]
  ) {
    this.calculatedAt = new Date();
  }

  getBasePrice(): Money { return this.basePrice; }
  getTotalPrice(): Money { return this.totalPrice; }
  getDiscounts(): AppliedDiscount[] { return [...this.discounts]; }
  getServiceType(): ServiceType { return this.serviceType; }
  getCalculationDate(): Date { return new Date(this.calculatedAt); }
  getDetails(): { label: string; amount: number }[] { return this.details ? [...this.details] : []; }

  getTotalDiscount(): Money {
    let total = 0;
    for (const discount of this.discounts) {
      total += discount.amount.getAmount();
    }
    return new Money(total, 'EUR');
  }

  hasDiscounts(): boolean {
    return this.discounts.length > 0;
  }

  toJSON() {
    return {
      basePrice: this.basePrice.toString(),
      totalPrice: this.totalPrice.toString(),
      serviceType: this.serviceType,
      discounts: this.discounts.map(d => ({
        type: d.type,
        amount: d.amount.toString(),
        description: d.description
      })),
      details: this.details || [],
      calculatedAt: this.calculatedAt.toISOString()
    };
  }
}
