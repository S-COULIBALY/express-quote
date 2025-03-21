import { Entity, UniqueId } from './Entity';
import { Quote } from './Quote';
import { Customer } from './Customer';
import { Professional } from './Professional';

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}

export class Booking extends Entity {
    private status: BookingStatus;
    private readonly createdAt: Date;

    constructor(
        private quote: Quote,
        private customer: Customer,
        private professional: Professional,
        private scheduledDate: Date,
        id?: UniqueId
    ) {
        super(id);
        this.status = BookingStatus.PENDING;
        this.createdAt = new Date();
        this.validate();
    }

    private validate(): void {
        if (!this.quote) {
            throw new Error('Quote is required');
        }
        if (!this.customer) {
            throw new Error('Customer is required');
        }
        if (!this.professional) {
            throw new Error('Professional is required');
        }
        if (!this.scheduledDate) {
            throw new Error('Scheduled date is required');
        }
        if (this.scheduledDate < new Date()) {
            throw new Error('Scheduled date cannot be in the past');
        }
    }

    public confirm(): void {
        if (this.status !== BookingStatus.PENDING) {
            throw new Error('Booking can only be confirmed when pending');
        }
        this.status = BookingStatus.CONFIRMED;
        this.quote.accept();
        this.professional.assignQuote(this.quote);
    }

    public cancel(): void {
        if (this.status !== BookingStatus.PENDING && this.status !== BookingStatus.CONFIRMED) {
            throw new Error('Booking can only be cancelled when pending or confirmed');
        }
        this.status = BookingStatus.CANCELLED;
        if (this.quote.getStatus() === 'ACCEPTED') {
            this.professional.completeQuote(this.quote.getId());
        }
    }

    public complete(): void {
        if (this.status !== BookingStatus.CONFIRMED) {
            throw new Error('Booking can only be completed when confirmed');
        }
        this.status = BookingStatus.COMPLETED;
        this.professional.completeQuote(this.quote.getId());
    }

    public reschedule(newDate: Date): void {
        if (this.status !== BookingStatus.PENDING && this.status !== BookingStatus.CONFIRMED) {
            throw new Error('Booking can only be rescheduled when pending or confirmed');
        }
        if (newDate < new Date()) {
            throw new Error('New scheduled date cannot be in the past');
        }
        this.scheduledDate = newDate;
    }

    public getQuote(): Quote {
        return this.quote;
    }

    public getCustomer(): Customer {
        return this.customer;
    }

    public getProfessional(): Professional {
        return this.professional;
    }

    public getScheduledDate(): Date {
        return new Date(this.scheduledDate);
    }

    public getStatus(): BookingStatus {
        return this.status;
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }
} 