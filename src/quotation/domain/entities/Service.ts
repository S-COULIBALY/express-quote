import { Entity } from '../../../shared/domain/Entity';
import { Money } from '../valueObjects/Money';

export class Service extends Entity {
    private readonly name: string;
    private readonly description: string;
    private readonly price: Money;
    private readonly duration: number; // en minutes
    private readonly workers: number;
    private readonly includes: string[];
    private readonly bookingId?: string;
    private readonly scheduledDate?: Date;
    private readonly location?: string;
    private readonly additionalInfo?: string;
    private readonly options: Record<string, any>;

    constructor(
        id: string,
        name: string,
        description: string,
        price: Money,
        duration: number,
        workers: number = 1,
        includes: string[] = [],
        bookingId?: string,
        scheduledDate?: Date,
        location?: string,
        additionalInfo?: string,
        options: Record<string, any> = {}
    ) {
        super(id);
        this.name = name;
        this.description = description;
        this.price = price;
        this.duration = duration;
        this.workers = workers;
        this.includes = includes;
        this.bookingId = bookingId;
        this.scheduledDate = scheduledDate;
        this.location = location;
        this.additionalInfo = additionalInfo;
        this.options = { ...options };
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

    public getBookingId(): string | undefined {
        return this.bookingId;
    }

    public getScheduledDate(): Date | undefined {
        return this.scheduledDate;
    }

    public getLocation(): string | undefined {
        return this.location;
    }

    public getAdditionalInfo(): string | undefined {
        return this.additionalInfo;
    }

    public getOptions(): Record<string, any> {
        return { ...this.options };
    }
} 