import { useState, useCallback } from 'react';
import { Service } from '@/types/booking';
import { usePriceCalculator } from '../../generic/usePriceCalculator';
import { createServicePriceConfig, ServiceExtraData, ServicePriceDetails } from './servicePriceConfig';

export const useServicePriceCalculator = (service: Service) => {
  // Créer la configuration pour le service
  const config = createServicePriceConfig(service);
  
  // Utiliser le hook générique
  const {
    calculatedPrice,
    priceDetails,
    isPriceLoading,
    calculatePrice: baseCalculatePrice
  } = usePriceCalculator(config, service.price);

  // Wrapper pour includer le service dans les données extra
  const calculatePrice = useCallback(async (formData: any) => {
    const extraData: ServiceExtraData = { service };
    await baseCalculatePrice(formData, extraData);
    return priceDetails as ServicePriceDetails;
  }, [baseCalculatePrice, service, priceDetails]);

  return {
    calculatedPrice,
    priceDetails: priceDetails as ServicePriceDetails,
    isPriceLoading,
    calculatePrice
  };
}; 