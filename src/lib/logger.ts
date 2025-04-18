/**
 * Service de journalisation structurée pour l'application
 * Utilise une sortie console simple, mais peut être remplacé par
 * une solution plus robuste comme pino, winston, etc.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private level: LogLevel = 'info';
  
  private constructor() {
    // Définir le niveau de journalisation depuis les variables d'environnement
    if (process.env.LOG_LEVEL) {
      this.level = process.env.LOG_LEVEL as LogLevel;
    }
  }
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * Détermine si un niveau de journalisation doit être affiché
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[messageLevel] >= levels[this.level];
  }
  
  /**
   * Format un message de journal avec des métadonnées
   */
  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metadataStr}`;
  }
  
  /**
   * Journalisation niveau debug
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, metadata));
    }
  }
  
  /**
   * Journalisation niveau info
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, metadata));
    }
  }
  
  /**
   * Journalisation niveau warn
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, metadata));
    }
  }
  
  /**
   * Journalisation niveau error
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    if (this.shouldLog('error')) {
      const combinedMetadata = error 
        ? { ...metadata, errorName: error.name, errorStack: error.stack }
        : metadata;
      
      console.error(this.formatMessage('error', message, combinedMetadata));
    }
  }
}

// Exporter l'instance singleton du logger
export const logger = Logger.getInstance(); 