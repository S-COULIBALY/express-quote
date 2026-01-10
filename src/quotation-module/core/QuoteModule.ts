/**
 * QuoteModule - Interface générique pour tous les modules métiers
 *
 * Chaque module a une responsabilité unique et produit des effets spécifiques
 * dans ctx.computed sans jamais modifier les données utilisateur.
 */

import { QuoteContext } from './QuoteContext';

export interface QuoteModule {
  /**
   * Identifiant unique du module (kebab-case)
   * Exemple: "distance-calculation", "no-elevator-penalty"
   */
  readonly id: string;

  /**
   * Description métier du module
   */
  readonly description: string;

  /**
   * Priorité d'exécution (10-99)
   *
   * PHASES DU PIPELINE:
   * 10-19: Normalisation & Préparation
   * 20-29: Volume & Charge
   * 30-39: Distance & Transport
   * 40-49: Accès & Contraintes Bâtiment
   * 50-59: Monte-meubles (CRITIQUE)
   * 60-69: Main d'œuvre
   * 70-79: Assurance & Risque
   * 80-89: Options & Cross-Selling
   * 90-99: Agrégation & Finalisation
   */
  readonly priority: number;

  /**
   * Phase temporelle d'exécution (optionnel)
   * - QUOTE: Pendant le calcul du devis
   * - CONTRACT: Lors de la signature du contrat
   * - OPERATIONS: Pendant l'exécution du déménagement
   *
   * Par défaut: QUOTE
   */
  readonly executionPhase?: 'QUOTE' | 'CONTRACT' | 'OPERATIONS';

  /**
   * IDs des modules dont ce module dépend explicitement
   * Le moteur vérifie que ces modules ont été exécutés avant
   *
   * Exemple: ["distance-calculation"] pour un module qui utilise distanceKm
   */
  readonly dependencies?: string[];

  /**
   * Détermine si le module est applicable au contexte donné
   *
   * RÈGLES DE CONCEPTION:
   * - Type A (systématique): PAS de isApplicable() (toujours exécuté)
   * - Type B (conditionnel métier): isApplicable() OBLIGATOIRE
   * - Type C (dépendant d'état): isApplicable() OBLIGATOIRE avec vérification de dépendances
   *
   * @param ctx Contexte de calcul
   * @returns true si le module doit être exécuté
   */
  isApplicable?(ctx: QuoteContext): boolean;

  /**
   * Applique les effets du module au contexte
   *
   * RÈGLES STRICTES:
   * 1. Modifie UNIQUEMENT ctx.computed
   * 2. Ne modifie JAMAIS les champs utilisateur (serviceType, addresses, etc.)
   * 3. N'initialise JAMAIS ctx.computed (fait par le moteur)
   * 4. Retourne un nouveau contexte (immutabilité)
   * 5. Ajoute son ID à activatedModules pour traçabilité
   *
   * @param ctx Contexte de calcul
   * @returns Nouveau contexte enrichi
   */
  apply(ctx: QuoteContext): QuoteContext;
}

/**
 * Type guard pour vérifier qu'un objet implémente QuoteModule
 */
export function isQuoteModule(obj: any): obj is QuoteModule {
  return (
    obj &&
    typeof obj.id === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.priority === 'number' &&
    typeof obj.apply === 'function'
  );
}
