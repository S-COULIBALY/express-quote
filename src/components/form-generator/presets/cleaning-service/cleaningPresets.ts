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

// 📝 Valeurs par défaut pour les formulaires de nettoyage
export const cleaningDefaultValues = {
  // Type et fréquence
  cleaningType: "standard",
  frequency: "oneTime",
  
  // Logement
  propertyType: "",
  surface: "",
  rooms: "",
  propertyState: "normal",
  
  // Caractéristiques spéciales
  hasBalcony: false,
  hasPets: false,
  hasSpecialConstraints: false,
  specialConstraints: [],
  
  // Adresse
  address: "",
  floor: "0",
  elevator: "no",
  accessConstraints: [],
  
  // Planning
  cleaningDate: "",
  preferredTime: "",
  
  // Contact
  email: "",
  phone: "",
  whatsappOptIn: false,
  
  // Commentaires
  additionalComments: ""
};

// 🎨 Styles CSS spécifiques au nettoyage
export const cleaningStyles = `
  .cleaning-form {
    --primary-color: #10B981;
    --primary-hover: #059669;
    --primary-light: #D1FAE5;
    --text-primary: #065F46;
  }
  
  .cleaning-form .form-section {
    background: linear-gradient(135deg, var(--primary-light) 0%, #F3F4F6 100%);
    border-left: 4px solid var(--primary-color);
  }
  
  .cleaning-form .submit-button {
    background: var(--primary-color);
    color: white;
    transition: all 0.2s ease;
  }
  
  .cleaning-form .submit-button:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
  }
  
  .cleaning-form .price-display {
    background: var(--primary-light);
    border: 2px solid var(--primary-color);
    color: var(--text-primary);
  }
  
  .cleaning-form .constraint-chip {
    background: var(--primary-color);
    color: white;
  }
`;

// 📋 Champs réutilisables avec la nouvelle architecture
export const cleaningSharedFields = [
  // Taille adaptée au nettoyage
  createSizeFieldForService('cleaning'),
  
  // Adresse unique (service sur place)
  {
    ...addressFields.single,
    name: 'address',
    label: 'Adresse du logement'
  },
  
  // Date et heure
  {
    ...dateField,
    name: 'cleaningDate',
    label: 'Date de nettoyage'
  },
  {
    ...timeField,
    name: 'preferredTime',
    label: 'Heure souhaitée'
  },
  
  // Contraintes logistiques
  {
    ...housingFields.floor,
    name: 'floor',
    label: 'Étage'
  },
  {
    ...housingFields.elevator,
    name: 'elevator',
    label: 'Ascenseur disponible'
  },
  {
    ...housingFields.access,
    name: 'accessDifficulty',
    label: 'Difficulté d\'accès'
  },
  
  // Type de nettoyage
  {
    name: 'cleaningType',
    label: 'Type de nettoyage',
    type: 'select' as const,
    options: [
      { label: 'Nettoyage standard', value: 'standard' },
      { label: 'Nettoyage approfondi', value: 'deep' },
      { label: 'Nettoyage de fin de bail', value: 'endOfLease' },
      { label: 'Nettoyage après travaux', value: 'postConstruction' }
    ],
    defaultValue: 'standard',
    required: true
  },
  
  // Fréquence
  {
    name: 'frequency',
    label: 'Fréquence',
    type: 'radio' as const,
    options: [
      { label: 'Ponctuel', value: 'oneTime' },
      { label: 'Hebdomadaire', value: 'weekly' },
      { label: 'Bi-mensuel', value: 'biweekly' },
      { label: 'Mensuel', value: 'monthly' }
    ],
    defaultValue: 'oneTime',
    required: true
  },
  
  // Type de logement
  {
    name: 'propertyType',
    label: 'Type de logement',
    type: 'select' as const,
    options: [
      { label: 'Appartement', value: 'apartment' },
      { label: 'Maison', value: 'house' },
      { label: 'Bureau', value: 'office' },
      { label: 'Commerce', value: 'commercial' }
    ],
    required: true
  },
  
  // Surface
  {
    name: 'surface',
    label: 'Surface approximative',
    type: 'number' as const,
    required: true,
    min: 10,
    max: 500,
    placeholder: 'Ex: 75',
    suffix: 'm²'
  },
  
  // Nombre de pièces
  {
    name: 'rooms',
    label: 'Nombre de pièces',
    type: 'select' as const,
    options: [
      { label: '1 pièce', value: '1' },
      { label: '2 pièces', value: '2' },
      { label: '3 pièces', value: '3' },
      { label: '4 pièces', value: '4' },
      { label: '5+ pièces', value: '5+' }
    ],
    required: true
  },
  
  // État du logement
  {
    name: 'propertyState',
    label: 'État du logement',
    type: 'select' as const,
    options: [
      { label: 'Normal', value: 'normal' },
      { label: 'Très sale', value: 'dirty' },
      { label: 'Après travaux', value: 'postWork' },
      { label: 'Abandonné longtemps', value: 'abandoned' }
    ],
    defaultValue: 'normal'
  },
  
  // Contraintes spéciales
  {
    name: 'specialConstraints',
    label: 'Contraintes spéciales',
    type: 'checkbox' as const,
    options: [
      { label: '🐕 Présence d\'animaux', value: 'pets' },
      { label: '🏠 Balcon/Terrasse', value: 'balcony' },
      { label: '🧽 Produits écologiques uniquement', value: 'ecoProducts' },
      { label: '⚠️ Matériaux délicats', value: 'delicateMaterials' },
      { label: '🔇 Besoin de discrétion', value: 'discretion' }
    ]
  },
  
  // Contact
  contactFields.phone,
  contactFields.email,
  
  // Commentaires
  {
    ...commentsField,
    name: 'additionalComments',
    label: 'Informations complémentaires sur le nettoyage'
  }
];

