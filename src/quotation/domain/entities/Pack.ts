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
    private readonly type: PackType;
    private readonly description: string;
    private readonly price: Money;
    private readonly bookingId?: string;
    private readonly includedItems: string[];
    private readonly customOptions: Record<string, any>;

    constructor(
        id: string,
        name: string,
        type: PackType,
        description: string,
        price: Money,
        includedItems: string[] = [],
        bookingId?: string,
        customOptions: Record<string, any> = {}
    ) {
        super(id);
        this.name = name;
        this.type = type;
        this.description = description;
        this.price = price;
        this.includedItems = [...includedItems];
        this.bookingId = bookingId;
        this.customOptions = { ...customOptions };
    }

    public getName(): string {
        return this.name;
    }

    public getType(): PackType {
        return this.type;
    }

    public getDescription(): string {
        return this.description;
    }

    public getPrice(): Money {
        return this.price;
    }

    public getIncludedItems(): string[] {
        return [...this.includedItems];
    }

    public getBookingId(): string | undefined {
        return this.bookingId;
    }

    public getCustomOptions(): Record<string, any> {
        return { ...this.customOptions };
    }

    public hasItem(itemName: string): boolean {
        return this.includedItems.includes(itemName);
    }
} 