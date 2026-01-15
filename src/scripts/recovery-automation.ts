#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

/**
 * Script d'automatisation de la récupération des abandons
 * 
 * Fonctionnalités :
 * - Identification des abandons par étape
 * - Envoi de notifications de récupération
 * - Gestion des séquences graduelles
 * - Tracking des tentatives
 * 
 * Usage :
 * npx tsx src/scripts/recovery-automation.ts
 * 
 * Cron job recommandé : tous les 15 minutes
 */

interface AbandonedSession {
  id: string;
  stage: 'form_filling' | 'quote_created' | 'quote_viewed' | 'payment_initiated';
  data: any;
  email?: string;
  phone?: string;
  abandonedAt: Date;
  lastActivity: Date;
  recoveryAttempts: number;
  quoteRequestId?: string;
  temporaryId?: string;
}

interface RecoveryStrategy {
  name: string;
  stage: string;
  triggerAfterMinutes: number;
  maxAttempts: number;
  channels: ('email' | 'whatsapp' | 'sms')[];
  template: string;
  offer?: {
    type: 'discount' | 'upgrade' | 'addon';
    value: number;
    description: string;
  };
}

class RecoveryAutomationProcessor {
  private readonly logger = logger.withContext('RecoveryAutomationProcessor');
  private readonly prisma = new PrismaClient();
  
  // Stratégies de récupération par défaut
  private readonly strategies: RecoveryStrategy[] = [
    {
      name: 'Immediate Follow-up',
      stage: 'form_filling',
      triggerAfterMinutes: 15,
      maxAttempts: 1,
      channels: ['email'],
      template: 'form_recovery'
    },
    {
      name: 'Quote Reminder',
      stage: 'quote_created',
      triggerAfterMinutes: 60,
      maxAttempts: 2,
      channels: ['email', 'whatsapp'],
      template: 'quote_reminder'
    },
    {
      name: 'Gentle Nudge',
      stage: 'quote_viewed',
      triggerAfterMinutes: 120,
      maxAttempts: 2,
      channels: ['email'],
      template: 'gentle_nudge',
      offer: {
        type: 'discount',
        value: 5,
        description: 'Remise de 5% pour finaliser aujourd\'hui'
      }
    },
    {
      name: 'Payment Urgency',
      stage: 'payment_initiated',
      triggerAfterMinutes: 30,
      maxAttempts: 3,
      channels: ['email', 'whatsapp', 'sms'],
      template: 'payment_urgency',
      offer: {
        type: 'discount',
        value: 10,
        description: 'Remise de 10% limitée - Finalisez maintenant'
      }
    }
  ];

  constructor() {
    this.logger.info('🔄 Initialisation du processeur de récupération');
  }

  /**
   * Point d'entrée principal pour le processus de récupération
   */
  async processRecoveryAutomation(): Promise<void> {
    const startTime = Date.now();
    this.logger.info('🚀 Début du processus de récupération automatique');

    try {
      // 1. Identifier les abandons par étape
      const abandonedSessions = await this.identifyAbandonedSessions();
      
      if (abandonedSessions.length === 0) {
        this.logger.info('ℹ️ Aucun abandon trouvé');
        return;
      }

      this.logger.info(`📊 ${abandonedSessions.length} abandons identifiés`);

      // 2. Appliquer les stratégies de récupération
      const results = await this.applyRecoveryStrategies(abandonedSessions);

      // 3. Enregistrer les métriques
      await this.recordRecoveryMetrics(results);

      const processingTime = Date.now() - startTime;
      this.logger.info(`✅ Processus terminé en ${processingTime}ms`, {
        totalProcessed: results.totalProcessed,
        totalAttempts: results.totalAttempts,
        totalErrors: results.totalErrors
      });

    } catch (error) {
      this.logger.error('❌ Erreur fatale lors du processus de récupération:', error);
      throw error;
    }
  }

  /**
   * Identifie les sessions abandonnées par étape
   */
  private async identifyAbandonedSessions(): Promise<AbandonedSession[]> {
    const abandonedSessions: AbandonedSession[] = [];

    try {
      // 1. Abandons de formulaires (form_filling)
      const formAbandons = await this.identifyFormAbandons();
      abandonedSessions.push(...formAbandons);

      // 2. Abandons de devis créés (quote_created)
      const quoteAbandons = await this.identifyQuoteAbandons();
      abandonedSessions.push(...quoteAbandons);

      // 3. Abandons de devis vus (quote_viewed)
      const viewedAbandons = await this.identifyViewedAbandons();
      abandonedSessions.push(...viewedAbandons);

      // 4. Abandons de paiement (payment_initiated)
      const paymentAbandons = await this.identifyPaymentAbandons();
      abandonedSessions.push(...paymentAbandons);

      this.logger.info(`📋 Sessions abandonnées par étape:`, {
        form_filling: formAbandons.length,
        quote_created: quoteAbandons.length,
        quote_viewed: viewedAbandons.length,
        payment_initiated: paymentAbandons.length
      });

    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'identification des abandons:', error);
      throw error;
    }

