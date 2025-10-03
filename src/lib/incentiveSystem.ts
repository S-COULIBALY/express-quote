import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Système d'incentives pour la récupération d'abandons
 * Gère les réductions, offres spéciales et cadeaux
 */

export type IncentiveType = 
  | 'percentage_discount'    // Réduction en pourcentage
  | 'fixed_discount'         // Réduction fixe
  | 'free_service'           // Service gratuit
  | 'upgrade'                // Upgrade gratuit
  | 'gift'                   // Cadeau
  | 'extended_warranty'      // Garantie étendue
  | 'priority_support'       // Support prioritaire
  | 'free_consultation';     // Consultation gratuite

export type IncentiveTrigger = 
  | 'form_partial'           // Formulaire partiellement rempli
  | 'quote_viewed'           // Devis consulté
  | 'payment_abandoned'      // Paiement abandonné
  | 'booking_expired'        // Réservation expirée
  | 'return_visitor'         // Visiteur de retour
  | 'high_value_customer'    // Client à haute valeur
  | 'first_time_customer';   // Premier client

export type IncentiveStatus = 'active' | 'used' | 'expired' | 'cancelled';

export interface IncentiveConfig {
  id: string;
  type: IncentiveType;
  trigger: IncentiveTrigger;
  name: string;
  description: string;
  value: number; // Pourcentage ou montant fixe
  currency?: string;
  conditions: {
    minAmount?: number;
    maxAmount?: number;
    minCompletion?: number; // Pourcentage de completion minimum
    serviceTypes?: string[];
    customerSegments?: string[];
    timeWindow?: number; // Durée de validité en millisecondes
    maxUses?: number;
    maxUsesPerCustomer?: number;
  };
  display: {
    badge?: string;
    color?: string;
    icon?: string;
    urgencyLevel?: 'low' | 'medium' | 'high';
    marketingMessage?: string;
  };
  metadata?: {
    costToCompany?: number;
    expectedConversionRate?: number;
    priority?: number;
  };
}

export interface IncentiveInstance {
  id: string;
  configId: string;
  userId?: string;
  sessionId?: string;
  status: IncentiveStatus;
  createdAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  applicableAmount?: number;
  discountAmount?: number;
  context: {
    trigger: IncentiveTrigger;
    formId?: string;
    quoteId?: string;
    bookingId?: string;
    originalAmount?: number;
    completionLevel?: number;
  };
}

export interface IncentiveApplication {
  incentiveId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  success: boolean;
  error?: string;
}

class IncentiveSystem {
  private static instance: IncentiveSystem;
  private incentiveConfigs: Map<string, IncentiveConfig> = new Map();
  private activeIncentives: Map<string, IncentiveInstance> = new Map();
  private usageStats: Map<string, { uses: number; conversions: number }> = new Map();

  private constructor() {
    this.initializeDefaultIncentives();
  }

  public static getInstance(): IncentiveSystem {
    if (!IncentiveSystem.instance) {
      IncentiveSystem.instance = new IncentiveSystem();
    }
    return IncentiveSystem.instance;
  }

