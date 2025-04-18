import { ServiceType } from '../enums/ServiceType';
import { Address } from './Address';
import { ContactInfo } from './ContactInfo';
import { ValidationError } from '../errors/ValidationError';

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
    private readonly serviceType: ServiceType;
    private readonly values: Record<string, any>;

    /**
     * Crée un nouveau contexte pour un type de service spécifique
     */
    constructor(serviceType: ServiceType) {
        this.serviceType = serviceType;
        this.values = {};
    }

    /**
     * Récupère le type de service
     */
    getServiceType(): ServiceType {
        return this.serviceType;
    }

    /**
     * Définit une valeur dans le contexte avec validation
     * @throws {ValidationError} Si la valeur ne respecte pas les règles de validation
     */
    setValue<T>(key: string, value: any): void {
        // Validation spécifique en fonction du type de valeur attendu
        if (key === 'volume' || key === 'distance' || key === 'workers' || 
            key === 'basePrice' || key === 'duration') {
            // Conversion en nombre
            const numValue = Number(value);
            
            // Validation que c'est un nombre valide
            if (isNaN(numValue)) {
                throw new ValidationError(`La valeur pour '${key}' doit être un nombre valide`);
            }
            
            // Validation des nombres positifs
            if (numValue < 0) {
                throw new ValidationError(`La valeur pour '${key}' doit être un nombre positif`);
            }
            
            // Validation spécifique pour certains champs
            if (key === 'workers' && numValue < 1) {
                throw new ValidationError(`La valeur pour '${key}' doit être au moins 1`);
            }
            
            if (key === 'duration' && numValue < 1) {
                throw new ValidationError(`La valeur pour '${key}' doit être au moins 1`);
            }
            
            // Assigner la valeur convertie
            this.values[key] = numValue;
            return;
        }
        
        // Validation pour les champs booléens
        if (key.includes('Elevator') || key.includes('NeedsLift') ||
            key === 'packaging' || key === 'fragile' || key === 'storage' ||
            key === 'disassembly' || key === 'unpacking' || key === 'supplies') {
            // Conversion en booléen
            this.values[key] = Boolean(value);
            return;
        }
        
        // Si aucune validation spécifique, stocker la valeur telle quelle
        this.values[key] = value;
    }

    /**
     * Récupère une valeur du contexte avec son type
     */
    getValue<T>(key: string): T | undefined {
        return this.values[key] as T;
    }

    /**
     * Vérifie si une clé existe dans le contexte
     */
    hasValue(key: string): boolean {
        return key in this.values;
    }

    /**
     * Convertit le contexte en objet simple pour la sérialisation
     */
    toDTO(): Record<string, any> {
        return {
            serviceType: this.serviceType,
            ...this.values
        };
    }

    /**
     * Valide que le contexte contient toutes les valeurs requises pour un type de service
     * @throws {ValidationError} Si des valeurs requises sont manquantes
     */
    validate(): void {
        const requiredFields: Record<ServiceType, string[]> = {
            [ServiceType.MOVING]: ['volume', 'distance'],
            [ServiceType.PACK]: ['basePrice', 'duration', 'workers'],
            [ServiceType.SERVICE]: ['basePrice', 'duration', 'workers'],
            [ServiceType.PACKING]: ['volume', 'workers', 'duration'],
            [ServiceType.CLEANING]: ['area', 'workers'],
            [ServiceType.DELIVERY]: ['volume', 'distance', 'workers']
        };
        
        const fields = requiredFields[this.serviceType];
        
        if (!fields) {
            throw new ValidationError(`Type de service non pris en charge: ${this.serviceType}`);
        }
        
        for (const field of fields) {
            if (!this.hasValue(field)) {
                throw new ValidationError(`Le champ ${field} est requis pour un devis de type ${this.serviceType}`);
            }
        }
    }

    public getPickupAddress(): Address | undefined {
        return this.values.pickupAddress as Address;
    }

    public getDeliveryAddress(): Address | undefined {
        return this.values.deliveryAddress as Address;
    }

    public getContactInfo(): ContactInfo | undefined {
        return this.values.contactInfo as ContactInfo;
    }

    public getMoveDate(): Date | undefined {
        return this.values.moveDate as Date;
    }

    public getAllData(): QuoteContextData {
        return { ...this.values };
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

