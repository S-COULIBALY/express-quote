export class Address {
    constructor(
        private readonly street: string,
        private readonly city: string,
        private readonly floorNumber: number,
        private readonly postalCode?: string
    ) {
        this.validate();
    }

    private validate(): void {
        if (!this.street || this.street.trim().length === 0) {
            throw new Error('Street is required');
        }
        if (!this.city || this.city.trim().length === 0) {
            throw new Error('City is required');
        }
        if (this.floorNumber < 0) {
            throw new Error('Floor number cannot be negative');
        }
        if (this.postalCode && !/^\d{5}$/.test(this.postalCode)) {
            throw new Error('Invalid postal code format');
        }
    }

    public getStreet(): string {
        return this.street;
    }

    public getCity(): string {
        return this.city;
    }

    public getFloorNumber(): number {
        return this.floorNumber;
    }

    public getPostalCode(): string | undefined {
        return this.postalCode;
    }

    public equals(other: Address): boolean {
        return this.street === other.street &&
            this.city === other.city &&
            this.floorNumber === other.floorNumber &&
            this.postalCode === other.postalCode;
    }

    public toString(): string {
        return `${this.street}, ${this.postalCode} ${this.city}`;
    }
} 