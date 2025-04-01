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
  packaging?: boolean
  furniture?: boolean
  fragile?: boolean
  storage?: boolean
  disassembly?: boolean
  unpacking?: boolean
  supplies?: boolean
  fragileItems?: boolean
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
  pickupAddress: string
  deliveryAddress: string
  movingDate: string
  volume: string
  propertyType: string
  surface: string
  rooms: string
  occupants: string
  pickupFloor: string
  deliveryFloor: string
  pickupElevator: string
  deliveryElevator: string
  pickupCarryDistance: string
  deliveryCarryDistance: string
  options: {
    packaging?: boolean
    furniture?: boolean
    fragile?: boolean
    storage?: boolean
    disassembly?: boolean
    unpacking?: boolean
    supplies?: boolean
    fragileItems?: boolean
  }
}

export interface CleaningFormData {
  cleaningType: 'standard' | 'deep' | 'movingOut' | 'postConstruction'
  squareMeters: string
  numberOfRooms: string
  numberOfBathrooms: string
  frequency: 'oneTime' | 'weekly' | 'biweekly' | 'monthly'
  hasBalcony: boolean
  hasPets: boolean
  cleaningDate: string
  address: string
  balconySize: string
  propertyState: string
  floorTypes: {
    parquet: boolean
    carpet: boolean
    tile: boolean
    vinyl: boolean
    marble: boolean
  }
  options: {
    windows: boolean
    deepCleaning: boolean
    carpets: boolean
    furniture: boolean
    appliances: boolean
    ironing: boolean
    dishes: boolean
    bedding: boolean
    garbage: boolean
    sanitizing: boolean
  }
}

export interface TripCosts {
  tollCost: number
  fuelCost: number
  distance: number
}

export interface GoogleMapsResponse {
  status: string
  destination_addresses: string[]
  origin_addresses: string[]
  rows: Array<{
    elements: Array<{
      distance: {
        text: string
        value: number
      }
      duration: {
        text: string
        value: number
      }
      status: string
    }>
  }>
}

export interface AddressDetails {
  pickup: google.maps.places.PlaceResult | null
  delivery: google.maps.places.PlaceResult | null
}

export interface MovingProps {
  type: 'moving'
  formData: MovingFormData
  quoteDetails?: QuoteDetails
  addressDetails: AddressDetails
  isCalculating?: boolean
}

export interface QuoteResult {
  basePrice: number
  discounts: Array<{
    type: string
    amount: number
  }>
  totalPrice: number
} 