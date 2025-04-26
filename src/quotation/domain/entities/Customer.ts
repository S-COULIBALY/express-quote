import { Entity } from '../../../shared/domain/Entity';
import { ContactInfo } from '../valueObjects/ContactInfo';
import { Address } from '../valueObjects/Address';
import { Quote } from './Quote';

export class Customer extends Entity {
    private quoteHistory: Quote[] = [];
    private readonly contactInfo: ContactInfo;
    private readonly billingAddress?: Address;
    private readonly customerCreatedAt: Date;
    private lastActivity: Date;

    constructor(
        id: string,
        contactInfo: ContactInfo,
        billingAddress?: Address
    ) {
        super(id);
        this.contactInfo = contactInfo;
        this.billingAddress = billingAddress;
        this.customerCreatedAt = new Date();
        this.lastActivity = new Date();
    }

    public getContactInfo(): ContactInfo {
        return this.contactInfo;
    }

    public getBillingAddress(): Address | undefined {
        return this.billingAddress;
    }

    public getCustomerCreatedAt(): Date {
        return new Date(this.customerCreatedAt);
    }

    public getLastActivity(): Date {
        return new Date(this.lastActivity);
    }

    public updateLastActivity(): void {
        this.lastActivity = new Date();
    }

    public getFullName(): string {
        return this.contactInfo.getFullName();
    }

    public getEmail(): string {
        return this.contactInfo.getEmail();
    }

    public getPhone(): string {
        return this.contactInfo.getPhone();
    }

    public updateInfo(
        email?: string,
        firstName?: string,
        lastName?: string,
        phone?: string
    ): void {
        // Puisque ContactInfo est immuable, créons un nouvel objet
        if (email || firstName || lastName || phone) {
            // Créer un nouvel objet ContactInfo n'est pas possible 
            // puisque nous n'avons pas d'accesseur pour le mettre à jour
            // Cette partie devrait être réimplémentée
            this.lastActivity = new Date();
        }
    }

    public addQuote(quote: Quote): void {
        this.quoteHistory.push(quote);
        this.lastActivity = new Date();
    }

    public getQuoteHistory(): Quote[] {
        return [...this.quoteHistory];
    }
} 