import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * HighValueItemHandlingModule - Gère les objets de grande valeur
 *
 * TYPE : B (conditionnel - si objets de valeur présents)
 * PRIORITÉ : 73 (PHASE 7 - Assurance & Risque)
 * DÉPENDANCES : aucune (fonctionne indépendamment des modules d'assurance)
 *
 * RESPONSABILITÉS :
 * - Détecte la présence d'objets de grande valeur (piano, coffre-fort, œuvres d'art)
 * - Ajoute un surcoût pour manipulation spécialisée
 * - Ajoute des requirements pour protection renforcée
 * - Augmente le score de risque
 */
export class HighValueItemHandlingModule implements QuoteModule {
  readonly id = 'high-value-item-handling';
  readonly description = 'Gère les objets de grande valeur';
  readonly priority = 73; // PHASE 7 - Assurance & Risque
  // Note: Ce module fonctionne indépendamment des modules d'assurance
  // Il détecte les objets de valeur (piano, coffre, art) et ajoute des coûts de manipulation
  readonly dependencies: string[] = [];

  /**
   * Le module s'applique si des objets de grande valeur sont présents
   */
  isApplicable(ctx: QuoteContext): boolean {
    const threshold = MODULES_CONFIG.highValueItems.HIGH_DECLARED_VALUE_THRESHOLD;
    return ctx.piano === true || 
           ctx.safe === true || 
           ctx.artwork === true ||
           (ctx.declaredValue !== undefined && ctx.declaredValue > threshold);
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const config = MODULES_CONFIG.highValueItems;
    const handlingCosts = config.HANDLING_COSTS;
    const riskContribution = config.RISK_CONTRIBUTION;
    const highValueThreshold = config.HIGH_DECLARED_VALUE_THRESHOLD;

    let handlingCost = 0;
    const highValueItems: string[] = [];
    const costBreakdown: Array<{ item: string; cost: number }> = [];
    const requirements = [...computed.requirements];
    const riskContributions = [...computed.riskContributions];

    // Piano
    if (ctx.piano) {
      const pianoCost = handlingCosts.PIANO;
      handlingCost += pianoCost;
      highValueItems.push('Piano');
      costBreakdown.push({ item: 'Piano', cost: pianoCost });
      requirements.push({
        type: 'SPECIAL_HANDLING_REQUIRED',
        severity: 'HIGH',
        reason: 'Piano détecté - Manipulation spécialisée requise avec équipement adapté',
        moduleId: this.id,
        metadata: {
          itemType: 'PIANO',
        }
      });
    }

    // Coffre-fort
    if (ctx.safe) {
      const safeCost = handlingCosts.SAFE;
      handlingCost += safeCost;
      highValueItems.push('Coffre-fort');
      costBreakdown.push({ item: 'Coffre-fort', cost: safeCost });
      requirements.push({
        type: 'SPECIAL_HANDLING_REQUIRED',
        severity: 'CRITICAL',
        reason: 'Coffre-fort détecté - Manipulation critique avec équipement lourd et personnel spécialisé',
        moduleId: this.id,
        metadata: {
          itemType: 'SAFE',
        }
      });
    }

    // Œuvres d'art
    if (ctx.artwork) {
      const artworkCost = handlingCosts.ARTWORK;
      handlingCost += artworkCost;
      highValueItems.push('Œuvres d\'art');
      costBreakdown.push({ item: 'Œuvres d\'art', cost: artworkCost });
      requirements.push({
        type: 'SPECIAL_HANDLING_REQUIRED',
        severity: 'HIGH',
        reason: 'Œuvres d\'art détectées - Emballage et manipulation sur-mesure requis',
        moduleId: this.id,
        metadata: {
          itemType: 'ARTWORK',
        }
      });
    }

    // Valeur déclarée très élevée
    if (ctx.declaredValue && ctx.declaredValue > highValueThreshold) {
      requirements.push({
        type: 'HIGH_VALUE_DECLARED',
        severity: 'MEDIUM',
        reason: `Valeur déclarée élevée (${ctx.declaredValue.toFixed(2)} €) - Protection renforcée recommandée`,
        moduleId: this.id,
        metadata: {
          declaredValue: ctx.declaredValue,
          threshold: highValueThreshold,
        }
      });
    }

    // Contribution au risque
    if (handlingCost > 0) {
      riskContributions.push({
        moduleId: this.id,
        amount: riskContribution,
        reason: `Objets de grande valeur détectés : ${highValueItems.join(', ')} - Risque de dommages élevé`,
        metadata: {
          highValueItems,
          handlingCost,
        }
      });
    }

    // Logs détaillés du calcul
    if (handlingCost > 0) {
      console.log(`   💰 CALCUL COÛT MANIPULATION OBJETS DE VALEUR:`);
      console.log(`      Objets détectés:`);
      costBreakdown.forEach(item => {
        console.log(`         - ${item.item}: ${item.cost}€`);
      });
      const calculationParts = costBreakdown.map(item => `${item.cost}€`).join(' + ');
      console.log(`      Calcul: ${calculationParts} = ${handlingCost.toFixed(2)}€`);
      console.log(`      Contribution au risque: +${riskContribution} points`);
      console.log(`      = Coût total: ${handlingCost.toFixed(2)}€`);
    } else if (ctx.declaredValue && ctx.declaredValue > highValueThreshold) {
      console.log(`   🔧 OBJETS DE VALEUR (sans coût):`);
      console.log(`      Valeur déclarée élevée: ${ctx.declaredValue.toFixed(2)}€ (seuil: ${highValueThreshold}€)`);
      console.log(`      Protection renforcée recommandée (requirement ajouté)`);
    }

    // Ajouter le coût de manipulation spécialisée
    if (handlingCost > 0) {
      return {
        ...ctx,
        computed: {
          ...computed,
          costs: [
            ...computed.costs,
            {
              moduleId: this.id,
              category: 'RISK',
              label: `Manipulation spécialisée objets de valeur (${highValueItems.join(', ')})`,
              amount: parseFloat(handlingCost.toFixed(2)),
            metadata: {
              highValueItems,
              piano: ctx.piano || false,
              safe: ctx.safe || false,
              artwork: ctx.artwork || false,
              costBreakdown: costBreakdown.map(item => ({
                item: item.item,
                cost: parseFloat(item.cost.toFixed(2)),
              })),
              riskContribution,
            }
            }
          ],
          requirements,
          riskContributions,
          activatedModules: [
            ...computed.activatedModules,
            this.id
          ],
          metadata: {
            ...computed.metadata,
            highValueItemsDetected: true,
            highValueItems,
            handlingCost: parseFloat(handlingCost.toFixed(2)),
          }
        }
      };
    }

    // Si pas de coût mais des requirements ajoutés
    return {
      ...ctx,
      computed: {
        ...computed,
        requirements,
        riskContributions,
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          highValueItemsDetected: true,
          highValueItems,
        }
      }
    };
  }
}

