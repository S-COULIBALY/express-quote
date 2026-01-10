import { QuoteContext, QuoteModule } from '../types/quote-types';
import { MODULES_CONFIG } from '../../config/modules.config';

/**
 * VolumeEstimationModule - Estime le volume à déménager depuis les données du formulaire
 *
 * TYPE : A (systématique)
 * PRIORITÉ : 20 (PHASE 2 - Volume & Charge)
 *
 * RESPONSABILITÉS :
 * - Calcule le volume de base depuis les données utilisateur (surface, housingType, rooms, estimatedVolume)
 * - Applique un ajustement selon la confiance (volumeConfidence)
 * - Ajoute le volume des objets spéciaux (piano, meubles encombrants)
 *
 * MÉTHODES PROFESSIONNELLES :
 * - Priorité 1 : Volume estimé fourni par l'utilisateur (estimatedVolume)
 *   → Si fourni : objets spéciaux supposés inclus, marge réduite (+5% au lieu de +10%)
 * - Priorité 2 : Calcul depuis la surface habitable (surface × coefficient selon type de logement)
 *   → Objets spéciaux ajoutés, marge normale
 * - Priorité 3 : Estimation depuis le type de logement (housingType)
 *   → Objets spéciaux ajoutés, marge normale
 * - Priorité 4 : Estimation depuis le nombre de pièces (rooms)
 *   → Objets spéciaux ajoutés, marge normale
 *
 * COEFFICIENTS PROFESSIONNELS :
 * - Studio : 0.5 m³/m² (mobilier dense)
 * - Appartement (F2-F4) : 0.45 m³/m² (mobilier standard)
 * - Maison : 0.4 m³/m² (mobilier moins dense, plus d'espace)
 */
export class VolumeEstimationModule implements QuoteModule {
  readonly id = 'volume-estimation';
  readonly description = "Estime le volume à déménager depuis les données du formulaire";
  readonly priority = 20;

