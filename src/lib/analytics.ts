// Système de métriques et analytics pour Express Quote
import { logger } from './logger'

// Types pour les événements de métriques
export interface MetricEvent {
  name: string
  category: 'page_view' | 'user_action' | 'conversion' | 'error' | 'performance'
  properties?: Record<string, any>
  value?: number
  timestamp?: Date
  userId?: string
  sessionId?: string
}

export interface PageViewEvent extends MetricEvent {
  category: 'page_view'
  properties: {
    page: string
    service_type?: 'moving' | 'cleaning' | 'catalog' | 'transport' | 'delivery' | 'pack' | 'service'
    user_agent?: string
    referrer?: string
    load_time?: number
  }
}

export interface UserActionEvent extends MetricEvent {
  category: 'user_action'
  properties: {
    action: 'click' | 'form_submit' | 'download' | 'print' | 'payment' | 'booking'
    element?: string
    service_type?: string
    booking_id?: string
  }
}

export interface ConversionEvent extends MetricEvent {
  category: 'conversion'
  properties: {
    funnel_step: 'quote_created' | 'summary_viewed' | 'payment_initiated' | 'booking_completed'
    service_type: string
    booking_id: string
    amount?: number
    success?: boolean
  }
}

export interface ErrorEvent extends MetricEvent {
  category: 'error'
  properties: {
    error_type: 'api_error' | 'component_error' | 'payment_error' | 'validation_error'
    error_message: string
    page?: string
    service_type?: string
    stack_trace?: string
  }
}

export interface PerformanceEvent extends MetricEvent {
  category: 'performance'
  properties: {
    metric_type: 'page_load' | 'api_response' | 'component_render' | 'pdf_generation'
    duration: number
    page?: string
    api_endpoint?: string
    component_name?: string
  }
}

// Client Analytics (côté navigateur)
class AnalyticsClient {
  private sessionId: string
  private userId?: string
  private isEnabled: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = typeof window !== 'undefined' && !this.isLocalDevelopment()
    this.userId = this.getUserId()
  }

  // Génération d'un ID de session unique
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Récupération de l'ID utilisateur (depuis localStorage ou cookie)
  private getUserId(): string | undefined {
    if (typeof window === 'undefined') return undefined
    
    let userId = localStorage.getItem('user_id')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('user_id', userId)
    }
    return userId
  }

  // Vérification de l'environnement de développement
  private isLocalDevelopment(): boolean {
    if (typeof window === 'undefined') return false
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1'
  }

  // Envoi d'un événement de métrique
  async track(event: MetricEvent): Promise<void> {
    if (!this.isEnabled) {
      console.log('📊 Analytics (dev):', event.name, event.properties)
      return
    }

    const enrichedEvent: MetricEvent = {
      ...event,
      timestamp: new Date(),
      sessionId: this.sessionId,
      userId: this.userId
    }

    try {
      // Envoi vers l'API de métriques
      await fetch('/api/metrics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrichedEvent)
      })
    } catch (error) {
      logger.error('Erreur lors de l\'envoi de métrique: ' + (error as Error).message)
    }
  }

  // Méthodes spécialisées pour différents types d'événements
  trackPageView(page: string, serviceType?: string, loadTime?: number): void {
    this.track({
      name: 'page_viewed',
      category: 'page_view',
      properties: {
        page,
        service_type: serviceType,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
        load_time: loadTime
      }
    })
  }

  trackUserAction(action: string, element?: string, serviceType?: string, bookingId?: string): void {
    this.track({
      name: 'user_action',
      category: 'user_action',
      properties: {
        action,
        element,
        service_type: serviceType,
        booking_id: bookingId
      }
    })
  }

  trackConversion(funnelStep: string, serviceType: string, bookingId: string, amount?: number, success: boolean = true): void {
    this.track({
      name: 'conversion',
      category: 'conversion',
      properties: {
        funnel_step: funnelStep,
        service_type: serviceType,
        booking_id: bookingId,
        amount,
        success
      },
      value: amount
    })
  }

  trackError(errorType: string, errorMessage: string, page?: string, serviceType?: string): void {
    this.track({
      name: 'error_occurred',
      category: 'error',
      properties: {
        error_type: errorType,
        error_message: errorMessage,
        page,
        service_type: serviceType,
        stack_trace: new Error().stack
      }
    })
  }

  trackPerformance(metricType: string, duration: number, context?: Record<string, any>): void {
    this.track({
      name: 'performance_metric',
      category: 'performance',
      properties: {
        metric_type: metricType,
        duration,
        ...context
      },
      value: duration
    })
  }

  // Métriques spécifiques au services premium
  trackPremiumServiceUsage(serviceType: 'moving' | 'cleaning', action: string, metadata?: Record<string, any>): void {
    this.track({
      name: 'premium_service_used',
      category: 'user_action',
      properties: {
        action: `premium_${action}`,
        service_type: serviceType,
        is_premium: true,
        ...metadata
      }
    })
  }

  // Métriques pour les nouveaux composants partagés
  trackComponentUsage(componentName: string, action: string, metadata?: Record<string, any>): void {
    this.track({
      name: 'component_used',
      category: 'user_action',
      properties: {
        action: `component_${action}`,
        component_name: componentName,
        ...metadata
      }
    })
  }
}

