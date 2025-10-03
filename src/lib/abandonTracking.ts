import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Système de tracking des abandons
 * Détecte et enregistre tous les points d'abandon critiques
 */

export type AbandonStage = 
  | 'catalog_early'           // < 30s sur catalogue
  | 'catalog_detail'          // Sortie page détail
  | 'form_incomplete'         // Formulaire < 50%
  | 'form_partial'            // Formulaire > 50%
  | 'quote_created'           // Après création devis
  | 'quote_viewed'            // Après consultation devis
  | 'quote_with_contact'      // Avec infos contact
  | 'booking_created'         // Après création booking
  | 'payment_page'            // Sur page paiement
  | 'payment_failed'          // Échec paiement
  | 'payment_abandoned'       // Abandon Stripe
  | 'post_confirmation'       // Après confirmation

export interface AbandonEvent {
  id: string;
  sessionId: string;
  userId?: string;
  stage: AbandonStage;
  timestamp: Date;
  timeSpent: number; // en millisecondes
  data: Record<string, any>;
  userAgent: string;
  ipAddress?: string;
  recoveryAttempts: number;
  isRecovered: boolean;
  metadata: {
    catalogId?: string;
    quoteId?: string;
    bookingId?: string;
    formCompletion?: number;
    contactInfo?: {
      hasEmail: boolean;
      hasPhone: boolean;
    };
    priceAtAbandon?: number;
    lastAction?: string;
  };
}

export interface FormProgress {
  formId: string;
  fields: Record<string, any>;
  completion: number;
  lastUpdated: Date;
  timeSpent: number;
}

class AbandonTrackingService {
  private static instance: AbandonTrackingService;
  private sessionStartTime: number = 0;
  private sessionId: string = '';
  private currentStage: AbandonStage | null = null;
  private formProgress: Map<string, FormProgress> = new Map();
  private pageStartTime: number = 0;
  private isTracking: boolean = false;

  private constructor() {
    this.initializeSession();
    this.setupEventListeners();
  }

  public static getInstance(): AbandonTrackingService {
    if (!AbandonTrackingService.instance) {
      AbandonTrackingService.instance = new AbandonTrackingService();
    }
    return AbandonTrackingService.instance;
  }

