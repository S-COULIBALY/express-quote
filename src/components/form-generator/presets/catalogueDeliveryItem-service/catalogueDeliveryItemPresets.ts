import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";
import { commonFieldCollections, contactFields, dateField, timeField } from "../_shared/sharedFields";
import { createServiceValidation } from "../_shared/sharedValidation";

// 📝 Valeurs par défaut pour les formulaires de livraison
export const catalogueDeliveryItemDefaultValues = {
  // 📅 Planification
  scheduledDate: '',
  deliveryType: 'standard',
  
  // 📦 Objet à livrer
  packageType: 'colis',
  weight: '',
  isFragile: false,
  
  // 📍 Adresse de récupération
  pickupAddress: '',
  pickupTime: '',
  pickupFloor: '0',
  pickupElevator: 'yes',
  
  // 🚚 Adresse de livraison
  deliveryAddress: '',
  deliveryTime: '',
  deliveryFloor: '0',
  deliveryElevator: 'yes',
  
  // 📞 Contact et notifications
  whatsappOptIn: false,
  
  // 📝 Commentaires
  additionalInfo: ''
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const catalogueDeliveryItemStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Configuration du récapitulatif pour les livraisons
export const catalogueDeliveryItemSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif de la Livraison",
  sections: [
    {
      title: "Service Sélectionné",
      icon: "🚚",
      fields: [
        {
          key: "serviceName",
          label: "Service",
          format: (value: any, formData: any) => formData.serviceName || "Service de livraison"
        },
        {
          key: "serviceDescription", 
          label: "Description",
          format: (value: any, formData: any) => formData.serviceDescription || "",
          condition: (value: any, formData: any) => !!formData.serviceDescription
        },
        {
          key: "deliveryType",
          label: "Type de livraison",
          format: (value: any) => {
            const types: { [key: string]: string } = {
              standard: "Standard",
              express: "Express",
              urgent: "Urgent"
            };
            return types[value] || value;
          },
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Objet à livrer",
      icon: "📦",
      fields: [
        {
          key: "packageType",
          label: "Type de colis",
          format: (value: any) => {
            const types: { [key: string]: string } = {
              colis: "Colis standard",
              meuble: "Meuble",
              electromenager: "Électroménager",
              fragile: "Objet fragile",
              document: "Document"
            };
            return types[value] || value;
          },
          condition: (value: any) => !!value
        },
        {
          key: "weight",
          label: "Poids",
          format: (value: any) => value ? `${value} kg` : "",
          condition: (value: any) => !!value
        },
        {
          key: "isFragile",
          label: "Fragile",
          format: (value: any) => value ? "Oui" : "Non",
          condition: (value: any) => value === true
        }
      ]
    },
    {
      title: "Récupération",
      icon: "📍",
      fields: [
        {
          key: "pickupAddress",
          label: "Adresse",
          format: (value: any) => value || "",
          condition: (value: any) => !!value
        },
        {
          key: "pickupTime",
          label: "Heure d'enlèvement",
          format: (value: any) => value || "",
          condition: (value: any) => !!value
        },
        {
          key: "pickupFloor",
          label: "Étage",
          format: (value: any) => {
            const floors: { [key: string]: string } = {
              '0': 'Rez-de-chaussée',
              '1': '1er étage',
              '2': '2ème étage',
              '3': '3ème étage',
              '4': '4ème étage',
              '5+': '5ème étage et plus'
            };
            return floors[value] || value;
          },
          condition: (value: any) => !!value && value !== '0'
        },
        {
          key: "pickupElevator",
          label: "Ascenseur",
          format: (value: any) => value === 'yes' ? 'Oui' : 'Non',
          condition: (value: any) => value === 'no'
        }
      ]
    },
    {
      title: "Livraison",
      icon: "🚚",
      fields: [
        {
          key: "deliveryAddress",
          label: "Adresse",
          format: (value: any) => value || "",
          condition: (value: any) => !!value
        },
        {
          key: "deliveryTime",
          label: "Heure de livraison",
          format: (value: any) => value || "",
          condition: (value: any) => !!value
        },
        {
          key: "deliveryFloor",
          label: "Étage",
          format: (value: any) => {
            const floors: { [key: string]: string } = {
              '0': 'Rez-de-chaussée',
              '1': '1er étage',
              '2': '2ème étage',
              '3': '3ème étage',
              '4': '4ème étage',
              '5+': '5ème étage et plus'
            };
            return floors[value] || value;
          },
          condition: (value: any) => !!value && value !== '0'
        },
        {
          key: "deliveryElevator",
          label: "Ascenseur",
          format: (value: any) => value === 'yes' ? 'Oui' : 'Non',
          condition: (value: any) => value === 'no'
        }
      ]
    },
    {
      title: "Informations complémentaires",
      icon: "📝",
      fields: [
        {
          key: "additionalInfo",
          label: "Informations supplémentaires",
          format: (value: any) => value || "",
          condition: (value: any) => !!value
        }
      ]
    }
  ]
};

// 🎯 Configuration principale du preset de livraison (maintenant hérite du global)
export const CatalogueDeliveryItemPreset: PresetConfig = {
  form: {
    title: "Réservation Livraison",
    description: "Configurez votre service de livraison",
    serviceType: "general",
    // 🌍 Hérite du preset global SANS override des couleurs (uniformité iOS 18)
    globalConfig: mergeWithGlobalPreset({
      // ✅ SUPPRIMÉ: Plus d'override des couleurs pour uniformité
      // appearance: { primaryColor: '#F59E0B', secondaryColor: '#D97706' },
      layout: {
        type: 'two-column',           // 2 colonnes pour départ/arrivée
        sidebar: true,
        mobileFixedHeader: true,
        mobile: {
          singleColumn: true,
          optionDisplay: 'list'       // Liste pour les options de livraison
        }
      },
      uiElements: {
        showServiceIcon: true,
        stickyHeader: true,
        submitButtonStyle: 'filled',  // Bouton rempli pour urgence
        headerAppearance: 'blur',     // Effet moderne pour la livraison
        showBreadcrumbs: true         // Breadcrumbs utiles pour le process livraison
      },
      interactions: {
        hoverEffects: true,
        tapEffects: true,
        livePreview: false            // Pas de preview live pour livraison
      },
      validation: {
        mode: 'onBlur',
        showInlineErrors: true,       // Important pour adresses de livraison
        highlightInvalidFields: true
      },
      metadata: {
        compatibleWith: 'Services de Livraison Catalogue'
      }
    }),
    // 📋 Sections du formulaire (récupérées de l'ancien système)
    sections: [
      {
        title: "📅 Planning et Service",
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
              max: 1000
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
            columnSpan: 2
          },
          {
            name: "pickupTime",
            type: "text",
            label: "Heure d'enlèvement",
            required: true,
            componentProps: {
              placeholder: "14:30"
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
            columnSpan: 2
          },
          {
            name: "deliveryTime",
            type: "text",
            label: "Heure de livraison",
            required: true,
            componentProps: {
              placeholder: "16:00"
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
        title: "📝 Informations complémentaires",
        fields: [
          {
            name: "additionalInfo",
            type: "textarea",
            label: "Informations supplémentaires",
            componentProps: {
              rows: 3,
              placeholder: "Instructions spéciales, code d'accès, numéro de contact..."
            }
          }
        ]
      }
    ]
  },
  defaultValues: catalogueDeliveryItemDefaultValues,
  summary: catalogueDeliveryItemSummaryConfig,
  styles: catalogueDeliveryItemStyles,
  meta: {
    industry: "catalogueDeliveryItem",  // Mise à jour pour correspondre au type
    name: "Service de Livraison",
    description: "Preset complet pour les formulaires de réservation de livraisons (hérite du global)",
    version: "2.0.0"  // Incrémenté pour indiquer la migration
  }
}; 