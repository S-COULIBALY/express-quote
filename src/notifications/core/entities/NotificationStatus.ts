// =============================================================================
// 🔔 STATUTS DE NOTIFICATION - Gestion des États
// =============================================================================
//
// Utilité:
// - Définit tous les états possibles d'une notification dans le système
// - Gère les transitions d'états avec validation
// - Fournit la logique métier pour le cycle de vie des notifications
// - Supporte la traçabilité et l'audit des changements d'état
//
// Architecture:
// - Enum TypeScript strict pour type safety
// - Classe NotificationStatus avec méthodes de validation
// - Historique des transitions pour debug et monitoring
// - Support multi-langues pour les libellés
// =============================================================================

/**
 * 🎯 Énumération des statuts de notification
 * 
 * États du cycle de vie d'une notification:
 * - CREATED: Notification créée mais pas encore traitée
 * - QUEUED: En attente dans la queue BullMQ  
 * - PROCESSING: En cours de traitement par un worker
 * - SENT: Envoyée avec succès vers le service externe
 * - DELIVERED: Confirmée comme livrée au destinataire
 * - FAILED: Échec d'envoi après toutes les tentatives
 * - CANCELLED: Annulée avant envoi
 * - EXPIRED: Expirée (dépassement de TTL)
 */
export enum NotificationStatusEnum {
  // États initiaux
  CREATED = 'CREATED',
  QUEUED = 'QUEUED',
  
  // États de traitement  
  PROCESSING = 'PROCESSING',
  
  // États terminaux de succès
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  
  // États terminaux d'échec
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED'
}

/**
 * 📋 Interface pour l'historique des transitions
 * 
 * Utilité:
 * - Traçabilité complète des changements d'état
 * - Debug des problèmes de notification
 * - Métriques de performance (temps entre états)
 * - Audit pour conformité réglementaire
 */
export interface StatusTransition {
  /** État source de la transition */
  from: NotificationStatusEnum;
  
  /** État destination de la transition */
  to: NotificationStatusEnum;
  
  /** Timestamp de la transition (ISO 8601) */
  timestamp: Date;
  
  /** Raison de la transition (optionnel) */
  reason?: string;
  
  /** Métadonnées additionnelles (erreurs, IDs externes) */
  metadata?: Record<string, any>;
  
  /** ID du worker qui a effectué la transition */
  workerId?: string;
  
  /** Durée écoulée depuis l'état précédent (ms) */
  duration?: number;
}

/**
 * 🏷️ Configuration des libellés et descriptions
 * 
 * Utilité:
 * - Interface utilisateur multilingue
 * - Messages d'erreur contextualisés
 * - Notifications push avec textes appropriés
 * - Documentation auto-générée
 */
interface StatusLabel {
  label: string;
  description: string;
  color: 'info' | 'warning' | 'success' | 'error' | 'default';
  icon: string;
}

/**
 * 🎨 Configuration des libellés par statut
 */
const STATUS_LABELS: Record<NotificationStatusEnum, StatusLabel> = {
  [NotificationStatusEnum.CREATED]: {
    label: 'Créée',
    description: 'Notification créée et en attente de traitement',
    color: 'info',
    icon: '📝'
  },
  [NotificationStatusEnum.QUEUED]: {
    label: 'En file d\'attente',
    description: 'Notification ajoutée à la queue de traitement',
    color: 'info', 
    icon: '⏳'
  },
  [NotificationStatusEnum.PROCESSING]: {
    label: 'En traitement',
    description: 'Notification en cours de traitement par un worker',
    color: 'warning',
    icon: '⚙️'
  },
  [NotificationStatusEnum.SENT]: {
    label: 'Envoyée',
    description: 'Notification envoyée avec succès au service externe',
    color: 'success',
    icon: '📤'
  },
  [NotificationStatusEnum.DELIVERED]: {
    label: 'Livrée',
    description: 'Notification confirmée comme reçue par le destinataire',
    color: 'success',
    icon: '✅'
  },
  [NotificationStatusEnum.FAILED]: {
    label: 'Échec',
    description: 'Échec d\'envoi après toutes les tentatives',
    color: 'error',
    icon: '❌'
  },
  [NotificationStatusEnum.CANCELLED]: {
    label: 'Annulée',
    description: 'Notification annulée avant envoi',
    color: 'default',
    icon: '🚫'
  },
  [NotificationStatusEnum.EXPIRED]: {
    label: 'Expirée',
    description: 'Notification expirée (dépassement de TTL)',
    color: 'warning',
    icon: '⏰'
  }
};

