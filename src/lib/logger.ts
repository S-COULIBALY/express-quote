/**
 * Module de journalisation centralisé pour l'application
 * 
 * Avantages:
 * - Cohérence dans le format des logs
 * - Activation/désactivation facile des logs
 * - Possibilité d'ajouter des destinations de logs (fichier, service externe)
 * - Niveaux de logs configurables
 */

// Niveaux de journalisation
export enum LogLevel {
  DEBUG = 0,
  INFO = 1, 
  WARN = 2,
  ERROR = 3,
  NONE = 100, // Désactive tous les logs
}

// Configuration globale
const config = {
  // Niveau de log minimum à afficher
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  
  // Activer/désactiver complètement les logs
  enabled: process.env.DISABLE_LOGS !== 'true',
  
  // Préfixes pour les différents niveaux de logs
  prefixes: {
    [LogLevel.DEBUG]: '🔍 DEBUG',
    [LogLevel.INFO]: '✅ INFO',
    [LogLevel.WARN]: '⚠️ WARN',
    [LogLevel.ERROR]: '❌ ERROR',
    [LogLevel.NONE]: 'NONE', // Ajout pour éviter l'erreur d'indexation
  } as Record<LogLevel, string>,
  
  // Couleurs pour les logs en console (si supportées)
  colors: {
    [LogLevel.DEBUG]: '\x1b[90m', // Gris
    [LogLevel.INFO]: '\x1b[36m',  // Cyan
    [LogLevel.WARN]: '\x1b[33m',  // Jaune
    [LogLevel.ERROR]: '\x1b[31m', // Rouge
    [LogLevel.NONE]: '',          // Ajout pour éviter l'erreur d'indexation
    reset: '\x1b[0m'              // Reset
  } as Record<LogLevel | 'reset', string>
};
  
/**
 * Formatte un message de log avec date et préfixe
 */
const formatMessage = (level: LogLevel, message: string, context?: string): string => {
  const date = new Date().toISOString();
  const prefix = config.prefixes[level] || '';
  const contextStr = context ? `[${context}]` : '';
  
  return `${date} ${prefix} ${contextStr} ${message}`;
};
  
/**
 * Journalise un message avec le niveau spécifié
 */
const log = (level: LogLevel, message: string | Error, context?: string, ...args: any[]): void => {
  // Ne pas journaliser si désactivé ou niveau trop bas
  if (!config.enabled || level < config.level) {
    return;
  }
  
  // Convertir l'erreur en message si nécessaire
  const msg = message instanceof Error ? `${message.name}: ${message.message}\n${message.stack}` : message;
  const formattedMessage = formatMessage(level, msg, context);
  
  // Sélectionner la méthode de console appropriée
  let consoleMethod: (...args: any[]) => void;
  
  switch (level) {
    case LogLevel.ERROR:
      consoleMethod = console.error;
      break;
    case LogLevel.WARN:
      consoleMethod = console.warn;
      break;
    case LogLevel.INFO:
      consoleMethod = console.info;
      break;
    case LogLevel.DEBUG:
    default:
      consoleMethod = console.debug;
      break;
  }
  
  // Journaliser le message
  if (args.length > 0) {
    consoleMethod(formattedMessage, ...args);
  } else {
    consoleMethod(formattedMessage);
  }
};

// Déterminer si nous sommes côté serveur ou client
const isServer = typeof window === 'undefined';

/**
 * Logger exporté avec des fonctionnalités différentes selon l'environnement (client/serveur)
 */
export const logger = {
  debug: (message: string | Error, context?: string, ...args: any[]) => 
    log(LogLevel.DEBUG, message, context, ...args),
    
  info: (message: string | Error, context?: string, ...args: any[]) => 
    log(LogLevel.INFO, message, context, ...args),
    
  warn: (message: string | Error, context?: string, ...args: any[]) => 
    log(LogLevel.WARN, message, context, ...args),
    
  error: (message: string | Error, context?: string, ...args: any[]) => 
    log(LogLevel.ERROR, message, context, ...args),
  
  // Créer un logger avec un contexte prédéfini - fonctionne différemment selon l'environnement
  withContext: isServer 
    ? (context: string) => ({
        debug: (message: string | Error, ...args: any[]) => 
          log(LogLevel.DEBUG, message, context, ...args),
          
        info: (message: string | Error, ...args: any[]) => 
          log(LogLevel.INFO, message, context, ...args),
          
        warn: (message: string | Error, ...args: any[]) => 
          log(LogLevel.WARN, message, context, ...args),
          
        error: (message: string | Error, ...args: any[]) => 
          log(LogLevel.ERROR, message, context, ...args),
      })
    : (context: string) => ({
        // Version simplifiée côté client qui ajoute juste le contexte au message
        debug: (message: string | Error, ...args: any[]) => 
          console.debug(`[${context}]`, message, ...args),
          
        info: (message: string | Error, ...args: any[]) => 
          console.info(`[${context}]`, message, ...args),
          
        warn: (message: string | Error, ...args: any[]) => 
          console.warn(`[${context}]`, message, ...args),
          
        error: (message: string | Error, ...args: any[]) => 
          console.error(`[${context}]`, message, ...args),
      }),
  
  // Configuration du logger
  config: {
    setLevel: (level: LogLevel): void => {
      config.level = level;
    },
    
    enable: (): void => {
      config.enabled = true;
    },
    
    disable: (): void => {
      config.enabled = false;
    },
    
    // Obtenir la configuration actuelle
    getConfig: () => ({ ...config }),
  }
}; 