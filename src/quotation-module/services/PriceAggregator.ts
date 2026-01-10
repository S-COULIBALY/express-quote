/**
 * PriceAggregator - Service dédié pour le calcul des prix finaux
 *
 * Responsabilités :
 * - Calcul du prix de base (somme des coûts × (1 + marge))
 * - Calcul du prix final (basePrice + ajustements)
 * - Gestion des marges selon scénarios
 * - Gestion des ajustements (surcharges, réductions)
 *
 * Séparation des responsabilités :
 * - Les modules calculent les coûts individuels
 * - Le PriceAggregator agrège et applique la marge
 * - Le QuoteEngine orchestre mais délègue le calcul de prix à PriceAggregator
 */

import { QuoteContext } from '../core/QuoteContext';
import { devLog } from '@/lib/conditional-logger';

export interface PriceCalculationResult {
  totalCosts: number;
  basePrice: number;
  totalAdjustments: number;
  finalPrice: number;
  marginRate: number;
  breakdown: {
    costsByCategory: Record<string, number>;
    adjustmentsByType: Record<string, number>;
  };
}

export class PriceAggregator {
  /**
   * Calcule le prix final depuis le contexte enrichi
   *
   * @param ctx Contexte enrichi par le moteur
   * @param marginRate Taux de marge à appliquer (défaut: 0.30 = 30%)
   * @returns Résultat du calcul de prix avec détails
   */
  static compute(
    ctx: QuoteContext,
    marginRate: number = 0.30
  ): PriceCalculationResult {
    const computed = ctx.computed;
    if (!computed) {
      throw new Error('ComputedContext is required for price calculation');
    }

    // 1. Somme de tous les coûts structurels
    const totalCosts = computed.costs.reduce(
      (sum, cost) => sum + cost.amount,
      0
    );

    // 2. Calcul du prix de base (coûts × (1 + marge))
    const basePrice = totalCosts * (1 + marginRate);

    // 3. Somme des ajustements (surcharges et réductions)
    const totalAdjustments = computed.adjustments.reduce(
      (sum, adj) => sum + adj.amount,
      0
    );

    // 4. Calcul du prix final (basePrice + ajustements)
    const finalPrice = basePrice + totalAdjustments;

    // 5. Breakdown par catégorie
    const costsByCategory: Record<string, number> = {};
    computed.costs.forEach(cost => {
      costsByCategory[cost.category] = (costsByCategory[cost.category] || 0) + cost.amount;
    });

    // 6. Breakdown des ajustements par type
    const adjustmentsByType: Record<string, number> = {};
    computed.adjustments.forEach(adj => {
      adjustmentsByType[adj.type] = (adjustmentsByType[adj.type] || 0) + adj.amount;
    });

    const result = {
      totalCosts: parseFloat(totalCosts.toFixed(2)),
      basePrice: parseFloat(basePrice.toFixed(2)),
      totalAdjustments: parseFloat(totalAdjustments.toFixed(2)),
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      marginRate,
      breakdown: {
        costsByCategory,
        adjustmentsByType,
      },
    };

    return result;
  }

  /**
   * Calcule uniquement le prix de base (sans ajustements)
   *
   * @param ctx Contexte enrichi
   * @param marginRate Taux de marge
   * @returns Prix de base
   */
  static computeBasePrice(
    ctx: QuoteContext,
    marginRate: number = 0.30
  ): number {
    const computed = ctx.computed;
    if (!computed) {
      return 0;
    }

    const totalCosts = computed.costs.reduce(
      (sum, cost) => sum + cost.amount,
      0
    );

    return parseFloat((totalCosts * (1 + marginRate)).toFixed(2));
  }

  /**
   * Calcule uniquement le prix final (avec ajustements)
   *
   * @param ctx Contexte enrichi
   * @param marginRate Taux de marge
   * @returns Prix final
   */
  static computeFinalPrice(
    ctx: QuoteContext,
    marginRate: number = 0.30
  ): number {
    const result = this.compute(ctx, marginRate);
    return result.finalPrice;
  }

  /**
   * Retourne un breakdown détaillé des coûts
   *
   * @param ctx Contexte enrichi
   * @returns Breakdown détaillé
   */
  static getCostBreakdown(ctx: QuoteContext): {
    costsByCategory: Record<string, number>;
    costsByModule: Array<{ moduleId: string; label: string; amount: number; category: string }>;
    totalCosts: number;
  } {
    const computed = ctx.computed;
    if (!computed) {
      return {
        costsByCategory: {},
        costsByModule: [],
        totalCosts: 0,
      };
    }

    const costsByCategory: Record<string, number> = {};
    computed.costs.forEach(cost => {
      costsByCategory[cost.category] = (costsByCategory[cost.category] || 0) + cost.amount;
    });

    const costsByModule = computed.costs.map(cost => ({
      moduleId: cost.moduleId,
      label: cost.label,
      amount: cost.amount,
      category: cost.category,
    }));

    const totalCosts = computed.costs.reduce(
      (sum, cost) => sum + cost.amount,
      0
    );

    return {
      costsByCategory,
      costsByModule,
      totalCosts: parseFloat(totalCosts.toFixed(2)),
    };
  }
}

