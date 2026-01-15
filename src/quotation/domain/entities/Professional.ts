import { Entity, UniqueId } from './Entity';
import { ContactInfo } from '../valueObjects/ContactInfo';
import { Quote } from './Quote';
import { Address } from '../valueObjects/Address';

// Interface minimale pour Service (entité non implémentée)
interface Service {
    getId(): UniqueId;
}

export enum ProfessionalType {
    MOVER = 'MOVER',
    PACKER = 'PACKER',
    SERVICE_PROVIDER = 'SERVICE_PROVIDER',
    ADMIN = 'ADMIN',
    OTHER = 'OTHER'
}

export class Professional extends Entity {
    private services: Service[] = [];
    private currentQuotes: Quote[] = [];
    private readonly createdAt: Date;
    private updatedAt: Date;

    constructor(
        private companyName: string,
        private businessType: ProfessionalType,
        private email: string,
        private phone: string,
        private address?: string,
        private city?: string,
        private postalCode?: string,
        private country: string = 'France',
        private website?: string,
        private logoUrl?: string,
        private description?: string,
        private taxIdNumber?: string,
        private insuranceNumber?: string,
        private verified: boolean = false,
        private verifiedAt?: Date,
        private rating?: number,
        private servicedAreas?: Record<string, any>,
        private specialties?: Record<string, any>,
        private availabilities?: Record<string, any>,
        id?: UniqueId
    ) {
        super(id);
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.validate();
    }

    private validate(): void {
        if (!this.companyName || this.companyName.trim().length === 0) {
            throw new Error('Company name is required');
        }
        if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
            throw new Error('Valid email is required');
        }
        if (!this.phone || this.phone.trim().length === 0) {
            throw new Error('Phone number is required');
        }
        if (!Object.values(ProfessionalType).includes(this.businessType)) {
            throw new Error('Invalid professional type');
        }
    }

    public addService(service: Service): void {
        if (!this.services.some(s => s.getId() === service.getId())) {
            this.services.push(service);
            this.updatedAt = new Date();
        }
    }

    public removeService(serviceId: UniqueId): void {
        this.services = this.services.filter(service => service.getId() !== serviceId);
        this.updatedAt = new Date();
    }

    public assignQuote(quote: Quote): void {
        this.currentQuotes.push(quote);
        this.updatedAt = new Date();
    }

    public completeQuote(quoteId: UniqueId): void {
        this.currentQuotes = this.currentQuotes.filter(quote => quote.id !== quoteId);
        this.updatedAt = new Date();
    }

    public updateRating(newRating: number): void {
        if (newRating < 0 || newRating > 5) {
            throw new Error('Rating must be between 0 and 5');
        }
        this.rating = newRating;
        this.updatedAt = new Date();
    }

    public verify(): void {
        this.verified = true;
        this.verifiedAt = new Date();
        this.updatedAt = new Date();
    }

    public updateCompanyInfo(
        companyName?: string,
        website?: string,
        description?: string,
        logoUrl?: string
    ): void {
        if (companyName && companyName.trim().length > 0) {
            this.companyName = companyName;
        }
        if (website !== undefined) this.website = website;
        if (description !== undefined) this.description = description;
        if (logoUrl !== undefined) this.logoUrl = logoUrl;
        this.updatedAt = new Date();
    }

    public updateAddress(
        address?: string,
        city?: string,
        postalCode?: string,
        country?: string
    ): void {
        if (address !== undefined) this.address = address;
        if (city !== undefined) this.city = city;
        if (postalCode !== undefined) this.postalCode = postalCode;
        if (country && country.trim().length > 0) this.country = country;
        this.updatedAt = new Date();
    }

    public updateBusinessDetails(
        taxIdNumber?: string,
        insuranceNumber?: string
    ): void {
        if (taxIdNumber !== undefined) this.taxIdNumber = taxIdNumber;
        if (insuranceNumber !== undefined) this.insuranceNumber = insuranceNumber;
        this.updatedAt = new Date();
    }

    public updateContactInfo(email: string, phone: string): void {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Valid email is required');
        }
        if (!phone || phone.trim().length === 0) {
            throw new Error('Phone number is required');
        }
        this.email = email;
        this.phone = phone;
        this.updatedAt = new Date();
    }

    public updateServicedAreas(areas: Record<string, any>): void {
        this.servicedAreas = areas;
        this.updatedAt = new Date();
    }

    public updateSpecialties(specialties: Record<string, any>): void {
        this.specialties = specialties;
        this.updatedAt = new Date();
    }

    public updateAvailabilities(availabilities: Record<string, any>): void {
        this.availabilities = availabilities;
        this.updatedAt = new Date();
    }

    // Getters
    public getCompanyName(): string {
        return this.companyName;
    }

    public getBusinessType(): ProfessionalType {
        return this.businessType;
    }

    public getEmail(): string {
        return this.email;
    }

    public getPhone(): string {
        return this.phone;
    }

    public getAddress(): string | undefined {
        return this.address;
    }

    public getCity(): string | undefined {
        return this.city;
    }

    public getCountry(): string {
        return this.country;
    }

    public getWebsite(): string | undefined {
        return this.website;
    }

    public getDescription(): string | undefined {
        return this.description;
    }

    public isVerified(): boolean {
        return this.verified;
    }

    public getVerifiedAt(): Date | undefined {
        return this.verifiedAt ? new Date(this.verifiedAt) : undefined;
    }

    public getRating(): number | undefined {
        return this.rating;
    }

    public getServices(): Service[] {
        return [...this.services];
    }

    public getCurrentQuotes(): Quote[] {
        return [...this.currentQuotes];
    }

    public getCreatedAt(): Date {
        return new Date(this.createdAt);
    }

    public getUpdatedAt(): Date {
        return new Date(this.updatedAt);
    }

    public getServicedAreas(): Record<string, any> | undefined {
        return this.servicedAreas ? { ...this.servicedAreas } : undefined;
    }

    public getSpecialties(): Record<string, any> | undefined {
        return this.specialties ? { ...this.specialties } : undefined;
    }

    public getAvailabilities(): Record<string, any> | undefined {
        return this.availabilities ? { ...this.availabilities } : undefined;
    }
} 