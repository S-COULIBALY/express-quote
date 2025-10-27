import { SubmissionConfig } from '@/utils/submissionUtils';

// Exemple : Configuration pour un nouveau service de jardinage
export interface GardeningSubmissionExtraData {
  areaSize?: number;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  equipmentNeeded?: string[];
}

export const createGardeningSubmissionConfig = (areaSize: number = 0): SubmissionConfig => ({
  submissionType: 'GARDENING' as any, // Nouveau type

  validateFormData: (formData: any, extraData?: GardeningSubmissionExtraData) => {
    if (!formData.serviceDate || !formData.location || !formData.areaSize) {
      return 'Veuillez remplir tous les champs obligatoires (date, lieu, superficie).';
    }

    if (parseFloat(formData.areaSize) <= 0) {
      return 'La superficie doit être supérieure à 0 m².';
    }

    if (formData.equipmentNeeded?.includes('heavy_machinery') && !formData.accessConfirmed) {
      return 'Veuillez confirmer l\'accès pour les équipements lourds.';
    }

    return true;
  },

  prepareRequestData: (formData: any, extraData?: GardeningSubmissionExtraData) => {
    return {
      serviceDate: formData.serviceDate,
      location: formData.location,
      areaSize: parseFloat(formData.areaSize),
      gardeningType: formData.gardeningType || 'basic_maintenance',
      season: extraData?.season || getCurrentSeason(),
      equipmentNeeded: formData.equipmentNeeded || [],
      accessDetails: formData.accessDetails,
      soilType: formData.soilType,
      plantsPreferences: formData.plantsPreferences,
      additionalInfo: formData.additionalInfo,
      calculatedPrice: formData.calculatedPrice || 150,
      whatsappOptIn: formData.whatsappOptIn,
      // Données spécifiques au jardinage
      waterAccess: formData.waterAccess || false,
      electricityAccess: formData.electricityAccess || false,
      wasteDisposal: formData.wasteDisposal || 'client_responsibility',
      weatherContingency: formData.weatherContingency || true
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/booking/${responseData.temporaryId || responseData.id}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: GardeningSubmissionExtraData) => {
    // Préparer les détails pour l'email
    const serviceDetails = [];
    
    if (formData.gardeningType) {
      const gardeningTypes: Record<string, string> = {
        basic_maintenance: 'Entretien de base',
        lawn_care: 'Entretien pelouse',
        tree_pruning: 'Élagage',
        landscaping: 'Aménagement paysager',
        seasonal_cleanup: 'Nettoyage saisonnier'
      };
      serviceDetails.push(`Type: ${gardeningTypes[formData.gardeningType] || formData.gardeningType}`);
    }

    if (formData.areaSize) {
      serviceDetails.push(`Superficie: ${formData.areaSize} m²`);
    }

    if (extraData?.season) {
      const seasons: Record<string, string> = {
        spring: 'Printemps',
        summer: 'Été', 
        autumn: 'Automne',
        winter: 'Hiver'
      };
      serviceDetails.push(`Saison: ${seasons[extraData.season]}`);
    }

    if (formData.equipmentNeeded?.length) {
      serviceDetails.push(`Équipements: ${formData.equipmentNeeded.length} type(s)`);
    }

    return {
      serviceDate: formData.serviceDate,
      serviceAddress: formData.location,
      additionalDetails: serviceDetails.join(' | ')
    };
  }
});

// Hook spécialisé pour le jardinage (seulement quelques lignes !)
export const useGardeningSubmission = (areaSize: number = 0, calculatedPrice: number = 150) => {
  const config = createGardeningSubmissionConfig(areaSize);
  const { useSubmission } = require('../useSubmission');
  
  const extraData: GardeningSubmissionExtraData = {
    areaSize,
    season: getCurrentSeason()
  };
  
  return useSubmission(config, calculatedPrice, extraData);
};

// Utilitaire helper pour déterminer la saison
function getCurrentSeason(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/*
Usage dans un composant :

import { useGardeningSubmission } from '@/hooks/examples/exampleNewSubmissionConfig';

const GardeningQuoteForm = () => {
  const { isSubmitting, submit } = useGardeningSubmission(100, 250); // 100m², 250€

  const handleFormSubmit = async (formData) => {
    await submit(formData, { 
      season: 'spring',
      equipmentNeeded: ['lawn_mower', 'hedge_trimmer']
    });
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Création en cours...' : 'Créer le devis'}
      </button>
    </form>
  );
};
*/ 