  private initializeSession(): void {
    if (typeof window === 'undefined') return;
    
    this.sessionId = sessionStorage.getItem('abandon_session_id') || uuidv4();
    sessionStorage.setItem('abandon_session_id', this.sessionId);
    this.sessionStartTime = Date.now();
    this.isTracking = true;
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Détecter les abandons de page
    window.addEventListener('beforeunload', (event) => {
      this.handlePageAbandon();
    });

    // Détecter l'activité utilisateur
    document.addEventListener('click', (event) => {
      this.trackUserActivity('click', event.target);
    });

    // Détecter les changements de focus
    window.addEventListener('focus', () => {
      this.trackUserActivity('focus');
    });

    window.addEventListener('blur', () => {
      this.trackUserActivity('blur');
    });

    // Détecter la fermeture d'onglet
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.handlePageAbandon();
      }
    });
  }

  /**
   * Démarre le tracking pour une étape spécifique
   */
  public startStageTracking(stage: AbandonStage, metadata?: Record<string, any>): void {
    this.currentStage = stage;
    this.pageStartTime = Date.now();
    
    logger.info(`📊 Tracking started for stage: ${stage}`, { sessionId: this.sessionId, metadata });
  }

  /**
   * Termine le tracking d'une étape (succès)
   */
  public completeStageTracking(stage: AbandonStage, metadata?: Record<string, any>): void {
    if (this.currentStage === stage) {
      const timeSpent = Date.now() - this.pageStartTime;
      
      logger.info(`✅ Stage completed: ${stage}`, { 
        sessionId: this.sessionId, 
        timeSpent, 
        metadata 
      });

      this.currentStage = null;
    }
  }

  /**
   * Enregistre un abandon
   */
  public async recordAbandon(
    stage: AbandonStage, 
    data: Record<string, any> = {},
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const timeSpent = Date.now() - this.pageStartTime;
    
    const abandonEvent: AbandonEvent = {
      id: uuidv4(),
      sessionId: this.sessionId,
      stage,
      timestamp: new Date(),
      timeSpent,
      data,
      userAgent: navigator.userAgent,
      recoveryAttempts: 0,
      isRecovered: false,
      metadata: {
        ...metadata,
        lastAction: this.getLastUserAction()
      }
    };

    try {
      // Enregistrer localement
      this.saveAbandonLocally(abandonEvent);
      
      // Envoyer au serveur
      await this.sendAbandonToServer(abandonEvent);
      
      logger.warn(`🚨 Abandon recorded: ${stage}`, { 
        sessionId: this.sessionId, 
        timeSpent,
        metadata 
      });

      // Déclencher la récupération immédiate si applicable
      this.triggerImmediateRecovery(abandonEvent);

    } catch (error) {
      logger.error('Failed to record abandon:', error);
    }
  }

  /**
   * Tracking spécifique : Abandon catalogue précoce (< 30s)
   */
  public trackCatalogEarlyAbandon(catalogId: string): void {
    const timeSpent = Date.now() - this.pageStartTime;
    
    if (timeSpent < 30000) { // Moins de 30 secondes
      this.recordAbandon('catalog_early', {
        catalogId,
        bounceRate: true
      }, {
        catalogId,
        timeSpent
      });
    }
  }

  /**
   * Tracking spécifique : Abandon formulaire
   */
  public trackFormAbandon(formId: string, formData: Record<string, any>): void {
    const completion = this.calculateFormCompletion(formData);
    const timeSpent = Date.now() - this.pageStartTime;
    
    const stage: AbandonStage = completion > 50 ? 'form_partial' : 'form_incomplete';
    
    this.recordAbandon(stage, {
      formId,
      formData,
      completion
    }, {
      formCompletion: completion,
      contactInfo: {
        hasEmail: !!formData.email,
        hasPhone: !!formData.phone
      }
    });
  }

  /**
   * Tracking spécifique : Abandon post-devis
   */
  public trackQuoteAbandon(quoteId: string, quoteData: any): void {
    const hasContact = quoteData.customerInfo?.email || quoteData.customerInfo?.phone;
    const stage: AbandonStage = hasContact ? 'quote_with_contact' : 'quote_viewed';
    
    this.recordAbandon(stage, {
      quoteId,
      quoteData
    }, {
      quoteId,
      priceAtAbandon: quoteData.totalPrice,
      contactInfo: {
        hasEmail: !!quoteData.customerInfo?.email,
        hasPhone: !!quoteData.customerInfo?.phone
      }
    });
  }

  /**
   * Tracking spécifique : Abandon paiement
   */
  public trackPaymentAbandon(bookingId: string, paymentData: any): void {
    this.recordAbandon('payment_abandoned', {
      bookingId,
      paymentData
    }, {
      bookingId,
      priceAtAbandon: paymentData.amount
    });
  }

  /**
   * Tracking spécifique : Échec paiement
   */
  public trackPaymentFailure(bookingId: string, errorData: any): void {
    this.recordAbandon('payment_failed', {
      bookingId,
      errorData
    }, {
      bookingId,
      priceAtAbandon: errorData.amount
    });
  }

  /**
   * Sauvegarde automatique des formulaires
   */
  public autoSaveForm(formId: string, formData: Record<string, any>): void {
    const completion = this.calculateFormCompletion(formData);
    const timeSpent = Date.now() - this.pageStartTime;
    
    const progress: FormProgress = {
      formId,
      fields: formData,
      completion,
      lastUpdated: new Date(),
      timeSpent
    };
    
    this.formProgress.set(formId, progress);
    
    // Sauvegarder localement
    if (typeof window !== 'undefined') {
      localStorage.setItem(`form_progress_${formId}`, JSON.stringify(progress));
    }
    
    // Envoyer au serveur si completion > 30%
    if (completion > 30) {
      this.sendFormProgressToServer(progress);
    }
  }

  /**
   * Récupérer le progrès d'un formulaire
   */
  public getFormProgress(formId: string): FormProgress | null {
    // Vérifier en mémoire
    const memoryProgress = this.formProgress.get(formId);
    if (memoryProgress) return memoryProgress;
    
    // Vérifier localement
    if (typeof window !== 'undefined') {
      const localProgress = localStorage.getItem(`form_progress_${formId}`);
      if (localProgress) {
        try {
          return JSON.parse(localProgress);
        } catch (error) {
          logger.warn('Failed to parse form progress from localStorage:', error);
        }
      }
    }
    
    return null;
  }

  /**
   * Nettoyer le progrès d'un formulaire (après succès)
   */
  public clearFormProgress(formId: string): void {
    this.formProgress.delete(formId);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`form_progress_${formId}`);
    }
  }

  /**
   * Calculer le pourcentage de completion d'un formulaire
   */
  private calculateFormCompletion(formData: Record<string, any>): number {
    const fields = Object.entries(formData);
    const filledFields = fields.filter(([key, value]) => {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });
    
    return Math.round((filledFields.length / fields.length) * 100);
  }

  /**
   * Gestion des abandons de page
   */
  private handlePageAbandon(): void {
    if (!this.currentStage || !this.isTracking) return;
    
    const timeSpent = Date.now() - this.pageStartTime;
    
    // Abandon précoce catalogue
    if (this.currentStage === 'catalog_detail' && timeSpent < 30000) {
      this.recordAbandon('catalog_early', {
        bounceRate: true
      });
    }
    // Autres abandons
    else if (this.currentStage) {
      this.recordAbandon(this.currentStage, {
        reason: 'page_abandon'
      });
    }
  }

  /**
   * Tracking de l'activité utilisateur
   */
  private trackUserActivity(action: string, target?: any): void {
    // Enregistrer la dernière action pour contexte
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('last_user_action', JSON.stringify({
        action,
        target: target?.tagName || target?.className || 'unknown',
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Récupérer la dernière action utilisateur
   */
  private getLastUserAction(): string | undefined {
    if (typeof window !== 'undefined') {
      const lastAction = sessionStorage.getItem('last_user_action');
      if (lastAction) {
        try {
          const parsed = JSON.parse(lastAction);
          return `${parsed.action} on ${parsed.target}`;
        } catch (error) {
          return undefined;
        }
      }
    }
    return undefined;
  }

  /**
   * Sauvegarder l'abandon localement
   */
  private saveAbandonLocally(event: AbandonEvent): void {
    if (typeof window !== 'undefined') {
      const abandons = this.getLocalAbandons();
      abandons.push(event);
      
      // Garder seulement les 10 derniers abandons
      if (abandons.length > 10) {
        abandons.splice(0, abandons.length - 10);
      }
      
      localStorage.setItem('abandon_events', JSON.stringify(abandons));
    }
  }

  /**
   * Récupérer les abandons locaux
   */
  private getLocalAbandons(): AbandonEvent[] {
    if (typeof window !== 'undefined') {
      const abandons = localStorage.getItem('abandon_events');
      if (abandons) {
        try {
          return JSON.parse(abandons);
        } catch (error) {
          return [];
        }
      }
    }
    return [];
  }

  /**
   * Envoyer l'abandon au serveur
   */
  private async sendAbandonToServer(event: AbandonEvent): Promise<void> {
    try {
      await fetch('/api/analytics/abandon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      logger.error('Failed to send abandon to server:', error);
    }
  }

  /**
   * Envoyer le progrès du formulaire au serveur
   */
  private async sendFormProgressToServer(progress: FormProgress): Promise<void> {
    try {
      await fetch('/api/analytics/form-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(progress)
      });
    } catch (error) {
      logger.error('Failed to send form progress to server:', error);
    }
  }

  /**
   * Déclencher la récupération immédiate
   */
  private triggerImmediateRecovery(event: AbandonEvent): void {
    // Récupération immédiate pour certains types d'abandons
    if (event.stage === 'form_partial' || event.stage === 'quote_with_contact') {
      setTimeout(() => {
        this.showRecoveryModal(event);
      }, 5000); // Attendre 5 secondes
    }
  }

  /**
   * Afficher une modal de récupération
   */
  private showRecoveryModal(event: AbandonEvent): void {
    // Éviter les modals multiples
    if (document.querySelector('.recovery-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'recovery-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <h3>Attendez ! 🛑</h3>
          <p>Vous étiez sur le point de finaliser votre demande.</p>
          <p>Souhaitez-vous continuer où vous en étiez ?</p>
          <div class="modal-actions">
            <button id="continue-btn" class="btn-primary">Continuer</button>
            <button id="close-btn" class="btn-secondary">Fermer</button>
          </div>
        </div>
      </div>
    `;
    
    // Styles inline pour éviter les dépendances
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    document.body.appendChild(modal);
    
    // Gestionnaires d'événements
    modal.querySelector('#continue-btn')?.addEventListener('click', () => {
      this.handleRecoveryAction(event, 'continue');
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#close-btn')?.addEventListener('click', () => {
      this.handleRecoveryAction(event, 'dismiss');
      document.body.removeChild(modal);
    });
  }

  /**
   * Gérer l'action de récupération
   */
  private handleRecoveryAction(event: AbandonEvent, action: 'continue' | 'dismiss'): void {
    if (action === 'continue') {
      // Marquer comme récupéré
      event.isRecovered = true;
      this.sendAbandonToServer(event);
      
      // Restaurer le progrès si possible
      if (event.stage === 'form_partial' && event.data.formId) {
        const progress = this.getFormProgress(event.data.formId);
        if (progress) {
          // Déclencher un événement personnalisé pour restaurer le formulaire
          window.dispatchEvent(new CustomEvent('restoreFormProgress', {
            detail: { formId: event.data.formId, progress }
          }));
        }
      }
    }
    
    // Logger l'action
    logger.info(`Recovery action: ${action} for stage: ${event.stage}`, {
      sessionId: this.sessionId,
      eventId: event.id
    });
  }

  /**
   * Obtenir les statistiques d'abandon de la session
   */
  public getSessionStats(): {
    sessionId: string;
    duration: number;
    abandons: number;
    currentStage: AbandonStage | null;
    formsInProgress: number;
  } {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.sessionStartTime,
      abandons: this.getLocalAbandons().length,
      currentStage: this.currentStage,
      formsInProgress: this.formProgress.size
    };
  }
}

// Export du singleton
export const abandonTracker = AbandonTrackingService.getInstance();

// Hook React pour faciliter l'utilisation
export const useAbandonTracking = () => {
  const tracker = AbandonTrackingService.getInstance();
  
  return {
    startTracking: (stage: AbandonStage, metadata?: Record<string, any>) => 
      tracker.startStageTracking(stage, metadata),
    
    completeStage: (stage: AbandonStage, metadata?: Record<string, any>) => 
      tracker.completeStageTracking(stage, metadata),
    
    recordAbandon: (stage: AbandonStage, data?: Record<string, any>, metadata?: Record<string, any>) => 
      tracker.recordAbandon(stage, data, metadata),
    
    autoSaveForm: (formId: string, formData: Record<string, any>) => 
      tracker.autoSaveForm(formId, formData),
    
    getFormProgress: (formId: string) => 
      tracker.getFormProgress(formId),
    
    clearFormProgress: (formId: string) => 
      tracker.clearFormProgress(formId),
    
    getSessionStats: () => 
      tracker.getSessionStats(),
    
    // Méthodes spécifiques
    trackCatalogEarlyAbandon: (catalogId: string) => 
      tracker.trackCatalogEarlyAbandon(catalogId),
    
    trackFormAbandon: (formId: string, formData: Record<string, any>) => 
      tracker.trackFormAbandon(formId, formData),
    
    trackQuoteAbandon: (quoteId: string, quoteData: any) => 
      tracker.trackQuoteAbandon(quoteId, quoteData),
    
    trackPaymentAbandon: (bookingId: string, paymentData: any) => 
      tracker.trackPaymentAbandon(bookingId, paymentData),
    
    trackPaymentFailure: (bookingId: string, errorData: any) => 
      tracker.trackPaymentFailure(bookingId, errorData)
  };
}; 