// Instance globale du client analytics
export const analytics = new AnalyticsClient()

// Hook React pour faciliter l'utilisation des métriques
export function useAnalytics() {
  const trackPageLoad = (page: string, serviceType?: string) => {
    const loadTime = performance.now()
    analytics.trackPageView(page, serviceType, loadTime)
  }

  const trackButtonClick = (buttonName: string, context?: Record<string, any>) => {
    analytics.trackUserAction('click', buttonName, context?.serviceType, context?.bookingId)
  }

  const trackFormSubmit = (formName: string, success: boolean, context?: Record<string, any>) => {
    analytics.trackUserAction('form_submit', formName, context?.serviceType, context?.bookingId)
    
    if (success && context?.bookingId) {
      analytics.trackConversion('quote_created', context.serviceType, context.bookingId)
    }
  }

  const trackPDFDownload = (documentType: string, context?: Record<string, any>) => {
    analytics.trackUserAction('download', `pdf_${documentType}`, context?.serviceType, context?.bookingId)
  }

  const trackPaymentFlow = (step: string, serviceType: string, bookingId: string, amount?: number, success?: boolean) => {
    if (step === 'initiated') {
      analytics.trackConversion('payment_initiated', serviceType, bookingId, amount)
    } else if (step === 'completed' && success) {
      analytics.trackConversion('booking_completed', serviceType, bookingId, amount, true)
    }
  }

  const trackError = (error: Error, context?: Record<string, any>) => {
    analytics.trackError('component_error', error.message, context?.page, context?.serviceType)
  }

  return {
    trackPageLoad,
    trackButtonClick,
    trackFormSubmit,
    trackPDFDownload,
    trackPaymentFlow,
    trackError,
    track: analytics.track.bind(analytics)
  }
}

// Utilitaires pour le serveur
export class ServerAnalytics {
  static async trackAPICall(endpoint: string, method: string, responseTime: number, statusCode: number): Promise<void> {
    logger.info(`API Call: ${method} ${endpoint} - ${statusCode} (${responseTime}ms)`)
    
    // Ici on pourrait envoyer vers un service externe comme DataDog, New Relic, etc.
    // await sendToExternalService({
    //   type: 'api_call',
    //   endpoint,
    //   method,
    //   response_time: responseTime,
    //   status_code: statusCode,
    //   timestamp: new Date()
    // })
  }

  static async trackBusinessMetric(metric: string, value: number, metadata?: Record<string, any>): Promise<void> {
    const metadataStr = metadata ? JSON.stringify(metadata) : ''
    logger.info(`Business Metric: ${metric} = ${value} ${metadataStr}`)
    
    // Envoyer vers un service de business intelligence
  }
}

export default analytics 