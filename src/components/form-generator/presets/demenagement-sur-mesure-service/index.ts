// Import et export des presets complets pour le déménagement sur mesure
import { FormConfig } from '../../types';
import { CatalogueMovingItem } from '@/types/booking';

export interface DemenagementSurMesureServicePresetOptions {
  service: CatalogueMovingItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getDemenagementSurMesureServiceConfig = (options: DemenagementSurMesureServicePresetOptions): FormConfig => {
  const { service, onPriceCalculated, onSubmitSuccess, onError, editMode, sessionStorageKey } = options;

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
      // Informations générales
      typeDemenagement: '',
      surface: '',
      nombrePieces: '',
      etageDepart: '0',
      etageArrivee: '0',
      ascenseurDepart: false,
      ascenseurArrivee: false,
      
      // Adresses
      adresseDepart: '',
      adresseArrivee: '',
      distanceEstimee: '',
      
      // Mobilier
      meubles: [],
      electromenager: [],
      objetsFragiles: [],
      volumeEstime: '',
      
      // Services optionnels
      emballage: false,
      montage: false,
      nettoyage: false,
      stockage: false,
      assurance: false,
      
      // Planification
      dateSouhaitee: '',
      flexibilite: '',
      horaire: '',
      
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
    title: `Réserver votre déménagement sur mesure ${service.name}`,
    description: "Personnalisez votre déménagement selon vos besoins",
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
        title: "📍 Adresses",
        columns: 2,
        fields: [
          {
            name: "adresseDepart",
            type: "address-pickup",
            label: "Adresse de départ",
            required: true,
            columnSpan: 2,
            validation: {
              custom: (value: any) => value?.trim() || "L'adresse de départ est requise"
            }
          },
          {
            name: "adresseArrivee",
            type: "address-delivery",
            label: "Adresse d'arrivée",
            required: true,
            columnSpan: 2,
            validation: {
              custom: (value: any) => value?.trim() || "L'adresse d'arrivée est requise"
            }
          },
          {
            name: "distanceEstimee",
            type: "number",
            label: "Distance estimée (km)",
            required: false,
            validation: {
              min: 0,
              max: 1000
            },
            componentProps: {
              min: 0,
              max: 1000,
              placeholder: "Distance approximative"
            }
          }
        ]
      },
      {
        title: "🏢 Détails des étages",
        columns: 2,
        fields: [
          {
            name: "etageDepart",
            type: "select",
            label: "Étage de départ",
            options: [
              { value: "0", label: "Rez-de-chaussée" },
              { value: "1", label: "1er étage" },
              { value: "2", label: "2ème étage" },
              { value: "3", label: "3ème étage" },
              { value: "4", label: "4ème étage" },
              { value: "5+", label: "5ème étage et plus" }
            ]
          },
          {
            name: "etageArrivee",
            type: "select",
            label: "Étage d'arrivée",
            options: [
              { value: "0", label: "Rez-de-chaussée" },
              { value: "1", label: "1er étage" },
              { value: "2", label: "2ème étage" },
              { value: "3", label: "3ème étage" },
              { value: "4", label: "4ème étage" },
              { value: "5+", label: "5ème étage et plus" }
            ]
          },
          {
            name: "ascenseurDepart",
            type: "checkbox",
            label: "Ascenseur au départ",
            columnSpan: 2
          },
          {
            name: "ascenseurArrivee",
            type: "checkbox",
            label: "Ascenseur à l'arrivée",
            columnSpan: 2
          }
        ]
      },
      {
        title: "🪑 Mobilier et objets",
        columns: 2,
        fields: [
          {
            name: "meubles",
            type: "custom",
            label: "Types de meubles",
            required: true,
            columnSpan: 2,
            componentProps: {
              type: "checkbox-group",
              options: [
                { value: "canape", label: "Canapé" },
                { value: "lit", label: "Lit" },
                { value: "armoire", label: "Armoire" },
                { value: "commode", label: "Commode" },
                { value: "table", label: "Table" },
                { value: "chaise", label: "Chaises" },
                { value: "bureau", label: "Bureau" },
                { value: "etagere", label: "Étagère" },
                { value: "autre", label: "Autre" }
              ]
            }
          },
          {
            name: "electromenager",
            type: "custom",
            label: "Électroménager",
            required: false,
            columnSpan: 2,
            componentProps: {
              type: "checkbox-group",
              options: [
                { value: "refrigerateur", label: "Réfrigérateur" },
                { value: "lave-vaisselle", label: "Lave-vaisselle" },
                { value: "machine-a-laver", label: "Machine à laver" },
                { value: "seche-linge", label: "Sèche-linge" },
                { value: "four", label: "Four" },
                { value: "micro-ondes", label: "Micro-ondes" },
                { value: "autre", label: "Autre" }
              ]
            }
          },
          {
            name: "objetsFragiles",
            type: "custom",
            label: "Objets fragiles",
            required: false,
            columnSpan: 2,
            componentProps: {
              type: "checkbox-group",
              options: [
                { value: "tableaux", label: "Tableaux" },
                { value: "miroirs", label: "Miroirs" },
                { value: "vases", label: "Vases" },
                { value: "livres", label: "Livres" },
                { value: "vaisselle", label: "Vaisselle" },
                { value: "autre", label: "Autre" }
              ]
            }
          }
        ]
      },
      {
        title: "🔧 Services optionnels",
        columns: 2,
        fields: [
          {
            name: "emballage",
            type: "checkbox",
            label: "Service d'emballage",
            componentProps: {
              helpText: "Emballage professionnel de vos objets"
            }
          },
          {
            name: "montage",
            type: "checkbox",
            label: "Montage/Démontage de meubles",
            componentProps: {
              helpText: "Démontage et remontage de vos meubles"
            }
          },
          {
            name: "nettoyage",
            type: "checkbox",
            label: "Nettoyage après déménagement",
            componentProps: {
              helpText: "Nettoyage des locaux après le déménagement"
            }
          },
          {
            name: "stockage",
            type: "checkbox",
            label: "Stockage temporaire",
            componentProps: {
              helpText: "Stockage temporaire si nécessaire"
            }
          },
          {
            name: "assurance",
            type: "checkbox",
            label: "Assurance déménagement",
            columnSpan: 2,
            componentProps: {
              helpText: "Assurance complète de vos biens"
            }
          }
        ]
      },
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
            name: "flexibilite",
            type: "select",
            label: "Flexibilité sur la date",
            required: true,
            options: [
              { value: "exacte", label: "Date exacte" },
              { value: "semaine", label: "Dans la semaine" },
              { value: "mois", label: "Dans le mois" },
              { value: "flexible", label: "Flexible" }
            ]
          },
          {
            name: "horaire",
            type: "select",
            label: "Horaire préféré",
            required: true,
            options: [
              { value: "matin", label: "Matin (8h-12h)" },
              { value: "apres-midi", label: "Après-midi (13h-17h)" },
              { value: "journee", label: "Journée complète" },
              { value: "flexible", label: "Flexible" }
            ]
          }
        ]
      },
      {
        title: "📞 Contact",
        columns: 2,
        fields: [
          {
            name: "nom",
            type: "text",
            label: "Nom complet",
            required: true,
            validation: {
              custom: (value: any) => value?.trim() || "Le nom est requis"
            }
          },
          {
            name: "email",
            type: "email",
            label: "Email",
            required: true,
            validation: {
              custom: (value: any) => {
                if (!value) return "L'email est requis";
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) || "Format d'email invalide";
              }
            }
          },
          {
            name: "telephone",
            type: "text",
            label: "Téléphone",
            required: true,
            validation: {
              custom: (value: any) => value?.trim() || "Le téléphone est requis"
            },
            componentProps: {
              type: "tel",
              placeholder: "06 12 34 56 78"
            }
          },
          {
            name: "commentaires",
            type: "textarea",
            label: "Commentaires supplémentaires",
            columnSpan: 2,
            componentProps: {
              rows: 3,
              placeholder: "Informations complémentaires sur votre projet..."
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