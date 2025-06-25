import { FallbackCalculatorService } from '@/quotation/application/services/FallbackCalculatorService';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

export interface PriceCalculatorConfig {
  serviceType: 'MOVING' | 'PACK' | 'SERVICE';
  fallbackServiceType: ServiceType;
  defaultPrice: number;
  validateFormData: (formData: any) => boolean;
  prepareApiData: (formData: any, extraData?: any) => any;
  processPriceDetails: (apiResult: any, extraData?: any) => any;
  prepareFallbackData: (formData: any, extraData?: any) => any;
  processFallbackResult: (fallbackResult: any, extraData?: any) => any;
}

// Calcul de la TVA standardisé
export const calculateVAT = (price: number): string => {
  return ((price || 0) * 1.2).toFixed(2);
};

// Appel API standardisé
export const callPriceAPI = async (type: string, data: any) => {
  const payload = {
    type,
    data
  };
  
  console.log(`🌐 API CALL - Envoi des données au serveur:`, payload);
  console.log(`🌐 API CALL - Type: ${type}`);
  console.log(`🌐 API CALL - Data:`, JSON.stringify(data, null, 2));
  
  const response = await fetch('/api/bookings/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    console.error(`❌ API CALL - Erreur HTTP: ${response.status}`);
    throw new Error(`Erreur HTTP: ${response.status}`);
  }

  const result = await response.json();
  console.log(`✅ API CALL - Réponse du serveur:`, result);
  
  return result;
};

// Gestion d'erreur avec fallback standardisée
export const handlePriceError = async (
  error: any,
  config: PriceCalculatorConfig,
  formData: any,
  extraData?: any
): Promise<{ price: number; details: any }> => {
  console.error(`❌ Erreur lors du calcul du prix ${config.serviceType}:`, error);

  try {
    console.log(`🔄 ${config.serviceType} - Utilisation du service de fallback comme solution de repli`);
    
    const fallbackService = FallbackCalculatorService.getInstance();
    const fallbackData = config.prepareFallbackData(formData, extraData);
    console.log(`🔧 ${config.serviceType} - Données préparées pour le fallback:`, fallbackData);
    
    let fallbackResult;
    switch (config.serviceType) {
      case 'MOVING':
        console.log(`🚛 ${config.serviceType} - Calcul fallback Moving...`);
        fallbackResult = fallbackService.calculateMovingFallback(fallbackData);
        break;
      case 'PACK':
        console.log(`📦 ${config.serviceType} - Calcul fallback Pack...`);
        fallbackResult = fallbackService.calculatePackFallback(fallbackData);
        break;
      case 'SERVICE':
        console.log(`🏠 ${config.serviceType} - Calcul fallback Service...`);
        fallbackResult = fallbackService.calculateServiceFallback(fallbackData);
        break;
      default:
        throw new Error(`Service type non supporté: ${config.serviceType}`);
    }

    console.log(`📊 ${config.serviceType} - Résultat brut du fallback:`, fallbackResult);
    const processedResult = config.processFallbackResult(fallbackResult, extraData);
    console.log(`⚙️ ${config.serviceType} - Résultat traité du fallback:`, processedResult);
    
    return {
      price: processedResult.totalCost || processedResult.finalPrice || config.defaultPrice,
      details: processedResult
    };
  } catch (fallbackError) {
    console.error(`❌ Erreur également dans le service de fallback ${config.serviceType}:`, fallbackError);
    
    // Prix par défaut en dernier recours
    const defaultDetails = {
      baseCost: config.defaultPrice,
      totalCost: config.defaultPrice,
      totalWithVat: calculateVAT(config.defaultPrice)
    };

    console.log(`🆘 ${config.serviceType} - Utilisation du prix par défaut:`, config.defaultPrice);
    return {
      price: config.defaultPrice,
      details: defaultDetails
    };
  }
};

// Logging standardisé
export const logPriceCalculation = {
  start: (serviceType: string, params: any) => {
    console.log(`📊 ${serviceType} - Calcul du devis avec les paramètres:`, params);
  },
  success: (serviceType: string, result: any) => {
    console.log(`✅ ${serviceType} - Résultat du calcul API:`, result);
  },
  fallback: (serviceType: string) => {
    console.log(`🔄 ${serviceType} - Utilisation du service de fallback comme solution de repli`);
  }
}; 