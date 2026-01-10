import { QuoteContext, QuoteModule } from '../types/quote-types';
import {
  INSURANCE_CONFIG,
  calculateInsurancePremium,
  formatInsuranceRate,
} from '../../config/insurance.config';

/**
 * InsurancePremiumModule - Calcule la prime d'assurance "Valeur Déclarée" (Ad Valorem)
 *
 * TYPE : B (conditionnel - UNIQUEMENT si le client a coché l'option)
 * PRIORITÉ : 71 (PHASE 7 - Assurance & Risque)
 *
 * RESPONSABILITÉS :
 * - Calcule la prime d'assurance basée sur la valeur déclarée
 *
 * TARIFICATION (conforme aux pratiques du marché français) :
 * - Taux : 1% de la valeur déclarée (Assurance Tout Risque)
 * - Prime minimale : 50€
 * - Prime maximale : 5000€
 * - Formule simple : Prime = Valeur × Taux (pas de facteurs distance/volume)
 *
 * TRANSPARENCE CLIENT :
 * Cette prime est une OPTION EXPLICITE que le client doit cocher.
 * Elle n'est PAS ajoutée automatiquement au devis.
 * Elle couvre les biens à hauteur de leur valeur déclarée en cas de dommage.
 * La RC Pro du déménageur (gratuite, incluse) ne couvre que ~20€/kg.
 *
 * SOURCES DE VÉRITÉ :
 * - Configuration centralisée : src/quotation-module/config/insurance.config.ts
 * - Même calcul utilisé par le frontend (PaymentPriceSection)
 */
export class InsurancePremiumModule implements QuoteModule {
  readonly id = 'insurance-premium';
  readonly description = "Calcule la prime d'assurance Ad Valorem (option client)";
  readonly priority = 71;
  readonly dependencies = []; // Plus de dépendance distance/volume

  /**
   * Le module s'applique UNIQUEMENT si :
   * 1. Le client a explicitement coché l'option "Assurance Valeur Déclarée"
   * 2. ET une valeur déclarée > 0 est fournie
   */
  isApplicable(ctx: QuoteContext): boolean {
    const insuranceEnabled = ctx.declaredValueInsurance === true;
    const hasValidValue = !!ctx.declaredValue && ctx.declaredValue > 0;
    return insuranceEnabled && hasValidValue;
  }

  apply(ctx: QuoteContext): QuoteContext {
    const declaredValue = ctx.declaredValue || 0;
    const rate = INSURANCE_CONFIG.RATE;
    const minPremium = INSURANCE_CONFIG.MIN_PREMIUM;
    const maxPremium = INSURANCE_CONFIG.MAX_PREMIUM;
    const rateDisplay = formatInsuranceRate();

    // Calcul détaillé pour les logs et métadonnées
    const rawPremium = declaredValue * rate;
    const minApplied = rawPremium < minPremium;
    const maxApplied = rawPremium > maxPremium;
    const insurancePremium = calculateInsurancePremium(declaredValue);

    // Logs détaillés du calcul
    console.log(`   💰 CALCUL PRIME D'ASSURANCE:`);
    console.log(`      Valeur déclarée: ${declaredValue.toFixed(2)}€`);
    console.log(`      Taux: ${rateDisplay} (${(rate * 100).toFixed(2)}%)`);
    console.log(`      Prime brute: ${declaredValue.toFixed(2)}€ × ${(rate * 100).toFixed(2)}% = ${rawPremium.toFixed(2)}€`);
    console.log(`      Plafonds: min ${minPremium}€, max ${maxPremium}€`);
    if (minApplied) {
      console.log(`      ⚠️ Prime minimale appliquée: ${rawPremium.toFixed(2)}€ → ${minPremium}€`);
    } else if (maxApplied) {
      console.log(`      ⚠️ Prime maximale appliquée: ${rawPremium.toFixed(2)}€ → ${maxPremium}€`);
    }
    console.log(`      = Prime finale: ${insurancePremium.toFixed(2)}€`);

    return {
      ...ctx,
      computed: {
        ...ctx.computed,
        costs: [
          ...(ctx.computed?.costs || []),
          {
            moduleId: this.id,
            label: `Assurance Valeur Déclarée (${rateDisplay})`,
            amount: insurancePremium,
            category: 'INSURANCE',
            metadata: {
              declaredValue: parseFloat(declaredValue.toFixed(2)),
              rate: parseFloat(rate.toFixed(4)),
              rawPremium: parseFloat(rawPremium.toFixed(2)),
              minPremium,
              maxPremium,
              minApplied,
              maxApplied,
            },
          },
        ],
        adjustments: ctx.computed?.adjustments || [],
        riskContributions: ctx.computed?.riskContributions || [],
        legalImpacts: ctx.computed?.legalImpacts || [],
        insuranceNotes: [
          ...(ctx.computed?.insuranceNotes || []),
          `Assurance Valeur Déclarée : ${insurancePremium.toFixed(2)} € (${rateDisplay} de ${declaredValue} €) - Couvre vos biens à hauteur de leur valeur déclarée`,
        ],
        requirements: ctx.computed?.requirements || [],
        crossSellProposals: ctx.computed?.crossSellProposals || [],
        operationalFlags: ctx.computed?.operationalFlags || [],
        activatedModules: [
          ...(ctx.computed?.activatedModules || []),
          this.id,
        ],
        metadata: {
          ...(ctx.computed?.metadata || {}),
          insurancePremium: parseFloat(insurancePremium.toFixed(2)),
          insuranceRate: parseFloat(rate.toFixed(4)),
        },
      },
    };
  }
}
