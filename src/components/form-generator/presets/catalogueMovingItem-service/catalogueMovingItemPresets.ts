import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";
import { AutoDetectionService, AddressData } from "@/quotation/domain/services/AutoDetectionService";
import { RULE_UUID_MONTE_MEUBLE } from "@/quotation/domain/constants/RuleUUIDs";

/**
 * 🎯 Helper pour formater l'affichage d'une adresse avec détection intelligente du monte-meubles
 */
const formatAddressDetails = (
  floor: string,
  elevator: string,
  carryDistance: string,
  constraints: string[],
  volume?: number
): string[] => {
  const details: string[] = [];

  // Afficher l'étage
  if (floor && floor !== '0') {
    details.push(`Étage ${floor}`);
  }

  // Afficher l'ascenseur
  if (elevator && elevator !== 'no') {
    const elevatorLabels: Record<string, string> = {
      'small': 'Petit ascenseur',
      'medium': 'Ascenseur moyen',
      'large': 'Grand ascenseur'
    };
    details.push(elevatorLabels[elevator] || 'Ascenseur');
  } else if (floor && floor !== '0') {
    details.push('Aucun ascenseur');
  }

  // Afficher la distance de portage
  if (carryDistance) {
    const formattedDistance = carryDistance.replace('-', ' à ').replace('+', '+ de ');
    details.push(`Portage ${formattedDistance}m`);
  }

  // ✅ Détecter et afficher le monte-meubles avec raison explicite (utilise l'UUID)
  if (Array.isArray(constraints) && constraints.includes(RULE_UUID_MONTE_MEUBLE)) {
    const addressData: AddressData = {
      floor: parseInt(floor) || 0,
      elevator: elevator as 'no' | 'small' | 'medium' | 'large',
      carryDistance: carryDistance as '0-10' | '10-30' | '30+' | undefined,
      constraints
    };

    const detectionResult = AutoDetectionService.detectFurnitureLift(addressData, volume);

    if (detectionResult.furnitureLiftRequired && detectionResult.furnitureLiftReason) {
      details.push(`🏗️ Monte-meuble requis (${detectionResult.furnitureLiftReason})`);
    } else {
      details.push('🏗️ Monte-meuble');
    }
  }

  // Détecter la longue distance de portage
  if (Array.isArray(constraints) && constraints.includes('long_carrying_distance')) {
    details.push('📏 Longue distance de portage');
  }

  return details;
};

