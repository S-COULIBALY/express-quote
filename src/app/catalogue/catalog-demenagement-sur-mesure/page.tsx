"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FormGenerator,
  type FormGeneratorRef,
} from "@/components/form-generator";
import { FormStylesSimplified } from "@/components/form-generator/styles/FormStylesSimplified";
import { globalFormPreset } from "@/components/form-generator/presets/_shared/globalPreset";
import { getDemenagementSurMesureServiceConfig } from "@/components/form-generator/presets/demenagement-sur-mesure-service";
import { transformCatalogDataToDemenagementSurMesure } from "@/utils/catalogTransformers";
import { useModularQuotation } from "@/hooks/shared/useModularQuotation";
import { useUnifiedSubmission } from "@/hooks/generic/useUnifiedSubmission";
import { createDemenagementSurMesureSubmissionConfig } from "@/hooks/business";
import { toast } from "react-hot-toast";
import { ServicesNavigation } from "@/components/ServicesNavigation";
import { PriceProvider, usePrice } from "@/components/PriceProvider";
import { MultiOffersDisplay } from "@/components/MultiOffersDisplay";
import {
  INSURANCE_CONFIG,
  calculateInsurancePremium,
  formatInsuranceRate,
} from "@/quotation-module/config/insurance.config";
import { useCrossSellingOptional } from "@/contexts";

// Import CSS externe pour les styles mobile (évite les problèmes de minification Vercel)
import "@/styles/form-compact-mobile.css";

// Service initial (simulation des données catalogue)
const initialService = {
  id: "demenagement-sur-mesure",
  name: "Déménagement Sur Mesure",
  description: "Service de déménagement personnalisé selon vos besoins",
  price: null, // Prix calculé dynamiquement
  duration: null, // Durée calculée selon volume
  workers: null, // Nombre de travailleurs calculé selon besoins
  features: ["Service personnalisé", "Devis adapté"],
  includes: ["Étude gratuite", "Options modulables"],
  serviceType: "demenagement-sur-mesure",
  isPremium: true,
  requiresVolume: true,
  requiresCustomPricing: true,
  isDynamicPricing: true,
};

// ✅ Composant pour mettre à jour le PriceProvider avec le prix calculé
const PriceUpdater: React.FC<{
  quotation: ReturnType<typeof useModularQuotation>;
  selectedScenario: string | null;
}> = ({ quotation, selectedScenario }) => {
  const { updatePrice } = usePrice();

  useEffect(() => {
    // Si une variante est sélectionnée, utiliser son prix
    if (selectedScenario && quotation.multiOffers) {
      const selectedQuote = quotation.multiOffers.quotes.find(
        (q) => q.scenarioId === selectedScenario,
      );

      if (selectedQuote && selectedQuote.pricing?.finalPrice) {
        updatePrice(selectedQuote.pricing.finalPrice, {
          scenarioId: selectedScenario,
          selectedQuote: selectedQuote,
          source: "multi-offer",
        });
        return;
      }
    }

    // Sinon, utiliser le prix du devis unique (standard)
    const calculatedPrice = quotation?.calculatedPrice || 0;
    updatePrice(calculatedPrice, {
      ...quotation?.priceDetails,
      source: "standard-quote",
    });
  }, [
    quotation?.calculatedPrice,
    quotation?.priceDetails,
    quotation?.multiOffers,
    selectedScenario,
    updatePrice,
  ]);

  return null;
};

