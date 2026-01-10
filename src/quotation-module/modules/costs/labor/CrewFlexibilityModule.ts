import { QuoteContext, QuoteModule } from '../../types/quote-types';
import { createEmptyComputedContext } from '../../../core/ComputedContext';
import { MODULES_CONFIG } from '../../../config/modules.config';

/**
 * CrewFlexibilityModule - Ajoute une garantie flexibilité équipe
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 67 (PHASE 6 - Main d'œuvre)
 *
 * RESPONSABILITÉS :
 * - Ajoute un coût de garantie "flexibilité équipe" (EXCLUSIF au scénario FLEX)
 * - Permet l'ajustement de l'équipe en temps réel si volume sous-estimé
 * - Supprime les litiges liés à une mauvaise estimation de volume
 *
 * CONDITIONS D'APPLICATION :
 * - UNIQUEMENT si crewFlexibility === true (forcé par scénario FLEX)
 *
 * TARIFICATION :
 * - Forfait flexibilité : 500€ (garantie ajustement équipe sans surcoût)
 * - Couvre : +1 déménageur si besoin, +2h de travail, véhicule plus grand si nécessaire
 */
export class CrewFlexibilityModule implements QuoteModule {
  readonly id = 'crew-flexibility';
  readonly description = 'Ajoute une garantie flexibilité équipe (exclusif scénario FLEX)';
  readonly priority = 67; // PHASE 6 - Main d'œuvre

  /**
   * Le module s'applique UNIQUEMENT si :
   * - Forcé par le scénario FLEX (crewFlexibility === true)
   * 
   * Ce module est exclusif au scénario FLEX et ne s'applique pas dans les autres scénarios.
   */
  isApplicable(ctx: QuoteContext): boolean {
    // Uniquement si forcé par scénario FLEX
    return ctx.crewFlexibility === true;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const flexibilityCost = MODULES_CONFIG.labor.FLEXIBILITY_GUARANTEE_COST;

    // Log des calculs
    console.log(`   💰 CALCUL GARANTIE FLEXIBILITÉ ÉQUIPE:`);
    console.log(`      Scénario: FLEX (garantie flexibilité activée)`);
    console.log(`      Forfait: ${flexibilityCost}€`);
    console.log(`      Couverture:`);
    console.log(`         - +1 déménageur si besoin`);
    console.log(`         - +2h de travail`);
    console.log(`         - Véhicule plus grand si nécessaire`);
    console.log(`      = Total: ${flexibilityCost.toFixed(2)}€`);

    // Ajouter une proposition cross-selling pour informer le client des avantages
    const crossSellProposals = [...computed.crossSellProposals];
    crossSellProposals.push({
      id: 'CREW_FLEXIBILITY_GUARANTEE',
      label: 'Garantie Flexibilité Équipe',
      reason: 'Volume estimé, risque de sous-estimation',
      benefit: 'Ajustement équipe sans surcoût si volume réel supérieur à l\'estimation. ' +
               'Inclut : +1 déménageur si besoin, +2h de travail, véhicule plus grand.',
      priceImpact: flexibilityCost,
      optional: false, // Inclus dans le scénario FLEX
      moduleId: this.id,
      metadata: {
        coverage: ['+1 déménageur', '+2h travail', 'Véhicule plus grand'],
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'LABOR',
            label: 'Garantie Flexibilité Équipe',
            amount: parseFloat(flexibilityCost.toFixed(2)),
            metadata: {
              coverage: ['+1 déménageur si besoin', '+2h de travail', 'Véhicule plus grand si nécessaire'],
              volumeMethod: ctx.volumeMethod,
            }
          }
        ],
        crossSellProposals,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        operationalFlags: [
          ...computed.operationalFlags,
          'CREW_FLEXIBILITY_GUARANTEED',
        ],
        metadata: {
          ...computed.metadata,
          crewFlexibilityGuarantee: true,
          crewFlexibilityCost: parseFloat(flexibilityCost.toFixed(2)),
        }
      }
    };
  }
}
