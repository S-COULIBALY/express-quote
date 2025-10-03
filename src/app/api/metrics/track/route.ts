import { NextRequest, NextResponse } from 'next/server'
// Logger removed from legacy system - using console for now
// import { logger } from '@/lib/logger'
import { MetricEvent, ServerAnalytics } from '@/lib/analytics'

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    const event: MetricEvent = await request.json()
    // const metricsLogger = logger.withContext('Metrics')
    const metricsLogger = console // Temporary fallback
    
    // Validation des données
    if (!event.name || !event.category) {
      return NextResponse.json({
        success: false,
        error: 'Nom et catégorie de l\'événement requis'
      }, { status: 400 })
    }

    // Enrichissement avec des métadonnées serveur
    const enrichedEvent = {
      ...event,
      server_timestamp: new Date(),
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent') || 'unknown'
    }

    // Log de l'événement selon sa catégorie
    switch (event.category) {
      case 'page_view':
        metricsLogger.info(`Page View: ${event.properties?.page} (${event.properties?.service_type || 'unknown'})`)
        break
        
      case 'user_action':
        metricsLogger.info(`User Action: ${event.properties?.action} on ${event.properties?.element || 'unknown'}`)
        break
        
      case 'conversion':
        metricsLogger.info(`Conversion: ${event.properties?.funnel_step} for ${event.properties?.service_type} (${event.value || 0}€)`)
        break
        
      case 'error':
        metricsLogger.error(`Error Event: ${event.properties?.error_type} - ${event.properties?.error_message}`)
        break
        
      case 'performance':
        metricsLogger.info(`Performance: ${event.properties?.metric_type} took ${event.value || 0}ms`)
        break
        
      default:
        metricsLogger.info(`Generic Event: ${event.name}`)
    }

    // Traitement spécial pour certains événements
    await processSpecialEvents(enrichedEvent)
    
    // Simulation de stockage (dans un vrai projet, utiliser une DB)
    await storeMetric(enrichedEvent)
    
    // Tracking de l'appel API lui-même
    const responseTime = Date.now() - startTime
    await ServerAnalytics.trackAPICall('/api/metrics/track', 'POST', responseTime, 200)

    return NextResponse.json({
      success: true,
      event_id: generateEventId(),
      processed_at: new Date()
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Erreur lors du traitement de métrique: ' + (error as Error).message)
    
    // Tracking de l'erreur API
    await ServerAnalytics.trackAPICall('/api/metrics/track', 'POST', responseTime, 500)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 })
  }
}

// Endpoint pour récupérer des métriques (dashboard admin)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '24h'
    const category = searchParams.get('category')
    const serviceType = searchParams.get('service_type')
    
    // Simulation de récupération de métriques
    const metrics = await getMetrics(timeframe, category, serviceType)
    
    return NextResponse.json({
      success: true,
      timeframe,
      data: metrics
    })

  } catch (error) {
    console.error('Erreur lors de la récupération des métriques: ' + (error as Error).message)
    
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération'
    }, { status: 500 })
  }
}

// Fonctions utilitaires

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}

function generateEventId(): string {
  return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

async function processSpecialEvents(event: MetricEvent): Promise<void> {
  // Traitement spécial pour les conversions importantes
  if (event.category === 'conversion' && event.properties?.funnel_step === 'booking_completed') {
    await ServerAnalytics.trackBusinessMetric('booking_completion', 1, {
      service_type: event.properties.service_type,
      amount: event.value || 0
    })
  }
  
  // Alertes pour les erreurs critiques
  if (event.category === 'error' && event.properties?.error_type === 'payment_error') {
    console.error(`ALERTE CRITIQUE: Erreur de paiement - ${event.properties.error_message}`)
    // Ici on pourrait envoyer une notification Slack/email
  }
  
  // Métriques de performance
  if (event.category === 'performance' && event.value && event.value > 5000) {
    console.warn(`PERFORMANCE: Opération lente détectée - ${event.properties?.metric_type} (${event.value}ms)`)
  }
}

async function storeMetric(event: MetricEvent): Promise<void> {
  // Simulation de stockage
  // Dans un vrai projet, sauvegarder en DB (Prisma, MongoDB, etc.)
  
  // On pourrait aussi envoyer vers des services externes :
  // - Google Analytics
  // - Mixpanel
  // - Amplitude
  // - DataDog
  // - New Relic
  
  console.log(`Métrique stockée: ${event.name}`)
}

async function getMetrics(timeframe: string, category?: string | null, serviceType?: string | null): Promise<any> {
  // Simulation de récupération de métriques
  // Dans un vrai projet, faire des requêtes DB avec filtres
  
  const now = new Date()
  const timeframeHours = timeframe === '7d' ? 168 : timeframe === '24h' ? 24 : 1
  
  return {
    summary: {
      total_events: Math.floor(Math.random() * 1000),
      unique_users: Math.floor(Math.random() * 100),
      page_views: Math.floor(Math.random() * 500),
      conversions: Math.floor(Math.random() * 50),
      errors: Math.floor(Math.random() * 10)
    },
    breakdown_by_service: {
      moving: Math.floor(Math.random() * 200),
      cleaning: Math.floor(Math.random() * 150),
      catalog: Math.floor(Math.random() * 300)
    },
    top_pages: [
      { page: '/summary/quote', views: Math.floor(Math.random() * 100) },
      { page: '/catalogue', views: Math.floor(Math.random() * 80) },
      { page: '/catalogue', views: Math.floor(Math.random() * 120) }
    ],
    conversion_funnel: {
      quote_created: Math.floor(Math.random() * 100),
      summary_viewed: Math.floor(Math.random() * 80),
      payment_initiated: Math.floor(Math.random() * 60),
      booking_completed: Math.floor(Math.random() * 50)
    },
    timeframe,
    category,
    service_type: serviceType,
    generated_at: now
  }
} 