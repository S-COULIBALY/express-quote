/**
 * Configuration centralisée pour l'assurance déménagement
 *
 * SOURCE UNIQUE DE VÉRITÉ pour tous les calculs d'assurance
 * (frontend PaymentPriceSection + backend InsurancePremiumModule)
 *
 * Basé sur les pratiques du marché français :
 * - Garantie contractuelle de base : 0,3% à 0,5%
 * - Assurance dommage "Tout risque" : 1%
 * - Assurance Ad Valorem complète : 0,15% à 2,3%
 *
 * Sources :
 * - https://www.companeo.com/assurance-de-marchandises/guide/qu-est-ce-qu-une-assurance-ad-valorem
 * - https://www.nextories.com/blog/2013/10/prix-assurance-demenagement/
 */

export const INSURANCE_CONFIG = {
  /**
   * Taux de prime pour l'assurance "Valeur Déclarée" (Ad Valorem)
   * 1% = Assurance Tout Risque (standard du marché)
   */
  RATE: 0.01, // 1%

  /**
   * Prime minimale en euros
   * Garantit une couverture minimale même pour les petites valeurs
   */
  MIN_PREMIUM: 50,

  /**
   * Prime maximale en euros
   * Plafond pour éviter des primes excessives
   */
  MAX_PREMIUM: 5000,

  /**
   * Valeur déclarée par défaut (en euros)
   * 0 = le client doit saisir sa propre valeur
   */
  DEFAULT_DECLARED_VALUE: 0,

  /**
   * Nom de l'assureur partenaire
   * Affiché pour rassurer le client
   */
  INSURER_NAME: 'AXA',
} as const;

/**
 * Calcule la prime d'assurance selon la valeur déclarée
 *
 * Formule : Prime = Valeur × Taux (avec min/max)
 *
 * @param declaredValue - Valeur déclarée par le client en euros
 * @returns Prime d'assurance en euros (arrondie à 2 décimales)
 */
export function calculateInsurancePremium(declaredValue: number): number {
  if (declaredValue <= 0) return 0;

  const rawPremium = declaredValue * INSURANCE_CONFIG.RATE;
  const clampedPremium = Math.max(
    INSURANCE_CONFIG.MIN_PREMIUM,
    Math.min(INSURANCE_CONFIG.MAX_PREMIUM, rawPremium)
  );

  return parseFloat(clampedPremium.toFixed(2));
}

/**
 * Formate le taux pour affichage (ex: "1%")
 */
export function formatInsuranceRate(): string {
  return `${INSURANCE_CONFIG.RATE * 100}%`;
}
