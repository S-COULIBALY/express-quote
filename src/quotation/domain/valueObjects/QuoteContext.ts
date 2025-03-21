import { ServiceType } from '../entities/Service';
import { Address } from './Address';
import { ContactInfo } from './ContactInfo';

export interface QuoteContextData {
    serviceType: ServiceType;    // Type de service demandé (nettoyage ou déménagement)
    squareMeters?: number;      // Surface totale du logement en mètres carrés
    numberOfRooms?: number;     // Nombre total de pièces à nettoyer/déménager
    hasBalcony?: boolean;       // Indique si le logement possède un balcon à nettoyer
    hasPets?: boolean;          // Présence d'animaux domestiques dans le logement
    frequency?: 'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';    // Fréquence souhaitée pour le service de nettoyage
    numberOfMovers?: number;    // Nombre de déménageurs requis pour le service (calculé par le système)
    numberOfBoxes?: number;     // Estimation du nombre de cartons à déplacer (calculé par le système)
    hasElevator?: boolean;      // Présence d'un ascenseur dans l'immeuble
    floorNumber?: number;       // Étage du logement (important pour l'accessibilité)
    distance?: number;          // Distance en kilomètres pour le déménagement
    addresses?: {               // Adresses pour le déménagement
        pickup: Address;
        delivery: Address;
    };
    contact: ContactInfo;       // Informations de contact (obligatoire)
    [key: string]: any;         // Propriétés additionnelles
}

export class QuoteContext {
    private readonly serviceType: ServiceType;
    private readonly contact: ContactInfo;
    private readonly addresses?: { pickup: Address; delivery: Address };
    private readonly data: QuoteContextData;

    constructor(data: QuoteContextData) {
        this.data = { ...data };
        this.serviceType = data.serviceType;
        this.contact = data.contact;
        this.addresses = data.addresses;
        this.validate();
    }

    private validate(): void {
        if (!this.serviceType) {
            throw new Error('Service type is required');
        }
        if (!Object.values(ServiceType).includes(this.serviceType)) {
            throw new Error('Invalid service type');
        }

        // Validation du contact (obligatoire pour tous les services)
        if (!this.contact) {
            throw new Error('Contact information is required');
        }

        // Validate cleaning specific fields
        if (this.serviceType === ServiceType.CLEANING) {
            if (!this.data.squareMeters || this.data.squareMeters <= 0) {
                throw new Error('Square meters is required and must be positive for cleaning service');
            }
            if (!this.data.numberOfRooms || this.data.numberOfRooms <= 0) {
                throw new Error('Number of rooms is required and must be positive for cleaning service');
            }
            if (this.data.frequency && !['ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(this.data.frequency)) {
                throw new Error('Invalid frequency value');
            }
        }

        // Validate moving specific fields
        if (this.serviceType === ServiceType.MOVING) {
            if (!this.addresses) {
                throw new Error('Addresses are required for moving service');
            }
            if (!this.addresses.pickup || !this.addresses.delivery) {
                throw new Error('Both pickup and delivery addresses are required for moving service');
            }
            if (!this.data.distance || this.data.distance <= 0) {
                throw new Error('Distance must be provided and positive for moving service');
            }
            if (!this.data.volume || this.data.volume <= 0) {
                throw new Error('Volume must be provided and positive for moving service');
            }
        }
    }

    public getServiceType(): ServiceType {
        return this.serviceType;
    }

    public getContact(): ContactInfo {
        return this.contact;
    }

    public getAddresses(): { pickup: Address; delivery: Address } | undefined {
        return this.addresses;
    }

    public getValue<T>(key: keyof QuoteContextData): T | undefined {
        return this.data[key] as T;
    }

    public hasValue(key: keyof QuoteContextData): boolean {
        return this.data[key] !== undefined;
    }

    public getAllData(): QuoteContextData {
        return { ...this.data };
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

