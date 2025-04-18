/**
 * Classe d'erreur utilisée pour les problèmes de validation des données
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    
    // Nécessaire pour que instanceof fonctionne correctement avec cette classe d'erreur personnalisée
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
} 