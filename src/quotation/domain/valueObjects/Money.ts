export class Money {
  constructor(
    private readonly amount: number,
    private readonly currency: string = 'EUR'
  ) {
    this.validate();
  }

  private validate(): void {
    if (typeof this.amount !== 'number') {
      throw new Error('Amount must be a number');
    }
    if (!this.currency || this.currency.length !== 3) {
      throw new Error('Currency must be a 3-letter ISO code');
    }
  }

  static fromCents(cents: number, currency: string = 'EUR'): Money {
    return new Money(cents / 100, currency);
  }

  public getAmount(): number {
    return this.amount;
  }

  public getCurrency(): string {
    return this.currency;
  }

  public add(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new Error('Cannot subtract money with different currencies');
    }
    return new Money(this.amount - other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  public toString(): string {
    return `${this.amount.toFixed(2)} ${this.currency}`;
  }
} 