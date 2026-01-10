/**
 * QuoteOutputService - Service de formatage des sorties du moteur
 *
 * Responsabilités :
 * - Formatage devis JSON standardisé
 * - Génération checklist terrain (requirements)
 * - Génération données contrat (legalImpacts)
 * - Génération audit juridique (traçabilité)
 */

import { QuoteContext } from '../core/QuoteContext';
import { ScenarioRecommendationEngine, RecommendationResult, ScenarioScore } from './ScenarioRecommendationEngine';

/**
 * Format standardisé d'un devis pour le frontend/API
 */
export interface StandardizedQuote {
  // Identification
  quoteId?: string;
  generatedAt: string;
  
  // Informations client
  movingDate: string;
  departureAddress: string;
  arrivalAddress: string;
  distanceKm: number;
  
  // Prix
  pricing: {
    totalCosts: number;
    basePrice: number;
    finalPrice: number;
    marginRate: number;
    breakdown: {
      costsByCategory: Record<string, number>;
      costsByModule: Array<{
        moduleId: string;
        label: string;
        amount: number;
        category: string;
      }>;
      adjustments: Array<{
        moduleId: string;
        label: string;
        amount: number;
        type: string;
        reason: string;
      }>;
    };
  };
  
  // Volume & Véhicules
  logistics: {
    baseVolume: number;
    adjustedVolume: number;
    vehicleCount: number;
    vehicleTypes: string[];
    workersCount: number;
    estimatedDurationHours: number;
  };
  
  // Risque
  risk: {
    riskScore: number;
    manualReviewRequired: boolean;
    riskContributions: Array<{
      moduleId: string;
      amount: number;
      reason: string;
    }>;
  };
  
  // Requirements (checklist terrain)
  requirements: Array<{
    type: string;
    severity: string;
    reason: string;
    moduleId: string;
  }>;
  
  // Impacts juridiques (données contrat)
  legalImpacts: Array<{
    type: string;
    severity: string;
    message: string;
    moduleId: string;
  }>;
  
  // Notes assurance
  insuranceNotes: string[];
  
  // Cross-selling
  crossSellProposals: Array<{
    id: string;
    label: string;
    reason: string;
    benefit: string;
    priceImpact: number;
    optional: boolean;
  }>;
  
  // Traçabilité
  traceability: {
    activatedModules: string[];
    operationalFlags: string[];
  };
}

/**
 * Checklist terrain formatée
 */
export interface TerrainChecklist {
  quoteId?: string;
  title: string;
  generatedAt: string;
  items: Array<{
    id: string;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    required: boolean;
    moduleId: string;
  }>;
}

/**
 * Données contrat formatées
 */
export interface ContractData {
  quoteId?: string;
  generatedAt: string;
  legalImpacts: Array<{
    type: string;
    severity: string;
    message: string;
    moduleId: string;
    timestamp: string;
  }>;
  insurance: {
    declaredValue: number;
    premium: number;
    coverage: number;
    notes: string[];
  };
  operationalConstraints: string[];
}

/**
 * Audit juridique formaté
 */
export interface LegalAudit {
  quoteId?: string;
  generatedAt: string;
  decisions: Array<{
    moduleId: string;
    decision: string;
    reason: string;
    timestamp: string;
    impact: 'COST' | 'RISK' | 'LEGAL' | 'OPERATIONAL';
  }>;
  riskScore: number;
  manualReviewRequired: boolean;
  legalFlags: string[];
}

