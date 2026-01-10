/**
 * 💰 BookingPriceRecalculationService
 * 
 * Service responsable du recalcul de prix côté serveur :
 * - PRIORITÉ 1: Utilise le nouveau système modulaire si selectedScenario est présent
 *   → Calcule le baseCost puis génère le prix pour le scénario choisi (ECO, STANDARD, etc.)
 * - PRIORITÉ 2: Fallback vers prix stocké dans quoteData (securedPrice, calculatedPrice)
 * - PRIORITÉ 3: Si aucun prix stocké, utilise le système modulaire avec scénario STANDARD
 * 
 * ✅ PHASE 3 - Extraction depuis BookingService
 * ✅ MIGRATION - Support du nouveau système modulaire avec selectedScenario
 */

import { logger } from '@/lib/logger';
import { FormAdapter } from '@/quotation-module/adapters/FormAdapter';
import { BaseCostEngine } from '@/quotation-module/core/BaseCostEngine';
import { MultiQuoteService } from '@/quotation-module/multi-offers/MultiQuoteService';
import { getAllModules } from '@/quotation-module/core/ModuleRegistry';
import { STANDARD_SCENARIOS } from '@/quotation-module/multi-offers/QuoteScenario';

/**
 * Service de recalcul de prix
 */
export class BookingPriceRecalculationService {
  private baseCostEngine: BaseCostEngine | null = null;
  private multiQuoteService: MultiQuoteService | null = null;

  constructor() {}

  /**
   * Recalcule le prix côté serveur
   * 
   * PRIORITÉ 1: Si selectedScenario est présent → Utilise le nouveau système modulaire
   *   → Calcule le baseCost puis génère le prix pour le scénario choisi
   * PRIORITÉ 2: Sinon → Utilise le prix stocké dans quoteData (fallback)
   * 
   * @param quoteData - Les données du devis (doit contenir selectedScenario pour utiliser le nouveau système)
   * @param serviceType - Le type de service (MOVING ou MOVING_PREMIUM pour le nouveau système)
   * @returns Le prix recalculé
   */
  async recalculate(quoteData: any, serviceType: string): Promise<number> {
    // ✅ NOUVEAU SYSTÈME MODULAIRE : Vérifier si selectedScenario est présent
    const selectedScenario = quoteData.selectedScenario;
    
    if (selectedScenario && (serviceType === 'MOVING_PREMIUM' || serviceType === 'MOVING')) {
      logger.info(`🔄 Recalcul du prix avec le nouveau système modulaire (scénario: ${selectedScenario})...`);
      return await this.recalculateWithModularSystem(quoteData, selectedScenario);
    }

    // ⚠️ FALLBACK : Ancien système (utilise le prix stocké dans quoteData)
    logger.info('🔄 Recalcul du prix avec prix stocké (fallback)...');
    return await this.recalculateWithLegacySystem(quoteData);
  }

