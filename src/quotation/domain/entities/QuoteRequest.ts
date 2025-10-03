import { Entity, UniqueId } from './Entity';
import { ServiceType } from '../enums/ServiceType';

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
        private type: ServiceType,
        private quoteData: Record<string, any>,
        id?: UniqueId
    ) {
        super(id);
        this.status = QuoteRequestStatus.TEMPORARY;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours (1 mois)
        this.temporaryId = this.generateTemporaryId();
    }

    /**
     * Constructeur alternatif pour reconstruction depuis la base de données
     * Évite les manipulations dangereuses (entity as any)
     */
    static fromDatabase(
        type: ServiceType,
        quoteData: Record<string, any>,
        id: string,
        status: QuoteRequestStatus,
        createdAt: Date,
        updatedAt: Date,
        expiresAt: Date,
        temporaryId: string
    ): QuoteRequest {
        const instance = new QuoteRequest(type, quoteData, id);
        // Surcharger les valeurs par défaut avec celles de la DB
        (instance as any).status = status;
        (instance as any).createdAt = createdAt;
        (instance as any).updatedAt = updatedAt;
        (instance as any).expiresAt = expiresAt;
        (instance as any).temporaryId = temporaryId;
        return instance;
    }

    private generateTemporaryId(): string {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    public getType(): ServiceType {
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

    public updateQuoteData(newData: Record<string, any>): void {
        this.quoteData = { ...this.quoteData, ...newData };
        this.updatedAt = new Date();
    }

    public extend(days: number): void {
        this.expiresAt = new Date(this.expiresAt.getTime() + days * 24 * 60 * 60 * 1000);
        this.updatedAt = new Date();
    }

    public isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    /**
     * Configure une nouvelle durée d'expiration (en heures)
     */
    public setExpirationHours(hours: number): void {
        this.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
        this.updatedAt = new Date();
    }
} 