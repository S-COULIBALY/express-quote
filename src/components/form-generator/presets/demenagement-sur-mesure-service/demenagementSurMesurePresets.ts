import { PresetConfig, FormSummaryConfig } from "../../types";
import { mergeWithGlobalPreset } from "../_shared/globalPreset";
import { 
  createSizeFieldForService, 
  addressFields, 
  dateField, 
  timeField,
  contactFields,
  housingFields,
  commentsField,
  commonFieldCollections 
} from "../_shared/sharedFields";
import { createServiceValidation } from "../_shared/sharedValidation";

// 📝 Valeurs par défaut pour les formulaires de déménagement sur mesure
export const demenagementSurMesureDefaultValues = {
  // Informations générales
  typeDemenagement: "",
  surface: "",
  nombrePieces: "",
  etageDepart: "0",
  etageArrivee: "0",
  ascenseurDepart: false,
  ascenseurArrivee: false,
  
  // Adresses
  adresseDepart: "",
  adresseArrivee: "",
  distanceEstimee: "",
  
  // Mobilier
  meubles: [],
  electromenager: [],
  objetsFragiles: [],
  volumeEstime: "",
  
  // Services optionnels
  emballage: false,
  montage: false,
  nettoyage: false,
  stockage: false,
  assurance: false,
  
  // Planification
  dateSouhaitee: "",
  flexibilite: "",
  horaire: "",
  
  // Contact
  nom: "",
  email: "",
  telephone: "",
  commentaires: ""
};

// 🎨 Styles CSS
export const demenagementSurMesureStyles = "";

// 📋 Configuration du formulaire
export const demenagementSurMesureForm = {
  fields: [
    // Étape 1: Informations générales
    {
      name: "typeDemenagement",
      type: "select",
      label: "Type de déménagement",
      required: true,
      options: [
        { value: "appartement", label: "Appartement" },
        { value: "maison", label: "Maison" },
        { value: "bureau", label: "Bureau/Commerce" },
        { value: "entrepot", label: "Entrepôt/Local" },
        { value: "autre", label: "Autre" }
      ]
    },
    {
      name: "surface",
      type: "number",
      label: "Surface approximative (m²)",
      required: true,
      min: 1,
      max: 1000
    },
    {
      name: "nombrePieces",
      type: "number",
      label: "Nombre de pièces",
      required: true,
      min: 1,
      max: 20
    },
    {
      name: "etageDepart",
      type: "number",
      label: "Étage de départ",
      required: false,
      min: 0,
      max: 50
    },
    {
      name: "etageArrivee",
      type: "number",
      label: "Étage d'arrivée",
      required: false,
      min: 0,
      max: 50
    },
    {
      name: "ascenseurDepart",
      type: "checkbox",
      label: "Ascenseur au départ",
      required: false
    },
    {
      name: "ascenseurArrivee",
      type: "checkbox",
      label: "Ascenseur à l'arrivée",
      required: false
    },
    
    // Étape 2: Adresses
    {
      name: "adresseDepart",
      type: "address",
      label: "Adresse de départ",
      required: true
    },
    {
      name: "adresseArrivee",
      type: "address",
      label: "Adresse d'arrivée",
      required: true
    },
    {
      name: "distanceEstimee",
      type: "number",
      label: "Distance estimée (km)",
      required: false,
      min: 0,
      max: 1000
    },
    
    // Étape 3: Mobilier
    {
      name: "meubles",
      type: "checkbox-group",
      label: "Types de meubles",
      required: true,
      options: [
        { value: "canape", label: "Canapé" },
        { value: "lit", label: "Lit" },
        { value: "armoire", label: "Armoire" },
        { value: "commode", label: "Commode" },
        { value: "table", label: "Table" },
        { value: "chaise", label: "Chaises" },
        { value: "bureau", label: "Bureau" },
        { value: "etagere", label: "Étagère" },
        { value: "autre", label: "Autre" }
      ]
    },
    {
      name: "electromenager",
      type: "checkbox-group",
      label: "Électroménager",
      required: false,
      options: [
        { value: "refrigerateur", label: "Réfrigérateur" },
        { value: "lave-vaisselle", label: "Lave-vaisselle" },
        { value: "machine-a-laver", label: "Machine à laver" },
        { value: "seche-linge", label: "Sèche-linge" },
        { value: "four", label: "Four" },
        { value: "micro-ondes", label: "Micro-ondes" },
        { value: "autre", label: "Autre" }
      ]
    },
    {
      name: "objetsFragiles",
      type: "checkbox-group",
      label: "Objets fragiles",
      required: false,
      options: [
        { value: "tableaux", label: "Tableaux" },
        { value: "miroirs", label: "Miroirs" },
        { value: "vases", label: "Vases" },
        { value: "livres", label: "Livres" },
        { value: "vaisselle", label: "Vaisselle" },
        { value: "autre", label: "Autre" }
      ]
    },
    {
      name: "volumeEstime",
      type: "select",
      label: "Volume estimé",
      required: true,
      options: [
        { value: "petit", label: "Petit (< 20m³)" },
        { value: "moyen", label: "Moyen (20-50m³)" },
        { value: "grand", label: "Grand (50-100m³)" },
        { value: "tres-grand", label: "Très grand (> 100m³)" }
      ]
    },
    
    // Étape 4: Services optionnels
    {
      name: "emballage",
      type: "checkbox",
      label: "Service d'emballage",
      required: false
    },
    {
      name: "montage",
      type: "checkbox",
      label: "Montage/Démontage de meubles",
      required: false
    },
    {
      name: "nettoyage",
      type: "checkbox",
      label: "Nettoyage après déménagement",
      required: false
    },
    {
      name: "stockage",
      type: "checkbox",
      label: "Stockage temporaire",
      required: false
    },
    {
      name: "assurance",
      type: "checkbox",
      label: "Assurance déménagement",
      required: false
    },
    
    // Étape 5: Planification
    {
      name: "dateSouhaitee",
      type: "date",
      label: "Date souhaitée",
      required: true,
      min: new Date().toISOString().split('T')[0]
    },
    {
      name: "flexibilite",
      type: "select",
      label: "Flexibilité sur la date",
      required: true,
      options: [
        { value: "exacte", label: "Date exacte" },
        { value: "semaine", label: "Dans la semaine" },
        { value: "mois", label: "Dans le mois" },
        { value: "flexible", label: "Flexible" }
      ]
    },
    {
      name: "horaire",
      type: "select",
      label: "Horaire préféré",
      required: true,
      options: [
        { value: "matin", label: "Matin (8h-12h)" },
        { value: "apres-midi", label: "Après-midi (13h-17h)" },
        { value: "journee", label: "Journée complète" },
        { value: "flexible", label: "Flexible" }
      ]
    },
    
    // Étape 6: Contact
    {
      name: "nom",
      type: "text",
      label: "Nom complet",
      required: true
    },
    {
      name: "email",
      type: "email",
      label: "Email",
      required: true
    },
    {
      name: "telephone",
      type: "tel",
      label: "Téléphone",
      required: true
    },
    {
      name: "commentaires",
      type: "textarea",
      label: "Commentaires supplémentaires",
      required: false,
      placeholder: "Informations complémentaires sur votre projet..."
    }
  ]
};

