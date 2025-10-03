import { useState, useCallback } from 'react';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

export interface CentralizedPricingRequest {
  serviceType: ServiceType;
  volume?: number;
  distance?: number;
  duration?: number;
  workers?: number;
  scheduledDate?: Date | string;
  pickupAddress?: string;
  deliveryAddress?: string;
  pickupFloor?: number;
  deliveryFloor?: number;
  pickupElevator?: boolean;
  deliveryElevator?: boolean;
  pickupCarryDistance?: number;
  deliveryCarryDistance?: number;
  location?: string;
  options?: Record<string, any>;
  // ✅ Ajout du __presetSnapshot pour la comparaison PACKING non modifié
  __presetSnapshot?: {
    volume?: number; // Optionnel (pas de volume pour PACKING)
    distance: number;
    workers: number;
    duration: number;
    // ✅ AJOUT : Données de promotion pour la comparaison
    promotionCode?: string;
    promotionValue?: number;
    promotionType?: string;
    isPromotionActive?: boolean;
  };
  [key: string]: any;
}

export interface CentralizedPricingResult {
  calculatedPrice: number;
  basePrice: number;
  totalPrice: number;
  currency: string;
  breakdown: Record<string, number>;
  appliedRules: Array<{ name: string; impact: number; type: string }>;
  calculationId: string;
  isPriceLoading: boolean;
  error?: string;
}


/**
 * Hook unifié pour l'API prix centralisée
 * Tous les calculs se font côté serveur maintenant
 */
export const useCentralizedPricing = () => {
  console.log('🔍 [TRACE] useCentralizedPricing HOOK CALLED');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CentralizedPricingResult | null>(null);

  /**
   * Calcul de prix complet avec toutes les règles (côté serveur)
   */
  const calculatePrice = useCallback(async (request: CentralizedPricingRequest): Promise<CentralizedPricingResult> => {
    setIsLoading(true);
    
    try {
      console.log('💰 Calcul prix centralisé:', request);
      
      const response = await fetch('/api/price/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors du calcul de prix');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Calcul de prix échoué');
      }

      const result: CentralizedPricingResult = {
        calculatedPrice: data.data.totalPrice,
        basePrice: data.data.basePrice,
        totalPrice: data.data.totalPrice,
        currency: data.data.currency,
        breakdown: data.data.breakdown,
        appliedRules: data.data.appliedRules,
        calculationId: data.data.calculationId,
        isPriceLoading: false
      };

      setLastResult(result);
      console.log('✅ Prix calculé côté serveur:', result);
      
      return result;

    } catch (error) {
      console.error('❌ Erreur calcul prix:', error);
      
      const errorResult: CentralizedPricingResult = {
        calculatedPrice: 0,
        basePrice: 0,
        totalPrice: 0,
        currency: 'EUR',
        breakdown: {},
        appliedRules: [],
        calculationId: '',
        isPriceLoading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };

      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  }, []);


  /**
   * Récupération des règles de tarification (pour admin)
   * Utilise la nouvelle API dédiée /api/admin/pricing/rules
   */
  const getRules = useCallback(async (filter?: { serviceType?: ServiceType; category?: string; active?: boolean }) => {
    try {
      const params = new URLSearchParams();
      if (filter?.serviceType) params.append('serviceType', filter.serviceType);
      if (filter?.category) params.append('category', filter.category);
      if (filter?.active !== undefined) params.append('active', filter.active.toString());

      const url = params.toString() 
        ? `/api/admin/pricing/rules?${params.toString()}`
        : '/api/admin/pricing/rules';

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la récupération des règles');
      }

      const data = await response.json();
      
      // L'API admin/pricing/rules retourne toujours le format centralisé
      if (data.success && data.data) {
        console.log('📋 Règles récupérées via API admin/pricing:', data.data);
        return data.data;
      }
      
      // Fallback en cas de réponse inattendue
      console.warn('⚠️ Format de réponse inattendu:', data);
      return { rules: [], totalCount: 0 };

    } catch (error) {
      console.error('❌ Erreur récupération règles:', error);
      throw error;
    }
  }, []);

  return {
    // Méthodes principales
    calculatePrice,
    getRules,

    // État
    isLoading,
    lastResult,

    // Compatibilité avec les hooks existants
    calculatedPrice: lastResult?.calculatedPrice || 0,
    priceDetails: lastResult,
    isPriceLoading: isLoading
  };
};

/**
 * Hook simplifié pour les formulaires
 * Tous les calculs se font côté serveur
 */
export const useRealTimePricing = (serviceType: ServiceType, basePrice: number = 0, presetSnapshot?: any) => {
  console.log('🔍 [TRACE] useRealTimePricing HOOK CALLED - serviceType:', serviceType, 'basePrice:', basePrice, 'presetSnapshot:', presetSnapshot);
  const { calculatePrice, isLoading, lastResult } = useCentralizedPricing();
  
  const calculatePriceFromFormData = useCallback(async (formData: any) => {
    console.log('🔍 [useRealTimePricing] calculatePriceFromFormData appelé avec:', {
      serviceType,
      basePrice,
      presetSnapshot,
      formDataKeys: Object.keys(formData),
      formDataSample: {
        duration: formData.duration,
        workers: formData.workers,
        location: formData.location?.substring(0, 30),
        scheduledDate: formData.scheduledDate
      }
    });
    
    // ✅ CORRECTION : Extraire les données de promotion du presetSnapshot
    const promotionData = presetSnapshot ? {
      promotionCode: presetSnapshot.promotionCode,
      promotionValue: presetSnapshot.promotionValue,
      promotionType: presetSnapshot.promotionType,
      isPromotionActive: presetSnapshot.isPromotionActive
    } : {};
    
    // Transformer les données du formulaire en request standardisé
    const request: CentralizedPricingRequest = {
      serviceType,
      defaultPrice: basePrice, // ✅ Ajouter le prix de base du pack/service
      __presetSnapshot: presetSnapshot, // ✅ Ajouter le snapshot pour la comparaison
      ...promotionData, // ✅ AJOUT : Données de promotion
      ...formData
    };
    
    console.log('📤 [useRealTimePricing] Request final:', request);
    
    return await calculatePrice(request);
  }, [calculatePrice, serviceType, basePrice, presetSnapshot]);

  const finalCalculatedPrice = lastResult?.calculatedPrice || basePrice;
  
  console.log('🔍 [useRealTimePricing DEBUG]', {
    serviceType,
    basePrice,
    hasLastResult: !!lastResult,
    lastResultPrice: lastResult?.calculatedPrice,
    finalCalculatedPrice,
    isLoading
  });

  return {
    calculatePrice: calculatePriceFromFormData,
    calculatedPrice: finalCalculatedPrice,
    priceDetails: lastResult,
    isPriceLoading: isLoading
  };
}; 