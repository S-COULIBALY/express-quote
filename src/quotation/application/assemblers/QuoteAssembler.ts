import { Quote } from '../../domain/entities/Quote';
import { QuoteDTO } from '../dtos/QuoteDTO';
import { Money } from '../../domain/valueObjects/Money';

export class QuoteAssembler {
  static toDTO(quote: Quote): QuoteDTO {
    return {
      id: quote.id,
      type: quote.type,
      status: quote.status,
      customer: {
        id: quote.customer.id,
        firstName: quote.customer.firstName,
        lastName: quote.customer.lastName,
        email: quote.customer.email,
        phone: quote.customer.phone
      },
      totalAmount: quote.totalAmount.getAmount(),
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      
      // Moving specific
      moveDate: quote.moveDate,
      pickupAddress: quote.pickupAddress,
      deliveryAddress: quote.deliveryAddress,
      distance: quote.distance,
      volume: quote.volume,
      pickupFloor: quote.pickupFloor,
      deliveryFloor: quote.deliveryFloor,
      pickupElevator: quote.pickupElevator,
      deliveryElevator: quote.deliveryElevator,
      pickupCarryDistance: quote.pickupCarryDistance,
      deliveryCarryDistance: quote.deliveryCarryDistance,
      propertyType: quote.propertyType,
      surface: quote.surface,
      rooms: quote.rooms,
      occupants: quote.occupants,
      
      // Pack specific
      packId: quote.packId,
      packName: quote.packName,
      scheduledDate: quote.scheduledDate,
      
      // Service specific
      serviceId: quote.serviceId,
      serviceName: quote.serviceName,
      description: quote.description,
      scheduledTime: quote.scheduledTime,
      location: quote.location,
      
      // Options
      packagingOption: quote.packagingOption,
      furnitureOption: quote.furnitureOption,
      fragileOption: quote.fragileOption,
      storageOption: quote.storageOption,
      disassemblyOption: quote.disassemblyOption,
      unpackingOption: quote.unpackingOption,
      suppliesOption: quote.suppliesOption,
      fragileItemsOption: quote.fragileItemsOption,
      
      // Costs
      baseCost: quote.baseCost,
      volumeCost: quote.volumeCost,
      distancePrice: quote.distancePrice,
      optionsCost: quote.optionsCost,
      tollCost: quote.tollCost,
      fuelCost: quote.fuelCost
    };
  }

  static toEntity(dto: QuoteDTO): Quote {
    return new Quote({
      id: dto.id,
      type: dto.type,
      status: dto.status,
      customer: {
        id: dto.customer.id,
        firstName: dto.customer.firstName,
        lastName: dto.customer.lastName,
        email: dto.customer.email,
        phone: dto.customer.phone
      },
      totalAmount: new Money(dto.totalAmount),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      
      // Moving specific
      moveDate: dto.moveDate,
      pickupAddress: dto.pickupAddress,
      deliveryAddress: dto.deliveryAddress,
      distance: dto.distance,
      volume: dto.volume,
      pickupFloor: dto.pickupFloor,
      deliveryFloor: dto.deliveryFloor,
      pickupElevator: dto.pickupElevator,
      deliveryElevator: dto.deliveryElevator,
      pickupCarryDistance: dto.pickupCarryDistance,
      deliveryCarryDistance: dto.deliveryCarryDistance,
      propertyType: dto.propertyType,
      surface: dto.surface,
      rooms: dto.rooms,
      occupants: dto.occupants,
      
      // Pack specific
      packId: dto.packId,
      packName: dto.packName,
      scheduledDate: dto.scheduledDate,
      
      // Service specific
      serviceId: dto.serviceId,
      serviceName: dto.serviceName,
      description: dto.description,
      scheduledTime: dto.scheduledTime,
      location: dto.location,
      
      // Options
      packagingOption: dto.packagingOption,
      furnitureOption: dto.furnitureOption,
      fragileOption: dto.fragileOption,
      storageOption: dto.storageOption,
      disassemblyOption: dto.disassemblyOption,
      unpackingOption: dto.unpackingOption,
      suppliesOption: dto.suppliesOption,
      fragileItemsOption: dto.fragileItemsOption,
      
      // Costs
      baseCost: dto.baseCost,
      volumeCost: dto.volumeCost,
      distancePrice: dto.distancePrice,
      optionsCost: dto.optionsCost,
      tollCost: dto.tollCost,
      fuelCost: dto.fuelCost
    });
  }
} 