export class QuoteOutputService {
  /**
   * Formate le devis en format standardisé pour le frontend/API
   */
  static formatQuote(ctx: QuoteContext, quoteId?: string): StandardizedQuote {
    const computed = ctx.computed;
    if (!computed) {
      throw new Error('ComputedContext is required for quote formatting');
    }

    // Utiliser directement les valeurs calculées par QuoteEngine (pas de recalcul)
    const totalCosts = computed.costs.reduce((sum, c) => sum + c.amount, 0);

    // Calculer costsByCategory localement
    const costsByCategory: Record<string, number> = {};
    computed.costs.forEach(cost => {
      costsByCategory[cost.category] = (costsByCategory[cost.category] || 0) + cost.amount;
    });

    return {
      quoteId,
      generatedAt: new Date().toISOString(),
      movingDate: ctx.movingDate || '',
      departureAddress: ctx.departureAddress,
      arrivalAddress: ctx.arrivalAddress,
      distanceKm: computed.distanceKm || 0,
      pricing: {
        totalCosts: parseFloat(totalCosts.toFixed(2)),
        basePrice: computed.basePrice || 0,
        finalPrice: computed.finalPrice || 0,
        marginRate: computed.marginRate || 0.30,
        breakdown: {
          costsByCategory,
          costsByModule: computed.costs.map(cost => ({
            moduleId: cost.moduleId,
            label: cost.label,
            amount: cost.amount,
            category: cost.category,
          })),
          adjustments: computed.adjustments.map(adj => ({
            moduleId: adj.moduleId,
            label: adj.label,
            amount: adj.amount,
            type: adj.type,
            reason: adj.reason,
          })),
        },
      },
      logistics: {
        baseVolume: computed.baseVolume || 0,
        adjustedVolume: computed.adjustedVolume || 0,
        vehicleCount: computed.vehicleCount || 0,
        vehicleTypes: computed.vehicleTypes || [],
        workersCount: computed.workersCount || 0,
        estimatedDurationHours: computed.totalDurationHours || computed.baseDurationHours || 0,
      },
      risk: {
        riskScore: computed.riskScore || 0,
        manualReviewRequired: computed.manualReviewRequired || false,
        riskContributions: computed.riskContributions.map(contrib => ({
          moduleId: contrib.moduleId,
          amount: contrib.amount,
          reason: contrib.reason,
        })),
      },
      requirements: computed.requirements.map(req => ({
        type: req.type,
        severity: req.severity,
        reason: req.reason,
        moduleId: req.moduleId,
      })),
      legalImpacts: computed.legalImpacts.map(impact => ({
        type: impact.type,
        severity: impact.severity,
        message: impact.message,
        moduleId: impact.moduleId,
      })),
      insuranceNotes: computed.insuranceNotes,
      crossSellProposals: computed.crossSellProposals.map(proposal => ({
        id: proposal.id,
        label: proposal.label,
        reason: proposal.reason,
        benefit: proposal.benefit,
        priceImpact: proposal.priceImpact,
        optional: proposal.optional,
      })),
      traceability: {
        activatedModules: computed.activatedModules,
        operationalFlags: computed.operationalFlags,
      },
    };
  }

  /**
   * Génère une checklist terrain formatée
   */
  static generateTerrainChecklist(ctx: QuoteContext, quoteId?: string): TerrainChecklist {
    const computed = ctx.computed;
    if (!computed) {
      throw new Error('ComputedContext is required for checklist generation');
    }

    return {
      quoteId,
      title: 'Checklist Terrain - Déménagement',
      generatedAt: new Date().toISOString(),
      items: computed.requirements.map((req, index) => ({
        id: `req-${index + 1}`,
        type: req.type,
        severity: req.severity,
        description: req.reason,
        required: req.severity === 'HIGH' || req.severity === 'CRITICAL',
        moduleId: req.moduleId,
      })),
    };
  }

  /**
   * Génère les données contrat formatées
   */
  static generateContractData(ctx: QuoteContext, quoteId?: string): ContractData {
    const computed = ctx.computed;
    if (!computed) {
      throw new Error('ComputedContext is required for contract data generation');
    }

    // Calculer la prime d'assurance depuis les coûts
    const insuranceCost = computed.costs.find(c => c.category === 'INSURANCE');
    const insurancePremium = insuranceCost?.amount || 0;

    return {
      quoteId,
      generatedAt: new Date().toISOString(),
      legalImpacts: computed.legalImpacts.map(impact => ({
        type: impact.type,
        severity: impact.severity,
        message: impact.message,
        moduleId: impact.moduleId,
        timestamp: new Date().toISOString(),
      })),
      insurance: {
        declaredValue: ctx.declaredValue || 0,
        premium: insurancePremium,
        coverage: ctx.declaredValue || 0, // Par défaut, couverture = valeur déclarée
        notes: computed.insuranceNotes,
      },
      operationalConstraints: computed.operationalFlags,
    };
  }

  /**
   * Génère un audit juridique formaté
   */
  static generateLegalAudit(ctx: QuoteContext, quoteId?: string): LegalAudit {
    const computed = ctx.computed;
    if (!computed) {
      throw new Error('ComputedContext is required for legal audit generation');
    }

    const decisions: LegalAudit['decisions'] = [];

    // Décisions des modules activés
    computed.activatedModules.forEach(moduleId => {
      const module = computed.metadata?.[`${moduleId}_decision`];
      if (module) {
        decisions.push({
          moduleId,
          decision: module.decision || 'ACTIVATED',
          reason: module.reason || 'Module activé selon conditions métier',
          timestamp: new Date().toISOString(),
          impact: module.impact || 'COST',
        });
      }
    });

    // Décisions des impacts juridiques
    computed.legalImpacts.forEach(impact => {
      decisions.push({
        moduleId: impact.moduleId,
        decision: impact.type,
        reason: impact.message,
        timestamp: new Date().toISOString(),
        impact: 'LEGAL',
      });
    });

    // Flags juridiques depuis operationalFlags
    const legalFlags = computed.operationalFlags.filter(flag =>
      flag.includes('LEGAL') ||
      flag.includes('LIABILITY') ||
      flag.includes('INSURANCE') ||
      flag.includes('REGULATORY')
    );

    return {
      quoteId,
      generatedAt: new Date().toISOString(),
      decisions,
      riskScore: computed.riskScore || 0,
      manualReviewRequired: computed.manualReviewRequired || false,
      legalFlags,
    };
  }

