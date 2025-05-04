/**
 * Objet-valeur représentant un montant monétaire
 */
export class Money {
    private readonly amount: number;
    private readonly currency: string;

    constructor(amount: number | string | null | undefined, currency: string = 'EUR') {
        // Convertir et valider le montant
        let numericAmount = 0;
        
        if (amount === null || amount === undefined) {
            console.warn('Money: construction avec un montant null ou undefined, utilisation de 0');
            numericAmount = 0;
        } else if (typeof amount === 'string') {
            const parsed = parseFloat(amount);
            if (isNaN(parsed)) {
                console.warn(`Money: construction avec une chaîne invalide '${amount}', utilisation de 0`);
                numericAmount = 0;
            } else {
                numericAmount = parsed;
            }
        } else if (typeof amount === 'number') {
            if (isNaN(amount)) {
                console.warn('Money: construction avec un nombre NaN, utilisation de 0');
                numericAmount = 0;
            } else {
                numericAmount = amount;
            }
        } else {
            console.warn(`Money: construction avec un type non géré ${typeof amount}, utilisation de 0`);
            numericAmount = 0;
        }
        
        // Arrondir à 2 décimales
        this.amount = Math.round(numericAmount * 100) / 100;
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