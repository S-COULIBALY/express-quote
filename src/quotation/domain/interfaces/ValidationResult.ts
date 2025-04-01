/**
 * Interface représentant le résultat d'une validation
 */
export interface ValidationResult {
  /**
   * Indique si la validation a réussi
   */
  isValid: boolean;
  
  /**
   * Données validées (présentes uniquement si isValid est true)
   */
  data?: any;
  
  /**
   * Messages d'erreur (présents uniquement si isValid est false)
   */
  errors?: string[];
} 