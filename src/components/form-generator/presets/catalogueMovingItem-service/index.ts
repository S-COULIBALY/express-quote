import { FormConfig } from '../../types';
import { CatalogueMovingItem } from '@/types/booking';
import { CatalogueMovingItemPreset } from './catalogueMovingItemPresets';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';

export interface CatalogueMovingItemPresetOptions {
  pack: CatalogueMovingItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getCatalogueMovingItemConfig = (packOrOptions: CatalogueMovingItem | CatalogueMovingItemPresetOptions): FormConfig => {
  // Support pour les deux signatures : ancien (objet options) et nouveau (pack direct)
  const isOptions = 'pack' in packOrOptions || 'onPriceCalculated' in packOrOptions;
  const pack = isOptions ? (packOrOptions as CatalogueMovingItemPresetOptions).pack : (packOrOptions as CatalogueMovingItem);
  const onPriceCalculated = isOptions ? (packOrOptions as CatalogueMovingItemPresetOptions).onPriceCalculated : undefined;
  const onSubmitSuccess = isOptions ? (packOrOptions as CatalogueMovingItemPresetOptions).onSubmitSuccess : undefined;
  const onError = isOptions ? (packOrOptions as CatalogueMovingItemPresetOptions).onError : undefined;
  const editMode = isOptions ? (packOrOptions as CatalogueMovingItemPresetOptions).editMode : undefined;
  const sessionStorageKey = isOptions ? (packOrOptions as CatalogueMovingItemPresetOptions).sessionStorageKey : undefined;

  // Vérification de sécurité: pack doit être défini
  if (!pack) {
    throw new Error('getCatalogueMovingItemConfig: pack is required');
  }

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
    
    // Utiliser les valeurs par défaut du CatalogueMovingItemPreset + données du pack
    if (!pack) {
      return CatalogueMovingItemPreset.defaultValues;
    }

    return {
      ...CatalogueMovingItemPreset.defaultValues,
      duration: pack.duration?.toString() || '',
      workers: pack.workers?.toString() || '',
      // ✅ Ajouter les valeurs par défaut du pack pour la comparaison hasModifications()
      defaultDuration: pack.duration || 0,
      defaultWorkers: pack.workers || 0,
      defaultPrice: pack.price || 0,
      // Ajouter les données du pack au contexte
      packName: pack.name || '',
      packDescription: pack.description || ''
    };
  };