    return abandonedSessions;
  }

  /**
   * Identifie les abandons de formulaires
   */
  private async identifyFormAbandons(): Promise<AbandonedSession[]> {
    // Note : Ceci nécessiterait une table pour stocker les brouillons de formulaires
    // Pour l'instant, on retourne un tableau vide
    return [];
  }

  /**
   * Identifie les abandons de devis créés
   */
  private async identifyQuoteAbandons(): Promise<AbandonedSession[]> {
    const cutoffTime = new Date(Date.now() - 60 * 60 * 1000); // 1 heure

    const quoteRequests = await this.prisma.quoteRequest.findMany({
      where: {
        status: 'TEMPORARY',
        createdAt: {
          lt: cutoffTime
        },
        updatedAt: {
          lt: cutoffTime
        }
      },
      include: {
        CatalogSelection: true
      }
    });

    return quoteRequests.map(quote => ({
      id: quote.id,
      stage: 'quote_created' as const,
      data: quote.quoteData,
      email: (quote.quoteData as any)?.email || (quote.quoteData as any)?.customerInfo?.email,
      phone: (quote.quoteData as any)?.phone || (quote.quoteData as any)?.customerInfo?.phone,
      abandonedAt: quote.updatedAt,
      lastActivity: quote.updatedAt,
      recoveryAttempts: (quote.quoteData as any)?.recoveryAttempts || 0,
      quoteRequestId: quote.id,
      temporaryId: quote.temporaryId
    }));
  }

  /**
   * Identifie les abandons de devis vus
   */
  private async identifyViewedAbandons(): Promise<AbandonedSession[]> {
    const cutoffTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 heures

    const quoteRequests = await this.prisma.quoteRequest.findMany({
      where: {
        status: 'TEMPORARY',
        createdAt: {
          lt: cutoffTime
        },
        updatedAt: {
          lt: cutoffTime
        },
        // Condition pour identifier les devis "vus" (avec plus de données)
        quoteData: {
          path: ['customerInfo'],
          not: undefined
        }
      }
    });

    return quoteRequests.map(quote => ({
      id: quote.id,
      stage: 'quote_viewed' as const,
      data: quote.quoteData,
      email: (quote.quoteData as any)?.email || (quote.quoteData as any)?.customerInfo?.email,
      phone: (quote.quoteData as any)?.phone || (quote.quoteData as any)?.customerInfo?.phone,
      abandonedAt: quote.updatedAt,
      lastActivity: quote.updatedAt,
      recoveryAttempts: (quote.quoteData as any)?.recoveryAttempts || 0,
      quoteRequestId: quote.id,
      temporaryId: quote.temporaryId
    }));
  }

  /**
   * Identifie les abandons de paiement
   */
  private async identifyPaymentAbandons(): Promise<AbandonedSession[]> {
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: 'DRAFT',
        createdAt: {
          lt: cutoffTime
        },
        updatedAt: {
          lt: cutoffTime
        }
      },
      include: {
        Customer: true
      }
    });

    return bookings.map(booking => ({
      id: booking.id,
      stage: 'payment_initiated' as const,
      data: booking,
      email: booking.Customer?.email,
      phone: booking.Customer?.phone || undefined,
      abandonedAt: booking.updatedAt,
      lastActivity: booking.updatedAt,
      recoveryAttempts: 0 // À implémenter dans le schéma si nécessaire
    }));
  }

  /**
   * Applique les stratégies de récupération
   */
  private async applyRecoveryStrategies(abandonedSessions: AbandonedSession[]): Promise<{
    totalProcessed: number;
    totalAttempts: number;
    totalErrors: number;
  }> {
    let totalProcessed = 0;
    let totalAttempts = 0;
    let totalErrors = 0;

    for (const session of abandonedSessions) {
      try {
        // Trouver la stratégie applicable
        const strategy = this.findApplicableStrategy(session);
        
        if (!strategy) {
          continue;
        }

        // Vérifier si on doit déclencher la récupération
        if (!this.shouldTriggerRecovery(session, strategy)) {
          continue;
        }

        // Exécuter la stratégie
        const success = await this.executeRecoveryStrategy(session, strategy);
        
        if (success) {
          totalAttempts++;
          await this.updateRecoveryAttempts(session);
        }
        
        totalProcessed++;

      } catch (error) {
        totalErrors++;
        this.logger.error(`❌ Erreur lors de la récupération pour ${session.id}:`, error);
      }
    }

    return { totalProcessed, totalAttempts, totalErrors };
  }

  /**
   * Trouve la stratégie applicable pour une session
   */
  private findApplicableStrategy(session: AbandonedSession): RecoveryStrategy | null {
    return this.strategies.find(strategy => 
      strategy.stage === session.stage && 
      session.recoveryAttempts < strategy.maxAttempts
    ) || null;
  }

  /**
   * Vérifie si on doit déclencher la récupération
   */
  private shouldTriggerRecovery(session: AbandonedSession, strategy: RecoveryStrategy): boolean {
    const now = Date.now();
    const timeSinceAbandon = now - session.abandonedAt.getTime();
    const triggerTime = strategy.triggerAfterMinutes * 60 * 1000;

    return timeSinceAbandon >= triggerTime;
  }

  /**
   * Exécute une stratégie de récupération
   */
  private async executeRecoveryStrategy(session: AbandonedSession, strategy: RecoveryStrategy): Promise<boolean> {
    this.logger.info(`🎯 Exécution de la stratégie "${strategy.name}" pour ${session.id}`);

    // Vérifier qu'on a des informations de contact
    if (!session.email && !session.phone) {
      this.logger.warn(`⚠️ Aucune information de contact pour ${session.id}`);
      return false;
    }

    try {
      // Préparer les données pour la notification
      const recoveryData = this.prepareRecoveryData(session, strategy);

      // Simuler l'envoi de notification (à remplacer par l'intégration réelle)
      await this.sendRecoveryNotification(session, strategy, recoveryData);

      this.logger.info(`✅ Notification de récupération envoyée pour ${session.id}`);
      return true;

    } catch (error) {
      this.logger.error(`❌ Erreur lors de l'envoi de notification pour ${session.id}:`, error);
      return false;
    }
  }

  /**
   * Prépare les données pour la notification de récupération
   */
  private prepareRecoveryData(session: AbandonedSession, strategy: RecoveryStrategy): any {
    const customerName = this.extractCustomerName(session.data);
    
    return {
      customerName,
      sessionId: session.id,
      stage: session.stage,
      serviceName: session.data?.serviceName || 'Service',
      originalPrice: session.data?.totalPrice || 0,
      offer: strategy.offer,
      recoveryUrl: this.generateRecoveryUrl(session),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      supportPhone: process.env.SUPPORT_PHONE || '01 23 45 67 89'
    };
  }

  /**
   * Extrait le nom du client des données
   */
  private extractCustomerName(data: any): string {
    if (data?.customerInfo?.firstName && data?.customerInfo?.lastName) {
      return `${data.customerInfo.firstName} ${data.customerInfo.lastName}`;
    }
    
    if (data?.firstName && data?.lastName) {
      return `${data.firstName} ${data.lastName}`;
    }
    
    return 'Client';
  }

  /**
   * Génère l'URL de récupération
   */
  private generateRecoveryUrl(session: AbandonedSession): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    switch (session.stage) {
      case 'quote_created':
      case 'quote_viewed':
        return `${baseUrl}/booking/${session.temporaryId}`;
      case 'payment_initiated':
        return `${baseUrl}/payment/${session.id}`;
      default:
        return `${baseUrl}/catalogue`;
    }
  }

  /**
   * Envoie une notification de récupération
   */
  private async sendRecoveryNotification(session: AbandonedSession, strategy: RecoveryStrategy, recoveryData: any): Promise<void> {
    // Simuler l'envoi de notification
    // Dans un vrai système, ceci intégrerait avec les services de notification
    
    this.logger.info(`📧 Envoi de notification "${strategy.template}" à ${session.email || session.phone}`, {
      channels: strategy.channels,
      offer: strategy.offer,
      recoveryUrl: recoveryData.recoveryUrl
    });

    // Simuler un délai d'envoi
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Met à jour le nombre de tentatives de récupération
   */
  private async updateRecoveryAttempts(session: AbandonedSession): Promise<void> {
    if (session.quoteRequestId) {
      // Mettre à jour le QuoteRequest
      await this.prisma.quoteRequest.update({
        where: { id: session.quoteRequestId },
        data: {
          quoteData: {
            ...session.data,
            recoveryAttempts: session.recoveryAttempts + 1,
            lastRecoveryAttempt: new Date()
          }
        }
      });
    }
  }

  /**
   * Enregistre les métriques de récupération
   */
  private async recordRecoveryMetrics(results: any): Promise<void> {
    try {
      const metrics = {
        totalProcessed: results.totalProcessed,
        totalAttempts: results.totalAttempts,
        totalErrors: results.totalErrors,
        processingDate: new Date().toISOString()
      };

      this.logger.info('📊 Métriques de récupération:', metrics);

      // Optionnel : Enregistrer dans une table de métriques
      // await this.prisma.recoveryMetrics.create({
      //   data: {
      //     type: 'recovery_automation',
      //     data: metrics
      //   }
      // });

    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'enregistrement des métriques:', error);
    }
  }

  /**
   * Nettoyage des ressources
   */
  async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.info('🧹 Nettoyage terminé');
    } catch (error) {
      this.logger.error('❌ Erreur lors du nettoyage:', error);
    }
  }
}

/**
 * Fonction principale pour exécution en script
 */
async function main() {
  const processor = new RecoveryAutomationProcessor();
  
  try {
    await processor.processRecoveryAutomation();
    process.exit(0);
  } catch (error) {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  } finally {
    await processor.cleanup();
  }
}

// Exécuter le script si lancé directement
if (require.main === module) {
  main();
}

export { RecoveryAutomationProcessor }; 