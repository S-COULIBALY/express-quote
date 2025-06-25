"use client";

import React from "react";
import { FormGenerator } from "../FormGenerator";
import { FormConfig } from "../types";
import { useTrustedProviders } from "../components/TrustedProviders";

export const LoginFormExample: React.FC = () => {
  const { googleProvider, microsoftProvider, appleProvider } = useTrustedProviders();

  const loginConfig: FormConfig = {
    title: "Connexion",
    description: "Connectez-vous à votre compte Express Quote",
    layout: {
      type: "auth",
      authOptions: {
        variant: "centered",
        showSecurityBadge: true,
        trustedProviders: {
          enabled: true,
          title: "Ou connectez-vous avec",
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
          },
          {
            label: "Aide",
            href: "/help"
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
      // Ici vous ajouteriez votre logique d'authentification
      alert(`Connexion avec: ${data.email}`);
    }
  };

  return <FormGenerator config={loginConfig} />;
};

export const RegisterFormExample: React.FC = () => {
  const { googleProvider, microsoftProvider, appleProvider } = useTrustedProviders();

  const registerConfig: FormConfig = {
    title: "Créer un compte",
    layout: {
      type: "auth",
      authOptions: {
        variant: "split",
        showSecurityBadge: true,
        backgroundImage: "/images/moving-truck.jpg", // Image d'exemple
        trustedProviders: {
          enabled: true,
          title: "Ou créez un compte avec",
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
          },
          {
            label: "Conditions d'utilisation",
            href: "/terms"
          }
        ]
      }
    },
    sections: [
      {
        title: "Informations personnelles",
        fields: [
          {
            name: "firstName",
            type: "text",
            label: "Prénom",
            required: true,
            columnSpan: 1
          },
          {
            name: "lastName",
            type: "text",
            label: "Nom",
            required: true,
            columnSpan: 1
          },
          {
            name: "email",
            type: "email",
            label: "Adresse email",
            required: true,
            columnSpan: 2,
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
          },
          {
            name: "confirmPassword",
            type: "password",
            label: "Confirmer le mot de passe",
            required: true,
            validation: {
              custom: (value, formData) => 
                value === formData.password || "Les mots de passe ne correspondent pas"
            }
          }
        ],
        columns: 2
      }
    ],
    submitLabel: "Créer mon compte",
    onSubmit: async (data) => {
      console.log("Données d'inscription:", data);
      // Ici vous ajouteriez votre logique d'inscription
      alert(`Compte créé pour: ${data.email}`);
    }
  };

  return <FormGenerator config={registerConfig} />;
};

export const ForgotPasswordFormExample: React.FC = () => {
  const forgotPasswordConfig: FormConfig = {
    title: "Mot de passe oublié",
    description: "Saisissez votre adresse email pour recevoir un lien de réinitialisation",
    layout: {
      type: "auth",
      authOptions: {
        variant: "minimal",
        showSecurityBadge: false,
        footerLinks: [
          {
            label: "Retour à la connexion",
            href: "/login"
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
      }
    ],
    submitLabel: "Envoyer le lien",
    onSubmit: async (data) => {
      console.log("Demande de réinitialisation:", data);
      // Ici vous ajouteriez votre logique de réinitialisation
      alert(`Lien envoyé à: ${data.email}`);
    }
  };

  return <FormGenerator config={forgotPasswordConfig} />;
}; 