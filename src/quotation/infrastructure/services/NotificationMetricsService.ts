import { injectable } from 'tsyringe';
import { logger } from '@/lib/logger';

export type NotificationChannelType = 'email' | 'whatsapp';
export type NotificationEventType = 'sent' | 'delivered' | 'read' | 'failed' | 'retry';
export type NotificationCategoryType = 'quote_request' | 'quote_confirmation' | 'booking' | 'payment' | 'cancellation' | 'reminder';

export interface NotificationEvent {
  id: string;
  channel: NotificationChannelType;
  category: NotificationCategoryType;
  eventType: NotificationEventType;
  timestamp: Date;
  recipient?: string;
  metadata?: Record<string, any>;
  error?: Error;
  attempts?: number;
}

interface ChannelMetrics {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  retry: number;
}

interface CategoryMetrics {
  email: ChannelMetrics;
  whatsapp: ChannelMetrics;
  total: ChannelMetrics;
}

interface NotificationMetrics {
  total: {
    email: ChannelMetrics;
    whatsapp: ChannelMetrics;
    both: ChannelMetrics;
  };
  categories: Record<NotificationCategoryType, CategoryMetrics>;
  // Métriques temporelles
  lastHour: {
    email: ChannelMetrics;
    whatsapp: ChannelMetrics;
    both: ChannelMetrics;
  };
  lastDay: {
    email: ChannelMetrics;
    whatsapp: ChannelMetrics;
    both: ChannelMetrics;
  };
  // Liste des 100 derniers événements pour le débogage
  recentEvents: NotificationEvent[];
}

/**
 * Service pour suivre les métriques des notifications
 */
@injectable()
export class NotificationMetricsService {
  private metricsLogger = logger.withContext('NotificationMetrics');
  private metrics: NotificationMetrics;
  private events: NotificationEvent[] = [];
  
  // Pour les métriques temporelles
  private lastReset: Date = new Date();
  private hourlyResets: Date[] = [];
  private dailyResets: Date[] = [];

  constructor() {
    this.metrics = this.initializeMetrics();
    
    // Initialiser les intervalles de rafraîchissement des métriques
    this.setupMetricsRefresh();
  }

  /**
   * Initialise la structure des métriques
   */
  private initializeMetrics(): NotificationMetrics {
    const emptyChannelMetrics = (): ChannelMetrics => ({
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      retry: 0
    });

    const emptyCategoryMetrics = (): CategoryMetrics => ({
      email: emptyChannelMetrics(),
      whatsapp: emptyChannelMetrics(),
      total: emptyChannelMetrics()
    });

    const categories: Record<NotificationCategoryType, CategoryMetrics> = {
      quote_request: emptyCategoryMetrics(),
      quote_confirmation: emptyCategoryMetrics(),
      booking: emptyCategoryMetrics(),
      payment: emptyCategoryMetrics(),
      cancellation: emptyCategoryMetrics(),
      reminder: emptyCategoryMetrics()
    };

    return {
      total: {
        email: emptyChannelMetrics(),
        whatsapp: emptyChannelMetrics(),
        both: emptyChannelMetrics()
      },
      categories,
      lastHour: {
        email: emptyChannelMetrics(),
        whatsapp: emptyChannelMetrics(),
        both: emptyChannelMetrics()
      },
      lastDay: {
        email: emptyChannelMetrics(),
        whatsapp: emptyChannelMetrics(),
        both: emptyChannelMetrics()
      },
      recentEvents: []
    };
  }

  /**
   * Configure les intervalles de rafraîchissement des métriques
   */
  private setupMetricsRefresh(): void {
    // Rafraîchissement des métriques horaires
    setInterval(() => {
      this.hourlyResets.push(new Date());
      if (this.hourlyResets.length > 24) {
        this.hourlyResets.shift(); // Garder seulement les 24 dernières heures
      }
      
      this.metrics.lastHour = {
        email: { sent: 0, delivered: 0, read: 0, failed: 0, retry: 0 },
        whatsapp: { sent: 0, delivered: 0, read: 0, failed: 0, retry: 0 },
        both: { sent: 0, delivered: 0, read: 0, failed: 0, retry: 0 }
      };
      
      this.metricsLogger.info('Métriques horaires réinitialisées');
    }, 60 * 60 * 1000); // Toutes les heures
    
    // Rafraîchissement des métriques journalières
    setInterval(() => {
      this.dailyResets.push(new Date());
      if (this.dailyResets.length > 30) {
        this.dailyResets.shift(); // Garder seulement les 30 derniers jours
      }
      
      this.metrics.lastDay = {
        email: { sent: 0, delivered: 0, read: 0, failed: 0, retry: 0 },
        whatsapp: { sent: 0, delivered: 0, read: 0, failed: 0, retry: 0 },
        both: { sent: 0, delivered: 0, read: 0, failed: 0, retry: 0 }
      };
      
      this.metricsLogger.info('Métriques journalières réinitialisées');
    }, 24 * 60 * 60 * 1000); // Tous les jours
  }

