import React from "react";
import { FormGenerator } from "../FormGenerator";
import { globalFormPreset, mergeWithGlobalPreset } from "../presets";
import { FormConfig } from "../types";

// 🆕 Nouveaux formulaires utilisant le preset global

// 📱 Formulaire de contact avec preset global
export const ContactFormWithGlobal: React.FC = () => {
  const config: FormConfig = {
    title: "Nous contacter",
    description: "Une question ? Un projet ? Parlons-en !",
    globalConfig: globalFormPreset,
    sections: [
      {
        title: "Vos informations",
        fields: [
          {
            name: "firstName",
            type: "text",
            label: "Prénom",
            required: true
          },
          {
            name: "lastName", 
            type: "text",
            label: "Nom",
            required: true
          },
          {
            name: "email",
            type: "email",
            label: "Adresse email",
            required: true
          },
          {
            name: "phone",
            type: "text",
            label: "Téléphone"
          }
        ]
      },
      {
        title: "Votre demande",
        fields: [
          {
            name: "subject",
            type: "select",
            label: "Sujet",
            required: true,
            options: [
              { value: "quote", label: "Demande de devis" },
              { value: "info", label: "Demande d'information" },
              { value: "support", label: "Support technique" },
              { value: "partnership", label: "Partenariat" },
              { value: "other", label: "Autre" }
            ]
          },
          {
            name: "message",
            type: "textarea",
            label: "Votre message",
            required: true
          },
          {
            name: "newsletter",
            type: "checkbox",
            label: "Recevoir notre newsletter"
          },
          {
            name: "consent",
            type: "checkbox",
            label: "J'accepte les conditions d'utilisation",
            required: true
          }
        ]
      }
    ],
    onSubmit: async (data) => {
      console.log("Contact form submitted:", data);
      // Traitement du formulaire de contact
    }
  };

  return <FormGenerator config={config} />;
};

// 🎨 Formulaire d'inscription avec thème personnalisé
export const RegistrationFormWithCustomTheme: React.FC = () => {
  const customConfig = mergeWithGlobalPreset({
    appearance: {
      primaryColor: '#007AFF',
      secondaryColor: '#0056CC',
      borderRadius: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display"'
    },
    layout: {
      type: 'single-column',
      sidebar: false,
      labelPosition: 'top'
    },
    uiElements: {
      submitButtonStyle: 'filled',
      showBackButton: false,
      confirmationOnSubmit: true
    }
  });

  const config: FormConfig = {
    title: "Créer un compte",
    description: "Rejoignez notre plateforme en quelques clics",
    globalConfig: customConfig,
    sections: [
      {
        title: "Informations personnelles",
        fields: [
          {
            name: "firstName",
            type: "text",
            label: "Prénom",
            required: true
          },
          {
            name: "lastName",
            type: "text", 
            label: "Nom",
            required: true
          },
          {
            name: "email",
            type: "email",
            label: "Adresse email",
            required: true
          },
          {
            name: "password",
            type: "password",
            label: "Mot de passe",
            required: true
          },
          {
            name: "confirmPassword",
            type: "password",
            label: "Confirmer le mot de passe",
            required: true
          }
        ]
      },
      {
        title: "Préférences",
        fields: [
          {
            name: "language",
            type: "select",
            label: "Langue préférée",
            defaultValue: "fr",
            options: [
              { value: "fr", label: "Français" },
              { value: "en", label: "English" },
              { value: "es", label: "Español" }
            ]
          },
          {
            name: "notifications",
            type: "checkbox",
            label: "Recevoir les notifications par email"
          },
          {
            name: "terms",
            type: "checkbox",
            label: "J'accepte les conditions générales d'utilisation",
            required: true
          }
        ]
      }
    ],
    onSubmit: async (data) => {
      console.log("Registration form submitted:", data);
      // Traitement de l'inscription
    }
  };

  return <FormGenerator config={config} />;
};

