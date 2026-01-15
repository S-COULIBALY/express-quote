/**
 * Interface repository pour la persistance des notifications
 * 
 * Utilité :
 * - Abstraction de la couche de persistance des données
 * - Contrat standardisé pour différents systèmes de stockage
 * - Facilite les tests unitaires avec des mocks
 * - Permet le changement de technologie de base de données
 * - Support des opérations CRUD et requêtes complexes
 * 
 * Configuration :
 * - Interface agnostique de la technologie de stockage
 * - Support des requêtes asynchrones
 * - Gestion des transactions
 * - Pagination et filtrage
 * - Recherche par critères multiples
 * 
 * Pourquoi ce choix :
 * - Respect des principes DDD (Repository Pattern)
 * - Inversion de dépendance pour la testabilité
 * - Facilite l'évolution vers d'autres systèmes de stockage
 * - Séparation claire entre logique métier et persistance
 */

import { Notification } from '../entities/Notification';
import { NotificationStatus } from '../entities/NotificationStatus';

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

/**
 * Critères de recherche pour les notifications
 */
export interface NotificationSearchCriteria {
  recipientId?: string;
  channel?: 'email' | 'whatsapp' | 'sms';
  status?: string;
  templateId?: string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  
  // Filtres temporels
  createdAfter?: Date;
  createdBefore?: Date;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  sentAfter?: Date;
  sentBefore?: Date;
  
  // Filtres de statut
  isPending?: boolean;
  isScheduled?: boolean;
  isSent?: boolean;
  isDelivered?: boolean;
  isFailed?: boolean;
  isExpired?: boolean;
  
  // Métadonnées
  tags?: string[];
  externalId?: string;
  hasExternalId?: boolean;
  
  // Options de tri
  sortBy?: 'createdAt' | 'scheduledAt' | 'sentAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  limit?: number;
  offset?: number;
}

/**
 * Résultat paginé de recherche
 */
export interface NotificationSearchResult {
  notifications: Notification[];
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
}

/**
 * Statistiques des notifications
 */
export interface NotificationRepositoryStats {
  totalNotifications: number;
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
  byPriority: Record<string, number>;
  avgDeliveryTime: number;
  successRate: number;
  failureRate: number;
  retryRate: number;
}

/**
 * Options de transaction
 */
export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE';
}

// ============================================================================
// INTERFACE PRINCIPALE DU REPOSITORY
// ============================================================================

/**
 * Repository pour la gestion de la persistance des notifications
 * 
 * Responsabilités :
 * - CRUD complet des notifications
 * - Requêtes de recherche et filtrage
 * - Gestion des statuts et transitions
 * - Statistiques et métriques
 * - Maintenance et nettoyage
 */
export interface INotificationRepository {
  
  // ============================================================================
  // OPÉRATIONS CRUD DE BASE
  // ============================================================================
  
  /**
   * Crée une nouvelle notification
   */
  create(notification: Notification): Promise<Notification>;
  
  /**
   * Crée plusieurs notifications en une seule transaction
   */
  createMany(notifications: Notification[]): Promise<Notification[]>;
  
  /**
   * Récupère une notification par son ID
   */
  findById(id: string): Promise<Notification | null>;
  
  /**
   * Récupère une notification par son ID externe (provider)
   */
  findByExternalId(externalId: string): Promise<Notification | null>;
  
  /**
   * Met à jour une notification existante
   */
  update(id: string, updates: Partial<Notification>): Promise<Notification | null>;
  
  /**
   * Supprime une notification
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * Vérifie si une notification existe
   */
  exists(id: string): Promise<boolean>;

  // ============================================================================
  // REQUÊTES DE RECHERCHE
  // ============================================================================
  
  /**
   * Recherche des notifications selon des critères
   */
  search(criteria: NotificationSearchCriteria): Promise<NotificationSearchResult>;
  
