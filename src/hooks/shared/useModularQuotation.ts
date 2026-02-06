/**
 * useModularQuotation - Hook pour calculer les devis avec le système modulaire
 *
 * Architecture en 2 étapes :
 * 1. /api/quotation/calculate → Calcule le coût opérationnel de base (baseCost)
 * 2. /api/quotation/multi-offers → Génère les 6 scénarios à partir du baseCost
 *
 * Cette séparation évite le calcul en double et assure une source unique de vérité.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { devLog } from "@/lib/conditional-logger";
import { calculateDistance } from "@/actions/distanceCalculator";
import { useCrossSellingOptional } from "@/contexts";

/**
 * Résultat du calcul de base (étape 1)
 */
export interface BaseCostResult {
  baseCost: number;
  breakdown: {
    volume: { baseVolume: number; adjustedVolume: number };
    distance: { km: number; isLongDistance: boolean };
    transport: { fuel: number; tolls: number; vehicle: number };
    labor: { workers: number; hours: number; cost: number };
  };
  context: {
    original: any;
    computed: {
      baseVolume: number;
      adjustedVolume: number;
      distanceKm: number;
      isLongDistance: boolean;
      workersCount: number;
      estimatedHours: number;
    };
  };
  activatedModules: string[];
}

export interface ScenarioScore {
  scenarioId: string;
  score: number;
  reasons: string[];
  warnings: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
  /** Phrases orientées client (à la première personne) */
  clientPhrases: readonly string[];
}

export interface MultiOffersResult {
  /** Distance en km (commune à toutes les variantes) */
  distanceKm?: number;
  quotes: Array<{
    scenarioId: string;
    label: string;
    description: string;
    pricing: {
      totalCosts: number;
      basePrice: number;
      finalPrice: number;
      marginRate: number;
    };
    logistics: {
      baseVolume: number;
      adjustedVolume: number;
      vehicleCount: number;
      workersCount: number;
    };
    risk: {
      riskScore: number;
      manualReviewRequired: boolean;
    };
  }>;
  comparison: {
    cheapest: string;
    recommended: string;
    recommendedReasons?: string[];
    recommendedConfidence?: "LOW" | "MEDIUM" | "HIGH";
    alternative?: string;
    alternativeReasons?: string[];
    priceRange: {
      min: number;
      max: number;
    };
    scores?: ScenarioScore[];
  };
}

export interface UseModularQuotationResult {
  // Étape 1 : Calcul du coût de base
  calculateBaseCost: (formData: any) => Promise<BaseCostResult | null>;
  baseCostResult: BaseCostResult | null;
  isCalculatingBaseCost: boolean;

  // Étape 2 : Génération des 6 offres (nécessite baseCost)
  calculateMultiOffers: (formData: any) => Promise<MultiOffersResult | null>;
  multiOffers: MultiOffersResult | null;
  isCalculatingMultiOffers: boolean;

  // Flux complet séquentiel (calculate → multi-offers)
  calculateFullQuote: (formData: any) => Promise<MultiOffersResult | null>;

  // Calcul avec debounce (pour onChange)
  calculateWithDebounce: (formData: any) => void;

  // Prix calculé (pour compatibilité avec useRealTimePricing)
  calculatedPrice: number;
  priceDetails: any;
  isPriceLoading: boolean;

  // Erreurs
  error: string | null;
}

/**
 * Hook pour calculer les devis avec le système modulaire
 *
 * Flux séquentiel :
 * 1. calculateBaseCost() → Appelle /api/quotation/calculate → Retourne baseCost
 * 2. calculateMultiOffers() → Appelle /api/quotation/multi-offers avec baseCost → Retourne 6 offres
 *
 * Ou utilisez calculateFullQuote() pour exécuter les deux étapes automatiquement.
 */