  apply(ctx: QuoteContext): QuoteContext {
    // 1. Calculer le volume fourni par l'utilisateur (si présent)
    const userProvidedVolume = ctx.estimatedVolume && ctx.estimatedVolume > 0 
      ? ctx.estimatedVolume 
      : null;
    
    // 2. Calculer le volume théorique depuis les données (surface, housingType, rooms)
    const theoreticalVolume = this.calculateTheoreticalVolume(ctx);
    
    // 3. Comparer et choisir le volume optimal
    const volumeComparison = this.compareVolumes(userProvidedVolume, theoreticalVolume, ctx);
    const selectedBaseVolume = volumeComparison.selectedVolume;
    const hasUserProvidedVolume = !!userProvidedVolume;
    
    // 4. Ajouter le volume des objets spéciaux
    // IMPORTANT : Si estimatedVolume est fourni ET utilisé, on suppose que les objets spéciaux sont déjà inclus
    const specialItemsResult = (hasUserProvidedVolume && volumeComparison.useUserVolume) 
      ? { volume: 0, items: [] }  // Volume fourni utilisé = objets spéciaux supposés inclus
      : this.calculateSpecialItemsVolume(ctx);
    const specialItemsVolume = specialItemsResult.volume;
    const totalBaseVolume = selectedBaseVolume + specialItemsVolume;
    
    // 5. Appliquer l'ajustement de confiance
    // IMPORTANT : Si estimatedVolume est fourni ET utilisé, marge réduite (supposé déjà avec marge)
    const useReducedMargin = hasUserProvidedVolume && volumeComparison.useUserVolume;
    const adjustedVolume = this.applyConfidenceAdjustment(totalBaseVolume, ctx, useReducedMargin);

    const volumeConfig = MODULES_CONFIG.volume;
    const validationThresholds = volumeConfig.VOLUME_VALIDATION_THRESHOLDS;
    const safetyMargins = volumeConfig.SAFETY_MARGINS;
    const confidence = ctx.volumeConfidence || 'MEDIUM';
    const volumeMethod = ctx.volumeMethod || 'FORM';
    
    // Déterminer le facteur de confiance utilisé
    let confidenceFactors: Record<string, number>;
    if (volumeMethod === 'VIDEO') {
      confidenceFactors = volumeConfig.CONFIDENCE_MARGINS.VIDEO;
    } else if (volumeMethod === 'LIST') {
      confidenceFactors = volumeConfig.CONFIDENCE_MARGINS.LIST;
    } else {
      confidenceFactors = (hasUserProvidedVolume && volumeComparison.useUserVolume)
        ? volumeConfig.CONFIDENCE_MARGINS.FORM.USER_PROVIDED
        : volumeConfig.CONFIDENCE_MARGINS.FORM.CALCULATED;
    }
    const confidenceFactor = confidenceFactors[confidence] || 1.10;
    const confidenceAdjustment = (confidenceFactor - 1) * 100;

    // Logs détaillés du calcul
    console.log(`   🔧 CALCUL DU VOLUME:`);
    
    // Volume fourni utilisateur
    if (userProvidedVolume) {
      console.log(`      Volume fourni utilisateur: ${userProvidedVolume} m³`);
    }
    
    // Calcul volume théorique
    if (theoreticalVolume) {
      console.log(`      Calcul volume théorique:`);
      if (ctx.surface && ctx.surface > 0) {
        const housingType = ctx.housingType || 'F3';
        const coefficient = volumeConfig.VOLUME_COEFFICIENTS[housingType] || 0.45;
        console.log(`         Méthode: Surface × coefficient`);
        console.log(`         Surface: ${ctx.surface} m²`);
        console.log(`         Type logement: ${housingType}`);
        console.log(`         Coefficient: ${coefficient} m³/m²`);
        console.log(`         Calcul: ${ctx.surface} m² × ${coefficient} m³/m² = ${theoreticalVolume} m³`);
        console.log(`         Volume théorique: ${theoreticalVolume} m³`);
      } else if (ctx.housingType) {
        console.log(`         Méthode: Type de logement`);
        console.log(`         Type: ${ctx.housingType}`);
        console.log(`         Volume théorique: ${theoreticalVolume} m³`);
      } else {
        console.log(`         Méthode: Nombre de pièces`);
        console.log(`         Pièces: ${ctx.rooms || 2}`);
        console.log(`         Volume théorique: ${theoreticalVolume} m³`);
      }
    }
    
    // Comparaison volumes
    if (userProvidedVolume && theoreticalVolume && volumeComparison.volumeDiffPercentage > 0) {
      console.log(`      Comparaison volumes:`);
      console.log(`         Volume fourni: ${userProvidedVolume} m³`);
      console.log(`         Volume théorique: ${theoreticalVolume} m³`);
      console.log(`         Écart: ${volumeComparison.volumeDiffPercentage.toFixed(1)}% (${userProvidedVolume < theoreticalVolume ? 'sous-estimation' : 'sur-estimation'})`);
      console.log(`         Seuil critique: >${validationThresholds.CRITICAL_UNDERESTIMATE}% → ${volumeComparison.volumeDiffPercentage > validationThresholds.CRITICAL_UNDERESTIMATE ? 'Oui' : 'Non'}`);
      console.log(`         Seuil moyen: >${validationThresholds.MEDIUM_UNDERESTIMATE}% → ${volumeComparison.volumeDiffPercentage > validationThresholds.MEDIUM_UNDERESTIMATE ? 'Oui' : 'Non'}`);
      if (volumeComparison.safetyMarginApplied) {
        console.log(`         Marge de sécurité appliquée: +${(volumeComparison.safetyMarginApplied * 100).toFixed(0)}%`);
        console.log(`         Calcul: MAX(${userProvidedVolume}, ${theoreticalVolume}) × (1 + ${(volumeComparison.safetyMarginApplied * 100).toFixed(0)}%) = ${selectedBaseVolume} m³`);
      }
      console.log(`         Décision: ${volumeComparison.useUserVolume ? 'Utiliser volume fourni' : 'Utiliser volume corrigé avec marge'}`);
    }
    
    console.log(`      Volume de base sélectionné: ${selectedBaseVolume} m³`);
    
    // Objets spéciaux
    if (specialItemsVolume > 0) {
      console.log(`      Objets spéciaux:`);
      specialItemsResult.items.forEach(item => console.log(`         ${item}`));
      console.log(`         Total objets spéciaux: +${specialItemsVolume} m³`);
    } else if (hasUserProvidedVolume && volumeComparison.useUserVolume) {
      console.log(`      Objets spéciaux: Supposés inclus dans le volume fourni`);
    }
    
    console.log(`      Volume total de base: ${totalBaseVolume} m³`);
    
    // Ajustement confiance
    console.log(`      Ajustement confiance:`);
    console.log(`         Méthode: ${volumeMethod}${hasUserProvidedVolume && volumeComparison.useUserVolume ? ' (USER_PROVIDED)' : ' (CALCULATED)'}`);
    console.log(`         Confiance: ${confidence}`);
    console.log(`         Facteur: ${confidenceFactor.toFixed(3)} (${confidenceAdjustment > 0 ? '+' : ''}${confidenceAdjustment.toFixed(1)}%)`);
    console.log(`         Calcul: ${totalBaseVolume} m³ × ${confidenceFactor.toFixed(3)} = ${adjustedVolume} m³`);
    console.log(`      = Volume ajusté final: ${adjustedVolume} m³`);

    // Construire les requirements et warnings si nécessaire
    const requirements = [...(ctx.computed?.requirements || [])];
    if (volumeComparison.requirement) {
      requirements.push({
        type: volumeComparison.requirement.type,
        severity: volumeComparison.requirement.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        reason: volumeComparison.requirement.reason,
        moduleId: this.id,
        metadata: {
          userVolume: userProvidedVolume,
          theoreticalVolume,
          volumeDiffPercentage: volumeComparison.volumeDiffPercentage,
          safetyMarginApplied: volumeComparison.safetyMarginApplied,
        },
      });
    }

    // Flag de revue manuelle si nécessaire
    const manualReviewRequired = volumeComparison.manualReviewRequired || ctx.computed?.manualReviewRequired || false;

    // Ajouter un avertissement dans les métadonnées si nécessaire
    const metadata: Record<string, any> = {
      ...(ctx.computed?.metadata || {}),
      volumeConfidenceScore: this.calculateConfidenceScore(ctx),
      volumeMethod: ctx.volumeMethod || 'FORM',
      volumeCalculationMethod: this.getCalculationMethod(ctx, volumeComparison.useUserVolume),
      volumeBaseSource: this.getVolumeSource(ctx, volumeComparison.useUserVolume),
      userProvidedVolume: userProvidedVolume || null,
      theoreticalVolume: theoreticalVolume || null,
      volumeDiffPercentage: volumeComparison.volumeDiffPercentage,
      volumeValidationApplied: !volumeComparison.useUserVolume && !!userProvidedVolume,
      safetyMarginApplied: volumeComparison.safetyMarginApplied || null,
      validationThresholds: {
        criticalUnderestimate: validationThresholds.CRITICAL_UNDERESTIMATE,
        mediumUnderestimate: validationThresholds.MEDIUM_UNDERESTIMATE,
        overestimate: validationThresholds.OVERESTIMATE,
      },
      safetyMargins: {
        critical: safetyMargins.CRITICAL,
        medium: safetyMargins.MEDIUM,
      },
      confidenceAdjustment: {
        method: volumeMethod,
        confidence,
        factor: confidenceFactor,
        adjustmentPercentage: confidenceAdjustment,
      },
    };

    if (volumeComparison.warning) {
      metadata.volumeValidationWarning = volumeComparison.warning;
    }

    return {
      ...ctx,
      computed: {
        ...ctx.computed,
        // Utiliser la structure standard de ComputedContext
        baseVolume: totalBaseVolume,
        adjustedVolume,
        // Métadonnées dans metadata
        metadata,
        // Préserver les autres champs
        costs: ctx.computed?.costs || [],
        adjustments: ctx.computed?.adjustments || [],
        riskContributions: ctx.computed?.riskContributions || [],
        legalImpacts: ctx.computed?.legalImpacts || [],
        insuranceNotes: ctx.computed?.insuranceNotes || [],
        requirements,
        crossSellProposals: ctx.computed?.crossSellProposals || [],
        operationalFlags: ctx.computed?.operationalFlags || [],
        manualReviewRequired: manualReviewRequired,
        activatedModules: [
          ...(ctx.computed?.activatedModules || []),
          this.id // String uniquement
        ],
      }
    };
  }

