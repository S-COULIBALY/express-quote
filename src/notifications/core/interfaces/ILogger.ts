/**
 * Interface pour le système de logging
 * Compatible avec Pino, Winston, Console, etc.
 */

export interface ILogger {
  // Niveaux de log standard
  error(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  trace?(message: string, ...args: any[]): void;
  
  // Support des objets de contexte
  error(obj: any, message?: string, ...args: any[]): void;
  warn(obj: any, message?: string, ...args: any[]): void;
  info(obj: any, message?: string, ...args: any[]): void;
  debug(obj: any, message?: string, ...args: any[]): void;
  trace?(obj: any, message?: string, ...args: any[]): void;
}

/**
 * Logger console simple pour développement
 */
export class ConsoleLogger implements ILogger {
  error(message: any, ...args: any[]): void {
    console.error('ERROR:', message, ...args);
  }
  
  warn(message: any, ...args: any[]): void {
    console.warn('WARN:', message, ...args);
  }
  
  info(message: any, ...args: any[]): void {
    console.info('INFO:', message, ...args);
  }
  
  debug(message: any, ...args: any[]): void {
    if (process.env.DEBUG_NOTIFICATIONS === 'true') {
      console.debug('DEBUG:', message, ...args);
    }
  }
  
  trace(message: any, ...args: any[]): void {
    if (process.env.DEBUG_NOTIFICATIONS === 'true') {
      console.trace('TRACE:', message, ...args);
    }
  }
}