  /**
   * Recalcule le prix avec le nouveau système modulaire
   * 
   * @param quoteData - Les données du devis
   * @param selectedScenario - Le scénario choisi par le client (ECO, STANDARD, CONFORT, etc.)
   * @returns Le prix recalculé pour le scénario choisi
   */
  private async recalculateWithModularSystem(
    quoteData: any,
    selectedScenario: string
  ): Promise<number> {
    try {
      // 1. Initialiser les services modulaires (lazy loading)
      if (!this.baseCostEngine || !this.multiQuoteService) {
        const allModules = getAllModules();
        this.baseCostEngine = new BaseCostEngine(allModules);
        this.multiQuoteService = new MultiQuoteService(allModules);
      }

      // 2. Convertir quoteData en QuoteContext via FormAdapter
      const quoteContext = FormAdapter.toQuoteContext(quoteData);

      // 3. ÉTAPE 1 : Calculer le baseCost
      logger.info('📊 [MODULAIRE] Calcul du baseCost...');
      const baseCostResult = this.baseCostEngine.execute(quoteContext);
      const baseCost = baseCostResult.baseCost;

      logger.info(`✅ [MODULAIRE] BaseCost calculé: ${baseCost}€`);

      // 4. ÉTAPE 2 : Générer les multi-offres avec le scénario choisi
      logger.info(`📊 [MODULAIRE] Génération des multi-offres (scénario: ${selectedScenario})...`);
      
      // Utiliser uniquement le scénario choisi pour optimiser les performances
      const targetScenario = STANDARD_SCENARIOS.find(s => s.id === selectedScenario);
      const scenariosToUse = targetScenario ? [targetScenario] : STANDARD_SCENARIOS;

      const variants = this.multiQuoteService.generateMultipleQuotesFromBaseCost(
        quoteContext,
        scenariosToUse,
        baseCost
      );

      // 5. Extraire le prix du scénario choisi
      const selectedVariant = variants.find(v => v.scenarioId === selectedScenario);
      
      if (!selectedVariant) {
        logger.warn(
          `⚠️ Scénario ${selectedScenario} non trouvé, utilisation du premier scénario disponible`
        );
        const fallbackVariant = variants[0];
        if (!fallbackVariant) {
          throw new Error('Aucune variante de devis générée');
        }
        logger.info(`✅ [MODULAIRE] Prix recalculé (fallback): ${fallbackVariant.finalPrice}€`);
        return fallbackVariant.finalPrice;
      }

      logger.info(
        `✅ [MODULAIRE] Prix recalculé pour scénario ${selectedScenario}: ${selectedVariant.finalPrice}€`
      );

      // ✅ Ajouter les options d'assurance si présentes (fragileProtection + insurancePremium)
      const fragileProtectionAmount = quoteData.fragileProtectionAmount || 0;
      const insurancePremium = quoteData.insurancePremium || 0;
      const totalPriceWithOptions = selectedVariant.finalPrice + fragileProtectionAmount + insurancePremium;

      if (fragileProtectionAmount > 0 || insurancePremium > 0) {
        logger.info(
          `✅ [MODULAIRE] Options d'assurance ajoutées: +${fragileProtectionAmount + insurancePremium}€ (prix final: ${totalPriceWithOptions}€)`
        );
        return totalPriceWithOptions;
      }

      return selectedVariant.finalPrice;
    } catch (error) {
      logger.error(
        '❌ Erreur lors du recalcul avec le système modulaire, fallback vers ancien système:',
        error
      );
      
      // Fallback vers l'ancien système en cas d'erreur
      return await this.recalculateWithLegacySystem(quoteData);
    }
  }

  /**
   * Recalcule le prix avec l'ancien système (fallback)
   * Utilise le prix stocké dans quoteData si disponible
   * 
   * @param quoteData - Les données du devis
   * @returns Le prix recalculé
   */
  private async recalculateWithLegacySystem(quoteData: any): Promise<number> {
    // Essayer d'utiliser le prix stocké dans quoteData
    const storedPrice = 
      quoteData.securedPrice?.totalPrice ||
      quoteData.calculatedPrice ||
      quoteData.totalPrice ||
      0;

    if (storedPrice > 0) {
      logger.info(`✅ Prix récupéré depuis quoteData: ${storedPrice}€`);
      return storedPrice;
    }

    // Si aucun prix stocké, utiliser le système modulaire par défaut (STANDARD)
    logger.warn('⚠️ Aucun prix stocké trouvé, utilisation du système modulaire avec scénario STANDARD');
    return await this.recalculateWithModularSystem(quoteData, 'STANDARD');
  }

  /**
   * Nettoie les contraintes pour retirer les clés structurelles non-UUID
   * 
   * @param constraints - Les contraintes à nettoyer
   * @returns Les contraintes nettoyées
   */
  private cleanConstraints(
    constraints: any
  ): string[] | Record<string, boolean> | undefined {
    if (!constraints) return undefined;

    if (Array.isArray(constraints)) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return constraints.filter(
        (id: string) => typeof id === 'string' && uuidRegex.test(id)
      );
    }

    if (typeof constraints === 'object') {
      const cleaned: Record<string, boolean> = {};
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (
        'globalServices' in constraints ||
        'addressConstraints' in constraints ||
        'addressServices' in constraints
      ) {
        if (
          constraints.addressConstraints &&
          typeof constraints.addressConstraints === 'object'
        ) {
          Object.keys(constraints.addressConstraints).forEach(key => {
            if (
              uuidRegex.test(key) &&
              constraints.addressConstraints[key] === true
            ) {
              cleaned[key] = true;
            }
          });
        }
      } else {
        Object.keys(constraints).forEach(key => {
          if (uuidRegex.test(key) && constraints[key] === true) {
            cleaned[key] = true;
          }
        });
      }

      return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }

    return undefined;
  }
}

