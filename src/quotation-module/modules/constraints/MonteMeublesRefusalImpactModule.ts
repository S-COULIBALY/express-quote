import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * MonteMeublesRefusalImpactModule - Gère les conséquences du refus du monte-meubles
 *
 * TYPE : C (déclenché par état calculé)
 * PRIORITÉ : 52 (PHASE 5 - Monte-meubles CRITIQUE)
 * DÉPENDANCES : Nécessite MonteMeublesRecommendationModule (priority 50)
 *
 * RESPONSABILITÉS :
 * - Détecte si monte-meubles recommandé mais refusé
 * - Applique les conséquences juridiques (limitation responsabilité, assurance plafonnée)
 * - Active les flags juridiques
 * - Prépare le contexte pour ManualHandlingRiskCostModule
 *
 * RÈGLE ABSOLUE : Si monte-meubles recommandé mais refusé :
 * - Responsabilité limitée
 * - Assurance plafonnée
 * - Flag juridique activé
 */
export class MonteMeublesRefusalImpactModule implements QuoteModule {
  readonly id = 'monte-meubles-refusal-impact';
  readonly description = 'Gère les conséquences du refus du monte-meubles';
  readonly priority = 52; // Après MonteMeublesRecommendationModule (50)
  readonly dependencies = ['monte-meubles-recommendation'];

  private static readonly INSURANCE_CAP_REDUCTION = 0.5; // Réduction de 50% de la couverture assurance

  /**
   * TYPE C : Le module s'applique uniquement si :
   * 1. Monte-meubles recommandé (vérifié via dépendance + requirements)
   * 2. Refusé explicitement par l'utilisateur
   *
   * isApplicable() est vérifié APRÈS que les dépendances aient été satisfaites,
   * ce qui permet d'accéder aux requirements calculés par MonteMeublesRecommendationModule.
   */
  isApplicable(ctx: QuoteContext): boolean {
    const computed = ctx.computed;
    if (!computed) {
      return false;
    }

    // Vérifier si monte-meubles recommandé
    const hasRecommendation = computed.requirements.some(
      req => req.type === 'LIFT_RECOMMENDED' && req.moduleId === 'monte-meubles-recommendation'
    );

    // Vérifier si refusé par l'utilisateur
    const isRefused = ctx.refuseLiftDespiteRecommendation === true;

    return hasRecommendation && isRefused;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();
    
    // isApplicable() a déjà vérifié les conditions, on peut procéder directement

    // Appliquer les conséquences juridiques
    const legalImpacts = [...computed.legalImpacts];
    legalImpacts.push({
      moduleId: this.id,
      severity: 'WARNING',
      type: 'LIABILITY_LIMITATION',
      message: '⚠️ Responsabilité limitée : Vous avez refusé le monte-meubles malgré la recommandation. ' +
               'En cas de dommages liés à la manutention manuelle (casses, rayures, blessures), ' +
               'la responsabilité de l\'entreprise est limitée. Vous assumez 100% du risque financier. ' +
               '💡 Le monte-meubles vous aurait coûté 150 € de moins (350 € vs 500 € de surcoût) et vous aurait protégé complètement.',
      metadata: {
        recommendationRefused: true,
        refusalReason: 'Client a explicitement refusé le monte-meubles',
        monteMeublesCost: 350,
        surcoûtRisk: 500,
        economyIfAccepted: 150,
      }
    });

    const originalCoverage = ctx.declaredValue || 0;
    const reducedCoverage = originalCoverage * (1 - MonteMeublesRefusalImpactModule.INSURANCE_CAP_REDUCTION);
    
    legalImpacts.push({
      moduleId: this.id,
      severity: 'WARNING',
      type: 'INSURANCE_CAP',
      message: `⚠️ Assurance plafonnée : Votre couverture assurance est réduite de ${(MonteMeublesRefusalImpactModule.INSURANCE_CAP_REDUCTION * 100).toFixed(0)}% ` +
               `en raison du refus du monte-meubles. ` +
               `Vous avez déclaré ${originalCoverage.toFixed(2)} € de biens, mais vous êtes protégé seulement pour ${reducedCoverage.toFixed(2)} €. ` +
               `💡 Avec le monte-meubles, vous auriez été protégé pour ${originalCoverage.toFixed(2)} € (100% de votre valeur déclarée). ` +
               `Vous payez la même prime d'assurance (135 €) mais avec moitié moins de couverture.`,
      metadata: {
        originalDeclaredValue: ctx.declaredValue,
        originalCoverage,
        reducedCoverage,
        reductionPercentage: MonteMeublesRefusalImpactModule.INSURANCE_CAP_REDUCTION * 100,
        coverageLoss: originalCoverage - reducedCoverage,
      }
    });

    // Ajouter une note d'assurance explicative
    const insuranceNotes = [...computed.insuranceNotes];
    insuranceNotes.push(
      `⚠️ COUVERTURE ASSURANCE RÉDUITE DE ${(MonteMeublesRefusalImpactModule.INSURANCE_CAP_REDUCTION * 100).toFixed(0)}% : ` +
      `Vous avez déclaré ${originalCoverage.toFixed(2)} € mais êtes protégé seulement pour ${reducedCoverage.toFixed(2)} € ` +
      `en raison du refus du monte-meubles. Vous payez la même prime (135 €) mais avec moitié moins de protection. ` +
      `💡 Le monte-meubles vous aurait coûté 150 € de moins et vous aurait donné une protection complète.`
    );

    // Activer le flag juridique
    const operationalFlags = [...computed.operationalFlags, 'LIFT_REFUSAL_LEGAL_IMPACT'];

    // Contribuer au risque
    const riskContributions = [...computed.riskContributions];
    riskContributions.push({
      moduleId: this.id,
      amount: 25, // Contribution importante au risque (0-100)
      reason: 'Refus du monte-meubles malgré recommandation - Risque élevé de dommages',
      metadata: {
        recommendationRefused: true,
      }
    });

    return {
      ...ctx,
      computed: {
        ...computed,
        legalImpacts,
        insuranceNotes,
        operationalFlags,
        riskContributions,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          monteMeublesRefused: true,
          legalImpactApplied: true,
          insuranceCapApplied: true,
        }
      }
    };
  }
}

