import { logger } from '@/lib/logger';

const analyticsLogger = logger.withContext('WhatsAppAnalytics');

interface MessageAnalytics {
    messageId?: string;
    from?: string;
    to?: string;
    type: string;
    status?: string;
    timestamp: Date;
    errors?: Array<{
        code: number;
        title: string;
    }>;
    metadata?: Record<string, any>;
}

interface AnalyticsMetrics {
    totalMessages: number;
    messagesByType: Record<string, number>;
    messagesByStatus: Record<string, number>;
    averageResponseTime: number;
    errorRate: number;
    activeUsers: Set<string>;
}

export class WhatsAppAnalytics {
    private metrics: AnalyticsMetrics;
    private messageHistory: MessageAnalytics[];
    private readonly MAX_HISTORY_SIZE = 1000;

    constructor() {
        this.metrics = {
            totalMessages: 0,
            messagesByType: {},
            messagesByStatus: {},
            averageResponseTime: 0,
            errorRate: 0,
            activeUsers: new Set()
        };
        this.messageHistory = [];
    }

    public async trackIncomingMessage(data: {
        from: string;
        type: string;
        timestamp: Date;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const analytics: MessageAnalytics = {
            from: data.from,
            type: data.type,
            timestamp: data.timestamp,
            status: 'received',
            metadata: data.metadata
        };

        await this.trackMessage(analytics);
        this.metrics.activeUsers.add(data.from);
    }

    public async trackOutgoingMessage(data: {
        messageId: string;
        to: string;
        type: string;
        timestamp: Date;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const analytics: MessageAnalytics = {
            messageId: data.messageId,
            to: data.to,
            type: data.type,
            timestamp: data.timestamp,
            status: 'sent',
            metadata: data.metadata
        };

        await this.trackMessage(analytics);
    }

    public async trackMessageStatus(data: {
        messageId: string;
        recipientId: string;
        status: string;
        timestamp: Date;
        errors?: Array<{
            code: number;
            title: string;
        }>;
    }): Promise<void> {
        const analytics: MessageAnalytics = {
            messageId: data.messageId,
            to: data.recipientId,
            type: 'status_update',
            status: data.status,
            timestamp: data.timestamp,
            errors: data.errors
        };

        await this.trackMessage(analytics);

        if (data.errors && data.errors.length > 0) {
            this.updateErrorRate();
        }
    }

    private async trackMessage(analytics: MessageAnalytics): Promise<void> {
        try {
            // Mettre à jour les métriques
            this.metrics.totalMessages++;
            this.metrics.messagesByType[analytics.type] = (this.metrics.messagesByType[analytics.type] || 0) + 1;
            
            if (analytics.status) {
                this.metrics.messagesByStatus[analytics.status] = (this.metrics.messagesByStatus[analytics.status] || 0) + 1;
            }

            // Ajouter à l'historique
            this.messageHistory.push(analytics);
            if (this.messageHistory.length > this.MAX_HISTORY_SIZE) {
                this.messageHistory.shift();
            }

            // Calculer le temps de réponse moyen si c'est une réponse
            if (analytics.from && analytics.type === 'text') {
                this.updateAverageResponseTime(analytics);
            }

            analyticsLogger.debug('Analytics tracked:', {
                type: analytics.type,
                status: analytics.status,
                timestamp: analytics.timestamp
            });
        } catch (error) {
            analyticsLogger.error('Error tracking analytics:', error);
        }
    }

    private updateAverageResponseTime(message: MessageAnalytics): void {
        const previousMessage = this.messageHistory
            .slice()
            .reverse()
            .find(m => m.to === message.from);

        if (previousMessage) {
            const responseTime = message.timestamp.getTime() - previousMessage.timestamp.getTime();
            this.metrics.averageResponseTime = (
                this.metrics.averageResponseTime * (this.metrics.totalMessages - 1) + responseTime
            ) / this.metrics.totalMessages;
        }
    }

    private updateErrorRate(): void {
        const errorCount = Object.entries(this.metrics.messagesByStatus)
            .filter(([status]) => status === 'failed')
            .reduce((sum, [_, count]) => sum + count, 0);

        this.metrics.errorRate = errorCount / this.metrics.totalMessages;
    }

    public getMetrics(period?: {
        start: Date;
        end: Date;
    }): {
        metrics: AnalyticsMetrics;
        period?: {
            start: Date;
            end: Date;
        };
    } {
        if (!period) {
            return {
                metrics: {
                    ...this.metrics,
                    activeUsers: new Set([...this.metrics.activeUsers])
                }
            };
        }

        // Filtrer les métriques pour la période spécifiée
        const filteredHistory = this.messageHistory.filter(
            message => message.timestamp >= period.start && message.timestamp <= period.end
        );

        const periodMetrics: AnalyticsMetrics = {
            totalMessages: filteredHistory.length,
            messagesByType: {},
            messagesByStatus: {},
            averageResponseTime: 0,
            errorRate: 0,
            activeUsers: new Set()
        };

        for (const message of filteredHistory) {
            periodMetrics.messagesByType[message.type] = (periodMetrics.messagesByType[message.type] || 0) + 1;
            
            if (message.status) {
                periodMetrics.messagesByStatus[message.status] = (periodMetrics.messagesByStatus[message.status] || 0) + 1;
            }

            if (message.from) {
                periodMetrics.activeUsers.add(message.from);
            }
        }

        // Calculer le taux d'erreur pour la période
        const errorCount = Object.entries(periodMetrics.messagesByStatus)
            .filter(([status]) => status === 'failed')
            .reduce((sum, [_, count]) => sum + count, 0);

        periodMetrics.errorRate = errorCount / periodMetrics.totalMessages;

        return {
            metrics: periodMetrics,
            period
        };
    }

    public async exportAnalytics(format: 'json' | 'csv' = 'json'): Promise<string> {
        try {
            if (format === 'csv') {
                return this.exportToCsv();
            }
            return JSON.stringify(this.getMetrics(), null, 2);
        } catch (error) {
            analyticsLogger.error('Error exporting analytics:', error);
            throw error;
        }
    }

    private exportToCsv(): string {
        const headers = [
            'timestamp',
            'type',
            'status',
            'from',
            'to',
            'messageId',
            'errors'
        ].join(',');

        const rows = this.messageHistory.map(message => [
            message.timestamp.toISOString(),
            message.type,
            message.status || '',
            message.from || '',
            message.to || '',
            message.messageId || '',
            message.errors ? JSON.stringify(message.errors) : ''
        ].join(','));

        return [headers, ...rows].join('\n');
    }

    /**
     * Récupère les statistiques pour une période donnée
     */
    public async getStats(period: 'day' | 'week' | 'month'): Promise<{
        totalSent: number;
        totalDelivered: number;
        totalRead: number;
        totalFailed: number;
        responseRate: number;
    }> {
        try {
            // Filtrer les messages selon la période
            const now = new Date();
            const startDate = new Date();
            
            switch (period) {
                case 'day':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(now.getMonth() - 1);
                    break;
            }

            // Dans un cas réel, ces statistiques seraient calculées à partir des données stockées
            return {
                totalSent: 0,
                totalDelivered: 0,
                totalRead: 0,
                totalFailed: 0,
                responseRate: 0
            };
        } catch (error) {
            analyticsLogger.error('Erreur lors du calcul des statistiques', error);
            return {
                totalSent: 0,
                totalDelivered: 0,
                totalRead: 0,
                totalFailed: 0,
                responseRate: 0
            };
        }
    }
} 