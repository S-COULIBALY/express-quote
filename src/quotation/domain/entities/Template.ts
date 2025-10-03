import { Entity } from '../../../shared/domain/Entity';
import { Money } from '../valueObjects/Money';

export class Template extends Entity {
    private readonly name: string;
    private readonly description: string;
    private readonly serviceType: string;
    private readonly basePrice: Money;
    private readonly duration: number;
    private readonly workers: number;
    private readonly templateCreatedAt: Date;
    private readonly templateUpdatedAt: Date;

    constructor(
        id: string,
        name: string,
        description: string,
        serviceType: string,
        basePrice: Money,
        duration: number,
        workers: number,
        templateCreatedAt: Date = new Date(),
        templateUpdatedAt: Date = new Date()
    ) {
        super(id);
        this.name = name;
        this.description = description;
        this.serviceType = serviceType;
        this.basePrice = basePrice;
        this.duration = duration;
        this.workers = workers;
        this.templateCreatedAt = templateCreatedAt;
        this.templateUpdatedAt = templateUpdatedAt;
    }

    // Getters
    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }

    public getServiceType(): string {
        return this.serviceType;
    }

    public getBasePrice(): Money {
        return this.basePrice;
    }

    public getDuration(): number {
        return this.duration;
    }

    public getWorkers(): number {
        return this.workers;
    }

    public getCreatedAt(): Date {
        return this.templateCreatedAt;
    }

    public getUpdatedAt(): Date {
        return this.templateUpdatedAt;
    }

    // Méthodes métier
    public isServiceType(serviceType: string): boolean {
        return this.serviceType === serviceType;
    }

    public calculateBaseCost(): number {
        return this.basePrice.getAmount();
    }

    /**
     * Calcule le coût horaire du template
     */
    public calculateHourlyRate(): number {
        return this.basePrice.getAmount() / this.duration;
    }

    /**
     * Calcule le coût par travailleur
     */
    public calculateCostPerWorker(): number {
        return this.basePrice.getAmount() / this.workers;
    }
} 