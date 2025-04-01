import { BookingStatus } from '../../../domain/enums/BookingStatus';
import { BookingType } from '../../../domain/enums/BookingType';
import { ServiceType } from '../../../domain/enums/ServiceType';
import { Pack } from '../../../domain/entities/Pack';

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
  type: BookingType;
  customer: CustomerDTO;
  paymentMethod?: string;
  professionalId?: string;
}

// DTO pour la création d'un déménagement
export interface MovingDTO extends BaseBookingDTO {
  type: BookingType.MOVING_QUOTE;
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

// DTO pour la création d'un pack
export class PackDTO {
  id: string;
  bookingId: string;
  name: string;
  description: string;
  price: number;
  includes: string[];
  scheduledDate: Date;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(pack: Pack) {
    this.id = pack.getId();
    this.bookingId = pack.getBookingId() || '';
    this.name = pack.getName();
    this.description = pack.getDescription();
    this.price = pack.getPrice().getAmount();
    this.includes = pack.getIncludedItems();
    this.scheduledDate = new Date(); // Valeur par défaut car non disponible dans l'entité
    this.pickupAddress = ''; // Valeur par défaut car non disponible dans l'entité
    this.deliveryAddress = ''; // Valeur par défaut car non disponible dans l'entité
    // Les propriétés createdAt et updatedAt seront ajoutées si disponibles
  }
}

// DTO pour la création d'un service
export interface ServiceDTO extends BaseBookingDTO {
  type: BookingType.SERVICE;
  name: string;
  description: string;
  price: number;
  duration: number;
  includes: string[];
  scheduledDate: string;
  location: string;
}

// DTO pour la création d'une réservation (union type)
export type BookingRequestDTO = MovingDTO | PackDTO | ServiceDTO;

// DTO pour la réponse d'une réservation
export interface BookingResponseDTO {
  id: string;
  type: BookingType;
  status: BookingStatus;
  customer: CustomerDTO;
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