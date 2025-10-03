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

// 🌍 Preset Global (exports spécifiques)
export { globalFormPreset, mergeWithGlobalPreset } from "./presets";

// 🎨 Styles
export { FormStylesSimplified } from "./styles/FormStylesSimplified";

// 🛠 Utilitaires
export * from "./utils";

// 🔄 Utilitaires de migration
export * from "./utils/migrationHelper";

// 🚀 Exports de convenance pour migration facile
export type { 
  FormConfig, 
  FormField, 
  FormSection, 
  FormGeneratorProps,
  FormSummaryConfig,
  PresetConfig,
  IndustryPreset,
  // 🌍 Types du preset global
  GlobalFormConfig,
  GlobalLayoutConfig,
  GlobalAppearanceConfig,
  GlobalAccessibilityConfig,
  GlobalUIElementsConfig,
  GlobalValidationConfig,
  GlobalInteractionsConfig
} from "./types"; 