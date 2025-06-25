import { useState, useCallback } from 'react';
import { usePriceCalculator } from '../../generic/usePriceCalculator';
import { createMovingPriceConfig, MovingExtraData } from './movingPriceConfig';
import { calculateDistance } from '@/actions/distanceCalculator';

export const useMovingPriceCalculator = () => {
  const [distance, setDistance] = useState<number>(0);
  
  // Créer la configuration avec la distance actuelle
  const config = createMovingPriceConfig(distance);
  
  // Utiliser le hook générique
  const {
    calculatedPrice,
    priceDetails,
    isPriceLoading,
    calculatePrice: baseCalculatePrice
  } = usePriceCalculator(config, 0);

  // Wrapper pour includer la distance dans les données extra
  const calculatePrice = useCallback(async (formData: any) => {
    console.log(`📏 [MOVING] Vérification des adresses pour calcul de distance`);
    console.log(`📍 Pickup: "${formData.pickupAddress}"`);
    console.log(`📍 Delivery: "${formData.deliveryAddress}"`);
    
    let currentDistance = distance;
    
    // Calculer la distance si les deux adresses sont disponibles
    if (formData.pickupAddress && formData.deliveryAddress) {
      try {
        console.log(`📏 [MOVING] Calcul de la distance en cours...`);
        currentDistance = await calculateDistance(formData.pickupAddress, formData.deliveryAddress);
        console.log(`📏 [MOVING] Distance calculée: ${currentDistance} km`);
        setDistance(currentDistance);
      } catch (error) {
        console.error(`❌ [MOVING] Erreur lors du calcul de la distance:`, error);
        console.log(`📏 [MOVING] Utilisation de la distance par défaut: ${distance} km`);
      }
    } else {
      console.log(`📏 [MOVING] Adresses incomplètes, distance: ${distance} km`);
    }
    
    const extraData: MovingExtraData = { distance: currentDistance };
    await baseCalculatePrice(formData, extraData);
  }, [baseCalculatePrice, distance]);

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