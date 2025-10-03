import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";
import { commonFieldCollections, contactFields, dateField, timeField } from "../_shared/sharedFields";
import { createServiceValidation } from "../_shared/sharedValidation";

// 📝 Valeurs par défaut pour les formulaires de packs
export const catalogueMovingItemDefaultValues = {
  // Planification
  scheduledDate: '',
  
  // Adresses - Départ
  pickupAddress: '',
  pickupFloor: '0',
  pickupElevator: 'no',
  pickupCarryDistance: '',
  pickupLogisticsConstraints: [],
  
  // Adresses - Arrivée  
  deliveryAddress: '',
  deliveryFloor: '0',
  deliveryElevator: 'no',
  deliveryCarryDistance: '',
  deliveryLogisticsConstraints: [],
  
  // Configuration du pack
  duration: '',
  workers: '',
  
  // Contact et notifications
  whatsappOptIn: false,
  
  // Commentaires
  additionalInfo: ''
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const catalogueMovingItemStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Configuration du récapitulatif pour les packs
export const catalogueMovingItemSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif du Pack",
  sections: [
    {
      title: "Pack Sélectionné",
      icon: "📦",
      fields: [
        {
          key: "packName",
          label: "Pack",
          format: (value: any, formData: any) => formData.packName || "Pack personnalisé"
        },
        {
          key: "packDescription", 
          label: "Description",
          format: (value: any, formData: any) => formData.packDescription || "",
          condition: (value: any, formData: any) => !!formData.packDescription
        },
        {
          key: "duration",
          label: "Durée",
          format: (value: any) => value ? `${value} jour${value > 1 ? 's' : ''}` : "",
          condition: (value: any) => !!value
        },
        {
          key: "workers",
          label: "Équipe",
          format: (value: any) => value ? `${value} travailleur${value > 1 ? 's' : ''}` : "",
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Planification",
      icon: "📅",
      fields: [
        {
          key: "scheduledDate",
          label: "Date prévue",
          format: (value: any) => value ? new Date(value).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }) : "",
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Adresses",
      icon: "📍",
      fields: [
        {
          key: "pickupAddress",
          label: "Adresse de départ",
          format: (value: any, formData: any) => {
            const result = value;
            const details = [];
            
            if (formData.pickupFloor && formData.pickupFloor !== '0') {
              details.push(`Étage ${formData.pickupFloor}`);
            }
            if (formData.pickupElevator && formData.pickupElevator !== 'no') {
              const elevatorLabels: Record<string, string> = {
                'small': 'Petit ascenseur',
                'medium': 'Ascenseur moyen',
                'large': 'Grand ascenseur'
              };
              details.push(elevatorLabels[formData.pickupElevator] || 'Ascenseur');
            }
            if (formData.pickupCarryDistance) {
              details.push(`Portage ${formData.pickupCarryDistance.replace('-', ' à ').replace('+', '+ de ')}m`);
            }
            
            // Vérifier si monte-meuble dans les contraintes
            if (formData.pickupLogisticsConstraints && formData.pickupLogisticsConstraints.includes('furniture_lift_required')) {
              details.push('🏗️ Monte-meuble');
            }
            
            return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
          },
          condition: (value: any) => !!value
        },
        {
          key: "deliveryAddress",
          label: "Détails arrivée",
          format: (value: any, formData: any) => {
            const result = value;
            const details = [];
            
            if (formData.deliveryFloor && formData.deliveryFloor !== '0') {
              details.push(`Étage ${formData.deliveryFloor}`);
            }
            if (formData.deliveryElevator && formData.deliveryElevator !== 'no') {
              const elevatorLabels: Record<string, string> = {
                'small': 'Petit ascenseur',
                'medium': 'Ascenseur moyen',
                'large': 'Grand ascenseur'
              };
              details.push(elevatorLabels[formData.deliveryElevator] || 'Ascenseur');
            }
            if (formData.deliveryCarryDistance) {
              details.push(`Portage ${formData.deliveryCarryDistance.replace('-', ' à ').replace('+', '+ de ')}m`);
            }
            
            // Vérifier si monte-meuble dans les contraintes
            if (formData.deliveryLogisticsConstraints && formData.deliveryLogisticsConstraints.includes('furniture_lift_required')) {
              details.push('🏗️ Monte-meuble');
            }
            
            return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
          },
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Contact",
      icon: "📞",
      fields: [
        {
          key: "whatsappOptIn",
          label: "📱 Notifications WhatsApp",
          format: (value: any) => value ? "Activées" : "Désactivées",
          style: "text-xs text-gray-500"
        }
      ]
    }
  ]
};

// 🎯 Configuration complète du preset Pack (maintenant hérite du global)
export const CatalogueMovingItemPreset: PresetConfig = {
  form: {
    title: "Réservation Pack",
    description: "Configurez votre pack de déménagement",
    serviceType: "package",
    // 🌍 Hérite du preset global SANS override des couleurs (uniformité iOS 18)
    globalConfig: mergeWithGlobalPreset({
      // ✅ SUPPRIMÉ: Plus d'override des couleurs pour uniformité
      // appearance: { primaryColor: '#8B5CF6', secondaryColor: '#7C3AED' },
      layout: {
        type: 'two-column',
        sidebar: true,
        mobileFixedHeader: true,
        mobile: {
          singleColumn: true,
          optionDisplay: 'cards'      // Affichage en cartes pour les packs
        }
      },
      uiElements: {
        showServiceIcon: true,
        stickyHeader: true,
        submitButtonStyle: 'flat',    // Style flat pour les packs
        headerAppearance: 'blur',
        showBreadcrumbs: true         // Breadcrumbs utiles pour la navigation des packs
      },
      interactions: {
        hoverEffects: true,
        tapEffects: true,
        livePreview: false            // Pas de preview live pour les packs
      },
      metadata: {
        compatibleWith: 'Catalogue Packs'
      }
    }),
    // 📋 Sections du formulaire (récupérées de l'ancien système)
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
          }
        ]
      },
      {
        title: "🗺️ Adresses",
        fields: [
          {
            name: "pickupAddress",
            type: "address-pickup",
            label: "📍 Adresse de départ",
            required: true,
            columnSpan: 2,
            className: "pickup-section"
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
              { value: '5', label: '5ème étage' }
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
            name: "deliveryAddress",
            type: "address-delivery",
            label: "🏁 Adresse d'arrivée",
            required: true,
            columnSpan: 2,
            className: "delivery-section"
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
              { value: '5', label: '5ème étage' }
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
          }
        ]
      },
      {
        title: "⚙️ Modifications",
        fields: [
          {
            name: "duration",
            type: "select",
            label: "Durée souhaitée",
            options: [
              { value: '1', label: '1 jour' },
              { value: '2', label: '2 jours' },
              { value: '3', label: '3 jours' },
              { value: '4', label: '4 jours' },
              { value: '5', label: '5 jours' }
            ]
          },
          {
            name: "workers",
            type: "select",
            label: "Nombre de déménageurs",
            options: [
              { value: '1', label: '1 déménageur' },
              { value: '2', label: '2 déménageurs' },
              { value: '3', label: '3 déménageurs' },
              { value: '4', label: '4 déménageurs' },
              { value: '5', label: '5 déménageurs' }
            ]
          }
        ]
      },
      {
        title: "📝 Informations complémentaires",
        fields: [
          {
            name: "additionalInfo",
            type: "textarea",
            label: "Informations supplémentaires",
            componentProps: {
              placeholder: "Précisions, contraintes particulières, demandes spéciales...",
              rows: 4
            }
          }
        ]
      }
    ]
  },
  defaultValues: catalogueMovingItemDefaultValues,
  summary: catalogueMovingItemSummaryConfig,
  styles: catalogueMovingItemStyles,
  meta: {
    industry: "catalogueMovingItem",  // Mise à jour pour correspondre au type
    name: "Pack Déménagement",
    description: "Preset complet pour les formulaires de réservation de packs (hérite du global)",
    version: "2.0.0"  // Incrémenté pour indiquer la migration
  }
}; 