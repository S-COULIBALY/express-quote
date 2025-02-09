import { CleaningQuote } from '@/types/quote'

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
    createdAt: '2024-03-15T10:00:00Z'
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
    createdAt: '2024-03-16T11:00:00Z'
  },
  // ... autres devis de test
] 