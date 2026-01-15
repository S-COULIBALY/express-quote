// ============================================================================
// NOTIFICATIONS CORE INTERFACES INDEX
// ============================================================================

// Exports des interfaces (en évitant les conflits de noms)
export * from './ILogger';
export * from './INotificationAdapter';
export * from './INotificationQueue';
// INotificationRepository a des conflits avec INotificationQueue, exporter sélectivement
export type {
  INotificationRepository,
  NotificationRepositoryStats,
  TransactionOptions,
  ICacheableNotificationRepository,
  IEventAwareNotificationRepository
} from './INotificationRepository';
export * from './INotificationService';

/**
 * Interface de base pour les événements du domaine
 */
export interface DomainEvent<T = unknown> {
  /** Identifiant unique de l'événement */
  readonly eventId: string;

  /** Type de l'événement */
  readonly eventType: string;

  /** Timestamp de création */
  readonly timestamp: Date;

  /** Données de l'événement */
  readonly payload: T;

  /** Métadonnées de l'événement */
  readonly metadata: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    version?: number;
    source: string;
    traceId?: string;
    context?: Record<string, unknown>;
    [key: string]: unknown;
  };
}
