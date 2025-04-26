export const productionConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    mockEnabled: false
  },
  features: {
    paymentEnabled: true,
    notificationsEnabled: true
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: 'production'
  },
  cache: {
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60 * 24 // 24 heures
  }
} 