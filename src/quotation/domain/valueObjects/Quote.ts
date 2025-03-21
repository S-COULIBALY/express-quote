import { Money } from './Money';
import { QuoteContext } from './QuoteContext';
import { Discount } from './Discount';

export class Quote {
  private readonly calculatedAt: Date;

  constructor(
    private readonly basePrice: Money,
    private readonly totalPrice: Money,
    private readonly discounts: Discount[],
    private readonly context: QuoteContext
  ) {
    this.calculatedAt = new Date();
  }

  getBasePrice(): Money { return this.basePrice; }
  getTotalPrice(): Money { return this.totalPrice; }
  getDiscounts(): Discount[] { return [...this.discounts]; }
  getContext(): QuoteContext { return this.context; }
  getCalculationDate(): Date { return new Date(this.calculatedAt); }

  getTotalDiscount(): Money {
    return Discount.combine(this.discounts);
  }

  hasDiscounts(): boolean {
    return this.discounts.length > 0;
  }

  toJSON() {
    return {
      basePrice: this.basePrice.toString(),
      totalPrice: this.totalPrice.toString(),
      discounts: this.discounts.map(d => ({
        type: d.getType(),
        amount: d.getAmount().toString(),
        description: d.getDescription()
      })),
      calculatedAt: this.calculatedAt.toISOString()
    };
  }
} 