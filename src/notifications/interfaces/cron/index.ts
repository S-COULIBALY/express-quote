/**
 * Index de la couche cron/scheduling
 * 
 * Utilité :
 * - Point d'entrée centralisé pour le système de tâches programmées
 * - Export organisé des schedulers et utilitaires
 * - Configuration simplifiée pour l'intégration
 * - Factory pour différents types de schedulers
 * 
 * Configuration :
 * - Export des classes principales et des types
 * - Utilitaires de configuration et de gestion
 * - Intégration avec le container IoC
 * - Support des différents environnements (dev, prod)
 */

// ============================================================================
// EXPORTS PRINCIPAUX
// ============================================================================

// Scheduler principal - réexport depuis le service
export { 
  ReminderScheduler
} from '../../application/services/schedulers/ReminderScheduler';

// Types pour compatibilité
export type CronTaskConfig = any;
export type TaskResult = any;
export type TaskStats = any;

// ============================================================================
// FACTORY ET UTILITAIRES
// ============================================================================

import { ReminderScheduler } from '../../application/services/schedulers/ReminderScheduler';

/**
 * Factory pour créer et configurer un scheduler
 * 
 * Usage :
 * ```typescript
 * import { createReminderScheduler } from '@/notifications/interfaces/cron';
 * 
 * const scheduler = await createReminderScheduler();
 * await scheduler.start();
 * ```
 */
export async function createReminderScheduler(
  queueManager?: any,
  notificationSender?: any,
  reminderHandler?: any
): Promise<ReminderScheduler> {
  // Créer une nouvelle instance du scheduler avec dépendances
  // Si les dépendances ne sont pas fournies, elles seront créées par défaut
  // Note: Cette fonction nécessite les dépendances pour fonctionner correctement
  if (!queueManager || !notificationSender || !reminderHandler) {
    throw new Error('ReminderScheduler requires queueManager, notificationSender, and reminderHandler dependencies');
  }
  const scheduler = new ReminderScheduler(queueManager, notificationSender, reminderHandler);
  return scheduler;
}

/**
 * Configuration rapide du système de tâches programmées
 * 
 * Usage :
 * ```typescript
 * import { setupScheduler } from '@/notifications/interfaces/cron';
 * 
 * // Au démarrage de l'application
 * await setupScheduler();
 * ```
 */
export async function setupScheduler(options: {
  autoStart?: boolean;
  environment?: 'development' | 'production' | 'test';
  queueManager?: any;
  notificationSender?: any;
  reminderHandler?: any;
} = {}): Promise<ReminderScheduler> {
  const { autoStart = true, environment = process.env.NODE_ENV } = options;
  
  if (!options.queueManager || !options.notificationSender || !options.reminderHandler) {
    throw new Error('setupScheduler requires queueManager, notificationSender, and reminderHandler');
  }
  
  const scheduler = await createReminderScheduler(
    options.queueManager,
    options.notificationSender,
    options.reminderHandler
  );
  
  // ReminderScheduler n'a pas de méthode start/stop - c'est géré par la queue
  // Les rappels sont programmés via scheduleBookingReminders()
  
  return scheduler;
}

/**
 * Utilitaire pour tester une tâche spécifique
 * 
 * Usage :
 * ```typescript
 * import { testTask } from '@/notifications/interfaces/cron';
 * 
 * const result = await testTask('serviceReminders24h');
 * console.log('Résultat:', result);
 * ```
 */
export async function testTask(taskName: string, dependencies?: {
  queueManager?: any;
  notificationSender?: any;
  reminderHandler?: any;
}): Promise<any> {
  if (!dependencies?.queueManager || !dependencies?.notificationSender || !dependencies?.reminderHandler) {
    throw new Error('testTask requires queueManager, notificationSender, and reminderHandler dependencies');
  }
  const scheduler = await createReminderScheduler(
    dependencies.queueManager,
    dependencies.notificationSender,
    dependencies.reminderHandler
  );
  // ReminderScheduler n'a pas de méthode executeTaskManually
  // Les tâches sont gérées via scheduleBookingReminders()
  return { message: 'ReminderScheduler does not support manual task execution' };
}

/**
 * Utilitaire pour récupérer les statistiques des tâches
 */
export async function getSchedulerStats(dependencies?: {
  queueManager?: any;
  notificationSender?: any;
  reminderHandler?: any;
}): Promise<any> {
  // ReminderScheduler n'a pas de méthodes de statistiques
  // Les stats sont gérées par la queue manager
  return {
    isRunning: false,
    activeTasks: [],
    taskStats: {},
    message: 'ReminderScheduler does not expose scheduler stats - use queue manager stats instead'
  };
}

// ============================================================================
// CONFIGURATION ENVIRONNEMENT
// ============================================================================

/**
 * Configuration des tâches selon l'environnement
 */
