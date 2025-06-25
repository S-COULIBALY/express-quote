import { useState, useCallback } from 'react';
import { Pack } from '@/types/booking';
import { usePriceCalculator } from '../../generic/usePriceCalculator';
import { createPackPriceConfig, PackExtraData } from './packPriceConfig';
import { calculateDistance } from '@/actions/distanceCalculator';

export const usePackPriceCalculator = (pack: Pack) => {
  const [distance, setDistance] = useState<number>(0);
  
  // Créer la configuration avec le pack et la distance
  const config = createPackPriceConfig(pack, distance);
  
  // Utiliser le hook générique
  const {
    calculatedPrice,
    priceDetails,
    isPriceLoading,
    calculatePrice: baseCalculatePrice
  } = usePriceCalculator(config, pack.price);

  // Wrapper pour includer le pack et la distance dans les données extra
  const calculatePrice = useCallback(async (formData: any) => {
    console.log(`📏 [PACK] Vérification des adresses pour calcul de distance`);
    console.log(`📍 Pickup: "${formData.pickupAddress}"`);
    console.log(`📍 Delivery: "${formData.deliveryAddress}"`);
    
    let currentDistance = distance;
    
    // Calculer la distance si les deux adresses sont disponibles
    if (formData.pickupAddress && formData.deliveryAddress) {
      try {
        console.log(`📏 [PACK] Calcul de la distance en cours...`);
        currentDistance = await calculateDistance(formData.pickupAddress, formData.deliveryAddress);
        console.log(`📏 [PACK] Distance calculée: ${currentDistance} km`);
        setDistance(currentDistance);
      } catch (error) {
        console.error(`❌ [PACK] Erreur lors du calcul de la distance:`, error);
        console.log(`📏 [PACK] Utilisation de la distance par défaut: ${distance} km`);
      }
    } else {
      console.log(`📏 [PACK] Adresses incomplètes, distance: ${distance} km`);
    }
    
    const extraData: PackExtraData = { pack, distance: currentDistance };
    await baseCalculatePrice(formData, extraData);
  }, [baseCalculatePrice, pack, distance]);

  const updateDistance = useCallback((newDistance: number) => {
    setDistance(newDistance);
  }, []);

  return {
    calculatedPrice,
    priceDetails,
    isPriceLoading,
    distance,
    calculatePrice,
    updateDistance
  };
}; 