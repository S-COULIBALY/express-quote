import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";
import { contactFields, commentsField } from "../_shared/sharedFields";
import { emailValidation, phoneValidation } from "../_shared/sharedValidation";

// 📝 Valeurs par défaut pour les formulaires de contact
export const contactDefaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  subject: "",
  message: "",
  newsletter: false,
  urgency: "medium",
  preferredContact: "email"
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const contactStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Champs contact avec nouveaux champs partagés
export const contactSharedFields = [
  // Informations personnelles
  {
    name: 'firstName',
    label: 'Prénom',
    type: 'text' as const,
    required: true,
    placeholder: 'Votre prénom'
  },
  {
    name: 'lastName',
    label: 'Nom',
    type: 'text' as const,
    required: true,
    placeholder: 'Votre nom'
  },
  
  // Contact - utilise les champs partagés
  contactFields.email,
  contactFields.phone,
  
  // Informations complémentaires
  {
    name: 'company',
    label: 'Entreprise (optionnel)',
    type: 'text' as const,
    required: false,
    placeholder: 'Nom de votre entreprise'
  },
  {
    name: 'subject',
    label: 'Sujet',
    type: 'select' as const,
    required: true,
    options: [
      { label: 'Demande de devis', value: 'quote' },
      { label: 'Question générale', value: 'general' },
      { label: 'Support technique', value: 'support' },
      { label: 'Réclamation', value: 'complaint' },
      { label: 'Partenariat', value: 'partnership' },
      { label: 'Autre', value: 'other' }
    ]
  },
  {
    name: 'urgency',
    label: 'Urgence',
    type: 'radio' as const,
    options: [
      { label: 'Faible', value: 'low' },
      { label: 'Moyenne', value: 'medium' },
      { label: 'Élevée', value: 'high' }
    ],
    defaultValue: 'medium',
    required: true
  },
  {
    name: 'preferredContact',
    label: 'Mode de contact préféré',
    type: 'radio' as const,
    options: [
      { label: 'Email', value: 'email' },
      { label: 'Téléphone', value: 'phone' },
      { label: 'WhatsApp', value: 'whatsapp' }
    ],
    defaultValue: 'email',
    required: true
  },
  
  // Message - utilise le champ partagé
  {
    ...commentsField,
    name: 'message',
    label: 'Message',
    required: true,
    placeholder: 'Décrivez votre demande en détail...'
  },
  
  // Newsletter
  {
    name: 'newsletter',
    label: 'Je souhaite recevoir la newsletter',
    type: 'checkbox' as const,
    options: [
      { label: 'Oui, tenez-moi informé des nouveautés', value: 'yes' }
    ]
  }
];

// 📋 Configuration du récapitulatif pour les contacts
export const contactSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif du Contact",
  sections: [
    {
      title: "Informations personnelles",
      icon: "👤",
      fields: [
        {
          key: "firstName",
          label: "Prénom",
          condition: (value: any) => !!value
        },
        {
          key: "lastName",
          label: "Nom",
          condition: (value: any) => !!value
        },
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
          key: "company",
          label: "Entreprise",
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Votre demande",
      icon: "💬",
      fields: [
        {
          key: "subject",
          label: "Sujet",
          format: (value: any) => {
            const subjects: Record<string, string> = {
              'general': 'Question générale',
              'quote': 'Demande de devis',
              'support': 'Support technique',
              'partnership': 'Partenariat',
              'other': 'Autre'
            };
            return subjects[value] || value;
          }
        },
        {
          key: "urgency",
          label: "Urgence",
          format: (value: any) => {
            const urgencies: Record<string, string> = {
              'low': 'Non urgent',
              'medium': 'Modéré',
              'high': 'Urgent'
            };
            return urgencies[value] || value;
          },
          style: "text-xs text-gray-500"
        },
        {
          key: "message",
          label: "Message",
          format: (value: any) => value?.length > 100 ? `${value.substring(0, 100)}...` : value,
          condition: (value: any) => !!value
        }
      ]
    },
    {
      title: "Préférences",
      icon: "📧",
      fields: [
        {
          key: "preferredContact",
          label: "Contact préféré",
          format: (value: any) => {
            const contacts: Record<string, string> = {
              'email': 'Email',
              'phone': 'Téléphone',
              'whatsapp': 'WhatsApp'
            };
            return contacts[value] || value;
          }
        },
        {
          key: "newsletter",
          label: "Newsletter",
          format: (value: any) => value ? "Souscrite" : "Non souscrite",
          style: "text-xs text-gray-500"
        }
      ]
    }
  ]
};