export const EnvironmentConfig = {
  development: {
    // En dev, tâches moins fréquentes pour éviter le spam
    serviceReminders24h: '0 9 * * *',    // 1x par jour
    serviceReminders1h: '0 */6 * * *',   // Toutes les 6h au lieu de 1h
    cleanupExpiredNotifications: '0 2 * * *',
    dailyReport: false,                   // Pas de rapport en dev
    weeklyReport: false,                  // Pas de rapport en dev
    retryFailedNotifications: '*/30 * * * *', // Toutes les 30min
    syncProviderStatuses: false,          // Pas de sync en dev
    queueHealthCheck: '*/5 * * * *'       // Toutes les 5min
  },
  
  production: {
    // Configuration production complète
    serviceReminders24h: '0 9 * * *',
    serviceReminders1h: '0 */1 * * *',
    cleanupExpiredNotifications: '0 2 * * *',
    dailyReport: '0 8 * * *',
    weeklyReport: '0 8 * * 1',
    retryFailedNotifications: '*/15 * * * *',
    syncProviderStatuses: '*/5 * * * *',
    queueHealthCheck: '*/2 * * * *'
  },
  
  test: {
    // En test, toutes les tâches sont désactivées
    serviceReminders24h: false,
    serviceReminders1h: false,
    cleanupExpiredNotifications: false,
    dailyReport: false,
    weeklyReport: false,
    retryFailedNotifications: false,
    syncProviderStatuses: false,
    queueHealthCheck: false
  }
};

/**
 * Récupère la configuration pour l'environnement actuel
 */
export function getCurrentEnvironmentConfig() {
  const env = process.env.NODE_ENV as keyof typeof EnvironmentConfig || 'development';
  return EnvironmentConfig[env] || EnvironmentConfig.development;
}

// ============================================================================
// INTÉGRATION AVEC LE SYSTÈME DE NOTIFICATIONS
// ============================================================================

/**
 * Gestionnaire global du système de tâches programmées
 * 
 * Utilisé par l'application principale pour gérer le cycle de vie
 * des tâches automatiques.
 */
export class SchedulerManager {
  private scheduler: ReminderScheduler | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialise le gestionnaire de tâches
   * Note: Nécessite les dépendances (queueManager, notificationSender, reminderHandler)
   */
  async initialize(dependencies?: {
    queueManager?: any;
    notificationSender?: any;
    reminderHandler?: any;
  }): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!dependencies?.queueManager || !dependencies?.notificationSender || !dependencies?.reminderHandler) {
      throw new Error('SchedulerManager.initialize requires queueManager, notificationSender, and reminderHandler');
    }

    this.scheduler = await createReminderScheduler(
      dependencies.queueManager,
      dependencies.notificationSender,
      dependencies.reminderHandler
    );
    this.isInitialized = true;
  }

  /**
   * Démarre toutes les tâches
   * Note: ReminderScheduler n'a pas de méthode start() - les rappels sont gérés par la queue
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    // ReminderScheduler n'a pas de méthode start() - c'est géré par la queue manager
  }

  /**
   * Arrête toutes les tâches
   * Note: ReminderScheduler n'a pas de méthode stop() - les rappels sont gérés par la queue
   */
  async stop(): Promise<void> {
    // ReminderScheduler n'a pas de méthode stop() - c'est géré par la queue manager
  }

  /**
   * Redémarre le système
   * Note: ReminderScheduler n'a pas de méthode restart() - les rappels sont gérés par la queue
   */
  async restart(): Promise<void> {
    // ReminderScheduler n'a pas de méthode restart() - c'est géré par la queue manager
  }

  /**
   * Récupère l'instance du scheduler
   */
  getScheduler(): ReminderScheduler | null {
    return this.scheduler;
  }

  /**
   * Indique si le système est initialisé
   */
  isReady(): boolean {
    return this.isInitialized && this.scheduler !== null;
  }

  /**
   * Récupère les statistiques complètes
   */
  async getFullStats(): Promise<any> {
    if (!this.scheduler) {
      return { error: 'Scheduler not initialized' };
    }

    // ReminderScheduler n'expose pas de méthodes de stats
    return {
      isRunning: false,
      activeTasks: [],
      taskStats: {},
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      message: 'ReminderScheduler does not expose scheduler stats - use queue manager stats instead'
    };
  }
}

// Instance singleton du gestionnaire
let schedulerManagerInstance: SchedulerManager | null = null;

/**
 * Récupère l'instance singleton du gestionnaire
 */
export function getSchedulerManager(): SchedulerManager {
  if (!schedulerManagerInstance) {
    schedulerManagerInstance = new SchedulerManager();
  }
  return schedulerManagerInstance;
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  ReminderScheduler,
  createReminderScheduler,
  setupScheduler,
  testTask,
  getSchedulerStats,
  SchedulerManager,
  getSchedulerManager,
  EnvironmentConfig,
  getCurrentEnvironmentConfig
};
