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

      // Informations générales
      typeDemenagement: "",
      surface: "",
      nombrePieces: "",
      volumeEstime: "",
      volumeMethod: "FORM", // Par défaut : estimation standard
      objectList: "", // Pour méthode LIST
      volumeVideo: undefined, // Pour méthode VIDEO

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

      // Contact
      nom: "",
      email: "",
      telephone: "",
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
                key: "typeDemenagement",
                label: "Type de déménagement",
                format: (value: any) => value || "À définir",
                style: "font-medium text-gray-700",
              },
              {
                key: "surface",
                label: "Surface",
                format: (value: any) => (value ? `${value} m²` : "À définir"),
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
            name: "typeDemenagement",
            type: "select",
            label: "Type de logement",
            required: true,
            options: [
              { value: "STUDIO", label: "Studio" },
              { value: "F2", label: "F2 (2 pièces)" },
              { value: "F3", label: "F3 (3 pièces)" },
              { value: "F4", label: "F4 (4 pièces)" },
              { value: "F5+", label: "F5+ (5 pièces et plus)" },
              { value: "HOUSE", label: "Maison" },
              { value: "bureau", label: "Bureau/Commerce" },
              { value: "entrepot", label: "Entrepôt/Local" },
            ],
          },
          {
            name: "surface",
            type: "number",
            label: "Surface approximative (m²)",
            required: true,
            validation: {
              min: 1,
              max: 1000,
              custom: (value: any) => {
                if (!value || value <= 0)
                  return "La surface doit être supérieure à 0";
                if (value > 1000)
                  return "La surface ne peut pas dépasser 1000 m²";
                return true;
              },
            },
            componentProps: {
              min: 1,
              max: 1000,
              placeholder: "Ex: 80",
            },
          },
          {
            name: "nombrePieces",
            type: "number",
            label: "Nombre de pièces",
            required: true,
            validation: {
              min: 1,
              max: 20,
              custom: (value: any) => {
                if (!value || value <= 0)
                  return "Le nombre de pièces doit être supérieur à 0";
                if (value > 20)
                  return "Le nombre de pièces ne peut pas dépasser 20";
                return true;
              },
            },
            componentProps: {
              min: 1,
              max: 20,
              placeholder: "Ex: 4",
            },
          },
          {
            name: "volumeMethod",
            type: "select",
            label: "Méthode estimation volume",
            required: false,
            options: [
              { value: "FORM", label: "📐 Estimation standard (surface/type)" },
              {
                value: "LIST",
                label: "📋 Liste d'objets (plus précis, -5% sur marge)",
              },
              {
                value: "VIDEO",
                label: "🎥 Vidéo (le plus précis, -8% sur marge)",
              },
            ],
          },
          {
            name: "volumeEstime",
            type: "select",
            label: "Volume estimé",
            required: true,
            helpText:
              "💡 Vous n'êtes pas sûr ? Utilisez notre calculateur ou choisissez une méthode plus précise ci-dessus. Astuce : 1 pièce ≈ 10-15 m³ | 1 m² ≈ 0.4-0.5 m³",
            options: [
              {
                value: "tres-petit",
                label: "Très petit (< 15m³)",
                description:
                  "Studio, petit T1 - Exemples : 1 canapé, 1 table, quelques cartons, pas de gros meubles",
              },
              {
                value: "moyen-1",
                label: "Moyen-1 (15-25m³)",
                description:
                  "Petit F2, studio meublé - Exemples : salon basique, 1 chambre, cuisine équipée",
              },
              {
                value: "moyen-2",
                label: "Moyen-2 (25-35m³)",
                description:
                  "F2 complet, petit F3 - Exemples : salon complet, 1-2 chambres meublées, cuisine équipée",
              },
              {
                value: "moyen-intermediaire",
                label: "Moyen-intermédiaire (35-50m³)",
                description:
                  "F3, F4 standard - Exemples : salon complet, 2-3 chambres meublées, cuisine équipée, rangements",
              },
              {
                value: "moyen-grand",
                label: "Moyen-Grand (50-70m³)",
                description:
                  "Grand F4, F5, petite maison - Exemples : plusieurs pièces complètes, garage partiel, rangements",
              },
              {
                value: "grand",
                label: "Grand (70-100m³)",
                description:
                  "Grande maison, villa - Exemples : toutes pièces complètes, garage, cave, rangements importants",
              },
              {
                value: "tres-grand",
                label: "Très grand (> 100m³)",
                description:
                  "Très grande maison, villa avec dépendances - Exemples : mobilier complet + garage + cave + combles",
              },
            ],
            conditional: {
              dependsOn: "volumeMethod",
              condition: (value: any, formData: any) => {
                // Afficher uniquement si méthode FORM ou non spécifiée
                return (
                  !formData?.volumeMethod || formData.volumeMethod === "FORM"
                );
              },
            },
          },
          {
            name: "estimatedVolume",
            type: "number",
            label: "Volume exact (m³) - Optionnel",
            required: false,
            helpText:
              "💡 Connaissez-vous votre volume exact ? Saisissez-le ici pour un devis plus précis et une marge de sécurité réduite (-5% à -8% sur le prix).",
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
            conditional: {
              dependsOn: "volumeMethod",
              condition: (value: any, formData: any) => {
                // Afficher uniquement si méthode FORM ou non spécifiée
                return (
                  !formData?.volumeMethod || formData.volumeMethod === "FORM"
                );
              },
            },
          },
          {
            name: "objectList",
            type: "textarea",
            label: "📋 Liste des objets à déménager",
            required: false,
            componentProps: {
              rows: 6,
              maxLength: 2000,
              placeholder:
                "Ex: 1 canapé 3 places, 2 armoires, 1 table à manger, 1 piano droit, 3 bibliothèques...",
            },
            conditional: {
              dependsOn: "volumeMethod",
              condition: (value: any, formData: any) => {
                return formData?.volumeMethod === "LIST";
              },
            },
            validation: {
              custom: (value: any, formData: any) => {
                if (
                  formData?.volumeMethod === "LIST" &&
                  (!value || value.trim().length < 10)
                ) {
                  return "Veuillez fournir une liste d'au moins 10 caractères";
                }
                return true;
              },
            },
          },
          {
            name: "volumeVideo",
            type: "text",
            label: "🎥 URL de la vidéo de votre logement",
            required: false,
            componentProps: {
              helperText:
                "Collez l'URL de votre vidéo (YouTube, Vimeo, ou lien direct). Ex: https://example.com/video.mp4",
            },
            conditional: {
              dependsOn: "volumeMethod",
              condition: (value: any, formData: any) => {
                return formData?.volumeMethod === "VIDEO";
              },
            },
            validation: {
              custom: (value: any, formData: any) => {
                if (
                  formData?.volumeMethod === "VIDEO" &&
                  (!value || value.trim().length === 0)
                ) {
                  return "Veuillez fournir une URL de vidéo";
                }
                if (value && !value.match(/^https?:\/\//)) {
                  return "L'URL doit commencer par http:// ou https://";
                }
                return true;
              },
            },
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
            columnSpan: 2,
            className: "pickup-section",
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
              modalTitle:
                "Contraintes d'accès & Services Supplémentaires - Départ",
              showServices: true,
            },
          },

          {
            name: "pickupFurnitureLift",
            type: "furniture-lift-checkbox",
            label: "Monte-meubles départ",
            className: "pickup-field",
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
            name: "address-separator",
            type: "separator",
            columnSpan: 2,
          },
          {
            name: "adresseArrivee",
            type: "address-delivery",
            label: "📍 Adresse d'arrivée",
            required: true,
            columnSpan: 2,
            className: "delivery-section",
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
              modalTitle:
                "Contraintes d'accès & Services Supplémentaires - Arrivée",
              showServices: true,
            },
          },
          {
            name: "deliveryFurnitureLift",
            type: "furniture-lift-checkbox",
            label: "Monte-meubles arrivée",
            className: "delivery-field",
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
        ],
      },

      // Section cross-selling après les adresses
      {
        title: "🛒 Services & Fournitures",
        description: "Ajoutez des options à votre déménagement",
        columns: 1,
        fields: [
          {
            name: "crossSellingSelection",
            type: "cross-selling",
            label: "Sélection cross-selling",
            columnSpan: 1,
          },
        ],
      },

      {
        title: "📦 Durée de stockage",
        description:
          "Vous avez sélectionné 'Stockage temporaire' dans les modals, renseignez la durée",
        columns: 2,
        className: "storage-duration-section",
        conditional: {
          dependsOn: "pickupLogistics", // Dépend de pickup, mais vérifie aussi delivery dans la condition
          condition: (value: any, formData: any) => {
            // Afficher la section entière seulement si stockage temporaire est sélectionné dans l'un des modals
            return checkStorageSelected(formData);
          },
        },
        fields: [
          {
            name: "storageDurationDays",
            type: "number",
            label: "Durée de stockage (jours)",
            columnSpan: 2,
            required: (formData: any) => checkStorageSelected(formData), // Obligatoire si stockage est coché
            validation: {
              min: 1,
              max: 365,
              custom: (value: any, formData: any) => {
                // Vérifier si stockage temporaire est coché dans les modals
                const hasStorage = checkStorageSelected(formData);
                if (hasStorage && (!value || value < 1)) {
                  return "La durée de stockage doit être d'au moins 1 jour";
                }
                if (value && value > 365) {
                  return "La durée de stockage ne peut pas dépasser 365 jours";
                }
                return true;
              },
            },
            componentProps: {
              min: 1,
              max: 365,
              placeholder: "Ex: 30",
              helperText:
                "Nombre de jours de stockage souhaité (affiché seulement si stockage temporaire sélectionné dans les modals)",
              disabled: (formData: any) => !checkStorageSelected(formData),
              className: (formData: any, value: any) => {
                // Ajouter une classe pour le clignotement si stockage est coché mais le champ est vide
                const hasStorage = checkStorageSelected(formData);
                if (hasStorage && (!value || value < 1)) {
                  return "storage-required-blinking";
                }
                return "";
              },
            },
          },
        ],
      },

      {
        title: "📝 Informations supplémentaires",
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
            "typeDemenagement",
            "surface",
            "nombrePieces",
            "volumeEstime",
            "estimatedVolume",
            "volumeMethod",
            "objectList",
            "volumeVideo", // Nouveaux champs volume
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

  // Informations générales
  typeDemenagement: "",
  surface: "",
  nombrePieces: "",
  volumeEstime: "",
  volumeMethod: "FORM",
  objectList: "",
  volumeVideo: undefined,

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

  // Contact
  nom: "",
  email: "",
  telephone: "",
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
      fields: [
        { key: "typeDemenagement", label: "Type de déménagement" },
        { key: "surface", label: "Surface", suffix: " m²" },
        { key: "nombrePieces", label: "Nombre de pièces" },
      ],
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
    {
      title: "Contact",
      fields: [
        { key: "nom", label: "Nom complet" },
        { key: "email", label: "Email" },
        { key: "telephone", label: "Téléphone" },
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
