import { PriceCalculatorConfig, calculateVAT } from '@/utils/priceCalculatorUtils';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { SubmissionConfig } from '@/utils/submissionUtils';
import { FLOOR_CONSTANTS, detectFurnitureLift } from '@/quotation/domain/configuration/constants';

export interface MovingExtraData {
  distance?: number;
}

export const createMovingPriceConfig = (distance: number = 0): PriceCalculatorConfig => ({
  serviceType: 'MOVING',
  fallbackServiceType: ServiceType.MOVING,
  defaultPrice: 400,

  validateFormData: (formData: any) => {
    return !!(formData.volume && formData.pickupAddress && formData.deliveryAddress);
  },

  prepareApiData: (formData: any, extraData?: MovingExtraData) => {
    const logisticsConstraintCount = (formData.pickupLogisticsConstraints?.length || 0) + 
                                     (formData.deliveryLogisticsConstraints?.length || 0);
    
    const hasComplexAccess = formData.pickupLogisticsConstraints?.some((id: string) => 
      ['narrow_street', 'pedestrian_zone', 'narrow_corridor', 'spiral_staircase'].includes(id)
    ) || formData.deliveryLogisticsConstraints?.some((id: string) => 
      ['narrow_street', 'pedestrian_zone', 'narrow_corridor', 'spiral_staircase'].includes(id)
    );

    return {
      volume: parseFloat(formData.volume) || 0,
      distance: extraData?.distance || distance || 0,
      pickupFloor: parseInt(formData.pickupFloor) || 0,
      deliveryFloor: parseInt(formData.deliveryFloor) || 0,
      pickupElevator: formData.pickupElevator !== 'no',
      deliveryElevator: formData.deliveryElevator !== 'no',
      pickupElevatorType: formData.pickupElevator,
      deliveryElevatorType: formData.deliveryElevator,
      pickupCarryDistance: formData.pickupCarryDistance,
      deliveryCarryDistance: formData.deliveryCarryDistance,
      logisticsConstraintCount,
      hasComplexAccess,
      pickupLogisticsConstraints: formData.pickupLogisticsConstraints || [],
      deliveryLogisticsConstraints: formData.deliveryLogisticsConstraints || [],
      options: {
        packaging: formData.packaging || false,
        furniture: formData.furniture || false,
        fragile: formData.fragile || false,
        storage: formData.storage || false,
        disassembly: formData.disassembly || false,
        unpacking: formData.unpacking || false,
        supplies: formData.supplies || false,
        fragileItems: formData.fragileItems || false
      }
    };
  },

  processPriceDetails: (apiResult: any, extraData?: MovingExtraData) => {
    // L'API retourne: {success: true, price: 1723, vat: 345, totalWithVat: 2068, quote: {...}}
    const finalPrice = apiResult.price || apiResult.quote?.totalPrice || apiResult.quote?.basePrice || 0;
    const basePrice = apiResult.quote?.basePrice || apiResult.price || 0;
    
    return {
      baseCost: basePrice,
      totalCost: finalPrice,
      totalWithVat: apiResult.totalWithVat || calculateVAT(finalPrice),
      distancePrice: apiResult.quote?.distancePrice || 0,
      tollCost: apiResult.quote?.tollCost || 0,
      fuelCost: apiResult.quote?.fuelCost || 0,
      optionsCost: apiResult.quote?.optionsCost || 0,
      logisticsConstraintCost: apiResult.quote?.logisticsConstraintCost || 0,
      complexAccessFee: apiResult.quote?.complexAccessFee || 0
    };
  },

  prepareFallbackData: (formData: any, extraData?: MovingExtraData) => {
    return {
      volume: parseFloat(formData.volume) || 0,
      distance: extraData?.distance || distance || 0,
      options: {
        packaging: formData.packaging || false,
        furniture: formData.furniture || false,
        fragile: formData.fragile || false,
        storage: formData.storage || false,
        disassembly: formData.disassembly || false,
        unpacking: formData.unpacking || false,
        supplies: formData.supplies || false,
        fragileItems: formData.fragileItems || false
      },
      // ✅ NOUVELLE LOGIQUE ÉCONOMIQUE pour le monte-meuble - UTILISE LA FONCTION CENTRALISÉE
      pickupNeedsLift: detectFurnitureLift(
        parseInt(formData.pickupFloor) || 0,
        formData.pickupElevator || 'no',
        formData.pickupLogisticsConstraints || [],
        formData.additionalServices || []
      ),
      deliveryNeedsLift: detectFurnitureLift(
        parseInt(formData.deliveryFloor) || 0,
        formData.deliveryElevator || 'no',
        formData.deliveryLogisticsConstraints || [],
        formData.additionalServices || []
      )
    };
  },

  processFallbackResult: (fallbackResult: any, extraData?: MovingExtraData) => {
    const uiResponse = fallbackResult.details;
    return {
      ...uiResponse,
      totalCost: uiResponse.finalPrice || uiResponse.totalCost || 0,
      totalWithVat: calculateVAT(uiResponse.finalPrice || uiResponse.totalCost || 0)
    };
  }
}); 