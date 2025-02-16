export interface BaseQuoteFormData {
  propertyType: string
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  cleaningType: string
  frequency: string
  preferredDate: string
  preferredTime: string
  specialRequests?: string
}

export type QuoteStatus = 'pending' | 'paid' | 'completed' | 'cancelled'

export interface CleaningOptions {
  windows: boolean
  deepCleaning: boolean
  carpets: boolean
  furniture: boolean
  appliances: boolean
}

export interface CleaningQuote {
  id: string
  propertyType: string
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  cleaningType: string
  frequency: string
  preferredDate: string
  preferredTime: string
  status: QuoteStatus
  estimatedPrice: number
  createdAt: string
  options: CleaningOptions
  specialRequests?: string
}

export interface QuoteDetails {
  distance: number
  tollCost: number
  fuelCost: number
  baseCost: number
  optionsCost: number
  totalCost: number
}

interface MovingOptions {
  packing: boolean
  assembly: boolean
  disassembly: boolean
  insurance: boolean
  storage: boolean
}

export interface MovingQuote {
  id: string
  status: QuoteStatus
  pickupAddress: string
  deliveryAddress: string
  preferredDate: string
  preferredTime: string
  volume: string
  options: MovingOptions
  estimatedPrice: number
  createdAt: string
}

export interface MovingFormData {
  movingDate: string
  volume: string
  pickupAddress: string
  deliveryAddress: string
  options: {
    packing: boolean
    assembly: boolean
    disassembly: boolean
    insurance: boolean
    storage: boolean
  }
}

export interface CleaningFormData {
  cleaningDate: string
  cleaningType: string
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  frequency: string
  address: string
  options: {
    windows: boolean
    deepCleaning: boolean
    carpets: boolean
    furniture: boolean
    appliances: boolean
  }
} 