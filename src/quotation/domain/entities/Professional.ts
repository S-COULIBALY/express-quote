import { Entity, UniqueId } from './Entity';
import { Service } from './Service';
import { ContactInfo } from '../valueObjects/ContactInfo';
import { Quote } from './Quote';

export enum ProfessionalStatus {
    AVAILABLE = 'AVAILABLE',
    BUSY = 'BUSY',
    OFFLINE = 'OFFLINE'
}

export class Professional extends Entity {
    private services: Service[] = [];
    private currentQuotes: Quote[] = [];
    private status: ProfessionalStatus = ProfessionalStatus.AVAILABLE;
    private rating: number = 5.0; // Default rating

    constructor(
        private contactInfo: ContactInfo,
        id?: UniqueId
    ) {
        super(id);
    }

    public addService(service: Service): void {
        if (!this.services.some(s => s.getId() === service.getId())) {
            this.services.push(service);
        }
    }

    public removeService(serviceId: UniqueId): void {
        this.services = this.services.filter(service => service.getId() !== serviceId);
    }

    public assignQuote(quote: Quote): void {
        if (this.status !== ProfessionalStatus.AVAILABLE) {
            throw new Error('Professional is not available');
        }
        this.currentQuotes.push(quote);
        this.updateStatus();
    }

    public completeQuote(quoteId: UniqueId): void {
        this.currentQuotes = this.currentQuotes.filter(quote => quote.getId() !== quoteId);
        this.updateStatus();
    }

    private updateStatus(): void {
        this.status = this.currentQuotes.length === 0 
            ? ProfessionalStatus.AVAILABLE 
            : ProfessionalStatus.BUSY;
    }

    public updateRating(newRating: number): void {
        if (newRating < 0 || newRating > 5) {
            throw new Error('Rating must be between 0 and 5');
        }
        this.rating = newRating;
    }

    public setOffline(): void {
        this.status = ProfessionalStatus.OFFLINE;
    }

    public setAvailable(): void {
        if (this.currentQuotes.length === 0) {
            this.status = ProfessionalStatus.AVAILABLE;
        }
    }

    public getContactInfo(): ContactInfo {
        return this.contactInfo;
    }

    public getServices(): Service[] {
        return [...this.services];
    }

    public getCurrentQuotes(): Quote[] {
        return [...this.currentQuotes];
    }

    public getStatus(): ProfessionalStatus {
        return this.status;
    }

    public getRating(): number {
        return this.rating;
    }

    public isAvailableForService(serviceId: UniqueId): boolean {
        return this.status === ProfessionalStatus.AVAILABLE &&
            this.services.some(service => service.getId() === serviceId);
    }
} 