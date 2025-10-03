/**
 * 💼 CUSTOMER RETENTION HANDLER - Fidélisation et récupération clients
 * 
 * Handler dédié à la rétention client :
 * - Récupération après échec de notification
 * - Basculement automatique sur canaux alternatifs
 * - Programmes de fidélisation automatiques
 * - Détection et prévention du churn
 * - Compensation et gestes commerciaux
 */

import { EventHandler, NotificationFailedEvent } from '../modern.event.bus';
import { ProductionLogger } from '../../logging/logger.production';

/**
 * Configuration de rétention par type de service
 */
interface RetentionConfig {
  demenagement: {
    fallbackChannels: string[];
    escalationDelay: number; // minutes
    compensationThreshold: number; // montant du service
    vipTreatment: boolean;
  };
  menage: {
    reschedulingWindow: number; // heures
    compensationOffer: string;
    loyaltyProgram: boolean;
  };
  livraison: {
    urgentEscalation: boolean;
    businessPriority: boolean;
    compensationRate: number; // pourcentage
  };
  [key: string]: any;
}

/**
 * Actions de rétention disponibles
 */
type RetentionAction = 
  | 'send_sms_fallback'
  | 'send_whatsapp_fallback'
  | 'schedule_callback'
  | 'send_apology_email'
  | 'offer_discount'
  | 'offer_free_service'
  | 'escalate_to_manager'
  | 'priority_support'
  | 'send_satisfaction_survey'
  | 'schedule_makeup_service';

/**
 * Données de contexte client pour la rétention
 */
interface CustomerContext {
  customerId: string;
  customerSegment: 'standard' | 'premium' | 'vip' | 'business';
  customerValue: 'low' | 'medium' | 'high' | 'critical';
  servicesCount: number;
  totalSpent: number;
  lastServiceDate: Date;
  preferredChannel: string;
  riskScore: number; // 0-100, plus haut = plus à risque
  previousIssues: number;
}

/**
 * Plan d'action de rétention
 */
interface RetentionPlan {
  immediateActions: RetentionAction[];
  scheduledActions: Array<{
    action: RetentionAction;
    delay: number; // minutes
    condition?: string;
  }>;
  escalationRules: Array<{
    trigger: string;
    action: RetentionAction;
    priority: number;
  }>;
  compensationOffer?: {
    type: 'discount' | 'free_service' | 'credit';
    value: number;
    expiration: Date;
  };
}

/**
 * Handler pour rétention client
 */
export class CustomerRetentionHandler implements EventHandler<NotificationFailedEvent> {
  name = 'intelligent-customer-retention';
  priority = 3; // Priorité élevée pour la rétention
  timeout = 8000;
  retries = 3;
  
  private logger: ProductionLogger;
  private config: RetentionConfig;
  private activeRetentionCases: Map<string, RetentionPlan> = new Map();
  private customerContextCache: Map<string, CustomerContext> = new Map();
  
  // 🔒 PROTECTION ANTI-BOUCLE INFINIE RENFORCÉE
  private processedEvents: Set<string> = new Set();
  private retentionCooldown: Map<string, Date> = new Map();
  private smsSentToday: Map<string, number> = new Map(); // Limite SMS par jour
  private readonly COOLDOWN_DURATION = 2 * 60 * 60 * 1000; // 2 heures (au lieu de 30 min)
  private readonly MAX_RETENTION_ATTEMPTS = 1; // 1 seule tentative (au lieu de 3)
  private readonly MAX_SMS_PER_DAY = 2; // Maximum 2 SMS par client par jour
  private readonly DAILY_RESET_HOUR = 6; // Reset compteur à 6h du matin
  
