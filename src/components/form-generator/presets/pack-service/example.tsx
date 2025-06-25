"use client";

import React from "react";
import { FormGenerator } from "../../FormGenerator";
import { FormConfig, PackageOption } from "../../types";

// Définition des packages de services prédéfinis
const movingPackages: PackageOption[] = [
  {
    id: "essential",
    name: "Pack Essentiel",
    description: "Services de base pour un déménagement simple",
    price: 299,
    originalPrice: 399,
    badge: "Économique",
    features: [
      "Transport standard",
      "Emballage de base",
      "Portage jusqu'au 2ème étage",
      "Assurance responsabilité civile",
      "1 déménageur"
    ],
    icon: "📦",
    customizable: true,
    customizationFields: [
      {
        name: "extraWorkers",
        type: "number",
        label: "Déménageurs supplémentaires",
        validation: { min: 0, max: 3 },
        defaultValue: 0
      },
      {
        name: "packingLevel",
        type: "select",
        label: "Niveau d'emballage",
        options: [
          { value: "basic", label: "Emballage de base (inclus)" },
          { value: "premium", label: "Emballage premium (+50€)" },
          { value: "luxury", label: "Emballage luxe (+120€)" }
        ],
        defaultValue: "basic"
      }
    ]
  },
  {
    id: "premium",
    name: "Pack Premium",
    description: "Solution complète avec services additionnels",
    price: 599,
    originalPrice: 749,
    popular: true,
    features: [
      "Transport express",
      "Emballage premium",
      "Portage tous étages",
      "Assurance tous risques",
      "2 déménageurs expérimentés",
      "Démontage/remontage meubles",
      "Protection sols et murs"
    ],
    icon: "⭐",
    customizable: true,
    customizationFields: [
      {
        name: "storageOption",
        type: "checkbox",
        label: "Garde-meuble temporaire (1 mois gratuit)",
        defaultValue: false
      },
      {
        name: "cleaningService",
        type: "select",
        label: "Service de ménage",
        options: [
          { value: "none", label: "Aucun" },
          { value: "basic", label: "Ménage de base (+80€)" },
          { value: "deep", label: "Grand ménage (+150€)" }
        ],
        defaultValue: "none"
      },
      {
        name: "timeSlot",
        type: "radio",
        label: "Créneau horaire",
        options: [
          { value: "morning", label: "Matin (8h-12h)" },
          { value: "afternoon", label: "Après-midi (14h-18h)" },
          { value: "evening", label: "Soir (18h-20h) +30€" }
        ],
        defaultValue: "morning"
      }
    ]
  },
  {
    id: "luxury",
    name: "Pack Luxe",
    description: "Service haut de gamme avec accompagnement personnalisé",
    price: 999,
    features: [
      "Transport VIP avec véhicule dédié",
      "Emballage luxe avec matériaux premium",
      "Équipe de 3 déménageurs experts",
      "Assurance valeur déclarée",
      "Coordinateur dédié",
      "Service de conciergerie",
      "Nettoyage complet inclus",
      "Remise en place complète"
    ],
    icon: "👑",
    customizable: false
  }
];

// Configuration du formulaire pour la personnalisation
const customizationFormConfig: FormConfig = {
  title: "Personnalisation de votre pack",
  description: "Ajustez les options selon vos besoins",
  sections: [
    {
      title: "Options de service",
      fields: [
        {
          name: "date",
          type: "date",
          label: "Date souhaitée",
          required: true
        },
        {
          name: "address",
          type: "address-pickup",
          label: "Adresse de départ",
          required: true
        }
      ]
    },
    {
      title: "Informations supplémentaires",
      fields: [
        {
          name: "notes",
          type: "textarea",
          label: "Commentaires particuliers",
          validation: { max: 500 }
        },
        {
          name: "contact",
          type: "text",
          label: "Téléphone de contact",
          required: true
        }
      ]
    }
  ],
  submitLabel: "Confirmer la personnalisation",
  onSubmit: async (data) => {
    console.log("Données de personnalisation:", data);
    alert("Personnalisation confirmée ! Redirection vers le paiement...");
  }
};

const PackageFormExample: React.FC = () => {
  const handleKeepPackage = (packageId: string, formData: any) => {
    console.log("Package conservé:", packageId, formData);
    alert(`Pack "${movingPackages.find(p => p.id === packageId)?.name}" conservé ! Redirection vers le paiement...`);
  };

  const handleCustomizePackage = (packageId: string, formData: any) => {
    console.log("Package à personnaliser:", packageId, formData);
    // La personnalisation est gérée automatiquement par le PackageLayout
  };

  const packageFormConfig: FormConfig = {
    title: "Choisissez votre pack de déménagement",
    description: "Sélectionnez le forfait qui correspond le mieux à vos besoins",
    serviceType: "moving",
    layout: {
      type: "package",
      packageOptions: {
        packages: movingPackages,
        onKeepPackage: handleKeepPackage,
        onCustomizePackage: handleCustomizePackage,
        customizationTitle: "Personnalisez votre pack de déménagement"
      }
    },
    ...customizationFormConfig // Merge la config de personnalisation
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
            📦 Service: {packageFormConfig.serviceType} - Sélection de pack
          </span>
        </div>
      </div>
      <FormGenerator config={packageFormConfig} />
    </div>
  );
};

export default PackageFormExample; 