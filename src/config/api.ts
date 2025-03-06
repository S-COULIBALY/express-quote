export const apiConfig = {
  googleMaps: {
    baseUrl: 'https://maps.googleapis.com/maps/api',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    isConfigured: () => !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  },
  toolguru: {
    baseUrl: process.env.NEXT_PUBLIC_TOOLGURU_BASE_URL || 'https://api.toolguru.com',
    apiKey: process.env.NEXT_PUBLIC_TOOLGURU_API_KEY || '',
    retryAttempts: 3,
    isConfigured: () => !!process.env.NEXT_PUBLIC_TOOLGURU_API_KEY
  }
} 