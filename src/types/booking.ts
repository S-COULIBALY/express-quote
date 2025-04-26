export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
}

export interface Pack {
  id: string
  bookingId: string
  name: string
  description: string
  price: number
  includes: string[]
  features?: string[]
  popular?: boolean
  serviceType?: string
  scheduledDate: Date
  pickupAddress: string
  deliveryAddress: string
  duration: number
  workers: number
  additionalInfo?: string
  createdAt: Date
  updatedAt: Date
  includedDistance?: number
  distanceUnit?: string
  workersNeeded?: number
  categoryId?: string
  content?: string
  imagePath?: string
  isAvailable?: boolean
  scheduledTime?: string
  distance?: number
}

export interface Service {
  id: string
  bookingId: string
  name: string
  description: string
  price: number
  categoryId: string
  category?: Category
  serviceType?: string
  duration: number
  workers: number
  includes: string[]
  features?: string[]
  scheduledDate: Date
  additionalInfo?: string
  createdAt: Date
  updatedAt: Date
  imagePath?: string
  location?: string
  scheduledTime?: string
  propertySize?: number
  propertyType?: string
  address?: string
  pickupAddress?: string
  deliveryAddress?: string
  distance?: number
}

export interface Booking {
  id: string
  items: BookingItem[]
  status: 'draft' | 'confirmed' | 'awaiting_payment' | 'payment_processing' | 'payment_failed' | 'payment_completed' | 'canceled' | 'completed'
  customerId?: string
  professionalId?: string
  totalHT: number
  totalTTC: number
  hasInsurance: boolean
  customerData?: any
  confirmedAt?: Date
  createdAt: Date
  updatedAt: Date
  quoteRequestId?: string
  paymentMethod?: string
}

export interface BookingItem {
  id: string
  type: 'pack' | 'service'
  itemId: string
  data: Pack | Service
  price: number
  createdAt: Date
  updatedAt: Date
}

export interface BookingItemData {
  type: 'pack' | 'service'
  data: Pack | Service
} 

export interface BookingData {
  id: string;
  type: string;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  totalAmount: number;
  totalHT?: number;
  totalTTC?: number;
  baseCost?: number;
  volumeCost?: number;
  distancePrice?: number;
  optionsCost?: number;
  tollCost?: number;
  fuelCost?: number;
  createdAt: string | Date;
  moveDate?: string | Date;
  scheduledDate?: string | Date;
  scheduledTime?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupFloor?: number;
  pickupElevator?: boolean;
  deliveryFloor?: number;
  deliveryElevator?: boolean;
  volume?: number;
  distance?: number;
  propertyType?: string;
  packName?: string;
  serviceName?: string;
  description?: string;
  location?: string;
  packagingOption?: boolean;
  furnitureOption?: boolean;
  fragileOption?: boolean;
  storageOption?: boolean;
  disassemblyOption?: boolean;
  unpackingOption?: boolean;
  suppliesOption?: boolean;
  fragileItemsOption?: boolean;
} 