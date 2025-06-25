import { SubmissionConfig } from '@/utils/submissionUtils';
import { Pack } from '@/types/booking';
import { FLOOR_CONSTANTS, detectFurnitureLiftForBothAddresses } from '@/quotation/domain/configuration/constants';

export interface PackSubmissionExtraData {
  pack: Pack;
  distance?: number;
}

export const createPackSubmissionConfig = (pack: Pack, distance: number = 0): SubmissionConfig => ({
  submissionType: 'PACK',

  validateFormData: (formData: any, extraData?: PackSubmissionExtraData) => {
    // Validation des champs requis
    if (!formData.scheduledDate || !formData.pickupAddress || !formData.deliveryAddress) {
      return 'Veuillez remplir tous les champs obligatoires.';
    }
    
    // ✅ HARMONISATION: Validation avec nouvelle logique économique centralisée
    const pickupData = {
      floor: parseInt(formData.pickupFloor) || 0,
      elevator: formData.pickupHasElevator === 'true' ? 'medium' : 'no',
      constraints: formData.pickupLogisticsConstraints || [],
      services: []
    };
    
    const deliveryData = {
      floor: parseInt(formData.deliveryFloor) || 0,
      elevator: formData.deliveryHasElevator === 'true' ? 'medium' : 'no',
      constraints: formData.deliveryLogisticsConstraints || [],
      services: []
    };
    
    const furnitureLiftRequired = detectFurnitureLiftForBothAddresses(pickupData, deliveryData);
    
    if (furnitureLiftRequired && !formData.pickupNeedsLift && !formData.deliveryNeedsLift) {
      return 'Un monte-meuble est obligatoire selon les contraintes détectées (étages élevés, contraintes d\'accès, ou ascenseur inadapté).';
    }

    return true;
  },

  prepareRequestData: (formData: any, extraData?: PackSubmissionExtraData) => {
    return {
      packId: pack.id,
      scheduledDate: formData.scheduledDate,
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      pickupFloor: parseInt(formData.pickupFloor),
      pickupHasElevator: formData.pickupHasElevator === 'true',
      pickupNeedsLift: formData.pickupNeedsLift,
      pickupLogisticsConstraints: formData.pickupLogisticsConstraints,
      pickupCarryDistance: formData.pickupCarryDistance,
      deliveryFloor: parseInt(formData.deliveryFloor),
      deliveryHasElevator: formData.deliveryHasElevator === 'true',
      deliveryNeedsLift: formData.deliveryNeedsLift,
      deliveryLogisticsConstraints: formData.deliveryLogisticsConstraints,
      deliveryCarryDistance: formData.deliveryCarryDistance,
      distance: extraData?.distance || distance,
      duration: parseInt(formData.duration),
      workers: parseInt(formData.workers),
      additionalInfo: formData.additionalInfo,
      calculatedPrice: formData.calculatedPrice || pack.price,
      whatsappOptIn: formData.whatsappOptIn
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/packs/summary?quoteRequestId=${responseData.id}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: PackSubmissionExtraData) => {
    return {
      serviceDate: formData.scheduledDate,
      serviceAddress: `${formData.pickupAddress} → ${formData.deliveryAddress}`,
      additionalDetails: ''
    };
  }
}); 