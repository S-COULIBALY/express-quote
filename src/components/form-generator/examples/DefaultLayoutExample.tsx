"use client";

import React from "react";
import { FormGenerator } from "../FormGenerator";
import { FormConfig } from "../types";

export const SimpleFormExample: React.FC = () => {
  const config: FormConfig = {
    title: "Formulaire Simple",
    description: "Exemple basique avec le layout par défaut",
    layout: {
      type: "default"
    },
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
      },
      {
        name: "message",
        type: "textarea",
        label: "Votre message",
        required: true
      }
    ],
    submitLabel: "Envoyer",
    onSubmit: async (data) => {
      console.log("Formulaire simple:", data);
      alert(`Merci ${data.name} ! Votre message a été envoyé.`);
    }
  };

  return <FormGenerator config={config} />;
};

export const BusinessFormExample: React.FC = () => {
  const config: FormConfig = {
    title: "Demande Professionnelle",
    description: "Formulaire avec sections pour les entreprises",
    layout: {
      type: "default"
    },
    sections: [
      {
        title: "Informations de l'entreprise",
        fields: [
          {
            name: "companyName",
            type: "text",
            label: "Nom de l'entreprise",
            required: true
          },
          {
            name: "industry",
            type: "select",
            label: "Secteur d'activité",
            required: true,
            options: [
              { value: "tech", label: "Technologie" },
              { value: "retail", label: "Commerce de détail" },
              { value: "services", label: "Services" },
              { value: "manufacturing", label: "Industrie" },
              { value: "other", label: "Autre" }
            ]
          },
          {
            name: "employees",
            type: "select",
            label: "Nombre d'employés",
            required: true,
            options: [
              { value: "1-10", label: "1-10 employés" },
              { value: "11-50", label: "11-50 employés" },
              { value: "51-200", label: "51-200 employés" },
              { value: "200+", label: "Plus de 200 employés" }
            ]
          }
        ]
      },
      {
        title: "Contact principal",
        fields: [
          {
            name: "contactName",
            type: "text",
            label: "Nom du contact",
            required: true
          },
          {
            name: "contactEmail",
            type: "email",
            label: "Email professionnel",
            required: true
          },
          {
            name: "contactPhone",
            type: "text",
            label: "Téléphone",
            required: true
          }
        ]
      },
      {
        title: "Demande",
        fields: [
          {
            name: "serviceType",
            type: "radio",
            label: "Type de service souhaité",
            required: true,
            options: [
              { value: "quote", label: "Demande de devis" },
              { value: "demo", label: "Démonstration produit" },
              { value: "partnership", label: "Partenariat" },
              { value: "support", label: "Support technique" }
            ]
          },
          {
            name: "budget",
            type: "select",
            label: "Budget approximatif",
            options: [
              { value: "under-1k", label: "Moins de 1 000€" },
              { value: "1k-5k", label: "1 000€ - 5 000€" },
              { value: "5k-20k", label: "5 000€ - 20 000€" },
              { value: "20k+", label: "Plus de 20 000€" }
            ]
          },
          {
            name: "timeline",
            type: "select",
            label: "Délai souhaité",
            required: true,
            options: [
              { value: "asap", label: "Dès que possible" },
              { value: "1-month", label: "Dans le mois" },
              { value: "3-months", label: "Dans les 3 mois" },
              { value: "6-months", label: "Dans les 6 mois" },
              { value: "flexible", label: "Flexible" }
            ]
          },
          {
            name: "details",
            type: "textarea",
            label: "Détails de votre demande",
            required: true
          }
        ]
      }
    ],
    submitLabel: "Envoyer la demande",
    onSubmit: async (data) => {
      console.log("Demande professionnelle:", data);
      alert(`Merci ${data.contactName} ! Votre demande pour ${data.companyName} a été envoyée.`);
    }
  };

  return <FormGenerator config={config} />;
}; 