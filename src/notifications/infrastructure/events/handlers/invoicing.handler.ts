/**
 * 🧾 INVOICING HANDLER - Facturation automatique intelligente
 * 
 * Handler dédié à la facturation automatique :
 * - Génération factures après confirmation service
 * - Gestion paiements échelonnés (acompte/solde)
 * - Facturation services additionnels
 * - Remises et fidélisation automatiques
 * - Relances et suivi des impayés
 */

import { EventHandler, NotificationSentEvent } from '../modern.event.bus';
import { ProductionLogger } from '../../logging/logger.production';

/**
 * Configuration de facturation par type de service
 */
interface InvoicingConfig {
  demenagement: {
    depositPercent: number;
    finalInvoiceDelay: number; // jours
    loyaltyThreshold: number; // nombre de services
    loyaltyDiscount: number; // pourcentage
  };
  menage: {
    groupByMonth: boolean;
    loyaltyDiscount: number;
    loyaltyMonthsThreshold: number;
  };
  livraison: {
    immediateInvoicing: boolean;
    expressSurcharge: number;
    businessClientDiscount: number;
  };
  [key: string]: any;
}

/**
 * Données de facturation extraites des événements
 */
interface InvoiceData {
  bookingId: string;
  customerId: string;
  serviceType: string;
  amount: number;
  invoiceType: 'deposit' | 'final' | 'full' | 'addon' | 'recurring';
  dueDate: Date;
  paymentSchedule?: 'immediate' | 'split' | 'monthly';
  discounts?: Array<{
    type: string;
    amount: number;
    reason: string;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Handler pour facturation automatique
 */
export class InvoicingHandler implements EventHandler<NotificationSentEvent> {
  name = 'intelligent-invoicing';
  priority = 4; // Après les handlers critiques mais avant analytics
  timeout = 5000;
  retries = 2;
  
  private logger: ProductionLogger;
  private config: InvoicingConfig;
  private pendingInvoices: Map<string, InvoiceData[]> = new Map();
  
  constructor(private metricsCollector?: any, private repository?: any) {
    this.logger = new ProductionLogger({
      level: 'info',
      enableConsole: true,
      enableFile: true
    });
    
    // Configuration par défaut
    this.config = {
      demenagement: {
        depositPercent: 30,
        finalInvoiceDelay: 0, // Jour J
        loyaltyThreshold: 3, // 3 services
        loyaltyDiscount: 0.05 // 5%
      },
      menage: {
        groupByMonth: true,
        loyaltyDiscount: 0.05,
        loyaltyMonthsThreshold: 3
      },
      livraison: {
        immediateInvoicing: true,
        expressSurcharge: 0.20, // 20%
        businessClientDiscount: 0.10 // 10%
      }
    };
    
    // Traitement périodique des factures en attente
    setInterval(() => {
      this.processScheduledInvoices();
    }, 60 * 60 * 1000); // Chaque heure
  }
  
  /**
   * Handler principal - déclenché quand notification envoyée avec succès
   */
  async handle(event: NotificationSentEvent): Promise<void> {
    try {
      // Analyser si cette notification nécessite une facturation
      const invoiceData = this.extractInvoiceData(event);
      
      if (!invoiceData) {
        return; // Pas de facturation nécessaire
      }
      
      this.logger.info('🧾 Invoice processing triggered', {
        notificationId: event.notificationId,
        serviceType: invoiceData.serviceType,
        invoiceType: invoiceData.invoiceType,
        amount: `${invoiceData.amount}€`
      });
      
      // Traitement selon le type de facturation
      switch (invoiceData.invoiceType) {
        case 'deposit':
          await this.processDepositInvoice(invoiceData);
          break;
          
        case 'final':
          await this.processFinalInvoice(invoiceData);
          break;
          
        case 'full':
          await this.processFullInvoice(invoiceData);
          break;
          
        case 'addon':
          await this.processAddonInvoice(invoiceData);
          break;
          
        case 'recurring':
          await this.processRecurringInvoice(invoiceData);
          break;
      }
      
      // Enregistrer métriques
      if (this.metricsCollector) {
        this.metricsCollector.recordMetric('invoice.generated', 1, {
          service_type: invoiceData.serviceType,
          invoice_type: invoiceData.invoiceType,
          amount_range: this.getAmountRange(invoiceData.amount)
        });
      }
      
    } catch (error) {
      this.logger.error('❌ Invoicing handler error', {
        notificationId: event.notificationId,
        error: (error as Error).message
      });
      
      // Ne pas faire échouer le flux principal
      if (this.metricsCollector) {
        this.metricsCollector.recordMetric('invoice.error', 1, {
          error_type: this.categorizeError((error as Error).message)
        });
      }
    }
  }
  
  /**
   * Extraire les données de facturation de l'événement
   */
  private extractInvoiceData(event: NotificationSentEvent): InvoiceData | null {
    const metadata = event.metadata || {};
    
    // Détection des notifications qui déclenchent une facturation
    const invoiceTriggers = [
      'booking-confirmed',
      'service-completed',
      'addon-confirmed',
      'recurring-service-done'
    ];
    
    const notificationType = metadata.notificationType as string;
    
    if (!invoiceTriggers.some(trigger => notificationType?.includes(trigger))) {
      return null; // Pas une notification de facturation
    }
    
    // Extraction des données
    const serviceType = (metadata.serviceType as string)?.toLowerCase() || 'unknown';
    const amount = Number(metadata.bookingAmount || metadata.amount || 0);
    
    if (amount <= 0) {
      return null; // Pas de montant à facturer
    }
    
    return {
      bookingId: metadata.bookingId as string || event.notificationId,
      customerId: event.recipientId,
      serviceType,
      amount,
      invoiceType: this.determineInvoiceType(notificationType, metadata),
      dueDate: this.calculateDueDate(serviceType, metadata),
      paymentSchedule: metadata.paymentSchedule as any || 'immediate',
      metadata
    };
  }
  
  /**
   * Déterminer le type de facture
   */
  private determineInvoiceType(notificationType: string, metadata: any): InvoiceData['invoiceType'] {
    if (notificationType.includes('confirmed') && metadata.paymentSchedule === 'split') {
      return 'deposit';
    }
    
    if (notificationType.includes('completed') && metadata.hasDeposit) {
      return 'final';
    }
    
    if (notificationType.includes('addon')) {
      return 'addon';
    }
    
    if (metadata.isRecurring) {
      return 'recurring';
    }
    
    return 'full';
  }
  
  /**
   * Calculer la date d'échéance
   */
  private calculateDueDate(serviceType: string, metadata: any): Date {
    const now = new Date();
    const serviceConfig = this.config[serviceType];
    
    if (metadata.urgency === 'express') {
      return now; // Immédiat pour express
    }
    
    if (serviceConfig?.finalInvoiceDelay !== undefined) {
      now.setDate(now.getDate() + serviceConfig.finalInvoiceDelay);
    } else {
      now.setDate(now.getDate() + 7); // 7 jours par défaut
    }
    
    return now;
  }
  
  /**
   * Traiter facture d'acompte
   */
  private async processDepositInvoice(invoiceData: InvoiceData): Promise<void> {
    const serviceConfig = this.config[invoiceData.serviceType];
    const depositPercent = serviceConfig?.depositPercent || 30;
    const depositAmount = Math.round((invoiceData.amount * depositPercent) / 100);
    
    this.logger.info('💰 Processing deposit invoice', {
      bookingId: invoiceData.bookingId,
      totalAmount: `${invoiceData.amount}€`,
      depositAmount: `${depositAmount}€`,
      depositPercent: `${depositPercent}%`
    });
    
    // Générer facture d'acompte
    await this.generateInvoice({
      ...invoiceData,
      amount: depositAmount,
      invoiceType: 'deposit'
    });
    
    // Programmer la facture finale
    const finalAmount = invoiceData.amount - depositAmount;
    const finalInvoiceDate = new Date(invoiceData.metadata?.serviceDate || Date.now());
    finalInvoiceDate.setDate(finalInvoiceDate.getDate() + (serviceConfig?.finalInvoiceDelay || 0));
    
    this.scheduleInvoice({
      ...invoiceData,
      amount: finalAmount,
      invoiceType: 'final',
      dueDate: finalInvoiceDate
    });
    
    this.logger.info('📅 Final invoice scheduled', {
      bookingId: invoiceData.bookingId,
      finalAmount: `${finalAmount}€`,
      scheduledDate: finalInvoiceDate.toISOString()
    });
  }
  
  /**
   * Traiter facture finale
   */
  private async processFinalInvoice(invoiceData: InvoiceData): Promise<void> {
    this.logger.info('🏁 Processing final invoice', {
      bookingId: invoiceData.bookingId,
      amount: `${invoiceData.amount}€`
    });
    
    // Appliquer remises de fidélité si applicable
    const discounts = await this.calculateLoyaltyDiscounts(invoiceData);
    
    await this.generateInvoice({
      ...invoiceData,
      discounts: discounts || []
    });
  }
  
  /**
   * Traiter facture complète
   */
  private async processFullInvoice(invoiceData: InvoiceData): Promise<void> {
    this.logger.info('💯 Processing full invoice', {
      bookingId: invoiceData.bookingId,
      amount: `${invoiceData.amount}€`
    });
    
    // Appliquer remises si client business ou fidélité
    const discounts = await this.calculateAllDiscounts(invoiceData);
    
    await this.generateInvoice({
      ...invoiceData,
      discounts: discounts || []
    });
  }
  
  /**
   * Traiter facture de service additionnel
   */
  private async processAddonInvoice(invoiceData: InvoiceData): Promise<void> {
    this.logger.info('➕ Processing addon invoice', {
      bookingId: invoiceData.bookingId,
      addon: invoiceData.metadata?.additionalService,
      amount: `${invoiceData.amount}€`
    });
    
    // Facture immédiate pour les services additionnels
    await this.generateInvoice(invoiceData);
  }
  
  /**
   * Traiter facture récurrente (ménage hebdomadaire, etc.)
   */
  private async processRecurringInvoice(invoiceData: InvoiceData): Promise<void> {
    const serviceConfig = this.config[invoiceData.serviceType];
    
    this.logger.info('🔄 Processing recurring invoice', {
      bookingId: invoiceData.bookingId,
      recurringType: invoiceData.metadata?.recurringType,
      amount: `${invoiceData.amount}€`
    });
    
    // Grouper par mois si configuré
    if (serviceConfig?.groupByMonth) {
      await this.addToMonthlyGroup(invoiceData);
    } else {
      // Facture immédiate
      const discounts = await this.calculateRecurringDiscounts(invoiceData);
      await this.generateInvoice({
        ...invoiceData,
        discounts: discounts || []
      });
    }
  }
  
  /**
   * Calculer remises de fidélité
   */
  private async calculateLoyaltyDiscounts(invoiceData: InvoiceData): Promise<InvoiceData['discounts']> {
    const serviceConfig = this.config[invoiceData.serviceType];
    if (!serviceConfig?.loyaltyDiscount) return [];
    
    // Simuler lookup historique client (à remplacer par vraie logique DB)
    const customerHistory = await this.getCustomerHistory(invoiceData.customerId);
    
    const discounts: NonNullable<InvoiceData['discounts']> = [];
    
    if (customerHistory.servicesCount >= (serviceConfig.loyaltyThreshold || 3)) {
      const discountAmount = Math.round(invoiceData.amount * serviceConfig.loyaltyDiscount);
      discounts.push({
        type: 'loyalty',
        amount: discountAmount,
        reason: `Client fidèle - ${customerHistory.servicesCount} services`
      });
      
      this.logger.info('🎁 Loyalty discount applied', {
        customerId: invoiceData.customerId,
        servicesCount: customerHistory.servicesCount,
        discountAmount: `${discountAmount}€`
      });
    }
    
    return discounts;
  }
  
  /**
   * Calculer toutes les remises possibles
   */
  private async calculateAllDiscounts(invoiceData: InvoiceData): Promise<InvoiceData['discounts']> {
    const discounts: NonNullable<InvoiceData['discounts']> = [];
    
    // Remise client business
    if (invoiceData.metadata?.customerType === 'business') {
      const serviceConfig = this.config[invoiceData.serviceType];
      const businessDiscount = serviceConfig?.businessClientDiscount || 0.10;
      const discountAmount = Math.round(invoiceData.amount * businessDiscount);
      
      discounts.push({
        type: 'business',
        amount: discountAmount,
        reason: 'Client professionnel'
      });
    }
    
    // Ajouter remises de fidélité
    const loyaltyDiscounts = await this.calculateLoyaltyDiscounts(invoiceData);
    if (loyaltyDiscounts) {
      discounts.push(...loyaltyDiscounts);
    }
    
    return discounts;
  }
  
  /**
   * Calculer remises pour services récurrents
   */
  private async calculateRecurringDiscounts(invoiceData: InvoiceData): Promise<InvoiceData['discounts']> {
    const discounts: NonNullable<InvoiceData['discounts']> = [];
    
    const monthsOfService = Number(invoiceData.metadata?.monthsOfService || 0);
    const serviceConfig = this.config[invoiceData.serviceType];
    
    if (monthsOfService >= (serviceConfig?.loyaltyMonthsThreshold || 3)) {
      const discountAmount = Math.round(invoiceData.amount * (serviceConfig?.loyaltyDiscount || 0.05));
      discounts.push({
        type: 'recurring_loyalty',
        amount: discountAmount,
        reason: `${monthsOfService} mois de service récurrent`
      });
    }
    
    return discounts;
  }
  
  /**
   * Générer la facture (mock - à remplacer par vraie intégration)
   */
  private async generateInvoice(invoiceData: InvoiceData): Promise<void> {
    const totalDiscounts = (invoiceData.discounts || []).reduce((sum, d) => sum + d.amount, 0);
    const finalAmount = invoiceData.amount - totalDiscounts;
    
    // Mock génération facture - à remplacer par intégration réelle
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    this.logger.info('📄 Invoice generated', {
      invoiceNumber,
      bookingId: invoiceData.bookingId,
      customerId: invoiceData.customerId,
      originalAmount: `${invoiceData.amount}€`,
      totalDiscounts: `${totalDiscounts}€`,
      finalAmount: `${finalAmount}€`,
      dueDate: invoiceData.dueDate.toISOString(),
      discounts: invoiceData.discounts
    });
    
    // Ici : intégration avec système de facturation (Stripe, QuickBooks, etc.)
    // await this.invoiceSystem.createInvoice(invoiceData);
    
    // Programmer relance si pas d'acompte
    if (invoiceData.invoiceType !== 'deposit') {
      this.schedulePaymentReminder(invoiceNumber, invoiceData);
    }
  }
  
  /**
   * Programmer une facture future
   */
  private scheduleInvoice(invoiceData: InvoiceData): void {
    const scheduleKey = invoiceData.dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!this.pendingInvoices.has(scheduleKey)) {
      this.pendingInvoices.set(scheduleKey, []);
    }
    
    this.pendingInvoices.get(scheduleKey)!.push(invoiceData);
  }
  
  /**
   * Traiter les factures programmées
   */
  private async processScheduledInvoices(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const todayInvoices = this.pendingInvoices.get(today);
    
    if (!todayInvoices?.length) return;
    
    this.logger.info('📅 Processing scheduled invoices', {
      date: today,
      count: todayInvoices.length
    });
    
    for (const invoiceData of todayInvoices) {
      try {
        await this.generateInvoice(invoiceData);
      } catch (error) {
        this.logger.error('❌ Scheduled invoice error', {
          bookingId: invoiceData.bookingId,
          error: (error as Error).message
        });
      }
    }
    
    // Nettoyer les factures traitées
    this.pendingInvoices.delete(today);
  }
  
  /**
   * Programmer rappel de paiement
   */
  private schedulePaymentReminder(invoiceNumber: string, invoiceData: InvoiceData): void {
    // Programmer rappel 3 jours avant échéance, puis 1 jour après
    const reminderDate = new Date(invoiceData.dueDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    
    this.logger.info('⏰ Payment reminder scheduled', {
      invoiceNumber,
      reminderDate: reminderDate.toISOString(),
      dueDate: invoiceData.dueDate.toISOString()
    });
    
    // Ici : programmer notification de rappel
    // await this.scheduleNotification('payment-reminder', reminderDate, invoiceData);
  }
  
  /**
   * Historique client (mock)
   */
  private async getCustomerHistory(customerId: string): Promise<{ servicesCount: number; totalSpent: number }> {
    // Mock - à remplacer par vraie requête DB
    return {
      servicesCount: Math.floor(Math.random() * 10) + 1,
      totalSpent: Math.floor(Math.random() * 5000) + 500
    };
  }
  
  /**
   * Ajouter à un groupe mensuel
   */
  private async addToMonthlyGroup(invoiceData: InvoiceData): Promise<void> {
    const monthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    this.logger.info('📊 Adding to monthly invoice group', {
      customerId: invoiceData.customerId,
      month: monthKey,
      amount: `${invoiceData.amount}€`
    });
    
    // Mock - à implémenter avec stockage persistant
    // await this.addToMonthlyInvoiceGroup(monthKey, invoiceData);
  }
  
  /**
   * Catégoriser les erreurs
   */
  private categorizeError(errorMessage: string): string {
    const error = errorMessage.toLowerCase();
    
    if (error.includes('amount') || error.includes('price')) {
      return 'amount_validation';
    } else if (error.includes('customer') || error.includes('recipient')) {
      return 'customer_lookup';
    } else if (error.includes('service')) {
      return 'service_configuration';
    } else if (error.includes('discount')) {
      return 'discount_calculation';
    }
    
    return 'unknown';
  }
  
  /**
   * Obtenir la tranche de montant pour les métriques
   */
  private getAmountRange(amount: number): string {
    if (amount < 100) return '0-100';
    if (amount < 500) return '100-500';
    if (amount < 1000) return '500-1000';
    if (amount < 2000) return '1000-2000';
    return '2000+';
  }
}