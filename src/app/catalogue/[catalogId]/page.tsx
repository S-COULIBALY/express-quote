import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ServicesNavigation } from "@/components/ServicesNavigation";
import { CatalogData } from "@/hooks/useCatalogPreFill";
import { FormStylesSimplified } from "@/components/form-generator/styles/FormStylesSimplified";
import { globalFormPreset } from "@/components/form-generator/presets/_shared/globalPreset";
import { logger } from "@/lib/logger";
import { CatalogPageClient } from "@/components/CatalogPageClient";

interface CatalogDetailPageProps {
  params: { catalogId: string };
}

// Cache global persistant qui survit aux recompilations
declare global {
  var __catalogCache: Map<string, { data: CatalogData | null; timestamp: number }> | undefined;
}

const catalogCache =
  global.__catalogCache ??
  new Map<string, { data: CatalogData | null; timestamp: number }>();
global.__catalogCache = catalogCache;

const CACHE_DURATION = 300000; // 5 minutes (plus long pour éviter les re-fetches)

// Fonction pour récupérer les données du catalogue avec cache partagé
async function getCatalogData(catalogId: string): Promise<CatalogData | null> {
  // Vérifier le cache en premier
  const cached = catalogCache.get(catalogId);
  const now = Date.now();

  if (cached) {
    const age = now - cached.timestamp;
    if (age < CACHE_DURATION) {
      logger.info({
        message: "📦 Données catalogue chargées depuis le cache",
        catalogId,
        cacheAge: `${Math.round(age / 1000)}s`,
        catalogSelection: {
          id: cached.data?.catalogSelection.id,
          category: cached.data?.catalogSelection.category,
          title: cached.data?.catalogSelection.marketingTitle
        }
      } as any);
      return cached.data;
    }
    logger.info({
      message: "🔄 Cache expiré, rechargement des données",
      catalogId,
      cacheAge: `${Math.round(age / 1000)}s`
    } as any);
  }

  const maxRetries = 3;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info({
        message: "🔍 Chargement des données catalogue",
        catalogId,
        attempt,
        maxRetries
      } as any);

      const url = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/catalogue/${catalogId}`;
      const response = await fetch(url, {
        next: {
          revalidate: 3600, // 1 heure
          tags: [`catalogue-${catalogId}`],
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
        logger.warn({
          message: "⚠️ Catalogue non trouvé",
          catalogId,
          status: response.status
        } as any);
          catalogCache.set(catalogId, { data: null, timestamp: Date.now() });
          return null;
        }
        throw new Error(
          `Erreur HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const response_data = await response.json();
      const catalogData = response_data.success ? response_data.data : null;

      if (!catalogData || !catalogData.catalogSelection) {
        logger.warn({
          message: "⚠️ Données catalogue invalides",
          catalogId,
          hasData: !!catalogData,
          hasCatalogSelection: !!catalogData?.catalogSelection
        } as any);
        catalogCache.set(catalogId, { data: null, timestamp: Date.now() });
        return null;
      }

      logger.info({
        message: "✅ Données catalogue chargées avec succès",
        catalogId,
        catalogSelection: {
          id: catalogData.catalogSelection.id,
          category: catalogData.catalogSelection.category,
          title: catalogData.catalogSelection.marketingTitle,
          price: catalogData.catalogSelection.marketingPrice,
          isActive: catalogData.catalogSelection.isActive,
          isFeatured: catalogData.catalogSelection.isFeatured
        },
        item: {
          id: catalogData.item.id,
          name: catalogData.item.name,
          type: catalogData.item.type
        }
      } as any);

      // Mettre en cache les données extraites
      const cacheEntry = { data: catalogData, timestamp: Date.now() };
      catalogCache.set(catalogId, cacheEntry);

      return catalogData;
    } catch (error) {
      logger.error({
        message: "❌ Erreur lors du chargement du catalogue",
        catalogId,
        attempt,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      } as any);

      if (attempt === maxRetries) {
        logger.error({
          message: "❌ Nombre maximum de tentatives atteint",
          catalogId,
          maxRetries
        } as any);
        catalogCache.set(catalogId, { data: null, timestamp: Date.now() });
        return null;
      }

      const delay = retryDelay * Math.pow(2, attempt - 1);
      logger.info({
        message: "⏳ Attente avant nouvelle tentative",
        catalogId,
        attempt,
        nextAttempt: attempt + 1,
        delayMs: delay
      } as any);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return null;
}

