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

// 📝 Valeurs par défaut pour les formulaires de ménage sur mesure
export const menageSurMesureDefaultValues = {
  // Informations générales
  typeLieu: "",
  surface: "",
  nombrePieces: "",
  etage: "0",
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
  typeFrequence: "",
  datePremierNettoyage: "",
  horaireSouhaite: "",
  dureeEstimee: "",
  
  // Produits et équipements
  produitsFournis: false,
  produitsEcologiques: false,
  equipementsSpecifiques: [],
  preferencesProduits: "",
  
  // Contraintes et accès
  acces: "",
  parking: false,
  contraintesHoraires: "",
  presenceRequise: false,
  
  // Contact
  nom: "",
  email: "",
  telephone: "",
  adresse: "",
  commentaires: ""
};

// 🎨 Styles CSS
export const menageSurMesureStyles = "";

// 📋 Configuration du formulaire
export const menageSurMesureForm = {
  fields: [
    // Étape 1: Informations générales
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
      min: 1,
      max: 2000
    },
    {
      name: "nombrePieces",
      type: "number",
      label: "Nombre de pièces",
      required: true,
      min: 1,
      max: 50
    },
    {
      name: "etage",
      type: "number",
      label: "Étage",
      required: false,
      min: 0,
      max: 50
    },
    {
      name: "ascenseur",
      type: "checkbox",
      label: "Ascenseur disponible",
      required: false
    },
    
    // Étape 2: Types de nettoyage
    {
      name: "nettoyageGeneral",
      type: "checkbox",
      label: "Nettoyage général",
      required: false
    },
    {
      name: "nettoyageProfond",
      type: "checkbox",
      label: "Nettoyage en profondeur",
      required: false
    },
    {
      name: "nettoyageVitres",
      type: "checkbox",
      label: "Nettoyage des vitres",
      required: false
    },
    {
      name: "nettoyageSols",
      type: "checkbox",
      label: "Nettoyage des sols",
      required: false
    },
    {
      name: "nettoyageSalleBain",
      type: "checkbox",
      label: "Nettoyage salle de bain",
      required: false
    },
    {
      name: "nettoyageCuisine",
      type: "checkbox",
      label: "Nettoyage cuisine",
      required: false
    },
    {
      name: "nettoyageMeubles",
      type: "checkbox",
      label: "Nettoyage des meubles",
      required: false
    },
    {
      name: "nettoyageElectromenager",
      type: "checkbox",
      label: "Nettoyage électroménager",
      required: false
    },
    {
      name: "nettoyageExterieur",
      type: "checkbox",
      label: "Nettoyage extérieur",
      required: false
    },
    
    // Étape 3: Fréquence et planification
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
      min: new Date().toISOString().split('T')[0]
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
    },
    
    // Étape 4: Produits et équipements
    {
      name: "produitsFournis",
      type: "checkbox",
      label: "Produits fournis par le prestataire",
      required: false
    },
    {
      name: "produitsEcologiques",
      type: "checkbox",
      label: "Produits écologiques",
      required: false
    },
    {
      name: "equipementsSpecifiques",
      type: "checkbox-group",
      label: "Équipements spécifiques",
      required: false,
      options: [
        { value: "aspirateur", label: "Aspirateur" },
        { value: "balai-vapeur", label: "Balai vapeur" },
        { value: "monte-charge", label: "Monte-charge" },
        { value: "echelle", label: "Échelle" },
        { value: "autre", label: "Autre" }
      ]
    },
    {
      name: "preferencesProduits",
      type: "textarea",
      label: "Préférences particulières",
      required: false,
      placeholder: "Produits spécifiques, allergies, contraintes..."
    },
    
    // Étape 5: Contraintes et accès
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
      required: false
    },
    {
      name: "contraintesHoraires",
      type: "textarea",
      label: "Contraintes horaires",
      required: false,
      placeholder: "Horaires d'accès, contraintes particulières..."
    },
    {
      name: "presenceRequise",
      type: "checkbox",
      label: "Présence requise pendant le nettoyage",
      required: false
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
      name: "adresse",
      type: "address",
      label: "Adresse du lieu à nettoyer",
      required: true
    },
    {
      name: "commentaires",
      type: "textarea",
      label: "Commentaires supplémentaires",
      required: false,
      placeholder: "Informations complémentaires sur vos besoins..."
    }
  ]
};

// 📋 Configuration du résumé
export const menageSurMesureSummaryConfig: FormSummaryConfig = {
  title: "Résumé de votre demande de ménage sur mesure",
  sections: [
    {
      title: "Informations générales",
      fields: [
        { key: "typeLieu", label: "Type de lieu" },
        { key: "surface", label: "Surface", suffix: " m²" },
        { key: "nombrePieces", label: "Nombre de pièces" }
      ]
    },
    {
      title: "Types de nettoyage",
      fields: [
        { key: "nettoyageGeneral", label: "Nettoyage général", type: "boolean" },
        { key: "nettoyageProfond", label: "Nettoyage en profondeur", type: "boolean" },
        { key: "nettoyageVitres", label: "Nettoyage des vitres", type: "boolean" },
        { key: "nettoyageSols", label: "Nettoyage des sols", type: "boolean" },
        { key: "nettoyageSalleBain", label: "Nettoyage salle de bain", type: "boolean" },
        { key: "nettoyageCuisine", label: "Nettoyage cuisine", type: "boolean" },
        { key: "nettoyageMeubles", label: "Nettoyage des meubles", type: "boolean" },
        { key: "nettoyageElectromenager", label: "Nettoyage électroménager", type: "boolean" },
        { key: "nettoyageExterieur", label: "Nettoyage extérieur", type: "boolean" }
      ]
    },
    {
      title: "Fréquence et planification",
      fields: [
        { key: "typeFrequence", label: "Type de fréquence" },
        { key: "datePremierNettoyage", label: "Date du premier nettoyage" },
        { key: "horaireSouhaite", label: "Horaire souhaité" },
        { key: "dureeEstimee", label: "Durée estimée" }
      ]
    },
    {
      title: "Produits et équipements",
      fields: [
        { key: "produitsFournis", label: "Produits fournis", type: "boolean" },
        { key: "produitsEcologiques", label: "Produits écologiques", type: "boolean" },
        { key: "equipementsSpecifiques", label: "Équipements spécifiques", type: "array" }
      ]
    },
    {
      title: "Contraintes et accès",
      fields: [
        { key: "acces", label: "Type d'accès" },
        { key: "parking", label: "Parking disponible", type: "boolean" },
        { key: "presenceRequise", label: "Présence requise", type: "boolean" }
      ]
    },
    {
      title: "Contact",
      fields: [
        { key: "nom", label: "Nom complet" },
        { key: "email", label: "Email" },
        { key: "telephone", label: "Téléphone" },
        { key: "adresse", label: "Adresse" }
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