  /**
   * Trouve toutes les notifications d'un destinataire
   */
  findByRecipient(recipientId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string[];
  }): Promise<Notification[]>;
  
  /**
   * Trouve les notifications par canal
   */
  findByChannel(
    channel: 'email' | 'whatsapp' | 'sms',
    options?: NotificationSearchCriteria
  ): Promise<Notification[]>;
  
  /**
   * Trouve les notifications par statut
   */
  findByStatus(
    status: string | string[],
    options?: NotificationSearchCriteria
  ): Promise<Notification[]>;
  
  /**
   * Trouve les notifications programmées dans une fenêtre temporelle
   */
  findScheduledInRange(
    startDate: Date,
    endDate: Date,
    options?: NotificationSearchCriteria
  ): Promise<Notification[]>;
  
  /**
   * Trouve les notifications expirées
   */
  findExpired(beforeDate?: Date): Promise<Notification[]>;
  
  /**
   * Trouve les notifications échouées éligibles au retry
   */
  findRetryableFailures(options?: {
    maxRetries?: number;
    minTimeBetweenRetries?: number;
    channels?: string[];
  }): Promise<Notification[]>;
  
  /**
   * Trouve les notifications en attente depuis trop longtemps
   */
  findStuckNotifications(olderThanMinutes?: number): Promise<Notification[]>;

  // ============================================================================
  // REQUÊTES SPÉCIALISÉES POUR LE MÉTIER
  // ============================================================================
  
  /**
   * Trouve les notifications de rappel de service à envoyer
   */
  findServiceRemindersToSend(
    hoursBeforeService: number,
    now?: Date
  ): Promise<Array<{
    bookingId: string;
    customerEmail: string;
    serviceName: string;
    serviceDate: Date;
    reminderType: string;
  }>>;
  
  /**
   * Vérifie si un rappel a déjà été envoyé pour une réservation
   */
  hasReminderBeenSent(
    bookingId: string,
    reminderType: string
  ): Promise<boolean>;
  
  /**
   * Trouve les notifications par template et données
   */
  findByTemplateAndData(
    templateId: string,
    dataHash: string,
    timeWindow?: number
  ): Promise<Notification[]>;

  // ============================================================================
  // GESTION DES STATUTS
  // ============================================================================
  
  /**
   * Met à jour le statut d'une notification
   */
  updateStatus(
    id: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<boolean>;
  
  /**
   * Met à jour le statut de plusieurs notifications
   */
  updateManyStatuses(
    ids: string[],
    status: string,
    metadata?: Record<string, any>
  ): Promise<number>;
  
  /**
   * Marque une notification comme envoyée
   */
  markAsSent(
    id: string,
    sentAt: Date,
    externalId?: string,
    providerResponse?: any
  ): Promise<boolean>;
  
  /**
   * Marque une notification comme livrée
   */
  markAsDelivered(
    id: string,
    deliveredAt: Date,
    providerResponse?: any
  ): Promise<boolean>;
  
  /**
   * Marque une notification comme échouée
   */
  markAsFailed(
    id: string,
    failedAt: Date,
    error: string,
    providerResponse?: any
  ): Promise<boolean>;
  
  /**
   * Marque une notification comme lue
   */
  markAsRead(
    id: string,
    readAt: Date,
    providerResponse?: any
  ): Promise<boolean>;

  // ============================================================================
  // STATISTIQUES ET MÉTRIQUES
  // ============================================================================
  
  /**
   * Récupère les statistiques générales
   */
  getStats(options?: {
    timeframe?: 'hour' | 'day' | 'week' | 'month';
    startDate?: Date;
    endDate?: Date;
  }): Promise<NotificationRepositoryStats>;
  
  /**
   * Récupère les statistiques par canal
   */
  getStatsByChannel(
    timeframe?: 'hour' | 'day' | 'week' | 'month'
  ): Promise<Record<string, NotificationRepositoryStats>>;
  
  /**
   * Récupère les statistiques par destinataire
   */
  getStatsByRecipient(
    recipientId: string,
    timeframe?: 'hour' | 'day' | 'week' | 'month'
  ): Promise<NotificationRepositoryStats>;
  
  /**
   * Compte les notifications selon des critères
   */
  count(criteria?: NotificationSearchCriteria): Promise<number>;
  
  /**
   * Récupère des métriques de performance
   */
  getPerformanceMetrics(): Promise<{
    avgProcessingTime: number;
    avgDeliveryTime: number;
    throughputPerHour: number;
    errorRate: number;
    retryRate: number;
  }>;

  // ============================================================================
  // MAINTENANCE ET OPTIMISATION
  // ============================================================================
  
  /**
   * Nettoie les notifications expirées
   */
  cleanupExpired(olderThanDays?: number): Promise<number>;
  
  /**
   * Archive les anciennes notifications
   */
  archiveOldNotifications(olderThanDays?: number): Promise<number>;
  
  /**
   * Optimise les performances de la base de données
   */
  optimize(): Promise<void>;
  
  /**
   * Vérifie l'intégrité des données
   */
  checkIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    fixedIssues: string[];
  }>;
  
  /**
   * Répare les données corrompues si possible
   */
  repairCorruptedData(): Promise<{
    repairedCount: number;
    unrepairedCount: number;
    details: string[];
  }>;

  // ============================================================================
  // GESTION DES TRANSACTIONS
  // ============================================================================
  
  /**
   * Exécute des opérations dans une transaction
   */
  transaction<T>(
    operations: (repository: INotificationRepository) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
  
  /**
   * Démarre une transaction manuelle
   */
  beginTransaction(options?: TransactionOptions): Promise<any>;
  
  /**
   * Valide une transaction
   */
  commitTransaction(transaction: any): Promise<void>;
  
  /**
   * Annule une transaction
   */
  rollbackTransaction(transaction: any): Promise<void>;

  // ============================================================================
  // REQUÊTES RAW ET AVANCÉES
  // ============================================================================
  
  /**
   * Exécute une requête SQL brute (pour cas complexes)
   */
  executeRawQuery(query: string, parameters?: any[]): Promise<any[]>;
  
  /**
   * Exécute une requête d'agrégation personnalisée
   */
  aggregate(pipeline: any[]): Promise<any[]>;
  
  /**
   * Recherche full-text dans le contenu des notifications
   */
  fullTextSearch(
    query: string,
    options?: {
      channels?: string[];
      limit?: number;
      offset?: number;
    }
  ): Promise<Notification[]>;

  // ============================================================================
  // HEALTH CHECK ET MONITORING
  // ============================================================================
  
  /**
   * Vérifie la santé de la connexion à la base de données
   */
  healthCheck(): Promise<{
    isHealthy: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    responseTime: number;
    details?: string;
  }>;
  
  /**
   * Récupère des informations sur la base de données
   */
  getDatabaseInfo(): Promise<{
    version: string;
    size: number;
    tableCount: number;
    indexCount: number;
    connectionPool: {
      active: number;
      idle: number;
      total: number;
    };
  }>;
}