// 🔒 Validation spécifique nettoyage avec nouveaux champs
export const cleaningValidation = createServiceValidation('cleaning');

// 📋 Configuration du récapitulatif pour le nettoyage
export const cleaningSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif du service",
  sections: [
    {
      title: "Service de nettoyage",
      fields: [
        { key: "cleaningType", label: "Type de nettoyage", format: (value: string) => {
          const types: Record<string, string> = {
            standard: "Nettoyage standard",
            deep: "Grand nettoyage",
            maintenance: "Nettoyage d'entretien",
            postWork: "Nettoyage post-travaux",
            moveOut: "Nettoyage fin de bail"
          };
          return types[value] || value;
        }},
        { key: "frequency", label: "Fréquence", format: (value: string) => {
          const frequencies: Record<string, string> = {
            oneTime: "Ponctuel",
            weekly: "Hebdomadaire", 
            biweekly: "Bi-mensuel",
            monthly: "Mensuel"
          };
          return frequencies[value] || value;
        }},
        { key: "surface", label: "Surface", format: (value: string) => value ? `${value} m²` : "Non spécifiée" },
        { key: "rooms", label: "Nombre de pièces" }
      ]
    },
    {
      title: "Logement",
      fields: [
        { key: "address", label: "Adresse" },
        { key: "floor", label: "Étage", format: (value: string) => value === "0" ? "Rez-de-chaussée" : `${value}e étage` },
        { key: "elevator", label: "Ascenseur", format: (value: string) => value === "yes" ? "Oui" : "Non" },
        { key: "propertyState", label: "État du logement", format: (value: string) => {
          const states: Record<string, string> = {
            normal: "État normal",
            dirty: "Très sale",
            damaged: "Endommagé",
            postWork: "Post-travaux"
          };
          return states[value] || value;
        }}
      ]
    },
    {
      title: "Caractéristiques spéciales",
      fields: [
        { key: "hasBalcony", label: "Balcon/Terrasse", format: (value: boolean) => value ? "Oui" : "Non" },
        { key: "hasPets", label: "Animaux domestiques", format: (value: boolean) => value ? "Oui" : "Non" },
        { key: "specialConstraints", label: "Contraintes spéciales", format: (value: string[]) => 
          value && value.length > 0 ? value.join(", ") : "Aucune" }
      ]
    },
    {
      title: "Planning",
      fields: [
        { key: "cleaningDate", label: "Date souhaitée" },
        { key: "preferredTime", label: "Créneau préféré" }
      ]
    },
    {
      title: "Contact",
      fields: [
        { key: "email", label: "Email" },
        { key: "phone", label: "Téléphone" },
        { key: "whatsappOptIn", label: "WhatsApp", format: (value: boolean) => value ? "Oui" : "Non" }
      ]
    },
    {
      title: "Informations complémentaires",
      fields: [
        { key: "additionalComments", label: "Commentaires", format: (value: string) => value || "Aucun" }
      ]
    }
  ]
};

// 🎯 Configuration complète du preset de nettoyage (maintenant hérite du global)
export const CleaningPreset: PresetConfig = {
  form: {
    title: "Devis Service de Nettoyage",
    description: "Obtenez un devis personnalisé pour votre service de nettoyage",
    serviceType: "cleaning",
    // 📋 Utilise les nouveaux champs partagés
    fields: cleaningSharedFields,
    // 🌍 Hérite du preset global SANS override des couleurs (uniformité iOS 18)
    globalConfig: mergeWithGlobalPreset({
      // ✅ SUPPRIMÉ: Plus d'override des couleurs pour uniformité
      // appearance: { primaryColor: '#10B981', secondaryColor: '#059669' },
      layout: {
        type: 'two-column',           // 2 colonnes pour les détails du nettoyage
        sidebar: true,
        mobileFixedHeader: true
      },
      uiElements: {
        showServiceIcon: true,
        stickyHeader: true,
        submitButtonStyle: 'filled',
        headerAppearance: 'normal'    // Header normal pour le nettoyage
      },
      interactions: {
        hoverEffects: true,           // Effets au survol pour interactivité
        tapEffects: true
      },
      metadata: {
        compatibleWith: 'Nettoyage Professionnel'
      }
    })
  },
  defaultValues: cleaningDefaultValues,
  summary: cleaningSummaryConfig,
  styles: cleaningStyles, // 🎨 Conserve les styles CSS spécifiques au nettoyage
  meta: {
    industry: "cleaning",
    name: "Service de Nettoyage Premium",
    description: "Preset complet pour les formulaires de nettoyage professionnel (hérite du global)",
    version: "2.0.0"  // Incrémenté pour indiquer la migration
  }
}; 