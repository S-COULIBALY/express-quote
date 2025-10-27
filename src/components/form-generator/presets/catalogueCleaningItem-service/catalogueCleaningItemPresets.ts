import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";

// 📝 Valeurs par défaut pour les formulaires de services
export const catalogueCleaningItemDefaultValues = {
  // Planification
  scheduledDate: '',
  horaire: '',
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
export const catalogueCleaningItemStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Configuration du récapitulatif pour les services
export const catalogueCleaningItemSummaryConfig: FormSummaryConfig = {
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

// 🎯 Configuration complète du preset Service (maintenant hérite du global)
export const CatalogueCleaningItemPreset: PresetConfig = {
  form: {
    title: "Réservation Service",
    description: "Configurez votre service sur mesure",
    serviceType: "general",
    // 🌍 Hérite du preset global SANS override des couleurs (uniformité iOS 18)
    globalConfig: mergeWithGlobalPreset({
      // ✅ SUPPRIMÉ: Plus d'override des couleurs pour uniformité
      // appearance: { primaryColor: '#059669', secondaryColor: '#047857' },
      layout: {
        type: 'two-column',           // 2 colonnes pour les détails du service
        sidebar: true,
        mobileFixedHeader: true,
        mobile: {
          singleColumn: true,
          optionDisplay: 'list'       // Liste simple pour les services
        }
      },
      uiElements: {
        showServiceIcon: true,
        stickyHeader: true,
        submitButtonStyle: 'filled',  // Bouton rempli pour action principale
        headerAppearance: 'normal',
        showBreadcrumbs: false        // Pas de breadcrumbs pour les services simples
      },
      interactions: {
        hoverEffects: true,
        tapEffects: true,
        livePreview: false            // Pas de preview live pour les services
      },
      metadata: {
        compatibleWith: 'Services de Nettoyage Catalogue'
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
        title: "📍 Localisation",
        fields: [
          {
            name: "location",
            type: "text",
            label: "Adresse du service",
            required: true
          }
        ]
      },
      {
        title: "⚙️ Configuration du service",
        fields: [
          {
            name: "duration",
            type: "select",
            label: "Durée (en heures)",
            required: true,
            options: [
              { value: '1', label: '1 heure' },
              { value: '2', label: '2 heures' },
              { value: '3', label: '3 heures' },
              { value: '4', label: '4 heures' },
              { value: '5', label: '5 heures' },
              { value: '6', label: '6 heures' },
              { value: '8', label: '8 heures' }
            ]
          },
          {
            name: "workers",
            type: "select",
            label: "Nombre de professionnels",
            required: true,
            options: [
              { value: '1', label: '1 professionnel' },
              { value: '2', label: '2 professionnels' },
              { value: '3', label: '3 professionnels' },
              { value: '4', label: '4 professionnels' }
            ]
          }
        ]
      },
      {
        title: "🎯 Spécificités",
        fields: [
          {
            name: "serviceConstraints",
            type: "service-constraints",
            label: "Contraintes spécifiques",
            columnSpan: 2,
            componentProps: {
              buttonLabel: "Ajouter des contraintes spécifiques à ce service",
              modalTitle: "Contraintes spécifiques au service",
              showSelectedCount: true
            }
          },
          {
            name: "additionalInfo",
            type: "textarea",
            label: "Informations supplémentaires",
            columnSpan: 2,
            componentProps: {
              rows: 3,
              placeholder: "Précisez vos besoins spécifiques, vos coordonnées et détaillez les contraintes sélectionnées si nécessaire"
            }
          }
        ]
      },
      {
        title: "📱 Notifications",
        fields: [
          {
            name: "whatsappOptIn",
            type: "whatsapp-consent",
            label: "Notifications WhatsApp",
            columnSpan: 2,
            componentProps: {
              description: "Recevez des notifications sur l'avancement de votre service par WhatsApp"
            }
          }
        ]
      }
    ]
  },
  defaultValues: catalogueCleaningItemDefaultValues,
  summary: catalogueCleaningItemSummaryConfig,
  styles: catalogueCleaningItemStyles,
  meta: {
    industry: "catalogueCleaningItem",  // Mise à jour pour correspondre au type
    name: "Service Professionnel",
    description: "Preset complet pour les formulaires de réservation de services (hérite du global)",
    version: "2.0.0"  // Incrémenté pour indiquer la migration
  }
}; 