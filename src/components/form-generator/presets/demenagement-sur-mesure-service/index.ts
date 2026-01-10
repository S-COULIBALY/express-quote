// Import et export des presets complets pour le déménagement sur mesure
import { FormConfig } from '../../types';
import { CatalogueMovingItem } from '@/types/booking';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

export interface DemenagementSurMesureServicePresetOptions {
  service: CatalogueMovingItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getDemenagementSurMesureServiceConfig = (serviceOrOptions: CatalogueMovingItem | DemenagementSurMesureServicePresetOptions): FormConfig => {
  // Support pour les deux signatures : ancien (objet options) et nouveau (service direct)
  const isOptions = 'service' in serviceOrOptions || 'onPriceCalculated' in serviceOrOptions;
  const service = isOptions ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).service : (serviceOrOptions as CatalogueMovingItem);
  const onPriceCalculated = isOptions ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).onPriceCalculated : undefined;
  const onSubmitSuccess = isOptions ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).onSubmitSuccess : undefined;
  const onError = isOptions ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).onError : undefined;
  const editMode = isOptions ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).editMode : undefined;
  const sessionStorageKey = isOptions ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).sessionStorageKey : undefined;

  // Auto-détection des valeurs par défaut depuis sessionStorage si en mode édition
  const getDefaultValues = () => {
    if (editMode && sessionStorageKey && typeof window !== 'undefined') {
      const storedData = window.sessionStorage.getItem(sessionStorageKey);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          window.sessionStorage.removeItem(sessionStorageKey);
          return parsedData;
        } catch (error) {
          console.error('Erreur lors du parsing des données stockées:', error);
        }
      }
    }
    
    return {
      // Planification
      dateSouhaitee: '',
      flexibilite: '',
      horaire: '',

      // Adresses
      adresseDepart: '',
      pickupFloor: '0',
      pickupElevator: 'no',
      pickupCarryDistance: '',
      adresseArrivee: '',
      deliveryFloor: '0',
      deliveryElevator: 'no',
      deliveryCarryDistance: '',

      // Informations générales
      typeDemenagement: '',
      surface: '',
      nombrePieces: '',
      volumeEstime: '',

      // Mobilier
      meubles: [],
      electromenager: [],
      objetsFragiles: [],

      // Services optionnels
      emballage: false,
      montage: false,
      nettoyage: false,
      stockage: false,
      assurance: false,

      // Contact
      nom: '',
      email: '',
      telephone: '',
      commentaires: '',

      // Ajouter les données du service au contexte
      serviceName: service.name,
      serviceDescription: service.description,
      basePrice: service.price,
      defaultPrice: service.price
    };
  };

  const config: FormConfig = {
    //title: `Réserver votre déménagement sur mesure ${service.name}`,
    //description: "Personnalisez votre déménagement selon vos besoins",
    serviceType: "moving",
    customDefaults: getDefaultValues(),
    
    layout: {
      type: "sidebar",
      // Nouvelles fonctionnalités du SidebarLayout amélioré
      showPriceCalculation: true,
      showConstraintsByAddress: true,
      showModificationsSummary: true,
      initialPrice: service.price || 0,
      serviceInfo: {
        name: service.name,
        description: service.description,
        icon: "🏠",
        features: service.includes || [
          "Service personnalisé",
          "Devis adapté à vos besoins",
          "Équipe professionnelle",
          "Assurance transport incluse",
          "Matériel fourni"
        ]
      },
      summaryConfig: {
        title: service.name,
        sections: [
          // Section Service enrichie avec les données dynamiques
          {
            title: "Service",
            icon: "🏠",
            fields: [
              { key: "serviceName", label: "Service sélectionné", format: () => service.name },
              { key: "serviceDescription", label: "Description", format: () => service.description },
              { 
                key: "typeDemenagement", 
                label: "Type de déménagement", 
                format: (value: any) => value || "À définir",
                style: "font-medium text-gray-700"
              },
              { 
                key: "surface", 
                label: "Surface", 
                format: (value: any) => value ? `${value} m²` : "À définir",
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Section Planification
          {
            title: "Planification",
            icon: "📅",
            fields: [
              { key: "dateSouhaitee", label: "Date souhaitée", format: (value: any) => value || "À définir" },
              { key: "horaire", label: "Horaire", format: (value: any) => value || "À définir" },
              { key: "flexibilite", label: "Flexibilité", format: (value: any) => value || "À définir" }
            ]
          },
          // Section Adresses
          {
            title: "Adresses",
            icon: "🗺️",
            fields: [
              { key: "adresseDepart", label: "Adresse de départ", format: (value: any) => value || "À définir" },
              { key: "adresseArrivee", label: "Adresse d'arrivée", format: (value: any) => value || "À définir" },
              { key: "distanceEstimee", label: "Distance estimée", format: (value: any) => value ? `${value} km` : "À calculer" }
            ]
          },
          // Section Services optionnels
          {
            title: "Services optionnels",
            icon: "⚙️",
            fields: [
              { key: "emballage", label: "Emballage", format: (value: any) => value ? "Oui" : "Non" },
              { key: "montage", label: "Montage/Démontage", format: (value: any) => value ? "Oui" : "Non" },
              { key: "nettoyage", label: "Nettoyage", format: (value: any) => value ? "Oui" : "Non" },
              { key: "stockage", label: "Stockage", format: (value: any) => value ? "Oui" : "Non" },
              { key: "assurance", label: "Assurance", format: (value: any) => value ? "Oui" : "Non" }
            ]
          },
          // Section Prix dynamique
          {
            title: "Prix",
            icon: "💰",
            fields: [
              { key: "basePrice", label: "Prix de base", format: () => "Sur devis" },
              { 
                key: "totalPrice", 
                label: "Total estimé", 
                format: () => "Calcul en cours...", // Sera mis à jour dynamiquement
                style: "font-bold text-emerald-600"
              }
            ]
          }
        ]
      }
    },

    sections: [
      {
        title: "📅 Planification",
        columns: 2,
        fields: [
          {
            name: "dateSouhaitee",
            type: "date",
            label: "Date souhaitée",
            required: true,
            validation: {
              custom: (value: any) => {
                if (!value) return "La date est requise";
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return selectedDate >= today || "La date ne peut pas être dans le passé";
              }
            }
          },
          
          {
            name: "horaire",
            type: "select",
            label: "Horaire de RDV",
            required: true,
            options: [
              { value: "matin", label: "Matin - 6h" },
              { value: "matin", label: "Matin - 8h" },
              { value: "apres-midi", label: "Après-midi - 13h" },
              { value: "soirée", label: "soirée - 18h" },
              { value: "flexible", label: "Flexible - selon disponibilité" }
            ]
          }
        ]
      },

      {
        title: "🏠 Informations générales",
        columns: 2,
        fields: [
          {
            name: "typeDemenagement",
            type: "select",
            label: "Type de déménagement",
            required: true,
            options: [
              { value: "appartement", label: "Appartement" },
              { value: "maison", label: "Maison" },
              { value: "bureau", label: "Bureau/Commerce" },
              { value: "entrepot", label: "Entrepôt/Local" },
              { value: "autre", label: "Autre" }
            ]
          },
          {
            name: "surface",
            type: "number",
            label: "Surface approximative (m²)",
            required: true,
            validation: {
              min: 1,
              max: 1000,
              custom: (value: any) => {
                if (!value || value <= 0) return "La surface doit être supérieure à 0";
                if (value > 1000) return "La surface ne peut pas dépasser 1000 m²";
                return true;
              }
            },
            componentProps: {
              min: 1,
              max: 1000,
              placeholder: "Ex: 80"
            }
          },
          {
            name: "nombrePieces",
            type: "number",
            label: "Nombre de pièces",
            required: true,
            validation: {
              min: 1,
              max: 20,
              custom: (value: any) => {
                if (!value || value <= 0) return "Le nombre de pièces doit être supérieur à 0";
                if (value > 20) return "Le nombre de pièces ne peut pas dépasser 20";
                return true;
              }
            },
            componentProps: {
              min: 1,
              max: 20,
              placeholder: "Ex: 4"
            }
          },
          {
            name: "volumeEstime",
            type: "select",
            label: "Volume estimé",
            required: true,
            options: [
              { value: "petit", label: "Petit (< 20m³)" },
              { value: "moyen", label: "Moyen (20-50m³)" },
              { value: "grand", label: "Grand (50-100m³)" },
              { value: "tres-grand", label: "Très grand (> 100m³)" }
            ]
          }
        ]
      },
      
      {
        title: "🗺️ Adresses",
        columns: 2,
        fields: [
          {
            name: "adresseDepart",
            type: "address-pickup",
            label: "📍 Adresse de départ",
            required: true,
            columnSpan: 2,
            className: "pickup-section",
            validation: {
              custom: (value: any) => value?.trim() || "L'adresse de départ est requise"
            },
            componentProps: {
              iconColor: "#10b981"
            }
          },
          {
            name: "pickupFloor",
            type: "select",
            label: "Étage départ",
            className: "pickup-field",
            options: [
              { value: '-1', label: 'Sous-sol' },
              { value: '0', label: 'RDC' },
              { value: '1', label: '1er étage' },
              { value: '2', label: '2ème étage' },
              { value: '3', label: '3ème étage' },
              { value: '4', label: '4ème étage' },
              { value: '5', label: '5ème étage' },
              { value: '6', label: '6ème étage' },
              { value: '7', label: '7ème étage' },
              { value: '8', label: '8ème étage' },
              { value: '9', label: '9ème étage' },
              { value: '10', label: '10ème étage' }
            ]
          },
          {
            name: "pickupElevator",
            type: "select",
            label: "Ascenseur départ",
            className: "pickup-field",
            options: [
              { value: 'no', label: 'Aucun' },
              { value: 'small', label: 'Petit (1-3 pers)' },
              { value: 'medium', label: 'Moyen (3-6 pers)' },
              { value: 'large', label: 'Grand (+6 pers)' }
            ]
          },
          {
            name: "pickupCarryDistance",
            type: "select",
            label: "Distance de portage départ",
            className: "pickup-field",
            options: [
              { value: '', label: '-- Sélectionnez une option --' },
              { value: '0-10', label: '0-10m' },
              { value: '10-30', label: '10-30m' },
              { value: '30+', label: '30m+' }
            ]
          },
          {
            name: "pickupLogisticsConstraints",
            type: "access-constraints",
            label: "Spécificités Départ",
            className: "pickup-field",
            componentProps: {
              type: "pickup",
              buttonLabel: "Contraintes & Spécificités",
              modalTitle: "Contraintes d'accès & Services Supplémentaires - Départ",
              showServices: true,
              serviceType: ServiceType.MOVING
            }
          },
          {
            name: "address-separator",
            type: "separator",
            columnSpan: 2
          },
          {
            name: "adresseArrivee",
            type: "address-delivery",
            label: "📍 Adresse d'arrivée",
            required: true,
            columnSpan: 2,
            className: "delivery-section",
            validation: {
              custom: (value: any) => value?.trim() || "L'adresse d'arrivée est requise"
            },
            componentProps: {
              iconColor: "#ef4444"
            }
          },
          {
            name: "deliveryFloor",
            type: "select",
            label: "Étage arrivée",
            className: "delivery-field",
            options: [
              { value: '-1', label: 'Sous-sol' },
              { value: '0', label: 'RDC' },
              { value: '1', label: '1er étage' },
              { value: '2', label: '2ème étage' },
              { value: '3', label: '3ème étage' },
              { value: '4', label: '4ème étage' },
              { value: '5', label: '5ème étage' },
              { value: '6', label: '6ème étage' },
              { value: '7', label: '7ème étage' },
              { value: '8', label: '8ème étage' },
              { value: '9', label: '9ème étage' },
              { value: '10', label: '10ème étage' }
            ]
          },
          {
            name: "deliveryElevator",
            type: "select",
            label: "Ascenseur arrivée",
            className: "delivery-field",
            options: [
              { value: 'no', label: 'Aucun' },
              { value: 'small', label: 'Petit (1-3 pers)' },
              { value: 'medium', label: 'Moyen (3-6 pers)' },
              { value: 'large', label: 'Grand (+6 pers)' }
            ]
          },
          {
            name: "deliveryCarryDistance",
            type: "select",
            label: "Distance de portage arrivée",
            className: "delivery-field",
            options: [
              { value: '', label: '-- Sélectionnez une option --' },
              { value: '0-10', label: '0-10m' },
              { value: '10-30', label: '10-30m' },
              { value: '30+', label: '30m+' }
            ]
          },
          {
            name: "deliveryLogisticsConstraints",
            type: "access-constraints",
            label: "Spécificités Arrivée",
            className: "delivery-field",
            componentProps: {
              type: "delivery",
              buttonLabel: "Contraintes & Spécificités",
              modalTitle: "Contraintes d'accès & Services Supplémentaires - Arrivée",
              showServices: true,
              serviceType: ServiceType.MOVING
            }
          }
        ]
      },

      {
        title: "📝 Informations supplémentaires",
        fields: [
          {
            name: "additionalInfo",
            type: "textarea",
            label: "votre message",
            columnSpan: 2,
            componentProps: {
              rows: 3,
              placeholder: "Précisez vos besoins spécifiques, vos coordonnées et détaillez les contraintes sélectionnées si nécessaire"
            }
          }
        ]
      },

      {
        title: "📱 Notifications",
        fields: [
          {
            name: "whatsappOptIn",
            type: "whatsapp-consent",
            label: "Notifications WhatsApp",
            columnSpan: 2
          }
        ]
      }
    ],

    // Handlers qui utilisent les callbacks
    onChange: onPriceCalculated ? async (fieldName: string, value: any, formData: any) => {
      const priceRelevantFields = [
        'typeDemenagement', 'surface', 'nombrePieces', 'volumeEstime',
        'adresseDepart', 'adresseArrivee', 'etageDepart', 'etageArrivee',
        'ascenseurDepart', 'ascenseurArrivee', 'emballage', 'montage',
        'nettoyage', 'stockage', 'assurance'
      ];
      
      if (priceRelevantFields.includes(fieldName)) {
        try {
          // Le hook externe gérera le calcul réel
          onPriceCalculated(0, formData);
        } catch (error) {
          onError?.(error);
        }
      }
    } : undefined,

    onSubmit: async (data: any) => {
      console.log('🚀 [DemenagementSurMesurePreset] onSubmit appelé avec:', data);
      try {
        if (onSubmitSuccess) {
          console.log('✅ [DemenagementSurMesurePreset] Appel onSubmitSuccess');
          await onSubmitSuccess(data);
        } else {
          console.log('⚠️ [DemenagementSurMesurePreset] onSubmitSuccess non défini');
          console.error('❌ [DemenagementSurMesurePreset] onSubmitSuccess callback manquant');
          throw new Error('Gestionnaire de soumission non configuré');
        }
      } catch (error) {
        console.error('❌ [DemenagementSurMesurePreset] Erreur dans onSubmit:', error);
        onError?.(error);
        throw error;
      }
    },

    submitLabel: "Réserver",
    cancelLabel: "Annuler"
  };

  return config;
};

// Export des presets complets pour compatibilité
import { 
  DemenagementSurMesurePreset,
  demenagementSurMesureSummaryConfig,
  demenagementSurMesureDefaultValues,
  demenagementSurMesureStyles
} from './demenagementSurMesurePresets';

export { 
  DemenagementSurMesurePreset,
  demenagementSurMesureSummaryConfig,
  demenagementSurMesureDefaultValues,
  demenagementSurMesureStyles
};

// Export par défaut
export default DemenagementSurMesurePreset; 