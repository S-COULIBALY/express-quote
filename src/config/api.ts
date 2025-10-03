export const apiConfig = {
  googleMaps: {
    baseUrl: 'https://maps.googleapis.com/maps/api',
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyCDFjTXdcIYzwAABbLn-S1J_RO8r9ixUVE',
    isConfigured: () => true
  }
} 