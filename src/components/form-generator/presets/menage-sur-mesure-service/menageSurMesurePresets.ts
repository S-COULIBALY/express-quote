import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";
import { createServiceValidation } from "../_shared/sharedValidation";

// 📝 Valeurs par défaut pour les formulaires de ménage sur mesure
export const menageSurMesureDefaultValues = {
  // Planification
  scheduledDate: "",
  location: "",
  horaire: "",

  // Lieu d'intervention
  floor: "",
  elevator: "",

  // Surface & Dimensions
  surface: "",
  roomCount: "",
  housingType: "",
  ceilingHeight: "",

  // Type de Nettoyage
  cleaningType: "",
  frequency: "",
  cleaningLevel: "",
  accessConstraints: [],

  // Configuration
  duration: "",
  workers: "",

  // Spécificités
  additionalInfo: ""
};

// 🎨 Styles CSS
export const menageSurMesureStyles = "";

// 📋 Configuration du formulaire
export const menageSurMesureForm = {
  fields: [
    // Planification
    {
      name: "scheduledDate",
      type: "date",
      label: "Date souhaitée",
      required: true,
      min: new Date().toISOString().split('T')[0]
    },
    {
      name: "horaire",
      type: "select",
      label: "Horaire de RDV",
      required: true,
      options: [
        { value: "matin", label: "Matin - 6h" },
        { value: "matin", label: "Matin - 8h" },
        { value: "apres-midi", label: "Après-midi - 13h" },
        { value: "soirée", label: "soirée - 18h" },
        { value: "flexible", label: "Flexible - selon disponibilité" }
      ]
    },
    {
      name: "location",
      type: "address-pickup",
      label: "Adresse",
      required: true
    },

    // Lieu d'intervention
    {
      name: "floor",
      type: "select",
      label: "Étage",
      required: true,
      options: [
        { value: "-1", label: "Sous-sol" },
        { value: "0", label: "RDC" },
        { value: "1", label: "1er étage" },
        { value: "2", label: "2ème étage" },
        { value: "3", label: "3ème étage" },
        { value: "4", label: "4ème étage" },
        { value: "5", label: "5ème étage" },
        { value: "6", label: "6ème étage" },
        { value: "7", label: "7ème étage" },
        { value: "8", label: "8ème étage" },
        { value: "9", label: "9ème étage" },
        { value: "10+", label: "10ème étage et plus" }
      ]
    },
    {
      name: "elevator",
      type: "select",
      label: "Ascenseur",
      required: true,
      options: [
        { value: "no", label: "Aucun" },
        { value: "small", label: "Petit (1-3 pers)" },
        { value: "medium", label: "Moyen (3-6 pers)" },
        { value: "large", label: "Grand (+6 pers)" }
      ]
    },

    // Surface & Dimensions
    {
      name: "surface",
      type: "number",
      label: "Surface totale (m²)",
      required: true,
      min: 1
    },
    {
      name: "roomCount",
      type: "number",
      label: "Nombre de pièces",
      required: true,
      min: 1
    },
    {
      name: "housingType",
      type: "select",
      label: "Type de logement",
      required: true,
      options: [
        { value: "apartment", label: "Appartement" },
        { value: "house", label: "Maison" },
        { value: "office", label: "Bureau" },
        { value: "commercial", label: "Local commercial" },
        { value: "other", label: "Autre" }
      ]
    },
    {
      name: "ceilingHeight",
      type: "select",
      label: "Hauteur sous plafond",
      required: true,
      options: [
        { value: "standard", label: "Standard (2.5-3m)" },
        { value: "high", label: "Élevé (3-4m)" },
        { value: "very-high", label: "Très élevé (4m+)" }
      ]
    },

    // Type de Nettoyage
    {
      name: "cleaningType",
      type: "select",
      label: "Type de service",
      required: true,
      options: [
        { value: "maintenance", label: "Entretien régulier" },
        { value: "deep-cleaning", label: "Nettoyage approfondi" },
        { value: "post-construction", label: "Fin de chantier" },
        { value: "moving", label: "Avant/après déménagement" },
        { value: "spring-cleaning", label: "Grand nettoyage" },
        { value: "commercial", label: "Nettoyage commercial" },
        { value: "other", label: "Autre" }
      ]
    },
    {
      name: "frequency",
      type: "select",
      label: "Fréquence souhaitée",
      required: true,
      options: [
        { value: "one-time", label: "Ponctuel" },
        { value: "weekly", label: "Hebdomadaire" },
        { value: "bi-weekly", label: "Bi-hebdomadaire" },
        { value: "monthly", label: "Mensuel" },
        { value: "quarterly", label: "Trimestriel" }
      ]
    },
    {
      name: "cleaningLevel",
      type: "select",
      label: "Niveau de nettoyage",
      required: true,
      options: [
        { value: "standard", label: "Standard" },
        { value: "thorough", label: "Approfondi" },
        { value: "premium", label: "Premium" }
      ]
    },
    {
      name: "accessConstraints",
      type: "access-constraints",
      label: "Spécificités",
      required: false
    },

    // Configuration
    {
      name: "duration",
      type: "number",
      label: "Durée (en heures)",
      required: true,
      min: 1
    },
    {
      name: "workers",
      type: "number",
      label: "Nombre de professionnels",
      required: true,
      min: 1
    },

    // Spécificités
    {
      name: "additionalInfo",
      type: "textarea",
      label: "Informations supplémentaires",
      required: false,
      placeholder: "Précisez vos besoins spécifiques, vos coordonnées et détaillez les contraintes sélectionnées si nécessaire"
    },
    {
      name: "whatsappOptIn",
      type: "whatsapp-consent",
      label: "Notifications WhatsApp",
      required: false
    }
  ]
};

// 📋 Configuration du résumé
export const menageSurMesureSummaryConfig: FormSummaryConfig = {
  title: "Résumé de votre demande de ménage sur mesure",
  sections: [
    {
      title: "Planification",
      fields: [
        { key: "scheduledDate", label: "Date souhaitée" },
        { key: "location", label: "Adresse" },
        { key: "horaire", label: "Horaire de RDV" }
      ]
    },
    {
      title: "Lieu d'intervention",
      fields: [
        { key: "floor", label: "Étage" },
        { key: "elevator", label: "Ascenseur" }
      ]
    },
    {
      title: "Surface & Configuration",
      fields: [
        { key: "surface", label: "Surface", suffix: " m²" },
        { key: "roomCount", label: "Nombre de pièces" },
        { key: "housingType", label: "Type de logement" }
      ]
    },
    {
      title: "Type de Nettoyage",
      fields: [
        { key: "cleaningType", label: "Type de service" },
        { key: "frequency", label: "Fréquence" },
        { key: "cleaningLevel", label: "Niveau de nettoyage" }
      ]
    },
    {
      title: "Configuration du service",
      fields: [
        { key: "duration", label: "Durée", suffix: " heure(s)" },
        { key: "workers", label: "Nombre de professionnels" }
      ]
    }
  ]
};

// 🎯 Preset complet
export const MenageSurMesurePreset: PresetConfig = {
  form: menageSurMesureForm,
  defaultValues: menageSurMesureDefaultValues,
  meta: {
    title: "Ménage Sur Mesure",
    description: "Service de nettoyage personnalisé selon vos besoins",
    icon: "sparkles",
    color: "#27AE60"
  },
  validation: createServiceValidation('menage-sur-mesure'),
  summary: menageSurMesureSummaryConfig,
  styles: menageSurMesureStyles
};

// Export par défaut
export default MenageSurMesurePreset; 