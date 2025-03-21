import { Entity, UniqueId } from './Entity';
import { Money } from '../valueObjects/Money';
import { Rule } from '../valueObjects/Rule';

export enum ServiceType {
    CLEANING = 'CLEANING',
    MOVING = 'MOVING'
}

export class Service extends Entity {
    private rules: Rule[] = [];

    constructor(
        private name: string,
        private type: ServiceType,
        private basePrice: Money,
        id?: UniqueId
    ) {
        super(id);
        this.validate();
    }

    private validate(): void {
        if (!this.name || this.name.trim().length === 0) {
            throw new Error('Service name is required');
        }
        if (!Object.values(ServiceType).includes(this.type)) {
            throw new Error('Invalid service type');
        }
        if (this.basePrice.getAmount() < 0) {
            throw new Error('Base price cannot be negative');
        }
    }

    public updateName(name: string): void {
        if (!name || name.trim().length === 0) {
            throw new Error('Service name is required');
        }
        this.name = name;
    }

    public updateBasePrice(price: Money): void {
        if (price.getAmount() < 0) {
            throw new Error('Base price cannot be negative');
        }
        this.basePrice = price;
    }

    public addRule(rule: Rule): void {
        this.rules.push(rule);
    }

    public removeRule(ruleName: string): void {
        this.rules = this.rules.filter(rule => rule.name !== ruleName);
    }

    public getName(): string {
        return this.name;
    }

    public getType(): ServiceType {
        return this.type;
    }

    public getBasePrice(): Money {
        return this.basePrice;
    }

    public getRules(): Rule[] {
        return [...this.rules];
    }
} 