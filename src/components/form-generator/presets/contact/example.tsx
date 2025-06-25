"use client";

import React from "react";
import { FormGenerator, FormConfig } from "../..";

const contactFormConfig: FormConfig = {
  preset: "contact", // ✨ Utilise automatiquement defaultValues, styles et summary
  title: "Nous Contacter",
  description: "Remplissez ce formulaire et nous vous répondrons rapidement",
  
  layout: {
    type: "sidebar",
    autoSummary: "contact" // Sidebar automatique avec le preset contact
  },

  sections: [
    {
      title: "👤 Informations personnelles",
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
          name: "phone",
          type: "text",
          label: "Téléphone"
        },
        {
          name: "company",
          type: "text",
          label: "Entreprise"
        }
      ]
    },
    
    {
      title: "💬 Votre demande",
      fields: [
        {
          name: "subject",
          type: "select",
          label: "Sujet",
          required: true,
          options: [
            { value: "general", label: "Question générale" },
            { value: "quote", label: "Demande de devis" },
            { value: "support", label: "Support technique" },
            { value: "partnership", label: "Partenariat" },
            { value: "other", label: "Autre" }
          ]
        },
        {
          name: "urgency",
          type: "radio",
          label: "Niveau d'urgence",
          options: [
            { value: "low", label: "Non urgent" },
            { value: "medium", label: "Modéré" },
            { value: "high", label: "Urgent" }
          ]
        },
        {
          name: "message",
          type: "textarea",
          label: "Votre message",
          required: true,
          columnSpan: 2
        }
      ]
    },

    {
      title: "📧 Préférences de contact",
      fields: [
        {
          name: "preferredContact",
          type: "select",
          label: "Moyen de contact préféré",
          options: [
            { value: "email", label: "Email" },
            { value: "phone", label: "Téléphone" },
            { value: "whatsapp", label: "WhatsApp" }
          ]
        },
        {
          name: "newsletter",
          type: "checkbox",
          label: "Je souhaite recevoir la newsletter"
        }
      ]
    }
  ],

  onSubmit: async (data) => {
    console.log("📧 Message de contact:", data);
    alert("✅ Votre message a été envoyé avec succès !");
  },

  submitLabel: "Envoyer le message",
  cancelLabel: "Effacer"
};

export default function ContactFormExample() {
  return <FormGenerator config={contactFormConfig} />;
} 