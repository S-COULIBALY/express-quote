import { Entity } from '../../../shared/domain/Entity';
import { Money } from '../valueObjects/Money';

export enum PackType {
    STANDARD = 'STANDARD',
    DELUXE = 'DELUXE',
    PREMIUM = 'PREMIUM',
    CUSTOM = 'CUSTOM'
}

export class Pack extends Entity {
    private readonly name: string;
    private readonly description: string;
    private readonly price: Money;
    private readonly duration: number;
    private readonly workers: number;
    private readonly includes: string[];
    private readonly features: string[];
    private readonly categoryId?: string;
    private readonly content?: string;
    private readonly imagePath?: string;
    private readonly includedDistance: number;
    private readonly distanceUnit: string;
    private readonly workersNeeded: number;
    private readonly isAvailable: boolean;
    private readonly popular: boolean;
    private readonly bookingId?: string;
    private readonly scheduledDate?: Date;
    private readonly pickupAddress?: string;
    private readonly deliveryAddress?: string;
    private readonly distance?: number;
    private readonly additionalInfo?: string;

    constructor(
        id: string,
        name: string,
        description: string,
        price: Money,
        duration: number,
        workers: number = 1,
        includes: string[] = [],
        features: string[] = [],
        categoryId?: string,
        content?: string,
        imagePath?: string,
        includedDistance: number = 0,
        distanceUnit: string = 'km',
        workersNeeded: number = 1,
        isAvailable: boolean = true,
        popular: boolean = false,
        bookingId?: string,
        scheduledDate?: Date,
        pickupAddress?: string,
        deliveryAddress?: string,
        distance?: number,
        additionalInfo?: string
    ) {
        super(id);
        this.name = name;
        this.description = description;
        this.price = price;
        this.duration = duration;
        this.workers = workers;
        this.includes = includes;
        this.features = features;
        this.categoryId = categoryId;
        this.content = content;
        this.imagePath = imagePath;
        this.includedDistance = includedDistance;
        this.distanceUnit = distanceUnit;
        this.workersNeeded = workersNeeded;
        this.isAvailable = isAvailable;
        this.popular = popular;
        this.bookingId = bookingId;
        this.scheduledDate = scheduledDate;
        this.pickupAddress = pickupAddress;
        this.deliveryAddress = deliveryAddress;
        this.distance = distance;
        this.additionalInfo = additionalInfo;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }

    public getPrice(): Money {
        return this.price;
    }

    public getDuration(): number {
        return this.duration;
    }

    public getWorkers(): number {
        return this.workers;
    }

    public getIncludes(): string[] {
        return [...this.includes];
    }

    public getFeatures(): string[] {
        return [...this.features];
    }

    public getCategoryId(): string | undefined {
        return this.categoryId;
    }

    public getContent(): string | undefined {
        return this.content;
    }

    public getImagePath(): string | undefined {
        return this.imagePath;
    }

    public getIncludedDistance(): number {
        return this.includedDistance;
    }

    public getDistanceUnit(): string {
        return this.distanceUnit;
    }

    public getWorkersNeeded(): number {
        return this.workersNeeded;
    }

    public isPackAvailable(): boolean {
        return this.isAvailable;
    }

    public isPopular(): boolean {
        return this.popular;
    }
    
    public getBookingId(): string | undefined {
        return this.bookingId;
    }

    public getScheduledDate(): Date | undefined {
        return this.scheduledDate;
    }

    public getPickupAddress(): string | undefined {
        return this.pickupAddress;
    }

    public getDeliveryAddress(): string | undefined {
        return this.deliveryAddress;
    }

    public getDistance(): number | undefined {
        return this.distance;
    }

    public getAdditionalInfo(): string | undefined {
        return this.additionalInfo;
    }

    /**
     * Calcule le coût supplémentaire lié à la distance excédentaire
     * @returns Le coût en euros des kilomètres supplémentaires
     */
    public calculateExtraDistanceCost(): number {
        if (this.distance <= this.includedDistance) {
            return 0;
        }
        
        const extraKm = this.distance - this.includedDistance;
        // Coût de 1.5€ par km supplémentaire
        return extraKm * 1.5;
    }
} 