// 📋 Configuration du résumé
export const demenagementSurMesureSummaryConfig: FormSummaryConfig = {
  title: "Résumé de votre demande de déménagement sur mesure",
  sections: [
    {
      title: "Informations générales",
      fields: [
        { key: "typeDemenagement", label: "Type de déménagement" },
        { key: "surface", label: "Surface", suffix: " m²" },
        { key: "nombrePieces", label: "Nombre de pièces" }
      ]
    },
    {
      title: "Adresses",
      fields: [
        { key: "adresseDepart", label: "Adresse de départ" },
        { key: "adresseArrivee", label: "Adresse d'arrivée" },
        { key: "distanceEstimee", label: "Distance estimée", suffix: " km" }
      ]
    },
    {
      title: "Mobilier et objets",
      fields: [
        { key: "volumeEstime", label: "Volume estimé" },
        { key: "meubles", label: "Types de meubles", type: "array" },
        { key: "electromenager", label: "Électroménager", type: "array" },
        { key: "objetsFragiles", label: "Objets fragiles", type: "array" }
      ]
    },
    {
      title: "Services optionnels",
      fields: [
        { key: "emballage", label: "Service d'emballage", type: "boolean" },
        { key: "montage", label: "Montage/Démontage", type: "boolean" },
        { key: "nettoyage", label: "Nettoyage", type: "boolean" },
        { key: "stockage", label: "Stockage temporaire", type: "boolean" },
        { key: "assurance", label: "Assurance", type: "boolean" }
      ]
    },
    {
      title: "Planification",
      fields: [
        { key: "dateSouhaitee", label: "Date souhaitée" },
        { key: "flexibilite", label: "Flexibilité" },
        { key: "horaire", label: "Horaire préféré" }
      ]
    },
    {
      title: "Contact",
      fields: [
        { key: "nom", label: "Nom complet" },
        { key: "email", label: "Email" },
        { key: "telephone", label: "Téléphone" }
      ]
    }
  ]
};

// 🎯 Preset complet
export const DemenagementSurMesurePreset: PresetConfig = {
  form: demenagementSurMesureForm,
  defaultValues: demenagementSurMesureDefaultValues,
  meta: {
    title: "Déménagement Sur Mesure",
    description: "Service de déménagement personnalisé selon vos besoins",
    icon: "truck",
    color: "#3498DB"
  },
  validation: createServiceValidation('demenagement-sur-mesure'),
  summary: demenagementSurMesureSummaryConfig,
  styles: demenagementSurMesureStyles
};

// Export par défaut
export default DemenagementSurMesurePreset; 