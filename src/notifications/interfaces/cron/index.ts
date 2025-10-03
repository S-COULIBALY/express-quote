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

// Scheduler principal
export { 
  ReminderScheduler,
  type CronTaskConfig,
  type TaskResult,
  type TaskStats
} from './ReminderScheduler';

// ============================================================================
// FACTORY ET UTILITAIRES
// ============================================================================

import { ReminderScheduler } from './ReminderScheduler';

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
export async function createReminderScheduler(): Promise<ReminderScheduler> {
  // Créer une nouvelle instance du scheduler simple
  const scheduler = new ReminderScheduler();
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
} = {}): Promise<ReminderScheduler> {
  const { autoStart = true, environment = process.env.NODE_ENV } = options;
  
  const scheduler = await createReminderScheduler();
  
  if (autoStart && environment !== 'test') {
    await scheduler.start();
    
    // Arrêt propre sur les signaux système
    process.on('SIGTERM', () => scheduler.stop());
    process.on('SIGINT', () => scheduler.stop());
  }
  
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
export async function testTask(taskName: string): Promise<any> {
  const scheduler = await createReminderScheduler();
  return await scheduler.executeTaskManually(taskName);
}

/**
 * Utilitaire pour récupérer les statistiques des tâches
 */
export async function getSchedulerStats(): Promise<any> {
  const scheduler = await createReminderScheduler();
  return {
    isRunning: scheduler.isSchedulerRunning(),
    activeTasks: scheduler.getActiveTasks(),
    taskStats: scheduler.getTaskStats()
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
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.scheduler = await createReminderScheduler();
    this.isInitialized = true;
  }

  /**
   * Démarre toutes les tâches
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    await this.scheduler!.start();
  }

  /**
   * Arrête toutes les tâches
   */
  async stop(): Promise<void> {
    if (this.scheduler) {
      await this.scheduler.stop();
    }
  }

  /**
   * Redémarre le système
   */
  async restart(): Promise<void> {
    if (this.scheduler) {
      await this.scheduler.restart();
    }
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
    return this.isInitialized && this.scheduler?.isSchedulerRunning() === true;
  }

  /**
   * Récupère les statistiques complètes
   */
  async getFullStats(): Promise<any> {
    if (!this.scheduler) {
      return { error: 'Scheduler not initialized' };
    }

    return {
      isRunning: this.scheduler.isSchedulerRunning(),
      activeTasks: this.scheduler.getActiveTasks(),
      taskStats: this.scheduler.getTaskStats(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime()
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