// 📝 Valeurs par défaut pour les formulaires de packs
export const catalogueMovingItemDefaultValues = {
  // Planification
  scheduledDate: '',
  horaire: '',
  
  // Adresses - Départ
  pickupAddress: '',
  pickupFloor: '0',
  pickupElevator: 'no',
  pickupCarryDistance: '',
  pickupLogisticsConstraints: [],
  
  // Adresses - Arrivée  
  deliveryAddress: '',
  deliveryFloor: '0',
  deliveryElevator: 'no',
  deliveryCarryDistance: '',
  deliveryLogisticsConstraints: [],
  
  // Configuration du pack
  duration: '',
  workers: '',
  
  // Contact et notifications
  whatsappOptIn: false,
  
  // Commentaires
  additionalInfo: ''
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const catalogueMovingItemStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Configuration du récapitulatif pour les packs
export const catalogueMovingItemSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif du Pack",
  sections: [
    {
      title: "Pack Sélectionné",
      icon: "📦",
      fields: [
        {
          key: "packName",
          label: "Pack",
          format: (value: any, formData: any) => formData.packName || "Pack personnalisé"
        },
        {
          key: "packDescription", 
          label: "Description",
          format: (value: any, formData: any) => formData.packDescription || "",
          condition: (value: any, formData: any) => !!formData.packDescription
        },
        {
          key: "duration",
          label: "Durée",
          format: (value: any) => value ? `${value} jour${value > 1 ? 's' : ''}` : "",
          condition: (value: any) => !!value
        },
        {
          key: "workers",
          label: "Équipe",
          format: (value: any) => value ? `${value} travailleur${value > 1 ? 's' : ''}` : "",
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
        }
      ]
    },
    {
      title: "Adresses",
      icon: "📍",
      fields: [
        {
          key: "pickupAddress",
          label: "Adresse de départ",
          format: (value: any, formData: any) => {
            const details = formatAddressDetails(
              formData.pickupFloor,
              formData.pickupElevator,
              formData.pickupCarryDistance,
              formData.pickupLogisticsConstraints,
              formData.volume
            );

            return details.length > 0 ? `${value}\n${details.join(' • ')}` : value;
          },
          condition: (value: any) => !!value
        },
        {
          key: "deliveryAddress",
          label: "Adresse d'arrivée",
          format: (value: any, formData: any) => {
            const details = formatAddressDetails(
              formData.deliveryFloor,
              formData.deliveryElevator,
              formData.deliveryCarryDistance,
              formData.deliveryLogisticsConstraints,
              formData.volume
            );

            return details.length > 0 ? `${value}\n${details.join(' • ')}` : value;
          },
          condition: (value: any) => !!value
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

// 🎯 Configuration complète du preset Pack (maintenant hérite du global)
export const CatalogueMovingItemPreset: PresetConfig = {
  form: {
    title: "Réservation Pack",
    description: "Configurez votre pack de déménagement",
    serviceType: "package",
    // 🌍 Hérite du preset global SANS override des couleurs (uniformité iOS 18)
    globalConfig: mergeWithGlobalPreset({
      // ✅ SUPPRIMÉ: Plus d'override des couleurs pour uniformité
      // appearance: { primaryColor: '#8B5CF6', secondaryColor: '#7C3AED' },
      layout: {
        type: 'two-column',
        sidebar: true,
        mobileFixedHeader: true,
        mobile: {
          singleColumn: true,
          optionDisplay: 'cards'      // Affichage en cartes pour les packs
        }
      },
      uiElements: {
        showServiceIcon: true,
        stickyHeader: true,
        submitButtonStyle: 'flat',    // Style flat pour les packs
        headerAppearance: 'blur',
        showBreadcrumbs: true         // Breadcrumbs utiles pour la navigation des packs
      },
      interactions: {
        hoverEffects: true,
        tapEffects: true,
        livePreview: false            // Pas de preview live pour les packs
      },
      metadata: {
        compatibleWith: 'Catalogue Packs'
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
          },
          {
            name: "horaire",
            type: "select",
            label: "Horaire de RDV",
            required: true,
            options: [
              { value: "matin-6h", label: "Matin - 6h" },
              { value: "matin-8h", label: "Matin - 8h" },
              { value: "apres-midi-13h", label: "Après-midi - 13h" },
              { value: "soiree-18h", label: "Soirée - 18h" },
              { value: "flexible", label: "Flexible - selon disponibilité" }
            ]
          }
        ]
      },
      {
        title: "🗺️ Adresses",
        fields: [
          {
            name: "pickupAddress",
            type: "address-pickup",
            label: "📍 Adresse de départ",
            required: true,
            columnSpan: 2,
            className: "pickup-section"
          },
          {
            name: "pickupFloor",
            type: "select",
            label: "Étage départ",
            className: "pickup-field",
            options: [
              { value: '-1', label: 'Sous-sol' },
              { value: '0', label: 'RDC' },
              { value: '1', label: '1er étage' },
              { value: '2', label: '2ème étage' },
              { value: '3', label: '3ème étage' },
              { value: '4', label: '4ème étage' },
              { value: '5', label: '5ème étage' }
            ]
          },
          {
            name: "pickupElevator",
            type: "select",
            label: "Ascenseur départ",
            className: "pickup-field",
            options: [
              { value: 'no', label: 'Aucun' },
              { value: 'small', label: 'Petit (1-3 pers)' },
              { value: 'medium', label: 'Moyen (3-6 pers)' },
              { value: 'large', label: 'Grand (+6 pers)' }
            ]
          },
          {
            name: "deliveryAddress",
            type: "address-delivery",
            label: "🏁 Adresse d'arrivée",
            required: true,
            columnSpan: 2,
            className: "delivery-section"
          },
          {
            name: "deliveryFloor",
            type: "select",
            label: "Étage arrivée",
            className: "delivery-field",
            options: [
              { value: '-1', label: 'Sous-sol' },
              { value: '0', label: 'RDC' },
              { value: '1', label: '1er étage' },
              { value: '2', label: '2ème étage' },
              { value: '3', label: '3ème étage' },
              { value: '4', label: '4ème étage' },
              { value: '5', label: '5ème étage' }
            ]
          },
          {
            name: "deliveryElevator",
            type: "select",
            label: "Ascenseur arrivée",
            className: "delivery-field",
            options: [
              { value: 'no', label: 'Aucun' },
              { value: 'small', label: 'Petit (1-3 pers)' },
              { value: 'medium', label: 'Moyen (3-6 pers)' },
              { value: 'large', label: 'Grand (+6 pers)' }
            ]
          }
        ]
      },
      {
        title: "⚙️ Modifications",
        fields: [
          {
            name: "duration",
            type: "select",
            label: "Durée souhaitée",
            options: [
              { value: '1', label: '1 jour' },
              { value: '2', label: '2 jours' },
              { value: '3', label: '3 jours' },
              { value: '4', label: '4 jours' },
              { value: '5', label: '5 jours' }
            ]
          },
          {
            name: "workers",
            type: "select",
            label: "Nombre de déménageurs",
            options: [
              { value: '1', label: '1 déménageur' },
              { value: '2', label: '2 déménageurs' },
              { value: '3', label: '3 déménageurs' },
              { value: '4', label: '4 déménageurs' },
              { value: '5', label: '5 déménageurs' }
            ]
          }
        ]
      },
      {
        title: "📝 Informations complémentaires",
        fields: [
          {
            name: "additionalInfo",
            type: "textarea",
            label: "Informations supplémentaires",
            componentProps: {
              placeholder: "Précisions, contraintes particulières, demandes spéciales...",
              rows: 4
            }
          }
        ]
      }
    ]
  },
  defaultValues: catalogueMovingItemDefaultValues,
  summary: catalogueMovingItemSummaryConfig,
  styles: catalogueMovingItemStyles,
  meta: {
    industry: "catalogueMovingItem",  // Mise à jour pour correspondre au type
    name: "Pack Déménagement",
    description: "Preset complet pour les formulaires de réservation de packs (hérite du global)",
    version: "2.0.0"  // Incrémenté pour indiquer la migration
  }
}; 