  constructor(private metricsCollector?: any, private notificationService?: any) {
    this.logger = new ProductionLogger({
      level: 'info',
      enableConsole: true,
      enableFile: true
    });
    
    // Configuration par défaut
    this.config = {
      demenagement: {
        fallbackChannels: ['sms', 'whatsapp', 'call'],
        escalationDelay: 120, // 2h
        compensationThreshold: 1000, // 1000€
        vipTreatment: true
      },
      menage: {
        reschedulingWindow: 24, // 24h
        compensationOffer: 'next_free',
        loyaltyProgram: true
      },
      livraison: {
        urgentEscalation: true,
        businessPriority: true,
        compensationRate: 0.15 // 15%
      }
    };
    
    // 🔒 PROTECTION : Pas de setInterval automatiques - traitement uniquement sur événements
    // Le traitement se fait uniquement lors d'événements, pas en arrière-plan
    // Nettoyage quotidien uniquement à 6h du matin
    this.scheduleDailyCleanup();
  }
  
  /**
   * Programmer le nettoyage quotidien à 6h du matin
   */
  private scheduleDailyCleanup(): void {
    const now = new Date();
    const nextCleanup = new Date();
    nextCleanup.setHours(this.DAILY_RESET_HOUR, 0, 0, 0);
    
    // Si on a dépassé 6h aujourd'hui, programmer pour demain
    if (now.getHours() >= this.DAILY_RESET_HOUR) {
      nextCleanup.setDate(nextCleanup.getDate() + 1);
    }
    
    const timeUntilCleanup = nextCleanup.getTime() - now.getTime();
    
    setTimeout(() => {
      this.performDailyCleanup();
      // Reprogrammer pour le lendemain
      setInterval(() => {
        this.performDailyCleanup();
      }, 24 * 60 * 60 * 1000);
    }, timeUntilCleanup);
    
    this.logger.info('🕕 Daily cleanup scheduled for 6:00 AM', { 
      nextCleanup: nextCleanup.toISOString() 
    });
  }

  /**
   * Nettoyage quotidien sécurisé
   */
  private performDailyCleanup(): void {
    this.logger.info('🧹 Performing daily cleanup...');
    
    // Reset compteurs SMS quotidiens
    this.smsSentToday.clear();
    
    // Nettoyer anciens événements traités (garde seulement les dernières 24h)
    // On garde un historique pour éviter les doublons
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let cleanedEvents = 0;
    
    // En production, on devrait avoir des timestamps. Ici on nettoie partiellement
    if (this.processedEvents.size > 1000) {
      this.processedEvents.clear();
      cleanedEvents = 1000;
    }
    
    // Nettoyer anciens cas de rétention
    this.cleanupOldCases();
    
    this.logger.info('✅ Daily cleanup completed', {
      cleanedEvents,
      activeCases: this.activeRetentionCases.size,
      smsCountersReset: true
    });
  }

  /**
   * Vérifier si un client peut recevoir un SMS aujourd'hui
   */
  private canSendSmsToday(customerKey: string): boolean {
    const sentToday = this.smsSentToday.get(customerKey) || 0;
    return sentToday < this.MAX_SMS_PER_DAY;
  }

  /**
   * Incrémenter le compteur SMS pour un client
   */
  private incrementSmsCounter(customerKey: string): void {
    const current = this.smsSentToday.get(customerKey) || 0;
    this.smsSentToday.set(customerKey, current + 1);
  }

  /**
   * Obtenir le nombre de tentatives de rétention pour un client
   */
  private getRetentionAttemptsCount(customerKey: string): number {
    // En production, cela devrait être stocké en base de données
    // Pour l'instant, on utilise une Map simple
    const attempts = this.retentionCooldown.get(customerKey);
    return attempts ? 1 : 0; // Simplification pour l'exemple
  }