// 🎯 Configuration complète du preset Contact (maintenant hérite du global)
export const ContactPreset: PresetConfig = {
  form: {
    title: "Nous Contacter",
    description: "Remplissez ce formulaire et nous vous répondrons rapidement",
    serviceType: "general",
    // 🌍 Hérite du preset global avec customisations spécifiques aux formulaires de contact
    globalConfig: mergeWithGlobalPreset({
      appearance: {
        primaryColor: '#3B82F6',      // Bleu professionnel pour contact
        secondaryColor: '#1D4ED8',
        borderRadius: 12              // Coins modérément arrondis pour sérieux
      },
      layout: {
        type: 'single-column',        // Une seule colonne pour simplicité
        sidebar: false,               // Pas de sidebar pour contact
        showSteps: false,
        labelPosition: 'top',
        mobile: {
          singleColumn: true,
          optionDisplay: 'list'       // Liste simple pour les options
        }
      },
      uiElements: {
        showServiceIcon: false,       // Pas d'icône service pour contact générique
        stickyHeader: false,          // Header simple pour contact
        submitButtonStyle: 'filled',  // Bouton rempli pour CTA clair
        headerAppearance: 'normal',   // Header normal, professionnel
        showBreadcrumbs: false,       // Pas de breadcrumbs pour contact simple
        showBackButton: false,        // Pas de bouton retour nécessaire
        confirmationOnSubmit: true    // Confirmation importante pour contact
      },
      interactions: {
        hoverEffects: true,
        tapEffects: true,
        livePreview: false,           // Pas de preview pour contact
        autosave: false               // Pas d'autosave pour contact
      },
      validation: {
        mode: 'onBlur',
        showInlineErrors: true,       // Important pour validation email/téléphone
        highlightInvalidFields: true,
        errorSummaryAtTop: false      // Erreurs inline suffisantes
      },
      accessibility: {
        keyboardNavigation: true,     // Important pour accessibilité contact
        focusRing: true,
        screenReaderSupport: true,
        ariaLabels: true
      },
      metadata: {
        compatibleWith: 'Formulaires de Contact'
      }
    }),
    // 📋 Sections du formulaire (récupérées de l'exemple)
    sections: [
      {
        title: "👤 Informations personnelles",
        fields: [
          {
            name: "firstName",
            type: "text",
            label: "Prénom",
            required: true
          },
          {
            name: "lastName",
            type: "text",
            label: "Nom",
            required: true
          },
          {
            name: "email",
            type: "email",
            label: "Email",
            required: true
          },
          {
            name: "phone",
            type: "text",
            label: "Téléphone"
          },
          {
            name: "company",
            type: "text",
            label: "Entreprise"
          }
        ]
      },
      {
        title: "💬 Votre demande",
        fields: [
          {
            name: "subject",
            type: "select",
            label: "Sujet",
            required: true,
            options: [
              { value: "general", label: "Question générale" },
              { value: "quote", label: "Demande de devis" },
              { value: "support", label: "Support technique" },
              { value: "partnership", label: "Partenariat" },
              { value: "other", label: "Autre" }
            ]
          },
          {
            name: "urgency",
            type: "radio",
            label: "Niveau d'urgence",
            options: [
              { value: "low", label: "Non urgent" },
              { value: "medium", label: "Modéré" },
              { value: "high", label: "Urgent" }
            ]
          },
          {
            name: "message",
            type: "textarea",
            label: "Votre message",
            required: true,
            columnSpan: 2,
            componentProps: {
              rows: 4,
              placeholder: "Décrivez votre demande en détail..."
            }
          }
        ]
      },
      {
        title: "📧 Préférences de contact",
        fields: [
          {
            name: "preferredContact",
            type: "select",
            label: "Moyen de contact préféré",
            options: [
              { value: "email", label: "Email" },
              { value: "phone", label: "Téléphone" },
              { value: "whatsapp", label: "WhatsApp" }
            ]
          },
          {
            name: "newsletter",
            type: "checkbox",
            label: "Je souhaite recevoir la newsletter"
          }
        ]
      }
    ]
  },
  defaultValues: contactDefaultValues,
  summary: contactSummaryConfig,
  styles: contactStyles,
  meta: {
    industry: "contact",
    name: "Contact",
    description: "Preset complet pour les formulaires de contact (hérite du global)",
    version: "2.0.0"  // Incrémenté pour indiquer la migration
  }
}; 