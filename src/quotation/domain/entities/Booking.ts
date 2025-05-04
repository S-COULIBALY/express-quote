import { Entity, UniqueId } from './Entity';
import { Quote } from './Quote';
import { Customer } from './Customer';
import { Professional } from './Professional';
import { Money } from '../valueObjects/Money';
import { QuoteRequest } from './QuoteRequest';

export enum BookingType {
    MOVING_QUOTE = 'MOVING_QUOTE',
    PACK = 'PACK',
    SERVICE = 'SERVICE'
}

export enum BookingStatus {
    DRAFT = 'DRAFT',
    CONFIRMED = 'CONFIRMED',
    AWAITING_PAYMENT = 'AWAITING_PAYMENT',
    PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
    CANCELED = 'CANCELED',
    COMPLETED = 'COMPLETED'
}

export type ChatMessage = {
    id: string;
    sender: 'customer' | 'professional' | 'system';
    content: string;
    timestamp: Date;
};

export class Booking extends Entity {
    private status: BookingStatus;
    private readonly createdAt: Date;
    private updatedAt: Date;
    private conversation: { messages: ChatMessage[], summary?: string } = { messages: [] };
    private quoteRequestId?: string;
    private scheduledDate?: Date;
    private location?: string;
    private depositAmount?: Money;

    constructor(
        private type: BookingType,
        private customer: Customer,
        private quote: Quote,
        private totalAmount: Money,
        private paymentMethod?: string,
        private professional?: Professional,
        id?: UniqueId
    ) {
        super(id);
        this.status = BookingStatus.DRAFT;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.validate();
    }

    private validate(): void {
        if (!this.type) {
            throw new Error('Booking type is required');
        }
        if (!Object.values(BookingType).includes(this.type)) {
            throw new Error('Invalid booking type');
        }
        if (!this.customer) {
            throw new Error('Customer is required');
        }
        if (!this.quote) {
            throw new Error('Quote is required');
        }
        if (!this.totalAmount || this.totalAmount.getAmount() < 0) {
            throw new Error('Total amount is required and must not be negative');
        }
    }

    /**
     * Crée une réservation à partir d'une demande de devis
     */
    static fromQuoteRequest(
        quoteRequest: QuoteRequest,
        customer: Customer,
        quote: Quote,
        totalAmount: Money,
        paymentMethod?: string,
        professional?: Professional,
        id?: UniqueId
    ): Booking {
        // Mapper le type de QuoteRequest vers BookingType
        let bookingType: BookingType;
        switch (quoteRequest.getType()) {
            case 'MOVING':
                bookingType = BookingType.MOVING_QUOTE;
                break;
            case 'PACK':
                bookingType = BookingType.PACK;
                break;
            case 'SERVICE':
                bookingType = BookingType.SERVICE;
                break;
            default:
                throw new Error(`Type de devis non supporté: ${quoteRequest.getType()}`);
        }

        const booking = new Booking(
            bookingType,
            customer,
            quote,
            totalAmount,
            paymentMethod,
            professional,
            id
        );
        booking.quoteRequestId = quoteRequest.getId();
        return booking;
    }

    public updateStatus(newStatus: BookingStatus): void {
        this.status = newStatus;
        this.updatedAt = new Date();
    }

    public assignProfessional(professional: Professional): void {
        this.professional = professional;
        this.updatedAt = new Date();
    }

    public updatePaymentMethod(paymentMethod: string): void {
        this.paymentMethod = paymentMethod;
        this.updatedAt = new Date();
    }

    public addMessage(sender: 'customer' | 'professional' | 'system', content: string): void {
        this.conversation.messages.push({
            id: Date.now().toString(),
            sender,
            content,
            timestamp: new Date()
        });
        this.updatedAt = new Date();
    }

    public setConversationSummary(summary: string): void {
        this.conversation.summary = summary;
        this.updatedAt = new Date();
    }

    public signQuote(signature: string): void {
        if (this.status !== BookingStatus.DRAFT) {
            throw new Error('Quote can only be signed when in draft status');
        }
        this.status = BookingStatus.CONFIRMED;
        this.updatedAt = new Date();
    }

    public setScheduledDate(date: Date): void {
        this.scheduledDate = date;
        this.updatedAt = new Date();
    }

    public setLocation(location: string): void {
        this.location = location;
        this.updatedAt = new Date();
    }

    public setDepositAmount(amount: Money): void {
        this.depositAmount = amount;
        this.updatedAt = new Date();
    }

    // Getters
    public getType(): BookingType {
        return this.type;
    }

    public getQuote(): Quote {
        return this.quote;
    }

    public getCustomer(): Customer {
        return this.customer;
    }

    public getProfessional(): Professional | undefined {
        return this.professional;
    }

    public getStatus(): BookingStatus {
        return this.status;
    }

    public getTotalAmount(): Money {
        return this.totalAmount;
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    public getUpdatedAt(): Date {
        return new Date(this.updatedAt);
    }

    public getConversation(): { messages: ChatMessage[], summary?: string } {
        return { ...this.conversation, messages: [...this.conversation.messages] };
    }

    public getQuoteRequestId(): string | undefined {
        return this.quoteRequestId;
    }

    public getScheduledDate(): Date | undefined {
        return this.scheduledDate ? new Date(this.scheduledDate) : undefined;
    }

    public getLocation(): string | undefined {
        return this.location;
    }

    public getDepositAmount(): Money | undefined {
        return this.depositAmount;
    }
} 