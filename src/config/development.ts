import { CleaningQuote } from '@/types/quote'

export const developmentConfig = {
  api: {
    baseUrl: 'http://localhost:3000/api',
    mockEnabled: true
  },
  features: {
    paymentEnabled: true,
    notificationsEnabled: true
  },
  demo: {
    quotes: [
      {
        id: 'demo-1',
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
      // ... autres devis de démonstration
    ] as CleaningQuote[]
  }
} 