import { QuoteType, QuoteStatus } from '../../domain/enums/QuoteType';
import { ServiceType } from '../../domain/enums/ServiceType';

export interface CustomerDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface QuoteDTO {
  id: string;
  type: QuoteType;
  status: QuoteStatus;
  customer: CustomerDTO;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Moving specific
  moveDate?: Date;
  pickupAddress?: string;
  deliveryAddress?: string;
  distance?: number;
  volume?: number;
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
  
  // Pack specific
  packId?: string;
  packName?: string;
  scheduledDate?: Date;
  
  // Service specific
  serviceId?: string;
  serviceName?: string;
  description?: string;
  scheduledTime?: string;
  location?: string;
  
  // Options
  packagingOption?: boolean;
  furnitureOption?: boolean;
  fragileOption?: boolean;
  storageOption?: boolean;
  disassemblyOption?: boolean;
  unpackingOption?: boolean;
  suppliesOption?: boolean;
  fragileItemsOption?: boolean;
  
  // Costs
  baseCost?: number;
  volumeCost?: number;
  distancePrice?: number;
  optionsCost?: number;
  tollCost?: number;
  fuelCost?: number;
} 