  // Configuration de base utilisant CatalogueMovingItemPreset
  const baseConfig: FormConfig = {
    //title: `Réserver votre ${pack.name}`,
    //description: "Personnalisez votre réservation selon vos besoins",
    serviceType: "package",
    customDefaults: getDefaultValues(),
    
    layout: {
      type: "sidebar",
      // Nouvelles fonctionnalités du SidebarLayout amélioré
      showPriceCalculation: true,
      showConstraintsByAddress: true,
      showModificationsSummary: true,
      initialPrice: pack.price,
      serviceInfo: {
        name: "Détail du forfait initial",
        description: "Détails de votre forfait déménagement",
        icon: "📦",
        features: pack.includes || [
          "Durée personnalisable selon vos besoins",
          "Équipe de déménageurs professionnels",
          `${pack.includedDistance || 20} km inclus`,
          "Matériel de déménagement fourni",
          "Assurance transport incluse"
        ]
      },
      summaryConfig: {
        ...CatalogueMovingItemPreset.summary,
        title: pack.name,
        sections: [
          // Section Pack enrichie avec les données dynamiques
          {
            title: "Pack",
            icon: "📦",
            fields: [
              { key: "packName", label: "Pack sélectionné", format: () => pack.name },
              { key: "packDescription", label: "Description", format: () => pack.description },
              { 
                key: "duration", 
                label: "Durée totale", 
                format: (value: any) => `${value || pack.duration} jour${(value || pack.duration) > 1 ? 's' : ''}`,
                style: "font-medium text-gray-700"
              },
              { 
                key: "workers", 
                label: "Déménageurs", 
                format: (value: any) => `${value || pack.workers} déménageur${(value || pack.workers) > 1 ? 's' : ''}`,
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Section Configuration actuelle (temps réel)
          {
            title: "Configuration actuelle",
            icon: "⚙️",
            fields: [
              { 
                key: "duration", 
                label: "Durée sélectionnée", 
                format: (value: any) => `${value || pack.duration} jour${(value || pack.duration) > 1 ? 's' : ''}`,
                style: "font-semibold text-emerald-600"
              },
              { 
                key: "workers", 
                label: "Nombre de déménageurs", 
                format: (value: any) => `${value || pack.workers} déménageur${(value || pack.workers) > 1 ? 's' : ''}`,
                style: "font-semibold text-emerald-600"
              },
              { 
                key: "scheduledDate", 
                label: "Date prévue", 
                format: (value: any) => value ? new Date(value).toLocaleDateString('fr-FR') : "Non définie",
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Réutiliser les sections du CatalogueMovingItemPreset
          ...CatalogueMovingItemPreset.summary!.sections.slice(1), // Exclure la première section "Pack Sélectionné"
          // Ajouter section prix dynamique
          {
            title: "Prix",
            icon: "💰",
            fields: [
              { key: "basePrice", label: "Prix de base", format: () => `${pack.price}€ HT` },
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
            name: "horaire",
            type: "select",
            label: "Horaire de RDV",
            required: true,
            options: [
              { value: "matin-6h", label: "Matin - 6h" },
              { value: "matin-8h", label: "Matin - 8h" },
              { value: "apres-midi-13h", label: "Après-midi - 13h" },
              { value: "soiree-18h", label: "Soirée - 18h" },
              { value: "flexible", label: "Flexible - selon disponibilité" }
            ]
          }
        ]
      },
      {
        title: "🗺️ Adresses",
        fields: [
          // 📦 Section DÉPART avec styling spécial
          {
            name: "pickupAddress",
            type: "address-pickup",
            label: "📍 Adresse de départ",
            required: true,
            columnSpan: 2,
            className: "pickup-section",
            componentProps: {
              iconColor: "#10b981" // Vert pour le départ
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
          // 📦 Ligne combinée: Distance + Contraintes DÉPART
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
              buttonLabel: "🎯 Contraintes & Spécificités",
              modalTitle: "Contraintes d'accès & Services Supplémentaires - Départ",
              showServices: true,
              serviceType: ServiceType.MOVING // 🔧 CORRECTION: Spécifier le type de service (PACKING pour déménagement catalogue)
            }
          },
          // Séparateur entre départ et arrivée
          {
            name: "address-separator",
            type: "separator",
            columnSpan: 2
          },
          // 🚚 Section ARRIVÉE avec styling différentiel  
          {
            name: "deliveryAddress",
            type: "address-delivery",
            label: "📍 Adresse d'arrivée",
            required: true,
            columnSpan: 2,
            className: "delivery-section",
            componentProps: {
              iconColor: "#ef4444" // Rouge pour l'arrivée
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
          // 🚚 Ligne combinée: Distance + Contraintes ARRIVÉE
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
              buttonLabel: "🎯 Contraintes & Spécificités",
              modalTitle: "Contraintes d'accès & Services Supplémentaires - Arrivée",
              showServices: true,
              serviceType: ServiceType.MOVING // 🔧 CORRECTION: Spécifier le type de service (PACKING pour déménagement catalogue)
            }
          },
        ]
      },
      {
        title: "⚙️ Configuration votre forfait",
        columns: 2,
        fields: [
          {
            name: "duration",
            type: "number",
            label: "Durée (en Heures)",
            required: true,
            validation: {
              min: pack.duration,
              custom: (value: any) => value >= pack.duration || `Minimum ${pack.duration} jour${pack.duration > 1 ? 's' : ''}`
            },
            componentProps: {
              helpText: `Minimum ${pack.duration} jour${pack.duration > 1 ? 's' : ''} pour ce pack`
            }
          },
          {
            name: "workers", 
            type: "number",
            label: "Nombre de professionnels",
            required: true,
            validation: {
              min: pack.workers,
              custom: (value: any) => value >= pack.workers || `Minimum ${pack.workers} travailleur${pack.workers > 1 ? 's' : ''}`
            },
            componentProps: {
              helpText: `Minimum ${pack.workers} travailleur${pack.workers > 1 ? 's' : ''} pour ce pack`
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
              placeholder: "Départ: digicode, stationnement... / Arrivée: interphone, accès..."
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
        'duration', 'workers', 'pickupAddress', 'deliveryAddress',
        'pickupFloor', 'deliveryFloor', 'pickupElevator', 'deliveryElevator',
        'pickupCarryDistance', 'deliveryCarryDistance',
        'pickupLogisticsConstraints', 'deliveryLogisticsConstraints'
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
      console.log('🚀 [CatalogueMovingItemPreset] onSubmit appelé avec:', data);
      try {
        if (onSubmitSuccess) {
          console.log('✅ [CatalogueMovingItemPreset] Appel onSubmitSuccess');
          await onSubmitSuccess(data);
        } else {
          console.log('⚠️ [CatalogueMovingItemPreset] onSubmitSuccess non défini');
          console.error('❌ [CatalogueMovingItemPreset] onSubmitSuccess callback manquant');
          throw new Error('Gestionnaire de soumission non configuré');
        }
      } catch (error) {
        console.error('❌ [CatalogueMovingItemPreset] Erreur dans onSubmit:', error);
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