  /**
   * Calcule le volume théorique depuis les données (sans utiliser estimatedVolume)
   * 
   * PRIORITÉ :
   * 1. Calcul depuis la surface habitable (surface × coefficient selon type)
   * 2. Estimation depuis le type de logement (housingType)
   * 3. Estimation depuis le nombre de pièces (rooms)
   */
  private calculateTheoreticalVolume(ctx: QuoteContext): number | null {
    const volumeConfig = MODULES_CONFIG.volume;
    
    // PRIORITÉ 1 : Calcul depuis la surface habitable (méthode la plus précise)
    if (ctx.surface && ctx.surface > 0) {
      const housingType = ctx.housingType || 'F3';
      const coefficient = volumeConfig.VOLUME_COEFFICIENTS[housingType] || 0.45;
      const calculatedVolume = ctx.surface * coefficient;
      
      // Validation : volume raisonnable (min 5 m³, max 200 m³)
      if (calculatedVolume >= volumeConfig.MIN_VOLUME_M3 && calculatedVolume <= volumeConfig.MAX_VOLUME_M3) {
        return Math.round(calculatedVolume * 10) / 10; // Arrondir à 1 décimale
      }
    }

    // PRIORITÉ 2 : Estimation depuis le type de logement
    if (ctx.housingType) {
      const baseVolume = volumeConfig.BASE_VOLUMES_BY_TYPE[ctx.housingType];
      if (baseVolume) {
        return baseVolume;
      }
    }

    // PRIORITÉ 3 : Estimation depuis le nombre de pièces (fallback)
    const rooms = ctx.rooms || 2;
    // Vérifier que rooms est une clé valide (1-6), sinon utiliser 2 comme fallback
    const validRooms = (rooms >= 1 && rooms <= 6) ? rooms as 1 | 2 | 3 | 4 | 5 | 6 : 2;
    const baseRoomVolume = volumeConfig.BASE_VOLUMES_BY_ROOMS[validRooms];

    return baseRoomVolume;
  }

