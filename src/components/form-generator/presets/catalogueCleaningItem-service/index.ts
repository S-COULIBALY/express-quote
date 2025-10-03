import { FormConfig } from '../../types';
import { CatalogueCleaningItem } from '@/types/booking';
import { CatalogueCleaningItemPreset } from './catalogueCleaningItemPresets';

export interface CatalogueCleaningItemPresetOptions {
  service: CatalogueCleaningItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getCatalogueCleaningItemConfig = (options: CatalogueCleaningItemPresetOptions): FormConfig => {
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
    
    // Utiliser les valeurs par défaut du CatalogueCleaningItemPreset + données du service
    return {
      ...CatalogueCleaningItemPreset.defaultValues,
      duration: service.duration.toString(),
      workers: service.workers.toString(),
      // Ajouter les données du service au contexte
      serviceName: service.name,
      serviceDescription: service.description,
      defaultPrice: service.price
    };
  };

  // Configuration de base utilisant CatalogueCleaningItemPreset
  const baseConfig: FormConfig = {
    title: "Détails de la réservation",
    description: "Personnalisez votre réservation selon vos besoins",
    serviceType: "general",
    customDefaults: getDefaultValues(),
    
    layout: {
      type: "sidebar",
      // Nouvelles fonctionnalités du SidebarLayout amélioré
      showPriceCalculation: true,
      showConstraintsByAddress: true,
      showModificationsSummary: true,
      initialPrice: service.price,
      serviceInfo: {
        name: service.name,
        description: service.description,
        icon: "🏠",
        features: service.includes || [
          `${service.duration} heure${service.duration > 1 ? 's' : ''} de service`,
          `${service.workers} professionnel${service.workers > 1 ? 's' : ''} qualifié${service.workers > 1 ? 's' : ''}`,
          "Matériel professionnel inclus",
          "Assurance responsabilité civile"
        ]
      },
      summaryConfig: {
        ...CatalogueCleaningItemPreset.summary,
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
                key: "duration", 
                label: "Durée totale", 
                format: (value: any) => `${value || service.duration} heure${(value || service.duration) > 1 ? 's' : ''}`,
                style: "font-medium text-gray-700"
              },
              { 
                key: "workers", 
                label: "Professionnels", 
                format: (value: any) => `${value || service.workers} professionnel${(value || service.workers) > 1 ? 's' : ''}`,
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Réutiliser les sections du CatalogueCleaningItemPreset
          ...CatalogueCleaningItemPreset.summary!.sections.slice(1), // Exclure la première section "Service Sélectionné"
          // Ajouter section prix dynamique
          {
            title: "Prix",
            icon: "💰",
            fields: [
              { key: "basePrice", label: "Prix de base", format: () => `${service.price}€ HT` },
              { 
                key: "totalPrice", 
                label: "Total TTC", 
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
            name: "location",
            type: "address-pickup",
            label: "Adresse",
            required: true,
            columnSpan: 2
          }
        ]
      },
      {
        title: "⚙️ Configuration du service",
        columns: 2,
        fields: [
          {
            name: "duration",
            type: "number",
            label: "Durée (en heures)",
            required: true,
            validation: {
              min: service.duration,
              custom: (value: any) => value >= service.duration || `Minimum ${service.duration} heure${service.duration > 1 ? 's' : ''}`
            }
          },
          {
            name: "workers", 
            type: "number",
            label: "Nombre de professionnels",
            required: true,
            validation: {
              min: service.workers,
              custom: (value: any) => value >= service.workers || `Minimum ${service.workers} professionnel${service.workers > 1 ? 's' : ''}`
            }
          }
        ]
      },
      {
        title: "🎯 Spécificités",
        fields: [
          {
            name: "serviceConstraints",
            type: "service-constraints",
            label: "Contraintes spécifiques",
            columnSpan: 2,
            componentProps: {
              buttonLabel: "Ajouter des contraintes spécifiques à ce service",
              modalTitle: "Contraintes spécifiques au service",
              showSelectedCount: true
            }
          },
          {
            name: "additionalInfo",
            type: "textarea",
            label: "Informations supplémentaires",
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

    // Handlers qui utilisent les callbacks (fonctionnalité préservée)
    onChange: onPriceCalculated ? async (fieldName: string, value: any, formData: any) => {
      const priceRelevantFields = [
        'duration', 'workers', 'location', 'scheduledDate', 
        'serviceConstraints', 'additionalInfo'
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
      console.log('🚀 [CatalogueCleaningItemPreset] onSubmit appelé avec:', data);
      try {
        if (onSubmitSuccess) {
          console.log('✅ [CatalogueCleaningItemPreset] Appel onSubmitSuccess');
          await onSubmitSuccess(data);
        } else {
          console.log('⚠️ [CatalogueCleaningItemPreset] onSubmitSuccess non défini');
          console.error('❌ [CatalogueCleaningItemPreset] onSubmitSuccess callback manquant');
          throw new Error('Gestionnaire de soumission non configuré');
        }
      } catch (error) {
        console.error('❌ [CatalogueCleaningItemPreset] Erreur dans onSubmit:', error);
        onError?.(error);
        throw error;
      }
    },

    submitLabel: "Réserver",
    cancelLabel: "Annuler"
  };

      // Les styles sont maintenant intégrés dans globals.css pour éviter les conflits de priorité CSS
    // Cela assure un chargement plus fiable et évite les problèmes de flash content

  return baseConfig;
}; 