'use client';

import { CatalogData } from '@/hooks/useCatalogPreFill';
import { getCategoryIcon, getCategoryColors } from '@/utils/catalogTransformers';
import { StarIcon, ClockIcon, UsersIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';

interface CatalogHeroProps {
  catalogData: CatalogData;
  onImageError?: () => void;
}

export const CatalogHero: React.FC<CatalogHeroProps> = ({ 
  catalogData, 
  onImageError 
}) => {
  console.log('🦸 [ÉTAPE 3.1] CatalogHero - Rendu section Hero du service');
  console.log('📋 [ÉTAPE 3.1] Service sélectionné:', {
    id: catalogData.catalogSelection.id,
    title: catalogData.catalogSelection.marketingTitle,
    category: catalogData.catalogSelection.category,
    price: catalogData.catalogSelection.marketingPrice,
    isFeatured: catalogData.catalogSelection.isFeatured,
    duration: catalogData.item.duration,
    workers: catalogData.item.workers
  });
  const { catalogSelection, item, template } = catalogData;
  const categoryIcon = getCategoryIcon(catalogSelection.category, catalogSelection.subcategory);
  const colors = getCategoryColors(catalogSelection.category);
  
  // Prix à afficher avec gestion des promotions
  const isSurMesure = catalogSelection.subcategory === 'sur-mesure';
  const displayPrice = isSurMesure ? null : (catalogSelection.marketingPrice || item.price);
  const originalPrice = catalogSelection.originalPrice;
  
  // Gestion des promotions automatiques
  const hasPromotion = !isSurMesure && catalogSelection.isPromotionActive && catalogSelection.promotionCode;
  const discountPercentage = hasPromotion && catalogSelection.promotionType === 'PERCENT' 
    ? catalogSelection.promotionValue || 0
    : hasPromotion && originalPrice && displayPrice && originalPrice > displayPrice!
    ? Math.round(((originalPrice - displayPrice!) / originalPrice) * 100)
    : 0;

  // Fonctionnalités à afficher
  const features = item.features || template?.features || [];
  const includes = item.includes || template?.includes || [];
  
  // Données techniques
  const duration = isSurMesure ? null : (item.duration || template?.duration || 1);
  const workers = isSurMesure ? null : (item.workers || template?.workers || 1);
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
        <div className="text-center mobile-mb-4 sm:mb-4">
          <div className="flex items-center justify-center mobile-gap-2 mobile-mb-2 sm:mb-2">
            <span className="text-2xl sm:text-3xl">{categoryIcon}</span>
            <span className={`text-xs font-medium mobile-px-3 mobile-py-1 rounded-full ${colors.background} ${colors.text}`}>
              {catalogSelection.category.toLowerCase().replace('_', ' ')}
              {catalogSelection.subcategory && ` • ${catalogSelection.subcategory}`}
            </span>
          </div>

          {/* Badges */}
          <div className="flex items-center justify-center flex-wrap mobile-gap-2 sm:gap-1.5 mobile-mb-3 sm:mb-3">
            {catalogSelection.isFeatured && (
              <span className="bg-yellow-500 text-white text-xs font-bold mobile-px-3 mobile-py-1 rounded-full whitespace-nowrap">
                ⭐ Populaire
              </span>
            )}
            {catalogSelection.isNewOffer && (
              <span className="bg-green-500 text-white text-xs font-bold mobile-px-3 mobile-py-1 rounded-full whitespace-nowrap">
                ✨ Nouveau
              </span>
            )}
            {catalogSelection.badgeText && (
              <span
                className="text-white text-xs font-bold mobile-px-3 mobile-py-1 rounded-full whitespace-nowrap"
                style={{ backgroundColor: catalogSelection.badgeColor || '#E67E22' }}
              >
                {catalogSelection.badgeText}
              </span>
            )}
            {hasPromotion && (
              <span className="bg-red-500 text-white text-xs font-bold mobile-px-3 mobile-py-1 rounded-full shadow-lg whitespace-nowrap">
                {catalogSelection.promotionType === 'PERCENT' ? `-${discountPercentage}%` : `-${catalogSelection.promotionValue}€`}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mobile-mb-2 sm:mb-2 leading-tight">
            {catalogSelection.marketingTitle || item.name}
          </h1>

          {catalogSelection.marketingSubtitle && (
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              {catalogSelection.marketingSubtitle}
            </p>
          )}
        </div>

        {/* Section 2: Contenu organisé par paires */}
        <div className="space-y-4 sm:space-y-4">
          {/* Paire 1: Prix et Caractéristiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap-4 sm:gap-4">
            {/* Prix */}
            <div className="bg-white rounded-xl mobile-p-4 sm:p-4 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="flex items-center justify-center mobile-gap-3 sm:gap-3 mobile-mb-2 sm:mb-2">
                  {hasPromotion && (
                    <span className="text-base sm:text-lg text-gray-400 line-through">
                      {originalPrice}€
                    </span>
                  )}
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {displayPrice !== null ? `${displayPrice}€` : 'Devis gratuit'}
                  </span>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    {displayPrice !== null ? 'HT' : 'Sur mesure'}
                  </span>
                </div>

                {displayPrice !== null ? (
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1 mobile-mb-2 sm:mb-2">
                    <div>TVA: {Math.round(displayPrice * 0.2)}€</div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">
                      Total TTC: {Math.round(displayPrice * 1.2)}€
                    </div>
                  </div>
                ) : (
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1 mobile-mb-2 sm:mb-2">
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">
                      Prix calculé selon vos besoins
                    </div>
                  </div>
                )}

                {catalogSelection.promotionText && (
                  <div className="mobile-p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800 font-medium">
                      🔥 {catalogSelection.promotionText}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="bg-white rounded-xl mobile-p-4 sm:p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mobile-mb-3 sm:mb-3 text-center text-base sm:text-lg">Caractéristiques</h3>
              <div className="space-y-2 sm:space-y-2">
                <div className="flex items-center mobile-gap-3 sm:gap-3">
                  <div className="flex items-center mobile-gap-2 min-w-0 flex-1">
                    <ClockIcon className="w-4 h-4 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm sm:text-sm text-gray-500">Durée</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm sm:text-sm">
                    {duration ? (
                      `${duration} ${catalogSelection.category === 'MENAGE' ? 'heure' : 'jour'}${duration > 1 ? 's' : ''}`
                    ) : (
                      'Calculée selon vos besoins'
                    )}
                  </span>
                </div>

                <div className="flex items-center mobile-gap-3 sm:gap-3">
                  <div className="flex items-center mobile-gap-2 min-w-0 flex-1">
                    <UsersIcon className="w-4 h-4 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm sm:text-sm text-gray-500">Équipe</span>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm sm:text-sm">
                    {workers ? (
                      `${workers} ${catalogSelection.category === 'MENAGE' ? 'professionnel' : 'déménageur'}${workers > 1 ? 's' : ''}`
                    ) : (
                      'Adaptée à votre projet'
                    )}
                  </span>
                </div>

                {includedDistance ? (
                  <div className="flex items-center mobile-gap-3 sm:gap-3">
                    <div className="flex items-center mobile-gap-2 min-w-0 flex-1">
                      <div className="w-4 h-4 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0">🚛</div>
                      <span className="text-sm sm:text-sm text-gray-500">Distance incluse</span>
                    </div>
                    <span className="font-semibold text-gray-900 text-sm sm:text-sm">
                      {includedDistance} {item.distanceUnit || 'km'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center mobile-gap-3 sm:gap-3">
                    <div className="flex items-center mobile-gap-2 min-w-0 flex-1">
                      <CheckCircleIcon className="w-4 h-4 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm sm:text-sm text-gray-500">Garantie</span>
                    </div>
                    <span className="font-semibold text-gray-900 text-sm sm:text-sm">
                      100% sécurisé
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Paire 2: Description et Services inclus */}
          <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap-4 sm:gap-4">
            {/* Description */}
            {(catalogSelection.marketingDescription || item.description) && (
              <div className="bg-white rounded-xl mobile-p-4 sm:p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mobile-mb-3 sm:mb-2 text-base sm:text-lg">Description</h3>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                  {catalogSelection.marketingDescription || item.description}
                </p>
              </div>
            )}

            {/* Services inclus */}
            {includes.length > 0 && (
              <div className="bg-white rounded-xl mobile-p-4 sm:p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mobile-mb-3 sm:mb-3 text-base sm:text-lg">Services inclus</h3>
                <div className="space-y-2">
                  {includes.map((include, index) => (
                    <div key={index} className="flex items-start mobile-gap-2">
                      <CheckCircleIcon className="w-4 h-4 sm:w-4 sm:h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm sm:text-sm leading-relaxed">{include}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Paire 3: Fonctionnalités et Évaluation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 mobile-gap-4 sm:gap-4">
            {/* Fonctionnalités */}
            {features.length > 0 && (
              <div className="bg-white rounded-xl mobile-p-4 sm:p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mobile-mb-3 sm:mb-3 text-base sm:text-lg">Fonctionnalités</h3>
                <div className="flex flex-wrap mobile-gap-2">
                  {features.map((feature, index) => (
                    <span
                      key={index}
                      className={`mobile-px-3 mobile-py-1 rounded-full text-xs ${colors.background} ${colors.text} border ${colors.border} leading-none`}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note d'évaluation */}
            <div className="bg-white rounded-xl mobile-p-4 sm:p-4 shadow-sm border border-gray-100">
              <div className="flex items-start sm:items-center justify-between mobile-gap-4">
                <div className="flex-1">
                  <div className="flex items-center mobile-gap-2 mobile-mb-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <StarIconSolid key={i} className="w-4 h-4 sm:w-4 sm:h-4 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-base sm:text-lg font-bold text-gray-900">4.9/5</span>
                  </div>
                  <p className="text-gray-500 text-sm sm:text-sm">(127 avis clients)</p>
                  <p className="text-xs text-gray-600 mobile-mt-2 leading-relaxed">
                    Basé sur les avis de nos clients pour ce type de service
                  </p>
                </div>
                <div className="text-3xl sm:text-4xl opacity-20 flex-shrink-0">⭐</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 