// 📦 Formulaire de retour/feedback avec preset global
export const FeedbackFormWithGlobal: React.FC = () => {
  const feedbackConfig = mergeWithGlobalPreset({
    appearance: {
      primaryColor: '#FF6B6B',
      secondaryColor: '#FF5252'
    },
    layout: {
      type: 'two-column',
      mobile: {
        singleColumn: true,
        optionDisplay: 'list'
      }
    }
  });

  const config: FormConfig = {
    title: "💬 Votre avis compte",
    description: "Aidez-nous à améliorer nos services",
    globalConfig: feedbackConfig,
    fields: [
      {
        name: "rating",
        type: "radio",
        label: "Note globale",
        required: true,
        options: [
          { value: "5", label: "⭐⭐⭐⭐⭐ Excellent" },
          { value: "4", label: "⭐⭐⭐⭐ Très bien" },
          { value: "3", label: "⭐⭐⭐ Bien" },
          { value: "2", label: "⭐⭐ Passable" },
          { value: "1", label: "⭐ Décevant" }
        ]
      },
      {
        name: "category",
        type: "select",
        label: "Catégorie",
        required: true,
        options: [
          { value: "service", label: "Qualité du service" },
          { value: "price", label: "Rapport qualité/prix" },
          { value: "speed", label: "Rapidité d'exécution" },
          { value: "communication", label: "Communication" },
          { value: "website", label: "Site web" },
          { value: "other", label: "Autre" }
        ]
      },
      {
        name: "positive",
        type: "textarea",
        label: "Ce qui vous a plu ?"
      },
      {
        name: "improvements",
        type: "textarea",
        label: "Que pourrions-nous améliorer ?"
      },
      {
        name: "recommend",
        type: "radio",
        label: "Nous recommanderiez-vous ?",
        required: true,
        options: [
          { value: "yes", label: "👍 Oui, certainement" },
          { value: "maybe", label: "🤔 Peut-être" },
          { value: "no", label: "👎 Non" }
        ]
      },
      {
        name: "email",
        type: "email",
        label: "Email (optionnel)",
        validation: {
          required: false
        }
      }
    ],
    onSubmit: async (data) => {
      console.log("Feedback submitted:", data);
      // Traitement du feedback
    }
  };

  return <FormGenerator config={config} />;
};

// 🚚 Formulaire de livraison express avec preset global
export const ExpressDeliveryForm: React.FC = () => {
  const expressConfig = mergeWithGlobalPreset({
    appearance: {
      primaryColor: '#FF9500',
      secondaryColor: '#FF8C00',
      borderRadius: 16
    },
    layout: {
      type: 'two-column',
      sidebar: true,
      mobileFixedHeader: true
    },
    uiElements: {
      stickySubmit: true,
      submitButtonStyle: 'flat',
      headerAppearance: 'blur'
    }
  });

  const config: FormConfig = {
    title: "🚚 Livraison Express",
    description: "Commandez votre livraison en urgence",
    globalConfig: expressConfig,
    sections: [
      {
        title: "📦 Votre colis",
        fields: [
          {
            name: "packageType",
            type: "select",
            label: "Type de colis",
            required: true,
            options: [
              { value: "envelope", label: "📄 Enveloppe/Document" },
              { value: "small", label: "📦 Petit colis (< 5kg)" },
              { value: "medium", label: "📦 Colis moyen (5-20kg)" },
              { value: "large", label: "📦 Gros colis (> 20kg)" },
              { value: "fragile", label: "💎 Objet fragile" }
            ]
          },
          {
            name: "weight",
            type: "number",
            label: "Poids approximatif (kg)"
          },
          {
            name: "dimensions",
            type: "text",
            label: "Dimensions (L x l x h en cm)"
          },
          {
            name: "value",
            type: "number",
            label: "Valeur déclarée (€)"
          }
        ]
      },
      {
        title: "📍 Adresses",
        fields: [
          {
            name: "pickupAddress",
            type: "text",
            label: "Adresse de collecte",
            required: true
          },
          {
            name: "deliveryAddress",
            type: "text",
            label: "Adresse de livraison",
            required: true
          },
          {
            name: "urgency",
            type: "radio",
            label: "Urgence",
            required: true,
            options: [
              { value: "same-day", label: "⚡ Même jour (+50€)" },
              { value: "next-day", label: "🌅 Lendemain (+20€)" },
              { value: "express", label: "🚀 Express 48h (+10€)" }
            ]
          }
        ]
      },
      {
        title: "📱 Contact",
        fields: [
          {
            name: "contactName",
            type: "text",
            label: "Nom du contact",
            required: true
          },
          {
            name: "phone",
            type: "text",
            label: "Téléphone",
            required: true
          },
          {
            name: "email",
            type: "email",
            label: "Email",
            required: true
          },
          {
            name: "instructions",
            type: "textarea",
            label: "Instructions spéciales"
          }
        ]
      }
    ],
    onSubmit: async (data) => {
      console.log("Express delivery submitted:", data);
      // Traitement de la commande express
    }
  };

  return <FormGenerator config={config} />;
};

