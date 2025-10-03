import { BookingStatus } from '../../../domain/enums/BookingStatus';
import { BookingType } from '../../../domain/enums/BookingType';
import { ServiceType } from '../../../domain/enums/ServiceType';

// DTO pour la création d'un client
export interface CustomerDTO {
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// DTO de base pour les réservations
export interface BaseBookingDTO {
  type: BookingType | string; // Accepter également les strings pour faciliter la validation
  customer?: CustomerDTO;     // Customer rendu optionnel
  paymentMethod?: string;
  professionalId?: string;
}

// DTO pour la création d'un déménagement
export interface MovingDTO extends BaseBookingDTO {
  type: BookingType.MOVING_QUOTE | 'MOVING_QUOTE';
  moveDate: string;
  pickupAddress: string;
  deliveryAddress: string;
  distance: number;
  volume: number;
  pickupFloor?: number;
  deliveryFloor?: number;
  pickupElevator?: boolean;
  deliveryElevator?: boolean;
  pickupCarryDistance?: number;
  deliveryCarryDistance?: number;
  propertyType?: string;
  surface?: number;
  rooms?: number;
  occupants?: number;
  packagingOption?: boolean;
  furnitureOption?: boolean;
  fragileOption?: boolean;
  storageOption?: boolean;
  disassemblyOption?: boolean;
  unpackingOption?: boolean;
  suppliesOption?: boolean;
  fragileItemsOption?: boolean;
  items?: any[];
}

// DTO pour la création d'un pack (legacy support - replaced by catalog system)
export interface PackDTO extends BaseBookingDTO {
  id: string;
  bookingId: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
  scheduledDate: string;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// DTO pour la création d'un service
export interface ServiceDTO extends BaseBookingDTO {
  type: BookingType.SERVICE | 'SERVICE' | 'service';
  name: string;
  description: string;
  price: number;
  duration: number;
  includes: string[];
  scheduledDate: string;
  location: string;
}

// DTO pour la réservation simplifiée d'un service existant (depuis la page web)
export interface ServiceReservationDTO extends BaseBookingDTO {
  type: BookingType.SERVICE | 'SERVICE' | 'service';
  serviceId: string;              // ID du service existant à réserver
  scheduledDate: string;          // Date de réservation
  location: string;               // Adresse du service
  duration: number;               // Durée en heures
  workers: number;                // Nombre de professionnels
  defaultDuration?: number;       // Durée par défaut du service
  defaultWorkers?: number;        // Nombre de professionnels par défaut
  basePrice?: number;             // Prix de base du service
  calculatedPrice?: number;       // Prix calculé par le frontend
  additionalInfo?: string;        // Informations supplémentaires
}

// DTO pour la création d'une réservation (union type)
export type BookingRequestDTO = MovingDTO | PackDTO | ServiceDTO | ServiceReservationDTO;

// DTO pour la réponse d'une réservation
export interface BookingResponseDTO {
  id: string;
  type: BookingType;
  status: BookingStatus;
  customer?: CustomerDTO;          // Customer rendu optionnel
  professional?: {
    id: string;
    companyName: string;
    email: string;
    phone: string;
  } | null;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  details?: any;
} 