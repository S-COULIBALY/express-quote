import { QuoteContext, QuoteModule } from '../types/quote-types';
import { createEmptyComputedContext } from '../../core/ComputedContext';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * PublicDomainOccupationModule - Gère l'occupation du domaine public
 *
 * TYPE : B (conditionnel métier)
 * PRIORITÉ : 77 (PHASE 7 - Assurance & Risque)
 *
 * RESPONSABILITÉS :
 * - Détecte si occupation du domaine public est nécessaire
 * - Ajoute des requirements et des coûts administratifs
 * - Contribue au risque (autorisations, responsabilités)
 *
 * LOGIQUE MÉTIER :
 * - Occupation domaine public si :
 *   - Autorisation de stationnement requise (pickupParkingAuthorizationRequired OU deliveryParkingAuthorizationRequired)
 *   - Rue étroite nécessitant occupation trottoir
 * - Nécessite autorisation préfectorale/municipale
 * - Surcoût administratif et risque juridique
 */
export class PublicDomainOccupationModule implements QuoteModule {
  readonly id = 'public-domain-occupation';
  readonly description = 'Gère l\'occupation du domaine public';
  readonly priority = 77; // PHASE 7 - Assurance & Risque

  /**
   * Le module s'applique si occupation du domaine public nécessaire
   */
  isApplicable(ctx: QuoteContext): boolean {
    // Occupation domaine public si autorisation stationnement requise OU rue étroite
    const needsParkingAuthorization = 
      ctx.pickupParkingAuthorizationRequired === true || 
      ctx.deliveryParkingAuthorizationRequired === true;
    
    const hasNarrowStreet = ctx.pickupStreetNarrow === true || ctx.deliveryStreetNarrow === true;

    return needsParkingAuthorization || hasNarrowStreet;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const computed = ctx.computed || createEmptyComputedContext();

    if (!this.isApplicable(ctx)) {
      return ctx;
    }

    const locations: string[] = [];
    if (ctx.pickupParkingAuthorizationRequired === true) {
      locations.push('départ');
    }
    if (ctx.deliveryParkingAuthorizationRequired === true) {
      locations.push('arrivée');
    }
    if (ctx.pickupStreetNarrow === true && !locations.includes('départ')) {
      locations.push('départ (rue étroite)');
    }
    if (ctx.deliveryStreetNarrow === true && !locations.includes('arrivée')) {
      locations.push('arrivée (rue étroite)');
    }

    // Ajouter un requirement
    const requirements = [...computed.requirements];
    requirements.push({
      type: 'PUBLIC_DOMAIN_OCCUPATION_REQUIRED',
      severity: 'MEDIUM',
      reason: `Occupation du domaine public nécessaire au ${locations.join(' et à l\'')}. ` +
              `Autorisation préfectorale ou municipale requise. ` +
              `Sans autorisation, le déménagement peut être interrompu et des amendes peuvent être appliquées.`,
      moduleId: this.id,
      metadata: {
        locations,
        pickupParkingAuthorizationRequired: ctx.pickupParkingAuthorizationRequired,
        deliveryParkingAuthorizationRequired: ctx.deliveryParkingAuthorizationRequired,
        pickupStreetNarrow: ctx.pickupStreetNarrow,
        deliveryStreetNarrow: ctx.deliveryStreetNarrow,
      }
    });

    // Ajouter un impact juridique
    const legalImpacts = [...computed.legalImpacts];
    legalImpacts.push({
      moduleId: this.id,
      severity: 'WARNING',
      type: 'REGULATORY',
      message: `Occupation du domaine public : Autorisation administrative requise au ${locations.join(' et à l\'')}. ` +
               `L'entreprise doit obtenir l'autorisation préfectorale ou municipale avant le déménagement. ` +
               `Sans autorisation, risque d'interruption du déménagement et d'amendes.`,
      metadata: {
        locations,
        authorizationRequired: true,
      }
    });

    // Calculer le coût administratif
    const adminConfig = MODULES_CONFIG.administrative;
    const riskConfig = MODULES_CONFIG.risk;
    const baseCost = adminConfig.PUBLIC_DOMAIN_AUTHORIZATION_COST;
    const multipleLocations = locations.length > 1;
    const multiplier = multipleLocations ? adminConfig.MULTIPLE_LOCATIONS_MULTIPLIER : 1;
    const administrativeCost = baseCost * multiplier;
    const riskContribution = riskConfig.PUBLIC_DOMAIN_RISK_CONTRIBUTION;

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL COÛT AUTORISATION DOMAINE PUBLIC:`);
    console.log(`      Emplacements concernés: ${locations.join(', ')}`);
    console.log(`      Nombre d'emplacements: ${locations.length}`);
    console.log(`      Coût de base: ${baseCost}€`);
    if (multipleLocations) {
      console.log(`      Plusieurs emplacements: Oui (×${multiplier})`);
      console.log(`      Calcul: ${baseCost}€ × ${multiplier} = ${administrativeCost.toFixed(2)}€`);
    } else {
      console.log(`      Plusieurs emplacements: Non`);
      console.log(`      Calcul: ${baseCost}€ × ${multiplier} = ${administrativeCost.toFixed(2)}€`);
    }
    console.log(`      Contribution au risque: +${riskContribution} points`);
    console.log(`      = Coût total: ${administrativeCost.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...computed,
        costs: [
          ...computed.costs,
          {
            moduleId: this.id,
            category: 'ADMINISTRATIVE',
            label: `Coût autorisation domaine public (${locations.join(', ')})`,
            amount: parseFloat(administrativeCost.toFixed(2)),
            metadata: {
              locations,
              baseCost,
              multipleLocations,
              multiplier: parseFloat(multiplier.toFixed(2)),
              riskContribution,
            }
          }
        ],
        requirements,
        legalImpacts,
        riskContributions: [
          ...computed.riskContributions,
          {
            moduleId: this.id,
            amount: riskContribution,
            reason: `Occupation domaine public - Autorisation administrative requise (${locations.join(', ')})`,
            metadata: {
              locations,
            }
          }
        ],
        activatedModules: [
          ...computed.activatedModules,
          this.id
        ],
        operationalFlags: [
          ...computed.operationalFlags,
          'PUBLIC_DOMAIN_OCCUPATION_REQUIRED'
        ],
        metadata: {
          ...computed.metadata,
          publicDomainOccupationRequired: true,
          publicDomainLocations: locations,
        }
      }
    };
  }
}