  /**
   * Enregistre un événement de notification
   */
  trackEvent(event: NotificationEvent): void {
    // Ajouter à la liste des événements
    this.events.push(event);
    
    // Limiter la taille de la liste
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
    
    // Mettre à jour les métriques récentes
    this.metrics.recentEvents.push(event);
    if (this.metrics.recentEvents.length > 100) {
      this.metrics.recentEvents.shift();
    }
    
    // Mettre à jour les métriques globales
    this.updateMetrics(event);
    
    // Journalisation
    this.metricsLogger.info(
      `Événement de notification: ${event.channel} ${event.category} ${event.eventType}`,
      { id: event.id, recipient: event.recipient, attempts: event.attempts }
    );
  }

  /**
   * Met à jour les métriques à partir d'un événement
   */
  private updateMetrics(event: NotificationEvent): void {
    const { channel, category, eventType } = event;
    
    // Mettre à jour les métriques totales par canal
    this.metrics.total[channel][eventType]++;
    this.metrics.total.both[eventType]++;
    
    // Mettre à jour les métriques par catégorie
    this.metrics.categories[category][channel][eventType]++;
    this.metrics.categories[category].total[eventType]++;
    
    // Mettre à jour les métriques temporelles
    this.metrics.lastHour[channel][eventType]++;
    this.metrics.lastHour.both[eventType]++;
    
    this.metrics.lastDay[channel][eventType]++;
    this.metrics.lastDay.both[eventType]++;
  }

  /**
   * Renvoie les métriques actuelles
   */
  getMetrics(): NotificationMetrics {
    return { ...this.metrics };
  }

  /**
   * Renvoie les métriques pour une période spécifique
   */
  getMetricsForPeriod(startDate: Date, endDate: Date): NotificationMetrics {
    // Filtrer les événements dans la période
    const filteredEvents = this.events.filter(
      event => event.timestamp >= startDate && event.timestamp <= endDate
    );
    
    // Initialiser de nouvelles métriques
    const periodMetrics = this.initializeMetrics();
    
    // Mettre à jour les métriques avec les événements filtrés
    filteredEvents.forEach(event => {
      const { channel, category, eventType } = event;
      
      periodMetrics.total[channel][eventType]++;
      periodMetrics.total.both[eventType]++;
      
      periodMetrics.categories[category][channel][eventType]++;
      periodMetrics.categories[category].total[eventType]++;
    });
    
    // Ajouter les événements récents pour cette période
    periodMetrics.recentEvents = filteredEvents.slice(-100);
    
    return periodMetrics;
  }

  /**
   * Calcule le taux de succès pour un canal
   */
  getSuccessRate(channel: NotificationChannelType | 'both' = 'both'): number {
    const metrics = this.metrics.total[channel];
    const total = metrics.sent + metrics.failed;
    
    if (total === 0) return 100; // Pas d'envois
    
    // Le taux de succès est le pourcentage de messages envoyés par rapport au total
    return (metrics.sent / total) * 100;
  }

  /**
   * Calcule le taux de lecture pour un canal
   */
  getReadRate(channel: NotificationChannelType | 'both' = 'both'): number {
    const metrics = this.metrics.total[channel];
    
    if (metrics.sent === 0) return 0; // Pas d'envois
    
    // Le taux de lecture est le pourcentage de messages lus par rapport aux messages envoyés
    return (metrics.read / metrics.sent) * 100;
  }

  /**
   * Calcule le taux d'erreur pour un canal
   */
  getErrorRate(channel: NotificationChannelType | 'both' = 'both'): number {
    const metrics = this.metrics.total[channel];
    const total = metrics.sent + metrics.failed;
    
    if (total === 0) return 0; // Pas d'envois
    
    // Le taux d'erreur est le pourcentage de messages en échec par rapport au total
    return (metrics.failed / total) * 100;
  }

  /**
   * Obtient les statistiques pour les retries
   */
  getRetryStats(): { count: number, rate: number } {
    const total = this.metrics.total.both.sent + this.metrics.total.both.failed;
    const retryCount = this.metrics.total.both.retry;
    
    return {
      count: retryCount,
      rate: total > 0 ? (retryCount / total) * 100 : 0
    };
  }
} 