// ============================================================================
// EXTENSIONS ET UTILITAIRES
// ============================================================================

/**
 * Interface pour les repositories avec support de cache
 */
export interface ICacheableNotificationRepository extends INotificationRepository {
  
  /**
   * Invalide le cache pour une notification
   */
  invalidateCache(id: string): Promise<void>;
  
  /**
   * Invalide tout le cache
   */
  clearCache(): Promise<void>;
  
  /**
   * Pré-charge des données dans le cache
   */
  warmCache(criteria?: NotificationSearchCriteria): Promise<void>;
  
  /**
   * Récupère les statistiques du cache
   */
  getCacheStats(): Promise<{
    hitRate: number;
    missRate: number;
    totalEntries: number;
    memoryUsage: number;
  }>;
}

/**
 * Interface pour les repositories avec support d'événements
 */
export interface IEventAwareNotificationRepository extends INotificationRepository {
  
  /**
   * Configure les listeners d'événements
   */
  onNotificationCreated(callback: (notification: Notification) => void): void;
  onNotificationUpdated(callback: (notification: Notification) => void): void;
  onNotificationDeleted(callback: (id: string) => void): void;
  onStatusChanged(callback: (id: string, oldStatus: string, newStatus: string) => void): void;
}

// Note: Toutes les interfaces sont déjà exportées avec 'export interface' ci-dessus
