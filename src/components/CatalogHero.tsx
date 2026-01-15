"use client";

import React from 'react';
import { CatalogData } from "@/hooks/useCatalogPreFill";
import {
  getCategoryIcon,
  getCategoryColors,
} from "@/utils/catalogTransformers";
import {
  StarIcon,
  ClockIcon,
  UsersIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";

interface CatalogHeroProps {
  catalogData: CatalogData;
  onImageError?: () => void;
}

export const CatalogHero: React.FC<CatalogHeroProps> = React.memo(({
  catalogData,
  onImageError,
}) => {
  const { catalogSelection, item, template } = catalogData;
  const categoryIcon = React.useMemo(() => getCategoryIcon(
    catalogSelection.category,
    catalogSelection.subcategory,
  ), [catalogSelection.category, catalogSelection.subcategory]);
  
  const colors = React.useMemo(() => getCategoryColors(catalogSelection.category), 
    [catalogSelection.category]);

  // Prix et promotions calculés une seule fois
  const { isSurMesure, displayPrice, originalPrice, hasPromotion, discountPercentage } = React.useMemo(() => {
    const isSurMesure = catalogSelection.subcategory === "sur-mesure";
    const displayPrice = isSurMesure
      ? null
      : catalogSelection.marketingPrice || item?.price;
    const originalPrice = catalogSelection.originalPrice;

    const hasPromotion =
      !isSurMesure &&
      catalogSelection.isPromotionActive &&
      catalogSelection.promotionCode;
    
    const discountPercentage =
      hasPromotion && catalogSelection.promotionType === "PERCENT"
        ? catalogSelection.promotionValue || 0
        : hasPromotion &&
            originalPrice &&
            displayPrice &&
            originalPrice > displayPrice!
          ? Math.round(((originalPrice - displayPrice!) / originalPrice) * 100)
          : 0;

    return { isSurMesure, displayPrice, originalPrice, hasPromotion, discountPercentage };
  }, [
    catalogSelection.subcategory,
    catalogSelection.marketingPrice,
    catalogSelection.originalPrice,
    catalogSelection.isPromotionActive,
    catalogSelection.promotionCode,
    catalogSelection.promotionType,
    catalogSelection.promotionValue,
    item?.price
  ]);

  // Fonctionnalités et données techniques calculées une seule fois
  const { features, includes, duration, workers, includedDistance, distanceUnit } = React.useMemo(() => ({
    features: item?.features || template?.features || [],
    includes: item?.includes || template?.includes || [],
    duration: isSurMesure ? null : item?.duration || template?.duration || 1,
    workers: isSurMesure ? null : item?.workers || template?.workers || 1,
    includedDistance: item?.includedDistance || template?.includedDistance,
    distanceUnit: item?.distanceUnit || 'km'
  }), [
    item?.features,
    item?.includes,
    item?.duration,
    item?.workers,
    item?.includedDistance,
    item?.distanceUnit,
    template?.features,
    template?.includes,
    template?.duration,
    template?.workers,
    template?.includedDistance,
    isSurMesure
  ]);

  return (
        <div className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 safe-area-inset-top">
      <div className="max-w-7xl mx-auto mobile-px-4 sm:px-6 lg:px-8 mobile-py-3 sm:py-3">
        {/* En-tête avec texte explicatif */}
        <div className="text-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Personnalisez votre devis en quelques clics</h2>
        </div>

        {/* Breadcrumb - Mobile optimized */}
        <nav className="flex items-center mobile-gap-2 sm:gap-2 text-xs sm:text-sm text-gray-600 mobile-mb-2 sm:mb-3 overflow-x-auto">
          <Link
            href="/"
            className="hover:text-gray-900 transition-colors whitespace-nowrap touch-44"
          >
            Accueil
          </Link>
          <span className="text-gray-300 flex-shrink-0">›</span>
          <Link
            href="/catalogue"
            className="hover:text-gray-900 transition-colors whitespace-nowrap touch-44"
          >
            Catalogue
          </Link>
          <span className="text-gray-300 flex-shrink-0">›</span>
          <span className="text-gray-900 font-medium truncate">
            {catalogSelection.marketingTitle || item?.name}
          </span>
        </nav>

        {/* Bouton retour - Mobile optimized */}
        <Link
          href="/catalogue"
          className="inline-flex items-center mobile-gap-2 text-gray-600 hover:text-gray-900 transition-colors mobile-mb-3 sm:mb-3 mobile-py-2 sm:py-0 -mobile-mx-4 sm:mx-0 hover:bg-gray-50 sm:hover:bg-transparent rounded-lg sm:rounded-none touch-48"
        >
          <ArrowLeftIcon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm sm:text-base">Retour au catalogue</span>
        </Link>

         {/* Section 1: En-tête avec titre et badges */}
         <div className="mobile-mb-3 sm:mb-3">
           {/* Titre et badges sur une seule ligne */}
           <div className="flex items-center justify-between px-2">
             {/* Titre avec icône */}
             <div className="flex items-center gap-1.5">
               <span className={`text-lg ${colors.text}`}>{categoryIcon}</span>
               <h1 className="text-lg font-semibold text-gray-900">
                 {catalogSelection.marketingTitle || item?.name}
               </h1>
             </div>

             {/* Badges compacts */}
             <div className="flex items-center gap-1">
               {catalogSelection.isFeatured && (
                 <span className="text-yellow-500">⭐</span>
               )}
               {catalogSelection.isNewOffer && (
                 <span className="text-green-500">✨</span>
               )}
               {hasPromotion && (
                 <span className="inline-flex items-center text-xs font-medium text-red-500">
                   🔥
                   {catalogSelection.promotionType === "PERCENT"
                     ? `-${discountPercentage}%`
                     : `-${catalogSelection.promotionValue}€`}
                 </span>
               )}
               {catalogSelection.badgeText && (
                 <span
                   className="text-xs font-medium"
                   style={{
                     color: catalogSelection.badgeColor || "#E67E22",
                   }}
                 >
                   🎯 {catalogSelection.badgeText}
                 </span>
               )}
             </div>
           </div>

           {/* Sous-titre en petit */}
           {catalogSelection.marketingSubtitle && (
             <p className="text-xs text-gray-500 px-2 mt-0.5">
               {catalogSelection.marketingSubtitle}
             </p>
           )}
        </div>

        {/* Section 2: Contenu organisé par paires */}
        <div className="space-y-4 sm:space-y-4">
          {/* Paire 1: Prix et Caractéristiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Prix */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                {/* Prix HT */}
                <div className="flex items-center gap-2">
                  {hasPromotion && (
                    <span className="text-sm text-gray-400 line-through">
                      {originalPrice}€
                    </span>
                  )}
                  <span className="text-2xl font-bold text-gray-900">
                    {displayPrice !== null
                      ? `${displayPrice}€`
                      : "Devis gratuit"}
                  </span>
                  <span className="text-xs text-gray-500 bg-gray-50 px-1.5 rounded">
                    HT
                  </span>
                </div>

                {/* Promotion */}
                {catalogSelection.promotionText && (
                  <span className="text-xs text-red-500 font-medium">
                    🔥 {catalogSelection.promotionText}
                  </span>
                )}
              </div>

              {displayPrice != null && typeof displayPrice === 'number' && (
                <div className="flex items-center justify-between text-sm border-t border-gray-50 pt-2">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500">TVA {Math.round(displayPrice * 0.2)}€</span>
                    <span className="font-medium">
                      Total TTC {Math.round(displayPrice * 1.2)}€
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Caractéristiques */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="grid grid-cols-2 gap-2">
                {/* Colonne 1 */}
                <div className="space-y-2">
                  {/* Durée */}
                  <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded">
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-600">Durée</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">
                      {duration
                        ? `${duration} ${catalogSelection.category === "MENAGE" ? "h" : "j"}`
                        : "Sur mesure"}
                    </span>
                  </div>

                  {/* Équipe */}
                  <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded">
                    <div className="flex items-center gap-1.5">
                      <UsersIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-600">Équipe</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900">
                      {workers
                        ? `${workers} ${catalogSelection.category === "MENAGE" ? "pro" : "dém"}`
                        : "Adaptée"}
                    </span>
                  </div>
                </div>

                {/* Colonne 2 */}
                <div className="space-y-2">
                  {/* Distance ou Garantie */}
                  {includedDistance ? (
                    <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 text-sm">🚛</span>
                        <span className="text-xs text-gray-600">Distance</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        {includedDistance} {distanceUnit}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded">
                      <div className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-gray-600">Garantie</span>
                      </div>
                      <span className="text-xs font-medium text-gray-900">
                        100%
                      </span>
                    </div>
                  )}

                  {/* Espace réservé pour l'alignement */}
                  <div className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded opacity-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4" />
                      <span className="text-xs">-</span>
                    </div>
                    <span className="text-xs">-</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description et Note d'évaluation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Description */}
            {(catalogSelection.marketingDescription || item?.description) && (
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-400 text-sm">📝</span>
                    <h3 className="font-medium text-gray-900 text-sm">
                      Description
                    </h3>
                  </div>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {catalogSelection.marketingDescription || item?.description}
                </p>
              </div>
            )}

            {/* Note d'évaluation */}
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-yellow-400 text-sm">⭐</span>
                  <h3 className="font-medium text-gray-900 text-sm">
                    Avis clients
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIconSolid
                      key={i}
                      className="w-3 h-3 text-yellow-400"
                    />
                  ))}
                  <span className="text-sm font-medium text-gray-900 ml-1">4.9</span>
                  <span className="text-xs text-gray-500">(127)</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-gray-50 px-2 py-1 rounded text-center">
                  <div className="text-[10px] text-gray-500">Satisfaction</div>
                  <div className="text-xs font-medium text-gray-900">98%</div>
                </div>
                <div className="bg-gray-50 px-2 py-1 rounded text-center">
                  <div className="text-[10px] text-gray-500">Recommandation</div>
                  <div className="text-xs font-medium text-gray-900">96%</div>
                </div>
                <div className="bg-gray-50 px-2 py-1 rounded text-center">
                  <div className="text-[10px] text-gray-500">Ponctualité</div>
                  <div className="text-xs font-medium text-gray-900">99%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Services inclus et Fonctionnalités */}
          <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap-4 sm:gap-4">
            {/* Services inclus */}
            {includes.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl text-green-500">✓</span>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Services inclus
                  </h3>
                </div>
                <div className="space-y-2">
                  {includes.map((include, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm leading-relaxed">
                        {include}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fonctionnalités */}
            {features.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl text-blue-500">⚡</span>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Fonctionnalités
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {features.map((feature, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 rounded-full text-sm ${colors.background} ${colors.text} border ${colors.border} leading-none`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
