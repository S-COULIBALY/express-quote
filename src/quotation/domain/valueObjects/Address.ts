/**
 * Coordonnées géographiques (latitude, longitude)
 */
export type GeoCoordinates = {
    latitude: number;
    longitude: number;
};

/**
 * Objet-valeur représentant une adresse postale
 */
export class Address {
    private readonly street: string;
    private readonly city: string;
    private readonly postalCode: string;
    private readonly country: string;
    private readonly additionalInfo?: string;
    private readonly floor?: number;
    private readonly hasElevator?: boolean;
    private readonly carryDistance?: number;
    private readonly coordinates?: GeoCoordinates;

    constructor(
        street: string,
        city: string,
        postalCode: string,
        country: string,
        additionalInfo?: string,
        floor?: number,
        hasElevator?: boolean,
        carryDistance?: number,
        coordinates?: GeoCoordinates
    ) {
        this.street = street;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.additionalInfo = additionalInfo;
        this.floor = floor;
        this.hasElevator = hasElevator;
        this.carryDistance = carryDistance;
        this.coordinates = coordinates;
        this.validate();
    }

    private validate(): void {
        if (!this.street) {
            throw new Error('Street is required');
        }
        if (!this.city) {
            throw new Error('City is required');
        }
        if (!this.postalCode) {
            throw new Error('Postal code is required');
        }
        if (!this.country) {
            throw new Error('Country is required');
        }
        if (this.floor !== undefined && this.floor < 0) {
            throw new Error('Floor must be a non-negative number');
        }
        if (this.carryDistance !== undefined && this.carryDistance < 0) {
            throw new Error('Carry distance must be a non-negative number');
        }
    }

    public getStreet(): string {
        return this.street;
    }

    public getCity(): string {
        return this.city;
    }

    public getPostalCode(): string {
        return this.postalCode;
    }

    public getCountry(): string {
        return this.country;
    }

    public getAdditionalInfo(): string | undefined {
        return this.additionalInfo;
    }

    public getFloor(): number | undefined {
        return this.floor;
    }

    public hasElevatorAccess(): boolean | undefined {
        return this.hasElevator;
    }

    public getCarryDistance(): number | undefined {
        return this.carryDistance;
    }

    public getCoordinates(): GeoCoordinates | undefined {
        return this.coordinates;
    }

    public toString(): string {
        let result = `${this.street}, ${this.postalCode} ${this.city}, ${this.country}`;
        if (this.additionalInfo) {
            result += ` (${this.additionalInfo})`;
        }
        return result;
    }

    public toDTO(): Record<string, any> {
        return {
            street: this.street,
            city: this.city,
            postalCode: this.postalCode,
            country: this.country,
            additionalInfo: this.additionalInfo,
            floor: this.floor,
            hasElevator: this.hasElevator,
            carryDistance: this.carryDistance,
            coordinates: this.coordinates
        };
    }
} 