import { FormConfig } from '../../types';
import { CatalogueDeliveryItem } from '@/types/booking';

export interface CatalogueDeliveryItemServicePresetOptions {
  service: CatalogueDeliveryItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getCatalogueDeliveryItemServiceConfig = (options: CatalogueDeliveryItemServicePresetOptions): FormConfig => {
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
    pickupTime: '',
    deliveryTime: '',
    packageType: 'colis',
    weight: '',
    isFragile: false,
    deliveryType: 'standard',
    // Ajouter les données du service au contexte
    serviceName: service.name,
    serviceDescription: service.description,
    basePrice: service.price,
    defaultPrice: service.price
  };
  };

  const config: FormConfig = {
    title: `Réserver votre livraison ${service.name}`,
    description: "Personnalisez votre livraison selon vos besoins",
    serviceType: "general",
    customDefaults: getDefaultValues(),
    
    layout: {
      type: "sidebar",
      showPriceCalculation: true,
      showConstraintsByAddress: true,
      showModificationsSummary: true,
      onPriceCalculated: onPriceCalculated ? (price: number) => onPriceCalculated(price, {}) : undefined,
      initialPrice: service.price
    },

    sections: [
      {
        title: "📅 Planning et Service",
        columns: 2,
        fields: [
          {
            name: "scheduledDate",
            type: "date",
            label: "Date de livraison",
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
            name: "deliveryType",
            type: "select",
            label: "Type de livraison",
            required: true,
            options: [
              { value: "standard", label: "Standard" },
              { value: "express", label: "Express" },
              { value: "urgent", label: "Urgent" }
            ]
          }
        ]
      },
      {
        title: "📦 Objet à livrer",
        columns: 2,
        fields: [
          {
            name: "packageType",
            type: "select",
            label: "Type de colis",
            required: true,
            options: [
              { value: "colis", label: "Colis standard" },
              { value: "meuble", label: "Meuble" },
              { value: "electromenager", label: "Électroménager" },
              { value: "fragile", label: "Objet fragile" },
              { value: "document", label: "Document" }
            ]
          },
          {
            name: "weight",
            type: "number",
            label: "Poids (kg)",
            required: true,
            validation: {
              min: 0.1,
              max: 1000,
              custom: (value: any) => {
                if (!value || value <= 0) return "Le poids doit être supérieur à 0";
                if (value > 1000) return "Le poids ne peut pas dépasser 1000 kg";
                return true;
              }
            },
            componentProps: {
              placeholder: "5.5"
            }
          },
          {
            name: "isFragile",
            type: "checkbox",
            label: "Objet fragile",
            columnSpan: 2,
            componentProps: {
              helpText: "Cochez si l'objet nécessite une attention particulière"
            }
          }
        ]
      },
      {
        title: "📍 Adresse de récupération",
        className: "pickup-section",
        fields: [
          {
            name: "pickupAddress",
            type: "address-pickup",
            label: "Adresse de récupération",
            required: true,
            columnSpan: 2,
            validation: {
              custom: (value: any) => value?.trim() || "L'adresse de récupération est requise"
            }
          },
          {
            name: "pickupTime",
            type: "text",
            label: "Heure d'enlèvement",
            required: true,
            componentProps: {
              placeholder: "14:30"
            },
            validation: {
              custom: (value: any) => {
                if (!value) return "L'heure d'enlèvement est requise";
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                return timeRegex.test(value) || "Format attendu: HH:MM (ex: 14:30)";
              }
            }
          },
          {
            name: "pickupFloor",
            type: "select",
            label: "Étage",
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
            name: "pickupElevator",
            type: "select",
            label: "Ascenseur",
            options: [
              { value: "yes", label: "Oui" },
              { value: "no", label: "Non" }
            ]
          }
        ]
      },
      {
        title: "🚚 Adresse de livraison",
        className: "delivery-section",
        fields: [
          {
            name: "deliveryAddress",
            type: "address-delivery",
            label: "Adresse de livraison",
            required: true,
            columnSpan: 2,
            validation: {
              custom: (value: any) => value?.trim() || "L'adresse de livraison est requise"
            }
          },
          {
            name: "deliveryTime",
            type: "text",
            label: "Heure de livraison",
            required: true,
            componentProps: {
              placeholder: "16:00"
            },
            validation: {
              custom: (value: any) => {
                if (!value) return "L'heure de livraison est requise";
                const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                return timeRegex.test(value) || "Format attendu: HH:MM (ex: 16:00)";
              }
            }
          },
          {
            name: "deliveryFloor",
            type: "select",
            label: "Étage",
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
            name: "deliveryElevator",
            type: "select",
            label: "Ascenseur",
            options: [
              { value: "yes", label: "Oui" },
              { value: "no", label: "Non" }
            ]
          }
        ]
      },
      {
        title: "📝 Informations supplémentaires",
        fields: [
          {
            name: "additionalInfo",
            type: "textarea",
            label: "Informations supplémentaires",
            columnSpan: 2,
            componentProps: {
              rows: 3,
              placeholder: "Instructions spéciales, contraintes d'accès, horaires préférés..."
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

    // Handlers qui utilisent les callbacks (fonctionnalité préservée)
    onChange: onPriceCalculated ? async (fieldName: string, value: any, formData: any) => {
      const priceRelevantFields = [
        'packageType', 'weight', 'isFragile', 'deliveryType',
        'pickupAddress', 'deliveryAddress', 'pickupFloor', 'deliveryFloor',
        'pickupElevator', 'deliveryElevator', 'pickupTime', 'deliveryTime'
      ];
      
      if (priceRelevantFields.includes(fieldName)) {
        try {
          // Le hook externe gérera le calcul réel (avec distance déjà calculée dans DetailForm)
          onPriceCalculated(0, formData);
        } catch (error) {
          onError?.(error);
        }
      }
    } : undefined,

    onSubmit: async (data: any) => {
      console.log('🚀 [CatalogueDeliveryItemPreset] onSubmit appelé avec:', data);
      try {
        if (onSubmitSuccess) {
          console.log('✅ [CatalogueDeliveryItemPreset] Appel onSubmitSuccess');
          await onSubmitSuccess(data);
        } else {
          console.log('⚠️ [CatalogueDeliveryItemPreset] onSubmitSuccess non défini');
          console.error('❌ [CatalogueDeliveryItemPreset] onSubmitSuccess callback manquant');
          throw new Error('Gestionnaire de soumission non configuré');
        }
      } catch (error) {
        console.error('❌ [CatalogueDeliveryItemPreset] Erreur dans onSubmit:', error);
        onError?.(error);
        throw error;
      }
    },

    submitLabel: "Réserver",
    cancelLabel: "Annuler"
  };

  return config;
}; 