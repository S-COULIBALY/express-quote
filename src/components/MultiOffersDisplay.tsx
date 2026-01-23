/**
 * MultiOffersDisplay - Affiche les 6 variantes de devis (multi-offres)
 *
 * Composant pour afficher les offres ECO, STANDARD, CONFORT, PREMIUM, SÉCURITÉ+, FLEX
 * Avec recommandation intelligente basée sur le contexte client
 *
 * AMÉLIORATIONS :
 * - Badges "Services inclus" sur chaque carte
 * - Section "Détails" expandable
 * - Mode tableau comparatif
 * - Correction SECURITY → SECURITY_PLUS
 * - Réorganisation de l'affichage
 * - Tooltips pour services conditionnels
 */

"use client";

import React, { useState } from "react";
import { MultiOffersResult } from "@/hooks/shared/useModularQuotation";
import {
  getScenarioServices,
  getIncludedServicesLabels,
  getServiceStatus,
  type ScenarioServices,
} from "./scenarioServicesHelper";

interface MultiOffersDisplayProps {
  multiOffers: MultiOffersResult | null;
  isCalculating: boolean;
  selectedScenario?: string | null;
  onSelectOffer?: (scenarioId: string) => void;
}

// Ordre d'affichage des scénarios (progression ECO → PREMIUM)
const SCENARIO_ORDER = [
  "ECO",
  "STANDARD",
  "CONFORT",
  "PREMIUM",
  "SECURITY_PLUS",
  "SECURITY",
  "FLEX",
];

