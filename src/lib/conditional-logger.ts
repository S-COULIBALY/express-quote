/**
 * Logger conditionnel pour éviter les logs en production
 * Activable via variables d'environnement
 *
 * Usage:
 * - devLog.info(...): Logs uniquement en dev
 * - devLog.warn(...): Warnings uniquement en dev
 * - devLog.error(...): Erreurs toujours loggées
 * - devLog.debug('Category', ...): Logs par catégorie (activables)
 *
 * Configuration:
 * - NEXT_PUBLIC_DEBUG=true : Active tous les logs
 * - NEXT_PUBLIC_LOG_CATEGORIES=RuleEngine,DetailForm : Active seulement certaines catégories
 */

const IS_DEV = process.env.NODE_ENV === 'development';
const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG === 'true';
const LOG_CATEGORIES = process.env.NEXT_PUBLIC_LOG_CATEGORIES?.split(',').map(c => c.trim()) || [];

export const devLog = {
  /**
   * Log d'information (dev uniquement)
   */
  info: (...args: any[]) => {
    if (IS_DEV || DEBUG_ENABLED) {
      console.log(...args);
    }
  },

  /**
   * Log d'avertissement (dev uniquement)
   */
  warn: (...args: any[]) => {
    if (IS_DEV || DEBUG_ENABLED) {
      console.warn(...args);
    }
  },

  /**
   * Log d'erreur (toujours actif pour monitoring)
   */
  error: (...args: any[]) => {
    console.error(...args);
  },

  /**
   * Log de debug avec catégorie
   * Activable par catégorie via NEXT_PUBLIC_LOG_CATEGORIES=RuleEngine,DetailForm
   *
   * @param category - Catégorie du log (ex: 'RuleEngine', 'DetailForm')
   * @param args - Arguments à logger
   */
  debug: (category: string, ...args: any[]) => {
    if (!DEBUG_ENABLED) return;

    // Si des catégories sont spécifiées, vérifier que celle-ci est autorisée
    if (LOG_CATEGORIES.length > 0 && !LOG_CATEGORIES.includes(category)) {
      return;
    }

    console.log(`[${category}]`, ...args);
  },

  /**
   * Vérifie si les logs sont activés
   */
  isEnabled: (): boolean => {
    return IS_DEV || DEBUG_ENABLED;
  },

  /**
   * Vérifie si une catégorie est activée
   */
  isCategoryEnabled: (category: string): boolean => {
    if (!DEBUG_ENABLED) return false;
    if (LOG_CATEGORIES.length === 0) return true;
    return LOG_CATEGORIES.includes(category);
  }
};
