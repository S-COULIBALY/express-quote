"use client";

import React, { useState } from "react";
import { FormGenerator } from "../../FormGenerator";
import { FormConfig, PackageOption } from "../../types";

// Pack prédéfini pour l'édition
const selectedPackageForEdit: PackageOption = {
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
};

// Données initiales préremplies (simule une commande existante)
const initialFormData = {
  storageOption: true,
  cleaningService: "basic",
  timeSlot: "afternoon",
  date: "2024-03-15",
  contact: "06 12 34 56 78",
  notes: "Déménagement d'un appartement T3 au 2ème étage sans ascenseur. Présence de gros électroménager à démonter.",
  address: {
    street: "123 Rue de la Paix",
    city: "Paris",
    zipCode: "75001"
  }
};

const PackageEditExample: React.FC = () => {
  const [isEditing, setIsEditing] = useState(true);

  const handleSave = (packageData: any, formData: any) => {
    console.log("Sauvegarde du package:", packageData);
    console.log("Données du formulaire:", formData);
    alert("Modifications sauvegardées avec succès !");
    setIsEditing(false);
  };

  const handleCancel = () => {
    const confirmCancel = window.confirm("Êtes-vous sûr de vouloir annuler vos modifications ?");
    if (confirmCancel) {
      setIsEditing(false);
    }
  };

  const editFormConfig: FormConfig = {
    title: "Modifier votre pack de déménagement",
    description: "Ajustez votre commande selon vos nouveaux besoins",
    serviceType: "moving",
    layout: {
      type: "package-edit",
      packageEditOptions: {
        selectedPackage: selectedPackageForEdit,
        initialData: initialFormData,
        onSave: handleSave,
        onCancel: handleCancel,
        editTitle: "Personnaliser votre Pack Premium",
        showPackageDetails: true,
        allowPackageModification: false
      }
    },
    sections: [
      {
        title: "Options de service",
        collapsible: true,
        defaultExpanded: true,
        fields: [
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
            ]
          },
          {
            name: "timeSlot",
            type: "radio",
            label: "Créneau horaire",
            options: [
              { value: "morning", label: "Matin (8h-12h)" },
              { value: "afternoon", label: "Après-midi (14h-18h)" },
              { value: "evening", label: "Soir (18h-20h) +30€" }
            ]
          }
        ]
      },
      {
        title: "Informations pratiques",
        collapsible: true,
        defaultExpanded: true,
        fields: [
          {
            name: "date",
            type: "date",
            label: "Date de déménagement",
            required: true
          },
          {
            name: "contact",
            type: "text",
            label: "Téléphone de contact",
            required: true,
            validation: {
              pattern: "^[0-9\\s\\-\\+\\.\\(\\)]+$"
            }
          }
        ]
      },
      {
        title: "Informations complémentaires",
        collapsible: true,
        defaultExpanded: true,
        fields: [
          {
            name: "notes",
            type: "textarea",
            label: "Commentaires particuliers",
            validation: { max: 500 }
          }
        ]
      }
    ],
    onSubmit: async (data) => {
      // Cette fonction ne sera pas appelée car nous utilisons handleSave du layout
      console.log("Soumission via FormGenerator:", data);
    }
  };

  if (!isEditing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Modifications sauvegardées
          </h2>
          <p className="text-gray-600 mb-6">
            Votre pack de déménagement a été mis à jour avec succès.
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Modifier à nouveau
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="p-4 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
            🚚 Service: {editFormConfig.serviceType}
          </span>
        </div>
      </div>
      <FormGenerator config={editFormConfig} />
    </div>
  );
};

export default PackageEditExample; 