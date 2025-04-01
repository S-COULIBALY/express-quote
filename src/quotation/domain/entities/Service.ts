import { Entity } from '../../../shared/domain/Entity';
import { Money } from '../valueObjects/Money';
import { ServiceType } from '../enums/ServiceType';

export class Service extends Entity {
    private readonly bookingId?: string;
    private readonly serviceType: ServiceType;
    private readonly description: string;
    private readonly duration: number; // en minutes
    private readonly price: Money;
    private readonly date?: Date;
    private readonly status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    private readonly options: Record<string, any>;

    constructor(
        id: string,
        serviceType: ServiceType,
        description: string,
        duration: number,
        price: Money,
        date?: Date,
        bookingId?: string,
        status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' = 'SCHEDULED',
        options: Record<string, any> = {}
    ) {
        super(id);
        this.serviceType = serviceType;
        this.description = description;
        this.duration = duration;
        this.price = price;
        this.date = date;
        this.bookingId = bookingId;
        this.status = status;
        this.options = { ...options };
    }

    public getServiceType(): ServiceType {
        return this.serviceType;
    }

    public getDescription(): string {
        return this.description;
    }

    public getDuration(): number {
        return this.duration;
    }

    public getPrice(): Money {
        return this.price;
    }

    public getDate(): Date | undefined {
        return this.date;
    }

    public getBookingId(): string | undefined {
        return this.bookingId;
    }

    public getStatus(): 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' {
        return this.status;
    }

    public getOptions(): Record<string, any> {
        return { ...this.options };
    }
} 