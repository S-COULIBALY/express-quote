import { useState, useEffect } from "react";

export interface CatalogData {
  catalogSelection: {
    id: string;
    category: string;
    subcategory: string;
    marketingTitle: string;
    marketingSubtitle: string;
    marketingDescription: string;
    marketingPrice: number;
    originalPrice?: number;
    badgeText?: string;
    badgeColor?: string;
    promotionText?: string;
    // Système de promotion
    promotionCode?: string;
    promotionValue?: number;
    promotionType?: string;
    isPromotionActive?: boolean;
    isFeatured: boolean;
    isNewOffer: boolean;
  };
  item?: {
    id: string;
    type: string;
    name: string;
    description: string;
    price: number;
    workers: number;
    duration: number;
    features: string[];
    includedDistance?: number;
    distanceUnit?: string;
    includes: string[];
    popular: boolean;
    imagePath?: string;
    templateId?: string;
    parentItemId?: string;
  };
  template?: {
    id: string;
    type: string;
    name: string;
    description: string;
    price: number;
    workers: number;
    duration: number;
    features: string[];
    includedDistance?: number;
    distanceUnit?: string;
    includes: string[];
  };
  parentItem?: {
    id: string;
    name: string;
    price: number;
  };
  formDefaults: Record<string, any>;
}

export interface UseCatalogPreFillReturn {
  catalogData: CatalogData | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export const useCatalogPreFill = (
  catalogId: string | null,
): UseCatalogPreFillReturn => {
  const [catalogData, setCatalogData] = useState<CatalogData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogData = async () => {
    // API catalogue supprimée (2026-02) - seul déménagement sur mesure actif
    if (!catalogId) {
      setCatalogData(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    setCatalogData(null);
    setIsLoading(false);
    setError(null);
  };

  const retry = () => {
    fetchCatalogData();
  };

  useEffect(() => {
    fetchCatalogData();
  }, [catalogId]);

  return {
    catalogData,
    isLoading,
    error,
    retry,
  };
};

// Hook pour créer un item personnalisé
export const useCreatePersonalizedItem = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPersonalizedItem = async (_catalogId: string, _formData: any) => {
    setIsCreating(true);
    setError(null);
    try {
      throw new Error(
        "Catalogue / items personnalisés abandonnés. Utiliser le formulaire Déménagement sur mesure."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createPersonalizedItem,
    isCreating,
    error,
  };
};

// Helper pour déterminer le type de service selon la catégorie
export const getServiceTypeFromCategory = (category: string): string => {
  // Seul le déménagement est actif ; toutes les catégories mappées vers MOVING
  return "MOVING";
};

// Helper pour déterminer le chemin de redirection
export const getRedirectPath = (_category: string): string => {
  return "/catalogue/catalog-demenagement-sur-mesure";
};

// Helper pour formater les données de traçabilité
export const formatTraceability = (catalogData: CatalogData) => {
  return {
    catalogId: catalogData.catalogSelection.id,
    catalogTitle:
      catalogData.catalogSelection.marketingTitle ||
      catalogData.item?.name ||
      "",
    templateId: catalogData.template?.id,
    templateName: catalogData.template?.name,
    baseItemId: catalogData.item?.id,
    baseItemName: catalogData.item?.name,
    marketingPrice: catalogData.catalogSelection.marketingPrice,
    originalPrice:
      catalogData.catalogSelection.originalPrice || catalogData.item?.price,
    category: catalogData.catalogSelection.category,
    subcategory: catalogData.catalogSelection.subcategory,
    isFeatured: catalogData.catalogSelection.isFeatured,
    isNewOffer: catalogData.catalogSelection.isNewOffer,
    badgeText: catalogData.catalogSelection.badgeText,
    promotionText: catalogData.catalogSelection.promotionText,
  };
};
