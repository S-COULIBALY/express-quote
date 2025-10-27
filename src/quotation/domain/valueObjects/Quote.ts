import { Money } from './Money';
import { AppliedRule } from './AppliedRule';
import { ServiceType } from '../enums/ServiceType';

export class Quote {
  private readonly calculatedAt: Date;

  constructor(
    private readonly basePrice: Money,
    private readonly totalPrice: Money,
    private readonly discounts: AppliedRule[],
    private readonly serviceType: ServiceType,
    private readonly details?: { label: string; amount: number }[]
  ) {
    this.calculatedAt = new Date();
  }

  getBasePrice(): Money { return this.basePrice; }
  getTotalPrice(): Money { return this.totalPrice; }
  getDiscounts(): AppliedRule[] { return [...this.discounts]; }
  getServiceType(): ServiceType { return this.serviceType; }
  getCalculationDate(): Date { return new Date(this.calculatedAt); }
  getDetails(): { label: string; amount: number }[] { return this.details ? [...this.details] : []; }

  getTotalDiscount(): Money {
    return AppliedRule.combine(this.discounts);
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
        type: d.getType(),
        amount: d.getAmount().toString(),
        description: d.getDescription()
      })),
      details: this.details || [],
      calculatedAt: this.calculatedAt.toISOString()
    };
  }
} 