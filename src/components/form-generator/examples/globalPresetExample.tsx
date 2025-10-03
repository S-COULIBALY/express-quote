import React from "react";
import { FormGenerator } from "../FormGenerator";
import { globalFormPreset, mergeWithGlobalPreset } from "../presets";
import { FormConfig } from "../types";

// 📚 Exemples d'utilisation du preset global

// 🌍 Exemple 1: Utilisation directe du preset global
export const ExampleWithDirectGlobalPreset: React.FC = () => {
  const config: FormConfig = {
    title: "Formulaire avec preset global",
    description: "Utilise directement la configuration globale",
    globalConfig: globalFormPreset,
    fields: [
      {
        name: "name",
        type: "text",
        label: "Nom complet",
        required: true
      },
      {
        name: "email",
        type: "email",
        label: "Adresse email",
        required: true
      }
    ]
  };

  return <FormGenerator config={config} />;
};

// 🔧 Exemple 2: Customisation partielle du preset global
export const ExampleWithCustomizedGlobalPreset: React.FC = () => {
  const customGlobalConfig = mergeWithGlobalPreset({
    appearance: {
      primaryColor: '#007AFF',      // Bleu iOS au lieu du vert
      secondaryColor: '#0056CC',
      borderRadius: 8               // Coins moins arrondis
    },
    layout: {
      type: 'single-column',        // Une seule colonne
      sidebar: false
    }
  });

  const config: FormConfig = {
    title: "Formulaire personnalisé",
    description: "Preset global avec customisations",
    globalConfig: customGlobalConfig,
    fields: [
      {
        name: "service",
        type: "select",
        label: "Type de service",
        options: [
          { value: "cleaning", label: "Nettoyage" },
          { value: "moving", label: "Déménagement" },
          { value: "delivery", label: "Livraison" }
        ],
        required: true
      },
      {
        name: "date",
        type: "date",
        label: "Date souhaitée",
        required: true
      },
      {
        name: "comments",
        type: "textarea",
        label: "Commentaires additionnels"
      }
    ]
  };

  return <FormGenerator config={config} />;
};

// 🏗️ Exemple 3: Preset global avec layout avancé
export const ExampleWithAdvancedLayout: React.FC = () => {
  const advancedConfig = mergeWithGlobalPreset({
    layout: {
      type: 'two-column',
      mobileFixedHeader: true,
      modalRecap: true,
      mobile: {
        singleColumn: true,
        optionDisplay: 'list'
      }
    },
    uiElements: {
      stickyHeader: true,
      stickySubmit: true,
      headerAppearance: 'blur',
      showServiceIcon: true
    }
  });

  const config: FormConfig = {
    title: "🚛 Devis Déménagement",
    description: "Configuration avancée avec preset global",
    globalConfig: advancedConfig,
    sections: [
      {
        title: "📅 Planification",
        fields: [
          {
            name: "movingDate",
            type: "date",
            label: "Date du déménagement",
            required: true
          },
          {
            name: "volume",
            type: "select",
            label: "Volume estimé",
            options: [
              { value: "small", label: "Petit (< 20m³)" },
              { value: "medium", label: "Moyen (20-40m³)" },
              { value: "large", label: "Grand (> 40m³)" }
            ]
          }
        ]
      },
      {
        title: "📍 Adresses",
        fields: [
          {
            name: "pickupAddress",
            type: "text",
            label: "Adresse de départ",
            required: true
          },
          {
            name: "deliveryAddress",
            type: "text",
            label: "Adresse d'arrivée",
            required: true
          }
        ]
      },
      {
        title: "📱 Contact",
        fields: [
          {
            name: "email",
            type: "email",
            label: "Email",
            required: true
          },
          {
            name: "phone",
            type: "text",
            label: "Téléphone",
            required: true
          }
        ]
      }
    ],
    onSubmit: async (data) => {
      console.log("Données soumises:", data);
      // Traitement des données...
    }
  };

  return <FormGenerator config={config} />;
};

