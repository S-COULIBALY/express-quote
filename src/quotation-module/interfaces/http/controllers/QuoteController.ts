/**
 * QuoteController - Contrôleur pour le système modulaire de devis
 *
 * Architecture en 2 étapes :
 * 1. /calculate → Calcule UNIQUEMENT le coût opérationnel de base (baseCost)
 * 2. /multi-offers → Reçoit baseCost et génère les 6 scénarios avec options
 *
 * Cette séparation évite le calcul en double et assure une source unique de vérité.
 */

import { NextRequest, NextResponse } from 'next/server';
import { BaseCostEngine, BaseCostResult } from '@/quotation-module/core/BaseCostEngine';
import { getAllModules } from '@/quotation-module/core/ModuleRegistry';
import { FormAdapter } from '@/quotation-module/adapters/FormAdapter';
import { QuoteOutputService } from '@/quotation-module/services/QuoteOutputService';
import { MultiQuoteService, QuoteVariant } from '@/quotation-module/multi-offers/MultiQuoteService';
import { STANDARD_SCENARIOS } from '@/quotation-module/multi-offers/QuoteScenario';
import { createEmptyComputedContext } from '@/quotation-module/core/ComputedContext';

export class QuoteController {
  /**
   * ÉTAPE 1 : Calcule UNIQUEMENT le coût opérationnel de base
   *
   * Modules exécutés (coûts de base UNIQUEMENT) :
   * - PHASE 1 : Normalisation (InputSanitization, DateValidation, AddressNormalization)
   * - PHASE 2 : Volume (VolumeEstimation)
   * - PHASE 3 : Distance & Transport (Distance, Fuel, Tolls)
   * - PHASE 6 : Main d'œuvre de base (Vehicle, Workers, LaborBase)
   *
   * @returns baseCost + breakdown + context enrichi
   */
  async calculateQuote(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Parser le body
      const body = await request.json();

      // 2. Valider les données requises
      const validationError = this.validateQuoteRequest(body);
      if (validationError) {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: validationError,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // 3. Convertir en QuoteContext via FormAdapter
      const quoteContext = FormAdapter.toQuoteContext(body);

      // 4. Créer le moteur de coût de base
      const baseCostEngine = new BaseCostEngine(getAllModules());

      // 5. Exécuter le calcul du coût de base UNIQUEMENT
      const result: BaseCostResult = baseCostEngine.execute(quoteContext);

      // 6. Retourner le coût de base avec breakdown
      return NextResponse.json(
        {
          success: true,
          timestamp: new Date().toISOString(),

          // Coût opérationnel brut (sans marge, sans options)
          baseCost: result.baseCost,

          // Détail des coûts par catégorie
          breakdown: result.breakdown,

          // Contexte enrichi (pour passer à /multi-offers)
          context: {
            // Données originales du formulaire
            original: body,

            // Données calculées (volume, distance, etc.)
            computed: {
              baseVolume: result.breakdown.volume.baseVolume,
              adjustedVolume: result.breakdown.volume.adjustedVolume,
              distanceKm: result.breakdown.distance.km,
              isLongDistance: result.breakdown.distance.isLongDistance,
              workersCount: result.breakdown.labor.workers,
              estimatedHours: result.breakdown.labor.hours,
            },
          },

          // Modules activés pour traçabilité
          activatedModules: result.activatedModules,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error(
        '❌ Erreur dans calculateQuote:',
        error instanceof Error ? error.message : 'Erreur inconnue'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message:
            error instanceof Error ? error.message : 'Erreur lors du calcul du coût de base',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  }

  /**
   * ÉTAPE 2 : Génère 6 variantes de devis à partir du baseCost
   *
   * Entrée attendue :
   * - baseCost : coût opérationnel de base (retourné par /calculate)
   * - context : données originales du formulaire + computed
   * - scenarios (optionnel) : scénarios personnalisés
   *
   * Pour chaque scénario (ECO, STANDARD, CONFORT, SÉCURITÉ+, PREMIUM, FLEX) :
   * - Applique les modules spécifiques (cross-selling, assurance, etc.)
   * - Calcule les coûts additionnels
   * - Applique la marge commerciale
   *
   * @returns 6 devis détaillés avec recommandation intelligente
   */
  async generateMultiOffers(request: NextRequest): Promise<NextResponse> {
    try {
      // 1. Parser le body
      const body = await request.json();

      // 2. Vérifier que baseCost est fourni (vient de /calculate)
      if (body.baseCost === undefined || body.baseCost === null) {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message:
              'baseCost est requis. Appelez d\'abord /api/quotation/calculate pour obtenir le coût de base.',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // 3. Valider les données originales du contexte
      const originalData = body.context?.original || body;
      const validationError = this.validateQuoteRequest(originalData);
      if (validationError) {
        return NextResponse.json(
          {
            success: false,
            error: 'VALIDATION_ERROR',
            message: validationError,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // 4. Convertir en QuoteContext via FormAdapter
      const baseContext = FormAdapter.toQuoteContext(originalData);

      // 5. Injecter les données calculées par /calculate dans le contexte
      if (body.context?.computed) {
        const emptyComputed = createEmptyComputedContext();
        baseContext.computed = {
          ...emptyComputed,
          baseVolume: body.context.computed.baseVolume,
          adjustedVolume: body.context.computed.adjustedVolume,
          distanceKm: body.context.computed.distanceKm,
          isLongDistance: body.context.computed.isLongDistance,
          workersCount: body.context.computed.workersCount,
        };
      }

      // 6. Créer le service multi-offres avec le baseCost injecté
      const multiService = new MultiQuoteService(getAllModules());

      // 7. Utiliser les scénarios personnalisés ou les scénarios standards
      const scenarios = body.scenarios || STANDARD_SCENARIOS;

      // 8. Générer les variantes avec le baseCost comme point de départ
      console.log('\n🚀 GÉNÉRATION DES 6 OFFRES (baseCost: ' + body.baseCost.toFixed(2) + '€)');
      console.log('═══════════════════════════════════════════════');

      const variants = multiService.generateMultipleQuotesFromBaseCost(
        baseContext,
        scenarios,
        body.baseCost
      );

      // 9. Formater les variantes avec QuoteOutputService
      const formattedVariants = variants.map((variant) => {
        const quoteId = `quote-${variant.scenarioId}`;
        const formattedContext = QuoteOutputService.formatQuote(variant.context, quoteId);

        return {
          scenarioId: variant.scenarioId,
          label: variant.label,
          description: variant.description,
          finalPrice: variant.finalPrice,
          basePrice: variant.basePrice,
          baseCost: body.baseCost, // Inclure le baseCost pour traçabilité
          additionalCosts: variant.additionalCosts || 0,
          marginRate: variant.marginRate,
          tags: variant.tags,
          context: formattedContext,
          checklist: QuoteOutputService.generateTerrainChecklist(variant.context, quoteId),
          contract: QuoteOutputService.generateContractData(variant.context, quoteId),
          audit: QuoteOutputService.generateLegalAudit(variant.context, quoteId),
        };
      });

      // 10. Générer le résumé comparatif avec recommandation intelligente
      const comparison = QuoteOutputService.generateComparisonSummaryWithRecommendation(
        variants.map((v) => ({
          scenarioId: v.scenarioId,
          label: v.label,
          finalPrice: v.finalPrice,
          marginRate: v.marginRate,
        })),
        baseContext // Passer le contexte pour la recommandation intelligente
      );

      return NextResponse.json(
        {
          success: true,
          generatedAt: new Date().toISOString(),
          baseCost: body.baseCost, // Rappel du baseCost utilisé
          quotes: formattedVariants,
          comparison,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error(
        '❌ Erreur dans generateMultiOffers:',
        error instanceof Error ? error.message : 'Erreur inconnue'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message:
            error instanceof Error ? error.message : 'Erreur lors de la génération des variantes',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  }

  /**
   * Génère une checklist terrain formatée
   */
  async getTerrainChecklist(quoteId: string): Promise<NextResponse> {
    try {
      // TODO: En production, récupérer le contexte depuis la base de données
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_IMPLEMENTED',
          message: 'Le stockage des devis n\'est pas encore implémenté. Utilisez /calculate pour obtenir un devis avec checklist.',
          timestamp: new Date().toISOString()
        },
        { status: 501 }
      );
    } catch (error) {
      console.error(`❌ Erreur dans QuoteController.getTerrainChecklist:`, error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Erreur lors de la génération de la checklist',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  }

  /**
   * Génère les données contractuelles formatées
   */
  async getContractData(quoteId: string): Promise<NextResponse> {
    try {
      // TODO: En production, récupérer le contexte depuis la base de données
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_IMPLEMENTED',
          message: 'Le stockage des devis n\'est pas encore implémenté. Utilisez /calculate pour obtenir un devis avec données contrat.',
          timestamp: new Date().toISOString()
        },
        { status: 501 }
      );
    } catch (error) {
      console.error(`❌ Erreur dans QuoteController.getContractData:`, error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Erreur lors de la génération des données contrat',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  }

  /**
   * Génère un audit juridique complet
   */
  async getLegalAudit(quoteId: string): Promise<NextResponse> {
    try {
      // TODO: En production, récupérer le contexte depuis la base de données
      return NextResponse.json(
        {
          success: false,
          error: 'NOT_IMPLEMENTED',
          message: 'Le stockage des devis n\'est pas encore implémenté. Utilisez /calculate pour obtenir un devis avec audit.',
          timestamp: new Date().toISOString()
        },
        { status: 501 }
      );
    } catch (error) {
      console.error(`❌ Erreur dans QuoteController.getLegalAudit:`, error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Erreur lors de la génération de l\'audit',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  }

  // ============================================================================
  // MÉTHODES PRIVÉES
  // ============================================================================

  /**
   * Valide les données de requête de devis
   * 
   * Supporte les alias de noms de champs pour compatibilité avec différents formulaires
   */
  private validateQuoteRequest(body: any): string | null {
    // Date : supporte movingDate, dateSouhaitee
    const movingDate = body.movingDate || body.dateSouhaitee;
    if (!movingDate) {
      return 'movingDate ou dateSouhaitee est requis';
    }

    // Adresse départ : supporte departureAddress, pickupAddress, adresseDepart
    const departureAddress = body.departureAddress || body.pickupAddress || body.adresseDepart;
    if (!departureAddress) {
      return 'departureAddress, pickupAddress ou adresseDepart est requis';
    }

    // Adresse arrivée : supporte arrivalAddress, deliveryAddress, adresseArrivee
    const arrivalAddress = body.arrivalAddress || body.deliveryAddress || body.adresseArrivee;
    if (!arrivalAddress) {
      return 'arrivalAddress, deliveryAddress ou adresseArrivee est requis';
    }

    return null;
  }

  /**
   * Génère un ID unique pour un devis
   */
  private generateQuoteId(): string {
    return `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

