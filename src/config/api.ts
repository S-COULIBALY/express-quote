export const apiConfig = {
  googleMaps: {
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    baseUrl: 'https://maps.googleapis.com/maps/api',
    isConfigured: () => !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  },
  toolguru: {
    apiKey: process.env.NEXT_PUBLIC_TOOLGURU_API_KEY,
    baseUrl: 'https://api.toolguru.com',
    retryAttempts: 3,
    timeout: 5000,
    isConfigured: () => !!process.env.NEXT_PUBLIC_TOOLGURU_API_KEY
  }
} 