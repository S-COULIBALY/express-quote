import { Entity, UniqueId } from './Entity';
import { Money } from '../valueObjects/Money';

export type Coordinates = {
    lat: number;
    lng: number;
};

export class Moving extends Entity {
    constructor(
        private moveDate: Date,
        private pickupAddress: string,
        private deliveryAddress: string,
        private distance: number,
        private volume: number,
        private bookingId: string,
        private pickupFloor?: number,
        private deliveryFloor?: number,
        private pickupElevator: boolean = false,
        private deliveryElevator: boolean = false,
        private pickupCarryDistance?: number,
        private deliveryCarryDistance?: number,
        private propertyType?: string,
        private surface?: number,
        private rooms?: number,
        private occupants?: number,
        private pickupCoordinates?: Coordinates,
        private deliveryCoordinates?: Coordinates,
        private packaging: boolean = false,
        private furniture: boolean = false,
        private fragile: boolean = false,
        private storage: boolean = false,
        private disassembly: boolean = false,
        private unpacking: boolean = false,
        private supplies: boolean = false,
        private fragileItems: boolean = false,
        private baseCost?: number,
        private volumeCost?: number,
        private distancePrice?: number,
        private optionsCost?: number,
        private tollCost?: number,
        private fuelCost?: number,
        private items?: any[],
        id?: UniqueId
    ) {
        super(id);
        this.validate();
    }

    private validate(): void {
        if (!this.moveDate) {
            throw new Error('Move date is required');
        }
        if (!this.pickupAddress) {
            throw new Error('Pickup address is required');
        }
        if (!this.deliveryAddress) {
            throw new Error('Delivery address is required');
        }
        if (!this.distance || this.distance <= 0) {
            throw new Error('Distance is required and must be positive');
        }
        if (!this.volume || this.volume <= 0) {
            throw new Error('Volume is required and must be positive');
        }
        if (!this.bookingId) {
            throw new Error('Booking ID is required');
        }
    }

    // Getters
    public getMoveDate(): Date {
        return new Date(this.moveDate);
    }

    public getPickupAddress(): string {
        return this.pickupAddress;
    }

    public getDeliveryAddress(): string {
        return this.deliveryAddress;
    }

    public getDistance(): number {
        return this.distance;
    }

    public getVolume(): number {
        return this.volume;
    }

    public getBookingId(): string {
        return this.bookingId;
    }

    public getPickupFloor(): number | undefined {
        return this.pickupFloor;
    }

    public getDeliveryFloor(): number | undefined {
        return this.deliveryFloor;
    }

    public hasPickupElevator(): boolean {
        return this.pickupElevator;
    }

    public hasDeliveryElevator(): boolean {
        return this.deliveryElevator;
    }

    public getPickupCarryDistance(): number | undefined {
        return this.pickupCarryDistance;
    }

    public getDeliveryCarryDistance(): number | undefined {
        return this.deliveryCarryDistance;
    }

    public getPropertyType(): string | undefined {
        return this.propertyType;
    }

    public getSurface(): number | undefined {
        return this.surface;
    }

    public getRooms(): number | undefined {
        return this.rooms;
    }

    public getOccupants(): number | undefined {
        return this.occupants;
    }

    public getPickupCoordinates(): Coordinates | undefined {
        return this.pickupCoordinates;
    }

    public getDeliveryCoordinates(): Coordinates | undefined {
        return this.deliveryCoordinates;
    }

    public hasPackaging(): boolean {
        return this.packaging;
    }

    public hasFurniture(): boolean {
        return this.furniture;
    }

    public hasFragile(): boolean {
        return this.fragile;
    }

    public hasStorage(): boolean {
        return this.storage;
    }

    public hasDisassembly(): boolean {
        return this.disassembly;
    }

    public hasUnpacking(): boolean {
        return this.unpacking;
    }

    public hasSupplies(): boolean {
        return this.supplies;
    }

    public hasFragileItems(): boolean {
        return this.fragileItems;
    }

    public getBaseCost(): number | undefined {
        return this.baseCost;
    }

    public getVolumeCost(): number | undefined {
        return this.volumeCost;
    }

    public getDistancePrice(): number | undefined {
        return this.distancePrice;
    }

    public getOptionsCost(): number | undefined {
        return this.optionsCost;
    }

    public getTollCost(): number | undefined {
        return this.tollCost;
    }

    public getFuelCost(): number | undefined {
        return this.fuelCost;
    }

    public getItems(): any[] | undefined {
        return this.items;
    }
} 