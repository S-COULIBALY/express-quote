import { PresetConfig, FormSummaryConfig } from "../../types";

// 📝 Valeurs par défaut pour les formulaires de services
export const serviceDefaultValues = {
  // Planification
  scheduledDate: '',
  location: '',
  
  // Configuration du service
  duration: '',
  workers: '',
  
  // Spécificités
  serviceConstraints: [],
  
  // Contact et notifications
  whatsappOptIn: false,
  
  // Commentaires
  additionalInfo: ''
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const serviceStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Configuration du récapitulatif pour les services
export const serviceSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif du Service",
  sections: [
    {
      title: "Service Sélectionné",
      icon: "🏠",
      fields: [
        {
          key: "serviceName",
          label: "Service",
          format: (value: any, formData: any) => formData.serviceName || "Service personnalisé"
        },
        {
          key: "serviceDescription", 
          label: "Description",
          format: (value: any, formData: any) => formData.serviceDescription || "",
          condition: (value: any, formData: any) => !!formData.serviceDescription
        },
        {
          key: "duration",
          label: "Durée",
          format: (value: any) => value ? `${value} heure${value > 1 ? 's' : ''}` : "",
          condition: (value: any) => !!value
        },
        {
          key: "workers",
          label: "Équipe",
          format: (value: any) => value ? `${value} professionnel${value > 1 ? 's' : ''}` : "",
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
        },
        {
          key: "location",
          label: "Adresse",
          condition: (value: any) => !!value,
          style: "text-purple-600 text-sm"
        }
      ]
    },
    {
      title: "Spécificités",
      icon: "🎯",
      fields: [
        {
          key: "serviceConstraints",
          label: "Contraintes spécifiques",
          format: (value: any) => {
            if (!value || !Array.isArray(value) || value.length === 0) {
              return "Aucune contrainte spécifique";
            }
            return `${value.length} contrainte${value.length > 1 ? 's' : ''} sélectionnée${value.length > 1 ? 's' : ''}`;
          },
          style: "text-xs text-teal-600"
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

// 🎯 Configuration complète du preset Service
export const ServicePreset: PresetConfig = {
  form: {
    title: "Réservation Service",
    description: "Configurez votre service sur mesure",
    serviceType: "general"
  },
  defaultValues: serviceDefaultValues,
  summary: serviceSummaryConfig,
  styles: serviceStyles,
  meta: {
    industry: "service",
    name: "Service Professionnel",
    description: "Preset complet pour les formulaires de réservation de services",
    version: "1.0.0"
  }
}; 