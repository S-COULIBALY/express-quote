import { SubmissionConfig } from '@/utils/submissionUtils';
import { CatalogueMovingItem } from '@/types/booking';

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

    // ✅ Validation monte-meubles supprimée - Gérée par AccessConstraintsModal + AutoDetectionService

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
      // ✅ Contraintes logistiques par adresse (peuvent contenir des UUIDs ou des noms)
      pickupLogisticsConstraints: formData.pickupLogisticsConstraints,
      pickupCarryDistance: formData.pickupCarryDistance,
      deliveryFloor: parseInt(formData.deliveryFloor),
      deliveryHasElevator: formData.deliveryHasElevator === 'true',
      deliveryNeedsLift: formData.deliveryNeedsLift,
      deliveryLogisticsConstraints: formData.deliveryLogisticsConstraints,
      deliveryCarryDistance: formData.deliveryCarryDistance,
      // ✅ Services supplémentaires globaux (piano, objets fragiles, etc.)
      additionalServices: formData.additionalServices,
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
    return `/booking/${responseData.temporaryId || responseData.id}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: CatalogueMovingItemSubmissionExtraData) => {
    return {
      serviceDate: formData.scheduledDate,
      serviceAddress: `${formData.pickupAddress} → ${formData.deliveryAddress}`,
      additionalDetails: ''
    };
  }
}); 