  /**
   * Initialiser les incentives par défaut
   */
  private initializeDefaultIncentives(): void {
    const defaultIncentives: IncentiveConfig[] = [
      {
        id: 'form_partial_5percent',
        type: 'percentage_discount',
        trigger: 'form_partial',
        name: 'Réduction Formulaire',
        description: '5% de réduction pour avoir commencé votre demande',
        value: 5,
        conditions: {
          minCompletion: 50,
          timeWindow: 24 * 60 * 60 * 1000, // 24 heures
          maxUsesPerCustomer: 1
        },
        display: {
          badge: '5% OFF',
          color: '#4CAF50',
          icon: '🎁',
          urgencyLevel: 'medium',
          marketingMessage: 'Finalisez maintenant et économisez !'
        },
        metadata: {
          costToCompany: 5,
          expectedConversionRate: 25,
          priority: 3
        }
      },
      {
        id: 'quote_viewed_10percent',
        type: 'percentage_discount',
        trigger: 'quote_viewed',
        name: 'Réduction Devis',
        description: '10% de réduction sur votre devis',
        value: 10,
        conditions: {
          minAmount: 100,
          timeWindow: 12 * 60 * 60 * 1000, // 12 heures
          maxUsesPerCustomer: 1
        },
        display: {
          badge: '10% OFF',
          color: '#FF9800',
          icon: '💰',
          urgencyLevel: 'high',
          marketingMessage: 'Offre limitée dans le temps !'
        },
        metadata: {
          costToCompany: 10,
          expectedConversionRate: 40,
          priority: 2
        }
      },
      {
        id: 'payment_abandoned_urgent',
        type: 'fixed_discount',
        trigger: 'payment_abandoned',
        name: 'Réduction Urgente',
        description: '20€ de réduction immédiate',
        value: 20,
        currency: 'EUR',
        conditions: {
          minAmount: 150,
          timeWindow: 2 * 60 * 60 * 1000, // 2 heures
          maxUsesPerCustomer: 1
        },
        display: {
          badge: '-20€',
          color: '#F44336',
          icon: '🚨',
          urgencyLevel: 'high',
          marketingMessage: 'Offre d\'urgence valable 2h seulement !'
        },
        metadata: {
          costToCompany: 20,
          expectedConversionRate: 60,
          priority: 1
        }
      },
      {
        id: 'first_time_consultation',
        type: 'free_consultation',
        trigger: 'first_time_customer',
        name: 'Consultation Gratuite',
        description: 'Consultation gratuite pour nouveaux clients',
        value: 0,
        conditions: {
          timeWindow: 7 * 24 * 60 * 60 * 1000, // 7 jours
          maxUsesPerCustomer: 1
        },
        display: {
          badge: 'GRATUIT',
          color: '#2196F3',
          icon: '📞',
          urgencyLevel: 'low',
          marketingMessage: 'Nouvelle offre client : consultation gratuite'
        },
        metadata: {
          costToCompany: 0,
          expectedConversionRate: 30,
          priority: 4
        }
      },
      {
        id: 'high_value_upgrade',
        type: 'upgrade',
        trigger: 'high_value_customer',
        name: 'Upgrade Gratuit',
        description: 'Upgrade gratuit vers le service premium',
        value: 0,
        conditions: {
          minAmount: 500,
          serviceTypes: ['moving', 'cleaning'],
          timeWindow: 48 * 60 * 60 * 1000, // 48 heures
          maxUsesPerCustomer: 1
        },
        display: {
          badge: 'PREMIUM',
          color: '#9C27B0',
          icon: '⭐',
          urgencyLevel: 'medium',
          marketingMessage: 'Upgrade premium offert pour votre commande importante'
        },
        metadata: {
          costToCompany: 50,
          expectedConversionRate: 50,
          priority: 2
        }
      }
    ];

    defaultIncentives.forEach(config => {
      this.incentiveConfigs.set(config.id, config);
    });

    logger.info(`🎁 ${defaultIncentives.length} incentives par défaut initialisés`);
  }

  /**
   * Évaluer et déclencher des incentives
   */
  async evaluateIncentives(context: {
    trigger: IncentiveTrigger;
    userId?: string;
    sessionId?: string;
    formId?: string;
    quoteId?: string;
    bookingId?: string;
    originalAmount?: number;
    completionLevel?: number;
    serviceType?: string;
    customerSegment?: string;
  }): Promise<IncentiveInstance[]> {
    try {
      logger.info(`🎯 Évaluation incentives pour ${context.trigger}`, context);

      const eligibleIncentives = this.findEligibleIncentives(context);
      const newIncentives: IncentiveInstance[] = [];

      for (const config of eligibleIncentives) {
        const incentive = await this.createIncentiveInstance(config, context);
        if (incentive) {
          newIncentives.push(incentive);
          this.activeIncentives.set(incentive.id, incentive);
        }
      }

      if (newIncentives.length > 0) {
        logger.info(`✅ ${newIncentives.length} incentives créés`, {
          incentiveIds: newIncentives.map(i => i.id),
          trigger: context.trigger
        });
      }

      return newIncentives;

    } catch (error) {
      logger.error('Erreur lors de l\'évaluation des incentives:', error);
      return [];
    }
  }

  /**
   * Trouver les incentives éligibles
   */
  private findEligibleIncentives(context: any): IncentiveConfig[] {
    const eligible: IncentiveConfig[] = [];

    for (const config of this.incentiveConfigs.values()) {
      if (this.isIncentiveEligible(config, context)) {
        eligible.push(config);
      }
    }

    // Trier par priorité
    eligible.sort((a, b) => (a.metadata?.priority || 5) - (b.metadata?.priority || 5));

    return eligible;
  }