// ✅ Composant interne pour afficher le prix depuis PriceProvider
const PaymentPriceSection: React.FC<{
  fragileProtectionSelected: boolean;
  onFragileProtectionChange: (value: boolean) => void;
  declaredValueInsuranceSelected: boolean;
  onDeclaredValueInsuranceChange: (value: boolean) => void;
  declaredValue: number;
  onDeclaredValueChange: (value: number) => void;
  onSubmit: (options: {
    fragileProtection: boolean;
    declaredValueInsurance: boolean;
    declaredValue: number;
  }) => void;
  isSubmitting: boolean;
  isCalculating?: boolean;
  quotation: ReturnType<typeof useModularQuotation>;
}> = ({
  fragileProtectionSelected,
  onFragileProtectionChange,
  declaredValueInsuranceSelected,
  onDeclaredValueInsuranceChange,
  declaredValue,
  onDeclaredValueChange,
  onSubmit,
  isSubmitting,
  isCalculating = false,
  quotation,
}) => {
  const { calculatedPrice } = usePrice();

  // Calcul de la prime d'assurance valeur déclarée (source unique de vérité)
  const insurancePremium = declaredValueInsuranceSelected
    ? calculateInsurancePremium(declaredValue)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const totalPrice =
    (calculatedPrice || 0) +
    (fragileProtectionSelected ? 29 : 0) +
    insurancePremium;
  const depositAmount = Math.round(totalPrice * 0.3);
  const hasValidPrice = totalPrice > 0 && !isCalculating;

  const getPriceRange = () => {
    if (
      !quotation.multiOffers?.quotes ||
      quotation.multiOffers.quotes.length === 0
    ) {
      return null;
    }
    const prices = quotation.multiOffers.quotes
      .map((q) => q.pricing?.finalPrice || 0)
      .filter((p) => p > 0);
    if (prices.length === 0) return null;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return {
      min: minPrice,
      max: maxPrice,
      count: quotation.multiOffers.quotes.length,
    };
  };

  const priceRange = getPriceRange();
  const hasMultipleOffers = priceRange && priceRange.count > 1;
  const isCurrentPriceNotMin = hasMultipleOffers && totalPrice > priceRange.min;

  const scrollToMultiOffers = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = document.getElementById("choisissez-votre-formule");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden pb-20 sm:pb-0">
        {/* Section Prix - Compacte */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-emerald-100">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              {hasValidPrice ? (
                <>
                  <span className="text-xl sm:text-2xl md:text-2xl font-bold text-emerald-600">
                    {formatPrice(totalPrice)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 ml-1.5">
                    TTC
                  </span>
                </>
              ) : isCalculating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base text-gray-600">
                    Calcul en cours...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span className="text-sm sm:text-base text-gray-500 italic">
                    Remplissez le formulaire
                  </span>
                  <span className="text-xs sm:text-sm text-gray-400">
                    pour voir le prix
                  </span>
                </div>
              )}
            </div>
            {hasValidPrice && (
              <div className="text-right flex-shrink-0">
                <span className="text-lg sm:text-xl md:text-2xl font-bold text-orange-500">
                  {formatPrice(depositAmount)}
                </span>
                <span className="text-[10px] sm:text-xs text-gray-500 ml-1.5">
                  acompte
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Options */}
        <div className="p-3 sm:p-3 md:p-3 lg:p-2.5 space-y-2.5 sm:space-y-3 md:space-y-2.5">
          {/* Options - Empilées sur mobile, côte à côte sur desktop */}
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-2.5">
            {/* Assurance */}
            <div
              className={`flex-1 border rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm cursor-pointer transition-all min-h-[48px] sm:min-h-auto ${declaredValueInsuranceSelected ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-gray-500 hover:bg-gray-50 hover:border-gray-600"}`}
              onClick={() =>
                onDeclaredValueInsuranceChange(!declaredValueInsuranceSelected)
              }
            >
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={declaredValueInsuranceSelected}
                  onChange={() => {}}
                  className="mt-0.5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      🛡️ Assurance Valeur déclarée
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500">
                      (valeur estimée de vos biens)
                    </span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    Assureur {INSURANCE_CONFIG.INSURER_NAME} • Tout risque (
                    {formatInsuranceRate()})
                  </div>
                  {declaredValueInsuranceSelected && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={declaredValue}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            onDeclaredValueChange(
                              Math.max(0, parseInt(e.target.value) || 0),
                            )
                          }
                          className="w-full px-2.5 py-1.5 pr-7 text-xs sm:text-sm border border-gray-500 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          placeholder="Ex: 15000"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          €
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm text-emerald-600 font-semibold whitespace-nowrap">
                        +{formatPrice(insurancePremium)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fragiles */}
            <div
              className={`flex-1 border rounded-lg p-3 sm:p-2.5 text-xs sm:text-sm cursor-pointer transition-all min-h-[48px] sm:min-h-auto ${fragileProtectionSelected ? "border-emerald-400 bg-emerald-50 shadow-sm" : "border-gray-500 hover:bg-gray-50 hover:border-gray-600"}`}
              onClick={() =>
                onFragileProtectionChange(!fragileProtectionSelected)
              }
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fragileProtectionSelected}
                  onChange={() => {}}
                  className="text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="font-semibold text-gray-900">
                    📦 Assurance Protection objets fragiles
                  </span>
                  <span className="text-xs sm:text-sm text-emerald-600 font-semibold whitespace-nowrap">
                    +29€
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RC Pro - Une ligne */}
          <div className="text-[10px] sm:text-xs text-blue-600 bg-blue-50 rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
            <span className="text-blue-500">✓</span>
            <span>
              <strong>RC Pro incluse</strong> gratuite
            </span>
          </div>

          {/* Bouton - Visible sur desktop uniquement */}
          <button
            onClick={() =>
              onSubmit({
                fragileProtection: fragileProtectionSelected,
                declaredValueInsurance: declaredValueInsuranceSelected,
                declaredValue,
              })
            }
            disabled={isSubmitting || !hasValidPrice}
            className="hidden sm:block w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 sm:py-3 rounded-lg text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-h-[44px] sm:min-h-[48px]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>En cours...</span>
              </span>
            ) : hasValidPrice ? (
              <div className="flex flex-col items-center gap-0.5">
                <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                  <span className="font-semibold">
                    Réserver • {formatPrice(totalPrice)} TTC
                  </span>
                  {hasMultipleOffers && priceRange && (
                    <span
                      onClick={scrollToMultiOffers}
                      className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-medium sm:font-semibold whitespace-nowrap cursor-pointer transition-colors duration-150 opacity-80 sm:opacity-100 flex-shrink-0 leading-none inline-block"
                      aria-label={`Voir les ${priceRange.count - 1} autres formules`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          scrollToMultiOffers(e as unknown as React.MouseEvent);
                        }
                      }}
                    >
                      +{priceRange.count - 1} autres
                    </span>
                  )}
                </div>
                <span className="text-xs font-normal opacity-90">
                  Acompte {formatPrice(depositAmount)}
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm">
                Remplissez le formulaire pour réserver
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Bouton sticky en bas sur mobile */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden z-50 bg-white border-t border-gray-200 shadow-lg">
        {hasValidPrice && hasMultipleOffers && (
          <div
            onClick={scrollToMultiOffers}
            className="px-3 pt-2.5 pb-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <svg
                  className="w-4 h-4 text-orange-600 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-base text-orange-600 font-medium flex-1 min-w-0">
                  💡 Voir les autres propositions{" "}
                  <span className="opacity-60">...</span>
                </span>
              </div>
              <svg
                className="w-4 h-4 text-orange-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        )}
        <div className="px-3 pb-3">
          <button
            onClick={() =>
              onSubmit({
                fragileProtection: fragileProtectionSelected,
                declaredValueInsurance: declaredValueInsuranceSelected,
                declaredValue,
              })
            }
            disabled={isSubmitting || !hasValidPrice}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 min-h-[48px]"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>En cours...</span>
              </span>
            ) : hasValidPrice ? (
              <div className="flex flex-col items-center gap-0.5">
                <div className="inline-flex items-center justify-center gap-1 sm:gap-1.5">
                  <span className="font-semibold">
                    Réserver • {formatPrice(totalPrice)} TTC
                  </span>
                  {hasMultipleOffers && priceRange && (
                    <span
                      onClick={scrollToMultiOffers}
                      className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-[9px] px-1 sm:px-1.5 py-0.5 rounded-full font-medium sm:font-semibold whitespace-nowrap cursor-pointer transition-colors duration-150 opacity-80 sm:opacity-100 flex-shrink-0 leading-none inline-block"
                      aria-label={`Voir les ${priceRange.count - 1} autres formules`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          scrollToMultiOffers(e as unknown as React.MouseEvent);
                        }
                      }}
                    >
                      +{priceRange.count - 1} autres
                    </span>
                  )}
                </div>
                <span className="text-xs font-normal opacity-90">
                  Acompte {formatPrice(depositAmount)}
                </span>
              </div>
            ) : (
              <span className="text-xs">
                Remplissez le formulaire pour réserver
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default function DemenagementSurMesurePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(
    "STANDARD",
  );
  const [fragileProtectionSelected, setFragileProtectionSelected] =
    useState(false);
  const [declaredValueInsuranceSelected, setDeclaredValueInsuranceSelected] =
    useState(false);
  const [declaredValue, setDeclaredValue] = useState<number>(
    INSURANCE_CONFIG.DEFAULT_DECLARED_VALUE,
  );
  const formRef = useRef<FormGeneratorRef>(null);
  const lastFormDataRef = useRef<string>("");

  // Effet pour gérer l'hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 1. Transformation des données catalogue
  const transformedService = transformCatalogDataToDemenagementSurMesure({
    catalogSelection: {
      id: initialService.id,
      category: "DEMENAGEMENT",
      subcategory: "sur-mesure",
      marketingTitle: initialService.name,
      marketingSubtitle: "Service personnalisé",
      marketingDescription: initialService.description,
      marketingPrice: 0,
      isFeatured: true,
      isNewOffer: false,
    },
    item: {
      ...initialService,
      type: "service",
      price: 0, // Prix calculé dynamiquement
      workers: 0, // Calculé selon le volume
      duration: 0, // Calculée selon le volume
      popular: false,
    },
    template: undefined,
    formDefaults: {},
  });

  // 2. Hook de calcul modulaire (remplace useRealTimePricing)
  const quotation = useModularQuotation();

  // Cross-selling context (pour injecter les sélections catalogue à la soumission)
  const crossSelling = useCrossSellingOptional();

  // 3. Écouter les changements du formulaire pour déclencher le calcul (amélioration de la version actuelle)
  useEffect(() => {
    if (!formRef.current) return;

    const interval = setInterval(() => {
      try {
        const formData = formRef.current?.getFormData() || {};
        const formDataString = JSON.stringify(formData);

        // Vérifier si les données ont changé
        if (
          formDataString !== lastFormDataRef.current &&
          Object.keys(formData).length > 0
        ) {
          lastFormDataRef.current = formDataString;

          // Vérifier que les données essentielles sont présentes
          const hasEssentialData =
            formData.departureAddress ||
            formData.arrivalAddress ||
            formData.estimatedVolume != null ||
            formData.movingDate ||
            formData.pickupAddress ||
            formData.deliveryAddress;

          if (hasEssentialData) {
            quotation.calculateWithDebounce(formData);
          }
        }
      } catch (error) {
        // Ignorer les erreurs silencieusement
      }
    }, 1000); // Vérifier toutes les secondes

    return () => clearInterval(interval);
  }, [quotation]);

  // Calcul initial au chargement si le formulaire a déjà des données
  useEffect(() => {
    if (formRef.current) {
      const formData = formRef.current.getFormData();
      // Vérifier si on a au moins les données minimales pour calculer
      if (
        formData &&
        (formData.pickupAddress ||
          formData.deliveryAddress ||
          formData.estimatedVolume != null ||
          formData.departureAddress ||
          formData.arrivalAddress)
      ) {
        quotation.calculateWithDebounce(formData);
      }
    }
  }, []); // Une seule fois au montage

  // 4. Hook de soumission unifié
  const submissionConfig = createDemenagementSurMesureSubmissionConfig(
    transformedService,
    quotation.multiOffers?.distanceKm || 0,
  );

  const submissionHook = useUnifiedSubmission(
    submissionConfig,
    quotation.calculatedPrice,
  );

  // 5. Handlers
  const handlePriceCalculated = async (price: number, details: any) => {
    // Récupérer les données du formulaire et calculer avec le système modulaire
    const formData = formRef.current?.getFormData() || {};

    // Utiliser le debounce pour éviter trop d'appels API
    quotation.calculateWithDebounce(formData);
  };

  const handleSelectOffer = useCallback((scenarioId: string) => {
    setSelectedScenario(scenarioId);
    toast.success(`Formule ${scenarioId} sélectionnée`);
  }, []);

  const handleSubmitFromPaymentCard = async (options: {
    fragileProtection: boolean;
    declaredValueInsurance: boolean;
    declaredValue: number;
  }) => {
    setIsSubmitting(true);
    try {
      // Récupérer les données du formulaire
      const formData = formRef.current?.getFormData() || {};

      // ✅ Enrichir avec les sélections cross-selling du catalogue (même logique que useModularQuotation)
      // Sans cet enrichissement, les services sélectionnés (emballage, démontage, etc.) seraient perdus
      let enrichedFormData = { ...formData };
      if (crossSelling) {
        const pricingData = crossSelling.getSelectionForPricing();
        enrichedFormData = {
          ...enrichedFormData,
          // Services cross-selling (flags pour les modules côté serveur)
          packing: formData.packing || pricingData.packing,
          dismantling: formData.dismantling || pricingData.dismantling,
          reassembly: formData.reassembly || pricingData.reassembly,
          cleaningEnd: formData.cleaningEnd || pricingData.cleaningEnd,
          temporaryStorage: formData.temporaryStorage || pricingData.storage,
          storageDurationDays: formData.storageDurationDays || crossSelling.formContext?.storageDurationDays,
          // Objets spéciaux
          piano: formData.piano || pricingData.hasPiano,
          safe: formData.safe || pricingData.hasSafe,
          artwork: formData.artwork || pricingData.hasArtwork,
          // Fournitures
          crossSellingSuppliesTotal: pricingData.suppliesTotal,
          crossSellingSuppliesDetails: pricingData.suppliesDetails,
          crossSellingServicesTotal: pricingData.servicesTotal,
          crossSellingGrandTotal: pricingData.grandTotal,
        };
      }

      // Calculer la prime d'assurance si sélectionnée (source unique de vérité)
      const insurancePremium = options.declaredValueInsurance
        ? calculateInsurancePremium(options.declaredValue)
        : 0;

      // ✅ Récupérer le prix du scénario sélectionné depuis multiOffers
      let scenarioPrice = quotation.calculatedPrice; // Fallback sur le prix recommandé
      if (selectedScenario && quotation.multiOffers) {
        const selectedQuote = quotation.multiOffers.quotes.find(
          (q) => q.scenarioId === selectedScenario,
        );
        if (selectedQuote?.pricing?.finalPrice) {
          scenarioPrice = selectedQuote.pricing.finalPrice;
        }
      }

      // ✅ Calculer le prix total avec les options d'assurance (correspond au prix affiché)
      const fragileProtectionAmount = options.fragileProtection ? 29 : 0;
      const totalPriceWithOptions =
        scenarioPrice + fragileProtectionAmount + insurancePremium;

      // Ajouter les options et le scénario sélectionné
      const dataWithOptions = {
        ...enrichedFormData,
        // ✅ Prix du scénario sélectionné (base, sans options d'assurance)
        calculatedPrice: scenarioPrice,
        // ✅ Prix total avec options d'assurance (correspond au prix affiché dans PaymentPriceSection)
        totalPrice: totalPriceWithOptions,
        // Protection objets fragiles
        fragileProtection: options.fragileProtection,
        fragileProtectionAmount: fragileProtectionAmount,
        // Assurance valeur déclarée (optionnelle)
        declaredValueInsurance: options.declaredValueInsurance,
        declaredValue: options.declaredValueInsurance
          ? options.declaredValue
          : 0,
        insurancePremium: insurancePremium,
        // Scénario sélectionné
        selectedScenario: selectedScenario || "STANDARD",
      };

      await submissionHook.submit(dataWithOptions);
      toast.success("Demande créée avec succès !");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la demande";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSuccess = async (data: any) => {
    // Appelé par le bouton invisible du FormGenerator
    setIsSubmitting(true);
    try {
      await submissionHook.submit(data);
      toast.success("Demande créée avec succès !");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erreur lors de la création de la demande";
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleError = (_error: unknown) => {
    toast.error("Une erreur est survenue. Veuillez réessayer.");
  };

  // 6. Configuration du formulaire avec le preset
  const formConfig = getDemenagementSurMesureServiceConfig({
    service: transformedService,
    onPriceCalculated: handlePriceCalculated,
    onSubmitSuccess: handleSubmitSuccess,
    onError: handleError,
  });

  // Éviter le rendu pendant l'hydration
  if (!isClient) {
    return null;
  }

  return (
    <div className="form-generator min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 font-ios">
      {/* 🎨 Styles iOS 18 simplifiés */}
      <FormStylesSimplified globalConfig={globalFormPreset} />

      {/* Barre de navigation principale */}

      {/* Barre de navigation des services */}
      <ServicesNavigation />

      {/* Section promotionnelle compacte - Optimisée mobile first */}
      <div className="bg-white border-b border-gray-200 pt-12 sm:pt-16 lg:pt-20">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-3">
            {/* Texte promotionnel principal */}
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 mb-1 sm:mb-1.5">
                <span className="sm:hidden">⭐ Devis instantané</span>
                <span className="hidden sm:inline">
                  ⭐ Déménagement Sur Mesure - Devis Instantané !
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl">
                <span className="sm:hidden">
                  Configurez et obtenez votre prix en temps réel.
                </span>
                <span className="hidden sm:inline">
                  Service personnalisé selon vos besoins avec tarification
                  transparente.
                </span>
              </p>
              {/* Indicateur de calcul en temps réel */}
              {quotation.isPriceLoading && (
                <div className="mt-1.5 flex items-center justify-center lg:justify-start gap-1.5 text-xs sm:text-sm text-emerald-600">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>Calcul en cours...</span>
                </div>
              )}
            </div>

            {/* Encart promotionnel - version compacte sur mobile, complète sur desktop */}
            <div className="flex items-center gap-2">
              <div className="lg:hidden bg-gradient-to-r from-orange-500 to-red-600 text-white px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg shadow-md">
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-lg">💰</span>
                  <span className="text-xs sm:text-sm font-medium">
                    Temps réel
                  </span>
                </div>
              </div>
              <div className="hidden lg:block bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-lg shadow-lg">
                <div className="text-center">
                  <div className="text-lg font-bold">💰</div>
                  <div className="text-xs font-medium">Prix en temps réel</div>
                  <div className="text-xs opacity-90">
                    Mise à jour instantanée
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout 2 colonnes (40/60) - Mobile first optimisé */}
      {/* Sur mobile : 100% viewport (pas de padding) comme la section "Devis instantané" */}
      <div className="w-full px-0 sm:px-4 md:px-5 lg:px-6 mt-3 sm:mt-4 md:mt-5 lg:mt-6">
        <PriceProvider initialPrice={0}>
          <PriceUpdater
            quotation={quotation}
            selectedScenario={selectedScenario}
          />
          <div className="w-full max-w-7xl lg:max-w-[1600px] mx-auto">
            {/* Mobile: formulaire en haut, offres en bas | Desktop: 40% formulaire / 60% offres */}
            {/* Note: lg: = 1024px. Layout 2 colonnes activé uniquement à partir de 1024px pour éviter les colonnes trop serrées */}
            {/* Styles externalisés dans @/styles/form-compact-mobile.css pour éviter les problèmes de minification Vercel */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-3 sm:gap-4 md:gap-5 lg:gap-6 form-layout-grid">
              {/* Colonne gauche (40% sur desktop) - Formulaire de réservation */}
              <div className="w-full order-1 lg:order-1">
                <div className="lg:sticky lg:top-4">
                  {/* Sur mobile : padding horizontal pour le contenu, mais pas de padding sur le conteneur parent */}
                  {/* Styles externalisés dans @/styles/form-compact-mobile.css pour éviter les problèmes de minification Vercel */}
                  <div
                    id="form-compact-fields"
                    className="bg-white border-t border-b sm:border sm:rounded-lg border-gray-200 shadow-sm p-3 sm:p-4 md:p-4 lg:p-4 form-compact-fields"
                  >
                    <FormGenerator
                      ref={formRef}
                      config={{
                        ...formConfig,
                        isLoading: isSubmitting,
                        hideDefaultSubmit: true,
                        layout: {
                          ...formConfig.layout,
                          showPriceCalculation: true,
                          showConstraintsByAddress: true,
                          showModificationsSummary: true,
                          serviceInfo: {
                            name: transformedService.name,
                            description: transformedService.description,
                            icon: "🚛",
                            features: transformedService.includes,
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Colonne droite (60% sur desktop) - Multi-offres et paiement */}
              <div className="w-full order-2 lg:order-2">
                <div className="lg:sticky lg:top-4 space-y-3 sm:space-y-4 md:space-y-4">
                  {/* Multi-offres (6 variantes) */}
                  {quotation.multiOffers ? (
                    <div
                      data-multi-offers
                      className="bg-white border-t border-b sm:border sm:rounded-lg border-gray-200 shadow-sm p-0 sm:p-3 md:p-3 lg:p-4"
                    >
                      <MultiOffersDisplay
                        multiOffers={quotation.multiOffers}
                        isCalculating={
                          quotation.isCalculatingMultiOffers ||
                          quotation.isPriceLoading
                        }
                        selectedScenario={selectedScenario}
                        onSelectOffer={handleSelectOffer}
                        getFormData={() => formRef.current?.getFormData() ?? {}}
                      />
                    </div>
                  ) : quotation.isCalculatingMultiOffers ||
                    quotation.isPriceLoading ? (
                    <div className="bg-white border-t border-b sm:border sm:rounded-lg border-gray-200 shadow-sm p-4 sm:p-5 md:p-6">
                      <div className="text-center text-gray-600">
                        <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-emerald-600 mx-auto mb-3"></div>
                        <div className="text-sm sm:text-base font-medium">
                          Calcul des offres en cours...
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">
                          Veuillez patienter quelques instants
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Section paiement - Options et actions - Toujours visible */}
                  <PaymentPriceSection
                    fragileProtectionSelected={fragileProtectionSelected}
                    onFragileProtectionChange={setFragileProtectionSelected}
                    declaredValueInsuranceSelected={
                      declaredValueInsuranceSelected
                    }
                    onDeclaredValueInsuranceChange={
                      setDeclaredValueInsuranceSelected
                    }
                    declaredValue={declaredValue}
                    onDeclaredValueChange={setDeclaredValue}
                    onSubmit={handleSubmitFromPaymentCard}
                    isSubmitting={isSubmitting}
                    isCalculating={quotation.isPriceLoading}
                    quotation={quotation}
                  />
                </div>
              </div>
            </div>
          </div>
        </PriceProvider>
      </div>

      {/* Section avantages - Compacte optimisée mobile */}
      <section className="bg-gradient-to-br from-emerald-50 to-green-50 py-3 sm:py-5 md:py-6 lg:py-8 mt-3 sm:mt-5 md:mt-6 lg:mt-8 border-t border-emerald-100 animate-fade-in-up">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-6 lg:px-8">
          {/* En-tête de la section compact */}
          <div className="text-center mb-3 sm:mb-5 md:mb-6 lg:mb-8">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-100 text-emerald-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
              <span>✨</span>
              Nos Garanties
            </div>
            <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              Une expérience de service exceptionnelle
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-base text-gray-600 max-w-2xl mx-auto px-2 sm:px-0">
              Profitez d'un service professionnel avec des garanties qui font la
              différence
            </p>
          </div>

          {/* Grille des avantages compacte */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {/* Réservation instantanée */}
            <div className="group bg-white rounded-xl p-3 sm:p-4 md:p-4 lg:p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg md:text-xl text-white">
                  ⚡
                </span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Réservation instantanée
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-sm">
                Réservez en quelques clics et recevez votre confirmation
                immédiatement
              </p>
            </div>

            {/* RC Pro incluse (gratuite) */}
            <div
              className="group bg-white rounded-xl p-3 sm:p-4 md:p-4 lg:p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg md:text-xl text-white">
                  🛡️
                </span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                RC Pro incluse
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-sm">
                Responsabilité civile professionnelle incluse gratuitement
                (couverture de base)
              </p>
            </div>

            {/* Service premium */}
            <div
              className="group bg-white rounded-xl p-3 sm:p-4 md:p-4 lg:p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-3 lg:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg md:text-xl text-white">
                  ⭐
                </span>
              </div>
              <h3 className="text-sm sm:text-base md:text-lg lg:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Service premium
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm md:text-sm">
                Équipe professionnelle formée avec matériel de qualité
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
