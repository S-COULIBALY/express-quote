/**
 * Wrapper universel pour logger, compatible client et serveur
 * Version améliorée pour éviter les erreurs d'import côté serveur
 */

// Déterminer l'environnement
const isServer = typeof window === 'undefined';

// Interface commune pour toutes les fonctions de logging
export interface IUniversalLogger {
  debug: (message: string, ...meta: any[]) => void;
  info: (message: string, ...meta: any[]) => void;
  warn: (message: string, ...meta: any[]) => void;
  error: (message: string | Error, ...meta: any[]) => void;
  withContext: (context: string) => IUniversalLogger;
}

// Fonction helper pour s'assurer que les arguments sont sérialisables
const sanitizeArgs = (args: any[]): any[] => {
  return args.map(arg => {
    if (arg instanceof Error) {
      return { message: arg.message, stack: arg.stack, name: arg.name };
    }
    if (typeof arg === 'object' && arg !== null) {
      try {
        JSON.stringify(arg);
        return arg;
      } catch {
        return '[Object non-sérialisable]';
      }
    }
    return arg;
  });
};

// Logger universel - fonctionne côté client et serveur avec gestion d'erreur robuste
const universalLogger: IUniversalLogger = {
  debug: (message: string, ...meta: any[]) => {
    try {
      const sanitizedMeta = sanitizeArgs(meta);
      console.debug(message, ...sanitizedMeta);
    } catch (error) {
      console.debug(message, '[Erreur lors du logging des métadonnées]');
    }
  },
  info: (message: string, ...meta: any[]) => {
    try {
      const sanitizedMeta = sanitizeArgs(meta);
      console.info(message, ...sanitizedMeta);
    } catch (error) {
      console.info(message, '[Erreur lors du logging des métadonnées]');
    }
  },
  warn: (message: string, ...meta: any[]) => {
    try {
      const sanitizedMeta = sanitizeArgs(meta);
      console.warn(message, ...sanitizedMeta);
    } catch (error) {
      console.warn(message, '[Erreur lors du logging des métadonnées]');
    }
  },
  error: (message: string | Error, ...meta: any[]) => {
    try {
      if (message instanceof Error) {
        const sanitizedMeta = sanitizeArgs(meta);
        console.error(`Error: ${message.message}`, { 
          stack: message.stack, 
          name: message.name,
          ...sanitizedMeta
        });
      } else {
        const sanitizedMeta = sanitizeArgs(meta);
        console.error(message, ...sanitizedMeta);
      }
    } catch (error) {
      console.error(typeof message === 'string' ? message : 'Erreur inconnue', '[Erreur lors du logging]');
    }
  },
  withContext: (context: string) => {
    return {
      debug: (message: string, ...meta: any[]) => universalLogger.debug(`[${context}] ${message}`, ...meta),
      info: (message: string, ...meta: any[]) => universalLogger.info(`[${context}] ${message}`, ...meta),
      warn: (message: string, ...meta: any[]) => universalLogger.warn(`[${context}] ${message}`, ...meta),
      error: (message: string | Error, ...meta: any[]) => universalLogger.error(
        message instanceof Error 
          ? new Error(`[${context}] ${message.message}`)
          : `[${context}] ${message}`, 
        ...meta
      ),
      withContext: (nestedContext: string) => 
        universalLogger.withContext(`${context}:${nestedContext}`)
    };
  }
};

// Créer et exporter le logger
export const logger: IUniversalLogger = universalLogger;

export default logger; 