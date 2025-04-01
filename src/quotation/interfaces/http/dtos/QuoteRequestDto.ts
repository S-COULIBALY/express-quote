import { ServiceType } from '../../../domain/enums/ServiceType';

export interface QuoteRequestDto {
  serviceType: ServiceType;
  // Cleaning specific fields
  squareMeters?: number;
  numberOfRooms?: number;
  hasBalcony?: boolean;
  hasPets?: boolean;
  frequency?: 'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  // Moving specific fields
  volume?: number;
  hasElevator?: boolean;
  floorNumber?: number;
  distance?: number;
  pickupAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  // Contact info (now optional)
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  // Common fields
  [key: string]: any;
}

export function validateQuoteRequest(data: Record<string, any>): QuoteRequestDto {
  if (!data.serviceType) {
    throw new Error('Service type is required');
  }

  if (!Object.values(ServiceType).includes(data.serviceType)) {
    throw new Error('Invalid service type');
  }

  // Validate cleaning specific fields
  if (data.serviceType === ServiceType.CLEANING) {
    if (!data.squareMeters || typeof data.squareMeters !== 'number' || data.squareMeters <= 0) {
      throw new Error('Square meters is required and must be a positive number for cleaning service');
    }
    if (!data.numberOfRooms || typeof data.numberOfRooms !== 'number' || data.numberOfRooms <= 0) {
      throw new Error('Number of rooms is required and must be a positive number for cleaning service');
    }
    if (data.frequency && !['ONCE', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'].includes(data.frequency)) {
      throw new Error('Invalid frequency value');
    }
  }

  // Validate moving specific fields
  if (data.serviceType === ServiceType.MOVING) {
    if (!data.volume || typeof data.volume !== 'number' || data.volume <= 0) {
      throw new Error('Volume is required and must be a positive number for moving service');
    }
    if (!data.pickupAddress || !data.deliveryAddress) {
      throw new Error('Both pickup and delivery addresses are required for moving service');
    }
    if (data.floorNumber !== undefined && (typeof data.floorNumber !== 'number' || data.floorNumber < 0)) {
      throw new Error('Floor number must be a non-negative number');
    }
    if (data.distance !== undefined && (typeof data.distance !== 'number' || data.distance <= 0)) {
      throw new Error('Distance must be a positive number');
    }
  }

  return data as QuoteRequestDto;
} 