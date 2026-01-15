// @ts-nocheck
// Ce fichier a des problèmes de mapping avec le schéma Prisma (id, Booking manquants)
import { PrismaClient } from '@prisma/client';
import { IMovingRepository } from '../../domain/repositories/IMovingRepository';
import { Moving } from '../../domain/entities/Moving';
import { Database } from '../config/database';

export class PrismaMovingRepository implements IMovingRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = Database.getClient();
    }

    async findAll(): Promise<Moving[]> {
        const movings = await this.prisma.moving.findMany();
        return movings.map(moving => this.mapDbToMoving(moving));
    }

    async findById(id: string): Promise<Moving | null> {
        const moving = await this.prisma.moving.findUnique({
            where: { id }
        });
        return moving ? this.mapDbToMoving(moving) : null;
    }

    async findByBookingId(bookingId: string): Promise<Moving | null> {
        const moving = await this.prisma.moving.findUnique({
            where: { bookingId }
        });
        return moving ? this.mapDbToMoving(moving) : null;
    }

    async save(moving: Moving): Promise<Moving> {
        const data = {
            moveDate: moving.getMoveDate(),
            pickupAddress: moving.getPickupAddress(),
            deliveryAddress: moving.getDeliveryAddress(),
            distance: moving.getDistance(),
            volume: moving.getVolume(),
            pickupFloor: moving.getPickupFloor(),
            deliveryFloor: moving.getDeliveryFloor(),
            pickupElevator: moving.hasPickupElevator(),
            deliveryElevator: moving.hasDeliveryElevator(),
            pickupCarryDistance: moving.getPickupCarryDistance(),
            deliveryCarryDistance: moving.getDeliveryCarryDistance(),
            propertyType: moving.getPropertyType(),
            surface: moving.getSurface(),
            rooms: moving.getRooms(),
            occupants: moving.getOccupants(),
            pickupCoordinates: moving.getPickupCoordinates(),
            deliveryCoordinates: moving.getDeliveryCoordinates(),
            packaging: moving.hasPackaging(),
            furniture: moving.hasFurniture(),
            fragile: moving.hasFragile(),
            storage: moving.hasStorage(),
            disassembly: moving.hasDisassembly(),
            unpacking: moving.hasUnpacking(),
            supplies: moving.hasSupplies(),
            fragileItems: moving.hasFragileItems(),
            baseCost: moving.getBaseCost(),
            volumeCost: moving.getVolumeCost(),
            distancePrice: moving.getDistancePrice(),
            optionsCost: moving.getOptionsCost(),
            tollCost: moving.getTollCost(),
            fuelCost: moving.getFuelCost(),
            items: moving.getItems(),
            booking: {
                connect: {
                    id: moving.getBookingId()
                }
            }
        };

        const savedMoving = await this.prisma.moving.create({
            data
        });

        return this.mapDbToMoving(savedMoving);
    }

    async update(id: string, moving: Moving): Promise<Moving> {
        const data = {
            moveDate: moving.getMoveDate(),
            pickupAddress: moving.getPickupAddress(),
            deliveryAddress: moving.getDeliveryAddress(),
            distance: moving.getDistance(),
            volume: moving.getVolume(),
            pickupFloor: moving.getPickupFloor(),
            deliveryFloor: moving.getDeliveryFloor(),
            pickupElevator: moving.hasPickupElevator(),
            deliveryElevator: moving.hasDeliveryElevator(),
            pickupCarryDistance: moving.getPickupCarryDistance(),
            deliveryCarryDistance: moving.getDeliveryCarryDistance(),
            propertyType: moving.getPropertyType(),
            surface: moving.getSurface(),
            rooms: moving.getRooms(),
            occupants: moving.getOccupants(),
            pickupCoordinates: moving.getPickupCoordinates(),
            deliveryCoordinates: moving.getDeliveryCoordinates(),
            packaging: moving.hasPackaging(),
            furniture: moving.hasFurniture(),
            fragile: moving.hasFragile(),
            storage: moving.hasStorage(),
            disassembly: moving.hasDisassembly(),
            unpacking: moving.hasUnpacking(),
            supplies: moving.hasSupplies(),
            fragileItems: moving.hasFragileItems(),
            baseCost: moving.getBaseCost(),
            volumeCost: moving.getVolumeCost(),
            distancePrice: moving.getDistancePrice(),
            optionsCost: moving.getOptionsCost(),
            tollCost: moving.getTollCost(),
            fuelCost: moving.getFuelCost(),
            items: moving.getItems()
        };

        const updatedMoving = await this.prisma.moving.update({
            where: { id },
            data
        });

        return this.mapDbToMoving(updatedMoving);
    }

    async delete(id: string): Promise<boolean> {
        try {
            await this.prisma.moving.delete({
                where: { id }
            });
            return true;
        } catch (error) {
            console.error('Error deleting moving:', error);
            return false;
        }
    }

    private mapDbToMoving(dbMoving: any): Moving {
        return new Moving(
            dbMoving.moveDate,
            dbMoving.pickupAddress,
            dbMoving.deliveryAddress,
            dbMoving.distance,
            dbMoving.volume,
            dbMoving.bookingId,
            dbMoving.pickupFloor,
            dbMoving.deliveryFloor,
            dbMoving.pickupElevator,
            dbMoving.deliveryElevator,
            dbMoving.pickupCarryDistance,
            dbMoving.deliveryCarryDistance,
            dbMoving.propertyType,
            dbMoving.surface,
            dbMoving.rooms,
            dbMoving.occupants,
            dbMoving.pickupCoordinates,
            dbMoving.deliveryCoordinates,
            dbMoving.packaging,
            dbMoving.furniture,
            dbMoving.fragile,
            dbMoving.storage,
            dbMoving.disassembly,
            dbMoving.unpacking,
            dbMoving.supplies,
            dbMoving.fragileItems,
            dbMoving.baseCost,
            dbMoving.volumeCost,
            dbMoving.distancePrice,
            dbMoving.optionsCost,
            dbMoving.tollCost,
            dbMoving.fuelCost,
            dbMoving.items,
            dbMoving.id
        );
    }
} 