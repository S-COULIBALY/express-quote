"use client";

import React from "react";
import { FormGenerator } from "../FormGenerator";
import { FormConfig } from "../types";
import { useTrustedProviders } from "../components/TrustedProviders";

export const ImprovedLoginExample: React.FC = () => {
  const { googleProvider, microsoftProvider, appleProvider } = useTrustedProviders();

  const config: FormConfig = {
    title: "Connexion",
    description: "Accédez à votre compte Express Quote",
    serviceType: "general",
    layout: {
      type: "auth",
      authOptions: {
        variant: "centered",
        showSecurityBadge: true,
        trustedProviders: {
          enabled: true,
          title: "Ou continuez avec",
          providers: [
            googleProvider(() => alert("Connexion avec Google")),
            microsoftProvider(() => alert("Connexion avec Microsoft")),
            appleProvider(() => alert("Connexion avec Apple"))
          ]
        },
        footerLinks: [
          {
            label: "Mot de passe oublié ?",
            href: "/forgot-password"
          },
          {
            label: "Créer un compte",
            href: "/register"
          }
        ]
      }
    },
    fields: [
      {
        name: "email",
        type: "email",
        label: "Adresse email",
        required: true,
        validation: {
          pattern: "^[^@]+@[^@]+\\.[^@]+$"
        }
      },
      {
        name: "password",
        type: "password",
        label: "Mot de passe",
        required: true,
        validation: {
          min: 6
        }
      },
      {
        name: "rememberMe",
        type: "checkbox",
        label: "Se souvenir de moi"
      }
    ],
    submitLabel: "Se connecter",
    onSubmit: async (data) => {
      console.log("Données de connexion:", data);
      alert(`Connexion avec: ${data.email}`);
    }
  };

  return <FormGenerator config={config} />;
};

export const ImprovedRegisterExample: React.FC = () => {
  const { googleProvider, microsoftProvider, appleProvider } = useTrustedProviders();

  const config: FormConfig = {
    title: "Créer un compte",
    serviceType: "general",
    layout: {
      type: "auth",
      authOptions: {
        variant: "split",
        showSecurityBadge: true,
        trustedProviders: {
          enabled: true,
          title: "Ou inscrivez-vous rapidement avec",
          providers: [
            googleProvider(() => alert("Inscription avec Google")),
            microsoftProvider(() => alert("Inscription avec Microsoft")),
            appleProvider(() => alert("Inscription avec Apple"))
          ]
        },
        footerLinks: [
          {
            label: "Déjà un compte ? Se connecter",
            href: "/login"
          }
        ]
      }
    },
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
        required: true,
        validation: {
          pattern: "^[^@]+@[^@]+\\.[^@]+$"
        }
      },
      {
        name: "password",
        type: "password",
        label: "Mot de passe",
        required: true,
        validation: {
          min: 8
        }
      }
    ],
    submitLabel: "Créer mon compte",
    onSubmit: async (data) => {
      console.log("Données d'inscription:", data);
      alert(`Compte créé pour: ${data.email}`);
    }
  };

  return <FormGenerator config={config} />;
};

export const FormFirstExample: React.FC = () => {
  const { googleProvider, appleProvider } = useTrustedProviders();

  const config: FormConfig = {
    title: "Connexion prioritaire",
    description: "Connectez-vous avec votre email ou utilisez un compte existant",
    serviceType: "general",
    layout: {
      type: "auth",
      authOptions: {
        variant: "minimal",
        showSecurityBadge: false,
        trustedProviders: {
          enabled: true,
          title: "Alternative rapide",
          providers: [
            googleProvider(() => alert("Google OAuth")),
            appleProvider(() => alert("Apple OAuth"))
          ]
        }
      }
    },
    fields: [
      {
        name: "email",
        type: "email",
        label: "Email",
        required: true
      },
      {
        name: "password",
        type: "password",
        label: "Mot de passe",
        required: true
      }
    ],
    submitLabel: "Connexion classique",
    onSubmit: async (data) => {
      console.log("Connexion prioritaire:", data);
      alert(`Connexion prioritaire: ${data.email}`);
    }
  };

  return (
    <div>
      <div className="mb-4 p-2 bg-gray-100 rounded text-sm text-gray-600 text-center">
        🏷️ Service configuré: <span className="font-medium text-blue-600">{config.serviceType}</span>
      </div>
      <FormGenerator config={config} />
    </div>
  );
}; 