  /**
   * Vérifier l'éligibilité d'un incentive
   */
  private isIncentiveEligible(config: IncentiveConfig, context: any): boolean {
    // Vérifier le trigger
    if (config.trigger !== context.trigger) {
      return false;
    }

    // Vérifier les conditions
    const conditions = config.conditions;

    if (conditions.minAmount && (!context.originalAmount || context.originalAmount < conditions.minAmount)) {
      return false;
    }

    if (conditions.maxAmount && context.originalAmount && context.originalAmount > conditions.maxAmount) {
      return false;
    }

    if (conditions.minCompletion && (!context.completionLevel || context.completionLevel < conditions.minCompletion)) {
      return false;
    }

    if (conditions.serviceTypes && context.serviceType && !conditions.serviceTypes.includes(context.serviceType)) {
      return false;
    }

    if (conditions.customerSegments && context.customerSegment && !conditions.customerSegments.includes(context.customerSegment)) {
      return false;
    }

    // Vérifier l'usage maximum par client
    if (conditions.maxUsesPerCustomer && context.userId) {
      const userUsage = this.getUserUsage(context.userId, config.id);
      if (userUsage >= conditions.maxUsesPerCustomer) {
        return false;
      }
    }

    // Vérifier l'usage maximum global
    if (conditions.maxUses) {
      const globalUsage = this.getGlobalUsage(config.id);
      if (globalUsage >= conditions.maxUses) {
        return false;
      }
    }

    return true;
  }

  /**
   * Créer une instance d'incentive
   */
  private async createIncentiveInstance(config: IncentiveConfig, context: any): Promise<IncentiveInstance | null> {
    try {
      const expiresAt = new Date(Date.now() + (config.conditions.timeWindow || 24 * 60 * 60 * 1000));

      const instance: IncentiveInstance = {
        id: uuidv4(),
        configId: config.id,
        userId: context.userId,
        sessionId: context.sessionId,
        status: 'active',
        createdAt: new Date(),
        expiresAt,
        context: {
          trigger: context.trigger,
          formId: context.formId,
          quoteId: context.quoteId,
          bookingId: context.bookingId,
          originalAmount: context.originalAmount,
          completionLevel: context.completionLevel
        }
      };

      // Calculer le montant applicable si possible
      if (context.originalAmount) {
        const application = this.calculateIncentiveApplication(config, context.originalAmount);
        if (application.success) {
          instance.applicableAmount = application.finalAmount;
          instance.discountAmount = application.discountAmount;
        }
      }

      return instance;

    } catch (error) {
      logger.error('Erreur lors de la création d\'instance d\'incentive:', error);
      return null;
    }
  }

  /**
   * Appliquer un incentive à un montant
   */
  applyIncentive(incentiveId: string, originalAmount: number): IncentiveApplication {
    try {
      const instance = this.activeIncentives.get(incentiveId);
      if (!instance) {
        return {
          incentiveId,
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount,
          success: false,
          error: 'Incentive non trouvé'
        };
      }

      if (instance.status !== 'active') {
        return {
          incentiveId,
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount,
          success: false,
          error: `Incentive ${instance.status}`
        };
      }

      if (instance.expiresAt < new Date()) {
        instance.status = 'expired';
        return {
          incentiveId,
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount,
          success: false,
          error: 'Incentive expiré'
        };
      }

      const config = this.incentiveConfigs.get(instance.configId);
      if (!config) {
        return {
          incentiveId,
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount,
          success: false,
          error: 'Configuration incentive non trouvée'
        };
      }

      const application = this.calculateIncentiveApplication(config, originalAmount);
      
      if (application.success) {
        // Marquer comme utilisé
        instance.status = 'used';
        instance.usedAt = new Date();
        instance.applicableAmount = application.finalAmount;
        instance.discountAmount = application.discountAmount;

        // Mettre à jour les statistiques
        this.updateUsageStats(config.id);

        logger.info(`💰 Incentive appliqué: ${config.name}`, {
          incentiveId,
          originalAmount,
          discountAmount: application.discountAmount,
          finalAmount: application.finalAmount
        });
      }

      return application;

    } catch (error) {
      logger.error('Erreur lors de l\'application d\'incentive:', error);
      return {
        incentiveId,
        originalAmount,
        discountAmount: 0,
        finalAmount: originalAmount,
        success: false,
        error: 'Erreur système'
      };
    }
  }

  /**
   * Calculer l'application d'un incentive
   */
  private calculateIncentiveApplication(config: IncentiveConfig, originalAmount: number): IncentiveApplication {
    let discountAmount = 0;
    let finalAmount = originalAmount;

    try {
      // Vérifier les conditions de montant
      if (config.conditions.minAmount && originalAmount < config.conditions.minAmount) {
        return {
          incentiveId: config.id,
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount,
          success: false,
          error: `Montant minimum requis: ${config.conditions.minAmount}€`
        };
      }

      if (config.conditions.maxAmount && originalAmount > config.conditions.maxAmount) {
        return {
          incentiveId: config.id,
          originalAmount,
          discountAmount: 0,
          finalAmount: originalAmount,
          success: false,
          error: `Montant maximum autorisé: ${config.conditions.maxAmount}€`
        };
      }

      // Calculer la réduction selon le type
      switch (config.type) {
        case 'percentage_discount':
          discountAmount = Math.round((originalAmount * config.value) / 100 * 100) / 100;
          break;
        
        case 'fixed_discount':
          discountAmount = config.value;
          break;
        
        case 'free_service':
        case 'upgrade':
        case 'free_consultation':
          // Ces types n'affectent pas le montant directement
          discountAmount = 0;
          break;
        
        default:
          throw new Error(`Type d'incentive non supporté: ${config.type}`);
      }

      // S'assurer que la réduction ne dépasse pas le montant original
      discountAmount = Math.min(discountAmount, originalAmount);
      finalAmount = Math.max(0, originalAmount - discountAmount);

      return {
        incentiveId: config.id,
        originalAmount,
        discountAmount,
        finalAmount,
        success: true
      };

    } catch (error) {
      logger.error('Erreur lors du calcul d\'incentive:', error);
      return {
        incentiveId: config.id,
        originalAmount,
        discountAmount: 0,
        finalAmount: originalAmount,
        success: false,
        error: 'Erreur de calcul'
      };
    }
  }

