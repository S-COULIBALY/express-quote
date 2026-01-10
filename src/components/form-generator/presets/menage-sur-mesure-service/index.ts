import { FormConfig } from '../../types';
import { CatalogueCleaningItem } from '@/types/booking';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

export interface MenageSurMesureServicePresetOptions {
  service: CatalogueCleaningItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getMenageSurMesureServiceConfig = (serviceOrOptions: CatalogueCleaningItem | MenageSurMesureServicePresetOptions): FormConfig => {
  // Support pour les deux signatures : ancien (objet options) et nouveau (service direct)
  const isOptions = 'service' in serviceOrOptions || 'onPriceCalculated' in serviceOrOptions;
  const service = isOptions ? (serviceOrOptions as MenageSurMesureServicePresetOptions).service : (serviceOrOptions as CatalogueCleaningItem);
  const onPriceCalculated = isOptions ? (serviceOrOptions as MenageSurMesureServicePresetOptions).onPriceCalculated : undefined;
  const onSubmitSuccess = isOptions ? (serviceOrOptions as MenageSurMesureServicePresetOptions).onSubmitSuccess : undefined;
  const onError = isOptions ? (serviceOrOptions as MenageSurMesureServicePresetOptions).onError : undefined;
  const editMode = isOptions ? (serviceOrOptions as MenageSurMesureServicePresetOptions).editMode : undefined;
  const sessionStorageKey = isOptions ? (serviceOrOptions as MenageSurMesureServicePresetOptions).sessionStorageKey : undefined;

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
      scheduledDate: '',
      location: '',
      horaire: '',

      // Surface & Dimensions
      surface: '',
      roomCount: '',
      housingType: '',
      ceilingHeight: '',


      // Type de Nettoyage
      cleaningType: '',
      frequency: '',
      cleaningLevel: '',
      accessConstraints: [],

      // Configuration
      duration: '',
      workers: '',


      // Accès & Logistique
      floor: '',
      elevator: '',

      // Spécificités
      additionalInfo: '',

      // Ajouter les données du service au contexte
      serviceName: service.name,
      serviceDescription: service.description,
      basePrice: service.price,
      defaultPrice: service.price
    };
  };

  const config: FormConfig = {
    //title: `Réserver votre ménage sur mesure ${service.name}`,
    //description: "Personnalisez votre nettoyage selon vos besoins",
    serviceType: "cleaning",
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
        icon: "🧹",
        features: service.includes || [
          "Service personnalisé",
          "Devis adapté à vos besoins",
          "Équipe professionnelle",
          "Produits écologiques disponibles",
          "Assurance responsabilité civile"
        ]
      },
      summaryConfig: {
        title: service.name,
        sections: [
          // Section Service enrichie avec les données dynamiques
          {
            title: "Service",
            icon: "🧹",
            fields: [
              { key: "serviceName", label: "Service sélectionné", format: () => service.name },
              { key: "serviceDescription", label: "Description", format: () => service.description },
              {
                key: "cleaningType",
                label: "Type de nettoyage",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              },
              {
                key: "frequency",
                label: "Fréquence",
                format: (value: any) => value || "Non spécifiée",
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Section Surface & Configuration
          {
            title: "Surface & Configuration",
            icon: "📏",
            fields: [
              {
                key: "surface",
                label: "Surface",
                format: (value: any) => `${value || 0} m²`,
                style: "font-medium text-gray-700"
              },
              {
                key: "roomCount",
                label: "Pièces",
                format: (value: any) => `${value || 0} pièce${(value || 0) > 1 ? 's' : ''}`,
                style: "font-medium text-gray-700"
              },
              {
                key: "housingType",
                label: "Type de logement",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              },
            ]
          },
          // Section Configuration du service
          {
            title: "Configuration",
            icon: "⚙️",
            fields: [
              {
                key: "duration",
                label: "Durée estimée",
                format: (value: any) => `${value || 0} heure${(value || 0) > 1 ? 's' : ''}`,
                style: "font-medium text-gray-700"
              },
              {
                key: "workers",
                label: "Professionnels",
                format: (value: any) => `${value || 0} professionnel${(value || 0) > 1 ? 's' : ''}`,
                style: "font-medium text-gray-700"
              },
              {
                key: "cleaningLevel",
                label: "Niveau de nettoyage",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Section Accès
          {
            title: "Accès",
            icon: "🚪",
            fields: [
              {
                key: "floor",
                label: "Étage",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              },
              {
                key: "elevator",
                label: "Ascenseur",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              },
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
        fields: [
          {
            name: "scheduledDate",
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
          },
          
        ]
      },
      {
        title: "📍 Lieu d'intervention",
        fields: [
          {
            name: "location",
            type: "address-pickup",
            label: "Adresse",
            required: true,
            columnSpan: 2
          },
          {
            name: "floor",
            type: "select",
            label: "Étage",
            required: true,
            options: [
              { value: "-1", label: "Sous-sol" },
              { value: "0", label: "RDC" },
              { value: "1", label: "1er étage" },
              { value: "2", label: "2ème étage" },
              { value: "3", label: "3ème étage" },
              { value: "4", label: "4ème étage" },
              { value: "5", label: "5ème étage" },
              { value: "6", label: "6ème étage" },
              { value: "7", label: "7ème étage" },
              { value: "8", label: "8ème étage" },
              { value: "9", label: "9ème étage" },
              { value: "10+", label: "10ème étage et plus" }
            ]
          },
          {
            name: "elevator",
            type: "select",
            label: "Ascenseur",
            required: true,
            options: [
              { value: "no", label: "Aucun" },
              { value: "small", label: "Petit (1-3 pers)" },
              { value: "medium", label: "Moyen (3-6 pers)" },
              { value: "large", label: "Grand (+6 pers)" }
            ]
          }
        ]
      },
      {
        title: "📏 Surface & Dimensions",
        columns: 2,
        fields: [
          {
            name: "surface",
            type: "number",
            label: "Surface totale (m²)",
            required: true,
            validation: {
              min: 1,
              custom: (value: any) => value >= 1 || "Surface minimum 1m²"
            },
            componentProps: {
              helpText: "Surface totale à nettoyer en mètres carrés"
            }
          },
          {
            name: "roomCount",
            type: "number",
            label: "Nombre de pièces",
            required: true,
            validation: {
              min: 1,
              custom: (value: any) => value >= 1 || "Minimum 1 pièce"
            },
            componentProps: {
              helpText: "Nombre total de pièces à nettoyer"
            }
          },
          {
            name: "housingType",
            type: "select",
            label: "Type de logement",
            required: true,
            options: [
              { value: "apartment", label: "Appartement" },
              { value: "house", label: "Maison" },
              { value: "office", label: "Bureau" },
              { value: "commercial", label: "Local commercial" },
              { value: "other", label: "Autre" }
            ]
          },
          {
            name: "ceilingHeight",
            type: "select",
            label: "Hauteur sous plafond",
            required: true,
            options: [
              { value: "standard", label: "Standard (2.5-3m)" },
              { value: "high", label: "Élevé (3-4m)" },
              { value: "very-high", label: "Très élevé (4m+)" }
            ],
            componentProps: {
              helpText: "Nécessaire pour l'équipement (échelles, perches)"
            }
          }
        ]
      },
      {
        title: "🧹 Type de Nettoyage",
        columns: 2,
        fields: [
          {
            name: "cleaningType",
            type: "select",
            label: "Type de service",
            required: true,
            options: [
              { value: "maintenance", label: "Entretien régulier" },
              { value: "deep-cleaning", label: "Nettoyage approfondi" },
              { value: "post-construction", label: "Fin de chantier" },
              { value: "moving", label: "Avant/après déménagement" },
              { value: "spring-cleaning", label: "Grand nettoyage" },
              { value: "commercial", label: "Nettoyage commercial" },
              { value: "other", label: "Autre" }
            ]
          },
          {
            name: "frequency",
            type: "select",
            label: "Fréquence souhaitée",
            required: true,
            options: [
              { value: "one-time", label: "Ponctuel" },
              { value: "weekly", label: "Hebdomadaire" },
              { value: "bi-weekly", label: "Bi-hebdomadaire" },
              { value: "monthly", label: "Mensuel" },
              { value: "quarterly", label: "Trimestriel" }
            ]
          },
          {
            name: "cleaningLevel",
            type: "select",
            label: "Niveau de nettoyage",
            required: true,
            options: [
              { value: "standard", label: "Standard" },
              { value: "thorough", label: "Approfondi" },
              { value: "premium", label: "Premium" }
            ],
            componentProps: {
              helpText: "Standard: nettoyage de base / Approfondi: détails / Premium: perfection"
            }
          },
          {
            name: "accessConstraints",
            type: "access-constraints",
            label: "Spécificités",
            componentProps: {
              type: "pickup",
              buttonLabel: "Spécificités & Contraintes",
              modalTitle: "Contraintes d'accès & Services Supplémentaires",
              showServices: true,
              serviceType: ServiceType.CLEANING
            }
          }
        ]
      },
      {
        title: "⚙️ Configuration du service",
        columns: 2,
        fields: [
          {
            name: "workers",
            type: "number",
            label: "Nombre de travailleurs",
            required: true,
            validation: {
              min: 1,
              custom: (value: any) => value >= 1 || "Minimum 1 travailleur"
            },
            componentProps: {
              helpText: "Nombre de travailleurs souhaité (sera optimisé selon la surface)"
            }
          },

          {
            name: "duration",
            type: "number",
            label: "Durée/travailleur (en heures)",
            required: true,
            validation: {
              min: 1,
              custom: (value: any) => value >= 1 || "Minimum 1 heure"
            },
            componentProps: {
              helpText: "Durée estimée par vous (sera ajustée par nos professionnels)"
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
        // Planification
        'scheduledDate', 'location', 'horaire', 'floor', 'elevator',
        // Surface & Dimensions
        'surface', 'roomCount', 'housingType', 'ceilingHeight',
        // Type de Nettoyage
        'cleaningType', 'frequency', 'cleaningLevel', 'accessConstraints',
        // Configuration
        'duration', 'workers',
        // Spécificités
        'additionalInfo'
      ];

      if (priceRelevantFields.includes(fieldName)) {
        try {
          console.log('🔄 [PRESET] Changement de champ détecté:', fieldName, '=', value);
          console.log('📊 [PRESET] FormData complet:', formData);

          // Déclencher le callback avec le prix calculé (sera géré par DetailForm)
          onPriceCalculated(formData.calculatedPrice || service.price, formData);
        } catch (error) {
          console.error('❌ [PRESET] Erreur onChange:', error);
          onError?.(error);
        }
      }
    } : undefined,

    onSubmit: async (data: any) => {
      console.log('🚀 [MenageSurMesurePreset] onSubmit appelé avec:', data);
      try {
        if (onSubmitSuccess) {
          console.log('✅ [MenageSurMesurePreset] Appel onSubmitSuccess');
          await onSubmitSuccess(data);
        } else {
          console.log('⚠️ [MenageSurMesurePreset] onSubmitSuccess non défini');
          console.error('❌ [MenageSurMesurePreset] onSubmitSuccess callback manquant');
          throw new Error('Gestionnaire de soumission non configuré');
        }
      } catch (error) {
        console.error('❌ [MenageSurMesurePreset] Erreur dans onSubmit:', error);
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
  MenageSurMesurePreset,
  menageSurMesureSummaryConfig,
  menageSurMesureDefaultValues,
  menageSurMesureStyles
} from './menageSurMesurePresets';

export { 
  MenageSurMesurePreset,
  menageSurMesureSummaryConfig,
  menageSurMesureDefaultValues,
  menageSurMesureStyles
};

// Export par défaut
export default MenageSurMesurePreset;

 