/**
 * 🔄 Matrice des transitions autorisées
 * 
 * Utilité:
 * - Validation des changements d'état
 * - Prévention des états incohérents
 * - Logique métier centralisée
 * - Debugging facilité
 */
const ALLOWED_TRANSITIONS: Record<NotificationStatusEnum, NotificationStatusEnum[]> = {
  [NotificationStatusEnum.CREATED]: [
    NotificationStatusEnum.QUEUED,
    NotificationStatusEnum.CANCELLED
  ],
  [NotificationStatusEnum.QUEUED]: [
    NotificationStatusEnum.PROCESSING,
    NotificationStatusEnum.CANCELLED,
    NotificationStatusEnum.EXPIRED
  ],
  [NotificationStatusEnum.PROCESSING]: [
    NotificationStatusEnum.SENT,
    NotificationStatusEnum.FAILED,
    NotificationStatusEnum.CANCELLED
  ],
  [NotificationStatusEnum.SENT]: [
    NotificationStatusEnum.DELIVERED,
    NotificationStatusEnum.FAILED  // En cas de bounce/erreur tardive
  ],
  [NotificationStatusEnum.DELIVERED]: [], // État terminal
  [NotificationStatusEnum.FAILED]: [],    // État terminal  
  [NotificationStatusEnum.CANCELLED]: [], // État terminal
  [NotificationStatusEnum.EXPIRED]: []    // État terminal
};

/**
 * 🎯 Classe principale de gestion des statuts
 * 
 * Responsabilités:
 * - Encapsuler la logique des états de notification
 * - Valider les transitions d'états
 * - Maintenir l'historique des changements
 * - Fournir des méthodes utilitaires pour les états
 * - Calculer des métriques temporelles
 * 
 * Utilité pour Express Quote:
 * - Suivi en temps réel des notifications booking/payment
 * - Debug des problèmes d'envoi d'email
 * - Métriques de performance du système
 * - Interface admin pour monitoring
 */
export class NotificationStatus {
  private _currentStatus: NotificationStatusEnum;
  private _history: StatusTransition[];
  private _createdAt: Date;
  
  /**
   * Constructeur avec état initial
   * 
   * @param initialStatus État initial (défaut: CREATED)
   */
  constructor(initialStatus: NotificationStatusEnum = NotificationStatusEnum.CREATED) {
    this._currentStatus = initialStatus;
    this._createdAt = new Date();
    this._history = [{
      from: initialStatus,
      to: initialStatus,
      timestamp: this._createdAt,
      reason: 'Création initiale',
      workerId: 'system'
    }];
  }
  
  /**
   * 📊 Propriétés de lecture seule
   */
  get currentStatus(): NotificationStatusEnum {
    return this._currentStatus;
  }
  
  get history(): ReadonlyArray<StatusTransition> {
    return this._history;
  }
  
  get createdAt(): Date {
    return this._createdAt;
  }
  
  get lastTransition(): StatusTransition | undefined {
    return this._history[this._history.length - 1];
  }
  
