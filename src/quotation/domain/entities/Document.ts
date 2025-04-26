import { Entity, UniqueId } from './Entity';
import { Booking } from './Booking';

export enum DocumentType {
    BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
    INVOICE = 'INVOICE',
    CONTRACT = 'CONTRACT',
    OTHER = 'OTHER'
}

export class Document extends Entity {
    private readonly createdAt: Date;

    constructor(
        private booking: Booking,
        private type: DocumentType,
        private filename: string,
        private content: Buffer,
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
        if (!Object.values(DocumentType).includes(this.type)) {
            throw new Error('Invalid document type');
        }
        if (!this.filename || this.filename.trim().length === 0) {
            throw new Error('Filename is required');
        }
        if (!this.content || this.content.length === 0) {
            throw new Error('Content is required');
        }
    }

    public updateContent(content: Buffer): void {
        if (!content || content.length === 0) {
            throw new Error('Content cannot be empty');
        }
        this.content = content;
    }

    public updateFilename(filename: string): void {
        if (!filename || filename.trim().length === 0) {
            throw new Error('Filename cannot be empty');
        }
        this.filename = filename;
    }

    // Getters
    public getBooking(): Booking {
        return this.booking;
    }

    public getType(): DocumentType {
        return this.type;
    }

    public getFilename(): string {
        return this.filename;
    }

    public getContent(): Buffer {
        return Buffer.from(this.content);
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }
} 