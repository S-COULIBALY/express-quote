import { Entity, UniqueId } from './Entity';
import { Quote } from './Quote';
import { Money } from '../valueObjects/Money';

export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
    CREDIT_CARD = 'CREDIT_CARD',
    BANK_TRANSFER = 'BANK_TRANSFER',
    PAYPAL = 'PAYPAL'
}

export class Payment extends Entity {
    private status: PaymentStatus;
    private readonly transactionDate: Date;
    private processingDetails: string | null = null;

    constructor(
        private quote: Quote,
        private amount: Money,
        private method: PaymentMethod,
        id?: UniqueId
    ) {
        super(id);
        this.status = PaymentStatus.PENDING;
        this.transactionDate = new Date();
        this.validate();
    }

    private validate(): void {
        if (!this.quote) {
            throw new Error('Quote is required');
        }
        if (!this.amount) {
            throw new Error('Amount is required');
        }
        if (this.amount.getAmount() <= 0) {
            throw new Error('Amount must be greater than 0');
        }
        if (!Object.values(PaymentMethod).includes(this.method)) {
            throw new Error('Invalid payment method');
        }
    }

    public process(): void {
        if (this.status !== PaymentStatus.PENDING) {
            throw new Error('Payment can only be processed when pending');
        }
        this.status = PaymentStatus.PROCESSING;
    }

    public complete(processingDetails?: string): void {
        if (this.status !== PaymentStatus.PROCESSING) {
            throw new Error('Payment can only be completed when processing');
        }
        this.status = PaymentStatus.COMPLETED;
        this.processingDetails = processingDetails || null;
    }

    public fail(reason: string): void {
        if (this.status !== PaymentStatus.PROCESSING) {
            throw new Error('Payment can only fail when processing');
        }
        this.status = PaymentStatus.FAILED;
        this.processingDetails = reason;
    }

    public refund(reason: string): void {
        if (this.status !== PaymentStatus.COMPLETED) {
            throw new Error('Only completed payments can be refunded');
        }
        this.status = PaymentStatus.REFUNDED;
        this.processingDetails = reason;
    }

    public getQuote(): Quote {
        return this.quote;
    }

    public getAmount(): Money {
        return this.amount;
    }

    public getMethod(): PaymentMethod {
        return this.method;
    }

    public getStatus(): PaymentStatus {
        return this.status;
    }

    public getTransactionDate(): Date {
        return new Date(this.transactionDate);
    }

    public getProcessingDetails(): string | null {
        return this.processingDetails;
    }
} 