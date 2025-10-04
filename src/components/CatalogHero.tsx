"use client";

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

export const CatalogHero: React.FC<CatalogHeroProps> = ({
  catalogData,
  onImageError,
}) => {
  console.log("🦸 [ÉTAPE 3.1] CatalogHero - Rendu section Hero du service");
  console.log("📋 [ÉTAPE 3.1] Service sélectionné:", {
    id: catalogData.catalogSelection.id,
    title: catalogData.catalogSelection.marketingTitle,
    category: catalogData.catalogSelection.category,
    price: catalogData.catalogSelection.marketingPrice,
    isFeatured: catalogData.catalogSelection.isFeatured,
    duration: catalogData.item.duration,
    workers: catalogData.item.workers,
  });
  const { catalogSelection, item, template } = catalogData;
  const categoryIcon = getCategoryIcon(
    catalogSelection.category,
    catalogSelection.subcategory,
  );
  const colors = getCategoryColors(catalogSelection.category);

  // Prix à afficher avec gestion des promotions
  const isSurMesure = catalogSelection.subcategory === "sur-mesure";
  const displayPrice = isSurMesure
    ? null
    : catalogSelection.marketingPrice || item.price;
  const originalPrice = catalogSelection.originalPrice;

  // Gestion des promotions automatiques
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

  // Fonctionnalités à afficher
  const features = item.features || template?.features || [];
  const includes = item.includes || template?.includes || [];

  // Données techniques
  const duration = isSurMesure
    ? null
    : item.duration || template?.duration || 1;
  const workers = isSurMesure ? null : item.workers || template?.workers || 1;
  const includedDistance = item.includedDistance || template?.includedDistance;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 safe-area-inset-top">
      <div className="max-w-7xl mx-auto mobile-px-4 sm:px-6 lg:px-8 mobile-py-3 sm:py-4">
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
            {catalogSelection.marketingTitle || item.name}
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
        <div className="text-center mobile-mb-6 sm:mb-6">
          {/* Catégorie et badges */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className={`p-2 rounded-lg ${colors.background}`}>
              <span className="text-2xl">{categoryIcon}</span>
            </div>
            <div className="flex items-center gap-2">
              {catalogSelection.isFeatured && (
                <span className="inline-flex items-center gap-1 bg-yellow-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  ⭐ Populaire
                </span>
              )}
              {catalogSelection.isNewOffer && (
                <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  ✨ Nouveau
                </span>
              )}
              {hasPromotion && (
                <span className="inline-flex items-center gap-1 bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  🔥{" "}
                  {catalogSelection.promotionType === "PERCENT"
                    ? `-${discountPercentage}%`
                    : `-${catalogSelection.promotionValue}€`}
                </span>
              )}
            </div>
          </div>

          {/* Titre et sous-titre */}
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 leading-tight">
              {catalogSelection.marketingTitle || item.name}
            </h1>

            {catalogSelection.marketingSubtitle && (
              <p className="text-sm sm:text-base text-gray-600">
                {catalogSelection.marketingSubtitle}
              </p>
            )}
          </div>

          {/* Badge supplémentaire */}
          {catalogSelection.badgeText && (
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-1 text-white text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: catalogSelection.badgeColor || "#E67E22",
                }}
              >
                🎯 {catalogSelection.badgeText}
              </span>
            </div>
          )}
        </div>

        {/* Section 2: Contenu organisé par paires */}
        <div className="space-y-4 sm:space-y-4">
          {/* Paire 1: Prix et Caractéristiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap-4 sm:gap-4">
            {/* Prix */}
            <div className="bg-white rounded-xl mobile-p-6 sm:p-6 shadow-sm border border-gray-100">
              <div className="text-center">
                {/* Prix HT */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {hasPromotion && (
                    <span className="text-lg text-gray-400 line-through">
                      {originalPrice}€
                    </span>
                  )}
                  <span className="text-4xl font-bold text-gray-900">
                    {displayPrice !== null
                      ? `${displayPrice}€`
                      : "Devis gratuit"}
                  </span>
                  <span className="text-gray-500 text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                    HT
                  </span>
                </div>

                {displayPrice !== null && (
                  <div className="space-y-3">
                    {/* TVA */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-gray-600">TVA</span>
                      <span className="font-medium text-gray-900">
                        {Math.round(displayPrice * 0.2)}€
                      </span>
                    </div>

                    {/* Total TTC */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-gray-900 font-medium">
                        Total TTC
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {Math.round(displayPrice * 1.2)}€
                      </span>
                    </div>
                  </div>
                )}

                {catalogSelection.promotionText && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      🔥 {catalogSelection.promotionText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="bg-white rounded-xl mobile-p-4 sm:p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mobile-mb-3 sm:mb-3 text-center text-base sm:text-lg">
                Caractéristiques
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Colonne 1 */}
                <div className="space-y-4">
                  {/* Durée */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Durée</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {duration
                        ? `${duration} ${catalogSelection.category === "MENAGE" ? "heure" : "jour"}${duration > 1 ? "s" : ""}`
                        : "Calculée selon vos besoins"}
                    </span>
                  </div>

                  {/* Équipe */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Équipe</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {workers
                        ? `${workers} ${catalogSelection.category === "MENAGE" ? "professionnel" : "déménageur"}${workers > 1 ? "s" : ""}`
                        : "Adaptée à votre projet"}
                    </span>
                  </div>
                </div>

                {/* Colonne 2 */}
                <div className="space-y-4">
                  {/* Distance ou Garantie */}
                  {includedDistance ? (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 text-gray-500">🚛</div>
                        <span className="text-sm text-gray-600">
                          Distance incluse
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        {includedDistance} {item.distanceUnit || "km"}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-600">Garantie</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">
                        100% sécurisé
                      </span>
                    </div>
                  )}

                  {/* Espace réservé pour l'alignement */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-0">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5" />
                      <span className="text-sm">Placeholder</span>
                    </div>
                    <span className="text-sm">Placeholder</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description et Note d'évaluation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap-4 sm:gap-4">
            {/* Description */}
            {(catalogSelection.marketingDescription || item.description) && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl text-gray-400">📝</span>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Description
                  </h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {catalogSelection.marketingDescription || item.description}
                </p>
              </div>
            )}

            {/* Note d'évaluation */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl text-yellow-400">⭐</span>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Avis clients
                </h3>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIconSolid
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-gray-900">4.9/5</span>
                <span className="text-sm text-gray-500">(127 avis)</span>
              </div>
              <p className="text-sm text-gray-600">
                Basé sur les avis de nos clients pour ce type de service
              </p>
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
};
