import { PresetConfig, FormSummaryConfig } from "../../types";

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

// 🎯 Configuration complète du preset Contact
export const ContactPreset: PresetConfig = {
  form: {
    title: "Nous Contacter",
    description: "Remplissez ce formulaire et nous vous répondrons rapidement",
    serviceType: "general"
  },
  defaultValues: contactDefaultValues,
  summary: contactSummaryConfig,
  styles: contactStyles,
  meta: {
    industry: "contact",
    name: "Contact",
    description: "Preset complet pour les formulaires de contact",
    version: "1.0.0"
  }
}; 