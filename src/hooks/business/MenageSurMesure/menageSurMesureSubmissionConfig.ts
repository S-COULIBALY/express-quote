import { SubmissionConfig } from '@/utils/submissionUtils';
import { MenageSurMesureData } from './useMenageSurMesureSubmission';

export interface MenageSurMesureSubmissionExtraData {
  service: MenageSurMesureData;
}

export const createMenageSurMesureSubmissionConfig = (service: MenageSurMesureData): SubmissionConfig => ({
  submissionType: 'CLEANING_PREMIUM',

  validateFormData: (formData: any, extraData?: MenageSurMesureSubmissionExtraData) => {
    // Validation des champs requis pour un service sur mesure
    if (!formData.scheduledDate || !formData.location) {
      return 'Veuillez remplir tous les champs obligatoires.';
    }
    
    // Validation spécifique au ménage sur mesure
    if (!formData.propertyType || !formData.surface) {
      return 'Veuillez spécifier le type de bien et la surface.';
    }
    
    // Validation de la surface
    if (parseInt(formData.surface) < 10 || parseInt(formData.surface) > 500) {
      return 'La surface doit être comprise entre 10 et 500 m².';
    }

    return true;
  },

  prepareRequestData: (formData: any, extraData?: MenageSurMesureSubmissionExtraData) => {
    return {
      // Données du service sur mesure
      serviceId: service.id,
      serviceType: 'CLEANING_PREMIUM',
      catalogId: service.catalogId,
      
      // Informations générales
      propertyType: formData.propertyType,
      surface: parseInt(formData.surface),
      
      // Planification
      scheduledDate: formData.scheduledDate,
      flexibilite: formData.flexibilite,
      horaire: formData.horaire,
      
      // Localisation
      location: formData.location,
      
      // Services spécifiques
      cleaningServices: formData.cleaningServices || [],
      
      // Contraintes spécifiques
      contraintesSpecifiques: formData.contraintesSpecifiques || [],
      animaux: formData.animaux,
      enfants: formData.enfants,
      allergenes: formData.allergenes || [],
      
      // Fréquence et récurrence
      frequence: formData.frequence,
      recurrence: formData.recurrence,
      
      // Contact
      nom: formData.nom,
      email: formData.email,
      telephone: formData.telephone,
      commentaires: formData.commentaires,
      
      // Prix et calculs
      calculatedPrice: formData.calculatedPrice || 0,
      isDynamicPricing: true,
      
      // Données du service
      serviceName: service.name,
      serviceDescription: service.description,
      isPremium: service.isPremium,
      requiresSurface: service.requiresSurface,
      requiresCustomPricing: service.requiresCustomPricing
    };
  },

  getSuccessRedirectUrl: (responseData: any) => {
    return `/booking/${responseData.temporaryId || responseData.id}`;
  },

  getNotificationData: (formData: any, responseData: any, extraData?: MenageSurMesureSubmissionExtraData) => {
    const servicesNettoyage = formData.cleaningServices?.map((service: string) => {
      const serviceNames: { [key: string]: string } = {
        'regular': 'Nettoyage régulier',
        'deep': 'Nettoyage en profondeur',
        'postConstruction': 'Nettoyage post-travaux',
        'moveIn': 'Nettoyage d\'emménagement',
        'moveOut': 'Nettoyage de déménagement'
      };
      return serviceNames[service] || service;
    }) || [];

    const contraintes = [];
    if (formData.animaux) contraintes.push('Animaux présents');
    if (formData.enfants) contraintes.push('Enfants présents');
    if (formData.allergenes?.length > 0) contraintes.push(`Allergènes: ${formData.allergenes.join(', ')}`);

    return {
      serviceDate: formData.scheduledDate,
      serviceAddress: formData.location,
      additionalDetails: `Type: ${formData.propertyType}, Surface: ${formData.surface}m²${servicesNettoyage.length > 0 ? `, Services: ${servicesNettoyage.join(', ')}` : ''}${contraintes.length > 0 ? `, Contraintes: ${contraintes.join(', ')}` : ''}`
    };
  }
});
