import { QuoteContext } from '../valueObjects/QuoteContext';
import { Quote } from '../valueObjects/Quote';

/**
 * Interface pour les stratégies de calcul de devis
 * Chaque type de service aura sa propre stratégie
 */
export interface QuoteStrategy {
  /**
   * Type de service géré par cette stratégie
   */
  serviceType: string;
  
  /**
   * Calcule le devis pour un contexte donné
   * @param context Le contexte contenant les informations nécessaires au calcul
   * @returns Une promesse contenant le devis calculé
   */
  calculate(context: QuoteContext): Promise<Quote>;
  
  /**
   * Retourne le prix de base avant application des règles
   * @param context Le contexte contenant les informations nécessaires au calcul
   * @returns Une promesse contenant le montant de base calculé
   */
  getBasePrice(context: QuoteContext): Promise<number>;
  
  /**
   * Vérifie si la stratégie peut gérer le type de service donné
   * @param serviceType Le type de service à vérifier
   * @returns true si la stratégie peut gérer ce type de service
   */
  canHandle(serviceType: string): boolean;
}
