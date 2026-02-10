// Import et export des presets complets pour le déménagement sur mesure
import { FormConfig } from "../../types";
import { CatalogueMovingItem } from "@/types/booking";

/**
 * Vérifie si le stockage temporaire est sélectionné dans les modals
 * @param formData Données du formulaire
 * @returns true si stockage temporaire (service-14) est sélectionné
 */
const checkStorageSelected = (formData: any): boolean => {
  if (!formData) return false;

  // Vérifier dans pickupLogistics
  const pickup = formData.pickupLogistics;
  if (
    pickup?.globalServices?.["service-14"] ||
    pickup?.addressServices?.["service-14"]
  ) {
    return true;
  }

  // Vérifier dans deliveryLogistics
  const delivery = formData.deliveryLogistics;
  if (
    delivery?.globalServices?.["service-14"] ||
    delivery?.addressServices?.["service-14"]
  ) {
    return true;
  }

  return false;
};

export interface DemenagementSurMesureServicePresetOptions {
  service: CatalogueMovingItem;
  onPriceCalculated?: (price: number, details: any) => void;
  onSubmitSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  editMode?: boolean;
  sessionStorageKey?: string;
}

export const getDemenagementSurMesureServiceConfig = (
  serviceOrOptions:
    | CatalogueMovingItem
    | DemenagementSurMesureServicePresetOptions,
): FormConfig => {
  // Support pour les deux signatures : ancien (objet options) et nouveau (service direct)
  const isOptions =
    "service" in serviceOrOptions || "onPriceCalculated" in serviceOrOptions;
  const service = isOptions
    ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).service
    : (serviceOrOptions as CatalogueMovingItem);
  const onPriceCalculated = isOptions
    ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions)
        .onPriceCalculated
    : undefined;
  const onSubmitSuccess = isOptions
    ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions)
        .onSubmitSuccess
    : undefined;
  const onError = isOptions
    ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).onError
    : undefined;
  const editMode = isOptions
    ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions).editMode
    : undefined;
  const sessionStorageKey = isOptions
    ? (serviceOrOptions as DemenagementSurMesureServicePresetOptions)
        .sessionStorageKey
    : undefined;

  // Auto-détection des valeurs par défaut depuis sessionStorage si en mode édition
  const getDefaultValues = () => {
    if (editMode && sessionStorageKey && typeof window !== "undefined") {
      const storedData = window.sessionStorage.getItem(sessionStorageKey);
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);
          window.sessionStorage.removeItem(sessionStorageKey);
          return parsedData;
        } catch (error) {
          console.error("Erreur lors du parsing des données stockées:", error);
        }
      }
    }

    return {
      // Planification
      dateSouhaitee: "",
      flexibilite: "",
      horaire: "",

      // Adresses
      pickupAddress: "",
      pickupPostalCode: "",
      pickupCity: "",
      pickupLat: undefined,
      pickupLng: undefined,
      pickupFloor: "0",
      pickupElevator: "no",
      pickupFurnitureLift: false, // Monte-meubles départ (géré automatiquement selon seuils)
      pickupCarryDistance: "",
      deliveryAddress: "",
      deliveryPostalCode: "",
      deliveryCity: "",
      deliveryLat: undefined,
      deliveryLng: undefined,
      deliveryFloor: "0",
      deliveryElevator: "no",
      deliveryFurnitureLift: false, // Monte-meubles arrivée (géré automatiquement selon seuils)
      deliveryCarryDistance: "",

      // Informations générales (volume uniquement ; calculateur dans le formulaire)
      estimatedVolume: undefined as number | undefined,

      // Objets spéciaux et services - maintenant gérés via les modals uniquement
      // Les sélections sont dans pickupLogistics et deliveryLogistics
      // declaredValue: géré dans PaymentPriceSection (colonne de droite), pas dans le formulaire
      storageDurationDays: undefined, // Gardé car valeur numérique conditionnelle

      // Mobilier (legacy - gardé pour compatibilité)
      meubles: [],
      electromenager: [],
      objetsFragiles: [],

      // Services optionnels (legacy - gardé pour compatibilité)
      emballage: false,
      montage: false,
      nettoyage: false,
      stockage: false,
      assurance: false,

      commentaires: "",

      // Ajouter les données du service au contexte
      serviceName: service.name,
      serviceDescription: service.description,
      basePrice: service.price,
      defaultPrice: service.price,
    };
  };

  const config: FormConfig = {
    //title: `Réserver votre déménagement sur mesure ${service.name}`,
    //description: "Personnalisez votre déménagement selon vos besoins",
    serviceType: "moving",
    customDefaults: getDefaultValues(),

    layout: {
      type: "default", // Layout simple sans sidebar (une seule colonne)
      // Les fonctionnalités de prix, contraintes, etc. sont gérées dans la colonne droite de la page
      summaryConfig: {
        title: service.name,
        sections: [
          // Section Service enrichie avec les données dynamiques
          {
            title: "Service",
            icon: "🏠",
            fields: [
              {
                key: "serviceName",
                label: "Service sélectionné",
                format: () => service.name,
              },
              {
                key: "serviceDescription",
                label: "Description",
                format: () => service.description,
              },
              {
                key: "estimatedVolume",
                label: "Volume",
                format: (value: any) => (value ? `${value} m³` : "À définir"),
                style: "font-medium text-gray-700",
              },
            ],
          },
          // Section Planification
          {
            title: "Planification",
            icon: "📅",
            fields: [
              {
                key: "dateSouhaitee",
                label: "Date souhaitée",
                format: (value: any) => value || "À définir",
              },
              {
                key: "horaire",
                label: "Horaire",
                format: (value: any) => value || "À définir",
              },
              {
                key: "flexibilite",
                label: "Flexibilité",
                format: (value: any) => value || "À définir",
              },
            ],
          },
          // Section Adresses
          {
            title: "Adresses",
            icon: "🗺️",
            fields: [
              {
                key: "adresseDepart",
                label: "Adresse de départ",
                format: (value: any) => value || "À définir",
              },
              {
                key: "adresseArrivee",
                label: "Adresse d'arrivée",
                format: (value: any) => value || "À définir",
              },
              {
                key: "distanceEstimee",
                label: "Distance estimée",
                format: (value: any) => (value ? `${value} km` : "À calculer"),
              },
            ],
          },
          // Section Objets spéciaux et services (depuis modals)
          {
            title: "Services sélectionnés",
            icon: "🎨",
            fields: [
              {
                key: "pickupLogistics",
                label: "Services départ",
                format: (value: any) => {
                  if (!value) return "Aucun";
                  const count =
                    Object.keys(value.addressServices || {}).length +
                    Object.keys(value.globalServices || {}).length;
                  return count > 0 ? `${count} service(s)` : "Aucun";
                },
              },
              {
                key: "deliveryLogistics",
                label: "Services arrivée",
                format: (value: any) => {
                  if (!value) return "Aucun";
                  const count =
                    Object.keys(value.addressServices || {}).length +
                    Object.keys(value.globalServices || {}).length;
                  return count > 0 ? `${count} service(s)` : "Aucun";
                },
              },
              // declaredValue: géré dans PaymentPriceSection (colonne de droite), pas dans le résumé du formulaire
              {
                key: "storageDurationDays",
                label: "Durée de stockage",
                format: (value: any, formData: any) => {
                  if (!checkStorageSelected(formData)) return "Non applicable";
                  return value ? `${value} jours` : "À définir";
                },
              },
            ],
          },
          // Section Prix dynamique
          {
            title: "Prix",
            icon: "💰",
            fields: [
              {
                key: "basePrice",
                label: "Prix de base",
                format: () => "Sur devis",
              },
              {
                key: "totalPrice",
                label: "Total estimé",
                format: () => "Calcul en cours...", // Sera mis à jour dynamiquement
                style: "font-bold text-emerald-600",
              },
            ],
          },
        ],
      },
    },

    sections: [
      {
        title: "📅 Planification",
        columns: 2,
        fields: [
          {
            name: "dateSouhaitee",
            type: "date",
            label: "Date souhaitée",
            required: true,
            validation: {
              custom: (value: any) => {
                if (!value) return "La date est requise";
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return (
                  selectedDate >= today ||
                  "La date ne peut pas être dans le passé"
                );
              },
            },
          },

          {
            name: "horaire",
            type: "select",
            label: "Horaire de RDV",
            required: true,
            options: [
              { value: "matin-6h", label: "Matin - 6h" },
              { value: "matin-8h", label: "Matin - 8h" },
              { value: "apres-midi", label: "Après-midi - 13h" },
              { value: "soirée", label: "soirée - 18h" },
              { value: "flexible", label: "Flexible - selon disponibilité" },
            ],
          },
        ],
      },

      {
        title: "🏠 Informations générales",
        columns: 2,
        fields: [
          {
            name: "estimatedVolume",
            type: "volume-with-calculator",
            label: "Volume (m³)",
            required: false,
            helpText:
              "Saisissez le volume à déménager en m³, ou utilisez le calculateur ci-dessous pour une estimation.",
            validation: {
              min: 5,
              max: 200,
              custom: (value: any) => {
                if (!value) return true; // Optionnel
                if (value < 5) return "Le volume minimum est de 5 m³";
                if (value > 200) return "Le volume maximum est de 200 m³";
                return true;
              },
            },
            componentProps: {
              min: 5,
              max: 200,
              step: 0.5,
              placeholder: "Ex: 42.5",
            },
            columnSpan: 2,
          },
        ],
      },

      {
        title: "🗺️ Adresses",
        columns: 2,
        fields: [
          {
            name: "adresseDepart",
            type: "address-pickup",
            label: "📍 Adresse de départ",
            required: true,
            columnSpan: 1,
            className: "pickup-section w-[70%]",
            validation: {
              custom: (value: any) => {
                if (!value || !value.trim()) {
                  return "L'adresse de départ est requise";
                }
                return true;
              },
            },
            componentProps: {
              iconColor: "#10b981",
            },
          },
          {
            name: "pickupFurnitureLift",
            type: "furniture-lift-checkbox",
            label: "",
            className: "pickup-field w-[30%]",
            componentProps: {
              addressType: "pickup",
              floorFieldName: "pickupFloor",
              elevatorFieldName: "pickupElevator",
              // Seuils de gestion automatique
              thresholds: {
                HIGH: 3, // ≥3 : Coché par défaut, décochable avec warning
                CRITICAL: 5, // ≥5 : Coché et non décochable
              },
            },
          },
          {
            name: "pickupFloor",
            type: "select",
            label: "Étage départ",
            className: "pickup-field",
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
              { value: "10", label: "10ème étage" },
            ],
          },
          {
            name: "pickupElevator",
            type: "select",
            label: "Ascenseur départ",
            className: "pickup-field",
            options: [
              { value: "no", label: "Aucun" },
              { value: "small", label: "Petit (1-3 pers)" },
              { value: "medium", label: "Moyen (3-6 pers)" },
              { value: "large", label: "Grand (+6 pers)" },
            ],
          },

          {
            name: "pickupCarryDistance",
            type: "select",
            label: "Distance de portage départ",
            className: "pickup-field",
            options: [
              { value: "", label: "-- Sélectionnez une option --" },
              { value: "0-10", label: "0-10m" },
              { value: "10-30", label: "10-30m" },
              { value: "30+", label: "30m+" },
            ],
          },
          {
            name: "pickupLogistics",
            type: "access-constraints",
            label: "Spécificités Départ",
            className: "pickup-field",
            componentProps: {
              type: "pickup",
              buttonLabel: "Contraintes & Spécificités",
              modalTitle: "Contraintes",
              showServices: true,
            },
          },

          {
            name: "address-separator",
            type: "separator",
            columnSpan: 2,
          },
          {
            name: "adresseArrivee",
            type: "address-delivery",
            label: "📍 Adresse d'arrivée",
            required: true,
            columnSpan: 1,
            className: "delivery-section w-[70%]",
            validation: {
              custom: (value: any) => {
                if (!value || !value.trim()) {
                  return "L'adresse d'arrivée est requise";
                }
                return true;
              },
            },
            componentProps: {
              iconColor: "#ef4444",
            },
          },
          {
            name: "deliveryFurnitureLift",
            type: "furniture-lift-checkbox",
            label: "",
            className: "delivery-field w-[30%]",
            componentProps: {
              addressType: "delivery",
              floorFieldName: "deliveryFloor",
              elevatorFieldName: "deliveryElevator",
              // Seuils de gestion automatique
              thresholds: {
                HIGH: 3, // ≥3 : Coché par défaut, décochable avec warning
                CRITICAL: 5, // ≥5 : Coché et non décochable
              },
            },
          },
          {
            name: "deliveryFloor",
            type: "select",
            label: "Étage arrivée",
            className: "delivery-field",
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
              { value: "10", label: "10ème étage" },
            ],
          },
          {
            name: "deliveryElevator",
            type: "select",
            label: "Ascenseur arrivée",
            className: "delivery-field",
            options: [
              { value: "no", label: "Aucun" },
              { value: "small", label: "Petit (1-3 pers)" },
              { value: "medium", label: "Moyen (3-6 pers)" },
              { value: "large", label: "Grand (+6 pers)" },
            ],
          },

          {
            name: "deliveryCarryDistance",
            type: "select",
            label: "Distance de portage arrivée",
            className: "delivery-field",
            options: [
              { value: "", label: "-- Sélectionnez une option --" },
              { value: "0-10", label: "0-10m" },
              { value: "10-30", label: "10-30m" },
              { value: "30+", label: "30m+" },
            ],
          },
          {
            name: "deliveryLogistics",
            type: "access-constraints",
            label: "Spécificités Arrivée",
            className: "delivery-field",
            componentProps: {
              type: "delivery",
              buttonLabel: "Contraintes & Spécificités",
              modalTitle: "Contraintes",
              showServices: true,
            },
          },
        ],
      },

      {
        title: "📝 Informations supplémentaires",
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            name: "additionalInfo",
            type: "textarea",
            label: "votre message",
            columnSpan: 2,
            componentProps: {
              rows: 3,
              placeholder:
                "Précisez vos besoins spécifiques, vos coordonnées et détaillez les contraintes sélectionnées si nécessaire",
            },
          },
        ],
      },

      {
        title: "📱 Notifications",
        collapsible: true,
        defaultExpanded: false,
        fields: [
          {
            name: "whatsappOptIn",
            type: "whatsapp-consent",
            label: "Notifications WhatsApp",
            columnSpan: 2,
          },
        ],
      },
    ],

    // Handlers qui utilisent les callbacks
    onChange: onPriceCalculated
      ? async (fieldName: string, value: any, formData: any) => {
          // Liste des champs qui déclenchent un recalcul de prix
          const priceRelevantFields = [
            "estimatedVolume",
            "adresseDepart",
            "adresseArrivee",
            "pickupAddress",
            "deliveryAddress",
            "pickupFloor",
            "deliveryFloor",
            "pickupElevator",
            "deliveryElevator",
            "pickupHasElevator",
            "deliveryHasElevator",
            "pickupCarryDistance",
            "deliveryCarryDistance",
            "pickupFurnitureLift",
            "deliveryFurnitureLift", // Monte-meubles (checkbox)
            "pickupLogistics",
            "deliveryLogistics", // Modals logistiques
            "refuseLiftDespiteRecommendation",
            // declaredValue: géré dans PaymentPriceSection (colonne de droite), pas dans le formulaire
            "temporaryStorage",
            "storageDurationDays",
            "distance", // Distance calculée
            "movingDate",
            "dateSouhaitee", // Dates pour surcoûts temporels
            "flexibilite",
            "horaire",
          ];

          // Vérifier si le champ modifié impacte le prix
          const shouldRecalculate =
            priceRelevantFields.includes(fieldName) ||
            fieldName.startsWith("pickup") ||
            fieldName.startsWith("delivery") ||
            fieldName.includes("Logistics");

          if (shouldRecalculate) {
            try {
              // Appeler le callback qui déclenchera le calcul via useModularQuotation
              onPriceCalculated(0, formData);
            } catch (error) {
              onError?.(error);
            }
          }
        }
      : undefined,

    onSubmit: async (data: any) => {
      console.log(
        "🚀 [DemenagementSurMesurePreset] onSubmit appelé avec:",
        data,
      );
      try {
        if (onSubmitSuccess) {
          console.log("✅ [DemenagementSurMesurePreset] Appel onSubmitSuccess");
          await onSubmitSuccess(data);
        } else {
          console.log(
            "⚠️ [DemenagementSurMesurePreset] onSubmitSuccess non défini",
          );
          console.error(
            "❌ [DemenagementSurMesurePreset] onSubmitSuccess callback manquant",
          );
          throw new Error("Gestionnaire de soumission non configuré");
        }
      } catch (error) {
        console.error(
          "❌ [DemenagementSurMesurePreset] Erreur dans onSubmit:",
          error,
        );
        onError?.(error);
        throw error;
      }
    },

    submitLabel: "Réserver",
    cancelLabel: "Annuler",
  };

  return config;
};