// 🎨 Exemple 4: Thème sombre avec preset global
export const ExampleWithDarkTheme: React.FC = () => {
  const darkThemeConfig = mergeWithGlobalPreset({
    appearance: {
      theme: 'dark',
      primaryColor: '#32D74B',      // Vert iOS mode sombre
      secondaryColor: '#30D158',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display"',
      borderRadius: 12,
      elevation: 'high'
    },
    accessibility: {
      keyboardNavigation: true,
      focusRing: true,
      screenReaderSupport: true
    }
  });

  const config: FormConfig = {
    title: "Formulaire thème sombre",
    description: "Exemple avec thème sombre et accessibilité",
    globalConfig: darkThemeConfig,
    fields: [
      {
        name: "username",
        type: "text",
        label: "Nom d'utilisateur",
        required: true
      },
      {
        name: "preferences",
        type: "checkbox",
        label: "Recevoir les notifications"
      }
    ]
  };

  return <FormGenerator config={config} />;
};

// 📱 Exemple 5: Configuration mobile-first
export const ExampleMobileFirst: React.FC = () => {
  const mobileConfig = mergeWithGlobalPreset({
    layout: {
      type: 'single-column',
      mobileFixedHeader: true,
      modalRecap: true,
      mobile: {
        singleColumn: true,
        optionDisplay: 'list'
      }
    },
    uiElements: {
      stickySubmit: true,
      submitButtonPosition: 'bottom',
      submitButtonStyle: 'flat'
    },
    interactions: {
      tapEffects: true,
      hoverEffects: false  // Désactiver sur mobile
    }
  });

  const config: FormConfig = {
    title: "📱 Formulaire Mobile",
    description: "Optimisé pour mobile avec preset global",
    globalConfig: mobileConfig,
    fields: [
      {
        name: "location",
        type: "text",
        label: "Votre ville"
      },
      {
        name: "urgency",
        type: "radio",
        label: "Urgence",
        options: [
          { value: "low", label: "Pas urgent" },
          { value: "medium", label: "Urgent" },
          { value: "high", label: "Très urgent" }
        ]
      }
    ]
  };

  return <FormGenerator config={config} />;
};

// 🔄 Exemple 6: Utilisation avec un preset existant + global
export const ExampleMixedWithExistingPreset: React.FC = () => {
  const mixedConfig: FormConfig = {
    title: "Nettoyage Premium",
    description: "Combine preset existant + configuration globale",
    preset: "cleaning",           // ✅ Preset existant
    globalConfig: globalFormPreset, // ✅ + Configuration globale
    fields: [
      {
        name: "roomCount",
        type: "number",
        label: "Nombre de pièces",
        required: true
      },
      {
        name: "services",
        type: "checkbox",
        label: "Services additionnels"
      }
    ]
  };

  return <FormGenerator config={mixedConfig} />;
};

// 📖 Documentation d'usage
export const GlobalPresetDocumentation = () => {
  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">🌍 Documentation du Preset Global</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-green-600">✅ Avantages</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Évite la duplication de configuration</li>
            <li>Cohérence visuelle à travers tous les formulaires</li>
            <li>Configuration centralisée et maintenable</li>
            <li>Support automatique des thèmes iOS et Material</li>
            <li>Accessibilité intégrée par défaut</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-blue-600">🔧 Utilisation</h3>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// Import du preset
import { globalFormPreset, mergeWithGlobalPreset } from '@/components/form-generator';

// Utilisation directe
const config = {
  globalConfig: globalFormPreset,
  fields: [...]
};

// Customisation
const customConfig = mergeWithGlobalPreset({
  appearance: { primaryColor: '#007AFF' }
});`}
          </pre>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-purple-600">🎨 Personnalisation</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Layout:</strong> colonnes, sidebar, mobile/desktop</li>
            <li><strong>Apparence:</strong> couleurs, polices, bordures, thème</li>
            <li><strong>UI:</strong> boutons, headers, animations</li>
            <li><strong>Accessibilité:</strong> navigation clavier, lecteurs d'écran</li>
          </ul>
        </div>
      </div>
    </div>
  );
}; 