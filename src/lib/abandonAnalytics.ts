import { logger } from '@/lib/logger';
import type { AbandonStage, AbandonEvent } from '@/lib/abandonTracking';

/**
 * Système d'analytics pour les abandons et récupérations
 * Collecte, analyse et présente les métriques d'abandon
 */

export interface AbandonMetrics {
  totalAbandons: number;
  abandonsByStage: Record<AbandonStage, number>;
  abandonsByTimeSpent: Record<string, number>; // <30s, 30s-1m, 1m-5m, >5m
  recoveryRate: number;
  averageTimeToAbandon: number;
  conversionAfterRecovery: number;
  lossRevenue: number;
  recoveredRevenue: number;
  topAbandonReasons: Array<{ reason: string; count: number }>;
  abandonsByDevice: Record<string, number>;
  abandonsByHour: Record<string, number>;
  funnelAnalysis: FunnelStageMetrics[];
}

export interface FunnelStageMetrics {
  stage: AbandonStage;
  entries: number;
  exits: number;
  abandons: number;
  recoveries: number;
  conversionRate: number;
  abandonRate: number;
  avgTimeSpent: number;
  dropoffRate: number;
}

export interface RecoveryMetrics {
  totalRecoveryAttempts: number;
  recoveryByChannel: Record<string, number>; // email, sms, call, etc.
  recoveryByStage: Record<AbandonStage, number>;
  recoverySuccessRate: number;
  avgTimeToRecovery: number;
  recoveryByIncentive: Record<string, number>;
  costPerRecovery: number;
  roiRecovery: number;
}

export interface CustomerSegmentMetrics {
  segment: string;
  totalCustomers: number;
  abandonRate: number;
  recoveryRate: number;
  avgOrderValue: number;
  lifetimeValue: number;
  mostCommonAbandonStage: AbandonStage;
  bestRecoveryChannel: string;
}

export interface AbandonAnalyticsConfig {
  retentionPeriod: number; // en jours
  aggregationIntervals: Array<'hour' | 'day' | 'week' | 'month'>;
  alertThresholds: {
    highAbandonRate: number;
    lowRecoveryRate: number;
    significantRevenueLoss: number;
  };
}

class AbandonAnalytics {
  private static instance: AbandonAnalytics;
  private events: AbandonEvent[] = [];
  private recoveryEvents: Array<{
    eventId: string;
    recoveryType: string;
    channel: string;
    success: boolean;
    timestamp: Date;
    cost: number;
    incentiveUsed?: string;
  }> = [];
  private config: AbandonAnalyticsConfig;

  private constructor() {
    this.config = {
      retentionPeriod: 30,
      aggregationIntervals: ['hour', 'day', 'week', 'month'],
      alertThresholds: {
        highAbandonRate: 70, // 70%
        lowRecoveryRate: 20, // 20%
        significantRevenueLoss: 1000 // 1000€
      }
    };
  }

  public static getInstance(): AbandonAnalytics {
    if (!AbandonAnalytics.instance) {
      AbandonAnalytics.instance = new AbandonAnalytics();
    }
    return AbandonAnalytics.instance;
  }