// ============================================================================
// EXPORTS LEGACY (pour compatibilité avec presetData dans presets/index.ts)
// ============================================================================

import { FormSummaryConfig, PresetConfig } from "../../types";
// FormConfig déjà importé en haut du fichier

// 📝 Valeurs par défaut legacy pour le presetData
export const demenagementSurMesureDefaultValues = {
  // Planification
  dateSouhaitee: "",
  flexibilite: "",
  horaire: "",

  // Adresses
  adresseDepart: "",
  pickupFloor: "0",
  pickupElevator: "no",
  pickupCarryDistance: "",
  adresseArrivee: "",
  deliveryFloor: "0",
  deliveryElevator: "no",
  deliveryCarryDistance: "",

  // Informations générales (volume uniquement)
  estimatedVolume: undefined as number | undefined,

  // Mobilier (legacy)
  meubles: [],
  electromenager: [],
  objetsFragiles: [],

  // Services optionnels (legacy)
  emballage: false,
  montage: false,
  nettoyage: false,
  stockage: false,
  assurance: false,

  commentaires: "",
};

// 🎨 Styles CSS (vide pour le moment)
export const demenagementSurMesureStyles = "";

// 📋 Configuration du résumé legacy pour presetData
export const demenagementSurMesureSummaryConfig: FormSummaryConfig = {
  title: "Résumé de votre demande de déménagement sur mesure",
  sections: [
    {
      title: "Informations générales",
      fields: [{ key: "estimatedVolume", label: "Volume", suffix: " m³" }],
    },
    {
      title: "Adresses",
      fields: [
        { key: "adresseDepart", label: "Adresse de départ" },
        { key: "adresseArrivee", label: "Adresse d'arrivée" },
      ],
    },
    {
      title: "Planification",
      fields: [
        { key: "dateSouhaitee", label: "Date souhaitée" },
        { key: "flexibilite", label: "Flexibilité" },
        { key: "horaire", label: "Horaire préféré" },
      ],
    },
  ],
};

// 🎯 Preset legacy minimal (pour compatibilité)
const demenagementSurMesureLegacyForm: FormConfig = {
  layout: { type: "default" },
  fields: [],
};

export const DemenagementSurMesurePreset: PresetConfig = {
  form: demenagementSurMesureLegacyForm,
  defaultValues: demenagementSurMesureDefaultValues,
  meta: {
    industry: "moving",
    name: "Déménagement Sur Mesure",
    description: "Service de déménagement personnalisé selon vos besoins",
    version: "2.0",
  },
  summary: demenagementSurMesureSummaryConfig,
  styles: demenagementSurMesureStyles,
};

// Export par défaut
export default DemenagementSurMesurePreset;
