import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";

// 📝 Valeurs par défaut pour les formulaires de livraison
export const catalogueDeliveryItemDefaultValues = {
  // Planning et Service
  scheduledDate: "",
  deliveryType: "standard",
  
  // Objet à livrer
  packageType: "colis",
  weight: "",
  isFragile: false,
  
  // Adresse de récupération
  pickupAddress: "",
  pickupTime: "",
  pickupFloor: "",
  pickupElevator: "",
  pickupLogisticsConstraints: [],
  
  // Adresse de livraison
  deliveryAddress: "",
  deliveryTime: "",
  deliveryFloor: "",
  deliveryElevator: "",
  deliveryLogisticsConstraints: [],
  
  // Informations supplémentaires
  additionalInfo: ""
};

// 🎨 Styles CSS
export const catalogueDeliveryItemStyles = "";

// 📋 Configuration du formulaire
export const catalogueDeliveryItemForm = {
  fields: [
    // Planning et Service
    {
      name: "scheduledDate",
      type: "date" as const,
      label: "Date de livraison",
      required: true,
      min: new Date().toISOString().split('T')[0]
    },
    {
      name: "deliveryType",
      type: "select" as const,
      label: "Type de livraison",
      required: true,
      options: [
        { value: "standard", label: "Standard" },
        { value: "express", label: "Express" },
        { value: "urgent", label: "Urgent" }
      ]
    },

    // Objet à livrer
    {
      name: "packageType",
      type: "select" as const,
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
      type: "number" as const,
      label: "Poids (kg)",
      required: true,
      min: 0.1,
      max: 1000
    },
    {
      name: "isFragile",
      type: "checkbox" as const,
      label: "Objet fragile",
      required: false
    },

    // Adresse de récupération
    {
      name: "pickupAddress",
      type: "address-pickup" as const,
      label: "Adresse de récupération",
      required: true
    },
    {
      name: "pickupTime",
      type: "text" as const,
      label: "Heure d'enlèvement",
      required: true
    },
    {
      name: "pickupFloor",
      type: "select" as const,
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
      type: "select" as const,
      label: "Ascenseur",
      options: [
        { value: "yes", label: "Oui" },
        { value: "no", label: "Non" }
      ]
    },
    {
      name: "pickupLogisticsConstraints",
      type: "access-constraints" as const,
      label: "Spécificités Enlèvement",
      required: false
    },

    // Adresse de livraison
    {
      name: "deliveryAddress",
      type: "address-delivery" as const,
      label: "Adresse de livraison",
      required: true
    },
    {
      name: "deliveryTime",
      type: "text" as const,
      label: "Heure de livraison",
      required: true
    },
    {
      name: "deliveryFloor",
      type: "select" as const,
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
      type: "select" as const,
      label: "Ascenseur",
      options: [
        { value: "yes", label: "Oui" },
        { value: "no", label: "Non" }
      ]
    },
    {
      name: "deliveryLogisticsConstraints",
      type: "access-constraints" as const,
      label: "Spécificités Livraison",
      required: false
    },

    // Informations supplémentaires
    {
      name: "additionalInfo",
      type: "textarea" as const,
      label: "Informations supplémentaires",
      required: false,
      placeholder: "Instructions spéciales, contraintes d'accès, horaires préférés..."
    },
    {
      name: "whatsappOptIn",
      type: "whatsapp-consent" as const,
      label: "Notifications WhatsApp",
      required: false
    }
  ]
};

// 📋 Configuration du résumé
export const catalogueDeliveryItemSummaryConfig: FormSummaryConfig = {
  title: "Résumé de votre demande de livraison",
  sections: [
    {
      title: "Planning et Service",
      fields: [
        { key: "scheduledDate", label: "Date de livraison" },
        { key: "deliveryType", label: "Type de livraison" }
      ]
    },
    {
      title: "Objet à livrer",
      fields: [
        { key: "packageType", label: "Type de colis" },
        { key: "weight", label: "Poids" },
        { key: "isFragile", label: "Objet fragile" }
      ]
    },
    {
      title: "Récupération",
      fields: [
        { key: "pickupAddress", label: "Adresse de récupération" },
        { key: "pickupTime", label: "Heure d'enlèvement" },
        { key: "pickupFloor", label: "Étage" }
      ]
    },
    {
      title: "Livraison",
      fields: [
        { key: "deliveryAddress", label: "Adresse de livraison" },
        { key: "deliveryTime", label: "Heure de livraison" },
        { key: "deliveryFloor", label: "Étage" }
      ]
    }
  ]
};

// 🎯 Preset complet
export const CatalogueDeliveryItemPreset: PresetConfig = {
  form: catalogueDeliveryItemForm,
  defaultValues: catalogueDeliveryItemDefaultValues,
  meta: {
    name: "Livraison",
    description: "Service de livraison personnalisé selon vos besoins",
    industry: "logistics",
    version: "1.0.0"
  },
  summary: catalogueDeliveryItemSummaryConfig,
  styles: catalogueDeliveryItemStyles
};

// Export par défaut
export default CatalogueDeliveryItemPreset;