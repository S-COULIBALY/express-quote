import { PresetConfig, FormSummaryConfig } from "../../types";

// 📝 Valeurs par défaut génériques
export const defaultValues = {
  email: "",
  phone: "",
  message: "",
  consent: false
};

// 🎨 Styles CSS maintenant intégrés dans globals.css
export const defaultStyles = ""; // Styles déplacés vers globals.css pour éviter les conflits

// 📋 Configuration du récapitulatif par défaut
export const defaultSummaryConfig: FormSummaryConfig = {
  title: "Récapitulatif",
  sections: [
    {
      title: "Informations",
      icon: "📝",
      fields: [
        {
          key: "email",
          label: "Email",
          condition: (value: any) => !!value
        },
        {
          key: "phone",
          label: "Téléphone",
          condition: (value: any) => !!value
        },
        {
          key: "message",
          label: "Message",
          condition: (value: any) => !!value
        }
      ]
    }
  ]
};

// 🎯 Configuration complète du preset par défaut
export const DefaultPreset: PresetConfig = {
  form: {
    title: "Formulaire",
    description: "Veuillez remplir les champs ci-dessous",
    serviceType: "general"
  },
  defaultValues: defaultValues,
  summary: defaultSummaryConfig,
  styles: defaultStyles,
  meta: {
    industry: "default",
    name: "Générique",
    description: "Preset par défaut pour tous types de formulaires",
    version: "1.0.0"
  }
}; 