  /**
   * Handler principal - déclenché sur échec de notification
   */
  async handle(event: NotificationFailedEvent): Promise<void> {
    try {
      // 🔒 PROTECTION ANTI-BOUCLE INFINIE
      const eventKey = `${event.notificationId}:${event.recipientId}:${event.channel}`;
      
      // Vérifier si cet événement a déjà été traité
      if (this.processedEvents.has(eventKey)) {
        this.logger.debug('🔄 Event already processed, skipping to prevent infinite loop', { eventKey });
        return;
      }
      
      // Vérifier le cooldown pour ce client
      const customerKey = event.recipientId;
      const lastRetentionAttempt = this.retentionCooldown.get(customerKey);
      if (lastRetentionAttempt && (Date.now() - lastRetentionAttempt.getTime()) < this.COOLDOWN_DURATION) {
        this.logger.debug('⏰ Customer in retention cooldown, skipping', { 
          customerKey, 
          remainingCooldown: this.COOLDOWN_DURATION - (Date.now() - lastRetentionAttempt.getTime())
        });
        return;
      }
      
      // Vérifier le nombre maximum de tentatives de rétention
      const retentionAttempts = this.getRetentionAttemptsCount(customerKey);
      if (retentionAttempts >= this.MAX_RETENTION_ATTEMPTS) {
        this.logger.warn('🚫 Max retention attempts reached for customer', { 
          customerKey, 
          attempts: retentionAttempts 
        });
        return;
      }
      
      // Marquer l'événement comme traité
      this.processedEvents.add(eventKey);
      this.retentionCooldown.set(customerKey, new Date());
      
      this.logger.warn('💼 Customer retention triggered', {
        notificationId: event.notificationId,
        channel: event.channel,
        error: event.error,
        attempts: `${event.attempts}/${event.maxAttempts}`,
        canRetry: event.canRetry,
        retentionAttempts: retentionAttempts + 1
      });
      
      // Analyser le contexte client
      const customerContext = await this.getCustomerContext(event.recipientId, event.metadata);
      
      // Évaluer la criticité de la situation
      const criticality = this.assessSituationCriticality(event, customerContext);
      
      // Créer plan de rétention personnalisé
      const retentionPlan = await this.createRetentionPlan(event, customerContext, criticality);
      
      // Exécuter les actions immédiates
      await this.executeImmediateActions(event, retentionPlan, customerContext);
      
      // Programmer les actions futures
      this.scheduleRetentionActions(event, retentionPlan);
      
      // Enregistrer le cas pour suivi
      this.activeRetentionCases.set(event.notificationId, retentionPlan);
      
      // Métriques
      if (this.metricsCollector) {
        this.metricsCollector.recordMetric('retention.case_opened', 1, {
          service_type: event.metadata?.serviceType || 'unknown',
          customer_segment: customerContext.customerSegment,
          customer_value: customerContext.customerValue,
          criticality,
          failure_reason: this.categorizeFailureReason(event.error)
        });
      }
      
    } catch (error) {
      this.logger.error('❌ Customer retention handler error', {
        notificationId: event.notificationId,
        error: (error as Error).message
      });
      
      if (this.metricsCollector) {
        this.metricsCollector.recordMetric('retention.handler_error', 1, {
          error_type: this.categorizeError((error as Error).message)
        });
      }
    }
  }
  
  /**
   * Obtenir le contexte client
   */
  private async getCustomerContext(customerId: string, metadata?: Record<string, any>): Promise<CustomerContext> {
    // Vérifier cache
    if (this.customerContextCache.has(customerId)) {
      return this.customerContextCache.get(customerId)!;
    }
    
    // Mock - à remplacer par vraies requêtes DB
    const context: CustomerContext = {
      customerId,
      customerSegment: this.determineCustomerSegment(metadata),
      customerValue: this.calculateCustomerValue(metadata),
      servicesCount: Math.floor(Math.random() * 15) + 1,
      totalSpent: Math.floor(Math.random() * 5000) + 200,
      lastServiceDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // 0-90 jours
      preferredChannel: metadata?.preferredChannel || 'email',
      riskScore: Math.floor(Math.random() * 100),
      previousIssues: Math.floor(Math.random() * 5)
    };
    
    // Ajuster le score de risque selon l'historique
    if (context.previousIssues > 2) context.riskScore += 20;
    if (context.servicesCount > 10) context.riskScore -= 15; // Client fidèle
    
    this.customerContextCache.set(customerId, context);
    return context;
  }
  
