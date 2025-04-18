/**
 * Classe d'erreur utilisée pour les problèmes de calcul
 */
export class CalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalculationError';
    
    // Nécessaire pour que instanceof fonctionne correctement avec cette classe d'erreur personnalisée
    Object.setPrototypeOf(this, CalculationError.prototype);
  }
} 