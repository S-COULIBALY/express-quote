import { PriceCalculatorConfig, calculateVAT } from '@/utils/priceCalculatorUtils';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { Service } from '@/types/booking';

export interface ServiceExtraData {
  service: Service;
}

export interface ServicePriceDetails {
  basePrice: number;
  extraHoursCost: number;
  extraWorkerCost: number;
  constraintsCost?: number;
  complexConstraintsCost?: number;
  totalPrice: number;
  discount: number;
  vatAmount: number;
  totalWithVat: number;
  constraintCount?: number;
  hasComplexConstraints?: boolean;
}

export const createServicePriceConfig = (service: Service): PriceCalculatorConfig => ({
  serviceType: 'SERVICE',
  fallbackServiceType: ServiceType.MOVING, // Les services utilisent le fallback moving
  defaultPrice: service.price,

  validateFormData: (formData: any) => {
    return !!(service && service.price !== undefined && service.duration !== undefined && service.workers !== undefined);
  },

  prepareApiData: (formData: any, extraData?: ServiceExtraData) => {
    return {
      defaultPrice: service.price,
      duration: formData.duration || service.duration,
      workers: formData.workers || service.workers,
      defaultDuration: service.duration,
      defaultWorkers: service.workers,
      scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
      location: formData.location,
      additionalInfo: formData.additionalInfo,
      serviceConstraints: formData.serviceConstraints || [],
      constraintCount: (formData.serviceConstraints || []).length,
      hasComplexConstraints: (formData.serviceConstraints || []).some((constraint: string) => 
        ['very_dirty', 'post_construction', 'water_damage', 'mold_presence', 'heavy_furniture'].includes(constraint)
      )
    };
  },

  processPriceDetails: (apiResult: any, extraData?: ServiceExtraData): ServicePriceDetails => {
    let extraHoursCost = apiResult.details?.extraHoursCost || 0;
    let extraWorkerCost = apiResult.details?.extraWorkerCost || 0;
    const discount = apiResult.details?.discount || 0;
    
    // Calculs de secours si les données ne sont pas dans l'API
    const formDuration = extraData?.service.duration || service.duration;
    const formWorkers = extraData?.service.workers || service.workers;
    
    if (formDuration > service.duration && !extraHoursCost) {
      extraHoursCost = Math.round((formDuration - service.duration) * 35 * service.workers);
    }
    
    if (formWorkers > service.workers && !extraWorkerCost) {
      extraWorkerCost = Math.round((formWorkers - service.workers) * 35 * formDuration);
    }

    return {
      basePrice: apiResult.quote?.basePrice || service.price,
      extraHoursCost,
      extraWorkerCost,
      totalPrice: apiResult.price || service.price,
      discount,
      vatAmount: apiResult.vat || Math.round((apiResult.price || service.price) * 0.2),
      totalWithVat: apiResult.totalWithVat || Math.round((apiResult.price || service.price) * 1.2)
    };
  },

  prepareFallbackData: (formData: any, extraData?: ServiceExtraData) => {
    return {
      defaultPrice: service.price,
      duration: formData.duration || service.duration,
      workers: formData.workers || service.workers,
      defaultDuration: service.duration,
      defaultWorkers: service.workers,
      serviceConstraints: formData.serviceConstraints || [],
      constraintCount: (formData.serviceConstraints || []).length,
      hasComplexConstraints: (formData.serviceConstraints || []).some((constraint: string) => 
        ['very_dirty', 'post_construction', 'water_damage', 'mold_presence', 'heavy_furniture'].includes(constraint)
      )
    };
  },

  processFallbackResult: (fallbackResult: any, extraData?: ServiceExtraData): ServicePriceDetails => {
    const details = fallbackResult.details;
    return {
      basePrice: details.defaultPrice || service.price,
      extraHoursCost: details.extraHoursCost || details.extraDurationCost || 0,
      extraWorkerCost: details.extraWorkerCost || details.extraWorkersCost || 0,
      constraintsCost: details.constraintsCost || 0,
      complexConstraintsCost: details.complexConstraintsCost || 0,
      totalPrice: details.finalPrice || details.totalCost || 0,
      discount: 0,
      vatAmount: details.vatAmount || 0,
      totalWithVat: details.totalWithVat || 0,
      constraintCount: details.constraintCount || 0,
      hasComplexConstraints: details.hasComplexConstraints || false
    };
  }
}); 