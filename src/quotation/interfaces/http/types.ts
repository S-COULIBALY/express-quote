import { ServiceType } from '../../domain/entities/Service';

export interface MovingQuoteRequest {
  pickupAddress: string;
  deliveryAddress: string;
  volume: number;
  hasElevator: boolean;
  floorNumber: number;
  date?: string;
}

export interface CleaningQuoteRequest {
  squareMeters: number;
  numberOfRooms: number;
  frequency: 'ONCE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  hasBalcony?: boolean;
  hasPets?: boolean;
  date?: string;
}

export interface QuoteRequest {
  serviceType: ServiceType;
  context: MovingQuoteRequest | CleaningQuoteRequest;
}

export interface HttpError {
  code: string;
  message: string;
}

export interface HttpResponse<T> {
  success: boolean;
  data?: T;
  error?: HttpError;
} 