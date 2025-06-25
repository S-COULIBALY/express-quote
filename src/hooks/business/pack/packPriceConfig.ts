import { PriceCalculatorConfig, calculateVAT } from '@/utils/priceCalculatorUtils';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { Pack } from '@/types/booking';

export interface PackExtraData {
  pack: Pack;
  distance?: number;
}

export const createPackPriceConfig = (pack: Pack, distance: number = 0): PriceCalculatorConfig => ({
  serviceType: 'PACK',
  fallbackServiceType: ServiceType.MOVING, // Les packs utilisent le fallback moving
  defaultPrice: pack.price,

  validateFormData: (formData: any) => {
    return !!(formData.duration && formData.workers && formData.pickupAddress && formData.deliveryAddress);
  },

  prepareApiData: (formData: any, extraData?: PackExtraData) => {
    return {
      defaultPrice: pack.price,
      workers: parseInt(formData.workers),
      duration: parseInt(formData.duration),
      baseWorkers: pack.workers,
      baseDuration: pack.duration,
      distance: extraData?.distance || distance || 0,
      pickupNeedsLift: formData.pickupNeedsLift,
      deliveryNeedsLift: formData.deliveryNeedsLift
    };
  },

  processPriceDetails: (apiResult: any, extraData?: PackExtraData) => {
    return {
      baseCost: pack.price,
      totalCost: apiResult.price || apiResult.quote?.totalPrice || 0,
      totalWithVat: calculateVAT(apiResult.price || apiResult.quote?.totalPrice || 0),
      extraDaysCost: 0,
      extraWorkersCost: 0,
      distanceCost: 0,
      liftCost: 0
    };
  },

  prepareFallbackData: (formData: any, extraData?: PackExtraData) => {
    return {
      defaultPrice: pack.price,
      workers: parseInt(formData.workers),
      duration: parseInt(formData.duration),
      baseWorkers: pack.workers,
      baseDuration: pack.duration,
      distance: extraData?.distance || distance || 0,
      pickupNeedsLift: formData.pickupNeedsLift,
      deliveryNeedsLift: formData.deliveryNeedsLift
    };
  },

  processFallbackResult: (fallbackResult: any, extraData?: PackExtraData) => {
    const details = fallbackResult.details;
    return {
      baseCost: pack.price,
      totalCost: details.finalPrice || details.totalCost || 0,
      totalWithVat: calculateVAT(details.finalPrice || details.totalCost || 0),
      extraDaysCost: details.extraDurationCost || details.extraDaysCost || 0,
      extraWorkersCost: details.extraWorkerCost || details.extraWorkersCost || 0,
      distanceCost: details.extraDistanceCost || details.distanceCost || 0,
      liftCost: details.liftCost || 0
    };
  }
}); 