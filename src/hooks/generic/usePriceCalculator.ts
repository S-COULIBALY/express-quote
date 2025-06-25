import { useState, useCallback } from 'react';
import { 
  PriceCalculatorConfig, 
  callPriceAPI, 
  handlePriceError, 
  logPriceCalculation 
} from '@/utils/priceCalculatorUtils';

export interface UsePriceCalculatorResult {
  calculatedPrice: number;
  priceDetails: any;
  isPriceLoading: boolean;
  calculatePrice: (formData: any, extraData?: any) => Promise<void>;
}

export const usePriceCalculator = (
  config: PriceCalculatorConfig,
  initialPrice?: number,
  extraData?: any
): UsePriceCalculatorResult => {
  const [calculatedPrice, setCalculatedPrice] = useState<number>(initialPrice ?? 0);
  const [priceDetails, setPriceDetails] = useState<any | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  const calculatePrice = useCallback(async (formData: any, additionalExtraData?: any) => {
    console.log(`🚀 [${config.serviceType}] Début du calcul de prix`);
    console.log(`📝 [${config.serviceType}] Données reçues:`, formData);
    
    // Validation des données d'entrée
    const isValid = config.validateFormData(formData);
    console.log(`✅ [${config.serviceType}] Validation des données:`, isValid);
    
    if (!isValid) {
      console.log(`❌ [${config.serviceType}] Validation échouée, arrêt du calcul`);
      return;
    }

    setIsPriceLoading(true);
    
    const currentExtraData = additionalExtraData || extraData;

    try {
      // Préparation des données pour l'API
      const apiData = config.prepareApiData(formData, currentExtraData);
      console.log(`🔧 [${config.serviceType}] Données préparées pour l'API:`, apiData);
      
      // Logging du début du calcul
      logPriceCalculation.start(config.serviceType, apiData);
      
      // Appel API principal
      console.log(`🌐 [${config.serviceType}] Appel API en cours...`);
      const result = await callPriceAPI(config.serviceType, apiData);
      console.log(`📨 [${config.serviceType}] Réponse de l'API:`, result);
      
      // Logging du succès
      logPriceCalculation.success(config.serviceType, result);
      
      // Traitement des résultats
      const processedDetails = config.processPriceDetails(result, currentExtraData);
      console.log(`⚙️ [${config.serviceType}] Détails traités:`, processedDetails);
      
      // Calculer le prix final
      const apiPrice = processedDetails.totalCost || result.price || result.quote?.totalPrice || 0;
      console.log(`💰 [${config.serviceType}] Prix API:`, apiPrice);
      
      // Si l'API retourne 0, utiliser le fallback
      if (apiPrice === 0) {
        console.log(`🔄 [${config.serviceType}] Prix API = 0, utilisation du fallback`);
        const { price, details } = await handlePriceError(new Error('Prix API = 0'), config, formData, currentExtraData);
        console.log(`🔄 [${config.serviceType}] Résultat du fallback - Prix:`, price, 'Détails:', details);
        
        setCalculatedPrice(price);
        setPriceDetails(details);
      } else {
        console.log(`💰 [${config.serviceType}] Prix final calculé:`, apiPrice);
        setCalculatedPrice(apiPrice);
      setPriceDetails(processedDetails);
      }
      
    } catch (error) {
      console.log(`❌ [${config.serviceType}] Erreur API, tentative de fallback:`, error);
      
      // Gestion d'erreur avec fallback
      const { price, details } = await handlePriceError(error, config, formData, currentExtraData);
      console.log(`🔄 [${config.serviceType}] Résultat du fallback - Prix:`, price, 'Détails:', details);
      
      setCalculatedPrice(price);
      setPriceDetails(details);
    } finally {
      setIsPriceLoading(false);
      console.log(`🏁 [${config.serviceType}] Calcul terminé`);
    }
  }, [config, extraData]);

  return {
    calculatedPrice,
    priceDetails,
    isPriceLoading,
    calculatePrice
  };
}; 