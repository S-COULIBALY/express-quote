import { ServiceType } from '../enums/ServiceType';
import { Address } from './Address';
import { ContactInfo } from './ContactInfo';

/**
 * Interface pour les données du contexte de devis
 */
export type QuoteContextData = {
    serviceType?: ServiceType;
    pickupAddress?: Address;
    deliveryAddress?: Address;
    contactInfo?: ContactInfo;
    moveDate?: Date;
    volume?: number;
    distance?: number;
    tollCost?: number;
    fuelCost?: number;
    pickupElevator?: boolean;
    deliveryElevator?: boolean;
    pickupFloor?: number;
    deliveryFloor?: number;
    pickupCarryDistance?: number;
    deliveryCarryDistance?: number;
    options?: {
        packaging?: boolean;
        furniture?: boolean;
        fragile?: boolean;
        storage?: boolean;
        disassembly?: boolean;
        unpacking?: boolean;
        supplies?: boolean;
        fragileItems?: boolean;
    };
    [key: string]: any;
};

/**
 * Objet-valeur représentant le contexte d'un devis
 * Contient toutes les informations nécessaires pour calculer un devis
 */
export class QuoteContext {
    private data: QuoteContextData;

    constructor(data: QuoteContextData) {
        this.data = { ...data };
        this.validate();
    }

    private validate(): void {
        // Vous pouvez ajouter des validations spécifiques ici
    }

    public getValue<T>(key: string): T | undefined {
        return this.data[key] as T;
    }

    public setValue(key: string, value: any): void {
        this.data[key] = value;
    }

    public getServiceType(): ServiceType | undefined {
        return this.data.serviceType;
    }

    public getPickupAddress(): Address | undefined {
        return this.data.pickupAddress;
    }

    public getDeliveryAddress(): Address | undefined {
        return this.data.deliveryAddress;
    }

    public getContactInfo(): ContactInfo | undefined {
        return this.data.contactInfo;
    }

    public getMoveDate(): Date | undefined {
        return this.data.moveDate;
    }

    public getAllData(): QuoteContextData {
        return { ...this.data };
    }

    /**
     * Crée une représentation exportable du contexte
     */
    public toDTO(): Record<string, any> {
        const dto: Record<string, any> = {};
        
        for (const [key, value] of Object.entries(this.data)) {
            if (typeof value === 'object' && value !== null) {
                if (value instanceof Date) {
                    dto[key] = value.toISOString();
                } else if ('toDTO' in value && typeof value.toDTO === 'function') {
                    dto[key] = value.toDTO();
                } else {
                    dto[key] = { ...value };
                }
            } else {
                dto[key] = value;
            }
        }
        
        return dto;
    }
} 


// Example usage:


// const quoteContext = new QuoteContext({
//     serviceType: ServiceType.CLEANING,
//     squareMeters: 100,
//     numberOfRooms: 4,
//     frequency: 'WEEKLY'
// });

// const serviceType = quoteContext.getServiceType(); // Returns ServiceType.CLEANING
// const squareMeters = quoteContext.getValue<number>('squareMeters'); // Returns 100
// const hasFrequency = quoteContext.hasValue('frequency'); // Returns true
// const allData = quoteContext.getAllData(); // Returns all data as QuoteContextData

// For moving service:
// const movingQuote = new QuoteContext({
//     serviceType: ServiceType.MOVING,
//     numberOfMovers: 3,
//     numberOfBoxes: 50,
//     floorNumber: 2,
//     distance: 15
// });

// const movingServiceType = movingQuote.getServiceType(); // Returns ServiceType.MOVING
// const numberOfMovers = movingQuote.getValue<number>('numberOfMovers'); // Returns 3 

