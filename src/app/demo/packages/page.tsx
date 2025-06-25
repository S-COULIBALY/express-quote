"use client";

import React, { useState } from "react";
import PackageFormExample from "@/components/form-generator/presets/pack-service/example";
import Link from "next/link";

export default function PackageLayoutDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation et en-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">
                📦 Layout Package - Démo Spécialisée
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/demo"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ← Tous les layouts
              </Link>
              <span className="text-sm text-gray-500">
                Forfaits prédéfinis
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Information sur le layout Package */}
      <div className="bg-orange-50 border-b border-orange-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">📦</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                Layout Package - Forfaits avec Personnalisation
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                <strong>Interface optimisée pour l'e-commerce</strong> : Comparaison visuelle des forfaits, 
                sélection intuitive, options de personnalisation conditionnelles. 
                <span className="font-semibold">Maximise les conversions</span> !
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-orange-600">
                <span>🎯 3 forfaits disponibles</span>
                <span>⚙️ Personnalisation conditionnelle</span>
                <span>💳 UX e-commerce optimisée</span>
                <span>📊 Comparaison prix/fonctionnalités</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Démonstration du PackageLayout */}
      <div className="py-4">
        <PackageFormExample />
      </div>

      {/* Informations techniques */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">🏗️ Fonctionnalités</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ <strong>Grille responsive</strong> - Affichage optimisé sur tous appareils</li>
                <li>✅ <strong>Sélection visuelle</strong> - Feedback immédiat avec animations</li>
                <li>✅ <strong>Badges dynamiques</strong> - "Populaire", "Économique", etc.</li>
                <li>✅ <strong>Prix barrés</strong> - Mise en avant des promotions</li>
                <li>✅ <strong>Mode personnalisation</strong> - Formulaire conditionnel intégré</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">⚙️ Configuration</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ <strong>PackageOption[]</strong> - Définition déclarative des forfaits</li>
                <li>✅ <strong>Callbacks personnalisés</strong> - onKeepPackage / onCustomizePackage</li>
                <li>✅ <strong>Champs conditionnels</strong> - customizationFields par package</li>
                <li>✅ <strong>Validation automatique</strong> - Zod + React Hook Form</li>
                <li>✅ <strong>Styles cohérents</strong> - Design system intégré</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">🎯 Cas d'usage</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>🚚 <strong>Services de déménagement</strong> - Packs Essentiel/Premium/Luxe</li>
                <li>🏠 <strong>Prestations immobilières</strong> - Diagnostics/Expertises</li>
                <li>💻 <strong>Formules SaaS</strong> - Free/Pro/Enterprise</li>
                <li>🎓 <strong>Formations</strong> - Modules à la carte</li>
                <li>📱 <strong>Abonnements</strong> - Plans tarifaires</li>
              </ul>
            </div>
          </div>
          
          {/* Code d'exemple */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">📝 Configuration exemple :</h4>
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`const config: FormConfig = {
  title: "Choisissez votre pack",
  layout: {
    type: "package",
    packageOptions: {
      packages: [
        {
          id: "essential",
          name: "Pack Essentiel",
          price: 299,
          features: ["Transport", "Emballage"],
          customizable: true,
          customizationFields: [...]
        }
      ],
      onKeepPackage: (id, data) => { /* validation */ },
      onCustomizePackage: (id, data) => { /* personnalisation */ }
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
} 