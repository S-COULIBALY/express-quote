import { Entity, UniqueId } from './Entity';
import { Booking } from './Booking';
import { Customer } from './Customer';
import { Document } from '@/documents/domain/entities/Document';

export enum EmailStatus {
    QUEUED = 'QUEUED',
    SENT = 'SENT',
    FAILED = 'FAILED'
}

export interface EmailAttachment {
    id: string;
    filename: string;
    contentType: string;
    document?: Document;
    content?: Buffer;
}

export class EmailLog extends Entity {
    private readonly createdAt: Date;
    private attachments: EmailAttachment[] = [];

    constructor(
        private booking: Booking,
        private customer: Customer,
        private subject: string,
        private text: string,
        private html?: string,
        private status: EmailStatus = EmailStatus.QUEUED,
        private errorMessage?: string,
        private sentAt?: Date,
        id?: UniqueId
    ) {
        super(id);
        this.createdAt = new Date();
        this.validate();
    }

    private validate(): void {
        if (!this.booking) {
            throw new Error('Booking is required');
        }
        if (!this.customer) {
            throw new Error('Customer is required');
        }
        if (!this.subject || this.subject.trim().length === 0) {
            throw new Error('Subject is required');
        }
        if (!this.text || this.text.trim().length === 0) {
            throw new Error('Text content is required');
        }
        if (!Object.values(EmailStatus).includes(this.status)) {
            throw new Error('Invalid email status');
        }
    }

    public markAsSent(): void {
        this.status = EmailStatus.SENT;
        this.sentAt = new Date();
    }

    public markAsFailed(errorMessage: string): void {
        this.status = EmailStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    public addAttachment(attachment: EmailAttachment): void {
        this.attachments.push(attachment);
    }

    public removeAttachment(attachmentId: string): void {
        this.attachments = this.attachments.filter(att => att.id !== attachmentId);
    }

    public updateContent(subject?: string, text?: string, html?: string): void {
        if (subject && subject.trim().length > 0) {
            this.subject = subject;
        }
        if (text && text.trim().length > 0) {
            this.text = text;
        }
        this.html = html;
    }

    // Getters
    public getBooking(): Booking {
        return this.booking;
    }

    public getCustomer(): Customer {
        return this.customer;
    }

    public getSubject(): string {
        return this.subject;
    }

    public getText(): string {
        return this.text;
    }

    public getHtml(): string | undefined {
        return this.html;
    }

    public getStatus(): EmailStatus {
        return this.status;
    }

    public getErrorMessage(): string | undefined {
        return this.errorMessage;
    }

    public getSentAt(): Date | undefined {
        return this.sentAt ? new Date(this.sentAt) : undefined;
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    public getAttachments(): EmailAttachment[] {
        return [...this.attachments];
    }
} 