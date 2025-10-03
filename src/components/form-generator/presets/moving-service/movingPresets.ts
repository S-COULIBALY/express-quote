import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";
import { 
  createSizeFieldForService, 
  addressFields, 
  dateField, 
  timeField,
  contactFields,
  housingFields,
  commentsField,
  commonFieldCollections 
} from "../_shared/sharedFields";
import { createServiceValidation } from "../_shared/sharedValidation";

// 📝 Valeurs par défaut pour les formulaires de déménagement
export const movingDefaultValues = {
  // Date et Volume
  movingDate: "",
  volume: "",
  
  // Adresses - Départ
  pickupAddress: "",
  pickupFloor: "0",
  pickupElevator: "no",
  pickupCarryDistance: "",
  pickupHighFloorWarning: false,
  pickupFurnitureLift: false,
  pickupLogisticsConstraints: [],
  
  // Adresses - Arrivée  
  deliveryAddress: "",
  deliveryFloor: "0",
  deliveryElevator: "no",
  deliveryCarryDistance: "",
  deliveryHighFloorWarning: false,
  deliveryFurnitureLift: false,
  deliveryLogisticsConstraints: [],
  
  // Logement
  // propertyType: "",
  // surface: "",
  // rooms: "",
  // occupants: "",
  
  // Services
  // wantsAdditionalServices: false,
  // packaging: false,
  // furniture: false,
  // fragile: false,
  // storage: false,
  // disassembly: false,
  // unpacking: false,
  // supplies: false,
  // fragileItems: false,
  
  // Contact
  email: "",
  phone: "",
  whatsappOptIn: false,
  
  // Commentaires
  additionalComments: ""
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const movingStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Champs réutilisables avec la nouvelle architecture
export const movingSharedFields = [
  // Taille adaptée au déménagement
  createSizeFieldForService('moving'),
  
  // Adresses avec noms spécifiques
  {
    ...addressFields.origin,
    name: 'pickupAddress',
    label: 'Adresse de départ'
  },
  {
    ...addressFields.destination,
    name: 'deliveryAddress', 
    label: 'Adresse d\'arrivée'
  },
  
  // Date et heure
  {
    ...dateField,
    name: 'movingDate',
    label: 'Date de déménagement'
  },
  {
    ...timeField,
    name: 'preferredTime',
    label: 'Heure souhaitée'
  },
  
  // Contraintes logistiques départ
  {
    ...housingFields.floor,
    name: 'pickupFloor',
    label: 'Étage de départ'
  },
  {
    ...housingFields.elevator,
    name: 'pickupElevator',
    label: 'Ascenseur disponible (départ)'
  },
  
  // Contraintes logistiques arrivée
  {
    ...housingFields.floor,
    name: 'deliveryFloor',
    label: 'Étage d\'arrivée'
  },
  {
    ...housingFields.elevator,
    name: 'deliveryElevator',
    label: 'Ascenseur disponible (arrivée)'
  },
  
  // Services additionnels spécifiques déménagement
  {
    name: 'additionalServices',
    label: 'Services additionnels',
    type: 'checkbox' as const,
    options: [
      { label: '📦 Emballage/Déballage', value: 'packaging' },
      { label: '🔧 Démontage/Remontage mobilier', value: 'furniture' },
      { label: '🛡️ Protection objets fragiles', value: 'fragile' },
      { label: '🏪 Stockage temporaire', value: 'storage' },
      { label: '🧹 Nettoyage après déménagement', value: 'cleaning' }
    ]
  },
  
  // Volume estimé
  {
    name: 'volume',
    label: 'Volume estimé',
    type: 'select' as const,
    options: [
      { label: '10-15 m³ (Studio)', value: 'small' },
      { label: '20-30 m³ (2-3 pièces)', value: 'medium' },
      { label: '40-50 m³ (4-5 pièces)', value: 'large' },
      { label: '60+ m³ (6+ pièces)', value: 'extra-large' }
    ],
    required: true
  },
  
  // Contact
  contactFields.phone,
  contactFields.email,
  
  // Commentaires
  {
    ...commentsField,
    name: 'additionalInfo',
    label: 'Informations complémentaires sur le déménagement'
  }
];

// 🔒 Validation spécifique déménagement avec nouveaux champs
export const movingValidation = createServiceValidation('moving');

// 📋 Configuration du récapitulatif pour les déménagements
export const movingSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif du Déménagement",
  sections: [
    {
      title: "Planification",
      icon: "📅",
      fields: [
        {
          key: "movingDate",
          label: "Date prévue",
          format: (value: any) => value ? new Date(value).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          }) : ""
        },
        {
          key: "volume",
          label: "Volume",
          format: (value: any) => value ? `${value} m³` : ""
        }
      ]
    },
    {
      title: "Adresses",
      icon: "🗺️",
      fields: [
        {
          key: "pickupAddress",
          label: "📍 Départ",
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
            
            return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
          },
          condition: (value: any) => !!value
        },
        {
          key: "deliveryAddress", 
          label: "📍 Arrivée",
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
            
            return details.length > 0 ? `${result}\n${details.join(' • ')}` : result;
          },
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Informations complémentaires",
      icon: "📝",
      fields: [
        {
          key: "additionalInfo",
          label: "Commentaires",
          condition: (value: any) => !!value && value.trim() !== ""
        }
      ]
    },
    {
      title: "Notifications",
      icon: "📱",
      fields: [
        {
          key: "whatsappOptIn",
          label: "Notifications WhatsApp",
          format: (value: any) => value ? "✅ Activées pour le suivi" : "❌ Désactivées",
          style: "text-sm",
          condition: (value: any) => value !== undefined
        }
      ]
    }
  ]
};

// 🎯 Configuration complète du preset Moving (maintenant hérite du global)
export const MovingPreset: PresetConfig = {
  form: {
    title: "Devis Déménagement",
    description: "Configurez votre déménagement sur mesure",
    serviceType: "moving",
    // 📋 Utilise les nouveaux champs partagés
    fields: movingSharedFields,
    // 🌍 Hérite du preset global SANS override des couleurs (uniformité iOS 18)
    globalConfig: mergeWithGlobalPreset({
      // ✅ SUPPRIMÉ: Plus d'override des couleurs pour uniformité
      // appearance: { primaryColor: '#3B82F6', secondaryColor: '#1D4ED8' },
      layout: {
        type: 'two-column',           // 2 colonnes pour les formulaires complexes
        sidebar: true,                // Sidebar avec récap
        mobileFixedHeader: true       // Header fixe sur mobile
      },
      uiElements: {
        showServiceIcon: true,        // Icône de service
        stickyHeader: true,
        submitButtonStyle: 'filled',  // Bouton rempli pour action principale
        headerAppearance: 'blur'      // Effet de flou moderne
      },
      metadata: {
        compatibleWith: 'Déménagement Premium'
      }
    })
  },
  defaultValues: movingDefaultValues,
  summary: movingSummaryConfig,
  styles: movingStyles,
  meta: {
    industry: "moving",
    name: "Déménagement",
    description: "Preset complet pour les formulaires de devis de déménagement (hérite du global)",
    version: "2.0.0"  // Incrémenté pour indiquer la migration
  }
}; 