  /**
   * Compare le volume fourni par l'utilisateur avec le volume théorique calculé
   * 
   * STRATÉGIE DE PROTECTION :
   * - Si sous-estimation >30% : MAX + marge de sécurité 25% (protection contre volume réel > théorique)
   * - Si sous-estimation 15-30% : MAX + marge de sécurité 15%
   * - Si sur-estimation >30% : Utiliser le volume fourni (client sait mieux)
   * - Si écart < 15% : Utiliser le volume fourni (confiance dans l'utilisateur)
   * 
   * RATIONNEL :
   * - Le volume théorique peut aussi être sous-estimé (logement très meublé)
   * - Si le client sous-estime ET le théorique est bas, le volume réel peut être encore plus élevé
   * - Marge de sécurité supplémentaire pour protéger contre les surprises le jour J
   */
  private compareVolumes(
    userVolume: number | null,
    theoreticalVolume: number | null,
    ctx: QuoteContext
  ): {
    selectedVolume: number;
    useUserVolume: boolean;
    volumeDiffPercentage: number;
    safetyMarginApplied?: number;
    warning?: string;
    requirement?: { type: string; severity: string; reason: string };
    manualReviewRequired?: boolean;
  } {
    const volumeConfig = MODULES_CONFIG.volume;
    const validationThresholds = volumeConfig.VOLUME_VALIDATION_THRESHOLDS;
    const safetyMargins = volumeConfig.SAFETY_MARGINS;

    // Si pas de volume fourni, utiliser le théorique
    if (!userVolume) {
      // Utiliser le volume théorique ou un fallback basé sur le type de logement
      const fallbackVolume = theoreticalVolume || volumeConfig.BASE_VOLUMES_BY_TYPE.F3 || 20;
      return {
        selectedVolume: fallbackVolume,
        useUserVolume: false,
        volumeDiffPercentage: 0,
      };
    }

    // Si pas de volume théorique, utiliser le volume fourni
    if (!theoreticalVolume) {
      return {
        selectedVolume: userVolume,
        useUserVolume: true,
        volumeDiffPercentage: 0,
      };
    }

    // Calculer l'écart en pourcentage
    const diffPercentage = Math.abs((userVolume - theoreticalVolume) / theoreticalVolume * 100);
    const isUserUnderestimate = userVolume < theoreticalVolume;
    const isUserOverestimate = userVolume > theoreticalVolume;
    const maxVolume = Math.max(userVolume, theoreticalVolume);

    // SOUS-ESTIMATION CRITIQUE (>CRITICAL_UNDERESTIMATE) : MAX + marge de sécurité importante
    // Protection contre le cas où le volume réel > volume théorique
    if (isUserUnderestimate && diffPercentage > validationThresholds.CRITICAL_UNDERESTIMATE) {
      // Marge de sécurité : +25% sur le MAX pour protéger contre volume réel > théorique
      const safetyMargin = safetyMargins.CRITICAL;
      const selectedVolume = Math.round(maxVolume * (1 + safetyMargin) * 10) / 10;

      return {
        selectedVolume,
        useUserVolume: false, // Volume corrigé avec marge
        volumeDiffPercentage: diffPercentage,
        safetyMarginApplied: safetyMargin,
        warning: `Volume fourni (${userVolume} m³) sous-estimé de ${diffPercentage.toFixed(1)}% par rapport à l'estimation théorique (${theoreticalVolume} m³). Volume corrigé à ${selectedVolume} m³ (MAX + marge de sécurité ${(safetyMargin * 100).toFixed(0)}%) pour protéger contre les risques sur le terrain.`,
        requirement: {
          type: 'VOLUME_VALIDATION_REQUIRED',
          severity: 'HIGH',
          reason: `Sous-estimation critique détectée (${diffPercentage.toFixed(1)}%). Le volume réel peut être supérieur au volume théorique. Revérification manuelle OBLIGATOIRE avant validation du devis.`,
        },
        manualReviewRequired: true, // Revue manuelle obligatoire
      };
    }

    // SOUS-ESTIMATION MOYENNE (MEDIUM_UNDERESTIMATE - CRITICAL_UNDERESTIMATE) : MAX + marge de sécurité réduite
    if (isUserUnderestimate && diffPercentage > validationThresholds.MEDIUM_UNDERESTIMATE) {
      // Marge de sécurité : +15% sur le MAX
      const safetyMargin = safetyMargins.MEDIUM;
      const selectedVolume = Math.round(maxVolume * (1 + safetyMargin) * 10) / 10;

      return {
        selectedVolume,
        useUserVolume: false, // Volume corrigé avec marge
        volumeDiffPercentage: diffPercentage,
        safetyMarginApplied: safetyMargin,
        warning: `Volume fourni (${userVolume} m³) inférieur de ${diffPercentage.toFixed(1)}% à l'estimation théorique (${theoreticalVolume} m³). Volume ajusté à ${selectedVolume} m³ (MAX + marge de sécurité ${(safetyMargin * 100).toFixed(0)}%).`,
      };
    }

    // SUR-ESTIMATION (>OVERESTIMATE) : Utiliser le volume fourni (client sait mieux)
    // Pas de marge de sécurité car le client a surestimé
    if (isUserOverestimate && diffPercentage > validationThresholds.OVERESTIMATE) {
      return {
        selectedVolume: userVolume, // Utiliser le volume fourni (plus élevé)
        useUserVolume: true,
        volumeDiffPercentage: diffPercentage,
        warning: `Volume fourni (${userVolume} m³) sur-estimé de ${diffPercentage.toFixed(1)}% par rapport à l'estimation théorique (${theoreticalVolume} m³). Volume fourni utilisé (${userVolume} m³).`,
        requirement: {
          type: 'VOLUME_OPTIMIZATION_OPPORTUNITY',
          severity: 'MEDIUM',
          reason: `Sur-estimation importante détectée. Le volume peut être ajusté pour optimiser le prix si nécessaire.`,
        },
      };
    }

    // ÉCART MOYEN (MEDIUM_UNDERESTIMATE - OVERESTIMATE) SUR-ESTIMATION : Utiliser le volume fourni
    if (isUserOverestimate && diffPercentage > validationThresholds.MEDIUM_UNDERESTIMATE) {
      return {
        selectedVolume: userVolume,
        useUserVolume: true,
        volumeDiffPercentage: diffPercentage,
        warning: `Volume fourni (${userVolume} m³) supérieur de ${diffPercentage.toFixed(1)}% à l'estimation théorique (${theoreticalVolume} m³). Volume fourni utilisé.`,
      };
    }

    // ÉCART FAIBLE (<MEDIUM_UNDERESTIMATE) : Utiliser le volume fourni (confiance dans l'utilisateur)
    return {
      selectedVolume: userVolume,
      useUserVolume: true,
      volumeDiffPercentage: diffPercentage,
    };
  }

