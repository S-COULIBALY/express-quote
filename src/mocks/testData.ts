import { CleaningQuote } from '@/types/quote'
import { MovingQuote } from '@/types/quote'

export const mockQuotes: CleaningQuote[] = [
  {
    id: '1',
    propertyType: 'apartment',
    cleaningType: 'standard',
    squareMeters: '80',
    numberOfRooms: '3',
    numberOfBathrooms: '1',
    preferredDate: '2024-04-01',
    preferredTime: '09:00',
    frequency: 'one-time',
    estimatedPrice: 250,
    status: 'pending',
    createdAt: '2024-03-15T10:00:00Z',
    options: {
      windows: false,
      deepCleaning: false,
      carpets: false,
      furniture: false,
      appliances: false
    }
  },
  {
    id: '2',
    propertyType: 'house',
    cleaningType: 'deep',
    squareMeters: '150',
    numberOfRooms: '5',
    numberOfBathrooms: '2',
    preferredDate: '2024-04-02',
    preferredTime: '14:00',
    frequency: 'weekly',
    estimatedPrice: 450,
    status: 'paid',
    createdAt: '2024-03-16T11:00:00Z',
    options: {
      windows: false,
      deepCleaning: true,
      carpets: true,
      furniture: false,
      appliances: true
    }
  },
  // ... autres devis de test
]

export const mockMovingQuotes: MovingQuote[] = [
  {
    id: '1',
    status: 'pending',
    estimatedPrice: 250,
    pickupAddress: '123 Rue Départ',
    deliveryAddress: '456 Rue Arrivée',
    volume: '30',
    createdAt: '2024-03-15T10:00:00Z',
    preferredDate: '2024-04-01',
    preferredTime: '09:00',
    options: {
      packing: false,
      assembly: false,
      disassembly: false,
      insurance: true,
      storage: false
    }
  }
] 