// 🏠 Formulaire d'estimation immobilière avec preset global
export const PropertyEstimationForm: React.FC = () => {
  const propertyConfig = mergeWithGlobalPreset({
    appearance: {
      primaryColor: '#8B5CF6',
      secondaryColor: '#7C3AED',
      borderRadius: 20
    },
    layout: {
      type: 'two-column',
      sidebar: true,
      showSteps: false
    },
    uiElements: {
      showServiceIcon: true,
      stickyHeader: true
    }
  });

  const config: FormConfig = {
    title: "🏠 Estimation Immobilière",
    description: "Obtenez une estimation gratuite de votre bien",
    globalConfig: propertyConfig,
    sections: [
      {
        title: "🏘️ Le bien",
        fields: [
          {
            name: "propertyType",
            type: "radio",
            label: "Type de bien",
            required: true,
            options: [
              { value: "apartment", label: "🏢 Appartement" },
              { value: "house", label: "🏠 Maison" },
              { value: "studio", label: "🏠 Studio" },
              { value: "loft", label: "🏭 Loft" },
              { value: "commercial", label: "🏪 Commercial" }
            ]
          },
          {
            name: "surface",
            type: "number",
            label: "Surface habitable (m²)",
            required: true
          },
          {
            name: "rooms",
            type: "number",
            label: "Nombre de pièces",
            required: true
          },
          {
            name: "bedrooms",
            type: "number",
            label: "Nombre de chambres"
          },
          {
            name: "floor",
            type: "number",
            label: "Étage"
          },
          {
            name: "elevator",
            type: "checkbox",
            label: "Ascenseur"
          }
        ]
      },
      {
        title: "📍 Localisation",
        fields: [
          {
            name: "address",
            type: "text",
            label: "Adresse complète",
            required: true
          },
          {
            name: "district",
            type: "text",
            label: "Quartier"
          },
          {
            name: "proximityTransport",
            type: "checkbox",
            label: "Proche transports en commun"
          },
          {
            name: "proximityShops",
            type: "checkbox",
            label: "Proche commerces"
          }
        ]
      },
      {
        title: "🏗️ Caractéristiques",
        fields: [
          {
            name: "yearBuilt",
            type: "number",
            label: "Année de construction"
          },
          {
            name: "condition",
            type: "select",
            label: "État général",
            options: [
              { value: "excellent", label: "Excellent" },
              { value: "good", label: "Bon" },
              { value: "average", label: "Moyen" },
              { value: "poor", label: "À rénover" }
            ]
          },
          {
            name: "parking",
            type: "checkbox",
            label: "Place de parking"
          },
          {
            name: "balcony",
            type: "checkbox",
            label: "Balcon/Terrasse"
          },
          {
            name: "garden",
            type: "checkbox",
            label: "Jardin"
          }
        ]
      }
    ],
    onSubmit: async (data) => {
      console.log("Property estimation submitted:", data);
      // Traitement de l'estimation
    }
  };

  return <FormGenerator config={config} />;
}; 