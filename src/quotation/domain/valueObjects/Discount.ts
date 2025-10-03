import { Entity, UniqueId } from '../entities/Entity';
import { Money } from './Money';

export enum DiscountType {
    FIXED = 'FIXED',
    PERCENTAGE = 'PERCENTAGE',
    LOYALTY = 'LOYALTY',
    PROMOTIONAL = 'PROMOTIONAL'
}

export class Discount extends Entity {
    constructor(
        private readonly name: string,
        private readonly type: DiscountType,
        private readonly value: number,
        private readonly code?: string,
        private readonly expirationDate?: Date,
        private readonly isReductionFlag: boolean = true,
        id?: UniqueId
    ) {
        super(id);
        this.validate();
    }

    public static combine(discounts: Discount[]): Money {
        if (!discounts || discounts.length === 0) {
            return new Money(0);
        }

        return discounts.reduce((total, discount) => {
            if (discount.isExpired()) {
                return total;
            }
            return total.add(discount.getAmount());
        }, new Money(0));
    }

    private validate(): void {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Discount name is required');
        }
        if (!Object.values(DiscountType).includes(this.type)) {
            throw new Error('Invalid discount type');
        }
        if (typeof this.value !== 'number' || this.value <= 0) {
            throw new Error('Discount value must be a positive number');
        }
        if (this.type === DiscountType.PERCENTAGE && this.value > 100) {
            console.error(`❌ PERCENTAGE DISCOUNT ERROR: name="${this.name}", value=${this.value}%, type=${this.type}`);
            console.error(`❌ Validation failed: percentage value ${this.value}% exceeds 100%`);
            throw new Error(`Percentage discount cannot exceed 100% (rule: "${this.name}", value: ${this.value}%)`);
        }
        if (this.expirationDate && this.expirationDate < new Date()) {
            throw new Error('Expiration date cannot be in the past');
        }
    }

    public apply(price: Money): Money {
        if (this.isExpired()) {
            return price;
        }

        switch (this.type) {
            case DiscountType.FIXED:
                return price.subtract(new Money(this.value, price.getCurrency()));
            case DiscountType.PERCENTAGE:
                const factor = 1 - (this.value / 100);
                return price.multiply(factor);
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

    public getType(): DiscountType {
        return this.type;
    }

    public getValue(): number {
        return this.value;
    }

    public getAmount(): Money {
        return new Money(this.value);
    }

    public getDescription(): string {
        const typeStr = this.type === DiscountType.PERCENTAGE ? '%' : '€';
        const sign = this.isReductionFlag ? '-' : '+';
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