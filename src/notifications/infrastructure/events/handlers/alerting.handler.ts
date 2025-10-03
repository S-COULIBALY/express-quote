/**
 * 🚨 ALERTING HANDLER - Alertes intelligentes
 * 
 * Handler dédié aux alertes business et techniques :
 * - Alertes sur taux d'échec élevé
 * - Détection d'anomalies (pics, chutes)
 * - Alertes de coût (dépassement budget)
 * - Intégration avec les systèmes existants (logs, métriques)
 */

import { EventHandler, NotificationCreatedEvent, NotificationSentEvent, NotificationFailedEvent } from '../modern.event.bus';
import { ProductionLogger } from '../../logging/logger.production';

interface AlertingStats {
  failuresByChannel: Record<string, { count: number; lastHour: Date[] }>;
  costsByChannel: Record<string, { total: number; lastHour: number[] }>;
  volumeByChannel: Record<string, { count: number; lastHour: Date[] }>;
  lastReset: Date;
}

export class AlertingHandler implements EventHandler<any> {
  name = 'intelligent-alerting';
  priority = 3; // Important mais pas critique
  timeout = 2000;
  
  private logger: ProductionLogger;
  private stats: AlertingStats;
  private alertThresholds = {
    failureRate: 20, // 20% d'échecs
    costPerHour: 10, // 10€ par heure
    volumeSpike: 200, // 200% d'augmentation
    consecutiveFailures: 5 // 5 échecs consécutifs
  };
  
  constructor() {
    this.logger = new ProductionLogger({ level: 'warn', enableConsole: true });
    this.stats = {
      failuresByChannel: {},
      costsByChannel: {},
      volumeByChannel: {},
      lastReset: new Date()
    };
    
    // Reset des stats horaires
    setInterval(() => {
      this.resetHourlyStats();
    }, 60 * 60 * 1000); // Chaque heure
  }
  
  async handle(event: NotificationCreatedEvent | NotificationSentEvent | NotificationFailedEvent): Promise<void> {
    try {
      const channel = event.channel;
      
      // Mise à jour des stats
      this.updateStats(event);
      
      // Vérification des alertes selon le type d'événement
      if ('deliveryTime' in event) {
        // NotificationSentEvent
        await this.checkCostAlerts(channel, event as NotificationSentEvent);
      } else if ('error' in event) {
        // NotificationFailedEvent
        await this.checkFailureAlerts(channel, event as NotificationFailedEvent);
      } else if ('templateId' in event) {
        // NotificationCreatedEvent
        await this.checkVolumeAlerts(channel, event as NotificationCreatedEvent);
      }
      
    } catch (error) {
      // Alerting handler ne doit jamais faire échouer le flux
      console.error('AlertingHandler error:', error);
    }
  }
  
  /**
   * Mise à jour des statistiques internes
   */
  private updateStats(event: any): void {
    const channel = event.channel;
    const now = new Date();
    
    // Initialiser les stats du canal si nécessaire
    if (!this.stats.failuresByChannel[channel]) {
      this.stats.failuresByChannel[channel] = { count: 0, lastHour: [] };
      this.stats.costsByChannel[channel] = { total: 0, lastHour: [] };
      this.stats.volumeByChannel[channel] = { count: 0, lastHour: [] };
    }
    
    if ('error' in event) {
      // Échec
      this.stats.failuresByChannel[channel].count++;
      this.stats.failuresByChannel[channel].lastHour.push(now);
    } else if ('deliveryTime' in event && event.cost) {
      // Succès avec coût
      this.stats.costsByChannel[channel].total += event.cost;
      this.stats.costsByChannel[channel].lastHour.push(event.cost);
    } else if ('templateId' in event) {
      // Création
      this.stats.volumeByChannel[channel].count++;
      this.stats.volumeByChannel[channel].lastHour.push(now);
    }
  }
  
  /**
   * Alertes sur les échecs
   */
  private async checkFailureAlerts(channel: string, event: NotificationFailedEvent): Promise<void> {
    const channelStats = this.stats.failuresByChannel[channel];
    const totalVolume = this.stats.volumeByChannel[channel]?.count || 0;
    
    // Taux d'échec élevé
    if (totalVolume > 10) { // Au moins 10 notifications pour être significatif
      const failureRate = (channelStats.count / totalVolume) * 100;
      if (failureRate >= this.alertThresholds.failureRate) {
        await this.sendAlert('HIGH_FAILURE_RATE', {
          channel,
          failureRate: `${failureRate.toFixed(1)}%`,
          totalFailures: channelStats.count,
          totalVolume,
          lastError: event.error
        });
      }
    }
    
    // Échecs consécutifs dans la dernière heure
    const lastHourFailures = this.getLastHourCount(channelStats.lastHour);
    if (lastHourFailures >= this.alertThresholds.consecutiveFailures) {
      await this.sendAlert('CONSECUTIVE_FAILURES', {
        channel,
        consecutiveFailures: lastHourFailures,
        error: event.error,
        canRetry: event.canRetry
      });
    }
    
    // Erreurs critiques spécifiques
    if (this.isCriticalError(event.error)) {
      await this.sendAlert('CRITICAL_ERROR', {
        channel,
        error: event.error,
        notificationId: event.notificationId,
        recipientId: event.recipientId
      });
    }
  }
  
