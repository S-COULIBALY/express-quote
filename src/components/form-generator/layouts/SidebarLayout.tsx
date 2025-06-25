"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { FormLayoutProps, IndustryPreset } from "../types";
import { FormSummary } from "../components/FormSummary";
import { getPresetSummary } from "../presets";
import { constraints as logisticsConstraints } from "@/components/MovingConstraintsAndServicesModal";
import { cleaningConstraints } from "@/components/CleaningConstraintsModal";

interface SidebarLayoutProps extends FormLayoutProps {
  // Pour les sidebars automatiques
  autoSummary?: IndustryPreset | React.ComponentType<any>;
  summaryConfig?: any;
  // Nouvelles propriétés inspirées du PackageEditLayout
  initialPrice?: number;
  onPriceCalculated?: (price: number) => void;
  showPriceCalculation?: boolean;
  priceModifications?: Array<{
    label: string;
    amount: number;
    condition?: (formData: any) => boolean;
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
  showConstraintsByAddress?: boolean; // Nouvelle option pour afficher les contraintes par adresse
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
  onPriceCalculated,
  showPriceCalculation = false,
  priceModifications = [],
  showModificationsSummary = false,
  headerActions,
  serviceInfo,
  showConstraintsByAddress = false
}) => {
  // Formatage du prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Calcul du prix avec useMemo pour éviter les boucles infinies
  const { calculatedPrice, activeModifications } = useMemo(() => {
    if (!showPriceCalculation || !formData) {
      return { calculatedPrice: initialPrice, activeModifications: [] };
    }

    let totalPrice = initialPrice;
    const modifications: Array<{label: string; amount: number}> = [];

    // Appliquer les modifications de prix
    priceModifications.forEach((mod: any) => {
      if (!mod.condition || mod.condition(formData)) {
        totalPrice += mod.amount;
        modifications.push({ label: mod.label, amount: mod.amount });
      }
    });

    return { calculatedPrice: totalPrice, activeModifications: modifications };
  }, [showPriceCalculation, formData, initialPrice, priceModifications]);

  // Notifier le parent quand le prix change (avec useEffect simple)
  useEffect(() => {
    if (onPriceCalculated && showPriceCalculation) {
      onPriceCalculated(calculatedPrice);
    }
  }, [calculatedPrice, onPriceCalculated, showPriceCalculation]);

  // Fonction pour obtenir le nom d'une contrainte à partir de son ID
  const getConstraintName = (constraintId: string, isServiceConstraint = false) => {
    if (isServiceConstraint) {
      // Pour les contraintes de service de nettoyage
      const constraint = cleaningConstraints.find((c: any) => c.id === constraintId);
      return constraint ? constraint.name : constraintId;
    } else {
      // Pour les contraintes logistiques (déménagement)
      const constraint = logisticsConstraints.find((c: any) => c.id === constraintId);
      return constraint ? constraint.name : constraintId;
    }
  };

  // Fonction pour afficher les contraintes par adresse ou de service
  const renderConstraintsByAddress = () => {
    if (!showConstraintsByAddress || !formData) return null;

    // Contraintes pour les packs (déménagement) - par adresse
    const pickupConstraints = formData.pickupLogisticsConstraints || [];
    const deliveryConstraints = formData.deliveryLogisticsConstraints || [];
    
    // Contraintes pour les services - générales
    const serviceConstraints = formData.serviceConstraints || [];

    // Vérifier s'il y a des contraintes à afficher
    const hasPackConstraints = pickupConstraints.length > 0 || deliveryConstraints.length > 0;
    const hasServiceConstraints = serviceConstraints.length > 0;

    if (!hasPackConstraints && !hasServiceConstraints) {
      return null;
    }

    return (
      <div className="border-t pt-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">
          {hasPackConstraints ? "Contraintes logistiques :" : "Contraintes spécifiques :"}
        </h3>
        
        {/* Contraintes de service (pour les services) */}
        {hasServiceConstraints && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span className="text-emerald-500 mr-2">🎯</span>
              Contraintes sélectionnées ({serviceConstraints.length})
            </h4>
            <div className="space-y-1">
              {serviceConstraints.map((constraintId: string, index: number) => (
                <div key={index} className="text-xs text-gray-600 bg-emerald-50 px-2 py-1 rounded flex items-center">
                  <span className="text-emerald-500 mr-1">•</span>
                  {getConstraintName(constraintId, true)}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Contraintes départ (pour les packs) */}
        {pickupConstraints.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span className="text-orange-500 mr-2">📦</span>
              Départ ({pickupConstraints.length})
            </h4>
            <div className="space-y-1">
              {pickupConstraints.map((constraintId: string, index: number) => (
                <div key={index} className="text-xs text-gray-600 bg-orange-50 px-2 py-1 rounded flex items-center">
                  <span className="text-orange-500 mr-1">•</span>
                  {getConstraintName(constraintId)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contraintes arrivée (pour les packs) */}
        {deliveryConstraints.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <span className="text-blue-500 mr-2">🏠</span>
              Arrivée ({deliveryConstraints.length})
            </h4>
            <div className="space-y-1">
              {deliveryConstraints.map((constraintId: string, index: number) => (
                <div key={index} className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded flex items-center">
                  <span className="text-blue-500 mr-1">•</span>
                  {getConstraintName(constraintId)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };


  
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
                {serviceInfo.icon && <span className="text-2xl">{serviceInfo.icon}</span>}
                <h2 className="text-xl font-bold text-gray-900">{serviceInfo.name}</h2>
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
              
              {serviceInfo.description && (
                <p className="text-sm text-gray-600 mt-2">{serviceInfo.description}</p>
              )}
            </div>
          )}

          {/* Calcul de prix amélioré - Style de la capture d'écran */}
          {showPriceCalculation && (
            <div className="text-center mb-6">
              {/* Affichage comme dans la capture */}
              {activeModifications.length > 0 || (serviceInfo?.originalPrice && serviceInfo.originalPrice > initialPrice) ? (
                <>
                  {/* Label "Prix de base" */}
                  <div className="text-sm text-gray-500 mb-1">Prix de base</div>
                  
                  {/* Prix barré - plus gros et plus visible */}
                  <div className="text-xl text-gray-400 line-through mb-2 font-medium">
                    {formatPrice(serviceInfo?.originalPrice || initialPrice)}
                  </div>
                  
                  {/* Prix final - très gros et en vert */}
                  <div className="text-4xl font-bold text-emerald-600 mb-2">
                    {formatPrice(calculatedPrice)}
                  </div>
                  
                  {/* Montant des options */}
                  <div className="text-sm text-emerald-600 font-medium">
                    +{formatPrice(calculatedPrice - initialPrice)} d'options
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-gray-500 mb-1">Prix</div>
                  <div className="text-4xl font-bold text-emerald-600">
                    {formatPrice(calculatedPrice)}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Caractéristiques du service/pack incluses */}
          {serviceInfo?.features && serviceInfo.features.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Inclus dans ce {serviceInfo.name.toLowerCase().includes('pack') ? 'pack' : 'service'} :</h3>
              <div className="grid grid-cols-1 gap-x-2 gap-y-2">
                {serviceInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <span className="text-emerald-500 mr-2 flex-shrink-0">✓</span>
                    <span className="leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Résumé des modifications */}
          {showModificationsSummary && activeModifications.length > 0 && (
            <div className="border-t pt-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Personnalisations :</h3>
              <div className="space-y-2 text-sm">
                {activeModifications.map((mod, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{mod.label}</span>
                    <span className="text-emerald-600">
                      {mod.amount > 0 ? '+' : ''}{formatPrice(mod.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contraintes par adresse - Désactivé car intégré dans le récapitulatif des adresses */}
          {/* {renderConstraintsByAddress()} */}

          {/* FormSummary original */}
          <FormSummary formData={formData} config={summaryConfig} />
        </div>
      );
    }

    // Sinon, gérer les sidebars automatiques
    if (autoSummary && formData) {
      // Si c'est un preset (string)
      if (typeof autoSummary === "string") {
        const presetSummaryConfig = getPresetSummary(autoSummary);
        if (presetSummaryConfig) {
          return <FormSummary formData={formData} config={presetSummaryConfig} />;
        }
      }
      
      // Si c'est un composant personnalisé
      if (typeof autoSummary === "function") {
        const CustomSummary = autoSummary;
        return <CustomSummary formData={formData} config={summaryConfig} />;
      }
    }

    return null;
  };

  const sidebarContent = renderSidebar();

  return (
    <div className={`bg-gray-50 min-h-screen py-8 ${className}`}>
      {/* En-tête global amélioré */}
      {(title || description || headerActions) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
          {title && (
            <h1 className="text-3xl font-bold text-gray-900">
              {title}
            </h1>
          )}
          {description && (
                <p className="text-xl text-gray-600 mt-2">
              {description}
                </p>
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulaire principal - 60% (ajusté pour meilleur équilibre) */}
          <div className="lg:w-[60%]">
            <div className="bg-white rounded-2xl shadow-md p-6 border border-emerald-600">
              {children}
              
              {/* Actions dans le formulaire */}
              {actions && (
                <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
                  {actions}
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar - 40% (ajusté pour meilleur équilibre) */}
          {sidebarContent && (
            <div className="lg:w-[40%]">
              <div className="sticky top-6 self-start">
                {sidebarContent}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 