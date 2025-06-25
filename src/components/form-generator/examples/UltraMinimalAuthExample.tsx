"use client";

import React from "react";
import { FormGenerator } from "../FormGenerator";
import { FormConfig } from "../types";
import { useTrustedProviders } from "../components/TrustedProviders";

export const UltraMinimalRegisterExample: React.FC = () => {
  const { googleProvider, microsoftProvider, appleProvider } = useTrustedProviders();

  const config: FormConfig = {
    title: "Créer un compte",
    layout: {
      type: "auth",
      authOptions: {
        variant: "centered",
        showSecurityBadge: false,
        trustedProviders: {
          enabled: true,
          title: "Ou continuez avec",
          providers: [
            googleProvider(() => alert("Inscription Google")),
            microsoftProvider(() => alert("Inscription Microsoft")),
            appleProvider(() => alert("Inscription Apple"))
          ]
        }
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
        label: "Email",
        required: true
      },
      {
        name: "password",
        type: "password",
        label: "Mot de passe",
        required: true,
        validation: {
          min: 6
        }
      }
    ],
    submitLabel: "Créer",
    onSubmit: async (data) => {
      console.log("Inscription ultra-minimaliste:", data);
      alert(`Compte créé pour: ${data.email}`);
    }
  };

  return <FormGenerator config={config} />;
};

export const UltraMinimalLoginExample: React.FC = () => {
  const { googleProvider, appleProvider } = useTrustedProviders();

  const config: FormConfig = {
    title: "Connexion",
    layout: {
      type: "auth",
      authOptions: {
        variant: "minimal",
        showSecurityBadge: false,
        trustedProviders: {
          enabled: true,
          title: "Ou utilisez",
          providers: [
            googleProvider(() => alert("Google")),
            appleProvider(() => alert("Apple"))
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
    submitLabel: "Connexion",
    onSubmit: async (data) => {
      console.log("Connexion ultra-minimaliste:", data);
      alert(`Connexion: ${data.email}`);
    }
  };

  return <FormGenerator config={config} />;
};

export const UltraMinimalForgotExample: React.FC = () => {
  const config: FormConfig = {
    title: "Mot de passe oublié",
    layout: {
      type: "auth",
      authOptions: {
        variant: "minimal",
        showSecurityBadge: false,
        footerLinks: [
          {
            label: "Retour",
            href: "/login"
          }
        ]
      }
    },
    fields: [
      {
        name: "email",
        type: "email",
        label: "Email",
        required: true
      }
    ],
    submitLabel: "Envoyer",
    onSubmit: async (data) => {
      console.log("Récupération:", data);
      alert(`Lien envoyé à: ${data.email}`);
    }
  };

  return <FormGenerator config={config} />;
}; 