export const MultiOffersDisplay: React.FC<MultiOffersDisplayProps> = ({
  multiOffers,
  isCalculating,
  selectedScenario,
  onSelectOffer,
}) => {
  const [showRecommendationDetails, setShowRecommendationDetails] =
    useState(false);
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const getScenarioIcon = (scenarioId: string) => {
    switch (scenarioId) {
      case "ECO":
        return "💰";
      case "STANDARD":
        return "⭐";
      case "CONFORT":
        return "🏆";
      case "SECURITY_PLUS":
      case "SECURITY": // Support de l'ancien nom pour compatibilité
        return "🛡️";
      case "PREMIUM":
        return "👑";
      case "FLEX":
        return "🔄";
      default:
        return "📦";
    }
  };

  const getScenarioColor = (scenarioId: string) => {
    switch (scenarioId) {
      case "ECO":
        return "border-green-200 bg-green-50";
      case "STANDARD":
        return "border-blue-200 bg-blue-50";
      case "CONFORT":
        return "border-purple-200 bg-purple-50";
      case "SECURITY_PLUS":
      case "SECURITY":
        return "border-orange-200 bg-orange-50";
      case "PREMIUM":
        return "border-yellow-200 bg-yellow-50";
      case "FLEX":
        return "border-indigo-200 bg-indigo-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const getConfidenceBadge = (
    confidence: "LOW" | "MEDIUM" | "HIGH" | undefined,
  ) => {
    switch (confidence) {
      case "HIGH":
        return {
          text: "Confiance élevée",
          className: "bg-green-100 text-green-800",
        };
      case "MEDIUM":
        return {
          text: "Confiance moyenne",
          className: "bg-yellow-100 text-yellow-800",
        };
      case "LOW":
        return {
          text: "Confiance faible",
          className: "bg-red-100 text-red-800",
        };
      default:
        return null;
    }
  };

  const getServiceStatusIcon = (
    status: "included" | "optional" | "disabled" | "conditional",
  ) => {
    switch (status) {
      case "included":
        return "✅";
      case "optional":
        return "⚙️";
      case "disabled":
        return "❌";
      case "conditional":
        return "⭕*";
      default:
        return "";
    }
  };

  const getRecommendationMessage = (scenarioId: string): string => {
    switch (scenarioId) {
      case "ECO":
        return "Vous gérez vous-même l'emballage";
      case "STANDARD":
        return "On s'occupe de l'essentiel pour vous";
      case "CONFORT":
        return "On prend tout en charge, vous vous détendez";
      case "PREMIUM":
        return "Tout est géré, vous n'avez rien à faire";
      case "SECURITY_PLUS":
      case "SECURITY":
        return "Protection totale, zéro stress";
      case "FLEX":
        return "Adapté 100% à vos contraintes, sans effort";
      default:
        return "";
    }
  };

  if (isCalculating && !multiOffers) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="text-center text-gray-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          <div className="text-sm">Calcul des offres en cours...</div>
        </div>
      </div>
    );
  }

  if (!multiOffers || !multiOffers.quotes || multiOffers.quotes.length === 0) {
    return null;
  }

  const { quotes, comparison } = multiOffers;
  const hasSmartRecommendation =
    comparison.recommendedReasons && comparison.recommendedReasons.length > 0;
  const confidenceBadge = getConfidenceBadge(comparison.recommendedConfidence);

  // Trier les quotes selon l'ordre défini
  const sortedQuotes = [...quotes].sort((a, b) => {
    const indexA = SCENARIO_ORDER.indexOf(a.scenarioId);
    const indexB = SCENARIO_ORDER.indexOf(b.scenarioId);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Tous les services pour le tableau comparatif
  const allServices = [
    { id: "packing", label: "Emballage" },
    { id: "supplies", label: "Fournitures" },
    { id: "dismantling", label: "Démontage" },
    { id: "reassembly", label: "Remontage" },
    { id: "high-value", label: "Objets de valeur" },
    { id: "insurance", label: "Assurance renforcée" },
    { id: "cleaning", label: "Nettoyage" },
    { id: "furniture-lift", label: "Monte-meubles" },
    { id: "overnight", label: "Étape / nuit" },
    { id: "flexibility", label: "Flexibilité équipe" },
  ];

  return (
    <div className="space-y-3 p-3 sm:p-0 md:p-0">
      {/* En-tête - Sticky sur mobile */}
      <div className="sticky top-[108px] sm:static z-20 bg-white pb-2 sm:pb-0 border-b border-gray-200 sm:border-0 mb-2 sm:mb-0 -mx-3 sm:mx-0 px-3 sm:px-0 pt-2 sm:pt-0 -mt-3 sm:mt-0 shadow-sm sm:shadow-none relative">
        <div className="text-center sm:text-left">
          <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-0.5">
            🎯 Choisissez votre formule
          </h3>
          <p className="text-xs sm:text-sm text-gray-600">
            {comparison.priceRange.min > 0 && comparison.priceRange.max > 0 && (
              <>
                Prix de {formatPrice(comparison.priceRange.min)} à{" "}
                {formatPrice(comparison.priceRange.max)}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Bandeau de recommandation intelligente - Défile normalement */}
      {hasSmartRecommendation && comparison.recommended && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-2 sm:p-2.5 md:p-3 relative z-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* Message simplifié sur petits écrans */}
              <div className="sm:hidden">
                <div className="flex items-center gap-1.5">
                  <span className="text-base flex-shrink-0">🎯</span>
                  <span className="font-semibold text-emerald-800 text-[11px] leading-tight">
                    6 formules adaptées à votre situation. Choisissez celle qui
                    vous convient le mieux.
                  </span>
                </div>
              </div>

              {/* Message détaillé sur desktop */}
              <div className="hidden sm:block">
                <div className="flex items-start gap-1.5 mb-0.5">
                  <span className="text-base sm:text-lg flex-shrink-0 mt-0.5">
                    🎯
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-emerald-800 text-xs sm:text-xs md:text-sm leading-tight">
                      Parmis les 6 propositions de prix adaptée à votre
                      situation : La Formule{" "}
                      {quotes.find(
                        (q) => q.scenarioId === comparison.recommended,
                      )?.label || comparison.recommended}{" "}
                      semble la meilleure option pour vous.
                    </span>
                    {confidenceBadge && (
                      <span
                        className={`ml-2 text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center ${confidenceBadge.className}`}
                      >
                        {confidenceBadge.text}
                      </span>
                    )}
                  </div>
                </div>

                {/* Raisons principales */}
                <div className="text-[10px] sm:text-xs text-emerald-700 ml-0 sm:ml-6 mt-0.5">
                  <p className="leading-snug">
                    {comparison.recommendedReasons &&
                    comparison.recommendedReasons.length > 0
                      ? `Voici les raisons: ${comparison.recommendedReasons.slice(0, showRecommendationDetails ? undefined : 2).join(". ")}${comparison.recommendedReasons.length > 2 && !showRecommendationDetails ? "..." : ""}`
                      : "Recommandé pour votre situation"}
                  </p>
                </div>

                {/* Bouton voir plus/moins */}
                {(comparison.recommendedReasons?.length || 0) > 2 && (
                  <button
                    onClick={() =>
                      setShowRecommendationDetails(!showRecommendationDetails)
                    }
                    className="text-[9px] sm:text-[10px] text-emerald-600 hover:text-emerald-800 mt-0.5 ml-0 sm:ml-6 underline"
                  >
                    {showRecommendationDetails
                      ? "Voir moins"
                      : `+ ${(comparison.recommendedReasons?.length || 0) - 2} autres raisons`}
                  </button>
                )}

                {/* Alternative */}
                {comparison.alternative &&
                  comparison.alternativeReasons &&
                  showRecommendationDetails && (
                    <div className="mt-1.5 pt-1.5 border-t border-emerald-200">
                      <div className="text-[10px] sm:text-xs text-emerald-600">
                        <span className="font-medium">Alternative : </span>
                        {quotes.find(
                          (q) => q.scenarioId === comparison.alternative,
                        )?.label || comparison.alternative}
                        <ul className="mt-0.5 space-y-0.5 ml-4">
                          {comparison.alternativeReasons.map(
                            (reason, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-1 text-emerald-500"
                              >
                                <span>•</span>
                                <span>{reason}</span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle vue - Juste après la recommandation */}
      <div className="flex items-center justify-center gap-2 -mx-3 sm:mx-0 px-3 sm:px-0">
        <button
          onClick={() => setViewMode("table")}
          className={`px-2.5 py-1.5 sm:px-2.5 md:px-2 sm:py-1 md:py-1 text-xs sm:text-xs md:text-sm rounded transition-colors min-h-[36px] sm:min-h-[32px] md:min-h-auto ${
            viewMode === "table"
              ? "bg-emerald-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          📊 Tableau
        </button>
        <button
          onClick={() => setViewMode("cards")}
          className={`px-2.5 py-1.5 sm:px-2.5 md:px-2 sm:py-1 md:py-1 text-xs sm:text-xs md:text-sm rounded transition-colors min-h-[36px] sm:min-h-[32px] md:min-h-auto ${
            viewMode === "cards"
              ? "bg-emerald-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          📋 Cartes
        </button>
      </div>

      {/* Mode Tableau Comparatif */}
      {viewMode === "table" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Indicateur de scroll horizontal sur mobile */}
          <div className="sm:hidden bg-blue-50 border-b border-blue-200 px-3 py-2 text-center">
            <p className="text-[10px] text-blue-700 flex items-center justify-center gap-1">
              <span>👈</span>
              <span>Faites glisser pour voir toutes les formules</span>
              <span>👉</span>
            </p>
          </div>
          <div className="overflow-x-auto -mx-3 sm:mx-0 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <table className="w-full text-[10px] sm:text-xs md:text-sm border-collapse min-w-[500px] sm:min-w-[600px]">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-1.5 sm:p-2 md:p-3 border-b border-gray-500 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-30 min-w-[90px] sm:min-w-[100px] pl-3 sm:pl-2 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                    Service
                  </th>
                  {sortedQuotes.map((quote) => {
                    const isSelected = quote.scenarioId === selectedScenario;
                    return (
                      <th
                        key={quote.scenarioId}
                        onClick={() =>
                          !isCalculating && onSelectOffer?.(quote.scenarioId)
                        }
                        className={`text-center p-1 sm:p-2 md:p-3 border-b border-gray-500 font-semibold cursor-pointer transition-colors min-w-[70px] sm:min-w-[90px] ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                            : "text-gray-700 hover:bg-gray-100"
                        } ${isCalculating ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <div className="flex flex-col items-center gap-0.5 sm:gap-1 md:gap-1.5">
                          {/* Checkbox visible par défaut */}
                          <div
                            className={`flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded border-2 flex-shrink-0 ${
                              isSelected
                                ? "bg-emerald-500 border-emerald-500"
                                : "bg-white border-gray-600"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm sm:text-base md:text-lg leading-none">
                            {getScenarioIcon(quote.scenarioId)}
                          </span>
                          <span className="text-[9px] sm:text-xs md:text-sm leading-tight line-clamp-2 text-center">
                            {quote.label}
                          </span>
                          <span className="text-[9px] sm:text-[10px] md:text-xs font-normal text-gray-600 leading-tight">
                            {formatPrice(quote.pricing.finalPrice)}
                          </span>
                          {isSelected && (
                            <span className="bg-emerald-600 text-white text-[8px] sm:text-[9px] md:text-[10px] font-semibold px-1 py-0.5 rounded-full whitespace-nowrap mt-0.5">
                              ✓
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Ligne Recommandations */}
                <tr className="bg-emerald-50 border-b-2 border-emerald-200">
                  <td className="p-1.5 sm:p-2 md:p-3 border-b border-gray-400 font-semibold text-emerald-900 sticky left-0 bg-emerald-50 z-30 text-[10px] sm:text-xs md:text-sm min-w-[90px] sm:min-w-[100px] pl-3 sm:pl-2 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                    <span className="flex items-center gap-1">
                      <span>🎯</span>
                      <span className="hidden sm:inline">Recommandations</span>
                      <span className="sm:hidden">Recommandé</span>
                    </span>
                  </td>
                  {sortedQuotes.map((quote) => {
                    const isSelected = quote.scenarioId === selectedScenario;
                    const recommendationMessage = getRecommendationMessage(
                      quote.scenarioId,
                    );
                    return (
                      <td
                        key={quote.scenarioId}
                        className={`text-center p-1.5 sm:p-2 md:p-3 border-b border-gray-400 min-w-[70px] sm:min-w-[90px] ${
                          isSelected
                            ? "bg-emerald-100 font-semibold"
                            : "bg-white"
                        }`}
                      >
                        <span
                          className={`text-[8px] sm:text-[9px] md:text-[10px] leading-tight px-1 italic ${
                            isSelected
                              ? "text-emerald-700 font-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {recommendationMessage}
                        </span>
                      </td>
                    );
                  })}
                </tr>
                {allServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="p-1.5 sm:p-2 md:p-3 border-b border-gray-400 font-medium text-gray-900 sticky left-0 bg-white z-30 text-[10px] sm:text-xs md:text-sm min-w-[90px] sm:min-w-[100px] pl-3 sm:pl-2 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                      {service.id === "furniture-lift" ? (
                        <div className="group relative">
                          <span className="line-clamp-2">{service.label}</span>
                          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-40">
                            <div className="bg-gray-900 text-white text-[10px] sm:text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                              Recommandé automatiquement si étage ≥3 ou ≥5
                              <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="line-clamp-2">{service.label}</span>
                      )}
                    </td>
                    {sortedQuotes.map((quote) => {
                      const status = getServiceStatus(
                        service.id,
                        quote.scenarioId,
                      );
                      return (
                        <td
                          key={quote.scenarioId}
                          className={`text-center p-1.5 sm:p-2 md:p-3 border-b border-gray-400 min-w-[70px] sm:min-w-[90px] ${
                            quote.scenarioId === selectedScenario
                              ? "bg-emerald-50"
                              : ""
                          }`}
                        >
                          {status ? (
                            <span
                              className="text-sm sm:text-base md:text-lg inline-block"
                              title={
                                status === "included"
                                  ? "Inclus d'office"
                                  : status === "optional"
                                    ? "Disponible en option"
                                    : status === "disabled"
                                      ? "Non disponible"
                                      : "Conditionnel technique"
                              }
                            >
                              {getServiceStatusIcon(status)}
                            </span>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td className="p-2 sm:p-2 md:p-3 border-t border-gray-500 font-semibold text-gray-900 sticky left-0 bg-gray-50 z-30 text-[10px] sm:text-xs md:text-sm pl-3 sm:pl-2 shadow-[2px_0_4px_rgba(0,0,0,0.1)]">
                    <span className="hidden sm:inline">Sélectionner</span>
                    <span className="sm:hidden">Sélection</span>
                  </td>
                  {sortedQuotes.map((quote) => {
                    const isSelected = quote.scenarioId === selectedScenario;
                    return (
                      <td
                        key={quote.scenarioId}
                        className="p-2 sm:p-2 md:p-3 border-t border-gray-500 text-center"
                      >
                        <button
                          onClick={() =>
                            !isCalculating && onSelectOffer?.(quote.scenarioId)
                          }
                          disabled={isCalculating}
                          className={`w-full px-1 sm:px-3 md:px-4 py-1 sm:py-2 md:py-2.5 text-[8px] sm:text-[10px] md:text-xs font-semibold rounded transition-all duration-200 leading-tight ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-md hover:bg-emerald-700"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          } ${isCalculating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {isSelected ? `✓ ${quote.label}` : quote.label}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-2 sm:p-3 md:p-4 bg-gray-50 border-t border-gray-500">
            <div className="text-[9px] sm:text-[10px] md:text-xs text-gray-600 space-y-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-semibold">Légende :</span>
                <span>✅ Inclus</span>
                <span>⚙️ Option</span>
                <span>❌ Non dispo</span>
                <span className="hidden sm:inline">⭕* Conditionnel</span>
                <span className="sm:hidden">⭕* Cond.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Cartes */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-3 lg:gap-4">
          {sortedQuotes.map((quote) => {
            const isRecommended = quote.scenarioId === comparison.recommended;
            const isAlternative = quote.scenarioId === comparison.alternative;
            const isCheapest = quote.scenarioId === comparison.cheapest;
            const isSelected = quote.scenarioId === selectedScenario;
            const isExpanded = expandedScenario === quote.scenarioId;

            // Trouver le score pour ce scénario
            const scenarioScore = comparison.scores?.find(
              (s) => s.scenarioId === quote.scenarioId,
            );

            // Obtenir les services pour ce scénario
            const scenarioServices = getScenarioServices(quote.scenarioId);
            const includedLabels = getIncludedServicesLabels(quote.scenarioId);

            return (
              <div
                key={quote.scenarioId}
                className={`
                  relative rounded-lg border-2 p-3 sm:p-3 md:p-3 lg:p-4 cursor-pointer transition-all duration-200
                  ${getScenarioColor(quote.scenarioId)}
                  ${isSelected ? "ring-2 ring-emerald-500 ring-offset-1 shadow-md border-emerald-500" : ""}
                  ${isRecommended && !isSelected ? "ring-2 ring-emerald-400 ring-offset-1 shadow-md border-emerald-400" : ""}
                  ${isAlternative && !isSelected && !isRecommended ? "ring-1 ring-teal-300 shadow-sm" : ""}
                  hover:shadow-md hover:-translate-y-0.5
                  ${isCalculating ? "opacity-50 pointer-events-none" : ""}
                `}
                onClick={() =>
                  !isCalculating && onSelectOffer?.(quote.scenarioId)
                }
              >
                {/* Badge recommandé en haut */}
                {isRecommended && !isSelected && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
                    🎯 Recommandé pour vous
                  </div>
                )}

                {/* Badge alternative */}
                {isAlternative && !isSelected && !isRecommended && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-teal-400 text-white text-[9px] sm:text-[10px] font-medium px-2 sm:px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap z-10">
                    Alternative
                  </div>
                )}

                {/* En-tête avec icône et nom */}
                <div className="flex items-start justify-between mb-1.5 mt-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {/* Checkbox visible par défaut */}
                    <div
                      className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex-shrink-0 ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-500"
                          : "bg-white border-gray-600"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="text-lg flex-shrink-0">
                      {getScenarioIcon(quote.scenarioId)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm sm:text-base text-gray-900 leading-tight">
                        {quote.scenarioId === "SECURITY"
                          ? "Sécurité+"
                          : quote.label}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-600 leading-tight line-clamp-1">
                        {quote.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse whitespace-nowrap ml-1 flex-shrink-0">
                      ✓ Sélectionné
                    </span>
                  )}
                  {!isSelected && isCheapest && !isRecommended && (
                    <span className="bg-green-500 text-white text-[9px] sm:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ml-1 flex-shrink-0">
                      💰 Moins cher
                    </span>
                  )}
                </div>

                {/* Prix */}
                <div className="text-center py-1.5 sm:py-2">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    {formatPrice(quote.pricing.finalPrice)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-600 mt-0.5">
                    {quote.logistics.workersCount} déménageur
                    {quote.logistics.workersCount > 1 ? "s" : ""}
                  </div>
                  {isCalculating && (
                    <div className="mt-1">
                      <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-emerald-600 mx-auto"></div>
                    </div>
                  )}
                </div>

                {/* Services inclus - NOUVEAU */}
                {includedLabels.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-500">
                    <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-700 mb-1">
                      ✅ Inclus dans cette formule :
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {includedLabels.slice(0, 4).map((label, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-100 text-emerald-700 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded"
                        >
                          {label}
                        </span>
                      ))}
                      {includedLabels.length > 4 && (
                        <span className="bg-emerald-100 text-emerald-700 text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded">
                          +{includedLabels.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Détails techniques (réduits) */}
                <div className="mt-2 pt-2 border-t border-gray-500">
                  <div className="text-[9px] sm:text-[10px] text-gray-500 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span>
                      📦 {quote.logistics.adjustedVolume.toFixed(1)} m³
                    </span>
                    <span>
                      🚛{" "}
                      {quote.logistics.vehicleCount > 0
                        ? quote.logistics.vehicleCount
                        : 1}{" "}
                      véhicule{quote.logistics.vehicleCount > 1 ? "s" : ""}
                    </span>
                    {multiOffers.distanceKm && multiOffers.distanceKm > 0 && (
                      <span>📍 {multiOffers.distanceKm.toFixed(0)} km</span>
                    )}
                  </div>
                </div>

                {/* Score de pertinence (si disponible) */}
                {scenarioScore && scenarioScore.score > 0 && (
                  <div className="mt-1 mb-1">
                    <div className="flex items-center justify-center gap-1">
                      <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            scenarioScore.score >= 70
                              ? "bg-emerald-500"
                              : scenarioScore.score >= 50
                                ? "bg-yellow-500"
                                : "bg-gray-400"
                          }`}
                          style={{ width: `${scenarioScore.score}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-500">
                        {scenarioScore.score}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Bouton "Voir les détails" - NOUVEAU */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedScenario(isExpanded ? null : quote.scenarioId);
                  }}
                  className="mt-2 w-full text-[9px] sm:text-[10px] text-emerald-600 hover:text-emerald-800 underline text-center py-1"
                >
                  {isExpanded ? "Masquer les détails" : "Voir les détails"}
                </button>

                {/* Section détails expandable - NOUVEAU */}
                {isExpanded && (
                  <div
                    className="mt-3 pt-3 border-t border-gray-500 space-y-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Services inclus */}
                    {scenarioServices.included.length > 0 && (
                      <div>
                        <div className="text-[9px] font-semibold text-emerald-700 mb-1">
                          ✅ Inclus d'office :
                        </div>
                        <ul className="text-[9px] text-gray-600 space-y-0.5">
                          {scenarioServices.included.map((service) => (
                            <li
                              key={service.id}
                              className="flex items-start gap-1"
                            >
                              <span>•</span>
                              <span>{service.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Services optionnels */}
                    {scenarioServices.optional.length > 0 && (
                      <div>
                        <div className="text-[9px] font-semibold text-gray-600 mb-1">
                          ⚙️ Disponible en option :
                        </div>
                        <ul className="text-[9px] text-gray-500 space-y-0.5">
                          {scenarioServices.optional.map((service) => (
                            <li
                              key={service.id}
                              className="flex items-start gap-1"
                            >
                              <span>•</span>
                              <span>{service.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Services conditionnels */}
                    {scenarioServices.conditional.length > 0 && (
                      <div>
                        <div className="text-[9px] font-semibold text-gray-600 mb-1">
                          ⭕* Conditionnel technique :
                        </div>
                        <ul className="text-[9px] text-gray-500 space-y-0.5">
                          {scenarioServices.conditional.map((service) => (
                            <li
                              key={service.id}
                              className="flex items-start gap-1"
                            >
                              <span>•</span>
                              <div className="group relative">
                                <span>{service.label}</span>
                                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                                  <div className="bg-gray-900 text-white text-[8px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                    Recommandé automatiquement si étage ≥3 ou ≥5
                                    <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900" />
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Services non disponibles */}
                    {scenarioServices.disabled.length > 0 && (
                      <div>
                        <div className="text-[9px] font-semibold text-gray-400 mb-1">
                          ❌ Non disponible :
                        </div>
                        <ul className="text-[9px] text-gray-400 space-y-0.5">
                          {scenarioServices.disabled.map((service) => (
                            <li
                              key={service.id}
                              className="flex items-start gap-1"
                            >
                              <span>•</span>
                              <span>{service.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Phrases client (à la première personne) */}
                {scenarioScore &&
                  scenarioScore.clientPhrases &&
                  scenarioScore.clientPhrases.length > 0 &&
                  !isExpanded && (
                    <div className="mt-2 pt-2 border-t border-gray-500">
                      <div className="text-[10px] text-gray-700 italic space-y-0.5">
                        {scenarioScore.clientPhrases
                          .slice(0, 2)
                          .map((phrase, idx) => (
                            <div key={idx} className="flex items-start gap-1">
                              <span className="text-gray-400">»</span>
                              <span>{phrase}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}

      {/* Note informative */}
      <div className="text-xs sm:text-sm text-gray-500 text-center mt-4 sm:mt-5 p-3 sm:p-4 bg-gray-50 rounded-lg">
        💡 Toutes les offres incluent le transport, la main-d'œuvre et
        l'assurance de base.
        {hasSmartRecommendation && (
          <span className="block mt-1 sm:mt-2 text-emerald-600 text-xs sm:text-sm">
            🎯 La recommandation est basée sur votre situation : étage,
            ascenseur, volume, objets fragiles, distance...
          </span>
        )}
      </div>
    </div>
  );
};