  /**
   * Calcule le volume additionnel des objets spéciaux
   * 
   * Volumes réalistes basés sur l'expérience professionnelle :
   */
  private calculateSpecialItemsVolume(ctx: QuoteContext): { volume: number; items: string[] } {
    const specialItemsConfig = MODULES_CONFIG.volume.SPECIAL_ITEMS_VOLUME;
    let volume = 0;
    const items: string[] = [];

    // Piano droit : ~6-8 m³ (encombrement réel avec protection)
    // Piano à queue : ~10-15 m³
    if (ctx.piano) {
      volume += specialItemsConfig.PIANO;
      items.push(`Piano: +${specialItemsConfig.PIANO} m³`);
    }

    // Meubles encombrants : bibliothèques, armoires massives, canapés 3 places
    // ~4-6 m³ selon le nombre et la taille
    if (ctx.bulkyFurniture) {
      volume += specialItemsConfig.BULKY_FURNITURE;
      items.push(`Meubles encombrants: +${specialItemsConfig.BULKY_FURNITURE} m³`);
    }

    // Coffre-fort : ~2-4 m³ selon la taille (petit coffre ~1 m³, grand coffre ~4 m³)
    if (ctx.safe) {
      volume += specialItemsConfig.SAFE;
      items.push(`Coffre-fort: +${specialItemsConfig.SAFE} m³`);
    }

    // Œuvres d'art : tableaux, sculptures
    // ~1-3 m³ selon la quantité (emballage spécialisé volumineux)
    if (ctx.artwork) {
      volume += specialItemsConfig.ARTWORK;
      items.push(`Œuvres d'art: +${specialItemsConfig.ARTWORK} m³`);
    }

    // Électroménager encastré : lave-vaisselle, four, hotte, etc.
    // ~2-4 m³ (démontage + emballage)
    if (ctx.builtInAppliances) {
      volume += specialItemsConfig.BUILT_IN_APPLIANCES;
      items.push(`Électroménager encastré: +${specialItemsConfig.BUILT_IN_APPLIANCES} m³`);
    }

    return { volume, items };
  }

