import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "./globalPreset";
import { contactFields, commentsField, commonFieldCollections } from "./sharedFields";
import { emailValidation, phoneValidation } from "./sharedValidation";

// 📝 Valeurs par défaut génériques
export const defaultValues = {
  email: "",
  phone: "",
  message: "",
  consent: false
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const defaultStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Champs par défaut avec nouveaux champs partagés
export const defaultSharedFields = [
  // Contact basique
  contactFields.email,
  contactFields.phone,
  
  // Message
  {
    ...commentsField,
    name: 'message',
    label: 'Message',
    required: true,
    placeholder: 'Votre message...'
  },
  
  // Consentement
  {
    name: 'consent',
    label: 'Consentement',
    type: 'checkbox' as const,
    options: [
      { label: 'J\'accepte les conditions d\'utilisation', value: 'accepted' }
    ],
    required: true
  }
];

// 📋 Configuration du récapitulatif par défaut
export const defaultSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif",
  sections: [
    {
      title: "Informations",
      icon: "📝",
      fields: [
        {
          key: "email",
          label: "Email",
          condition: (value: any) => !!value
        },
        {
          key: "phone",
          label: "Téléphone",
          condition: (value: any) => !!value
        },
        {
          key: "message",
          label: "Message",
          condition: (value: any) => !!value
        }
      ]
    }
  ]
};

// 🎯 Configuration complète du preset par défaut (maintenant hérite du global)
export const DefaultPreset: PresetConfig = {
  form: {
    title: "Formulaire",
    description: "Veuillez remplir les champs ci-dessous",
    serviceType: "general",
    // 🌍 Hérite du preset global avec config par défaut neutre
    globalConfig: mergeWithGlobalPreset({
      appearance: {
        primaryColor: '#6B7280',  // Gris neutre pour le preset par défaut
        secondaryColor: '#4B5563'
      },
      layout: {
        type: 'single-column',    // Simple pour le preset par défaut
        sidebar: false
      },
      uiElements: {
        showServiceIcon: false,   // Pas d'icône pour le preset générique
        showBreadcrumbs: false
      }
    })
  },
  defaultValues: defaultValues,
  summary: defaultSummaryConfig,
  styles: defaultStyles,
  meta: {
    industry: "default",
    name: "Générique",
    description: "Preset par défaut pour tous types de formulaires (hérite du global)",
    version: "2.0.0"  // Incrémenté pour indiquer la migration
  }
}; 