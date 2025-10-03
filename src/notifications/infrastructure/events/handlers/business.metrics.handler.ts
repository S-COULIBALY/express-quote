/**
 * 📈 BUSINESS METRICS HANDLER - Métriques business simples
 * 
 * Handler léger qui enrichit les métriques existantes avec des données business :
 * - Utilise le MetricsCollector existant (pas de duplication)
 * - Ajoute des tags business aux métriques Prometheus
 * - Exploite l'infrastructure Docker (Grafana/Prometheus)
 * - Focus sur les KPIs business spécifiques
 */

import { EventHandler, NotificationCreatedEvent, NotificationSentEvent, NotificationFailedEvent } from '../modern.event.bus';

export class BusinessMetricsHandler implements EventHandler<any> {
  name = 'business-metrics-enricher';
  priority = 5; // Moins prioritaire que les handlers critiques
  timeout = 1000; // Handler léger et rapide
  
  constructor(private metricsCollector: any) {
    // Utilise le MetricsCollector existant du service principal
  }
  
  /**
   * Handler principal - enrichit les métriques business
   */
  async handle(event: NotificationCreatedEvent | NotificationSentEvent | NotificationFailedEvent): Promise<void> {
    try {
      // Extraire les métadonnées business
      const businessTags = this.extractBusinessTags(event);
      
      // Enrichir les métriques existantes avec des tags business
      if ('templateId' in event) {
        // NotificationCreatedEvent
        this.metricsCollector.recordMetric('notification.business.created', 1, businessTags);
      } else if ('deliveryTime' in event) {
        // NotificationSentEvent - enrichir avec coût et performance
        const sentEvent = event as NotificationSentEvent;
        this.metricsCollector.recordMetric('notification.business.cost', sentEvent.cost || 0, businessTags);
        this.metricsCollector.recordMetric('notification.business.delivery_time', sentEvent.deliveryTime, businessTags);
      } else if ('error' in event) {
        // NotificationFailedEvent - catégoriser les erreurs
        const failedEvent = event as NotificationFailedEvent;
        this.metricsCollector.recordMetric('notification.business.failure', 1, {
          ...businessTags,
          error_category: this.categorizeError(failedEvent.error),
          can_retry: failedEvent.canRetry.toString()
        });
      }
      
    } catch (error) {
      // Handler silencieux - ne doit pas impacter le flux principal
      console.warn('BusinessMetricsHandler error:', error);
    }
  }
  
  /**
   * Extraire les tags business des événements
   */
  private extractBusinessTags(event: any): Record<string, string> {
    const tags: Record<string, string> = {
      channel: event.channel.toLowerCase(),
      recipient_type: this.detectRecipientType(event.recipientId)
    };
    
    // Tags spécifiques selon les métadonnées
    if (event.metadata) {
      // Service type (booking, payment, marketing, etc.)
      if (event.metadata.serviceType) {
        tags.service_type = event.metadata.serviceType;
      }
      
      // Customer segment
      if (event.metadata.customerSegment) {
        tags.customer_segment = event.metadata.customerSegment;
      }
      
      // Région géographique
      if (event.metadata.region) {
        tags.region = event.metadata.region;
      }
      
      // Type de notification business
      if (event.metadata.notificationType) {
        tags.notification_type = event.metadata.notificationType;
      }
    }
    
    // Tags par priorité
    if ('priority' in event) {
      tags.priority = event.priority.toLowerCase();
    }
    
    return tags;
  }
  
  /**
   * Détecter le type de destinataire
   */
  private detectRecipientType(recipientId: string): string {
    if (recipientId.includes('@')) {
      return 'email';
    } else if (recipientId.match(/^\+?\d+$/)) {
      return 'phone';
    }
    return 'unknown';
  }
  
  /**
   * Catégoriser les erreurs pour les métriques
   */
  private categorizeError(error: string): string {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('auth') || errorLower.includes('credential')) {
      return 'authentication';
    } else if (errorLower.includes('rate') || errorLower.includes('limit')) {
      return 'rate_limiting';
    } else if (errorLower.includes('invalid') || errorLower.includes('format')) {
      return 'validation';
    } else if (errorLower.includes('network') || errorLower.includes('timeout')) {
      return 'network';
    } else if (errorLower.includes('quota') || errorLower.includes('billing')) {
      return 'quota';
    }
    
    return 'other';
  }
}