  /**
   * Applique un ajustement selon la confiance de l'estimation et la méthode utilisée
   * 
   * Ajustements professionnels selon volumeMethod :
   * - VIDEO : Analyse IA = très fiable → marge minimale
   *   - LOW : +5%, MEDIUM : +2%, HIGH : 0%
   * - LIST : Liste analysée = fiable → marge réduite
   *   - LOW : +10%, MEDIUM : +5%, HIGH : +2%
   * - FORM : Estimation standard → marge normale
   *   - LOW : +20%, MEDIUM : +10%, HIGH : +5%
   * 
   * Si volume fourni par l'utilisateur (estimatedVolume) :
   * - Marge encore plus réduite (supposé déjà avec marge)
   */
  private applyConfidenceAdjustment(
    baseVolume: number, 
    ctx: QuoteContext, 
    hasUserProvidedVolume: boolean = false
  ): number {
    const confidence = ctx.volumeConfidence || 'MEDIUM';
    const volumeMethod = ctx.volumeMethod || 'FORM';
    const volumeConfig = MODULES_CONFIG.volume;
    
    // Facteurs d'ajustement selon la méthode d'estimation
    let confidenceFactors: Record<string, number>;
    
    if (volumeMethod === 'VIDEO') {
      // Vidéo analysée par IA = très fiable, marge minimale
      confidenceFactors = volumeConfig.CONFIDENCE_MARGINS.VIDEO;
    } else if (volumeMethod === 'LIST') {
      // Liste analysée = fiable, marge réduite
      confidenceFactors = volumeConfig.CONFIDENCE_MARGINS.LIST;
    } else {
      // FORM = estimation standard depuis formulaire
      if (hasUserProvidedVolume) {
        // Volume fourni manuellement = marge réduite
        confidenceFactors = volumeConfig.CONFIDENCE_MARGINS.FORM.USER_PROVIDED;
      } else {
        // Volume calculé = marge normale
        confidenceFactors = volumeConfig.CONFIDENCE_MARGINS.FORM.CALCULATED;
      }
    }

    const factor = confidenceFactors[confidence] || 1.10;
    const adjusted = baseVolume * factor;
    
    return Math.round(adjusted * 10) / 10; // Arrondir à 1 décimale
  }

