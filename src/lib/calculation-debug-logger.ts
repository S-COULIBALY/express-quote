/**
 * Logger spécialisé pour le debug des calculs de prix et règles métier
 * Capture tous les détails pour faciliter le debugging
 */

interface CalculationStep {
  step: string;
  timestamp: number;
  input: any;
  output: any;
  duration?: number;
  details?: any;
}

interface RuleApplicationDetail {
  ruleName: string;
  isApplicable: boolean;
  priceBeforeRule: number;
  priceAfterRule: number;
  impact: number;
  ruleType: 'percentage' | 'fixed' | 'minimum';
  ruleValue: number;
  condition: string;
  contextData: any;
  errorMessage?: string;
}

interface PriceComponentDetail {
  component: string;
  value: number;
  calculation: string;
  configUsed: any;
  formula: string;
}

class CalculationDebugLogger {
  private sessionId: string;
  private steps: CalculationStep[] = [];
  private priceComponents: PriceComponentDetail[] = [];
  private rulesDetails: RuleApplicationDetail[] = [];
  private startTime: number = 0;
  private basePrice: number = 0; // Stocker le prix de base pour les calculs de pourcentage

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
  }

  // 🔧 NOUVELLE MÉTHODE: Réinitialisation manuelle
  reset() {
    this.priceComponents = [];
    this.rulesDetails = [];
    this.basePrice = 0;
    this.startTime = Date.now();
    console.log('🔄 [CALC-DEBUG] Logger réinitialisé');
  }

  private generateSessionId(): string {
    return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // LOGGING DU CALCUL DE PRIX DE BASE
  // ============================================================================

  startPriceCalculation(serviceType: string, context: any) {
    // 🔧 CORRECTION: Réinitialiser les données pour éviter l'accumulation
    this.priceComponents = [];
    this.rulesDetails = [];
    this.basePrice = 0;
    this.startTime = Date.now();
    
    const step: CalculationStep = {
      step: 'PRICE_CALCULATION_START',
      timestamp: Date.now(),
      input: {
        serviceType,
        contextData: this.sanitizeContext(context)
      },
      output: null
    };

    this.steps.push(step);
    
    console.log('\n🔥 [CALC-DEBUG] ═══════════════════════════════════════');
    console.log(`🎯 DÉBUT CALCUL PRIX | ${serviceType} | Session: ${this.sessionId.slice(-8)}`);
    console.log('📊 Contexte:', JSON.stringify(step.input.contextData, null, 2));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.log('═══════════════════════════════════════════════════════\n');
  }

  logPriceComponent(component: string, value: number, calculation: string, configUsed: any, formula: string) {
    const detail: PriceComponentDetail = {
      component,
      value: Math.round(value * 100) / 100, // Arrondi à 2 décimales
      calculation,
      configUsed,
      formula
    };

    this.priceComponents.push(detail);

    console.log(`💰 [CALC-DEBUG] COMPOSANT: ${component}`);
    console.log(`   📐 Formule: ${formula}`);
    console.log(`   🧮 Calcul: ${calculation}`);
    console.log(`   💵 Valeur: ${detail.value}€`);
    console.log(`   ⚙️ Config: ${JSON.stringify(configUsed)}`);
    console.log('');
  }

  logBasePriceCalculation(serviceType: string, components: any, totalBasePrice: number) {
    const step: CalculationStep = {
      step: 'BASE_PRICE_CALCULATED',
      timestamp: Date.now(),
      input: { serviceType, components },
      output: { totalBasePrice },
      details: {
        breakdown: this.priceComponents,
        totalComponents: Object.keys(components).length
      }
    };

    this.steps.push(step);

    console.log('🏗️ [CALC-DEBUG] ═══ PRIX DE BASE CALCULÉ ═══');
    console.log(`🎯 Service: ${serviceType}`);
    console.log(`💰 Prix de base total: ${totalBasePrice}€`);
    console.log('\n📊 DÉTAIL DES COMPOSANTS:');
    
    this.priceComponents.forEach((comp, index) => {
      console.log(`   ${index + 1}. ${comp.component}: ${comp.value}€`);
      console.log(`      └─ ${comp.formula} = ${comp.calculation}`);
    });

    const sum = this.priceComponents.reduce((acc, comp) => acc + comp.value, 0);
    console.log(`\n🧮 VÉRIFICATION: Somme composants = ${Math.round(sum)}€`);
    console.log(`🎯 Prix de base final = ${totalBasePrice}€`);
    
    if (Math.abs(sum - totalBasePrice) > 1) {
      console.log(`⚠️ ÉCART DÉTECTÉ: ${Math.abs(sum - totalBasePrice)}€`);
    }
    console.log('═══════════════════════════════════════════════\n');
  }

  // ============================================================================
  // LOGGING DES RÈGLES MÉTIER
  // ============================================================================

  startRulesEngine(rules: any[], basePrice: number, context: any) {
    // Stocker le prix de base pour les calculs de pourcentage
    this.basePrice = basePrice;
    
    const step: CalculationStep = {
      step: 'RULES_ENGINE_START',
      timestamp: Date.now(),
      input: {
        rulesCount: rules.length,
        basePrice,
        contextKeys: Object.keys(context)
      },
      output: null
    };

    this.steps.push(step);

    console.log('⚙️ [CALC-DEBUG] ═══ MOTEUR DE RÈGLES ═══');
    console.log(`💰 Prix de base: ${basePrice}€`);
    console.log(`📋 Nombre de règles à vérifier: ${rules.length}`);
    console.log(`🔍 Contexte disponible: ${Object.keys(context).join(', ')}`);
    
    console.log('\n📋 LISTE DES RÈGLES:');
    rules.forEach((rule, index) => {
      const isPercentage = rule.isPercentage?.();
      // ✅ CORRECTION: rule.value est déjà en pourcentage (15, 40, 50), ne pas multiplier par 100
      const displayValue = isPercentage ? rule.value.toFixed(1) : rule.value;
      console.log(`   ${index + 1}. "${rule.name}" (${displayValue}${isPercentage ? '%' : '€'})`);
    });
    console.log('═══════════════════════════════════════════\n');
  }

  logRuleEvaluation(rule: any, context: any, isApplicable: boolean, error?: any) {
    // 🔧 CORRECTION: Ajouter les règles non applicables au tracking
    if (!isApplicable && !error) {
      const detail: RuleApplicationDetail = {
        ruleName: rule.name,
        isApplicable: false,
        priceBeforeRule: 0,
        priceAfterRule: 0,
        impact: 0,
        ruleType: rule.isPercentage?.() ? 'percentage' : 'fixed',
        ruleValue: rule.value,
        condition: rule.condition || 'Fonction personnalisée',
        contextData: this.extractRelevantContext(rule, context),
        errorMessage: 'Conditions non remplies'
      };

      this.rulesDetails.push(detail);
    }
    
    // Format Option D unifié pour l'évaluation des règles
    const conditionLocation = this.findConditionLocation(rule.condition, context);
    const isPercentage = rule.isPercentage?.();

    // ✅ CORRECTION: rule.value est déjà en pourcentage (15, 40, 50), ne pas multiplier par 100
    const displayValue = isPercentage ? rule.value.toFixed(1) : rule.value;
    
    if (error) {
      console.log(`🔍 RÈGLE "${rule.name}" → ❌ ERREUR`);
      console.log(`   📝 Condition: ${rule.condition || 'Fonction personnalisée'} ${conditionLocation}`);
      console.log(`   ⚙️ Paramètres: Type=${isPercentage ? 'Pourcentage' : 'Montant fixe'}, Valeur=${displayValue}${isPercentage ? '%' : '€'}`);
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log(`   📋 Stack: ${error.stack?.split('\n').slice(0, 2).join(' → ')}`);
    } else if (isApplicable) {
      const conditionDisplay = typeof rule.condition === 'object'
        ? JSON.stringify(rule.condition)
        : (rule.condition || 'Fonction personnalisée');

      console.log(`🔍 RÈGLE "${rule.name}" → ✅ ÉVALUÉE APPLICABLE`);
      console.log(`   📝 Condition vérifiée: ${conditionDisplay} ${conditionLocation}`);
      console.log(`   ⚙️ Paramètres: Type=${isPercentage ? 'Pourcentage' : 'Montant fixe'}, Valeur=${displayValue}${isPercentage ? '%' : '€'}`);
      console.log(`   ✅ Statut: Conditions remplies → Application en cours...`);
    } else {
      const conditionDisplay = typeof rule.condition === 'object'
        ? JSON.stringify(rule.condition)
        : (rule.condition || 'Fonction personnalisée');

      console.log(`🔍 RÈGLE "${rule.name}" → ❌ NON APPLICABLE`);
      console.log(`   📝 Condition: ${conditionDisplay} ${conditionLocation}`);
      console.log(`   ⚙️ Paramètres: Type=${isPercentage ? 'Pourcentage' : 'Montant fixe'}, Valeur=${displayValue}${isPercentage ? '%' : '€'}`);
      console.log(`   ❌ Statut: Conditions non remplies → Règle ignorée`);
    }
    console.log('');
  }

  logRuleApplication(rule: any, priceBeforeRule: number, ruleResult: any, contextData: any) {
    const detail: RuleApplicationDetail = {
      ruleName: rule.name,
      isApplicable: true,
      priceBeforeRule,
      priceAfterRule: ruleResult.newPrice?.getAmount() || priceBeforeRule,
      impact: ruleResult.impact || 0,
      ruleType: rule.isPercentage?.() ? 'percentage' : 'fixed',
      ruleValue: rule.value,
      condition: rule.condition || 'Fonction personnalisée',
      contextData: this.extractRelevantContext(rule, contextData)
    };

    this.rulesDetails.push(detail);

    // Option D : Format avec données contexte (5 lignes)
    const conditionLocation = this.findConditionLocation(rule.condition, contextData);
    const isPercentage = detail.ruleType === 'percentage';
    const sign = detail.impact > 0 ? '+' : '';
    // 🔧 CORRECTION: Utiliser le prix de base initial pour le calcul du pourcentage d'impact
    const percentageReal = ((detail.impact / this.basePrice) * 100).toFixed(2);

    // ✅ CORRECTION: rule.value est déjà en pourcentage (15, 40, 50), ne pas multiplier par 100
    const displayValue = isPercentage ? rule.value.toFixed(1) : rule.value;

    // ✅ CORRECTION: Ne PAS recalculer le pourcentage depuis l'impact arrondi
    // Utiliser directement rule.value car l'arrondi Math.round() dans Rule.apply()
    // peut transformer 8.5% (8.5€) en 9€, donnant un faux pourcentage de 9%
    const effectivePercentage = isPercentage ? rule.value.toFixed(1) : null;
    
    const conditionDisplay = typeof rule.condition === 'object'
      ? JSON.stringify(rule.condition)
      : rule.condition;

    console.log(`🔍 RÈGLE "${rule.name}" → ✅ APPLICABLE`);
    console.log(`   📝 Condition vérifiée: ${conditionDisplay} ${conditionLocation}`);
    console.log(`   ⚙️ Paramètres: Type=${isPercentage ? 'Pourcentage' : 'Montant fixe'}, Valeur=${displayValue}${isPercentage ? '%' : '€'}`);
    
    if (isPercentage) {
      // 🔧 CORRECTION: Afficher le calcul avec le prix de base pour les pourcentages
      // ✅ Formater les montants avec 2 décimales maximum pour l'affichage propre
      const impactDisplay = this.formatAmount(detail.impact);
      const priceBeforeDisplay = this.formatAmount(priceBeforeRule);
      const priceAfterDisplay = this.formatAmount(detail.priceAfterRule);
      const basePriceDisplay = this.formatAmount(this.basePrice);
      console.log(`   🧮 Application: ${priceBeforeDisplay}€ + (${basePriceDisplay}€ × ${effectivePercentage}%) = ${priceBeforeDisplay}€ + ${impactDisplay}€ = ${priceAfterDisplay}€`);
    } else {
      // Pour les montants fixes, afficher le montant effectif (avec multiplicateur)
      const effectiveAmount = Math.abs(detail.impact);
      const ruleValue = Math.abs(rule.value);
      
      // Calculer le nombre d'adresses concernées
      const multiplier = Math.round(effectiveAmount / ruleValue);
      
      if (multiplier > 1) {
        // Afficher le détail par adresse quand il y a un multiplicateur
        console.log(`   🧮 Application: ${priceBeforeRule}€ ${sign}${effectiveAmount}€ (${ruleValue}€ × ${multiplier} adresses) = ${detail.priceAfterRule}€`);
      } else {
        // Affichage simple quand pas de multiplicateur
        console.log(`   🧮 Application: ${priceBeforeRule}€ ${sign}${effectiveAmount}€ = ${detail.priceAfterRule}€`);
      }
    }
    
    const impactFinalDisplay = this.formatAmount(Math.abs(detail.impact));
    const priceFinalDisplay = this.formatAmount(detail.priceAfterRule);
    console.log(`   📊 Impact final: ${sign}${impactFinalDisplay}€ soit ${sign}${percentageReal}% | Prix final: ${priceFinalDisplay}€`);
    console.log('');
  }

  logRuleSkipped(rule: any, reason: string) {
    // 🔧 CORRECTION: Ajouter les règles ignorées au tracking pour le résumé final
    const detail: RuleApplicationDetail = {
      ruleName: rule.name,
      isApplicable: false,
      priceBeforeRule: 0,
      priceAfterRule: 0,
      impact: 0,
      ruleType: rule.isPercentage?.() ? 'percentage' : 'fixed',
      ruleValue: rule.value,
      condition: rule.condition || 'Fonction personnalisée',
      contextData: {},
      errorMessage: reason
    };

    this.rulesDetails.push(detail);
    
    // Déterminer le type d'ignorance et adapter l'affichage
    let icon = '⏭️';
    let status = 'IGNORÉE';
    let reasonIcon = '📝';
    
    if (reason.includes('consommée par le monte-meuble')) {
      icon = '🚫';
      status = 'CONSOMMÉE PAR MONTE-MEUBLE';
      reasonIcon = '🏗️';
    } else if (reason.includes('prix minimum')) {
      icon = '🛡️';
      status = 'PRIX MINIMUM DÉFINI';
      reasonIcon = '💰';
    } else if (reason.includes('sans impact')) {
      icon = '⚡';
      status = 'SANS IMPACT';
      reasonIcon = '📊';
    }
    
    console.log(`${icon} RÈGLE "${rule.name}" → ❌ ${status}`);
    console.log(`   ${reasonIcon} Raison: ${reason}`);
    
    // Ajouter des détails spécifiques selon le type
    if (reason.includes('consommée par le monte-meuble')) {
      console.log(`   🎯 Contrainte déjà facturée dans le monte-meuble`);
      console.log(`   💡 Évite la double facturation`);
    } else if (reason.includes('prix minimum')) {
      const priceMatch = reason.match(/(\d+(?:\.\d+)?)€/);
      if (priceMatch) {
        console.log(`   🎯 Prix minimum imposé: ${priceMatch[1]}€`);
        console.log(`   💡 Remplace le calcul par règles`);
      }
    } else if (reason.includes('sans impact')) {
      console.log(`   🎯 Règle applicable mais impact nul`);
      console.log(`   💡 Aucun effet sur le prix final`);
    }
    
    console.log('');
  }

  logMinimumPriceCheck(currentPrice: number, minimumPrice: number, finalPrice: number) {
    console.log('🔍 [CALC-DEBUG] ═══ VÉRIFICATION PRIX MINIMUM ═══');
    console.log(`💰 Prix actuel: ${currentPrice}€`);
    console.log(`🛡️ Prix minimum: ${minimumPrice}€`);
    console.log(`💰 Prix final: ${finalPrice}€`);
    
    if (finalPrice > currentPrice) {
      console.log(`⬆️ AJUSTEMENT: Prix relevé au minimum (+${finalPrice - currentPrice}€)`);
    } else {
      console.log(`✅ VALIDATION: Prix actuel respecte le minimum`);
    }
    console.log('═══════════════════════════════════════════════\n');
  }

  // ============================================================================
  // LOGGING DU RÉSULTAT FINAL
  // ============================================================================

  logFinalCalculation(quote: any, totalDuration: number, priceDetails?: any) {
    const step: CalculationStep = {
      step: 'CALCULATION_COMPLETED',
      timestamp: Date.now(),
      input: null,
      output: {
        basePrice: quote.getBasePrice?.()?.getAmount() || quote.basePrice,
        finalPrice: quote.getTotalPrice?.()?.getAmount() || quote.finalPrice,
        discounts: quote.getDiscounts?.() || quote.discounts || [],
        serviceType: quote.getServiceType?.() || quote.serviceType
      },
      duration: totalDuration,
      details: {
        priceComponents: this.priceComponents,
        rulesApplied: this.rulesDetails.filter(r => r.impact !== 0),
        totalSteps: this.steps.length,
        ...(priceDetails && { priceBreakdown: priceDetails })
      }
    };

    this.steps.push(step);

    console.log('🎉 [CALC-DEBUG] ═══ CALCUL TERMINÉ ═══');
    console.log(`⏱️ Durée totale: ${totalDuration}ms`);
    console.log(`💰 Prix de base: ${step.output.basePrice}€`);
    console.log(`💰 Prix final: ${step.output.finalPrice}€`);
    console.log(`📈 Différence: ${step.output.finalPrice - step.output.basePrice > 0 ? '+' : ''}${step.output.finalPrice - step.output.basePrice}€`);

    console.log('\n📊 RÉSUMÉ DES COMPOSANTS DE PRIX:');
    this.priceComponents.forEach((comp, index) => {
      const percentage = (comp.value / step.output.basePrice) * 100;
      console.log(`   ${index + 1}. ${comp.component}: ${comp.value}€ (${percentage.toFixed(1)}%)`);
    });

    // 🔧 CORRECTION: Affichage détaillé de toutes les règles
    const appliedRules = this.rulesDetails.filter(r => r.isApplicable && r.impact !== 0);
    const skippedRules = this.rulesDetails.filter(r => !r.isApplicable);
    const zeroImpactRules = this.rulesDetails.filter(r => r.isApplicable && r.impact === 0);
    
    if (appliedRules.length > 0) {
      console.log('\n📋 RÈGLES APPLIQUÉES:');
      appliedRules.forEach((rule, index) => {
        const sign = rule.impact > 0 ? '+' : '';
        const percentage = rule.ruleType === 'percentage' ? ` (${(rule.ruleValue * 100).toFixed(1)}%)` : '';
        console.log(`   ${index + 1}. ${rule.ruleName}: ${sign}${rule.impact}€${percentage}`);
      });
    }

    if (zeroImpactRules.length > 0) {
      console.log('\n⚡ RÈGLES SANS IMPACT:');
      zeroImpactRules.forEach((rule, index) => {
        console.log(`   ${index + 1}. ${rule.ruleName}: 0€ (applicable mais sans effet)`);
      });
    }

    if (skippedRules.length > 0) {
      console.log(`\n⏭️ RÈGLES NON APPLICABLES: ${skippedRules.length}`);
      // Afficher le détail des règles ignorées
      const ignoredByCondition = skippedRules.filter(r => r.errorMessage === 'Conditions non remplies');
      const ignoredByOther = skippedRules.filter(r => r.errorMessage !== 'Conditions non remplies');
      
      if (ignoredByCondition.length > 0) {
        console.log(`   📝 Conditions non remplies: ${ignoredByCondition.length}`);
      }
      if (ignoredByOther.length > 0) {
        console.log(`   🚫 Autres raisons: ${ignoredByOther.length}`);
      }
    }

    console.log('\n🔍 SESSION SUMMARY:');
    console.log(`   📋 Session ID: ${this.sessionId}`);
    console.log(`   🔢 Étapes totales: ${this.steps.length}`);
    console.log(`   💰 Composants prix: ${this.priceComponents.length}`);
    console.log(`   📋 Règles vérifiées: ${this.rulesDetails.length}`);
    console.log(`   ⚡ Règles appliquées: ${appliedRules.length}`);
    console.log('═══════════════════════════════════════════════\n');
  }

  // ============================================================================
  // LOGGING DES ERREURS
  // ============================================================================

  logCalculationError(error: any, step: string, context?: any) {
    const errorStep: CalculationStep = {
      step: 'CALCULATION_ERROR',
      timestamp: Date.now(),
      input: { step, context: context ? this.sanitizeContext(context) : null },
      output: null,
      details: {
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      }
    };

    this.steps.push(errorStep);

    console.log('💥 [CALC-DEBUG] ═══ ERREUR DE CALCUL ═══');
    console.log(`🎯 Étape: ${step}`);
    console.log(`❌ Type: ${error.constructor.name}`);
    console.log(`📝 Message: ${error.message}`);
    console.log(`📋 Stack:`, error.stack?.split('\n').slice(0, 5));
    
    if (context) {
      console.log(`📊 Contexte:`, JSON.stringify(this.sanitizeContext(context), null, 2));
    }
    console.log('═══════════════════════════════════════════════\n');
  }

  // ============================================================================
  // MÉTHODES UTILITAIRES
  // ============================================================================

  private sanitizeContext(context: any): any {
    if (!context) return {};
    
    const sanitized = { ...context };
    
    // Masquer les données sensibles
    if (sanitized.email) {
      sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, '$1***$2');
    }
    if (sanitized.phone) {
      sanitized.phone = sanitized.phone.replace(/(.{2}).*(.{2})/, '$1***$2');
    }
    
    // Garder seulement les données pertinentes pour le calcul
    const relevantKeys = [
      'volume', 'distance', 'workers', 'duration', 'defaultPrice',
      'baseWorkers', 'baseDuration', 'pickupNeedsLift', 'deliveryNeedsLift',
      'isReturningCustomer', 'scheduledDate', 'serviceType',
      'pickupLogisticsConstraints', 'deliveryLogisticsConstraints'
    ];
    
    const filtered: any = {};
    relevantKeys.forEach(key => {
      if (sanitized[key] !== undefined) {
        filtered[key] = sanitized[key];
      }
    });
    
    return filtered;
  }

  private extractRelevantContext(rule: any, context: any): any {
    const relevant: any = {};

    // Analyser la condition de la règle pour extraire les variables utilisées
    const condition = rule.condition || '';

    // Convertir condition en string si c'est un objet
    const conditionStr = typeof condition === 'string' ? condition : JSON.stringify(condition);

    // Variables communes dans les conditions
    const commonVars = [
      'volume', 'distance', 'workers', 'duration', 'isReturningCustomer',
      'scheduledDate', 'day', 'hour', 'pickupFloor', 'deliveryFloor',
      'pickupElevator', 'deliveryElevator', 'hasElevator'
    ];

    commonVars.forEach(key => {
      if (conditionStr.includes(key) && context[key] !== undefined) {
        relevant[key] = context[key];
      }
    });

    // Ajouter les contraintes logistiques si mentionnées
    if (conditionStr.includes('Constraint') || conditionStr.includes('logistics')) {
      if (context.pickupLogisticsConstraints) {
        relevant.pickupLogisticsConstraints = context.pickupLogisticsConstraints;
      }
      if (context.deliveryLogisticsConstraints) {
        relevant.deliveryLogisticsConstraints = context.deliveryLogisticsConstraints;
      }
    }

    return relevant;
  }

  private findConditionLocation(condition: any, contextData: any): string {
    // Analyser où la condition a été trouvée
    if (!condition) return '';

    // Si c'est un objet, convertir en string pour analyse
    const conditionStr = typeof condition === 'string' ? condition : JSON.stringify(condition);

    // ✅ CORRECTION: Traitement spécial pour long_carrying_distance
    if (conditionStr.includes('long_carrying_distance')) {
      const pickupDistance = contextData.pickupCarryDistance;
      const deliveryDistance = contextData.deliveryCarryDistance;
      
      // Afficher les distances de portage en mètres, pas en km
      const details = [];
      if (pickupDistance) details.push(`départ: ${pickupDistance}`);
      if (deliveryDistance) details.push(`arrivée: ${deliveryDistance}`);
      
      return details.length > 0 ? `(${details.join(', ')})` : '';
    }
    
    // Vérifier les contraintes logistiques
    const constraintVars = [
      'narrow_corridors', 'difficult_stairs', 'furniture_lift_required', 
      'fragile_floor', 'additional_insurance', 'heavy_items', 'bulky_furniture',
      'long_carrying_distance' // Ajouté pour la cohérence
    ];
    
    for (const constraint of constraintVars) {
      if (conditionStr.includes(constraint)) {
        if (contextData.pickupLogisticsConstraints?.includes(constraint)) {
          return '∈ pickupLogisticsConstraints';
        }
        if (contextData.deliveryLogisticsConstraints?.includes(constraint)) {
          return '∈ deliveryLogisticsConstraints';
        }
      }
    }

    // Vérifier les variables simples
    if (conditionStr.includes('pickupFloor') || conditionStr.includes('deliveryFloor')) {
      return `(pickup: ${contextData.pickupFloor}, delivery: ${contextData.deliveryFloor})`;
    }

    if (conditionStr.includes('volume')) {
      return `(${contextData.volume}m³)`;
    }

    // ✅ CORRECTION: Distance principale (déménagement) vs distance de portage
    if (conditionStr.includes('distance') && !conditionStr.includes('carrying')) {
      return `(${contextData.distance}km)`;
    }
    
    return '';
  }

  // ============================================================================
  // EXPORT ET SAUVEGARDE
  // ============================================================================

  exportSession(): string {
    const sessionData = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime: Date.now(),
      totalDuration: Date.now() - this.startTime,
      steps: this.steps,
      priceComponents: this.priceComponents,
      rulesDetails: this.rulesDetails,
      summary: {
        stepsCount: this.steps.length,
        componentsCount: this.priceComponents.length,
        rulesChecked: this.rulesDetails.length,
        rulesApplied: this.rulesDetails.filter(r => r.impact !== 0).length,
        hasErrors: this.steps.some(s => s.step === 'CALCULATION_ERROR')
      }
    };

    return JSON.stringify(sessionData, null, 2);
  }

  getSessionSummary(): any {
    const appliedRules = this.rulesDetails.filter(r => r.impact !== 0);
    const totalPriceComponents = this.priceComponents.reduce((sum, comp) => sum + comp.value, 0);
    
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      steps: this.steps.length,
      priceComponents: {
        count: this.priceComponents.length,
        total: Math.round(totalPriceComponents)
      },
      rules: {
        checked: this.rulesDetails.length,
        applied: appliedRules.length,
        totalImpact: appliedRules.reduce((sum, rule) => sum + rule.impact, 0)
      },
      hasErrors: this.steps.some(s => s.step === 'CALCULATION_ERROR')
    };
  }

  /**
   * Formate un montant pour l'affichage en supprimant les décimales inutiles
   * @param amount Montant à formater
   * @returns Montant formaté (entier si pas de décimales significatives, sinon 2 décimales max)
   */
  private formatAmount(amount: number): string {
    // Arrondir à 2 décimales pour éviter les erreurs de précision floating point
    const rounded = Math.round(amount * 100) / 100;

    // Si c'est un entier, afficher sans décimales
    if (rounded === Math.floor(rounded)) {
      return rounded.toString();
    }

    // Sinon afficher avec 1 ou 2 décimales selon le besoin
    return rounded.toFixed(2).replace(/\.?0+$/, '');
  }

  // Méthode pour sauvegarder en fichier (optionnel)
  saveToFile(filename?: string): void {
    if (typeof window === 'undefined') {
      // Node.js environment
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const fs = require('fs');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const path = require('path');
      
      const fileName = filename || `calc-debug-${this.sessionId}.json`;
      const filePath = path.join(process.cwd(), 'logs', fileName);
      
      try {
        // Créer le dossier logs s'il n'existe pas
        const logsDir = path.dirname(filePath);
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, this.exportSession());
        console.log(`💾 [CALC-DEBUG] Session sauvegardée: ${filePath}`);
      } catch (error) {
        console.error(`❌ [CALC-DEBUG] Erreur sauvegarde:`, error);
      }
    }
  }
}

// Instance singleton pour usage global
export const calculationDebugLogger = new CalculationDebugLogger();

// Export des types pour TypeScript
export type { CalculationStep, RuleApplicationDetail, PriceComponentDetail }; 