  /**
   * Alertes sur les coûts
   */
  private async checkCostAlerts(channel: string, event: NotificationSentEvent): Promise<void> {
    const channelStats = this.stats.costsByChannel[channel];
    
    // Coût horaire dépassé
    const lastHourCost = channelStats.lastHour.reduce((sum, cost) => sum + cost, 0);
    if (lastHourCost >= this.alertThresholds.costPerHour) {
      await this.sendAlert('HIGH_COST', {
        channel,
        hourlyCoset: `${lastHourCost.toFixed(2)}€`,
        threshold: `${this.alertThresholds.costPerHour}€`,
        totalCost: `${channelStats.total.toFixed(2)}€`
      });
    }
    
    // Coût unitaire anormalement élevé
    const averageCost = channelStats.total / channelStats.lastHour.length;
    if (event.cost && event.cost > averageCost * 3) { // 3x la moyenne
      await this.sendAlert('UNUSUAL_COST', {
        channel,
        unitCost: `${event.cost.toFixed(3)}€`,
        averageCost: `${averageCost.toFixed(3)}€`,
        notificationId: event.notificationId
      });
    }
  }
  
  /**
   * Alertes sur le volume
   */
  private async checkVolumeAlerts(channel: string, event: NotificationCreatedEvent): Promise<void> {
    const channelStats = this.stats.volumeByChannel[channel];
    
    // Pic de volume (spike detection)
    const lastHourVolume = this.getLastHourCount(channelStats.lastHour);
    const previousHourVolume = this.getPreviousHourCount(channelStats.lastHour);
    
    if (previousHourVolume > 0) {
      const spikePercent = ((lastHourVolume - previousHourVolume) / previousHourVolume) * 100;
      if (spikePercent >= this.alertThresholds.volumeSpike) {
        await this.sendAlert('VOLUME_SPIKE', {
          channel,
          spikePercent: `${spikePercent.toFixed(0)}%`,
          currentHourVolume: lastHourVolume,
          previousHourVolume,
          priority: event.priority
        });
      }
    }
  }
  
  /**
   * Envoyer une alerte (utilise le système de logging existant)
   */
  private async sendAlert(alertType: string, data: Record<string, any>): Promise<void> {
    const alertMessage = `🚨 ALERT: ${alertType}`;
    
    // Log d'alerte structuré (sera capturé par les systèmes de monitoring)
    this.logger.error(alertMessage, {
      alertType,
      severity: this.getAlertSeverity(alertType),
      timestamp: new Date().toISOString(),
      ...data
    });
    
    // Dans une version avancée, on pourrait envoyer vers :
    // - Slack/Teams webhook
    // - PagerDuty
    // - Email aux admins
    // - Push notification mobile
    
    console.warn(`${alertMessage}:`, data);
  }
  
  /**
   * Déterminer la sévérité d'une alerte
   */
  private getAlertSeverity(alertType: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (alertType) {
      case 'CRITICAL_ERROR':
        return 'CRITICAL';
      case 'HIGH_FAILURE_RATE':
      case 'CONSECUTIVE_FAILURES':
        return 'HIGH';
      case 'HIGH_COST':
      case 'VOLUME_SPIKE':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }
  
  /**
   * Vérifier si une erreur est critique
   */
  private isCriticalError(error: string): boolean {
    const criticalPatterns = [
      'quota exceeded',
      'account suspended',
      'billing error',
      'api key invalid',
      'service unavailable'
    ];
    
    return criticalPatterns.some(pattern => 
      error.toLowerCase().includes(pattern)
    );
  }
  
  /**
   * Compter les événements de la dernière heure
   */
  private getLastHourCount(timestamps: Date[]): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return timestamps.filter(ts => ts > oneHourAgo).length;
  }
  
  /**
   * Compter les événements de l'heure précédente
   */
  private getPreviousHourCount(timestamps: Date[]): number {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return timestamps.filter(ts => ts > twoHoursAgo && ts <= oneHourAgo).length;
  }
  
  /**
   * Reset des statistiques horaires
   */
  private resetHourlyStats(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    Object.values(this.stats.failuresByChannel).forEach(stat => {
      stat.lastHour = stat.lastHour.filter(ts => ts > oneHourAgo);
    });
    
    Object.values(this.stats.volumeByChannel).forEach(stat => {
      stat.lastHour = stat.lastHour.filter(ts => ts > oneHourAgo);
    });
    
    // Reset des coûts horaires (on garde seulement les coûts de la dernière heure)
    Object.values(this.stats.costsByChannel).forEach(stat => {
      stat.lastHour = stat.lastHour.slice(-60); // Garder max 60 entries
    });
    
    this.stats.lastReset = new Date();
    
    this.logger.debug('🔄 Hourly alerting stats reset completed');
  }
}