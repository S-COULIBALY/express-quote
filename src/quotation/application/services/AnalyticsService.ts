import { injectable, inject } from 'tsyringe';
import { NotificationMetricsService } from '../../infrastructure/services/NotificationMetricsService';
import { WhatsAppAnalytics } from '../../infrastructure/services/whatsapp/WhatsAppAnalytics';
import { IBookingRepository } from '../../domain/repositories/IBookingRepository';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository';
import { IQuoteRequestRepository } from '../../domain/repositories/IQuoteRequestRepository';
import { logger } from '@/lib/logger';
import { Booking } from '../../domain/entities/Booking';
import { Customer } from '../../domain/entities/Customer';
import { QuoteRequest } from '../../domain/entities/QuoteRequest';

// Types pour les analytics
export interface BusinessMetrics {
  totalBookings: number;
  totalCustomers: number;
  totalQuoteRequests: number;
  totalRevenue: number;
  averageBookingValue: number;
  conversionRate: number; // Devis -> Réservation
  customerRetentionRate: number;
  period?: {
    start: Date;
    end: Date;
  };
}

export interface PerformanceMetrics {
  averageQuoteResponseTime: number;
  averageBookingProcessingTime: number;
  systemUptime: number;
  errorRate: number;
  apiResponseTime: number;
  period?: {
    start: Date;
    end: Date;
  };
}

export interface UserBehaviorMetrics {
  pageViews: Record<string, number>;
  userJourney: Array<{
    step: string;
    completionRate: number;
    dropOffRate: number;
  }>;
  popularServices: Array<{
    service: string;
    count: number;
    revenue: number;
  }>;
  peakUsageHours: Array<{
    hour: number;
    activity: number;
  }>;
}

export interface AnalyticsReport {
  period: {
    start: Date;
    end: Date;
  };
  business: BusinessMetrics;
  performance: PerformanceMetrics;
  userBehavior: UserBehaviorMetrics;
  notifications: any; // Provient du NotificationMetricsService
  whatsapp: any; // Provient du WhatsAppAnalytics
  generated: Date;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  category: string;
  data: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

/**
 * Service centralisé pour les analytics et métriques
 * Unifie les métriques de notification, WhatsApp et business
 */
@injectable()
export class AnalyticsService {
  private analyticsLogger = logger.withContext('AnalyticsService');
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS_HISTORY = 50000;

  constructor(
    @inject('NotificationMetricsService') private notificationMetricsService: NotificationMetricsService,
    @inject('WhatsAppAnalytics') private whatsAppAnalytics: WhatsAppAnalytics,
    @inject('IBookingRepository') private bookingRepository: IBookingRepository,
    @inject('ICustomerRepository') private customerRepository: ICustomerRepository,
    @inject('IQuoteRequestRepository') private quoteRequestRepository: IQuoteRequestRepository
  ) {}

  /**
   * Enregistre un événement analytics
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      ...event
    };

    this.events.push(analyticsEvent);

    // Limiter l'historique
    if (this.events.length > this.MAX_EVENTS_HISTORY) {
      this.events = this.events.slice(-this.MAX_EVENTS_HISTORY);
    }

    this.analyticsLogger.debug('Event tracked', {
      eventType: event.eventType,
      category: event.category,
      data: event.data
    });
  }

  /**
   * Génère un rapport d'analytics complet
   */
  async generateReport(period: {
    start: Date;
    end: Date;
  }): Promise<AnalyticsReport> {
    this.analyticsLogger.info('Génération du rapport d\'analytics', { period });

    const [business, performance, userBehavior, notifications, whatsapp] = await Promise.all([
      this.getBusinessMetrics(period),
      this.getPerformanceMetrics(period),
      this.getUserBehaviorMetrics(period),
      this.notificationMetricsService.getMetricsForPeriod(period.start, period.end),
      this.whatsAppAnalytics.getMetrics(period)
    ]);

    const report: AnalyticsReport = {
      period,
      business,
      performance,
      userBehavior,
      notifications,
      whatsapp,
      generated: new Date()
    };

    this.analyticsLogger.info('Rapport d\'analytics généré', {
      period,
      totalBookings: business.totalBookings,
      totalRevenue: business.totalRevenue
    });

    return report;
  }