export const useModularQuotation = (): UseModularQuotationResult => {
  // Contexte cross-selling (optionnel - ne throw pas si hors du provider)
  const crossSelling = useCrossSellingOptional();

  // État pour le coût de base (étape 1)
  const [baseCostResult, setBaseCostResult] = useState<BaseCostResult | null>(
    null,
  );
  const [isCalculatingBaseCost, setIsCalculatingBaseCost] = useState(false);

  // État pour les multi-offres (étape 2)
  const [multiOffers, setMultiOffers] = useState<MultiOffersResult | null>(
    null,
  );
  const [isCalculatingMultiOffers, setIsCalculatingMultiOffers] =
    useState(false);

  const [error, setError] = useState<string | null>(null);

  // Debounce pour éviter trop d'appels API
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const DEBOUNCE_DELAY = 800; // 800ms pour éviter trop d'appels

  /**
   * Enrichit les données du formulaire avec les sélections cross-selling
   */
  const enrichFormDataWithCrossSelling = useCallback(
    (formData: any): any => {
      if (!crossSelling) {
        return formData;
      }

      const pricingData = crossSelling.getSelectionForPricing();

      devLog.debug(
        "useModularQuotation",
        "🛒 Enrichissement avec cross-selling:",
        {
          servicesCount: crossSelling.selection.services.length,
          suppliesCount: crossSelling.selection.supplies.length,
          servicesTotal: pricingData.servicesTotal,
          suppliesTotal: pricingData.suppliesTotal,
        },
      );

      return {
        ...formData,
        // Services cross-selling (flags pour les modules)
        packing: formData.packing || pricingData.packing,
        dismantling: formData.dismantling || pricingData.dismantling,
        reassembly: formData.reassembly || pricingData.reassembly,
        cleaningEnd: formData.cleaningEnd || pricingData.cleaningEnd,
        // NOTE: furnitureLift et insurancePremium SUPPRIMÉS du cross-selling
        // - Monte-meubles: géré par pickupFurnitureLift/deliveryFurnitureLift (checkbox formulaire)
        // - Assurance: gérée dans PaymentPriceSection (après scénarios multi-offres)
        temporaryStorage: formData.temporaryStorage || pricingData.storage,
        storageDurationDays:
          formData.storageDurationDays ||
          crossSelling.formContext?.storageDurationDays,

        // Objets spéciaux
        piano: formData.piano || pricingData.hasPiano,
        safe: formData.safe || pricingData.hasSafe,
        artwork: formData.artwork || pricingData.hasArtwork,

        // Fournitures (prix fixes ajoutés au total)
        crossSellingSuppliesTotal: pricingData.suppliesTotal,
        crossSellingSuppliesDetails: pricingData.suppliesDetails,

        // Totaux cross-selling
        crossSellingServicesTotal: pricingData.servicesTotal,
        crossSellingGrandTotal: pricingData.grandTotal,
      };
    },
    [crossSelling],
  );

  /**
   * Enrichit les données du formulaire avec la distance calculée si nécessaire
   */
  const enrichFormDataWithDistance = useCallback(
    async (formData: any): Promise<any> => {
      // Vérifier si la distance est déjà fournie
      if (formData.distance && formData.distance > 0) {
        devLog.debug(
          "useModularQuotation",
          "📍 Distance déjà fournie:",
          formData.distance,
        );
        return formData;
      }

      // Récupérer les adresses (support des différents noms de champs)
      const departureAddress =
        formData.departureAddress ||
        formData.pickupAddress ||
        formData.adresseDepart;
      const arrivalAddress =
        formData.arrivalAddress ||
        formData.deliveryAddress ||
        formData.adresseArrivee;

      // Si les deux adresses sont présentes, calculer la distance
      if (
        departureAddress &&
        arrivalAddress &&
        departureAddress !== arrivalAddress
      ) {
        try {
          devLog.debug(
            "useModularQuotation",
            "🗺️ Calcul de la distance entre:",
            {
              departure: departureAddress,
              arrival: arrivalAddress,
            },
          );

          const distance = await calculateDistance(
            departureAddress,
            arrivalAddress,
          );

          if (distance > 0) {
            devLog.debug(
              "useModularQuotation",
              "✅ Distance calculée:",
              distance,
              "km",
            );
            return {
              ...formData,
              distance,
            };
          }
        } catch (error) {
          devLog.error(
            "useModularQuotation",
            "❌ Erreur calcul distance:",
            error,
          );
          // Continue sans distance - le backend utilisera un fallback
        }
      }

      return formData;
    },
    [],
  );

  /**
   * ÉTAPE 1 : Calcule le coût opérationnel de base
   *
   * Appelle /api/quotation/calculate qui retourne :
   * - baseCost : coût opérationnel brut (sans marge, sans options)
   * - breakdown : détail par catégorie (volume, distance, transport, labor)
   * - context : données pour passer à /multi-offers
   */
  const calculateBaseCost = useCallback(
    async (formData: any): Promise<BaseCostResult | null> => {
      setIsCalculatingBaseCost(true);
      setError(null);

      try {
        // Enrichir les données avec les sélections cross-selling
        const formDataWithCrossSelling =
          enrichFormDataWithCrossSelling(formData);

        // Enrichir les données avec la distance si nécessaire
        const enrichedFormData = await enrichFormDataWithDistance(
          formDataWithCrossSelling,
        );

        devLog.info(
          "useModularQuotation",
          "🔧 [ÉTAPE 1] Calcul du coût de base...",
          {
            formDataKeys: Object.keys(enrichedFormData),
          },
        );

        const response = await fetch("/api/quotation/calculate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(enrichedFormData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Erreur lors du calcul du coût de base",
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Calcul du coût de base échoué");
        }

        const result: BaseCostResult = {
          baseCost: data.baseCost,
          breakdown: data.breakdown,
          context: data.context,
          activatedModules: data.activatedModules || [],
        };

        devLog.info(
          "useModularQuotation",
          "✅ [ÉTAPE 1] Coût de base calculé:",
          {
            baseCost: result.baseCost,
            distanceKm: result.breakdown.distance.km,
            adjustedVolume: result.breakdown.volume.adjustedVolume,
          },
        );

        setBaseCostResult(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        devLog.error("useModularQuotation", "❌ Erreur calcul coût de base:", {
          error: errorMessage,
        });
        return null;
      } finally {
        setIsCalculatingBaseCost(false);
      }
    },
    [enrichFormDataWithDistance, enrichFormDataWithCrossSelling],
  );

  /**
   * ÉTAPE 2 : Génère les 6 variantes de devis à partir du baseCost
   *
   * IMPORTANT : Cette méthode nécessite que calculateBaseCost ait été appelée avant,
   * ou que baseCostResult soit fourni dans formData.
   *
   * Si baseCostResult n'existe pas, cette méthode appelle d'abord calculateBaseCost.
   */
  const calculateMultiOffers = useCallback(
    async (formData: any): Promise<MultiOffersResult | null> => {
      setIsCalculatingMultiOffers(true);
      setError(null);

      try {
        // Vérifier si on a déjà le baseCost (depuis l'état ou fourni dans formData)
        let currentBaseCost = baseCostResult;

        // Si pas de baseCost, on doit d'abord le calculer
        if (!currentBaseCost && !formData.baseCost) {
          devLog.info(
            "useModularQuotation",
            "⚠️ [ÉTAPE 2] Pas de baseCost, appel de calculateBaseCost...",
          );
          currentBaseCost = await calculateBaseCost(formData);

          if (!currentBaseCost) {
            throw new Error("Impossible de calculer le coût de base");
          }
        }

        // Construire le payload pour /multi-offers
        const payload = {
          baseCost: formData.baseCost || currentBaseCost?.baseCost,
          context: formData.context || currentBaseCost?.context,
          scenarios: formData.scenarios, // Optionnel
        };

        devLog.info(
          "useModularQuotation",
          "🎯 [ÉTAPE 2] Génération des 6 offres...",
          {
            baseCost: payload.baseCost,
          },
        );

        const response = await fetch("/api/quotation/multi-offers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Erreur lors du calcul des multi-offres",
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "Calcul multi-offres échoué");
        }

        // L'API retourne 'quotes'
        const rawQuotes = data.quotes || [];

        // Transformer les données pour correspondre à MultiOffersResult
        const quotes = rawQuotes.map((item: any) => {
          // Si les données sont déjà dans le bon format (depuis context)
          if (item.context) {
            // Récupérer les données de logistique depuis le contexte formaté
            const logistics = item.context.logistics || {};

            // Si vehicleCount est 0 ou undefined, essayer de le récupérer depuis le computed de base
            // ou utiliser une valeur par défaut basée sur le volume
            let vehicleCount = logistics.vehicleCount;
            if (!vehicleCount || vehicleCount === 0) {
              // Fallback : estimer le nombre de véhicules depuis le volume
              const adjustedVolume = logistics.adjustedVolume || 0;
              if (adjustedVolume > 0) {
                // Estimation : 1 véhicule pour ≤30 m³, 2 pour >30 m³
                vehicleCount = adjustedVolume > 30 ? 2 : 1;
              } else {
                vehicleCount = 1; // Par défaut, au moins 1 véhicule
              }
            }

            return {
              scenarioId: item.scenarioId,
              label: item.label,
              description: item.description,
              pricing: item.context.pricing || {
                totalCosts: item.context.pricing?.totalCosts || 0,
                basePrice:
                  item.basePrice || item.context.pricing?.basePrice || 0,
                finalPrice:
                  item.finalPrice || item.context.pricing?.finalPrice || 0,
                marginRate:
                  item.marginRate || item.context.pricing?.marginRate || 0.3,
              },
              logistics: {
                baseVolume: logistics.baseVolume || 0,
                adjustedVolume: logistics.adjustedVolume || 0,
                vehicleCount: vehicleCount,
                vehicleTypes: logistics.vehicleTypes || [],
                workersCount: logistics.workersCount || 0,
                estimatedDurationHours: logistics.estimatedDurationHours || 0,
              },
              risk: item.context.risk || {
                riskScore: 0,
                manualReviewRequired: false,
                riskContributions: [],
              },
              // Nouvelles données de la nouvelle architecture
              baseCost: item.baseCost || data.baseCost,
              additionalCosts: item.additionalCosts || 0,
            };
          }
          return item;
        });

        // Construire la comparaison avec les données de recommandation intelligente
        const comparison = data.comparison || {};

        // Récupérer la distance depuis le contexte ou le breakdown
        const distanceKm =
          currentBaseCost?.breakdown?.distance?.km ||
          rawQuotes[0]?.context?.distanceKm ||
          data.distanceKm;

        const multiOffersResult: MultiOffersResult = {
          distanceKm,
          quotes: quotes,
          comparison: {
            cheapest: comparison.cheapest?.scenarioId || "",
            recommended: comparison.recommended?.scenarioId || "",
            recommendedReasons: comparison.recommended?.reasons || [],
            recommendedConfidence:
              comparison.recommended?.confidence || "MEDIUM",
            alternative: comparison.alternative?.scenarioId,
            alternativeReasons: comparison.alternative?.reasons,
            priceRange: {
              min: comparison.cheapest?.price || 0,
              max: comparison.mostExpensive?.price || 0,
            },
            scores: comparison.scores || [],
          },
        };

        devLog.info("useModularQuotation", "✅ [ÉTAPE 2] 6 offres générées:", {
          quotesCount: quotes.length,
          recommended: multiOffersResult.comparison.recommended,
          priceRange: multiOffersResult.comparison.priceRange,
        });

        setMultiOffers(multiOffersResult);
        return multiOffersResult;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erreur inconnue";
        setError(errorMessage);
        devLog.error("useModularQuotation", "❌ Erreur calcul multi-offres:", {
          error: errorMessage,
        });
        return null;
      } finally {
        setIsCalculatingMultiOffers(false);
      }
    },
    [baseCostResult, calculateBaseCost],
  );

  /**
   * Flux complet : Calcule le baseCost puis génère les 6 offres
   *
   * C'est la méthode recommandée pour un calcul complet.
   * Elle exécute les deux étapes séquentiellement :
   * 1. /api/quotation/calculate → baseCost
   * 2. /api/quotation/multi-offers → 6 offres
   */
  const calculateFullQuote = useCallback(
    async (formData: any): Promise<MultiOffersResult | null> => {
      devLog.info(
        "useModularQuotation",
        "🚀 Début du flux complet (calculate → multi-offers)",
      );

      // Étape 1 : Calculer le coût de base
      const baseCost = await calculateBaseCost(formData);

      if (!baseCost) {
        devLog.error(
          "useModularQuotation",
          "❌ Échec du calcul du coût de base",
        );
        return null;
      }

      // Étape 2 : Générer les 6 offres avec le baseCost
      const multiOffersPayload = {
        baseCost: baseCost.baseCost,
        context: baseCost.context,
      };

      const result = await calculateMultiOffers(multiOffersPayload);

      if (result) {
        devLog.info(
          "useModularQuotation",
          "✅ Flux complet terminé avec succès",
        );
      }

      return result;
    },
    [calculateBaseCost, calculateMultiOffers],
  );

  /**
   * Calcule le flux complet avec debounce
   *
   * Utilisé pour les changements de formulaire en temps réel.
   * Exécute le flux séquentiel : calculate → multi-offers
   */
  const calculateWithDebounce = useCallback(
    (formData: any) => {
      // Annuler le debounce précédent
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Nouveau debounce - utilise le flux complet séquentiel
      debounceTimer.current = setTimeout(async () => {
        await calculateFullQuote(formData);
      }, DEBOUNCE_DELAY);
    },
    [calculateFullQuote],
  );

  // Nettoyer le timer au démontage
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Prix calculé (pour compatibilité avec useRealTimePricing)
  // Utilise le prix recommandé des multi-offres ou le baseCost
  const calculatedPrice =
    multiOffers?.quotes?.find(
      (q) => q.scenarioId === multiOffers.comparison.recommended,
    )?.pricing?.finalPrice || (baseCostResult?.baseCost ?? 0) * 1.3; // Marge standard 30%

  const priceDetails = baseCostResult || null;
  const isPriceLoading = isCalculatingBaseCost || isCalculatingMultiOffers;

  return {
    // Étape 1 : Calcul du coût de base
    calculateBaseCost,
    baseCostResult,
    isCalculatingBaseCost,

    // Étape 2 : Génération des 6 offres
    calculateMultiOffers,
    multiOffers,
    isCalculatingMultiOffers,

    // Flux complet séquentiel
    calculateFullQuote,

    // Calcul avec debounce
    calculateWithDebounce,

    // Compatibilité avec useRealTimePricing
    calculatedPrice,
    priceDetails,
    isPriceLoading,

    // Erreurs
    error,
  };
};
