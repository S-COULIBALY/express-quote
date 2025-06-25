import { SubmissionConfig } from '@/utils/submissionUtils';
import { saveMovingQuote } from '@/actions/movingQuoteManager';
import { FLOOR_CONSTANTS, detectFurnitureLiftForBothAddresses } from '@/quotation/domain/configuration/constants';

export interface MovingSubmissionExtraData {
  quoteDetails?: any;
  addressDetails?: {
    pickup?: google.maps.places.PlaceResult | null;
    delivery?: google.maps.places.PlaceResult | null;
  };
}

// Configuration spéciale pour moving qui utilise saveMovingQuote au lieu de l'API standard
export const createMovingSubmissionConfig = (): SubmissionConfig => ({
  submissionType: 'MOVING',

  validateFormData: (formData: any, extraData?: MovingSubmissionExtraData) => {
    if (!formData.movingDate || !formData.volume || !formData.pickupAddress || !formData.deliveryAddress) {
      return 'Veuillez remplir tous les champs obligatoires et sélectionner des adresses valides';
    }
    
    // ✅ HARMONISATION: Validation avec nouvelle logique économique centralisée
    const pickupData = {
      floor: parseInt(formData.pickupFloor) || 0,
      elevator: formData.pickupElevator || 'no',
      constraints: formData.pickupLogisticsConstraints || [],
      services: formData.additionalServices || []
    };
    
    const deliveryData = {
      floor: parseInt(formData.deliveryFloor) || 0,
      elevator: formData.deliveryElevator || 'no',
      constraints: formData.deliveryLogisticsConstraints || [],
      services: formData.additionalServices || []
    };
    
    const furnitureLiftRequired = detectFurnitureLiftForBothAddresses(pickupData, deliveryData);
    
    if (furnitureLiftRequired && !formData.furnitureLiftSelected) {
      return 'Un monte-meuble est obligatoire selon les contraintes détectées (étages élevés, contraintes d\'accès, ou ascenseur inadapté). Veuillez l\'ajouter à vos services.';
    }
    
    return true;
  },

  prepareRequestData: (formData: any, extraData?: MovingSubmissionExtraData) => {
    // Cette fonction sera utilisée par le hook useSubmission personnalisé pour moving
    // Pour utiliser saveMovingQuote au lieu de l'API standard
    const pickupLat = extraData?.addressDetails?.pickup?.geometry?.location?.lat();
    const pickupLng = extraData?.addressDetails?.pickup?.geometry?.location?.lng();
    const deliveryLat = extraData?.addressDetails?.delivery?.geometry?.location?.lat();
    const deliveryLng = extraData?.addressDetails?.delivery?.geometry?.location?.lng();
    
    const getElevatorLabel = (value: string): string => {
      const labels: Record<string, string> = {
        no: 'Aucun',
        small: 'Petit (1-3 pers)',
        medium: 'Moyen (3-6 pers)',
        large: 'Grand (+6 pers)',
        yes: 'Présent'
      };
      return labels[value] || 'Aucun';
    };

    const enrichedData = {
      ...formData,
      pickupLogisticsConstraints: formData.pickupLogisticsConstraints || [],
      deliveryLogisticsConstraints: formData.deliveryLogisticsConstraints || [],
      pickupElevatorDetails: {
        present: formData.pickupElevator !== 'no',
        type: formData.pickupElevator,
        label: getElevatorLabel(formData.pickupElevator)
      },
      deliveryElevatorDetails: {
        present: formData.deliveryElevator !== 'no',
        type: formData.deliveryElevator,
        label: getElevatorLabel(formData.deliveryElevator)
      }
    };

    return {
      enrichedData,
      quoteDetails: extraData?.quoteDetails,
      pickupCoordinates: pickupLat && pickupLng ? { lat: pickupLat, lng: pickupLng } : undefined,
      deliveryCoordinates: deliveryLat && deliveryLng ? { lat: deliveryLat, lng: deliveryLng } : undefined,
      messages: [] // messages vides pour l'instant
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/moving/summary?id=${responseData.id}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: MovingSubmissionExtraData) => {
    // Préparer un récapitulatif des contraintes logistiques pour l'email
    const logisticsDetails = [];
    if (formData.pickupLogisticsConstraints?.length) {
      logisticsDetails.push(`Contraintes départ: ${formData.pickupLogisticsConstraints.length} élément(s)`);
    }
    if (formData.deliveryLogisticsConstraints?.length) {
      logisticsDetails.push(`Contraintes arrivée: ${formData.deliveryLogisticsConstraints.length} élément(s)`);
    }

    return {
      serviceDate: formData.movingDate,
      serviceAddress: `${formData.pickupAddress} → ${formData.deliveryAddress}`,
      additionalDetails: logisticsDetails.join(' | ')
    };
  }
});

// Hook spécialisé pour moving qui utilise saveMovingQuote
export const useMovingSubmissionSpecial = (calculatedPrice: number, quoteDetails: any, addressDetails: any) => {
  // Ce hook sera utilisé à la place du générique pour moving
  // car moving utilise saveMovingQuote au lieu de l'API standard
  return {
    // Logique spécifique à implémenter si nécessaire
  };
}; 