  /**
   * Obtient les métriques business
   */
  async getBusinessMetrics(period: { start: Date; end: Date }): Promise<BusinessMetrics> {
    try {
      const [bookings, customers, quoteRequests] = await Promise.all([
        this.bookingRepository.findByDateRange(period.start, period.end),
        this.customerRepository.findAll(),
        this.quoteRequestRepository.findAll()
      ]);

      const totalRevenue = bookings.reduce((sum, booking) => sum + booking.getTotalAmount().getAmount(), 0);
      const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

      // Calculer le taux de conversion (devis -> réservation)
      const quotesInPeriod = quoteRequests.filter(q => 
        q.getCreatedAt() >= period.start && q.getCreatedAt() <= period.end
      );
      const conversionRate = quotesInPeriod.length > 0 ? (bookings.length / quotesInPeriod.length) * 100 : 0;

      // Calculer le taux de rétention client (simplifié)
      const returningCustomers = customers.filter(c => 
        bookings.filter(b => b.getCustomer()?.getId() === c.getId()).length > 1
      );
      const customerRetentionRate = customers.length > 0 ? (returningCustomers.length / customers.length) * 100 : 0;

      return {
        totalBookings: bookings.length,
        totalCustomers: customers.length,
        totalQuoteRequests: quotesInPeriod.length,
        totalRevenue,
        averageBookingValue,
        conversionRate,
        customerRetentionRate,
        period
      };
    } catch (error) {
      this.analyticsLogger.error('Erreur lors du calcul des métriques business', { error });
      return this.getEmptyBusinessMetrics(period);
    }
  }

  /**
   * Obtient les métriques de performance
   */
  async getPerformanceMetrics(period: { start: Date; end: Date }): Promise<PerformanceMetrics> {
    try {
      // Calculer les temps de réponse moyens à partir des événements
      const responseTimeEvents = this.events.filter(e => 
        e.eventType === 'quote_response_time' || e.eventType === 'booking_processing_time'
      );

      const avgQuoteResponseTime = this.calculateAverageResponseTime(
        responseTimeEvents.filter(e => e.eventType === 'quote_response_time')
      );

      const avgBookingProcessingTime = this.calculateAverageResponseTime(
        responseTimeEvents.filter(e => e.eventType === 'booking_processing_time')
      );

      // Calculer le taux d'erreur
      const errorEvents = this.events.filter(e => e.eventType === 'error');
      const totalEvents = this.events.length;
      const errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;

      // Calculer le temps de fonctionnement (simplifié)
      const systemUptime = 99.9; // À implémenter avec de vraies métriques système

      return {
        averageQuoteResponseTime: avgQuoteResponseTime,
        averageBookingProcessingTime: avgBookingProcessingTime,
        systemUptime,
        errorRate,
        apiResponseTime: 250, // À calculer à partir des vraies métriques
        period
      };
    } catch (error) {
      this.analyticsLogger.error('Erreur lors du calcul des métriques de performance', { error });
      return this.getEmptyPerformanceMetrics(period);
    }
  }

