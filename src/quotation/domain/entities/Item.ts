import { Entity } from '../../../shared/domain/Entity';
import { Money } from '../valueObjects/Money';

/** Seul DEMENAGEMENT actif (catalogue abandonné 2026-02). */
export enum ItemType {
    DEMENAGEMENT = 'DEMENAGEMENT',
}

export class Item extends Entity {
    private readonly type: ItemType;
    private readonly templateId: string | null;
    private readonly customerId: string | null;
    private readonly bookingId: string | null;
    private readonly parentItemId: string | null;
    private readonly name: string;
    private readonly description: string | null;
    private readonly price: Money;
    private readonly workers: number;
    private readonly duration: number;
    private readonly features: string[];
    private readonly includedDistance: number | null;
    private readonly distanceUnit: string | null;
    private readonly includes: string[];
    private readonly categoryId: string | null;
    private readonly popular: boolean;
    private readonly imagePath: string | null;
    private readonly active: boolean;
    private readonly status: string;
    private readonly updatedAt: Date;

    constructor(
        id: string,
        type: ItemType,
        templateId: string | null = null,
        customerId: string | null = null,
        bookingId: string | null = null,
        parentItemId: string | null = null,
        name: string,
        description: string | null = null,
        price: Money,
        workers: number,
        duration: number,
        features: string[] = [],
        includedDistance: number | null = null,
        distanceUnit: string | null = 'km',
        includes: string[] = [],
        categoryId: string | null = null,
        popular: boolean = false,
        imagePath: string | null = null,
        active: boolean = true,
        status: string = 'ACTIVE',
        updatedAt: Date = new Date()
    ) {
        super(id);
        this.type = type;
        this.templateId = templateId;
        this.customerId = customerId;
        this.bookingId = bookingId;
        this.parentItemId = parentItemId;
        this.name = name;
        this.description = description;
        this.price = price;
        this.workers = workers;
        this.duration = duration;
        this.features = features;
        this.includedDistance = includedDistance;
        this.distanceUnit = distanceUnit;
        this.includes = includes;
        this.categoryId = categoryId;
        this.popular = popular;
        this.imagePath = imagePath;
        this.active = active;
        this.status = status;
        this.updatedAt = updatedAt;
    }

    // Factory methods
    public static createFromTemplate(
        templateId: string,
        customerId: string | null,
        bookingId: string | null,
        customizations: {
            name?: string;
            price?: Money;
            workers?: number;
            duration?: number;
            parentItemId?: string;
        } = {}
    ): Item {
        // This would typically fetch template data, for now we create with basic info
        return new Item(
            crypto.randomUUID(),
            ItemType.DEMENAGEMENT, // Default, should be from template
            templateId,
            customerId,
            bookingId,
            customizations.parentItemId || null,
            customizations.name || 'Item from template',
            null,
            customizations.price || new Money(0),
            customizations.workers || 2,
            customizations.duration || 120
        );
    }

    // Getters
    public getType(): ItemType {
        return this.type;
    }

    public getTemplateId(): string | null {
        return this.templateId;
    }

    public getCustomerId(): string | null {
        return this.customerId;
    }

    public getBookingId(): string | null {
        return this.bookingId;
    }

    public getParentItemId(): string | null {
        return this.parentItemId;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string | null {
        return this.description;
    }

    public getPrice(): Money {
        return this.price;
    }

    public getWorkers(): number {
        return this.workers;
    }

    public getDuration(): number {
        return this.duration;
    }

    public getFeatures(): string[] {
        return this.features;
    }

    public getIncludedDistance(): number | null {
        return this.includedDistance;
    }

    public getDistanceUnit(): string | null {
        return this.distanceUnit;
    }

    public getIncludes(): string[] {
        return this.includes;
    }

    public getCategoryId(): string | null {
        return this.categoryId;
    }

    public isPopular(): boolean {
        return this.popular;
    }

    public getImagePath(): string | null {
        return this.imagePath;
    }

    public isActive(): boolean {
        return this.active;
    }

    public getStatus(): string {
        return this.status;
    }

    public getCreatedAt(): Date {
        return super.getCreatedAt();
    }

    public getUpdatedAt(): Date {
        return this.updatedAt;
    }

    // Business methods
    public belongsToTemplate(templateId: string): boolean {
        return this.templateId === templateId;
    }

    public belongsToBooking(bookingId: string): boolean {
        return this.bookingId === bookingId;
    }

    public belongsToCustomer(customerId: string): boolean {
        return this.customerId === customerId;
    }

    public calculateFinalPrice(discount: number = 0): number {
        const discountAmount = this.price.getAmount() * (discount / 100);
        return this.price.getAmount() - discountAmount;
    }

    public isInPriceRange(minPrice: number, maxPrice: number): boolean {
        const price = this.price.getAmount();
        return price >= minPrice && price <= maxPrice;
    }

    public calculatePromotionalPrice(promotionRate: number = 10): number {
        if (this.popular) {
            return this.calculateFinalPrice(promotionRate);
        }
        return this.price.getAmount();
    }

    public hasFeature(feature: string): boolean {
        return this.features.includes(feature);
    }

    public includesService(service: string): boolean {
        return this.includes.includes(service);
    }

    public isCustomizedFromCatalog(): boolean {
        return this.parentItemId !== null;
    }

    public getTypeCategory(): string {
        return this.type;
    }

    public getTotalWorkingHours(): number {
        // Duration could be in minutes or hours, normalize to hours
        if (this.duration > 24) {
            // Assume it's in minutes if > 24
            return this.duration / 60;
        }
        return this.duration;
    }

    public getTotalWorkCost(): number {
        return this.workers * this.getTotalWorkingHours() * 50; // 50€/hour/worker base rate
    }
} 