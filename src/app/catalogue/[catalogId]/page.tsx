import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CatalogHero } from '@/components/CatalogHero';
import { DetailForm } from '@/components/DetailForm';
import { CatalogData } from '@/hooks/useCatalogPreFill';
import { FormStylesSimplified } from '@/components/form-generator/styles/FormStylesSimplified';
import { globalFormPreset } from '@/components/form-generator/presets/_shared/globalPreset';

interface CatalogDetailPageProps {
  params: { catalogId: string };
}

// Cache global persistant qui survit aux recompilations
declare global {
  var __catalogCache: Map<string, { data: CatalogData | null; timestamp: number }> | undefined;
}

const catalogCache = globalThis.__catalogCache ?? new Map<string, { data: CatalogData | null; timestamp: number }>();
globalThis.__catalogCache = catalogCache;

const CACHE_DURATION = 300000; // 5 minutes (plus long pour éviter les re-fetches)

// Fonction pour récupérer les données du catalogue avec cache partagé
async function getCatalogData(catalogId: string): Promise<CatalogData | null> {
  console.log(`🔍 [CACHE] getCatalogData appelé pour ${catalogId} - Taille cache: ${catalogCache.size}`);
  
  // Vérifier le cache en premier
  const cached = catalogCache.get(catalogId);
  const now = Date.now();
  
  if (cached) {
    const age = now - cached.timestamp;
    console.log(`📊 [CACHE] Cache trouvé pour ${catalogId} - Age: ${age}ms, Valid: ${age < CACHE_DURATION}`);
    
    if (age < CACHE_DURATION) {
      console.log(`🎯 [CACHE] Cache hit pour ${catalogId} - Retour des données en cache`);
      return cached.data;
    } else {
      console.log(`⏰ [CACHE] Cache expiré pour ${catalogId} - Rechargement nécessaire`);
    }
  } else {
    console.log(`❌ [CACHE] Aucun cache trouvé pour ${catalogId}`);
  }

  const maxRetries = 3;
  const retryDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 [API] Tentative ${attempt}/${maxRetries} - Fetch catalogue ${catalogId}`);
      
      const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/catalogue/${catalogId}`;
      console.log(`🌐 [API] URL: ${url}`);
      
      const response = await fetch(url, {
        next: { 
          revalidate: 3600, // 1 heure
          tags: [`catalogue-${catalogId}`]
        }
      });

      console.log(`📡 [API] Response status: ${response.status} pour ${catalogId}`);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`❌ [API] Élément catalogue ${catalogId} non trouvé (404)`);
          catalogCache.set(catalogId, { data: null, timestamp: Date.now() });
          return null;
        }
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const response_data = await response.json();
      console.log(`✅ [API] Catalogue ${catalogId} récupéré avec succès - Réponse:`, {
        hasResponse: !!response_data,
        success: response_data.success,
        hasData: !!response_data.data
      });

      // Extraire les données du format API { success: true, data: { catalogSelection, item } }
      const catalogData = response_data.success ? response_data.data : null;

      if (!catalogData || !catalogData.catalogSelection) {
        console.log(`❌ [API] Format de données invalide pour ${catalogId}`);
        catalogCache.set(catalogId, { data: null, timestamp: Date.now() });
        return null;
      }

      console.log(`✅ [API] Données extraites pour ${catalogId}:`, {
        catalogSelectionId: catalogData.catalogSelection?.id,
        itemId: catalogData.item?.id
      });

      // Mettre en cache les données extraites
      const cacheEntry = { data: catalogData, timestamp: Date.now() };
      catalogCache.set(catalogId, cacheEntry);
      console.log(`💾 [CACHE] Données mises en cache pour ${catalogId} - Nouvelle taille: ${catalogCache.size}`);

      return catalogData;
      
    } catch (error) {
      console.error(`❌ Tentative ${attempt}/${maxRetries} échouée:`, error);
      
      if (attempt === maxRetries) {
        console.error(`💥 Échec définitif après ${maxRetries} tentatives pour ${catalogId}`);
        catalogCache.set(catalogId, { data: null, timestamp: Date.now() });
        return null;
      }
      
      const delay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ Attente de ${delay}ms avant nouvelle tentative...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return null;
}