  /**
   * 🔄 Changement d'état avec validation
   * 
   * @param newStatus Nouvel état souhaité
   * @param reason Raison du changement (optionnel)
   * @param metadata Métadonnées additionnelles
   * @param workerId ID du worker effectuant le changement
   * @returns true si la transition est réussie, false sinon
   */
  transitionTo(
    newStatus: NotificationStatusEnum,
    reason?: string,
    metadata?: Record<string, any>,
    workerId?: string
  ): boolean {
    // Validation: état identique
    if (this._currentStatus === newStatus) {
      return false;
    }
    
    // Validation: transition autorisée
    const allowedTargets = ALLOWED_TRANSITIONS[this._currentStatus] || [];
    if (!allowedTargets.includes(newStatus)) {
      throw new Error(
        `Transition invalide: ${this._currentStatus} → ${newStatus}. ` +
        `Transitions autorisées: ${allowedTargets.join(', ')}`
      );
    }
    
    // Calcul de la durée depuis dernière transition
    const duration = this.lastTransition ? 
      Date.now() - this.lastTransition.timestamp.getTime() : 
      0;
    
    // Création de la transition
    const transition: StatusTransition = {
      from: this._currentStatus,
      to: newStatus,
      timestamp: new Date(),
      reason,
      metadata,
      workerId: workerId || 'unknown',
      duration
    };
    
    // Application du changement
    this._currentStatus = newStatus;
    this._history.push(transition);
    
    return true;
  }
  
  /**
   * ✅ Méthodes de vérification d'état
   */
  isTerminal(): boolean {
    return [
      NotificationStatusEnum.DELIVERED,
      NotificationStatusEnum.FAILED,
      NotificationStatusEnum.CANCELLED,
      NotificationStatusEnum.EXPIRED
    ].includes(this._currentStatus);
  }
  
  isSuccess(): boolean {
    return [
      NotificationStatusEnum.SENT,
      NotificationStatusEnum.DELIVERED
    ].includes(this._currentStatus);
  }
  
  isError(): boolean {
    return [
      NotificationStatusEnum.FAILED,
      NotificationStatusEnum.EXPIRED
    ].includes(this._currentStatus);
  }
  
  isActive(): boolean {
    return [
      NotificationStatusEnum.QUEUED,
      NotificationStatusEnum.PROCESSING
    ].includes(this._currentStatus);
  }
  
  /**
   * 🏷️ Récupération des métadonnées d'affichage
   */
  getLabel(): StatusLabel {
    return STATUS_LABELS[this._currentStatus];
  }
  
  /**
   * ⏱️ Calcul du temps total de traitement
   * 
   * @returns Durée en millisecondes depuis la création
   */
  getTotalDuration(): number {
    return Date.now() - this._createdAt.getTime();
  }
  
  /**
   * 📈 Calcul du temps dans un état spécifique
   * 
   * @param status État à analyser
   * @returns Durée totale en millisecondes dans cet état
   */
  getTimeInStatus(status: NotificationStatusEnum): number {
    let totalTime = 0;
    let currentTime = 0;
    
    for (let i = 0; i < this._history.length; i++) {
      const transition = this._history[i];
      
      if (transition.to === status) {
        currentTime = transition.timestamp.getTime();
      } else if (transition.from === status && currentTime > 0) {
        totalTime += transition.timestamp.getTime() - currentTime;
        currentTime = 0;
      }
    }
    
    // Si encore dans l'état, ajouter le temps jusqu'à maintenant
    if (this._currentStatus === status && currentTime > 0) {
      totalTime += Date.now() - currentTime;
    }
    
    return totalTime;
  }
  
  /**
   * 📋 Export pour sérialisation
   * 
   * Utilité:
   * - Sauvegarde en base de données
   * - Export JSON pour APIs
   * - Logs structurés
   * - Cache Redis
   */
  toJSON(): {
    currentStatus: NotificationStatusEnum;
    createdAt: string;
    history: StatusTransition[];
    isTerminal: boolean;
    totalDuration: number;
  } {
    return {
      currentStatus: this._currentStatus,
      createdAt: this._createdAt.toISOString(),
      history: this._history.map(h => ({
        ...h,
        timestamp: h.timestamp.toISOString()
      })) as unknown as StatusTransition[],
      isTerminal: this.isTerminal(),
      totalDuration: this.getTotalDuration()
    };
  }
  
  /**
   * 🔄 Import depuis JSON
   * 
   * @param json Données JSON sérialisées
   * @returns Instance NotificationStatus restaurée
   */
  static fromJSON(json: any): NotificationStatus {
    const status = new NotificationStatus();
    status._currentStatus = json.currentStatus;
    status._createdAt = new Date(json.createdAt);
    status._history = json.history.map((h: any) => ({
      ...h,
      timestamp: new Date(h.timestamp)
    }));
    
    return status;
  }
  
