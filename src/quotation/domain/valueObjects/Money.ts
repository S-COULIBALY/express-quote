/**
 * Objet-valeur représentant un montant monétaire
 */
export class Money {
    private readonly amount: number;
    private readonly currency: string;

    constructor(amount: number, currency: string = 'EUR') {
        this.amount = Math.round(amount * 100) / 100; // Arrondi à 2 décimales
        this.currency = currency;
    }

    public getAmount(): number {
        return this.amount;
    }

    public getCurrency(): string {
        return this.currency;
    }

    public toString(): string {
        return `${this.amount.toFixed(2)} ${this.currency}`;
    }

    public add(money: Money): Money {
        this.ensureSameCurrency(money);
        return new Money(this.amount + money.getAmount(), this.currency);
    }

    public subtract(money: Money): Money {
        this.ensureSameCurrency(money);
        return new Money(this.amount - money.getAmount(), this.currency);
    }

    public multiply(factor: number): Money {
        return new Money(this.amount * factor, this.currency);
    }

    public divide(divisor: number): Money {
        if (divisor === 0) {
            throw new Error('Cannot divide by zero');
        }
        return new Money(this.amount / divisor, this.currency);
    }

    public equals(money: Money): boolean {
        if (this.currency !== money.getCurrency()) {
            return false;
        }
        return this.amount === money.getAmount();
    }

    public isGreaterThan(money: Money): boolean {
        this.ensureSameCurrency(money);
        return this.amount > money.getAmount();
    }

    public isLessThan(money: Money): boolean {
        this.ensureSameCurrency(money);
        return this.amount < money.getAmount();
    }

    private ensureSameCurrency(money: Money): void {
        if (this.currency !== money.getCurrency()) {
            throw new Error(`Cannot operate on amounts with different currencies: ${this.currency} and ${money.getCurrency()}`);
        }
    }
} 