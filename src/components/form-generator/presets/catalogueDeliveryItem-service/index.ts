import { FormConfig } from '../../types';
import { CatalogueDeliveryItem } from '@/types/booking';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

export interface CatalogueDeliveryItemServicePresetOptions {
  service: CatalogueDeliveryItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getCatalogueDeliveryItemServiceConfig = (serviceOrOptions: CatalogueDeliveryItem | CatalogueDeliveryItemServicePresetOptions): FormConfig => {
  // Support pour les deux signatures : ancien (objet options) et nouveau (service direct)
  const isOptions = 'service' in serviceOrOptions || 'onPriceCalculated' in serviceOrOptions;
  const service = isOptions ? (serviceOrOptions as CatalogueDeliveryItemServicePresetOptions).service : (serviceOrOptions as CatalogueDeliveryItem);
  const onPriceCalculated = isOptions ? (serviceOrOptions as CatalogueDeliveryItemServicePresetOptions).onPriceCalculated : undefined;
  const onSubmitSuccess = isOptions ? (serviceOrOptions as CatalogueDeliveryItemServicePresetOptions).onSubmitSuccess : undefined;
  const onError = isOptions ? (serviceOrOptions as CatalogueDeliveryItemServicePresetOptions).onError : undefined;
  const editMode = isOptions ? (serviceOrOptions as CatalogueDeliveryItemServicePresetOptions).editMode : undefined;
  const sessionStorageKey = isOptions ? (serviceOrOptions as CatalogueDeliveryItemServicePresetOptions).sessionStorageKey : undefined;

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
        // Planning et Service
        scheduledDate: '',
        deliveryType: 'standard',
        
        // Objet à livrer
        packageType: 'colis',
        weight: '',
        isFragile: false,
        
        // Adresse de récupération
        pickupAddress: '',
        pickupTime: '',
        pickupFloor: '',
        pickupElevator: '',
        pickupLogisticsConstraints: [],
        
        // Adresse de livraison
        deliveryAddress: '',
        deliveryTime: '',
        deliveryFloor: '',
        deliveryElevator: '',
        deliveryLogisticsConstraints: [],
        
        // Informations supplémentaires
        additionalInfo: '',
        
        // Ajouter les données du service au contexte
        serviceName: service.name,
        serviceDescription: service.description,
        basePrice: service.price,
        defaultPrice: service.price
      };
  };

  const config: FormConfig = {
    //title: `Réserver votre livraison ${service.name}`,
    //description: "Personnalisez votre livraison selon vos besoins",
    serviceType: "general",
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
        icon: "🚚",
        features: service.includes || [
          "Service de livraison personnalisé",
          "Devis adapté à vos besoins",
          "Équipe professionnelle",
          "Suivi en temps réel",
          "Assurance responsabilité civile"
        ]
      },
      summaryConfig: {
        title: service.name,
        sections: [
          // Section Service enrichie avec les données dynamiques
          {
            title: "Service",
            icon: "🚚",
            fields: [
              { key: "serviceName", label: "Service sélectionné", format: () => service.name },
              { key: "serviceDescription", label: "Description", format: () => service.description },
              {
                key: "deliveryType",
                label: "Type de livraison",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Section Objet à livrer
          {
            title: "Objet à livrer",
            icon: "📦",
            fields: [
              {
                key: "packageType",
                label: "Type de colis",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              },
              {
                key: "weight",
                label: "Poids",
                format: (value: any) => `${value || 0} kg`,
                style: "font-medium text-gray-700"
              },
              {
                key: "isFragile",
                label: "Objet fragile",
                format: (value: any) => value ? "Oui" : "Non",
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Section Récupération
          {
            title: "Récupération",
            icon: "📍",
            fields: [
              {
                key: "pickupAddress",
                label: "Adresse de récupération",
                format: (value: any) => value || "Non spécifiée",
                style: "font-medium text-gray-700"
              },
              {
                key: "pickupTime",
                label: "Heure d'enlèvement",
                format: (value: any) => value || "Non spécifiée",
                style: "font-medium text-gray-700"
              },
              {
                key: "pickupFloor",
                label: "Étage",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Section Livraison
          {
            title: "Livraison",
            icon: "🚚",
            fields: [
              {
                key: "deliveryAddress",
                label: "Adresse de livraison",
                format: (value: any) => value || "Non spécifiée",
                style: "font-medium text-gray-700"
              },
              {
                key: "deliveryTime",
                label: "Heure de livraison",
                format: (value: any) => value || "Non spécifiée",
                style: "font-medium text-gray-700"
              },
              {
                key: "deliveryFloor",
                label: "Étage",
                format: (value: any) => value || "Non spécifié",
                style: "font-medium text-gray-700"
              }
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
          },
          {
            name: "pickupLogisticsConstraints",
            type: "access-constraints",
            label: "Spécificités Enlèvement",
            className: "pickup-field",
            componentProps: {
              type: "pickup",
              buttonLabel: "🎯 Contraintes & Spécificités",
              modalTitle: "Contraintes d'accès & Services Supplémentaires - Récupération",
              showServices: true,
              serviceType: ServiceType.DELIVERY // 🔧 CORRECTION: Spécifier le type de service
            }
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
          },
          {
            name: "deliveryLogisticsConstraints",
            type: "access-constraints",
            label: "Spécificités Livraison",
            className: "delivery-field",
            componentProps: {
              type: "delivery",
              buttonLabel: "🎯 Contraintes & Spécificités",
              modalTitle: "Contraintes d'accès & Services Supplémentaires - Livraison",
              showServices: true,
              serviceType: ServiceType.DELIVERY // 🔧 CORRECTION: Spécifier le type de service
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

    // Handlers qui utilisent les callbacks
    onChange: onPriceCalculated ? async (fieldName: string, value: any, formData: any) => {
      const priceRelevantFields = [
        // Planning et Service
        'scheduledDate', 'deliveryType',
        
        // Objet à livrer
        'packageType', 'weight', 'isFragile',
        
        // Adresse de récupération
        'pickupAddress', 'pickupTime', 'pickupFloor', 'pickupElevator', 'pickupLogisticsConstraints',
        
        // Adresse de livraison
        'deliveryAddress', 'deliveryTime', 'deliveryFloor', 'deliveryElevator', 'deliveryLogisticsConstraints',
        
        // Informations supplémentaires
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

// Export des presets complets pour compatibilité
import { 
  CatalogueDeliveryItemPreset,
  catalogueDeliveryItemSummaryConfig,
  catalogueDeliveryItemDefaultValues,
  catalogueDeliveryItemStyles
} from './catalogueDeliveryItemPresets';

export { 
  CatalogueDeliveryItemPreset,
  catalogueDeliveryItemSummaryConfig,
  catalogueDeliveryItemDefaultValues,
  catalogueDeliveryItemStyles
};

// Export par défaut
export default CatalogueDeliveryItemPreset; 