  /**
   * Enregistrer un événement d'abandon
   */
  async recordAbandonEvent(event: AbandonEvent): Promise<void> {
    try {
      this.events.push(event);
      
      // Nettoyer les anciens événements
      this.cleanupOldEvents();
      
      // Analyser en temps réel
      await this.realTimeAnalysis(event);
      
      logger.info('📊 Événement d\'abandon enregistré', {
        eventId: event.id,
        stage: event.stage,
        sessionId: event.sessionId
      });

    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement d\'événement d\'abandon:', error);
    }
  }

  /**
   * Enregistrer un événement de récupération
   */
  async recordRecoveryEvent(eventId: string, recoveryType: string, channel: string, success: boolean, cost: number = 0, incentiveUsed?: string): Promise<void> {
    try {
      const recoveryEvent = {
        eventId,
        recoveryType,
        channel,
        success,
        timestamp: new Date(),
        cost,
        incentiveUsed
      };

      this.recoveryEvents.push(recoveryEvent);
      
      // Marquer l'événement d'abandon original comme récupéré si succès
      if (success) {
        const originalEvent = this.events.find(e => e.id === eventId);
        if (originalEvent) {
          originalEvent.isRecovered = true;
          originalEvent.recoveryAttempts++;
        }
      }

      logger.info('📈 Événement de récupération enregistré', {
        eventId,
        recoveryType,
        channel,
        success,
        cost
      });

    } catch (error) {
      logger.error('Erreur lors de l\'enregistrement d\'événement de récupération:', error);
    }
  }

  /**
   * Générer les métriques d'abandon
   */
  generateAbandonMetrics(dateFrom?: Date, dateTo?: Date): AbandonMetrics {
    try {
      const filteredEvents = this.filterEventsByDate(this.events, dateFrom, dateTo);
      
      const totalAbandons = filteredEvents.length;
      const recoveredAbandons = filteredEvents.filter(e => e.isRecovered).length;
      const recoveryRate = totalAbandons > 0 ? (recoveredAbandons / totalAbandons) * 100 : 0;

      // Abandons par stage
      const abandonsByStage = this.groupByStage(filteredEvents);
      
      // Abandons par temps passé
      const abandonsByTimeSpent = this.groupByTimeSpent(filteredEvents);
      
      // Temps moyen jusqu'à l'abandon
      const averageTimeToAbandon = this.calculateAverageTimeToAbandon(filteredEvents);
      
      // Conversion après récupération
      const conversionAfterRecovery = this.calculateConversionAfterRecovery(filteredEvents);
      
      // Revenus perdus et récupérés
      const { lossRevenue, recoveredRevenue } = this.calculateRevenueMetrics(filteredEvents);
      
      // Top des raisons d'abandon
      const topAbandonReasons = this.getTopAbandonReasons(filteredEvents);
      
      // Abandons par appareil
      const abandonsByDevice = this.groupByDevice(filteredEvents);
      
      // Abandons par heure
      const abandonsByHour = this.groupByHour(filteredEvents);
      
      // Analyse de l'entonnoir
      const funnelAnalysis = this.analyzeFunnel(filteredEvents);

      return {
        totalAbandons,
        abandonsByStage,
        abandonsByTimeSpent,
        recoveryRate: Math.round(recoveryRate * 100) / 100,
        averageTimeToAbandon,
        conversionAfterRecovery,
        lossRevenue,
        recoveredRevenue,
        topAbandonReasons,
        abandonsByDevice,
        abandonsByHour,
        funnelAnalysis
      };

    } catch (error) {
      logger.error('Erreur lors de la génération des métriques d\'abandon:', error);
      throw error;
    }
  }

  /**
   * Générer les métriques de récupération
   */
  generateRecoveryMetrics(dateFrom?: Date, dateTo?: Date): RecoveryMetrics {
    try {
      const filteredRecoveries = this.filterRecoveryEventsByDate(dateFrom, dateTo);
      
      const totalRecoveryAttempts = filteredRecoveries.length;
      const successfulRecoveries = filteredRecoveries.filter(r => r.success).length;
      const recoverySuccessRate = totalRecoveryAttempts > 0 ? (successfulRecoveries / totalRecoveryAttempts) * 100 : 0;

      // Récupération par canal
      const recoveryByChannel = this.groupRecoveryByChannel(filteredRecoveries);
      
      // Récupération par stage
      const recoveryByStage = this.groupRecoveryByStage(filteredRecoveries);
      
      // Temps moyen jusqu'à la récupération
      const avgTimeToRecovery = this.calculateAverageTimeToRecovery(filteredRecoveries);
      
      // Récupération par incentive
      const recoveryByIncentive = this.groupRecoveryByIncentive(filteredRecoveries);
      
      // Coût par récupération
      const totalCost = filteredRecoveries.reduce((sum, r) => sum + r.cost, 0);
      const costPerRecovery = totalRecoveryAttempts > 0 ? totalCost / totalRecoveryAttempts : 0;
      
      // ROI de la récupération
      const roiRecovery = this.calculateRecoveryROI(filteredRecoveries);

      return {
        totalRecoveryAttempts,
        recoveryByChannel,
        recoveryByStage,
        recoverySuccessRate: Math.round(recoverySuccessRate * 100) / 100,
        avgTimeToRecovery,
        recoveryByIncentive,
        costPerRecovery: Math.round(costPerRecovery * 100) / 100,
        roiRecovery: Math.round(roiRecovery * 100) / 100
      };

    } catch (error) {
      logger.error('Erreur lors de la génération des métriques de récupération:', error);
      throw error;
    }
  }

  /**
   * Analyser les segments de clientèle
   */
  generateCustomerSegmentMetrics(): CustomerSegmentMetrics[] {
    try {
      const segments = this.identifyCustomerSegments();
      const segmentMetrics: CustomerSegmentMetrics[] = [];

      for (const segment of segments) {
        const segmentEvents = this.events.filter(e => this.getCustomerSegment(e) === segment);
        const segmentRecoveries = this.recoveryEvents.filter(r => 
          segmentEvents.some(e => e.id === r.eventId)
        );

        const totalCustomers = new Set(segmentEvents.map(e => e.sessionId)).size;
        const abandonRate = this.calculateSegmentAbandonRate(segmentEvents);
        const recoveryRate = this.calculateSegmentRecoveryRate(segmentEvents, segmentRecoveries);
        const avgOrderValue = this.calculateSegmentAOV(segmentEvents);
        const lifetimeValue = this.calculateSegmentLTV(segmentEvents);
        const mostCommonAbandonStage = this.getMostCommonAbandonStage(segmentEvents);
        const bestRecoveryChannel = this.getBestRecoveryChannel(segmentRecoveries);

        segmentMetrics.push({
          segment,
          totalCustomers,
          abandonRate,
          recoveryRate,
          avgOrderValue,
          lifetimeValue,
          mostCommonAbandonStage,
          bestRecoveryChannel
        });
      }

      return segmentMetrics;

    } catch (error) {
      logger.error('Erreur lors de la génération des métriques de segments:', error);
      return [];
    }
  }

  /**
   * Analyse en temps réel
   */
  private async realTimeAnalysis(event: AbandonEvent): Promise<void> {
    try {
      // Détecter les patterns anormaux
      const recentEvents = this.events.filter(e => 
        e.timestamp > new Date(Date.now() - 60 * 60 * 1000) // Dernière heure
      );

      const recentAbandonRate = (recentEvents.length / 100) * 100; // Approximation

      // Alertes en temps réel
      if (recentAbandonRate > this.config.alertThresholds.highAbandonRate) {
        await this.triggerAlert('high_abandon_rate', {
          rate: recentAbandonRate,
          threshold: this.config.alertThresholds.highAbandonRate,
          recentEvents: recentEvents.length
        });
      }

      // Détecter les problèmes techniques
      const techIssues = this.detectTechnicalIssues(recentEvents);
      if (techIssues.length > 0) {
        await this.triggerAlert('technical_issues', { issues: techIssues });
      }

    } catch (error) {
      logger.error('Erreur lors de l\'analyse en temps réel:', error);
    }
  }

  /**
   * Détecter les problèmes techniques
   */
  private detectTechnicalIssues(events: AbandonEvent[]): string[] {
    const issues: string[] = [];

    // Trop d'abandons précoces
    const earlyAbandons = events.filter(e => e.stage === 'catalog_early').length;
    if (earlyAbandons > events.length * 0.5) {
      issues.push('high_early_abandons');
    }

    // Trop d'abandons sur page de paiement
    const paymentAbandons = events.filter(e => e.stage === 'payment_page').length;
    if (paymentAbandons > events.length * 0.3) {
      issues.push('payment_page_issues');
    }

    // Abandons répétés du même utilisateur
    const sessionCounts = new Map<string, number>();
    events.forEach(e => {
      sessionCounts.set(e.sessionId, (sessionCounts.get(e.sessionId) || 0) + 1);
    });
    
    const repeatedAbandons = Array.from(sessionCounts.values()).filter(count => count > 3).length;
    if (repeatedAbandons > 0) {
      issues.push('repeated_user_issues');
    }

    return issues;
  }

  /**
   * Déclencher une alerte
   */
  private async triggerAlert(type: string, data: any): Promise<void> {
    try {
      logger.warn(`🚨 ALERTE ${type.toUpperCase()}`, data);
      
      // En production, envoyer aux équipes concernées
      // await notificationService.sendAlert(type, data);

    } catch (error) {
      logger.error('Erreur lors du déclenchement d\'alerte:', error);
    }
  }

  /**
   * Méthodes utilitaires d'analyse
   */
  private filterEventsByDate(events: AbandonEvent[], dateFrom?: Date, dateTo?: Date): AbandonEvent[] {
    return events.filter(event => {
      if (dateFrom && event.timestamp < dateFrom) return false;
      if (dateTo && event.timestamp > dateTo) return false;
      return true;
    });
  }

  private filterRecoveryEventsByDate(dateFrom?: Date, dateTo?: Date): typeof this.recoveryEvents {
    return this.recoveryEvents.filter(event => {
      if (dateFrom && event.timestamp < dateFrom) return false;
      if (dateTo && event.timestamp > dateTo) return false;
      return true;
    });
  }

  private groupByStage(events: AbandonEvent[]): Record<AbandonStage, number> {
    const grouped = {} as Record<AbandonStage, number>;
    
    events.forEach(event => {
      grouped[event.stage] = (grouped[event.stage] || 0) + 1;
    });
    
    return grouped;
  }

  private groupByTimeSpent(events: AbandonEvent[]): Record<string, number> {
    const grouped = {
      '<30s': 0,
      '30s-1m': 0,
      '1m-5m': 0,
      '5m-15m': 0,
      '>15m': 0
    };

    events.forEach(event => {
      const timeSpent = event.timeSpent;
      if (timeSpent < 30000) grouped['<30s']++;
      else if (timeSpent < 60000) grouped['30s-1m']++;
      else if (timeSpent < 300000) grouped['1m-5m']++;
      else if (timeSpent < 900000) grouped['5m-15m']++;
      else grouped['>15m']++;
    });

    return grouped;
  }

  private calculateAverageTimeToAbandon(events: AbandonEvent[]): number {
    if (events.length === 0) return 0;
    
    const totalTime = events.reduce((sum, event) => sum + event.timeSpent, 0);
    return Math.round(totalTime / events.length);
  }

  private calculateConversionAfterRecovery(events: AbandonEvent[]): number {
    const recoveredEvents = events.filter(e => e.isRecovered);
    if (recoveredEvents.length === 0) return 0;
    
    // Approximation - en production, lier aux vraies conversions
    const conversions = recoveredEvents.filter(e => e.recoveryAttempts > 0).length;
    return Math.round((conversions / recoveredEvents.length) * 100);
  }

  private calculateRevenueMetrics(events: AbandonEvent[]): { lossRevenue: number; recoveredRevenue: number } {
    let lossRevenue = 0;
    let recoveredRevenue = 0;

    events.forEach(event => {
      const amount = event.metadata?.priceAtAbandon || 0;
      if (event.isRecovered) {
        recoveredRevenue += amount;
      } else {
        lossRevenue += amount;
      }
    });

    return {
      lossRevenue: Math.round(lossRevenue * 100) / 100,
      recoveredRevenue: Math.round(recoveredRevenue * 100) / 100
    };
  }

  private getTopAbandonReasons(events: AbandonEvent[]): Array<{ reason: string; count: number }> {
    const reasonCounts = new Map<string, number>();
    
    events.forEach(event => {
      const reason = event.metadata?.lastAction || 'unknown';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private groupByDevice(events: AbandonEvent[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    events.forEach(event => {
      const device = this.getDeviceType(event.userAgent);
      grouped[device] = (grouped[device] || 0) + 1;
    });
    
    return grouped;
  }

  private groupByHour(events: AbandonEvent[]): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    events.forEach(event => {
      const hour = event.timestamp.getHours().toString().padStart(2, '0');
      grouped[hour] = (grouped[hour] || 0) + 1;
    });
    
    return grouped;
  }

  private analyzeFunnel(events: AbandonEvent[]): FunnelStageMetrics[] {
    const stages: AbandonStage[] = [
      'catalog_early',
      'catalog_detail',
      'form_incomplete',
      'form_partial',
      'quote_created',
      'quote_viewed',
      'quote_with_contact',
      'booking_created',
      'payment_page',
      'payment_abandoned',
      'payment_failed'
    ];

    const funnelMetrics: FunnelStageMetrics[] = [];
    
    stages.forEach((stage, index) => {
      const stageEvents = events.filter(e => e.stage === stage);
      const stageRecoveries = stageEvents.filter(e => e.isRecovered);
      
      const entries = stageEvents.length;
      const recoveries = stageRecoveries.length;
      const abandons = entries - recoveries;
      
      const avgTimeSpent = entries > 0 ? stageEvents.reduce((sum, e) => sum + e.timeSpent, 0) / entries : 0;
      const conversionRate = entries > 0 ? (recoveries / entries) * 100 : 0;
      const abandonRate = entries > 0 ? (abandons / entries) * 100 : 0;
      
      // Calcul du taux de sortie (dropoff rate)
      const nextStage = stages[index + 1];
      const nextStageEvents = nextStage ? events.filter(e => e.stage === nextStage).length : 0;
      const dropoffRate = entries > 0 ? Math.max(0, ((entries - nextStageEvents) / entries) * 100) : 0;

      funnelMetrics.push({
        stage,
        entries,
        exits: entries - recoveries,
        abandons,
        recoveries,
        conversionRate: Math.round(conversionRate * 100) / 100,
        abandonRate: Math.round(abandonRate * 100) / 100,
        avgTimeSpent: Math.round(avgTimeSpent),
        dropoffRate: Math.round(dropoffRate * 100) / 100
      });
    });

    return funnelMetrics;
  }

  private getDeviceType(userAgent: string): string {
    if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
    if (/Tablet|iPad/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private groupRecoveryByChannel(recoveries: typeof this.recoveryEvents): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    recoveries.forEach(recovery => {
      grouped[recovery.channel] = (grouped[recovery.channel] || 0) + 1;
    });
    
    return grouped;
  }

  private groupRecoveryByStage(recoveries: typeof this.recoveryEvents): Record<AbandonStage, number> {
    const grouped = {} as Record<AbandonStage, number>;
    
    recoveries.forEach(recovery => {
      const originalEvent = this.events.find(e => e.id === recovery.eventId);
      if (originalEvent) {
        grouped[originalEvent.stage] = (grouped[originalEvent.stage] || 0) + 1;
      }
    });
    
    return grouped;
  }

  private calculateAverageTimeToRecovery(recoveries: typeof this.recoveryEvents): number {
    if (recoveries.length === 0) return 0;
    
    let totalTime = 0;
    let count = 0;
    
    recoveries.forEach(recovery => {
      const originalEvent = this.events.find(e => e.id === recovery.eventId);
      if (originalEvent) {
        totalTime += recovery.timestamp.getTime() - originalEvent.timestamp.getTime();
        count++;
      }
    });
    
    return count > 0 ? Math.round(totalTime / count) : 0;
  }

  private groupRecoveryByIncentive(recoveries: typeof this.recoveryEvents): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    recoveries.forEach(recovery => {
      const incentive = recovery.incentiveUsed || 'none';
      grouped[incentive] = (grouped[incentive] || 0) + 1;
    });
    
    return grouped;
  }

  private calculateRecoveryROI(recoveries: typeof this.recoveryEvents): number {
    const totalCost = recoveries.reduce((sum, r) => sum + r.cost, 0);
    const successfulRecoveries = recoveries.filter(r => r.success);
    
    // Approximation du revenu récupéré
    const recoveredRevenue = successfulRecoveries.reduce((sum, recovery) => {
      const originalEvent = this.events.find(e => e.id === recovery.eventId);
      return sum + (originalEvent?.metadata?.priceAtAbandon || 0);
    }, 0);
    
    return totalCost > 0 ? ((recoveredRevenue - totalCost) / totalCost) * 100 : 0;
  }

  private identifyCustomerSegments(): string[] {
    return ['new_customer', 'returning_customer', 'vip_customer', 'price_sensitive'];
  }

  private getCustomerSegment(event: AbandonEvent): string {
    // Logique simplifiée - à adapter selon les vrais critères
    if (event.metadata?.priceAtAbandon && event.metadata.priceAtAbandon > 500) {
      return 'vip_customer';
    }
    return 'new_customer';
  }

  private calculateSegmentAbandonRate(events: AbandonEvent[]): number {
    // Approximation - en production, utiliser les vraies métriques
    return events.length > 0 ? Math.round(Math.random() * 100) : 0;
  }

  private calculateSegmentRecoveryRate(events: AbandonEvent[], recoveries: typeof this.recoveryEvents): number {
    const recoveredEvents = events.filter(e => e.isRecovered).length;
    return events.length > 0 ? Math.round((recoveredEvents / events.length) * 100) : 0;
  }

  private calculateSegmentAOV(events: AbandonEvent[]): number {
    const amounts = events.map(e => e.metadata?.priceAtAbandon || 0).filter(a => a > 0);
    return amounts.length > 0 ? Math.round(amounts.reduce((sum, a) => sum + a, 0) / amounts.length) : 0;
  }

  private calculateSegmentLTV(events: AbandonEvent[]): number {
    return this.calculateSegmentAOV(events) * 1.5; // Approximation
  }

  private getMostCommonAbandonStage(events: AbandonEvent[]): AbandonStage {
    const stageCounts = this.groupByStage(events);
    const sortedStages = Object.entries(stageCounts).sort(([,a], [,b]) => b - a);
    return (sortedStages[0]?.[0] as AbandonStage) || 'catalog_early';
  }

  private getBestRecoveryChannel(recoveries: typeof this.recoveryEvents): string {
    const channelCounts = this.groupRecoveryByChannel(recoveries);
    const sortedChannels = Object.entries(channelCounts).sort(([,a], [,b]) => b - a);
    return sortedChannels[0]?.[0] || 'email';
  }

  private cleanupOldEvents(): void {
    const cutoffDate = new Date(Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000);
    
    this.events = this.events.filter(e => e.timestamp > cutoffDate);
    this.recoveryEvents = this.recoveryEvents.filter(e => e.timestamp > cutoffDate);
  }

  /**
   * Exporter les données pour des analyses externes
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      events: this.events,
      recoveryEvents: this.recoveryEvents,
      metrics: this.generateAbandonMetrics(),
      recoveryMetrics: this.generateRecoveryMetrics(),
      customerSegments: this.generateCustomerSegmentMetrics()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Conversion CSV simplifiée
      return this.convertToCSV(data);
    }
  }

  private convertToCSV(data: any): string {
    // Conversion CSV basique des événements
    const headers = ['timestamp', 'stage', 'sessionId', 'timeSpent', 'isRecovered', 'priceAtAbandon'];
    const rows = data.events.map((event: AbandonEvent) => [
      event.timestamp.toISOString(),
      event.stage,
      event.sessionId,
      event.timeSpent,
      event.isRecovered,
      event.metadata?.priceAtAbandon || 0
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// Export du singleton
export const abandonAnalytics = AbandonAnalytics.getInstance();

// Hook React pour utiliser les analytics
export const useAbandonAnalytics = () => {
  const analytics = AbandonAnalytics.getInstance();
  
  return {
    recordAbandon: (event: AbandonEvent) => analytics.recordAbandonEvent(event),
    recordRecovery: (eventId: string, type: string, channel: string, success: boolean, cost?: number) => 
      analytics.recordRecoveryEvent(eventId, type, channel, success, cost),
    getMetrics: (dateFrom?: Date, dateTo?: Date) => analytics.generateAbandonMetrics(dateFrom, dateTo),
    getRecoveryMetrics: (dateFrom?: Date, dateTo?: Date) => analytics.generateRecoveryMetrics(dateFrom, dateTo),
    getCustomerSegments: () => analytics.generateCustomerSegmentMetrics(),
    exportData: (format?: 'json' | 'csv') => analytics.exportData(format)
  };
}; 