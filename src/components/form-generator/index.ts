// 🧠 Composant principal
export { FormGenerator } from "./FormGenerator";

// 📦 Types
export * from "./types";

// 🧩 Composants individuels
export * from "./components";

// 🎨 Layouts
export * from "./layouts";

// ⚙️ Presets
export * from "./presets";

// 🎨 Styles
export { FormStyles } from "./styles/FormStyles";

// 🛠 Utilitaires
export * from "./utils";

// 🚀 Exports de convenance pour migration facile
export type { 
  FormConfig, 
  FormField, 
  FormSection, 
  FormGeneratorProps,
  FormSummaryConfig,
  PresetConfig,
  IndustryPreset
} from "./types"; 