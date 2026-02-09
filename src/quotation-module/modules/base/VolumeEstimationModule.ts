import { QuoteContext, QuoteModule } from '../types/quote-types';
import { MODULES_CONFIG } from '../../config/modules.config';
import { createEmptyComputedContext } from '../../core/ComputedContext';

/**
 * VolumeEstimationModule - Utilise le volume calculé par le calculateur V3
 *
 * TYPE : A (systématique)
 * PRIORITÉ : 20 (PHASE 2 - Volume & Charge)
 *
 * RESPONSABILITÉS :
 * - Utilise directement estimatedVolume calculé par le calculateur V3 côté client
 * - Applique un ajustement minimal selon la confiance (volumeConfidence)
 * - Le volume est déjà calculé avec tous les détails (pièces, objets spéciaux, etc.)
 *
 * MÉTHODE :
 * - Le volume est calculé côté client via VolumeCalculatorForm → estimateVolumeAction (V3)
 * - Ce module ne fait que valider et appliquer une marge de confiance minimale
 * - Si estimatedVolume n'est pas fourni, utilise un fallback minimal (cas d'erreur)
 */
export class VolumeEstimationModule implements QuoteModule {
  readonly id = 'volume-estimation';
  readonly description = "Utilise le volume calculé par le calculateur V3";
  readonly priority = 20;

  apply(ctx: QuoteContext): QuoteContext {
    const volumeConfig = MODULES_CONFIG.volume;
    const confidence = ctx.volumeConfidence || 'MEDIUM';

    // 1. Récupérer le volume calculé par le calculateur V3
    const userProvidedVolume = ctx.estimatedVolume && ctx.estimatedVolume > 0 
      ? ctx.estimatedVolume 
      : null;

    // 2. Si pas de volume fourni, utiliser un fallback minimal (cas d'erreur)
    // Normalement, le formulaire requiert le volume, donc ce cas ne devrait pas arriver
    if (!userProvidedVolume) {
      const fallbackVolume = volumeConfig.BASE_VOLUMES_BY_TYPE.F3 || 20;
      console.warn(`   ⚠️ VolumeEstimationModule: Pas de volume fourni, utilisation du fallback: ${fallbackVolume} m³`);
      
      const emptyComputed = createEmptyComputedContext();
      return {
        ...ctx,
        computed: {
          ...emptyComputed,
          ...ctx.computed,
          baseVolume: fallbackVolume,
          adjustedVolume: fallbackVolume,
          metadata: {
            ...emptyComputed.metadata,
            ...(ctx.computed?.metadata || {}),
            volumeConfidenceScore: 0.3,
            volumeMethod: 'FORM',
            volumeCalculationMethod: 'FALLBACK',
            volumeBaseSource: 'fallback',
            userProvidedVolume: null,
            theoreticalVolume: null,
            volumeDiffPercentage: 0,
            volumeValidationApplied: false,
            safetyMarginApplied: null,
            confidenceAdjustment: {
              method: 'FORM',
              confidence: 'LOW',
              factor: 1.0,
              adjustmentPercentage: 0,
            },
          },
          activatedModules: [
            ...(ctx.computed?.activatedModules || []),
            this.id
          ],
        }
      };
    }

    // 3. Appliquer un ajustement de confiance minimal (FORM uniquement)
    // Le volume V3 est déjà très précis, donc marge réduite
    const confidenceFactors = volumeConfig.CONFIDENCE_MARGINS.FORM.USER_PROVIDED;
    const confidenceFactor = confidenceFactors[confidence] || 1.05; // Par défaut +5%
    const adjustedVolume = Math.round(userProvidedVolume * confidenceFactor * 10) / 10;
    const confidenceAdjustment = (confidenceFactor - 1) * 100;

    // 4. Validation : volume dans les limites raisonnables
    const minVolume = volumeConfig.MIN_VOLUME_M3;
    const maxVolume = volumeConfig.MAX_VOLUME_M3;
    const finalVolume = Math.max(minVolume, Math.min(maxVolume, adjustedVolume));

    // Logs du calcul
    console.log(`   🔧 CALCUL DU VOLUME (V3):`);
    console.log(`      Volume calculé par V3: ${userProvidedVolume} m³`);
    console.log(`      Méthode: FORM`);
    console.log(`      Confiance: ${confidence}`);
    console.log(`      Facteur d'ajustement: ${confidenceFactor.toFixed(3)} (${confidenceAdjustment > 0 ? '+' : ''}${confidenceAdjustment.toFixed(1)}%)`);
    console.log(`      Volume ajusté: ${adjustedVolume} m³`);
    if (finalVolume !== adjustedVolume) {
      console.log(`      ⚠️ Volume ajusté aux limites: ${finalVolume} m³ (min: ${minVolume}, max: ${maxVolume})`);
    }
    console.log(`      = Volume final: ${finalVolume} m³`);

    // 5. Construire les métadonnées
    const metadata: Record<string, any> = {
      ...(ctx.computed?.metadata || {}),
      volumeConfidenceScore: this.calculateConfidenceScore(ctx),
      volumeMethod: 'FORM',
      volumeCalculationMethod: 'V3_CALCULATOR',
      volumeBaseSource: 'estimatedVolume (V3)',
      userProvidedVolume: userProvidedVolume,
      theoreticalVolume: null, // Plus de calcul théorique
      volumeDiffPercentage: 0, // Plus de comparaison
      volumeValidationApplied: false, // Plus de validation croisée
      safetyMarginApplied: null, // Plus de marge de sécurité supplémentaire
      confidenceAdjustment: {
        method: 'FORM',
        confidence,
        factor: confidenceFactor,
        adjustmentPercentage: confidenceAdjustment,
      },
    };

    const emptyComputed = createEmptyComputedContext();
    return {
      ...ctx,
      computed: {
        ...emptyComputed,
        ...ctx.computed,
        baseVolume: userProvidedVolume,
        adjustedVolume: finalVolume,
        metadata: {
          ...emptyComputed.metadata,
          ...metadata,
        },
        activatedModules: [
          ...(ctx.computed?.activatedModules || []),
          this.id
        ],
      }
    };
  }

  /**
   * Calcule un score de confiance (0-1) pour traçabilité
   * Le volume V3 est très fiable car calculé avec tous les détails
   */
  private calculateConfidenceScore(ctx: QuoteContext): number {
    let score = 0.7; // Base élevée car V3 est fiable

    // Si volume estimé fourni directement : +0.2 (très fiable)
    if (ctx.estimatedVolume && ctx.estimatedVolume > 0) {
      score += 0.2;
    }

    // Si confiance explicite : ajuster
    if (ctx.volumeConfidence === 'HIGH') {
      score = Math.max(score, 0.9);
    } else if (ctx.volumeConfidence === 'MEDIUM') {
      score = Math.max(score, 0.8);
    } else if (ctx.volumeConfidence === 'LOW') {
      score = Math.max(score, 0.7);
    }

    return Math.min(score, 1.0); // Plafonner à 1.0
  }
}
