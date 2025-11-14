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
    
    // Log minimal - seulement les métriques clés
    console.log('\n🔥 [CALC-DEBUG] ' + serviceType + ' | Dist=' + (step.input.contextData.distance || 0) + 'km, Workers=' + (step.input.contextData.workers || 0) + ', Durée=' + (step.input.contextData.duration || 0) + 'h\n\n');
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
    // Logs détaillés supprimés - affichés dans le résumé "PRIX DE BASE CALCULÉ"
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
    console.log(`💰 Prix de base total: ${this.formatAmount(totalBasePrice)}€`);
    console.log('\n📊 DÉTAIL DES COMPOSANTS:');

    this.priceComponents.forEach((comp, index) => {
      console.log(`   ${index + 1}. ${comp.component}: ${this.formatAmount(comp.value)}€`);
      console.log(`      └─ ${comp.formula} = ${comp.calculation}`);
    });

    const sum = this.priceComponents.reduce((acc, comp) => acc + comp.value, 0);
    console.log(`\n🧮 VÉRIFICATION: Somme composants = ${Math.round(sum)}€`);
    console.log(`🎯 Prix de base final = ${this.formatAmount(totalBasePrice)}€`);
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

    console.log('\n⚙️ [CALC-DEBUG] ═══ MOTEUR DE RÈGLES ═══');
    console.log(`📋 Règles à vérifier: ${rules.length}`);
    console.log(`💰 Prix de base: ${basePrice.toFixed(2)}€`);

    // LOG DÉTAILLÉ des contraintes par adresse
    // Utiliser les enrichedConstraints qui contiennent les noms lisibles
    console.log('\n🏠 CONTRAINTES PAR ADRESSE:');
    const pickupConstraints = context.enrichedPickupConstraints || context.pickupLogisticsConstraints || [];
    const deliveryConstraints = context.enrichedDeliveryConstraints || context.deliveryLogisticsConstraints || [];

    if (pickupConstraints.length > 0) {
      console.log(`   📍 DÉPART (${pickupConstraints.length} contraintes):`);
      pickupConstraints.forEach((c: string) => console.log(`      • ${c}`));
    } else {
      console.log(`   📍 DÉPART: Aucune contrainte`);
    }

    if (deliveryConstraints.length > 0) {
      console.log(`\n   📦 ARRIVÉE (${deliveryConstraints.length} contraintes):`);
      deliveryConstraints.forEach((c: string) => console.log(`      • ${c}`));
    } else {
      console.log(`\n   📦 ARRIVÉE: Aucune contrainte`);
    }

    console.log('═══════════════════════════════════════════════\n');
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
      // Ne pas logger les règles non applicables (affichées dans le résumé final)
      return;
    }

    // Afficher uniquement les règles applicables ou en erreur
    const conditionLocation = this.findConditionLocation(rule.condition, context);
    const isPercentage = rule.isPercentage?.();
    const displayValue = isPercentage ? rule.value.toFixed(1) : rule.value;

    if (error) {
      console.log(`🔍 RÈGLE "${rule.name}" → ❌ ERREUR`);
      console.log(`   📝 Condition: ${rule.condition || 'Fonction personnalisée'} ${conditionLocation}`);
      console.log(`   ⚙️ Paramètres: Type=${isPercentage ? 'Pourcentage' : 'Montant fixe'}, Valeur=${displayValue}${isPercentage ? '%' : '€'}`);
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log(`   📋 Stack: ${error.stack?.split('\n').slice(0, 2).join(' → ')}`);
      console.log('');
    } else if (isApplicable) {
      const conditionDisplay = typeof rule.condition === 'object'
        ? JSON.stringify(rule.condition)
        : (rule.condition || 'Fonction personnalisée');

      console.log(`🔍 RÈGLE "${rule.name}" → ✅ APPLICABLE`);
      console.log(`   📝 Condition: ${conditionDisplay} ${conditionLocation}`);
      console.log(`   ⚙️ Paramètres: Type=${isPercentage ? 'Pourcentage' : 'Montant fixe'}, Valeur=${displayValue}${isPercentage ? '%' : '€'}`);
      // Pas de log "Statut: Conditions remplies" car redondant avec "APPLICABLE"
    }
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

      // Détecter si la règle s'applique aux 2 adresses (impact doublé)
      const expectedSingleImpact = (this.basePrice * rule.value) / 100;
      const multiplier = Math.round(detail.impact / expectedSingleImpact);

      if (multiplier > 1) {
        const singleImpact = this.formatAmount(expectedSingleImpact);
        console.log(`   🧮 Application: ${priceBeforeDisplay}€ + (${basePriceDisplay}€ × ${effectivePercentage}% × ${multiplier} adresses) = ${priceBeforeDisplay}€ + ${impactDisplay}€ = ${priceAfterDisplay}€`);
      } else {
        console.log(`   🧮 Application: ${priceBeforeDisplay}€ + (${basePriceDisplay}€ × ${effectivePercentage}%) = ${priceBeforeDisplay}€ + ${impactDisplay}€ = ${priceAfterDisplay}€`);
      }
    } else {
      // Pour les montants fixes, afficher le montant effectif (avec multiplicateur)
      const effectiveAmount = Math.abs(detail.impact);
      const ruleValue = Math.abs(rule.value);

      // Calculer le nombre d'adresses concernées
      const multiplier = Math.round(effectiveAmount / ruleValue);

      const priceBeforeDisplay = this.formatAmount(priceBeforeRule);
      const effectiveAmountDisplay = this.formatAmount(effectiveAmount);
      const ruleValueDisplay = this.formatAmount(ruleValue);
      const priceAfterDisplay = this.formatAmount(detail.priceAfterRule);

      if (multiplier > 1) {
        // Afficher le détail par adresse quand il y a un multiplicateur
        console.log(`   🧮 Application: ${priceBeforeDisplay}€ ${sign}${effectiveAmountDisplay}€ (${ruleValueDisplay}€ × ${multiplier} adresses) = ${priceAfterDisplay}€`);
      } else {
        // Affichage simple quand pas de multiplicateur
        console.log(`   🧮 Application: ${priceBeforeDisplay}€ ${sign}${effectiveAmountDisplay}€ = ${priceAfterDisplay}€`);
      }
    }
    
    const impactFinalDisplay = this.formatAmount(Math.abs(detail.impact));
    const priceFinalDisplay = this.formatAmount(detail.priceAfterRule);
    console.log(`   📊 Impact final: ${sign}${impactFinalDisplay}€ soit ${sign}${percentageReal}% | Prix final: ${priceFinalDisplay}€`);
    console.log('');
  }

  finishRulesEngine(result: any, rulesAppliedCount?: number) {
    const duration = Date.now() - this.startTime;

    // Gérer différents formats de result
    let priceValue: number;
    let appliedCount: number;

    if (typeof result === 'object') {
      // Si result est un objet avec finalPrice (Money)
      if (result.finalPrice && result.finalPrice.getAmount) {
        priceValue = result.finalPrice.getAmount();
      } else if (result.getAmount) {
        // Si result est directement un objet Money
        priceValue = result.getAmount();
      } else if (typeof result.finalPrice === 'number') {
        priceValue = result.finalPrice;
      } else {
        priceValue = 0;
      }

      // Compter les règles appliquées
      appliedCount = rulesAppliedCount !== undefined
        ? rulesAppliedCount
        : (result.appliedRules?.length || this.rulesDetails.filter(r => r.isApplicable && r.impact !== 0).length);
    } else {
      // Si result est un nombre simple
      priceValue = typeof result === 'number' ? result : 0;
      appliedCount = rulesAppliedCount !== undefined
        ? rulesAppliedCount
        : this.rulesDetails.filter(r => r.isApplicable && r.impact !== 0).length;
    }

    console.log('✅ [CALC-DEBUG] MOTEUR RÈGLES TERMINÉ');
    console.log(`   💰 Prix final: ${this.formatAmount(priceValue)}€`);
    console.log(`   ⚡ Règles appliquées: ${appliedCount}`);
    console.log(`   ⏱️ Durée: ${duration}ms`);
    console.log('');
  }

  logError(error: Error, context: any) {
    this.logCalculationError(error, 'RULES_ENGINE', context);
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
      
      // ✅ AMÉLIORATION: Distinguer contrainte déclarée vs inférée
      if (reason.includes('inférée automatiquement')) {
        icon = '🔍';
        status = 'CONSOMMÉE (INFÉRÉE)';
        reasonIcon = '🤖';
      } else if (reason.includes('déclarée par le client')) {
        icon = '✅';
        status = 'CONSOMMÉE (DÉCLARÉE)';
        reasonIcon = '👤';
      }
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
      if (reason.includes('inférée automatiquement')) {
        console.log(`   🎯 Contrainte inférée automatiquement car monte-meuble requis`);
        console.log(`   💡 Évite la double facturation (principe: "Mieux vaut inférer trop que facturer deux fois")`);
      } else {
      console.log(`   🎯 Contrainte déjà facturée dans le monte-meuble`);
      console.log(`   💡 Évite la double facturation`);
      }
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
    console.log(`💰 Prix actuel: ${this.formatAmount(currentPrice)}€`);
    console.log(`🛡️ Prix minimum: ${this.formatAmount(minimumPrice)}€`);
    console.log(`💰 Prix final: ${this.formatAmount(finalPrice)}€`);

    if (finalPrice > currentPrice) {
      console.log(`⬆️ AJUSTEMENT: Prix relevé au minimum (+${this.formatAmount(finalPrice - currentPrice)}€)`);
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
    console.log(`⏱️ Durée totale: ${totalDuration}ms\n`);

    const appliedRules = this.rulesDetails.filter(r => r.isApplicable && r.impact !== 0);
    const skippedRules = this.rulesDetails.filter(r => !r.isApplicable);
    const difference = step.output.finalPrice - step.output.basePrice;

    // CALCUL DÉTAILLÉ VISIBLE D'UN COUP D'ŒIL
    console.log('💰 CALCUL DU PRIX TOTAL:');
    console.log('─────────────────────────────────────────────────');

    // 1. Composants de base
    console.log('📊 PRIX DE BASE:');
    let runningTotal = 0;
    this.priceComponents.forEach((comp, index) => {
      runningTotal += comp.value;
      console.log(`   ${this.formatAmount(comp.value).padStart(10)}€  ${comp.component}`);
    });
    console.log('   ' + '─'.repeat(48));
    console.log(`   ${this.formatAmount(step.output.basePrice).padStart(10)}€  TOTAL BASE\n`);

    // 2. Règles appliquées
    if (appliedRules.length > 0) {
      console.log(`📋 ${appliedRules.length} RÈGLES APPLIQUÉES (+):`);
      let rulesTotal = 0;
      appliedRules.forEach((rule, index) => {
        rulesTotal += rule.impact;
        const percentage = rule.ruleType === 'percentage' ? ` (${rule.ruleValue.toFixed(1)}%)` : '';
        console.log(`   ${this.formatAmount(rule.impact).padStart(10)}€  ${rule.ruleName}${percentage}`);
      });
      console.log('   ' + '─'.repeat(48));
      console.log(`   ${this.formatAmount(rulesTotal).padStart(10)}€  TOTAL RÈGLES\n`);
    }

    // 3. Total final
    console.log('═════════════════════════════════════════════════');
    console.log(`💰 PRIX FINAL: ${this.formatAmount(step.output.finalPrice)}€`);
    console.log(`📈 Augmentation: +${this.formatAmount(difference)}€ (+${((difference / step.output.basePrice) * 100).toFixed(1)}%)`);
    console.log('═════════════════════════════════════════════════\n');

    if (skippedRules.length > 0) {
      console.log(`\n⏭️ RÈGLES NON APPLICABLES: ${skippedRules.length}`);
      const ignoredByCondition = skippedRules.filter(r => r.errorMessage === 'Conditions non remplies');
      const ignoredByOther = skippedRules.filter(r => r.errorMessage !== 'Conditions non remplies');

      if (ignoredByCondition.length > 0) {
        console.log(`   📝 Conditions non remplies: ${ignoredByCondition.length}`);
        ignoredByCondition.forEach(r => {
          const isPercentage = r.ruleType === 'percentage';
          // ✅ CORRECTION: ruleValue est déjà en pourcentage (7.0 = 7%), ne pas multiplier par 100
          const value = isPercentage ? `${r.ruleValue.toFixed(1)}%` : `${this.formatAmount(r.ruleValue)}€`;
          console.log(`      • ${r.ruleName} (${value})`);
        });
      }
      if (ignoredByOther.length > 0) {
        console.log(`   🚫 Autres raisons: ${ignoredByOther.length}`);
        ignoredByOther.forEach(r => {
          const isPercentage = r.ruleType === 'percentage';
          // ✅ CORRECTION: ruleValue est déjà en pourcentage (7.0 = 7%), ne pas multiplier par 100
          const value = isPercentage ? `${r.ruleValue.toFixed(1)}%` : `${this.formatAmount(r.ruleValue)}€`;
          console.log(`      • ${r.ruleName} (${value})`);
        });
      }
    }
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
    // ✅ TOUJOURS afficher avec 2 décimales pour la cohérence
    return amount.toFixed(2);
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