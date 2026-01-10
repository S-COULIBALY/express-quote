import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * CleaningEndRequirementModule - Recommande le nettoyage de fin de chantier
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 81 (PHASE 8 - Options & Cross-Selling)
 *
 * RESPONSABILITÉS :
 * - Détecte si le nettoyage de fin de chantier est recommandé
 * - Ajoute un requirement et une proposition cross-selling
 *
 * LOGIQUE MÉTIER :
 * - Nettoyage toujours disponible en option si une surface est fournie
 * - Pas de conditions restrictives
 */
export class CleaningEndRequirementModule implements QuoteModule {
  readonly id = 'cleaning-end-requirement';
  readonly description = 'Recommande le nettoyage de fin de chantier';
  readonly priority = 83; // PHASE 8 - Options & Cross-Selling

  /**
   * Le module s'applique si une surface est fournie (pas de conditions restrictives)
   */
  isApplicable(ctx: QuoteContext): boolean {
    const surface = ctx.surface || 0;
    return surface > 0; // Disponible si surface > 0
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const costPerM2 = MODULES_CONFIG.crossSelling.CLEANING_COST_PER_M2;
    const surface = ctx.surface || 0;
    const estimatedCost = surface * costPerM2;

    // Ajouter un requirement
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'CLEANING_RECOMMENDED',
      severity: 'LOW',
      reason: `Nettoyage de fin de chantier disponible pour ${surface} m². ` +
              `Remise en état du logement pour faciliter la remise des clés.`,
      moduleId: this.id,
      metadata: {
        surface,
      }
    });

    // Ajouter une proposition cross-selling
    const crossSellProposals = [...computed.crossSellProposals];
    crossSellProposals.push({
      id: 'CLEANING_END_SERVICE',
      label: 'Nettoyage de fin de chantier',
      reason: `Disponible pour surface de ${surface} m².`,
      benefit: 'Remise en état complète du logement, facilitant la remise des clés et évitant les retenues sur caution.',
      priceImpact: parseFloat(estimatedCost.toFixed(2)),
      optional: true,
      moduleId: this.id,
      basedOnRequirement: 'CLEANING_RECOMMENDED',
      metadata: {
        surface,
        costPerM2,
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        requirements,
        crossSellProposals,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          cleaningRecommended: true,
        }
      }
    };
  }
}

