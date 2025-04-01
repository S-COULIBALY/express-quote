import { Entity, UniqueId } from './Entity';

export enum QuoteRequestType {
    MOVING = 'MOVING',
    PACK = 'PACK',
    SERVICE = 'SERVICE'
}

export enum QuoteRequestStatus {
    TEMPORARY = 'TEMPORARY',
    CONFIRMED = 'CONFIRMED',
    CONVERTED = 'CONVERTED',
    EXPIRED = 'EXPIRED'
}

export class QuoteRequest extends Entity {
    private status: QuoteRequestStatus;
    private readonly createdAt: Date;
    private updatedAt: Date;
    private expiresAt: Date;
    private temporaryId: string;

    constructor(
        private type: QuoteRequestType,
        private quoteData: Record<string, any>,
        id?: UniqueId
    ) {
        super(id);
        this.status = QuoteRequestStatus.TEMPORARY;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours
        this.temporaryId = this.generateTemporaryId();
    }

    private generateTemporaryId(): string {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    public getType(): QuoteRequestType {
        return this.type;
    }

    public getStatus(): QuoteRequestStatus {
        return this.status;
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    public getUpdatedAt(): Date {
        return new Date(this.updatedAt);
    }

    public getExpiresAt(): Date {
        return new Date(this.expiresAt);
    }

    public getTemporaryId(): string {
        return this.temporaryId;
    }

    public getQuoteData(): Record<string, any> {
        return { ...this.quoteData };
    }

    public updateStatus(status: QuoteRequestStatus): void {
        this.status = status;
        this.updatedAt = new Date();
    }

    public extend(days: number): void {
        this.expiresAt = new Date(this.expiresAt.getTime() + days * 24 * 60 * 60 * 1000);
        this.updatedAt = new Date();
    }

    public isExpired(): boolean {
        return new Date() > this.expiresAt;
    }
} 