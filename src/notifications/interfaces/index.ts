/**
 * 🚀 INTERFACES DE NOTIFICATION MODERNES - Architecture Simplifiée
 * 
 * Points d'entrée simplifiés pour le système de notifications Express Quote.
 * Plus d'InversifyJS - architecture directe et moderne.
 * 
 * Contient :
 * - Contrôleur HTTP simplifié pour les APIs
 * - Système de tâches programmées (cron)
 * - Utilitaires de configuration
 */

// ============================================================================
// EXPORTS HTTP - API REST MODERNE
// ============================================================================

// Contrôleur principal (architecture simple sans DI)
export { NotificationController } from './http/NotificationController';

// ============================================================================
// EXPORTS CRON - SYSTÈME DE TÂCHES PROGRAMMÉES
// ============================================================================

// Scheduler et utilitaires
export {
  ReminderScheduler,
  createReminderScheduler,
  setupScheduler,
  testTask,
  getSchedulerStats,
  SchedulerManager,
  getSchedulerManager,
  EnvironmentConfig,
  getCurrentEnvironmentConfig,
  type CronTaskConfig,
  type TaskResult,
  type TaskStats
} from './cron';

// ============================================================================
// FACTORY SIMPLIFIÉE POUR CONFIGURATION RAPIDE
// ============================================================================

/**
 * Configuration simplifiée du système d'interfaces
 */
export interface SimpleNotificationConfig {
  cron?: {
    enabled?: boolean;
    autoStart?: boolean;
    environment?: 'development' | 'production' | 'test';
  };
}

/**
 * Gestionnaire simplifié pour Next.js
 * 
 * Usage :
 * ```typescript
 * import { setupSimpleNotifications } from '@/notifications/interfaces';
 * 
 * // Au démarrage de l'application
 * const { controller, scheduler } = await setupSimpleNotifications({
 *   cron: { enabled: true, autoStart: true }
 * });
 * ```
 */
export async function setupSimpleNotifications(
  config: SimpleNotificationConfig = {}
): Promise<{
  controller: NotificationController;
  scheduler?: SchedulerManager;
}> {
  console.log('🚀 Initialisation du système de notifications simplifié...');

  const controller = new NotificationController();
  let scheduler: SchedulerManager | undefined;

  // Configuration des tâches programmées si demandé
  if (config.cron?.enabled) {
    const { getSchedulerManager } = await import('./cron');
    scheduler = getSchedulerManager();
    await scheduler.initialize();

    if (config.cron.autoStart) {
      await scheduler.start();
      console.log('✅ Tâches programmées démarrées');
    }
  }

  console.log('✅ Système de notifications prêt !');
  return { controller, scheduler };
}

/**
 * Configuration pour tests automatisés
 */
export async function setupForTesting(): Promise<{
  controller: NotificationController;
}> {
  return {
    controller: new NotificationController()
  };
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

export default {
  NotificationController,
  setupSimpleNotifications,
  setupForTesting
};