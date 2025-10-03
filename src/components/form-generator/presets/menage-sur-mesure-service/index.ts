import { FormConfig } from '../../types';
import { CatalogueCleaningItem } from '@/types/booking';

export interface MenageSurMesureServicePresetOptions {
  service: CatalogueCleaningItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getMenageSurMesureServiceConfig = (options: MenageSurMesureServicePresetOptions): FormConfig => {
  const { service, onPriceCalculated, onSubmitSuccess, onError, editMode, sessionStorageKey } = options;

  // Auto-détection des valeurs par défaut depuis sessionStorage si en mode édition
  const getDefaultValues = () => {
    if (editMode && sessionStorageKey && typeof window !== 'undefined') {
      const storedData = window.sessionStorage.getItem(sessionStorageKey);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          window.sessionStorage.removeItem(sessionStorageKey);
          return parsedData;
        } catch (error) {
          console.error('Erreur lors du parsing des données stockées:', error);
        }
      }
    }
    
    return {
      // Informations générales
      typeLieu: '',
      surface: '',
      nombrePieces: '',
      etage: '0',
      ascenseur: false,
      
      // Types de nettoyage
      nettoyageGeneral: false,
      nettoyageProfond: false,
      nettoyageVitres: false,
      nettoyageSols: false,
      nettoyageSalleBain: false,
      nettoyageCuisine: false,
      nettoyageMeubles: false,
      nettoyageElectromenager: false,
      nettoyageExterieur: false,
      
      // Fréquence et planification
      typeFrequence: '',
      datePremierNettoyage: '',
      horaireSouhaite: '',
      dureeEstimee: '',
      
      // Produits et équipements
      produitsFournis: false,
      produitsEcologiques: false,
      equipementsSpecifiques: [],
      preferencesProduits: '',
      
      // Contraintes et accès
      acces: '',
      parking: false,
      contraintesHoraires: '',
      presenceRequise: false,
      
      // Contact
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      commentaires: '',
      
      // Ajouter les données du service au contexte
      serviceName: service.name,
      serviceDescription: service.description,
      basePrice: service.price,
      defaultPrice: service.price
    };
  };

  const config: FormConfig = {
    title: `Réserver votre ménage sur mesure ${service.name}`,
    description: "Personnalisez votre nettoyage selon vos besoins",
    serviceType: "cleaning",
    customDefaults: getDefaultValues(),
    
    layout: {
      type: "sidebar",
      // Nouvelles fonctionnalités du SidebarLayout amélioré
      showPriceCalculation: true,
      showConstraintsByAddress: true,
      showModificationsSummary: true,
      initialPrice: service.price || 0,
      serviceInfo: {
        name: service.name,
        description: service.description,
        icon: "🧹",
        features: service.includes || [
          "Service personnalisé",
          "Devis adapté à vos besoins",
          "Équipe professionnelle",
          "Produits écologiques disponibles",
          "Assurance responsabilité civile"
        ]
      },
      summaryConfig: {
        title: service.name,
        sections: [
          // Section Service enrichie avec les données dynamiques
          {
            title: "Service",
            icon: "🧹",
            fields: [
              { key: "serviceName", label: "Service sélectionné", format: () => service.name },
              { key: "serviceDescription", label: "Description", format: () => service.description },
              { 
                key: "typeLieu", 
                label: "Type de lieu", 
                format: (value: any) => value || "À définir",
                style: "font-medium text-gray-700"
              },
              { 
                key: "surface", 
                label: "Surface", 
                format: (value: any) => value ? `${value} m²` : "À définir",
                style: "font-medium text-gray-700"
              }
            ]
          },
          // Section Planification
          {
            title: "Planification",
            icon: "📅",
            fields: [
              { key: "datePremierNettoyage", label: "Date du premier nettoyage", format: (value: any) => value || "À définir" },
              { key: "horaireSouhaite", label: "Horaire souhaité", format: (value: any) => value || "À définir" },
              { key: "typeFrequence", label: "Fréquence", format: (value: any) => value || "À définir" },
              { key: "dureeEstimee", label: "Durée estimée", format: (value: any) => value || "À définir" }
            ]
          },
          // Section Services de nettoyage
          {
            title: "Services de nettoyage",
            icon: "🧽",
            fields: [
              { key: "nettoyageGeneral", label: "Nettoyage général", format: (value: any) => value ? "Oui" : "Non" },
              { key: "nettoyageProfond", label: "Nettoyage en profondeur", format: (value: any) => value ? "Oui" : "Non" },
              { key: "nettoyageVitres", label: "Nettoyage des vitres", format: (value: any) => value ? "Oui" : "Non" },
              { key: "nettoyageSols", label: "Nettoyage des sols", format: (value: any) => value ? "Oui" : "Non" },
              { key: "nettoyageSalleBain", label: "Nettoyage salle de bain", format: (value: any) => value ? "Oui" : "Non" },
              { key: "nettoyageCuisine", label: "Nettoyage cuisine", format: (value: any) => value ? "Oui" : "Non" }
            ]
          },
          // Section Produits et équipements
          {
            title: "Produits et équipements",
            icon: "🧴",
            fields: [
              { key: "produitsFournis", label: "Produits fournis", format: (value: any) => value ? "Oui" : "Non" },
              { key: "produitsEcologiques", label: "Produits écologiques", format: (value: any) => value ? "Oui" : "Non" },
              { key: "equipementsSpecifiques", label: "Équipements spécifiques", format: (value: any) => value?.length > 0 ? value.join(', ') : "Aucun" }
            ]
          },
          // Section Prix dynamique
          {
            title: "Prix",
            icon: "💰",
            fields: [
              { key: "basePrice", label: "Prix de base", format: () => "Sur devis" },
              { 
                key: "totalPrice", 
                label: "Total estimé", 
                format: () => "Calcul en cours...", // Sera mis à jour dynamiquement
                style: "font-bold text-emerald-600"
              }
            ]
          }
        ]
      }
    },

    sections: [
      {
        title: "🏠 Informations générales",
        columns: 2,
        fields: [
          {
            name: "typeLieu",
            type: "select",
            label: "Type de lieu",
            required: true,
            options: [
              { value: "appartement", label: "Appartement" },
              { value: "maison", label: "Maison" },
              { value: "bureau", label: "Bureau" },
              { value: "commerce", label: "Commerce" },
              { value: "entrepot", label: "Entrepôt/Local" },
              { value: "autre", label: "Autre" }
            ]
          },
          {
            name: "surface",
            type: "number",
            label: "Surface à nettoyer (m²)",
            required: true,
            validation: {
              min: 1,
              max: 2000,
              custom: (value: any) => {
                if (!value || value <= 0) return "La surface doit être supérieure à 0";
                if (value > 2000) return "La surface ne peut pas dépasser 2000 m²";
                return true;
              }
            },
            componentProps: {
              min: 1,
              max: 2000,
              placeholder: "Ex: 120"
            }
          },
          {
            name: "nombrePieces",
            type: "number",
            label: "Nombre de pièces",
            required: true,
            validation: {
              min: 1,
              max: 50,
              custom: (value: any) => {
                if (!value || value <= 0) return "Le nombre de pièces doit être supérieur à 0";
                if (value > 50) return "Le nombre de pièces ne peut pas dépasser 50";
                return true;
              }
            },
            componentProps: {
              min: 1,
              max: 50,
              placeholder: "Ex: 6"
            }
          },
          {
            name: "etage",
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
            name: "ascenseur",
            type: "checkbox",
            label: "Ascenseur disponible",
            columnSpan: 2
          }
        ]
      },
      {
        title: "🧹 Types de nettoyage",
        columns: 2,
        fields: [
          {
            name: "nettoyageGeneral",
            type: "checkbox",
            label: "Nettoyage général",
            componentProps: {
              helpText: "Nettoyage de base des surfaces"
            }
          },
          {
            name: "nettoyageProfond",
            type: "checkbox",
            label: "Nettoyage en profondeur",
            componentProps: {
              helpText: "Nettoyage approfondi et dégraissage"
            }
          },
          {
            name: "nettoyageVitres",
            type: "checkbox",
            label: "Nettoyage des vitres",
            componentProps: {
              helpText: "Nettoyage des fenêtres et miroirs"
            }
          },
          {
            name: "nettoyageSols",
            type: "checkbox",
            label: "Nettoyage des sols",
            componentProps: {
              helpText: "Nettoyage et traitement des sols"
            }
          },
          {
            name: "nettoyageSalleBain",
            type: "checkbox",
            label: "Nettoyage salle de bain",
            componentProps: {
              helpText: "Nettoyage complet de la salle de bain"
            }
          },
          {
            name: "nettoyageCuisine",
            type: "checkbox",
            label: "Nettoyage cuisine",
            componentProps: {
              helpText: "Nettoyage complet de la cuisine"
            }
          },
          {
            name: "nettoyageMeubles",
            type: "checkbox",
            label: "Nettoyage des meubles",
            componentProps: {
              helpText: "Nettoyage et dépoussiérage des meubles"
            }
          },
          {
            name: "nettoyageElectromenager",
            type: "checkbox",
            label: "Nettoyage électroménager",
            componentProps: {
              helpText: "Nettoyage des appareils électroménagers"
            }
          },
          {
            name: "nettoyageExterieur",
            type: "checkbox",
            label: "Nettoyage extérieur",
            columnSpan: 2,
            componentProps: {
              helpText: "Nettoyage des espaces extérieurs"
            }
          }
        ]
      },
      {
        title: "📅 Fréquence et planification",
        columns: 2,
        fields: [
          {
            name: "typeFrequence",
            type: "select",
            label: "Type de fréquence",
            required: true,
            options: [
              { value: "ponctuel", label: "Ponctuel (une fois)" },
              { value: "hebdomadaire", label: "Hebdomadaire" },
              { value: "bi-hebdomadaire", label: "Bi-hebdomadaire" },
              { value: "mensuel", label: "Mensuel" },
              { value: "personnalise", label: "Personnalisé" }
            ]
          },
          {
            name: "datePremierNettoyage",
            type: "date",
            label: "Date du premier nettoyage",
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
            name: "horaireSouhaite",
            type: "select",
            label: "Horaire souhaité",
            required: true,
            options: [
              { value: "matin", label: "Matin (8h-12h)" },
              { value: "apres-midi", label: "Après-midi (13h-17h)" },
              { value: "soir", label: "Soir (18h-22h)" },
              { value: "flexible", label: "Flexible" }
            ]
          },
          {
            name: "dureeEstimee",
            type: "select",
            label: "Durée estimée",
            required: true,
            options: [
              { value: "1-2h", label: "1-2 heures" },
              { value: "2-4h", label: "2-4 heures" },
              { value: "4-6h", label: "4-6 heures" },
              { value: "6-8h", label: "6-8 heures" },
              { value: "plus-8h", label: "Plus de 8 heures" }
            ]
          }
        ]
      },
      {
        title: "🧴 Produits et équipements",
        columns: 2,
        fields: [
          {
            name: "produitsFournis",
            type: "checkbox",
            label: "Produits fournis par le prestataire",
            componentProps: {
              helpText: "Produits de nettoyage professionnels"
            }
          },
          {
            name: "produitsEcologiques",
            type: "checkbox",
            label: "Produits écologiques",
            componentProps: {
              helpText: "Produits respectueux de l'environnement"
            }
          },
          {
            name: "equipementsSpecifiques",
            type: "custom",
            label: "Équipements spécifiques",
            required: false,
            columnSpan: 2,
            componentProps: {
              type: "checkbox-group",
              options: [
                { value: "aspirateur", label: "Aspirateur" },
                { value: "balai-vapeur", label: "Balai vapeur" },
                { value: "monte-charge", label: "Monte-charge" },
                { value: "echelle", label: "Échelle" },
                { value: "autre", label: "Autre" }
              ]
            }
          },
          {
            name: "preferencesProduits",
            type: "textarea",
            label: "Préférences particulières",
            columnSpan: 2,
            componentProps: {
              rows: 3,
              placeholder: "Produits spécifiques, allergies, contraintes..."
            }
          }
        ]
      },
      {
        title: "🚪 Contraintes et accès",
        columns: 2,
        fields: [
          {
            name: "acces",
            type: "select",
            label: "Type d'accès",
            required: true,
            options: [
              { value: "libre", label: "Accès libre" },
              { value: "gardien", label: "Gardien/concierge" },
              { value: "interphone", label: "Interphone" },
              { value: "code", label: "Code d'accès" },
              { value: "autre", label: "Autre" }
            ]
          },
          {
            name: "parking",
            type: "checkbox",
            label: "Parking disponible",
            componentProps: {
              helpText: "Place de parking pour l'équipe"
            }
          },
          {
            name: "contraintesHoraires",
            type: "textarea",
            label: "Contraintes horaires",
            columnSpan: 2,
            componentProps: {
              rows: 2,
              placeholder: "Horaires d'accès, contraintes particulières..."
            }
          },
          {
            name: "presenceRequise",
            type: "checkbox",
            label: "Présence requise pendant le nettoyage",
            columnSpan: 2,
            componentProps: {
              helpText: "Présence obligatoire pendant l'intervention"
            }
          }
        ]
      },
      {
        title: "📍 Adresse du lieu",
        fields: [
          {
            name: "adresse",
            type: "address-pickup",
            label: "Adresse du lieu à nettoyer",
            required: true,
            columnSpan: 2,
            validation: {
              custom: (value: any) => value?.trim() || "L'adresse est requise"
            }
          }
        ]
      },
      {
        title: "📞 Contact",
        columns: 2,
        fields: [
          {
            name: "nom",
            type: "text",
            label: "Nom complet",
            required: true,
            validation: {
              custom: (value: any) => value?.trim() || "Le nom est requis"
            }
          },
          {
            name: "email",
            type: "email",
            label: "Email",
            required: true,
            validation: {
              custom: (value: any) => {
                if (!value) return "L'email est requis";
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) || "Format d'email invalide";
              }
            }
          },
          {
            name: "telephone",
            type: "text",
            label: "Téléphone",
            required: true,
            validation: {
              custom: (value: any) => value?.trim() || "Le téléphone est requis"
            },
            componentProps: {
              type: "tel",
              placeholder: "06 12 34 56 78"
            }
          },
          {
            name: "commentaires",
            type: "textarea",
            label: "Commentaires supplémentaires",
            columnSpan: 2,
            componentProps: {
              rows: 3,
              placeholder: "Informations complémentaires sur vos besoins..."
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
            columnSpan: 2
          }
        ]
      }
    ],

    // Handlers qui utilisent les callbacks
    onChange: onPriceCalculated ? async (fieldName: string, value: any, formData: any) => {
      const priceRelevantFields = [
        'typeLieu', 'surface', 'nombrePieces', 'etage', 'ascenseur',
        'nettoyageGeneral', 'nettoyageProfond', 'nettoyageVitres', 'nettoyageSols',
        'nettoyageSalleBain', 'nettoyageCuisine', 'nettoyageMeubles',
        'nettoyageElectromenager', 'nettoyageExterieur', 'typeFrequence',
        'dureeEstimee', 'produitsFournis', 'produitsEcologiques'
      ];
      
      if (priceRelevantFields.includes(fieldName)) {
        try {
          // Le hook externe gérera le calcul réel
          onPriceCalculated(0, formData);
        } catch (error) {
          onError?.(error);
        }
      }
    } : undefined,

    onSubmit: async (data: any) => {
      console.log('🚀 [MenageSurMesurePreset] onSubmit appelé avec:', data);
      try {
        if (onSubmitSuccess) {
          console.log('✅ [MenageSurMesurePreset] Appel onSubmitSuccess');
          await onSubmitSuccess(data);
        } else {
          console.log('⚠️ [MenageSurMesurePreset] onSubmitSuccess non défini');
          console.error('❌ [MenageSurMesurePreset] onSubmitSuccess callback manquant');
          throw new Error('Gestionnaire de soumission non configuré');
        }
      } catch (error) {
        console.error('❌ [MenageSurMesurePreset] Erreur dans onSubmit:', error);
        onError?.(error);
        throw error;
      }
    },

    submitLabel: "Réserver",
    cancelLabel: "Annuler"
  };

  return config;
};

// Export des presets complets pour compatibilité
import { 
  MenageSurMesurePreset,
  menageSurMesureSummaryConfig,
  menageSurMesureDefaultValues,
  menageSurMesureStyles
} from './menageSurMesurePresets';

export { 
  MenageSurMesurePreset,
  menageSurMesureSummaryConfig,
  menageSurMesureDefaultValues,
  menageSurMesureStyles
};

// Export par défaut
export default MenageSurMesurePreset;

 