// Métadonnées dynamiques avec gestion d'erreur améliorée
export async function generateMetadata({
  params,
}: CatalogDetailPageProps): Promise<Metadata> {
  try {
    // Utiliser le même cache que le composant
    const catalogData = await getCatalogData(params.catalogId);

    if (!catalogData) {
      return {
        title: "Élément non trouvé - Express Quote",
        description:
          "Cet élément du catalogue n'existe pas ou n'est plus disponible.",
      };
    }

    const { catalogSelection, item } = catalogData;
    const title = catalogSelection.marketingTitle || item.name;
    const description =
      catalogSelection.marketingDescription || item.description || "";
    const price = catalogSelection.marketingPrice || item.price;

    return {
      title: `${title} - Express Quote`,
      description:
        description.length > 160
          ? description.substring(0, 157) + "..."
          : description,
      openGraph: {
        title: `${title} - Express Quote`,
        description: description,
        images: item.imagePath
          ? [
              {
                url: item.imagePath,
                width: 1200,
                height: 630,
                alt: title,
              },
            ]
          : [],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${title} - Express Quote`,
        description: description,
        images: item.imagePath ? [item.imagePath] : [],
      },
      other: {
        "price:amount": price.toString(),
        "price:currency": "EUR",
        "product:category": catalogSelection.category,
        "product:availability": "in stock",
      },
      keywords: [
        catalogSelection.category.toLowerCase(),
        catalogSelection.subcategory || "",
        "devis",
        "réservation",
        "service",
        "express quote",
      ].filter(Boolean),
    };
  } catch (error) {
    console.error("Erreur lors de la génération des métadonnées:", error);
    return {
      title: "Catalogue - Express Quote",
      description:
        "Découvrez nos services de déménagement, ménage et transport.",
    };
  }
}

// Composants de chargement avec nouvelles classes utilitaires
const DetailFormSkeleton = () => (
  <div className="form-generator max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6">
    {/* Title Skeleton */}
    <div className="text-center mb-2 sm:mb-6">
      <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64 mx-auto mb-1 sm:mb-2 animate-pulse"></div>
      <div className="h-3 sm:h-4 bg-gray-200 rounded w-64 sm:w-96 mx-auto animate-pulse"></div>
    </div>

    {/* Form Skeleton */}
    <div className="card-ios p-2 sm:p-0">
      <div className="space-y-2 sm:space-y-5">
        {/* Form Fields Skeleton */}
        <div className="space-y-2 sm:space-y-4">
          <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Button Skeleton */}
        <div className="h-10 sm:h-12 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  </div>
);

// Composant principal avec disposition Amazon et largeur 100%
export default async function CatalogDetailPage({
  params,
}: CatalogDetailPageProps) {
  // Utiliser le même cache que generateMetadata
  const catalogData = await getCatalogData(params.catalogId);

  if (!catalogData) {
    notFound();
  }

  return (
    <div className="form-generator min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 font-ios">
      {/* 🎨 Styles iOS 18 simplifiés */}
      <FormStylesSimplified globalConfig={globalFormPreset} />

      {/* Barre de navigation principale */}

      {/* Barre de navigation des services */}
      <ServicesNavigation />

      {/* Section promotionnelle compacte */}
      <div className="bg-white border-b border-gray-200 pt-16 sm:pt-20">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-1.5 sm:py-2">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-2 sm:gap-3">
            {/* Texte promotionnel principal */}
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-0.5 sm:mb-1">
                <span className="sm:hidden">⭐ Devis instantané</span>
                <span className="hidden sm:inline">⭐ Service Premium avec Devis Instantané !</span>
              </h2>
              <p className="text-xs text-gray-600 max-w-2xl">
                <span className="sm:hidden">Configurez et obtenez votre prix en temps réel.</span>
                <span className="hidden sm:inline">Configurez votre service en temps réel et obtenez un devis personnalisé immédiatement. Tarification transparente et mise à jour automatique.</span>
              </p>
            </div>
            
            {/* Encart promotionnel - visible uniquement sur desktop */}
            <div className="hidden lg:block bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 py-2 rounded-lg shadow-lg">
              <div className="text-center">
                <div className="text-lg font-bold">💰</div>
                <div className="text-xs font-medium">Prix en temps réel</div>
                <div className="text-xs opacity-90">Mise à jour instantanée</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout Amazon - 2 colonnes avec largeur 100% */}
      <CatalogPageClient catalogData={catalogData} />

      {/* Section avantages - Compacte */}
      <section className="bg-gradient-to-br from-emerald-50 to-green-50 py-4 sm:py-8 mt-4 sm:mt-8 border-t border-emerald-100 animate-fade-in-up">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* En-tête de la section compact */}
          <div className="text-center mb-4 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-100 text-emerald-700 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-2 sm:mb-3">
              <span>✨</span>
              Nos Garanties
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
              Une expérience de service exceptionnelle
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
              Profitez d'un service professionnel avec des garanties qui font la
              différence
            </p>
          </div>

          {/* Grille des avantages compacte */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Réservation instantanée */}
            <div className="group bg-white rounded-xl p-3 sm:p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg text-white">⚡</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Réservation instantanée
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                Réservez en quelques clics et recevez votre confirmation
                immédiatement
              </p>
            </div>

            {/* Assurance incluse */}
            <div
              className="group bg-white rounded-xl p-3 sm:p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: "0.1s" }}
            >
              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg text-white">🛡️</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Assurance incluse
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                Tous nos services sont couverts par une assurance responsabilité
                civile
              </p>
            </div>

            {/* Service premium */}
            <div
              className="group bg-white rounded-xl p-3 sm:p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-1.5 sm:p-2 w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                <span className="text-base sm:text-lg text-white">⭐</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">
                Service premium
              </h3>
              <p className="text-gray-600 leading-relaxed text-xs sm:text-sm">
                Équipe professionnelle formée avec matériel de qualité
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Génération des pages statiques pour les éléments populaires avec gestion d'erreur
export async function generateStaticParams() {
  // Retourner un tableau vide pour éviter les appels inutiles
  // Les pages seront générées à la demande (Incremental Static Regeneration)
  return [];
}
