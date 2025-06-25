'use strict';

/**
 * Module de journalisation centralisé pour l'application
 * Compatible client et serveur
 */

// Déterminer si nous sommes côté serveur
const isServer = typeof window === 'undefined';

// Importer le logger universel
const universalLogger = {
  debug: (message, ...meta) => console.debug(message, ...meta),
  info: (message, ...meta) => console.info(message, ...meta),
  warn: (message, ...meta) => console.warn(message, ...meta),
  error: (message, ...meta) => {
    if (message instanceof Error) {
      console.error(`Error: ${message.message}`, { stack: message.stack, ...meta });
    } else {
      console.error(message, ...meta);
    }
  },
  withContext: (context) => {
    return {
      debug: (message, ...meta) => console.debug(`[${context}] ${message}`, ...meta),
      info: (message, ...meta) => console.info(`[${context}] ${message}`, ...meta),
      warn: (message, ...meta) => console.warn(`[${context}] ${message}`, ...meta),
      error: (message, ...meta) => {
        if (message instanceof Error) {
          console.error(`[${context}] Error: ${message.message}`, { stack: message.stack, ...meta });
        } else {
          console.error(`[${context}] ${message}`, ...meta);
        }
      },
      withContext: (nestedContext) => 
        universalLogger.withContext(`${context}:${nestedContext}`)
    };
  }
};

// Exporter le logger universel
module.exports = universalLogger; 