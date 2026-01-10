import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * DateValidationModule - Valide et normalise la date de déménagement
 *
 * PHASE 1 (priority: 11) - CRITIQUE
 * - Valide que la date est dans le futur
 * - Normalise le format ISO 8601
 * - Ajoute des métadonnées de validation
 */
export class DateValidationModule implements QuoteModule {
  readonly id = 'date-validation';
  readonly description = "Valide et normalise les dates de déménagement";
  readonly priority = 11;
  readonly executionPhase = 'QUOTE';

  apply(ctx: QuoteContext): QuoteContext {
    // Initialiser computed si absent (garde-fou)
    const computed = ctx.computed || createEmptyComputedContext();

    // Si pas de date fournie, on ne peut pas valider → erreur critique en PHASE 1
    if (!ctx.movingDate) {
      throw new Error(
        '[DateValidationModule] Date de déménagement manquante. ' +
        'Une date valide (ISO 8601) est requise pour calculer le devis.'
      );
    }

    // Parser la date
    const movingDate = new Date(ctx.movingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Comparer uniquement les dates (sans heures)

    // Vérifier que la date est valide
    if (isNaN(movingDate.getTime())) {
      throw new Error(
        `[DateValidationModule] Date de déménagement invalide : "${ctx.movingDate}". ` +
        'Format attendu : ISO 8601 (ex: 2025-03-15T10:00:00Z)'
      );
    }

    // Vérifier que la date est dans le futur (au moins aujourd'hui)
    const movingDateOnly = new Date(movingDate);
    movingDateOnly.setHours(0, 0, 0, 0);
    
    if (movingDateOnly < today) {
      throw new Error(
        `[DateValidationModule] Date de déménagement dans le passé : ${ctx.movingDate}. ` +
        'La date doit être aujourd\'hui ou dans le futur.'
      );
    }

    // Normaliser la date (garder l'heure si fournie, sinon midi par défaut)
    const normalizedDate = new Date(movingDate);
    if (!ctx.movingDate.includes('T')) {
      // Si pas d'heure fournie, mettre midi par défaut
      normalizedDate.setHours(12, 0, 0, 0);
    }

    // Calculer le nombre de jours jusqu'au déménagement
    const daysUntilMoving = Math.ceil(
      (movingDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      ...ctx,
      movingDate: normalizedDate.toISOString(),
      computed: {
        ...computed,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          dateValidationApplied: true,
          daysUntilMoving,
          dateValidationTimestamp: new Date().toISOString(),
        }
      }
    };
  }
}