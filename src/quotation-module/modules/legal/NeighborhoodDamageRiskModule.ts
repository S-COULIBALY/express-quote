import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * NeighborhoodDamageRiskModule - Évalue le risque de dommages au voisinage
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 76 (PHASE 7 - Assurance & Risque)
 *
 * RESPONSABILITÉS :
 * - Détecte les situations à risque pour le voisinage
 * - Contribue au risque et ajoute des requirements
 * - Ajoute des notes d'assurance si nécessaire
 *
 * LOGIQUE MÉTIER :
 * - Risque élevé si :
 *   - Étage élevé sans ascenseur (manutention difficile)
 *   - Meubles encombrants (piano, coffre-fort)
 *   - Rue étroite (accès difficile)
 * - Augmente le risque et peut nécessiter une assurance supplémentaire
 */
export class NeighborhoodDamageRiskModule implements QuoteModule {
  readonly id = 'neighborhood-damage-risk';
  readonly description = 'Évalue le risque de dommages au voisinage';
  readonly priority = 76; // PHASE 7 - Assurance & Risque

  private static readonly BASE_RISK_CONTRIBUTION = 5; // Contribution de base au risque
  private static readonly HIGH_FLOOR_RISK_MULTIPLIER = 2; // Multiplicateur par étage élevé
  private static readonly BULKY_FURNITURE_RISK = 10; // Risque supplémentaire pour meubles encombrants

  /**
   * Le module s'applique si risque de dommages au voisinage détecté
   */
  isApplicable(ctx: QuoteContext): boolean {
    // Risque si étage élevé sans ascenseur OU meubles encombrants OU rue étroite
    const hasHighFloorRisk = 
      (ctx.pickupFloor && ctx.pickupFloor > 2 && ctx.pickupHasElevator === false) ||
      (ctx.deliveryFloor && ctx.deliveryFloor > 2 && ctx.deliveryHasElevator === false);
    
    const hasBulkyFurniture = ctx.piano === true || ctx.safe === true || ctx.bulkyFurniture === true;
    const hasNarrowStreet = ctx.pickupStreetNarrow === true || ctx.deliveryStreetNarrow === true;

    return hasHighFloorRisk || hasBulkyFurniture || hasNarrowStreet;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const riskFactors: string[] = [];
    let riskContribution = NeighborhoodDamageRiskModule.BASE_RISK_CONTRIBUTION;

    // Risque étage élevé sans ascenseur
    if (ctx.pickupFloor && ctx.pickupFloor > 2 && ctx.pickupHasElevator === false) {
      riskFactors.push(`étage ${ctx.pickupFloor} sans ascenseur au départ`);
      riskContribution += ctx.pickupFloor * NeighborhoodDamageRiskModule.HIGH_FLOOR_RISK_MULTIPLIER;
    }
    if (ctx.deliveryFloor && ctx.deliveryFloor > 2 && ctx.deliveryHasElevator === false) {
      riskFactors.push(`étage ${ctx.deliveryFloor} sans ascenseur à l'arrivée`);
      riskContribution += ctx.deliveryFloor * NeighborhoodDamageRiskModule.HIGH_FLOOR_RISK_MULTIPLIER;
    }

    // Risque meubles encombrants
    if (ctx.piano === true) {
      riskFactors.push('piano');
      riskContribution += NeighborhoodDamageRiskModule.BULKY_FURNITURE_RISK;
    }
    if (ctx.safe === true) {
      riskFactors.push('coffre-fort');
      riskContribution += NeighborhoodDamageRiskModule.BULKY_FURNITURE_RISK;
    }
    if (ctx.bulkyFurniture === true) {
      riskFactors.push('meubles encombrants');
      riskContribution += NeighborhoodDamageRiskModule.BULKY_FURNITURE_RISK;
    }

    // Risque rue étroite
    if (ctx.pickupStreetNarrow === true || ctx.deliveryStreetNarrow === true) {
      riskFactors.push('rue étroite');
      riskContribution += 3;
    }

    // Plafonner le risque à 30 points
    riskContribution = Math.min(riskContribution, 30);

    // Ajouter un requirement
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'NEIGHBORHOOD_DAMAGE_RISK',
      severity: riskContribution > 15 ? 'HIGH' : 'MEDIUM',
      reason: `Risque de dommages au voisinage détecté : ${riskFactors.join(', ')}. ` +
              `Vigilance accrue requise lors du déménagement pour éviter les dommages aux parties communes ` +
              `et aux biens des voisins.`,
      moduleId: this.id,
      metadata: {
        riskFactors,
        riskScore: riskContribution,
      }
    });

    // Ajouter une note d'assurance
    const insuranceNotes = [...computed.insuranceNotes];
    if (riskContribution > 15) {
      insuranceNotes.push(
        `⚠️ Risque élevé de dommages au voisinage (${riskFactors.join(', ')}). ` +
        `Assurance complémentaire recommandée.`
      );
    }

    return {
      ...ctx,
      computed: {
        ...computed,
        requirements,
        insuranceNotes,
        riskContributions: [
          ...computed.riskContributions,
          {
            moduleId: this.id,
            amount: riskContribution,
            reason: `Risque de dommages au voisinage : ${riskFactors.join(', ')}`,
            metadata: {
              riskFactors,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        metadata: {
          ...computed.metadata,
          neighborhoodDamageRiskDetected: true,
          neighborhoodRiskFactors: riskFactors,
          neighborhoodRiskScore: riskContribution,
        }
      }
    };
  }
}