  /**
   * Calcule un score de confiance (0-1) pour traçabilité
   */
  private calculateConfidenceScore(ctx: QuoteContext): number {
    let score = 0.4; // Base plus basse

    // Si volume estimé fourni directement : +0.4 (très fiable)
    if (ctx.estimatedVolume && ctx.estimatedVolume > 0) {
      score += 0.4;
    }
    // Si surface fournie : +0.3 (méthode professionnelle précise)
    else if (ctx.surface && ctx.surface > 0) {
      score += 0.3;
    }
    // Si type de logement fourni : +0.2
    else if (ctx.housingType) {
      score += 0.2;
    }
    // Sinon (nombre de pièces uniquement) : +0.1
    else {
      score += 0.1;
    }

    // Si confiance explicite : ajuster
    if (ctx.volumeConfidence === 'HIGH') {
      score = Math.max(score, 0.9);
    } else if (ctx.volumeConfidence === 'MEDIUM') {
      score = Math.max(score, 0.7);
    } else if (ctx.volumeConfidence === 'LOW') {
      score = Math.max(score, 0.5);
    }

    // Si objets spéciaux signalés : +0.1 (meilleure précision)
    if (ctx.piano || ctx.bulkyFurniture || ctx.safe) {
      score += 0.1;
    }

    return Math.min(score, 1.0); // Plafonner à 1.0
  }

  /**
   * Détermine la méthode de calcul utilisée (pour traçabilité)
   */
  private getCalculationMethod(ctx: QuoteContext, useUserVolume: boolean): string {
    if (useUserVolume && ctx.estimatedVolume && ctx.estimatedVolume > 0) {
      return 'USER_ESTIMATE';
    }
    if (ctx.surface && ctx.surface > 0) {
      return 'SURFACE_BASED';
    }
    if (ctx.housingType) {
      return 'HOUSING_TYPE_BASED';
    }
    return 'ROOMS_BASED';
  }

  /**
   * Détermine la source du volume (pour traçabilité)
   */
  private getVolumeSource(ctx: QuoteContext, useUserVolume: boolean): string {
    if (useUserVolume && ctx.estimatedVolume && ctx.estimatedVolume > 0) {
      return 'estimatedVolume';
    }
    if (ctx.surface && ctx.surface > 0) {
      return `surface (${ctx.surface} m²)`;
    }
    if (ctx.housingType) {
      return `housingType (${ctx.housingType})`;
    }
    return `rooms (${ctx.rooms || 2})`;
  }
}