  /**
   * 🎯 Méthodes statiques utilitaires
   */
  static getAllStatuses(): NotificationStatusEnum[] {
    return Object.values(NotificationStatusEnum);
  }
  
  static getTerminalStatuses(): NotificationStatusEnum[] {
    return [
      NotificationStatusEnum.DELIVERED,
      NotificationStatusEnum.FAILED,
      NotificationStatusEnum.CANCELLED,
      NotificationStatusEnum.EXPIRED
    ];
  }
  
  static getActiveStatuses(): NotificationStatusEnum[] {
    return [
      NotificationStatusEnum.QUEUED,
      NotificationStatusEnum.PROCESSING
    ];
  }
}

/**
 * 🔧 Utilitaires de validation
 * 
 * Utilité:
 * - Validation des données entrantes
 * - Middleware de validation API
 * - Tests automatisés
 * - Documentation des contrats
 */
export const StatusValidators = {
  /**
   * Valide qu'une chaîne est un statut valide
   */
  isValidStatus(status: string): status is NotificationStatusEnum {
    return Object.values(NotificationStatusEnum).includes(status as NotificationStatusEnum);
  },
  
  /**
   * Valide qu'une transition est autorisée
   */
  canTransition(from: NotificationStatusEnum, to: NotificationStatusEnum): boolean {
    const allowed = ALLOWED_TRANSITIONS[from] || [];
    return allowed.includes(to);
  },
  
  /**
   * Récupère les transitions possibles depuis un état
   */
  getAllowedTransitions(from: NotificationStatusEnum): NotificationStatusEnum[] {
    return ALLOWED_TRANSITIONS[from] || [];
  }
};

/**
 * 📊 Factory pour création d'instances
 * 
 * Utilité:
 * - Création standardisée des statuts
 * - Injection de dépendances
 * - Tests avec données mockées  
 * - Migrations de données
 */
export class NotificationStatusFactory {
  /**
   * Crée un statut avec état CREATED
   */
  static createNew(): NotificationStatus {
    return new NotificationStatus(NotificationStatusEnum.CREATED);
  }
  
  /**
   * Crée un statut directement en QUEUED
   * (pour notifications urgentes)
   */
  static createQueued(reason?: string): NotificationStatus {
    const status = new NotificationStatus(NotificationStatusEnum.QUEUED);
    if (reason) {
      status.transitionTo(NotificationStatusEnum.QUEUED, reason, { priority: 'high' });
    }
    return status;
  }
  
  /**
   * Crée un statut en état d'échec pour tests
   */
  static createFailed(reason?: string): NotificationStatus {
    const status = new NotificationStatus();
    status.transitionTo(NotificationStatusEnum.QUEUED, 'Test setup');
    status.transitionTo(NotificationStatusEnum.PROCESSING, 'Test processing');
    status.transitionTo(NotificationStatusEnum.FAILED, reason || 'Test failure');
    return status;
  }
}

// =============================================================================
// 📝 EXEMPLE D'UTILISATION
// =============================================================================
/*
import { NotificationStatus, NotificationStatusEnum, StatusValidators } from './NotificationStatus';

// Création d'une nouvelle notification
const status = new NotificationStatus();
console.log(status.currentStatus); // 'CREATED'

// Progression normale
status.transitionTo(NotificationStatusEnum.QUEUED, 'Ajoutée à la queue email', { queueName: 'email' });
status.transitionTo(NotificationStatusEnum.PROCESSING, 'Worker email-1 traite', { workerId: 'email-1' });
status.transitionTo(NotificationStatusEnum.SENT, 'Envoyée via SMTP', { provider: 'smtp.gmail.com' });

// Vérifications
console.log(status.isSuccess()); // true
console.log(status.getTotalDuration()); // Durée totale en ms
console.log(status.getTimeInStatus(NotificationStatusEnum.PROCESSING)); // Temps de traitement

// Export pour sauvegarde
const json = status.toJSON();
const restored = NotificationStatus.fromJSON(json);

// Validation
console.log(StatusValidators.isValidStatus('SENT')); // true
console.log(StatusValidators.canTransition('QUEUED', 'PROCESSING')); // true
*/
