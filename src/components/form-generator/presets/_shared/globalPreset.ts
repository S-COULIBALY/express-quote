import { GlobalFormConfig } from "../../types";

// 🌍 Preset global de configuration pour tous les formulaires
// Ce preset évite les duplications en centralisant les configurations communes
//
// 🎨 PALETTE VERTE SOPHISTIQUÉE iOS 18:
// Primary:   #1B5E20 (Forest Green - Vert foncé principal)
// Secondary: #2E7D32 (Green Darken-3 - Vert moyen actif)  
// Accent:    #4CAF50 (Green - Vert clair pour highlights)
// Light:     #C8E6C9 (Green Lighten-4 - Vert très clair)
// Dark:      #0D2818 (Très foncé pour contraste)
export const globalFormPreset: GlobalFormConfig = {
  layout: {
    type: 'two-column',               // 🖥️ 2 colonnes sur desktop
    sidebar: true,                    // 🖥️ Colonne récap à droite (desktop)
    showSteps: false,                 // ❌ Pas de formulaire multi-étapes
    labelPosition: 'top',             // Labels au-dessus des champs
    inputSpacing: 'md',
    sectionSpacing: 'xl',
    maxWidth: '1000px',
    mobileBreakpoint: '768px',

    // 📱 Comportement Mobile
    mobileFixedHeader: true,          // ✅ En-tête fixe (titre + prix)
    modalRecap: true,                 // ✅ Récap en modal sur mobile
    mobile: {
      singleColumn: true,             // ✅ 1 colonne sur mobile
      optionDisplay: 'list'           // ✅ Affichage liste verticale
    },

    // 🖥️ Comportement Desktop
    desktopFixedPriceBox: false,      // ❌ Pas de sticky price sur scroll
    desktopInlineRecap: true          // ✅ Résumé visible directement
  },

  appearance: {
    theme: 'system',                  // Thème clair/sombre automatique
    primaryColor: '#1B5E20',          // 🌲 Vert foncé sophistiqué (Forest Green)
    secondaryColor: '#2E7D32',        // 🌿 Vert moyen pour les états actifs
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display"', // ✅ Police Apple
    fontSize: '16px',
    borderRadius: 14,                 // ✅ Coins très arrondis (iOS 18)
    elevation: 'medium',              // Ombres douces
    fieldStyle: 'outlined',           // Champs avec bordure
    selectionIndicator: {             // ✅ Style iOS
      type: 'ios-checkmark',          // Cochet blanc dans cercle vert
      position: 'top-right'           // Position coin supérieur droit
    },
    transitions: {                    // ✅ Animations ciblées
      hover: true,
      click: true,
      focus: true
    }
  },

  accessibility: {
    keyboardNavigation: true,
    focusRing: true,
    screenReaderSupport: true,
    ariaLabels: true
  },

  uiElements: {
    showTitle: true,
    showBreadcrumbs: false,
    showServiceIcon: true,
    stickyHeader: true,               // ✅ Header collant (mobile)
    stickySubmit: true,               // ✅ Bouton soumission visible
    submitButtonPosition: 'bottom',
    submitButtonStyle: 'flat',        // ✅ Style flat pour le bouton
    includeHelpText: true,
    showBackButton: true,
    confirmationOnSubmit: true,
    headerAppearance: 'blur'          // ✅ Effet de flou iOS sur scroll
  },

  validation: {
    mode: 'onBlur',
    showInlineErrors: true,
    highlightInvalidFields: true,
    errorSummaryAtTop: true
  },

  interactions: {
    autosave: false,
    autosaveInterval: 0,
    livePreview: false,
    hoverEffects: true,               // ✅ Effets au survol
    tapEffects: true                  // ✅ Feedback tactile
  },

  metadata: {
    version: '1.0.4',
    createdBy: 'form-core',
    createdAt: new Date().toISOString(),
    compatibleWith: 'iOS 18 style'
  },

  // ✅ Plus de sharedFields ici - déplacé vers sharedFields.ts pour séparer style et logique
};

// 🛠️ Fonction utilitaire pour fusionner le preset global avec un preset spécifique
export const mergeWithGlobalPreset = (specificConfig: Partial<GlobalFormConfig>): GlobalFormConfig => {
  return {
    layout: { ...globalFormPreset.layout, ...specificConfig.layout },
    appearance: { ...globalFormPreset.appearance, ...specificConfig.appearance },
    accessibility: { ...globalFormPreset.accessibility, ...specificConfig.accessibility },
    uiElements: { ...globalFormPreset.uiElements, ...specificConfig.uiElements },
    validation: { ...globalFormPreset.validation, ...specificConfig.validation },
    interactions: { ...globalFormPreset.interactions, ...specificConfig.interactions },
    metadata: { ...globalFormPreset.metadata, ...specificConfig.metadata },
    // ✅ sharedFields supprimé - géré séparément
  };
}; 