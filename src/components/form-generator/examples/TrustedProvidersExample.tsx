"use client";

import React from "react";
import { FormGenerator } from "../FormGenerator";
import { FormConfig } from "../types";
import { useTrustedProviders } from "../components/TrustedProviders";

// Exemple avec providers personnalisés
export const CustomProvidersExample: React.FC = () => {
  const config: FormConfig = {
    title: "Connexion Enterprise",
    description: "Utilisez votre compte professionnel",
    layout: {
      type: "auth",
      authOptions: {
        variant: "centered",
        showSecurityBadge: true,
        trustedProviders: {
          enabled: true,
          title: "Connectez-vous avec votre compte entreprise",
          providers: [
            {
              name: "azure-ad",
              label: "Azure Active Directory",
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#0078d4" d="M12 0L1.608 4.8v7.2c0 6.72 4.608 13.056 10.392 14.4 5.784-1.344 10.392-7.68 10.392-14.4V4.8L12 0z"/>
                </svg>
              ),
              onClick: () => alert("Connexion Azure AD"),
              bgColor: "bg-blue-600",
              textColor: "text-white",
              borderColor: "border-blue-600"
            },
            {
              name: "okta",
              label: "Okta",
              icon: (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <circle fill="#007dc1" cx="12" cy="12" r="12"/>
                  <path fill="white" d="M8 8h8v8H8z"/>
                </svg>
              ),
              onClick: () => alert("Connexion Okta"),
              bgColor: "bg-cyan-600",
              textColor: "text-white",
              borderColor: "border-cyan-600"
            }
          ]
        }
      }
    },
    fields: [
      {
        name: "email",
        type: "email",
        label: "Email professionnel",
        required: true
      },
      {
        name: "password",
        type: "password",
        label: "Mot de passe",
        required: true
      }
    ],
    submitLabel: "Se connecter",
    onSubmit: async (data) => {
      console.log("Connexion entreprise:", data);
    }
  };

  return <FormGenerator config={config} />;
};

// Exemple avec providers par défaut + action personnalisée
export const DefaultProvidersWithActionsExample: React.FC = () => {
  const { googleProvider, microsoftProvider, appleProvider } = useTrustedProviders();

  const handleProviderAuth = (provider: string) => {
    // Ici vous ajouteriez votre logique d'authentification réelle
    console.log(`Authentification ${provider} déclenchée`);
    
    // Simulation d'une redirection
    if (provider === "google") {
      // window.location.href = "/api/auth/google";
      alert("Redirection vers Google OAuth...");
    } else if (provider === "microsoft") {
      // window.location.href = "/api/auth/microsoft";
      alert("Redirection vers Microsoft OAuth...");
    } else if (provider === "apple") {
      // window.location.href = "/api/auth/apple";
      alert("Redirection vers Apple OAuth...");
    }
  };

  const config: FormConfig = {
    title: "Connexion rapide",
    description: "Accédez à votre compte en un clic",
    layout: {
      type: "auth",
      authOptions: {
        variant: "minimal",
        showSecurityBadge: false,
        trustedProviders: {
          enabled: true,
          title: "Connexion rapide avec",
          providers: [
            googleProvider(() => handleProviderAuth("google")),
            microsoftProvider(() => handleProviderAuth("microsoft")),
            appleProvider(() => handleProviderAuth("apple"))
          ]
        },
        footerLinks: [
          {
            label: "Première visite ? Créer un compte",
            onClick: () => alert("Redirection vers inscription")
          }
        ]
      }
    },
    fields: [],
    submitLabel: "Continuer",
    onSubmit: async () => {
      // Pas de champs, ce formulaire utilise uniquement les providers
    }
  };

  return <FormGenerator config={config} />;
};

// Exemple de formulaire hybride (providers + formulaire traditionnel)
export const HybridFormExample: React.FC = () => {
  const { googleProvider, microsoftProvider } = useTrustedProviders();

  const config: FormConfig = {
    title: "Connexion flexible",
    description: "Choisissez votre méthode de connexion préférée",
    layout: {
      type: "auth",
      authOptions: {
        variant: "centered",
        showSecurityBadge: true,
        trustedProviders: {
          enabled: true,
          title: "Connexion rapide",
          providers: [
            googleProvider(() => alert("Auth Google")),
            microsoftProvider(() => alert("Auth Microsoft"))
          ]
        }
      }
    },
    fields: [
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
        name: "rememberMe",
        type: "checkbox",
        label: "Se souvenir de moi"
      }
    ],
    submitLabel: "Se connecter avec email",
    onSubmit: async (data) => {
      console.log("Connexion email/password:", data);
      alert(`Connexion avec: ${data.email}`);
    }
  };

  return <FormGenerator config={config} />;
}; 