  /**
   * Génère un résumé comparatif pour multi-offres (version simple sans recommandation intelligente)
   * @deprecated Utiliser generateComparisonSummaryWithRecommendation pour la recommandation intelligente
   */
  static generateComparisonSummary(variants: Array<{ scenarioId: string; label: string; finalPrice: number; marginRate: number }>): {
    cheapest: { scenarioId: string; label: string; price: number };
    mostExpensive: { scenarioId: string; label: string; price: number };
    recommended: { scenarioId: string; label: string; price: number } | null;
    priceRange: number;
    averagePrice: number;
  } {
    if (variants.length === 0) {
      throw new Error('At least one variant is required for comparison');
    }

    const sorted = [...variants].sort((a, b) => a.finalPrice - b.finalPrice);
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];
    const recommended = variants.find(v => v.scenarioId === 'STANDARD') || null;
    const priceRange = mostExpensive.finalPrice - cheapest.finalPrice;
    const averagePrice = variants.reduce((sum, v) => sum + v.finalPrice, 0) / variants.length;

    return {
      cheapest: {
        scenarioId: cheapest.scenarioId,
        label: cheapest.label,
        price: cheapest.finalPrice,
      },
      mostExpensive: {
        scenarioId: mostExpensive.scenarioId,
        label: mostExpensive.label,
        price: mostExpensive.finalPrice,
      },
      recommended: recommended ? {
        scenarioId: recommended.scenarioId,
        label: recommended.label,
        price: recommended.finalPrice,
      } : null,
      priceRange: parseFloat(priceRange.toFixed(2)),
      averagePrice: parseFloat(averagePrice.toFixed(2)),
    };
  }

  /**
   * Génère un résumé comparatif avec recommandation intelligente basée sur le contexte
   */
  static generateComparisonSummaryWithRecommendation(
    variants: Array<{ scenarioId: string; label: string; finalPrice: number; marginRate: number }>,
    ctx: QuoteContext
  ): {
    cheapest: { scenarioId: string; label: string; price: number };
    mostExpensive: { scenarioId: string; label: string; price: number };
    recommended: { scenarioId: string; label: string; price: number; reasons: string[]; confidence: string } | null;
    alternative: { scenarioId: string; label: string; price: number; reasons: string[] } | null;
    priceRange: number;
    averagePrice: number;
    recommendation: RecommendationResult;
    scores: ScenarioScore[];
  } {
    if (variants.length === 0) {
      throw new Error('At least one variant is required for comparison');
    }

    // Analyse intelligente du contexte
    const recommendation = ScenarioRecommendationEngine.analyze(ctx);

    const sorted = [...variants].sort((a, b) => a.finalPrice - b.finalPrice);
    const cheapest = sorted[0];
    const mostExpensive = sorted[sorted.length - 1];
    const priceRange = mostExpensive.finalPrice - cheapest.finalPrice;
    const averagePrice = variants.reduce((sum, v) => sum + v.finalPrice, 0) / variants.length;

    // Trouver le scénario recommandé par l'algorithme intelligent
    const recommendedVariant = variants.find(v => v.scenarioId === recommendation.recommended);
    const recommendedScore = recommendation.scores.find(s => s.scenarioId === recommendation.recommended);

    // Trouver l'alternative si disponible
    let alternativeVariant = null;
    if (recommendation.alternativeRecommendation) {
      alternativeVariant = variants.find(v => v.scenarioId === recommendation.alternativeRecommendation);
    }

    return {
      cheapest: {
        scenarioId: cheapest.scenarioId,
        label: cheapest.label,
        price: cheapest.finalPrice,
      },
      mostExpensive: {
        scenarioId: mostExpensive.scenarioId,
        label: mostExpensive.label,
        price: mostExpensive.finalPrice,
      },
      recommended: recommendedVariant ? {
        scenarioId: recommendedVariant.scenarioId,
        label: recommendedVariant.label,
        price: recommendedVariant.finalPrice,
        reasons: recommendation.primaryReasons,
        confidence: recommendedScore?.confidence || 'MEDIUM',
      } : null,
      alternative: alternativeVariant && recommendation.alternativeReasons ? {
        scenarioId: alternativeVariant.scenarioId,
        label: alternativeVariant.label,
        price: alternativeVariant.finalPrice,
        reasons: recommendation.alternativeReasons,
      } : null,
      priceRange: parseFloat(priceRange.toFixed(2)),
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      recommendation,
      scores: recommendation.scores,
    };
  }
}