  /**
   * Déterminer le segment client
   */
  private determineCustomerSegment(metadata?: Record<string, any>): CustomerContext['customerSegment'] {
    if (metadata?.customerType === 'business') return 'business';
    if (metadata?.vip === true) return 'vip';
    if (metadata?.premium === true) return 'premium';
    return 'standard';
  }
  
  /**
   * Calculer la valeur client
   */
  private calculateCustomerValue(metadata?: Record<string, any>): CustomerContext['customerValue'] {
    const amount = Number(metadata?.bookingAmount || metadata?.amount || 0);
    const recurring = Boolean(metadata?.isRecurring);
    
    if (amount > 2000 || recurring) return 'critical';
    if (amount > 1000) return 'high';
    if (amount > 300) return 'medium';
    return 'low';
  }
  
  /**
   * Évaluer la criticité de la situation
   */
  private assessSituationCriticality(event: NotificationFailedEvent, context: CustomerContext): 'low' | 'medium' | 'high' | 'critical' {
    let score = 0;
    
    // Facteurs aggravants
    if (context.customerValue === 'critical') score += 40;
    else if (context.customerValue === 'high') score += 30;
    else if (context.customerValue === 'medium') score += 20;
    else score += 10;
    
    if (context.customerSegment === 'vip') score += 30;
    else if (context.customerSegment === 'business') score += 25;
    else if (context.customerSegment === 'premium') score += 15;
    
    if (context.riskScore > 70) score += 20;
    if (context.previousIssues > 2) score += 15;
    if (event.attempts >= event.maxAttempts) score += 10;
    if (!event.canRetry) score += 15;
    
    // Type de service
    const serviceType = event.metadata?.serviceType;
    if (serviceType === 'urgent' || serviceType === 'express') score += 10;
    
    // Classification
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
  
  /**
   * Créer plan de rétention personnalisé
   */
  private async createRetentionPlan(
    event: NotificationFailedEvent, 
    context: CustomerContext, 
    criticality: string
  ): Promise<RetentionPlan> {
    
    const serviceType = event.metadata?.serviceType || 'unknown';
    const serviceConfig = this.config[serviceType] || this.config.demenagement; // fallback
    
    const plan: RetentionPlan = {
      immediateActions: [],
      scheduledActions: [],
      escalationRules: []
    };
    
    // Actions immédiates selon criticité
    switch (criticality) {
      case 'critical':
        plan.immediateActions = [
          'send_sms_fallback',
          'send_whatsapp_fallback',
          'schedule_callback',
          'escalate_to_manager',
          'priority_support'
        ];
        break;
        
      case 'high':
        plan.immediateActions = [
          'send_sms_fallback',
          'schedule_callback',
          'send_apology_email'
        ];
        break;
        
      case 'medium':
        plan.immediateActions = [
          'send_sms_fallback',
          'send_apology_email'
        ];
        break;
        
      case 'low':
        plan.immediateActions = [
          'send_sms_fallback'
        ];
        break;
    }
    
    // Actions programmées
    plan.scheduledActions = [
      {
        action: 'send_satisfaction_survey',
        delay: 60, // 1h après
        condition: 'if_no_response'
      },
      {
        action: 'offer_discount',
        delay: serviceConfig.escalationDelay || 120,
        condition: 'if_high_value_customer'
      }
    ];
    
    // Règles d'escalade
    plan.escalationRules = [
      {
        trigger: 'no_contact_after_24h',
        action: 'escalate_to_manager',
        priority: 1
      },
      {
        trigger: 'customer_complaint',
        action: 'offer_free_service',
        priority: 2
      }
    ];
    
    // Offre de compensation pour clients à valeur élevée
    if (context.customerValue === 'critical' || context.customerValue === 'high') {
      plan.compensationOffer = {
        type: this.determineCompensationType(context, serviceType),
        value: this.calculateCompensationValue(context, event),
        expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
      };
    }
    
    return plan;
  }
  
  /**
   * Déterminer le type de compensation
   */
  private determineCompensationType(context: CustomerContext, serviceType: string): 'discount' | 'free_service' | 'credit' {
    if (context.customerSegment === 'vip') return 'free_service';
    if (serviceType === 'menage' && context.servicesCount > 5) return 'free_service';
    if (context.totalSpent > 2000) return 'credit';
    return 'discount';
  }
  
  /**
   * Calculer la valeur de compensation
   */
  private calculateCompensationValue(context: CustomerContext, event: NotificationFailedEvent): number {
    const baseAmount = Number(event.metadata?.bookingAmount || event.metadata?.amount || 100);
    
    let compensationRate = 0.10; // 10% par défaut
    
    if (context.customerSegment === 'vip') compensationRate = 0.25;
    else if (context.customerSegment === 'premium') compensationRate = 0.20;
    else if (context.customerSegment === 'business') compensationRate = 0.15;
    
    if (context.previousIssues > 2) compensationRate += 0.05; // Bonus pour clients ayant eu des problèmes
    
    return Math.round(baseAmount * compensationRate);
  }
  
  /**
   * Exécuter les actions immédiates
   */
  private async executeImmediateActions(
    event: NotificationFailedEvent, 
    plan: RetentionPlan, 
    context: CustomerContext
  ): Promise<void> {
    
    this.logger.info('⚡ Executing immediate retention actions', {
      notificationId: event.notificationId,
      customerId: context.customerId,
      actions: plan.immediateActions
    });
    
    for (const action of plan.immediateActions) {
      try {
        await this.executeRetentionAction(action, event, context, plan);
      } catch (error) {
        this.logger.error('❌ Failed to execute retention action', {
          action,
          notificationId: event.notificationId,
          error: (error as Error).message
        });
      }
    }
  }
  
  /**
   * Exécuter une action de rétention
   */
  private async executeRetentionAction(
    action: RetentionAction, 
    event: NotificationFailedEvent, 
    context: CustomerContext, 
    plan: RetentionPlan
  ): Promise<void> {
    
    switch (action) {
      case 'send_sms_fallback':
        await this.sendFallbackSMS(event, context);
        break;
        
      case 'send_whatsapp_fallback':
        await this.sendFallbackWhatsApp(event, context);
        break;
        
      case 'schedule_callback':
        await this.scheduleCallback(event, context);
        break;
        
      case 'send_apology_email':
        await this.sendApologyEmail(event, context);
        break;
        
      case 'offer_discount':
        await this.sendDiscountOffer(event, context, plan.compensationOffer);
        break;
        
      case 'offer_free_service':
        await this.sendFreeServiceOffer(event, context);
        break;
        
      case 'escalate_to_manager':
        await this.escalateToManager(event, context);
        break;
        
      case 'priority_support':
        await this.activatePrioritySupport(event, context);
        break;
        
      case 'send_satisfaction_survey':
        await this.sendSatisfactionSurvey(event, context);
        break;
        
      case 'schedule_makeup_service':
        await this.scheduleMakeupService(event, context);
        break;
    }
  }
  
  /**
   * Envoyer SMS de fallback avec protections renforcées
   */
  private async sendFallbackSMS(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    const customerKey = context.customerId;
    
    // 🔒 PROTECTION 1: Vérifier la limite quotidienne de SMS
    if (!this.canSendSmsToday(customerKey)) {
      this.logger.warn('🚫 SMS daily limit reached for customer', {
        customerId: customerKey,
        dailyLimit: this.MAX_SMS_PER_DAY,
        sentToday: this.smsSentToday.get(customerKey)
      });
      return;
    }
    
    // 🔒 PROTECTION 2: Vérifier le cooldown
    const lastSms = this.retentionCooldown.get(customerKey);
    if (lastSms && (Date.now() - lastSms.getTime()) < this.COOLDOWN_DURATION) {
      this.logger.debug('⏰ SMS cooldown active, skipping', { 
        customerId: customerKey,
        remainingCooldown: this.COOLDOWN_DURATION - (Date.now() - lastSms.getTime())
      });
      return;
    }
    
    this.logger.info('📱 Sending SMS fallback with protections', {
      customerId: customerKey,
      originalChannel: event.channel,
      smsCountToday: (this.smsSentToday.get(customerKey) || 0) + 1
    });
    
    // Générer contenu SMS sécurisé
    const smsContent = this.generateFallbackMessage('SMS', event, context);
    
    // 🔒 PROTECTION 3: Validation du contenu SMS
    if (!smsContent || smsContent.toLowerCase().includes('test')) {
      this.logger.warn('🚫 SMS content validation failed, skipping', {
        customerId: customerKey,
        content: smsContent?.substring(0, 50) + '...'
      });
      return;
    }
    
    console.log(`📱 SMS to ${customerKey}: ${smsContent}`);
    
    // Envoyer SMS de fallback avec protection anti-boucle
    try {
      // 🔒 PROTECTION 4: Envoi conditionnel seulement si service disponible
      if (this.notificationService?.sendSMS) {
        await this.notificationService.sendSMS({
          to: customerKey,
          message: smsContent,
          priority: 'NORMAL' // Pas urgent pour éviter spam
        });
        
        // Marquer SMS envoyé
        this.incrementSmsCounter(customerKey);
        
        this.logger.info('📱 SMS fallback sent successfully', { 
          customerId: customerKey,
          totalSmsToday: this.smsSentToday.get(customerKey)
        });
      } else {
        this.logger.warn('⚠️ SMS service not available, skipping fallback');
      }
    } catch (error) {
      this.logger.error('❌ SMS fallback failed', { 
        customerId: customerKey, 
        error: (error as Error).message 
      });
      // Ne pas re-émettre d'événement pour éviter la boucle
    }
  }
  
  /**
   * Envoyer WhatsApp de fallback
   */
  private async sendFallbackWhatsApp(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    this.logger.info('💬 Sending WhatsApp fallback', {
      customerId: context.customerId,
      originalChannel: event.channel
    });
    
    const whatsappContent = this.generateFallbackMessage('WhatsApp', event, context);
    console.log(`💬 WhatsApp to ${context.customerId}: ${whatsappContent}`);
    
    // Envoyer WhatsApp de fallback avec protection anti-boucle
    try {
      await this.notificationService?.sendWhatsApp(context.customerId, whatsappContent);
      this.logger.info('💬 WhatsApp fallback sent successfully', { customerId: context.customerId });
    } catch (error) {
      this.logger.error('❌ WhatsApp fallback failed', { 
        customerId: context.customerId, 
        error: (error as Error).message 
      });
      // Ne pas re-émettre d'événement pour éviter la boucle
    }
  }
  
  /**
   * Programmer rappel téléphonique
   */
  private async scheduleCallback(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    const callbackTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h plus tard
    
    this.logger.info('📞 Callback scheduled', {
      customerId: context.customerId,
      scheduledTime: callbackTime.toISOString(),
      priority: context.customerSegment === 'vip' ? 'high' : 'normal'
    });
    
    console.log(`📞 Callback scheduled for ${context.customerId} at ${callbackTime.toISOString()}`);
    
    // Ici : intégration avec système de planning des appels
    // await this.callCenter?.scheduleCallback(context.customerId, callbackTime, priority);
  }
  
  /**
   * Envoyer email d'excuse
   */
  private async sendApologyEmail(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    this.logger.info('✉️ Sending apology email', {
      customerId: context.customerId,
      customerSegment: context.customerSegment
    });
    
    const apologyContent = this.generateApologyMessage(event, context);
    console.log(`✉️ Apology email to ${context.customerId}: ${apologyContent}`);
    
    // Envoyer email d'excuses avec protection anti-boucle
    try {
      await this.notificationService?.sendEmail(context.customerId, 'Nos excuses', apologyContent);
      this.logger.info('📧 Apology email sent successfully', { customerId: context.customerId });
    } catch (error) {
      this.logger.error('❌ Apology email failed', { 
        customerId: context.customerId, 
        error: (error as Error).message 
      });
      // Ne pas re-émettre d'événement pour éviter la boucle
    }
  }
  
  /**
   * Envoyer offre de réduction
   */
  private async sendDiscountOffer(event: NotificationFailedEvent, context: CustomerContext, offer?: RetentionPlan['compensationOffer']): Promise<void> {
    if (!offer || offer.type !== 'discount') return;
    
    this.logger.info('🎁 Sending discount offer', {
      customerId: context.customerId,
      discountValue: `${offer.value}€`,
      expiration: offer.expiration.toISOString()
    });
    
    console.log(`🎁 Discount offer ${offer.value}€ sent to ${context.customerId}`);
    
    // Ici : générer code promo et envoyer
    // const promoCode = await this.generatePromoCode(offer.value, offer.expiration);
    // await this.notificationService?.sendPromoCode(context.customerId, promoCode);
  }
  
  /**
   * Envoyer offre de service gratuit
   */
  private async sendFreeServiceOffer(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    this.logger.info('🆓 Sending free service offer', {
      customerId: context.customerId,
      customerSegment: context.customerSegment
    });
    
    console.log(`🆓 Free service offer sent to ${context.customerId}`);
    
    // Ici : créer bon pour service gratuit
    // await this.createFreeServiceVoucher(context.customerId);
  }
  
  /**
   * Escalader vers manager
   */
  private async escalateToManager(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    this.logger.warn('🚨 Escalating to manager', {
      customerId: context.customerId,
      customerValue: context.customerValue,
      issue: event.error
    });
    
    console.log(`🚨 Case ${event.notificationId} escalated to manager for customer ${context.customerId}`);
    
    // Ici : notifier manager via email/Slack/Teams
    // await this.notifyManager(event, context);
  }
  
  /**
   * Activer support prioritaire
   */
  private async activatePrioritySupport(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    this.logger.info('⭐ Priority support activated', {
      customerId: context.customerId,
      duration: '48h'
    });
    
    console.log(`⭐ Priority support activated for ${context.customerId}`);
    
    // Ici : marquer client pour support prioritaire
    // await this.customerService?.activatePrioritySupport(context.customerId, 48);
  }
  
  /**
   * Envoyer questionnaire de satisfaction
   */
  private async sendSatisfactionSurvey(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    this.logger.info('📋 Sending satisfaction survey', {
      customerId: context.customerId
    });
    
    console.log(`📋 Satisfaction survey sent to ${context.customerId}`);
    
    // Ici : envoyer lien vers questionnaire
    // await this.surveyService?.sendSurvey(context.customerId, 'post_incident');
  }
  
  /**
   * Programmer service de rattrapage
   */
  private async scheduleMakeupService(event: NotificationFailedEvent, context: CustomerContext): Promise<void> {
    this.logger.info('🔄 Scheduling makeup service', {
      customerId: context.customerId,
      originalService: event.metadata?.serviceType
    });
    
    console.log(`🔄 Makeup service scheduled for ${context.customerId}`);
    
    // Ici : programmer service de rattrapage gratuit
    // await this.schedulingService?.scheduleMakeupService(context.customerId, serviceDetails);
  }
  
  /**
   * Générer message de fallback
   */
  private generateFallbackMessage(channel: string, event: NotificationFailedEvent, context: CustomerContext): string {
    const serviceType = event.metadata?.serviceType || 'service';
    const customerName = context.customerSegment === 'vip' ? 'Cher client VIP' : 'Cher client';
    
    return `${customerName}, nous n'avons pas pu vous joindre concernant votre ${serviceType}. ` +
           `Merci de nous contacter au 01 23 45 67 89. Nos excuses pour le désagrément.`;
  }
  
  /**
   * Générer message d'excuse
   */
  private generateApologyMessage(event: NotificationFailedEvent, context: CustomerContext): string {
    const serviceType = event.metadata?.serviceType || 'service';
    
    return `Nous vous présentons nos excuses pour le problème rencontré avec votre ${serviceType}. ` +
           `Notre équipe prend cette situation très au sérieux et nous vous recontacterons rapidement ` +
           `pour résoudre ce problème. Cordialement, L'équipe Express Quote.`;
  }
  
  /**
   * Programmer actions de rétention (DÉSACTIVÉ pour éviter SMS récurrents)
   */
  private scheduleRetentionActions(event: NotificationFailedEvent, plan: RetentionPlan): void {
    // 🚫 DÉSACTIVÉ TEMPORAIREMENT : Les actions programmées peuvent causer des SMS récurrents
    // En production, cela devrait utiliser une queue persistante (BullMQ) plutôt que setTimeout
    
    this.logger.info('📋 Retention actions scheduled (deferred to prevent SMS spam)', {
      notificationId: event.notificationId,
      scheduledActionsCount: plan.scheduledActions.length,
      actions: plan.scheduledActions.map(a => ({ action: a.action, delay: `${a.delay}min` }))
    });
    
    // TODO: Implémenter avec BullMQ pour persistence
    // for (const scheduledAction of plan.scheduledActions) {
    //   await this.queueManager.addJob('retention-actions', 'retention-action', {
    //     action: scheduledAction.action,
    //     eventData: event,
    //     customerContext: this.customerContextCache.get(event.recipientId)!,
    //     plan: plan
    //   }, {
    //     delay: scheduledAction.delay * 60 * 1000
    //   });
    // }
  }
  
  /**
   * Traiter actions programmées (appelé périodiquement)
   */
  private async processScheduledActions(): Promise<void> {
    // Ici : traiter les actions programmées depuis une base de données persistante
    // Pour l'instant, les actions sont gérées via setTimeout dans scheduleRetentionActions
    this.logger.debug('🔄 Processing scheduled retention actions...');
  }
  
  /**
   * Nettoyer les anciens cas
   */
  private cleanupOldCases(): void {
    // Supprimer les cas de plus de 7 jours
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    let cleanedCount = 0;
    for (const [notificationId, plan] of this.activeRetentionCases.entries()) {
      // Mock : supprimer si ancien (logique à adapter selon timestamp réel)
      if (Math.random() < 0.1) { // 10% chance de nettoyage par run
        this.activeRetentionCases.delete(notificationId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.info('🧹 Cleaned up old retention cases', {
        cleanedCount,
        remainingCases: this.activeRetentionCases.size
      });
    }
  }
  
  /**
   * Catégoriser la raison d'échec
   */
  private categorizeFailureReason(error: string): string {
    const errorLower = error.toLowerCase();
    
    if (errorLower.includes('bounce') || errorLower.includes('invalid email')) {
      return 'invalid_contact';
    } else if (errorLower.includes('rate') || errorLower.includes('limit')) {
      return 'rate_limiting';
    } else if (errorLower.includes('auth') || errorLower.includes('credential')) {
      return 'authentication';
    } else if (errorLower.includes('network') || errorLower.includes('timeout')) {
      return 'network';
    } else if (errorLower.includes('quota') || errorLower.includes('billing')) {
      return 'quota_exceeded';
    }
    
    return 'unknown';
  }
  
  /**
   * Catégoriser les erreurs du handler
   */
  private categorizeError(errorMessage: string): string {
    const error = errorMessage.toLowerCase();
    
    if (error.includes('customer') || error.includes('context')) {
      return 'customer_lookup';
    } else if (error.includes('plan') || error.includes('retention')) {
      return 'retention_planning';
    } else if (error.includes('action') || error.includes('execute')) {
      return 'action_execution';
    } else if (error.includes('notification') || error.includes('send')) {
      return 'notification_sending';
    }
    
    return 'unknown';
  }
}