// Métadonnées dynamiques avec gestion d'erreur améliorée
export async function generateMetadata({ params }: CatalogDetailPageProps): Promise<Metadata> {
  const timestamp = new Date().toISOString();
  console.log(`📋 [METADATA] generateMetadata DÉMARRÉ pour catalogId: ${params.catalogId} à ${timestamp}`);
  
  try {
    console.log(`🔄 [METADATA] Appel getCatalogData pour ${params.catalogId}`);
    // Utiliser le même cache que le composant
    const catalogData = await getCatalogData(params.catalogId);
    
    console.log(`📊 [METADATA] Données récupérées pour ${params.catalogId}:`, {
      hasData: !!catalogData,
      catalogSelectionId: catalogData?.catalogSelection?.id,
      itemId: catalogData?.item?.id
    });
    
    if (!catalogData) {
      return {
        title: 'Élément non trouvé - Express Quote',
        description: 'Cet élément du catalogue n\'existe pas ou n\'est plus disponible.',
      };
    }

    const { catalogSelection, item } = catalogData;
    const title = catalogSelection.marketingTitle || item.name;
    const description = catalogSelection.marketingDescription || item.description || '';
    const price = catalogSelection.marketingPrice || item.price;

    return {
      title: `${title} - Express Quote`,
      description: description.length > 160 ? description.substring(0, 157) + '...' : description,
      openGraph: {
        title: `${title} - Express Quote`,
        description: description,
        images: item.imagePath ? [
          {
            url: item.imagePath,
            width: 1200,
            height: 630,
            alt: title,
          }
        ] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} - Express Quote`,
        description: description,
        images: item.imagePath ? [item.imagePath] : [],
      },
      other: {
        'price:amount': price.toString(),
        'price:currency': 'EUR',
        'product:category': catalogSelection.category,
        'product:availability': 'in stock',
      },
      keywords: [
        catalogSelection.category.toLowerCase(),
        catalogSelection.subcategory || '',
        'devis',
        'réservation',
        'service',
        'express quote'
      ].filter(Boolean),
    };
  } catch (error) {
    console.error('Erreur lors de la génération des métadonnées:', error);
    return {
      title: 'Catalogue - Express Quote',
      description: 'Découvrez nos services de déménagement, ménage et transport.',
    };
  }
}

// Composants de chargement avec nouvelles classes utilitaires
const CatalogHeroSkeleton = () => (
  <div className="form-generator bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
    <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-1 sm:py-4">
      {/* Breadcrumb Skeleton - Mobile optimized */}
      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-3 px-4 sm:px-0">
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 sm:w-16 animate-pulse"></div>
        <span className="text-gray-300 text-xs sm:text-sm">›</span>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 animate-pulse"></div>
        <span className="text-gray-300 text-xs sm:text-sm">›</span>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-32 animate-pulse"></div>
      </div>

      {/* Back Button Skeleton - Mobile optimized */}
      <div className="h-8 sm:h-6 bg-gray-200 rounded w-32 mb-1 sm:mb-3 px-4 sm:px-0 mx-4 sm:mx-0 animate-pulse"></div>

      {/* Section 1: En-tête skeleton - Mobile optimized */}
      <div className="text-center mb-2 sm:mb-4">
        <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-20 sm:w-24 animate-pulse"></div>
        </div>
        <div className="flex justify-center flex-wrap gap-1 sm:gap-1.5 mb-1 sm:mb-3 px-4">
          <div className="h-4 sm:h-5 bg-gray-200 rounded-full w-14 sm:w-16 animate-pulse"></div>
          <div className="h-4 sm:h-5 bg-gray-200 rounded-full w-10 sm:w-12 animate-pulse"></div>
        </div>
        <div className="h-8 sm:h-10 bg-gray-200 rounded w-3/4 mx-auto mb-1 sm:mb-2 animate-pulse"></div>
        <div className="h-4 sm:h-5 bg-gray-200 rounded w-2/3 mx-auto animate-pulse"></div>
      </div>

      {/* Section 2: Prix et caractéristiques skeleton - Mobile optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-5 px-4 sm:px-0">
        {/* Prix skeleton - Mobile optimized */}
        <div className="card-ios p-2 sm:p-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-16 sm:w-20 animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-4 sm:w-6 animate-pulse"></div>
            </div>
            <div className="space-y-1 mb-1 sm:mb-2">
              <div className="h-2 sm:h-3 bg-gray-200 rounded w-10 sm:w-12 mx-auto animate-pulse"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Caractéristiques skeleton - Mobile optimized */}
        <div className="card-ios p-2 sm:p-4">
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-24 sm:w-28 mb-1 sm:mb-3 mx-auto animate-pulse"></div>
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-10 sm:w-12 animate-pulse"></div>
              </div>
              <div className="h-2 sm:h-3 bg-gray-200 rounded w-12 sm:w-16 animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-10 sm:w-12 animate-pulse"></div>
              </div>
              <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-20 animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-2 sm:h-3 bg-gray-200 rounded w-10 sm:w-12 animate-pulse"></div>
              </div>
              <div className="h-2 sm:h-3 bg-gray-200 rounded w-12 sm:w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Contenu détaillé skeleton - Mobile optimized */}
      <div className="space-y-2 sm:space-y-4 px-4 sm:px-0">
        {/* Description skeleton - Mobile optimized */}
        <div className="card-ios p-2 sm:p-4">
          <div className="h-4 sm:h-5 bg-gray-200 rounded w-20 sm:w-24 mb-1 sm:mb-2 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        </div>

        {/* Services et fonctionnalités skeleton - Mobile optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4">
          <div className="card-ios p-2 sm:p-4">
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-24 sm:w-28 mb-1 sm:mb-3 animate-pulse"></div>
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse mt-0.5"></div>
                <div className="h-3 bg-gray-200 rounded w-28 sm:w-32 animate-pulse"></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse mt-0.5"></div>
                <div className="h-3 bg-gray-200 rounded w-20 sm:w-24 animate-pulse"></div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse mt-0.5"></div>
                <div className="h-3 bg-gray-200 rounded w-24 sm:w-28 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="card-ios p-2 sm:p-4">
            <div className="h-4 sm:h-5 bg-gray-200 rounded w-24 sm:w-28 mb-1 sm:mb-3 animate-pulse"></div>
            <div className="flex flex-wrap gap-1.5">
              <div className="h-5 sm:h-6 bg-gray-200 rounded-full w-14 sm:w-16 animate-pulse"></div>
              <div className="h-5 sm:h-6 bg-gray-200 rounded-full w-10 sm:w-12 animate-pulse"></div>
              <div className="h-5 sm:h-6 bg-gray-200 rounded-full w-16 sm:w-20 animate-pulse"></div>
              <div className="h-5 sm:h-6 bg-gray-200 rounded-full w-12 sm:w-14 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Évaluation skeleton - Mobile optimized */}
        <div className="card-ios p-2 sm:p-4">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex gap-0.5">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-10 sm:w-12 animate-pulse"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-16 sm:w-20 mb-1 animate-pulse"></div>
              <div className="h-2 sm:h-3 bg-gray-200 rounded w-32 sm:w-40 animate-pulse"></div>
            </div>
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DetailFormSkeleton = () => (
  <div className="form-generator max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-6">
    {/* Title Skeleton */}
    <div className="text-center mb-2 sm:mb-6">
      <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64 mx-auto mb-1 sm:mb-2 animate-pulse"></div>
      <div className="h-3 sm:h-4 bg-gray-200 rounded w-64 sm:w-96 mx-auto animate-pulse"></div>
    </div>

    {/* Form Skeleton */}
    <div className="card-ios p-2 sm:p-6">
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

// Composant principal avec gestion d'erreur améliorée
export default async function CatalogDetailPage({ params }: CatalogDetailPageProps) {
  console.log('🎯 [ÉTAPE 1] Navigation vers /catalogue/[catalogId] - User Click détecté');
  console.log('📍 [ÉTAPE 1] Route params:', { catalogId: params.catalogId });
  
  const timestamp = new Date().toISOString();
  console.log(`🏠 [ÉTAPE 3] CatalogDetailPage DÉMARRÉ pour catalogId: ${params.catalogId} à ${timestamp}`);
  
  console.log(`🔄 [ÉTAPE 3] Appel getCatalogData pour ${params.catalogId}`);
  // Utiliser le même cache que generateMetadata
  const catalogData = await getCatalogData(params.catalogId);

  console.log('✅ [ÉTAPE 3] Données catalogue récupérées avec succès:', {
    catalogId: params.catalogId,
    hasData: !!catalogData,
    category: catalogData?.catalogSelection?.category,
    subcategory: catalogData?.catalogSelection?.subcategory,
    serviceType: catalogData?.item?.type,
    serviceName: catalogData?.item?.name,
    price: catalogData?.item?.price,
    duration: catalogData?.item?.duration,
    workers: catalogData?.item?.workers,
    dataSize: JSON.stringify(catalogData).length + ' bytes'
  });

  if (!catalogData) {
    console.log(`❌ [COMPONENT] Catalogue data not found pour ${params.catalogId}, calling notFound()`);
    notFound();
  }
  
  console.log('🎨 [ÉTAPE 3] Rendu des composants de la page - CatalogHero + DetailForm');
  console.log('➡️ [FLUX] Passage à ÉTAPE 4 : Initialisation DetailForm');

  return (
    <div className="form-generator min-h-screen bg-gray-50 font-ios safe-area">
      {/* 🎨 Styles iOS 18 simplifiés */}
      <FormStylesSimplified globalConfig={globalFormPreset} />

      {/* Section Hero avec les détails du catalogue - Mobile optimized */}
      <Suspense fallback={<CatalogHeroSkeleton />}>
        <CatalogHero catalogData={catalogData} />
      </Suspense>

      {/* Section Formulaire de réservation - Mobile optimized */}
      <Suspense fallback={<DetailFormSkeleton />}>
        <div className="mobile-px-4 mobile-py-3">
          <DetailForm catalogData={catalogData} />
        </div>
      </Suspense>

      {/* Section informations supplémentaires - Mobile first */}
      <section className="bg-white mobile-py-4 animate-fade-in-up safe-area-inset-bottom">
        <div className="max-w-7xl mx-auto mobile-px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 mobile-gap-4">
            <div className="text-center card-ios mobile-py-4 mobile-px-4 animate-fade-in-scale">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">⚡</span>
              </div>
              <h3 className="text-mobile-lg font-semibold text-gray-900 mb-2 font-ios-semibold">Réservation instantanée</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Réservez en quelques clics et recevez votre confirmation immédiatement</p>
            </div>

            <div className="text-center card-ios mobile-py-4 mobile-px-4 animate-fade-in-scale" style={{animationDelay: '0.1s'}}>
              <div className="bg-blue-100 rounded-full p-3 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">🛡️</span>
              </div>
              <h3 className="text-mobile-lg font-semibold text-gray-900 mb-2 font-ios-semibold">Assurance incluse</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Tous nos services sont couverts par une assurance responsabilité civile</p>
            </div>

            <div className="text-center card-ios mobile-py-4 mobile-px-4 animate-fade-in-scale" style={{animationDelay: '0.2s'}}>
              <div className="bg-purple-100 rounded-full p-3 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-xl sm:text-2xl">⭐</span>
              </div>
              <h3 className="text-mobile-lg font-semibold text-gray-900 mb-2 font-ios-semibold">Service premium</h3>
              <p className="text-sm sm:text-base text-gray-600 font-ios">Équipe professionnelle formée avec matériel de qualité</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Génération des pages statiques pour les éléments populaires avec gestion d'erreur
export async function generateStaticParams() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/catalogue/featured`, {
      next: { 
        revalidate: 3600, // 1 heure
        tags: ['catalogue-featured']
      }
    });
    
    if (!response.ok) {
      console.warn('Impossible de récupérer les éléments populaires pour la génération statique');
      return [];
    }

    const featuredItems = await response.json();
    
    return featuredItems.map((item: any) => ({
      catalogId: item.id,
    }));
  } catch (error) {
    console.warn('Erreur lors de la génération des paramètres statiques:', error);
    return [];
  }
} 