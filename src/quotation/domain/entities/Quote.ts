import { Entity, UniqueId } from './Entity';
import { Money } from '../valueObjects/Money';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Discount } from '../valueObjects/Discount';

export enum QuoteStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    EXPIRED = 'EXPIRED'
}

export class Quote extends Entity {
    private readonly calculatedAt: Date;
    private status: QuoteStatus;

    constructor(
        private readonly basePrice: Money,
        private readonly totalPrice: Money,
        private readonly discounts: Discount[],
        private readonly context: QuoteContext,
        id?: UniqueId
    ) {
        super(id);
        this.calculatedAt = new Date();
        this.status = QuoteStatus.PENDING;
        this.validate();
    }

    private validate(): void {
        if (this.basePrice.getAmount() < 0) {
            throw new Error('Base price cannot be negative');
        }
        if (this.totalPrice.getAmount() < 0) {
            throw new Error('Total price cannot be negative');
        }
        if (!this.context) {
            throw new Error('Context is required');
        }
    }

    public accept(): void {
        if (this.status !== QuoteStatus.PENDING) {
            throw new Error('Quote can only be accepted when pending');
        }
        this.status = QuoteStatus.ACCEPTED;
    }

    public reject(): void {
        if (this.status !== QuoteStatus.PENDING) {
            throw new Error('Quote can only be rejected when pending');
        }
        this.status = QuoteStatus.REJECTED;
    }

    public expire(): void {
        if (this.status !== QuoteStatus.PENDING) {
            throw new Error('Quote can only expire when pending');
        }
        this.status = QuoteStatus.EXPIRED;
    }

    public getBasePrice(): Money {
        return this.basePrice;
    }

    public getTotalPrice(): Money {
        return this.totalPrice;
    }

    public getDiscounts(): Discount[] {
        return [...this.discounts];
    }

    public getContext(): QuoteContext {
        return this.context;
    }

    public getCalculatedAt(): Date {
        return new Date(this.calculatedAt);
    }

    public getStatus(): QuoteStatus {
        return this.status;
    }

    public isValid(): boolean {
        const validityPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        return (
            this.status === QuoteStatus.PENDING &&
            Date.now() - this.calculatedAt.getTime() < validityPeriod
        );
    }
} 