"use client";

import React, { useState, useEffect, useMemo } from "react";
import { FormLayoutProps, IndustryPreset } from "../types";
import { FormSummary } from "../components/FormSummary";
import { getPresetSummary } from "../presets";
// Ces imports ont été remplacés par le nouveau système de règles

interface SidebarLayoutProps extends FormLayoutProps {
  // Pour les sidebars automatiques
  autoSummary?: IndustryPreset | React.ComponentType<Record<string, unknown>>;
  summaryConfig?: Record<string, unknown>;
  // Nouvelles propriétés inspirées du PackageEditLayout
  initialPrice?: number;
  externalCalculatedPrice?: number; // ✅ Prix calculé externe (pour éviter conflit de noms)
  onPriceCalculated?: (price: number) => void;
  showPriceCalculation?: boolean;
  priceModifications?: Array<{
    label: string;
    amount: number;
    condition?: (formData: Record<string, unknown>) => boolean;
  }>;
  showModificationsSummary?: boolean;
  headerActions?: React.ReactNode;
  serviceInfo?: {
    name: string;
    description?: string;
    icon?: string;
    badge?: string;
    popular?: boolean;
    features?: string[]; // Caractéristiques du service/pack
    originalPrice?: number; // Prix original pour affichage barré
  };
  showRulesByAddress?: boolean; // Option pour afficher les règles par adresse
  // 📱 Configuration mobile du globalConfig
  mobileBreakpoint?: string;
  mobileFixedHeader?: boolean;
  modalRecap?: boolean;
  _mobileConfig?: {
    singleColumn?: boolean;
    optionDisplay?: "list" | "grid" | "cards";
  };
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({
  title,
  description,
  children,
  sidebar,
  actions,
  className = "",
  autoSummary,
  summaryConfig,
  formData,
  initialPrice = 0,
  externalCalculatedPrice, // ✅ Recevoir le prix calculé externe
  onPriceCalculated,
  showPriceCalculation = false,
  priceModifications = [],
  showModificationsSummary = false,
  headerActions,
  serviceInfo,
  showRulesByAddress = false,
  // 📱 Configuration mobile du globalConfig
  mobileBreakpoint = "768px",
  mobileFixedHeader = false,
  modalRecap = false,
  _mobileConfig = { singleColumn: true, optionDisplay: "list" },
}) => {
  // 📱 Hook pour détecter la taille d'écran mobile
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // ✅ OPTIMISÉ: useEffect mobile avec debounce pour éviter trop de re-renders
  useEffect(() => {
    setIsClient(true); // Marquer que nous sommes côté client

    const breakpointValue = parseInt(mobileBreakpoint || "768");
    let timeoutId: NodeJS.Timeout;

    const checkIsMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const isMobileScreen = window.innerWidth < breakpointValue;
        setIsMobile(isMobileScreen);
        console.log(
          `📱 [SidebarLayout] Mobile détecté: ${isMobileScreen} (largeur: ${window.innerWidth}px, breakpoint: ${breakpointValue}px)`,
        );
      }, 100); // Debounce de 100ms
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => {
      window.removeEventListener("resize", checkIsMobile);
      clearTimeout(timeoutId);
    };
  }, [mobileBreakpoint]);

  // Formatage du prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  // ✅ OPTIMISÉ: Calcul de prix avec useMemo stable
  const { calculatedPrice, activeModifications } = useMemo(() => {
    let price = externalCalculatedPrice || initialPrice || 0;
    const modifications: Array<{ label: string; amount: number }> = [];

    if (priceModifications && priceModifications.length > 0) {
      priceModifications.forEach((mod) => {
        price += mod.amount;
        modifications.push({
          label: mod.label,
          amount: mod.amount,
        });
      });
    }

    return {
      calculatedPrice: price,
      activeModifications: modifications,
    };
  }, [externalCalculatedPrice, initialPrice, priceModifications]);

  // ✅ OPTIMISÉ: Notification parent avec useCallback pour éviter les re-renders
  useEffect(() => {
    if (onPriceCalculated && showPriceCalculation) {
      onPriceCalculated(calculatedPrice);
    }
  }, [calculatedPrice, onPriceCalculated, showPriceCalculation]);

  // Cette fonctionnalité a été remplacée par le nouveau système de règles

  // Rendu du sidebar automatique ou personnalisé
  const renderSidebar = () => {

    // Si un sidebar personnalisé est fourni, l'utiliser
    if (sidebar) {
      return sidebar;
    }

    // Si summaryConfig est fourni directement, l'utiliser (même sans autoSummary)
    if (summaryConfig && formData) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
          {/* Informations sur le service/pack */}
          {serviceInfo && (
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                {serviceInfo.icon && (
                  <span className="text-2xl">{serviceInfo.icon}</span>
                )}
                <h2 className="text-xl font-bold text-gray-900">
                  {formData?.serviceName || serviceInfo.name}
                </h2>
              </div>

              {serviceInfo.badge && (
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {serviceInfo.badge}
                </span>
              )}

              {serviceInfo.popular && (
                <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full ml-2">
                  ⭐ Populaire
                </span>
              )}

              <p className="text-sm text-gray-600 mt-2">
                {formData?.serviceDescription || serviceInfo.description}
              </p>
            </div>
          )}

          {/* Calcul de prix amélioré - Style de la capture d'écran */}
          {showPriceCalculation && (
            <div className="text-center mb-6">
              {/* Affichage avec prix barré si différent du prix initial */}
              {calculatedPrice !== initialPrice ? (
                <>
                  {/* Label "Prix de base" */}
                  <div className="text-sm text-gray-500 mb-1">Prix de base</div>

                  {/* Prix barré - prix initial */}
                  <div className="text-xl text-gray-400 line-through mb-2 font-medium">
                    {formatPrice(initialPrice)}
                  </div>

                  {/* Prix final - même taille que le prix barré */}
                  <div className="text-xl font-bold text-gray-700 mb-2">
                    {formatPrice(calculatedPrice)}
                  </div>

                  {/* Différence de prix */}
                  <div className="text-sm text-emerald-600 font-medium">
                    {calculatedPrice > initialPrice 
                      ? `+${formatPrice(calculatedPrice - initialPrice)} d'options`
                      : `-${formatPrice(initialPrice - calculatedPrice)} de réduction`
                    }
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500 mb-1">Prix</div>
                  <div className="text-xl font-bold text-gray-400">
                    {formatPrice(calculatedPrice)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Caractéristiques du service/pack incluses */}
          {serviceInfo?.features && serviceInfo.features.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Inclus dans ce{" "}
                {serviceInfo.name.toLowerCase().includes("pack")
                  ? "pack"
                  : "service"}{" "}
                :
              </h3>
              <div className="grid grid-cols-1 gap-x-2 gap-y-2">
                {serviceInfo.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-gray-700"
                  >
                    <span className="text-emerald-500 mr-2 flex-shrink-0">
                      ✓
                    </span>
                    <span className="leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résumé des modifications */}
          {showModificationsSummary && activeModifications.length > 0 && (
            <div className="border-t pt-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Personnalisations :
              </h3>
              <div className="space-y-2 text-sm">
                {activeModifications.map((mod, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{mod.label}</span>
                    <span className="text-emerald-600">
                      {mod.amount > 0 ? "+" : ""}
                      {formatPrice(mod.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contraintes par adresse - Désactivé car intégré dans le récapitulatif des adresses */}
          {/* {renderConstraintsByAddress()} */}

          {/* FormSummary original */}
          <FormSummary formData={formData} config={summaryConfig as any} />
        </div>
      );
    }

    // Sinon, gérer les sidebars automatiques
    if (autoSummary && formData) {
      // Si c'est un preset (string)
      if (typeof autoSummary === "string") {
        const presetSummaryConfig = getPresetSummary(autoSummary);
        if (presetSummaryConfig) {
          return (
            <FormSummary formData={formData} config={presetSummaryConfig} />
          );
        }
      }

      // Si c'est un composant personnalisé
      if (typeof autoSummary === "function") {
        const CustomSummary = autoSummary;
        return <CustomSummary formData={formData} config={summaryConfig} />;
      }
    }

    // Fallback: Afficher serviceInfo même sans summaryConfig
    if (serviceInfo) {
      return (
        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
          {/* Informations sur le service/pack */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              {serviceInfo.icon && (
                <span className="text-2xl">{serviceInfo.icon}</span>
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {formData?.serviceName || serviceInfo.name}
              </h2>
            </div>

            {serviceInfo.badge && (
              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {serviceInfo.badge}
              </span>
            )}

            {serviceInfo.popular && (
              <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full ml-2">
                ⭐ Populaire
              </span>
            )}

            <p className="text-sm text-gray-600 mt-2">
              {formData?.serviceDescription || serviceInfo.description}
            </p>
            
            {/* Liste des éléments du pack */}
            {serviceInfo?.features && serviceInfo.features.length > 0 && (
              <div className="mt-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  {serviceInfo.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const view = renderSidebar();

  // 📱 Classes CSS dynamiques pour le responsive (plus fiable que dangerouslySetInnerHTML)
  const responsiveClasses = useMemo(
    () => ({
      desktop: isMobile ? "hidden" : "block",
      mobile: isMobile ? "block" : "hidden",
      mobileHeader:
        mobileFixedHeader && isMobile
          ? "fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200"
          : "",
      mobileContent: mobileFixedHeader && isMobile ? "pt-0" : "",
    }),
    [isMobile, mobileFixedHeader],
  );

  // Éviter l'hydration mismatch en attendant que le client soit prêt
  if (!isClient) {
    return (
      <div className={`bg-gray-50 min-h-screen py-0 ${className}`}>
        {/* Layout par défaut pendant l'hydration */}
        <div className="max-w-7xl mx-auto px-2 sm:px-2">
          <div className="bg-white rounded-2xl shadow-md p-2 sm:p-1 border border-transparent">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-50 min-h-screen py-0 ${className}`}
    >
      {/* 📱 En-tête mobile fixe amélioré */}
      {isMobile && mobileFixedHeader && (
        <div
          className={`px-4 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200 ${responsiveClasses.mobileHeader}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {title}
                </h2>
              )}
              {showPriceCalculation && (
                <div className="text-lg font-bold text-emerald-600 mt-1">
                  {formatPrice(calculatedPrice)}
                </div>
              )}
            </div>
            {modalRecap && view && (
              <button
                onClick={() => setShowMobileSummary(true)}
                className="ml-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
              >
                <span>Récap</span>
                <span className="text-xs">→</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* En-tête desktop normal */}
      {(!isMobile || !mobileFixedHeader) &&
        (title || description || headerActions) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                {title && (
                  <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                )}
                {description && (
                  <p className="text-xl text-gray-600 mt-2">{description}</p>
                )}
              </div>

              {/* Actions dans l'en-tête */}
              {headerActions && (
                <div className="hidden lg:flex items-center">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
        )}

      {/* 🖥️ Layout Desktop - Conteneur principal optimisé */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${responsiveClasses.desktop}`}
      >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Formulaire principal - 65% */}
          <div className="lg:w-[65%]">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8">
              {children}

              {/* Actions dans le formulaire */}
              {actions && (
                <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-200">
                  {actions}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - 35% */}
          {view && (
            <div className="lg:w-[35%]">
              <div className="sticky top-8 self-start">{view}</div>
            </div>
          )}
        </div>
      </div>

      {/* 📱 Layout Mobile - Plein écran optimisé */}
      <div
        className={`w-full ${responsiveClasses.mobile} ${responsiveClasses.mobileContent}`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Formulaire en pleine largeur */}
          <div className="flex-1 bg-white p-6">{children}</div>

          {/* Actions mobiles + Bouton récap fixe */}
          <div className="bg-white border-t border-gray-200 p-6 space-y-4">
            {/* Bouton pour ouvrir le modal récap */}
            {modalRecap && view && (
              <button
                onClick={() => setShowMobileSummary(true)}
                className="w-full bg-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center justify-between"
              >
                <span>Voir le récapitulatif</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">
                    {formatPrice(calculatedPrice)}
                  </span>
                  <span className="text-sm">→</span>
                </div>
              </button>
            )}

            {/* Actions du formulaire */}
            {actions && (
              <div className="flex justify-center space-x-4">{actions}</div>
            )}
          </div>
        </div>
      </div>

      {/* 📱 Modal récapitulatif mobile amélioré */}
      {isMobile && modalRecap && showMobileSummary && view && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
            {/* En-tête du modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Récapitulatif
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Détails de votre commande
                  </p>
                </div>
                <button
                  onClick={() => setShowMobileSummary(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="overflow-y-auto max-h-[calc(85vh-80px)]">
              <div className="p-6">{view}</div>
            </div>

            {/* Barre d'action en bas */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <button
                onClick={() => setShowMobileSummary(false)}
                className="w-full bg-emerald-600 text-white font-semibold py-4 px-6 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg"
              >
                Continuer la commande
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
