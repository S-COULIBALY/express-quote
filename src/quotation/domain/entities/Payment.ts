import { Entity, UniqueId } from './Entity';
import { Booking } from './Booking';
import { Money } from '../valueObjects/Money';

export enum TransactionStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED'
}

export class Payment extends Entity {
    private readonly createdAt: Date;
    private updatedAt: Date;

    constructor(
        private booking: Booking,
        private amount: Money,
        private status: TransactionStatus = TransactionStatus.PENDING,
        private paymentMethod?: string,
        private paymentIntentId?: string,
        private stripeSessionId?: string,
        private errorMessage?: string,
        id?: UniqueId
    ) {
        super(id);
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.validate();
    }

    private validate(): void {
        if (!this.booking) {
            throw new Error('Booking is required');
        }
        if (!this.amount || this.amount.getAmount() <= 0) {
            throw new Error('Amount must be positive');
        }
        if (!Object.values(TransactionStatus).includes(this.status)) {
            throw new Error('Invalid transaction status');
        }
    }

    public updateStatus(newStatus: TransactionStatus, errorMessage?: string): void {
        this.status = newStatus;
        if (newStatus === TransactionStatus.FAILED && errorMessage) {
            this.errorMessage = errorMessage;
        }
        this.updatedAt = new Date();
    }

    public setPaymentDetails(
        paymentMethod?: string,
        paymentIntentId?: string,
        stripeSessionId?: string
    ): void {
        if (paymentMethod) this.paymentMethod = paymentMethod;
        if (paymentIntentId) this.paymentIntentId = paymentIntentId;
        if (stripeSessionId) this.stripeSessionId = stripeSessionId;
        this.updatedAt = new Date();
    }

    public complete(): void {
        if (this.status !== TransactionStatus.PENDING) {
            throw new Error('Only pending transactions can be completed');
        }
        this.status = TransactionStatus.COMPLETED;
        this.updatedAt = new Date();
    }

    public fail(errorMessage: string): void {
        if (this.status !== TransactionStatus.PENDING) {
            throw new Error('Only pending transactions can fail');
        }
        this.status = TransactionStatus.FAILED;
        this.errorMessage = errorMessage;
        this.updatedAt = new Date();
    }

    public refund(): void {
        if (this.status !== TransactionStatus.COMPLETED) {
            throw new Error('Only completed transactions can be refunded');
        }
        this.status = TransactionStatus.REFUNDED;
        this.updatedAt = new Date();
    }

    // Getters
    public getBooking(): Booking {
        return this.booking;
    }

    public getAmount(): Money {
        return this.amount;
    }

    public getStatus(): TransactionStatus {
        return this.status;
    }

    public getPaymentMethod(): string | undefined {
        return this.paymentMethod;
    }

    public getPaymentIntentId(): string | undefined {
        return this.paymentIntentId;
    }

    public getStripeSessionId(): string | undefined {
        return this.stripeSessionId;
    }

    public getErrorMessage(): string | undefined {
        return this.errorMessage;
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    public getUpdatedAt(): Date {
        return new Date(this.updatedAt);
    }
} 