  /**
   * Obtient les métriques de comportement utilisateur
   */
  async getUserBehaviorMetrics(period: { start: Date; end: Date }): Promise<UserBehaviorMetrics> {
    try {
      const pageViewEvents = this.events.filter(e => e.eventType === 'page_view');
      const serviceEvents = this.events.filter(e => e.eventType === 'service_request');

      // Calculer les vues de page
      const pageViews = pageViewEvents.reduce((acc, event) => {
        const page = event.data.page || 'unknown';
        acc[page] = (acc[page] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculer les services populaires
      const popularServices = this.calculatePopularServices(serviceEvents);

      // Calculer les heures de pointe
      const peakUsageHours = this.calculatePeakUsageHours(this.events);

      // Calculer le parcours utilisateur (simplifié)
      const userJourney = [
        { step: 'Landing', completionRate: 100, dropOffRate: 0 },
        { step: 'Service Selection', completionRate: 85, dropOffRate: 15 },
        { step: 'Quote Request', completionRate: 70, dropOffRate: 15 },
        { step: 'Booking', completionRate: 60, dropOffRate: 10 },
        { step: 'Payment', completionRate: 55, dropOffRate: 5 }
      ];

      return {
        pageViews,
        userJourney,
        popularServices,
        peakUsageHours
      };
    } catch (error) {
      this.analyticsLogger.error('Erreur lors du calcul des métriques de comportement', { error });
      return this.getEmptyUserBehaviorMetrics();
    }
  }

  /**
   * Obtient les métriques de notification
   */
  getNotificationMetrics(period?: { start: Date; end: Date }) {
    if (period) {
      return this.notificationMetricsService.getMetricsForPeriod(period.start, period.end);
    }
    return this.notificationMetricsService.getMetrics();
  }

  /**
   * Obtient les métriques WhatsApp
   */
  getWhatsAppMetrics(period?: { start: Date; end: Date }) {
    return this.whatsAppAnalytics.getMetrics(period);
  }

  /**
   * Recherche des événements analytics
   */
  searchEvents(criteria: {
    eventType?: string;
    category?: string;
    userId?: string;
    dateRange?: { start: Date; end: Date };
    limit?: number;
  }): AnalyticsEvent[] {
    let filteredEvents = this.events;

    if (criteria.eventType) {
      filteredEvents = filteredEvents.filter(e => e.eventType === criteria.eventType);
    }

    if (criteria.category) {
      filteredEvents = filteredEvents.filter(e => e.category === criteria.category);
    }

    if (criteria.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === criteria.userId);
    }

    if (criteria.dateRange) {
      filteredEvents = filteredEvents.filter(e => 
        e.timestamp >= criteria.dateRange!.start && e.timestamp <= criteria.dateRange!.end
      );
    }

    if (criteria.limit) {
      filteredEvents = filteredEvents.slice(-criteria.limit);
    }

    return filteredEvents;
  }

  /**
   * Exporte les analytics en différents formats
   */
  async exportAnalytics(
    period: { start: Date; end: Date },
    format: 'json' | 'csv' | 'xlsx' = 'json'
  ): Promise<string> {
    const report = await this.generateReport(period);

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'csv':
        return this.convertToCSV(report);
      case 'xlsx':
        // À implémenter avec une librairie comme xlsx
        return JSON.stringify(report, null, 2);
      default:
        throw new Error(`Format non supporté: ${format}`);
    }
  }

  // Méthodes privées

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateAverageResponseTime(events: AnalyticsEvent[]): number {
    if (events.length === 0) return 0;
    
    const totalTime = events.reduce((sum, event) => sum + (event.data.responseTime || 0), 0);
    return totalTime / events.length;
  }

  private calculatePopularServices(events: AnalyticsEvent[]): Array<{
    service: string;
    count: number;
    revenue: number;
  }> {
    const serviceStats = events.reduce((acc, event) => {
      const service = event.data.service || 'unknown';
      if (!acc[service]) {
        acc[service] = { count: 0, revenue: 0 };
      }
      acc[service].count++;
      acc[service].revenue += event.data.revenue || 0;
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    return Object.entries(serviceStats)
      .map(([service, stats]) => ({ service, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }

  private calculatePeakUsageHours(events: AnalyticsEvent[]): Array<{
    hour: number;
    activity: number;
  }> {
    const hourlyActivity = events.reduce((acc, event) => {
      const hour = event.timestamp.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return Object.entries(hourlyActivity)
      .map(([hour, activity]) => ({ hour: parseInt(hour), activity }))
      .sort((a, b) => b.activity - a.activity);
  }

  private convertToCSV(report: AnalyticsReport): string {
    // Conversion CSV simplifiée
    const lines = [
      'Metric,Value',
      `Total Bookings,${report.business.totalBookings}`,
      `Total Revenue,${report.business.totalRevenue}`,
      `Average Booking Value,${report.business.averageBookingValue}`,
      `Conversion Rate,${report.business.conversionRate}%`,
      `System Uptime,${report.performance.systemUptime}%`,
      `Error Rate,${report.performance.errorRate}%`
    ];

    return lines.join('\n');
  }

  private getEmptyBusinessMetrics(period: { start: Date; end: Date }): BusinessMetrics {
    return {
      totalBookings: 0,
      totalCustomers: 0,
      totalQuoteRequests: 0,
      totalRevenue: 0,
      averageBookingValue: 0,
      conversionRate: 0,
      customerRetentionRate: 0,
      period
    };
  }

  private getEmptyPerformanceMetrics(period: { start: Date; end: Date }): PerformanceMetrics {
    return {
      averageQuoteResponseTime: 0,
      averageBookingProcessingTime: 0,
      systemUptime: 0,
      errorRate: 0,
      apiResponseTime: 0,
      period
    };
  }

  private getEmptyUserBehaviorMetrics(): UserBehaviorMetrics {
    return {
      pageViews: {},
      userJourney: [],
      popularServices: [],
      peakUsageHours: []
    };
  }
} 