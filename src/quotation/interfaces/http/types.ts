import { ServiceType } from '../../domain/enums/ServiceType';

export interface MovingQuoteRequest {
  volume: number;
  distance: number;
  pickupFloor: number;
  deliveryFloor: number;
  pickupElevator: boolean;
  deliveryElevator: boolean;
  pickupAddress: string;
  deliveryAddress: string;
}

export interface CleaningQuoteRequest {
  surfaceArea: number;
  roomCount: number;
  cleaningType: string;
  location: string;
}

export interface QuoteRequest {
  serviceType: string;
  context: MovingQuoteRequest | CleaningQuoteRequest;
}

export interface HttpError {
  code: string;
  message: string;
}

export interface HttpRequest {
  body: any;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  headers: Record<string, string | string[]>;
}

export interface HttpResponse<T = any> {
  status: (code: number) => HttpResponse<T>;
  json: (data: T) => HttpResponse<T>;
  send: () => HttpResponse<T>;
} 