import { Entity, UniqueId } from './Entity';
import { ContactInfo } from '../valueObjects/ContactInfo';
import { Address } from '../valueObjects/Address';
import { Quote } from './Quote';

export class Customer extends Entity {
    private quoteHistory: Quote[] = [];
    private loyaltyPoints: number = 0;

    constructor(
        private contactInfo: ContactInfo,
        private address: Address,
        id?: UniqueId
    ) {
        super(id);
    }

    public updateContact(contactInfo: ContactInfo): void {
        this.contactInfo = contactInfo;
    }

    public updateAddress(address: Address): void {
        this.address = address;
    }

    public addQuote(quote: Quote): void {
        this.quoteHistory.push(quote);
        this.updateLoyaltyPoints();
    }

    private updateLoyaltyPoints(): void {
        // Simple loyalty points calculation
        // 1 point per quote, could be more sophisticated based on quote value, etc.
        this.loyaltyPoints += 1;
    }

    public calculateLoyaltyDiscount(): number {
        // Simple discount calculation
        // 1% discount per 10 loyalty points, max 10%
        const discountPercentage = Math.floor(this.loyaltyPoints / 10);
        return Math.min(discountPercentage, 10);
    }

    public getContactInfo(): ContactInfo {
        return this.contactInfo;
    }

    public getAddress(): Address {
        return this.address;
    }

    public getQuoteHistory(): Quote[] {
        return [...this.quoteHistory];
    }

    public getLoyaltyPoints(): number {
        return this.loyaltyPoints;
    }
} 