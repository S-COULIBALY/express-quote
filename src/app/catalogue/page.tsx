"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormStylesSimplified } from "@/components/form-generator/styles/FormStylesSimplified";
import { globalFormPreset } from "@/components/form-generator/presets/_shared/globalPreset";
import { catalogueItemsCache } from "@/lib/caches";
import { logger } from "@/lib/logger";
import {
  ArrowRightIcon,
  TruckIcon,
  HomeIcon,
  UsersIcon,
  SparklesIcon,
  CubeIcon,
  StarIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { CatalogueCard } from "@/components/ui/CatalogueCard";
import { ServicesNavigation } from "@/components/ServicesNavigation";
import CatalogueSchema from "./schema";

// Types pour les données du catalogue - Interface optimisée
interface CatalogItem {
  id: string;
  catalogId?: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: number;
  workers: number;
  features: string[];
  includedDistance: number;
  distanceUnit: string;
  isFeatured: boolean;
  isNewOffer: boolean;
  badgeText?: string;
  badgeColor?: string;
  promotionText?: string;
  category: string;
  subcategory: string;
  targetAudience: string;
  type: "pack" | "service";
}

// Mapping des icônes par catégorie (OUTLINE pour plus discret)
const getCategoryIcon = (category: string, subcategory: string) => {
  switch (category) {
    case "DEMENAGEMENT":
      if (subcategory === "studio") return HomeIcon;
      if (subcategory === "famille") return UsersIcon;
      if (subcategory === "premium") return SparklesIcon;
      return TruckIcon;
    case "MENAGE":
      return SparklesIcon; // Plus attractif que WrenchScrewdriverIcon
    case "TRANSPORT":
      return TruckIcon;
    case "LIVRAISON":
      return CubeIcon;
    default:
      return HomeIcon;
  }
};

// Mapping des couleurs par catégorie
const getCategoryColor = (category: string) => {
  switch (category) {
    case "DEMENAGEMENT":
      return "text-emerald-600"; // Vert
    case "MENAGE":
      return "text-blue-600"; // Bleu
    case "TRANSPORT":
      return "text-orange-600"; // Orange
    case "LIVRAISON":
      return "text-purple-600"; // Violet
    default:
      return "text-emerald-600";
  }
};

export default function CataloguePage() {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [randomizedItems, setRandomizedItems] = useState<CatalogItem[]>([]);
  const router = useRouter();

  // Données de fallback pour le carrousel
  const fallbackItems: CatalogItem[] = [
    {
      id: "fallback-1",
      catalogId: "catalog-demenagement-sur-mesure",
      title: "Déménagement Économique",
      subtitle: "Payez uniquement la main d'œuvre dont vous avez besoin",
      description:
        "Tarification horaire flexible à 19€/h - Équipe professionnelle",
      price: 0,
      duration: 1,
      workers: 3,
      category: "DEMENAGEMENT",
      subcategory: "sur-mesure",
      type: "service",
      features: [
        "Tarification horaire flexible",
        "Équipe adaptée",
        "Prix transparents",
      ],
      includedDistance: 30,
      distanceUnit: "km",
      isFeatured: true,
      targetAudience: "particuliers",
      isNewOffer: false,
      badgeText: "Économique",
      badgeColor: "#E67E22",
    },
    {
      id: "fallback-2",
      catalogId: "catalog-menage-sur-mesure",
      title: "Ménage Flexible",
      subtitle: "Service modulaire sans forfait rigide",
      description: "À partir de 21€/h - Service personnalisé selon vos besoins",
      price: 0,
      duration: 1,
      workers: 2,
      category: "MENAGE",
      subcategory: "sur-mesure",
      type: "service",
      features: ["Service modulaire", "Prix transparents", "Personnalisation"],
      includedDistance: 0,
      distanceUnit: "km",
      isFeatured: true,
      targetAudience: "particuliers",
      isNewOffer: true,
      badgeText: "Flexible",
      badgeColor: "#27AE60",
    },
  ];

  // Récupération des données du catalogue - Optimisée avec cache et retry
  useEffect(() => {
    const CACHE_KEY = "catalogue-featured-items";
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 seconde

    const fetchCatalogData = async (retryCount = 0): Promise<void> => {

      try {
        setLoading(true);
        setError(null);

        // 1. ✅ Vérifier le cache avec catalogueItemsCache
        const cached = catalogueItemsCache.get(CACHE_KEY);
        if (cached) {
          const age = catalogueItemsCache.getAge(CACHE_KEY);
          logger.debug(
            `📦 Cache hit: Données chargées depuis le cache (âge: ${Math.round((age || 0) / 1000)}s)`,
          );

          setCatalogItems(cached);
          const shuffled = [...cached].sort(() => Math.random() - 0.5);
          setRandomizedItems(shuffled);
          setLoading(false);

          // Rafraîchir en arrière-plan (stale-while-revalidate)
          fetchInBackground();
          return;
        }

        // 2. ✅ Cache miss, récupération depuis l'API
        logger.debug(`🔄 Cache miss: ${CACHE_KEY} (tentative ${retryCount + 1}/${MAX_RETRIES})`);
        const response = await fetch("/api/catalogue/featured?limit=20", {
          headers: {
            "Cache-Control": "max-age=300", // Cache HTTP 5 minutes
          },
        });

        if (!response.ok) {
          throw new Error(
            `Erreur ${response.status}: ${response.statusText || "Erreur réseau"}`,
          );
        }

        const data = await response.json();

        // 3. Validation des données
        if (!Array.isArray(data)) {
          throw new Error("Format de données invalide: réponse non-tableau");
        }

        if (data.length === 0) {
          throw new Error("Aucun élément retourné par l'API");
        }

        // 4. ✅ Mise en cache avec catalogueItemsCache
        catalogueItemsCache.set(CACHE_KEY, data);
        logger.debug(`✅ Cache set: ${CACHE_KEY} (${data.length} items)`);

        // 5. Mise à jour du state
        setCatalogItems(data);
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setRandomizedItems(shuffled);

        logger.info(`✅ ${data.length} éléments chargés avec succès`);
      } catch (err) {
        logger.error(`❌ Erreur catalogue (tentative ${retryCount + 1}):`, err);

        // Retry logic avec délai exponentiel
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, retryCount);
          logger.debug(`⏳ Nouvelle tentative dans ${delay}ms...`);

          setTimeout(() => {
            fetchCatalogData(retryCount + 1);
          }, delay);
          return;
        }

        // Échec après toutes les tentatives
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erreur lors du chargement du catalogue";

        setError(errorMessage);
        logger.error("❌ Échec après toutes les tentatives:", errorMessage);

        // En cas d'erreur finale, utiliser les données de fallback
        logger.debug("🔄 Utilisation des données de fallback");
        setRandomizedItems(fallbackItems);
        setCatalogItems(fallbackItems);
      } finally {
        setLoading(false);
      }
    };

    // ✅ Fonction pour rafraîchir en arrière-plan (stale-while-revalidate)
    const fetchInBackground = async () => {
      try {
        const response = await fetch("/api/catalogue/featured?limit=20");
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            // ✅ Mettre à jour le cache silencieusement
            catalogueItemsCache.set(CACHE_KEY, data);
            logger.debug("🔄 Cache actualisé en arrière-plan");

            // Optionnel: Mettre à jour les données affichées
            setCatalogItems(data);
            const shuffled = [...data].sort(() => Math.random() - 0.5);
            setRandomizedItems(shuffled);
          }
        }
      } catch (err) {
        logger.warn("⚠️ Échec du rafraîchissement en arrière-plan:", err);
      }
    };

    fetchCatalogData();
  }, []); // Exécuter uniquement au montage du composant


  // Gestion de la sélection d'un élément - Optimisée avec traçabilité
  const handleItemSelect = (item: CatalogItem) => {
    setSelectedPack(item.id);
    setTimeout(() => {
      // ✅ Redirection vers les nouvelles pages de détail du catalogue
      const catalogId = item.catalogId || item.id;
      const redirectPath = `/catalogue/${catalogId}`;

      router.push(redirectPath);
    }, 300);
  };


  // Retry function pour les erreurs
  const handleRetry = () => {
    window.location.reload();
  };


  // Fonction pour obtenir la couleur appropriée selon le type de badge
  const getBadgeColor = (badgeText: string): string => {
    switch (badgeText.toLowerCase()) {
      case "promo":
        return "#fbbf24"; // Jaune
      case "populaire":
        return "#f97316"; // Orange
      case "week-end":
        return "#3b82f6"; // Bleu
      case "garantie":
        return "#22c55e"; // Vert
      case "nouveau":
        return "#10b981"; // Vert émeraude
      default:
        return "#f97316"; // Orange par défaut
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 form-generator font-ios">
      {/* 🎨 Styles iOS 18 simplifiés */}
      <FormStylesSimplified globalConfig={globalFormPreset} />

      {/* Intégration du schema JSON-LD */}
      <CatalogueSchema />

      {/* Barre de navigation des services */}
      <ServicesNavigation />

      {/* Section promotionnelle compacte */}
      <div className="bg-white border-b border-gray-200 pt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
            {/* Texte promotionnel principal */}
            <div className="text-center lg:text-left flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-1">
                🎯 Solutions Sur Mesure & Forfaits Personnalisables !
              </h2>
              <p className="text-xs text-gray-600 max-w-2xl">
                Services adaptés à vos besoins spécifiques avec tarification flexible. Choisissez entre nos solutions sur mesure ou nos forfaits personnalisables.
              </p>
            </div>
            
            {/* Encart promotionnel avec défilement */}
            <div className="bg-green-300 text-gray-800 px-5 py-3 rounded-xl shadow-xl min-w-[320px] border-2 border-green-400">
              <div className="text-center">
                <div className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                  <span className="text-2xl">🔥</span>
                  <span>En Promotion</span>
                </div>
                <div className="text-sm font-medium h-10 overflow-hidden relative bg-green-100 rounded-lg px-2 mt-3">
                  <div className="animate-scroll">
                    {randomizedItems.length > 0 ? (
                      <>
                        {randomizedItems.slice(0, 4).map((item, index) => (
                          <div key={item.id} className="text-center py-1">
                            <div className="font-bold text-gray-800 text-base">
                              {item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title}
                            </div>
                            <div className="text-sm text-gray-700 font-medium">
                              {item.price > 0 ? `${item.price}€` : 'Sur devis'}
                              {item.badgeText && <span className="ml-2 bg-yellow-400 text-orange-800 px-1 rounded text-sm"> {item.badgeText}</span>}
                            </div>
                          </div>
                        ))}
                        {/* Dupliquer pour un défilement continu */}
                        {randomizedItems.slice(0, 4).map((item, index) => (
                          <div key={`duplicate-${item.id}`} className="text-center py-1">
                            <div className="font-bold text-gray-800 text-base">
                              {item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title}
                            </div>
                            <div className="text-sm text-gray-700 font-medium">
                              {item.price > 0 ? `${item.price}€` : 'Sur devis'}
                              {item.badgeText && <span className="ml-2 bg-yellow-400 text-orange-800 px-1 rounded text-sm"> {item.badgeText}</span>}
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-1 text-gray-800 font-medium">Chargement des offres...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="py-4 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() =>
                router.push("/catalogue/catalog-demenagement-sur-mesure")
              }
              className="group w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 font-ios-semibold text-base"
            >
              <TruckIcon className="w-4 h-4" />
              Déménagement sur mesure
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() =>
                router.push("/catalogue/catalog-menage-sur-mesure")
              }
              className="group w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2 font-ios-semibold text-base"
            >
              <SparklesIcon className="w-4 h-4" />
              Ménage sur mesure
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Layout principal - Services uniquement */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section services avec toute la largeur */}
        <div className="w-full">
           {/* Header des services modernisé */}
           <div className="text-center mb-8">
             <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-emerald-700 to-blue-700 bg-clip-text text-transparent mb-3">
               Forfaits Personnalisables
             </h2>
             <p className="text-base text-gray-600 max-w-3xl mx-auto leading-relaxed">
               <span className="font-semibold text-emerald-600">
                 Services modulaires
               </span>{" "}
               avec prix fixes et{" "}
               <span className="font-semibold text-blue-600">
                 options personnalisables
               </span>{" "}
               pour répondre à vos besoins spécifiques
             </p>
           </div>

          {/* État de chargement */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-200 animate-pulse rounded-xl h-32"
                ></div>
              ))}
            </div>
          )}

          {/* État d'erreur amélioré */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-red-800 mb-2">
                Erreur de chargement
              </h3>
              <p className="text-red-600 text-sm mb-3">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Grille des services sans regroupement par catégorie */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {catalogItems.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl col-span-full">
                  <p className="text-gray-500">
                    Aucun élément disponible pour le moment
                  </p>
                </div>
              ) : (
                catalogItems.map((item) => {
                        const IconComponent = getCategoryIcon(
                          item.category,
                          item.subcategory,
                        );
                        const categoryColor = getCategoryColor(item.category);

                        return (
                    <CatalogueCard
                            key={item.id}
                      item={item}
                      icon={IconComponent}
                      categoryColor={categoryColor}
                      onClick={() => handleItemSelect(item)}
                      className={
                              selectedPack === item.id
                                ? "ring-2 ring-emerald-500 scale-105"
                                : ""
                      }
                    />
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

       {/* Section Services Premium */}
       <div className="bg-gradient-to-br from-slate-50 to-gray-100 py-8 border-t border-gray-200">
         <div className="w-full px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-8">
             <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-100 to-blue-100 text-gray-800 px-3 py-1.5 rounded-full text-xs font-semibold mb-3">
               <StarIcon className="w-3 h-3" />
               Services Premium
             </div>
             <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-emerald-700 to-blue-700 bg-clip-text text-transparent mb-3">
               Solutions Sur Mesure
             </h2>
             <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
               <span className="font-semibold text-emerald-600">
                 Expertise professionnelle
               </span>{" "}
               pour des{" "}
               <span className="font-semibold text-blue-600">
                 services personnalisés
               </span>{" "}
               adaptés à vos besoins spécifiques
             </p>
           </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Déménagement Sur Mesure */}
            <button
              onClick={() =>
                router.push("/catalogue/catalog-demenagement-sur-mesure")
              }
              className="group text-left"
            >
              <div className="bg-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 relative overflow-hidden border border-gray-100">
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-50/50 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
                    <TruckIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-emerald-700 mb-3">
                    Déménagement Sur Mesure
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                    <span className="font-semibold text-emerald-600">Expertise professionnelle</span> pour votre déménagement. 
                    Équipe qualifiée, matériel adapté et suivi personnalisé.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">Équipe professionnelle certifiée</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">Matériel de protection inclus</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm">Assurance responsabilité civile</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-600 font-bold text-base group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      Devis gratuit <ArrowRightIcon className="w-3 h-3" />
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 px-2 py-1 rounded-full shadow-lg">
                      <StarIcon className="w-3 h-3" />
                      Premium
                    </div>
                  </div>
                </div>
              </div>
            </button>

            {/* Nettoyage Sur Mesure */}
            <button
              onClick={() =>
                router.push("/catalogue/catalog-menage-sur-mesure")
              }
              className="group text-left"
            >
              <div className="bg-white rounded-xl p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:-translate-y-1 relative overflow-hidden border border-gray-100">
                {/* Effet de brillance */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/50 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <SparklesIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-700 mb-3">
                    Nettoyage Sur Mesure
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed text-sm">
                    <span className="font-semibold text-blue-600">Service personnalisé</span> pour tous vos besoins de nettoyage. 
                    Produits écologiques et techniques professionnelles.
                  </p>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Produits écologiques certifiés</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Techniques professionnelles</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Flexibilité des horaires</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 font-bold text-base group-hover:translate-x-1 transition-transform flex items-center gap-2">
                      Devis gratuit <ArrowRightIcon className="w-3 h-3" />
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 px-2 py-1 rounded-full shadow-lg">
                      <StarIcon className="w-3 h-3" />
                      Premium
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
