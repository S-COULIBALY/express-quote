import { SubmissionConfig } from '@/utils/submissionUtils';
import { CatalogueMovingItem } from '@/types/booking';
import { AutoDetectionService, AddressData } from '@/quotation/domain/services/AutoDetectionService';
import { DefaultValues } from '@/quotation/domain/configuration/DefaultValues';

export interface CatalogueMovingItemSubmissionExtraData {
  pack: CatalogueMovingItem;
  distance?: number;
}

export const createCatalogueMovingItemSubmissionConfig = (pack: CatalogueMovingItem, distance: number = 0): SubmissionConfig => ({
  submissionType: 'PACK',

  validateFormData: (formData: any, extraData?: CatalogueMovingItemSubmissionExtraData) => {
    // Validation des champs requis
    if (!formData.scheduledDate || !formData.pickupAddress || !formData.deliveryAddress) {
      return 'Veuillez remplir tous les champs obligatoires.';
    }
    
    // ✅ REFACTORISÉ: Validation avec AutoDetectionService
    const pickupData: AddressData = {
      floor: parseInt(formData.pickupFloor) || 0,
      elevator: (formData.pickupHasElevator === 'true' ? 'medium' : 'no') as 'no' | 'small' | 'medium' | 'large',
      constraints: formData.pickupLogisticsConstraints || []
    };

    const deliveryData: AddressData = {
      floor: parseInt(formData.deliveryFloor) || 0,
      elevator: (formData.deliveryHasElevator === 'true' ? 'medium' : 'no') as 'no' | 'small' | 'medium' | 'large',
      constraints: formData.deliveryLogisticsConstraints || []
    };

    const detectionResult = AutoDetectionService.detectAutomaticConstraints(pickupData, deliveryData);
    const furnitureLiftRequired = detectionResult.pickup.furnitureLiftRequired || detectionResult.delivery.furnitureLiftRequired;

    if (furnitureLiftRequired && !formData.pickupNeedsLift && !formData.deliveryNeedsLift) {
      return 'Un monte-meuble est obligatoire selon les contraintes détectées (étages élevés, contraintes d\'accès, ou ascenseur inadapté).';
    }

    return true;
  },

  prepareRequestData: (formData: any, extraData?: CatalogueMovingItemSubmissionExtraData) => {
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
      // ✅ Ajouter les valeurs par défaut du pack pour le calcul des suppléments (uniformisé)
      defaultDuration: pack.duration,
      defaultWorkers: pack.workers,
      defaultPrice: pack.price,
      additionalInfo: formData.additionalInfo,
      calculatedPrice: formData.calculatedPrice || pack.price,
      whatsappOptIn: formData.whatsappOptIn,
      // ✅ CRITIQUE : Ajouter le __presetSnapshot pour la comparaison PACKING non modifié
      __presetSnapshot: pack.__presetSnapshot,
      // ✅ Ajouter catalogId pour le linking avec le catalogue
      catalogId: pack.id,
      catalogSelectionId: pack.id
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/packs/summary?quoteRequestId=${responseData.id}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: CatalogueMovingItemSubmissionExtraData) => {
    return {
      serviceDate: formData.scheduledDate,
      serviceAddress: `${formData.pickupAddress} → ${formData.deliveryAddress}`,
      additionalDetails: ''
    };
  }
}); 