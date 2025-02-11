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

export interface CleaningQuote {
  id: string
  propertyType: string
  cleaningType: string
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  preferredDate: string
  preferredTime: string
  frequency: string
  estimatedPrice: number
  status: QuoteStatus
  createdAt: string
  options: {
    windows: boolean
    deepCleaning: boolean
    carpets: boolean
    furniture: boolean
    appliances: boolean
  }
}

export interface QuoteDetails {
  distance: number
  tollCost: number
  fuelCost: number
  baseCost: number
  optionsCost: number
  totalCost: number
}

export interface MovingQuote {
  id: string
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
  totalCost: number
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