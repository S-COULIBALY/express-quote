"use client";

import React, { useState } from "react";
import { FormGenerator } from "@/components/form-generator";
import { PackageOption } from "@/components/form-generator/types";

const samplePackages: PackageOption[] = [
  {
    id: "premium",
    name: "Pack Premium Déménagement",
    description: "Le choix idéal pour un déménagement sans stress avec un service complet et personnalisé",
    price: 599,
    originalPrice: 699,
    icon: "🚚",
    features: [
      "3 déménageurs expérimentés et formés",
      "Camion 30m³ avec hayon élévateur",
      "Emballage professionnel de tous vos biens",
      "Démontage et remontage de vos meubles",
      "Protection complète (housses, film plastique, cartons renforcés)",
      "Assurance tous risques jusqu'à 50 000€",
      "Service client dédié avec suivi personnalisé",
      "Matériel de protection premium inclus",
      "Nettoyage de base de l'ancien logement",
      "Garde-meuble gratuit pendant 15 jours",
      "Livraison garantie dans les créneaux convenus",
      "Service après-vente pendant 30 jours"
    ],
    popular: true
  }
];

export default function PackageCardsDemo() {
  const [selectedPackage, setSelectedPackage] = useState<PackageOption | null>(null);
  const [cardStyle, setCardStyle] = useState<"compact" | "detailed">("detailed");
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>(1);

  const handleSelectPackage = (packageId: string, packageData: PackageOption) => {
    setSelectedPackage(packageData);
    alert(`Vous avez sélectionné le ${packageData.name} à ${packageData.price}€`);
  };

  const config = {
    title: "Service de Déménagement Premium",
    description: "Découvrez notre service complet pour un déménagement en toute sérénité",
    layout: {
      type: "package-card" as const,
      packageCardOptions: {
        packages: samplePackages,
        onSelectPackage: handleSelectPackage,
        cardStyle,
        showPricing: true,
        columns
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contrôles de démo */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Style:</label>
              <select
                value={cardStyle}
                onChange={(e) => setCardStyle(e.target.value as "compact" | "detailed")}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              >
                <option value="detailed">Détaillé</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            {selectedPackage && (
              <div className="ml-auto bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm">
                Sélectionné: {selectedPackage.name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Package Cards Layout */}
      <FormGenerator config={config} />
    </div>
  );
} 