  /**
   * Obtenir les incentives actifs pour un utilisateur/session
   */
  getActiveIncentives(userId?: string, sessionId?: string): IncentiveInstance[] {
    const active: IncentiveInstance[] = [];

    for (const instance of this.activeIncentives.values()) {
      if (instance.status === 'active' && instance.expiresAt > new Date()) {
        if ((userId && instance.userId === userId) || (sessionId && instance.sessionId === sessionId)) {
          active.push(instance);
        }
      }
    }

    return active;
  }

  /**
   * Obtenir les détails d'un incentive avec sa configuration
   */
  getIncentiveDetails(incentiveId: string): { instance: IncentiveInstance; config: IncentiveConfig } | null {
    const instance = this.activeIncentives.get(incentiveId);
    if (!instance) return null;

    const config = this.incentiveConfigs.get(instance.configId);
    if (!config) return null;

    return { instance, config };
  }

  /**
   * Obtenir l'usage d'un utilisateur pour un incentive
   */
  private getUserUsage(userId: string, configId: string): number {
    let usage = 0;
    for (const instance of this.activeIncentives.values()) {
      if (instance.userId === userId && instance.configId === configId && instance.status === 'used') {
        usage++;
      }
    }
    return usage;
  }

  /**
   * Obtenir l'usage global d'un incentive
   */
  private getGlobalUsage(configId: string): number {
    const stats = this.usageStats.get(configId);
    return stats ? stats.uses : 0;
  }

  /**
   * Mettre à jour les statistiques d'usage
   */
  private updateUsageStats(configId: string): void {
    const current = this.usageStats.get(configId) || { uses: 0, conversions: 0 };
    current.uses++;
    current.conversions++;
    this.usageStats.set(configId, current);
  }

  /**
   * Nettoyer les incentives expirés
   */
  cleanupExpiredIncentives(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, instance] of this.activeIncentives.entries()) {
      if (instance.expiresAt < now && instance.status === 'active') {
        instance.status = 'expired';
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`🧹 ${cleanedCount} incentives expirés nettoyés`);
    }
  }

  /**
   * Obtenir les statistiques des incentives
   */
  getIncentiveStats(): {
    totalActive: number;
    totalUsed: number;
    totalExpired: number;
    usageByType: Record<string, number>;
    conversionRate: number;
  } {
    let totalActive = 0;
    let totalUsed = 0;
    let totalExpired = 0;
    const usageByType: Record<string, number> = {};

    for (const instance of this.activeIncentives.values()) {
      const config = this.incentiveConfigs.get(instance.configId);
      if (!config) continue;

      switch (instance.status) {
        case 'active':
          totalActive++;
          break;
        case 'used':
          totalUsed++;
          usageByType[config.type] = (usageByType[config.type] || 0) + 1;
          break;
        case 'expired':
          totalExpired++;
          break;
      }
    }

    const conversionRate = totalActive > 0 ? (totalUsed / (totalActive + totalUsed)) * 100 : 0;

    return {
      totalActive,
      totalUsed,
      totalExpired,
      usageByType,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  }
}

// Export du singleton
export const incentiveSystem = IncentiveSystem.getInstance();

// Hook React pour utiliser les incentives
export const useIncentives = (userId?: string, sessionId?: string) => {
  const system = IncentiveSystem.getInstance();
  
  return {
    evaluateIncentives: (context: any) => system.evaluateIncentives(context),
    applyIncentive: (incentiveId: string, amount: number) => system.applyIncentive(incentiveId, amount),
    getActiveIncentives: () => system.getActiveIncentives(userId, sessionId),
    getIncentiveDetails: (incentiveId: string) => system.getIncentiveDetails(incentiveId),
    getStats: () => system.getIncentiveStats()
  };
}; 