import { PriceCalculatorConfig, calculateVAT } from '@/utils/priceCalculatorUtils';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

// Exemple : Configuration pour un nouveau service de jardinage
export interface GardeningExtraData {
  areaSize?: number;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
}

export const createGardeningPriceConfig = (areaSize: number = 0): PriceCalculatorConfig => ({
  serviceType: 'GARDENING' as any, // Nouveau type
  fallbackServiceType: ServiceType.MOVING,
  defaultPrice: 150,

  validateFormData: (formData: any) => {
    return !!(formData.areaSize && formData.serviceDate && formData.location);
  },

  prepareApiData: (formData: any, extraData?: GardeningExtraData) => {
    return {
      areaSize: parseFloat(formData.areaSize) || extraData?.areaSize || 0,
      serviceType: formData.serviceType || 'basic_maintenance',
      season: extraData?.season || getCurrentSeason(),
      location: formData.location,
      additionalServices: formData.additionalServices || [],
      defaultPrice: 150
    };
  },

  processPriceDetails: (apiResult: any, extraData?: GardeningExtraData) => {
    return {
      baseCost: apiResult.quote?.basePrice || 150,
      totalCost: apiResult.price || apiResult.quote?.totalPrice || 150,
      totalWithVat: calculateVAT(apiResult.price || apiResult.quote?.totalPrice || 150),
      areaCost: apiResult.quote?.areaCost || 0,
      seasonalAdjustment: apiResult.quote?.seasonalAdjustment || 0,
      additionalServicesCost: apiResult.quote?.additionalServicesCost || 0,
      equipmentCost: apiResult.quote?.equipmentCost || 0
    };
  },

  prepareFallbackData: (formData: any, extraData?: GardeningExtraData) => {
    // Logique de fallback simple
    const basePrice = 150;
    const areaMultiplier = (parseFloat(formData.areaSize) || 0) * 2; // 2€/m²
    const seasonMultiplier = extraData?.season === 'spring' ? 1.2 : 1.0;
    
    return {
      defaultPrice: Math.round(basePrice + areaMultiplier * seasonMultiplier),
      areaSize: parseFloat(formData.areaSize) || 0,
      serviceType: formData.serviceType || 'basic_maintenance'
    };
  },

  processFallbackResult: (fallbackResult: any, extraData?: GardeningExtraData) => {
    const totalCost = fallbackResult.details?.finalPrice || fallbackResult.defaultPrice || 150;
    return {
      baseCost: 150,
      totalCost,
      totalWithVat: calculateVAT(totalCost),
      areaCost: Math.max(0, totalCost - 150),
      seasonalAdjustment: extraData?.season === 'spring' ? totalCost * 0.2 : 0,
      additionalServicesCost: 0,
      equipmentCost: 0
    };
  }
});

// Utilitaire helper pour déterminer la saison
function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// Hook spécialisé pour le jardinage (seulement 15 lignes !)
export const useGardeningPriceCalculator = (areaSize: number = 0) => {
  const config = createGardeningPriceConfig(areaSize);
  const { usePriceCalculator } = require('../usePriceCalculator');
  
  return usePriceCalculator(config, 150);
};

/*
Usage dans un composant :

import { useGardeningPriceCalculator } from '@/hooks/examples/exampleNewServiceConfig';

const GardeningQuoteForm = () => {
  const { calculatePrice, calculatedPrice, isPriceLoading } = useGardeningPriceCalculator(100); // 100m²

  const handleCalculatePrice = async (formData) => {
    await calculatePrice(formData);
  };

  return (
    <div>
      <button onClick={() => handleCalculatePrice(formData)}>
        Calculer le prix
      </button>
      {isPriceLoading ? (
        <p>Calcul en cours...</p>
      ) : (
        <p>Prix calculé: {calculatedPrice}€</p>
      )}
    </div>
  );
};
*/ 