"use client";

import React from "react";
import PackageEditExample from "@/components/form-generator/presets/pack-service/edit-example";
import Link from "next/link";

export default function PackageEditDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation et en-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">
                ✏️ Package Edit Layout - Démo Spécialisée
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/demo"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ← Tous les layouts
              </Link>
              <Link
                href="/demo/packages"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Sélection de packs →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Information sur le layout Package Edit */}
      <div className="bg-purple-50 border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">✏️</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-purple-800">
                Layout Package Edit - Édition avec Récapitulatif Temps Réel
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                <strong>Interface d'édition optimisée</strong> : Formulaire prérempli avec les données du pack choisi, 
                récapitulatif automatique avec calcul en temps réel, sauvegarde et annulation. 
                <span className="font-semibold">UX parfaite pour la modification</span> !
              </p>
              <div className="mt-2 flex items-center space-x-4 text-xs text-purple-600">
                <span>📝 Formulaire prérempli</span>
                <span>💰 Calcul temps réel</span>
                <span>📊 Récapitulatif automatique</span>
                <span>💾 Sauvegarde optimisée</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Démonstration du PackageEditLayout */}
      <div className="py-4">
        <PackageEditExample />
      </div>

      {/* Informations techniques */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">✏️ Fonctionnalités d'Édition</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ <strong>Formulaire prérempli</strong> - Données existantes chargées automatiquement</li>
                <li>✅ <strong>Layout 60/40</strong> - Formulaire principal + sidebar récapitulatif</li>
                <li>✅ <strong>Calcul temps réel</strong> - Prix mis à jour à chaque modification</li>
                <li>✅ <strong>Sections collapsibles</strong> - Organisation claire des options</li>
                <li>✅ <strong>Validation continue</strong> - Erreurs affichées en temps réel</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">📊 Récapitulatif Intelligent</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ <strong>Détail du pack</strong> - Fonctionnalités incluses visibles</li>
                <li>✅ <strong>Modifications tracées</strong> - Chaque option avec son prix</li>
                <li>✅ <strong>Prix comparatif</strong> - Base rayée, nouveau prix en vert</li>
                <li>✅ <strong>Informations pratiques</strong> - Date, contact, notes résumées</li>
                <li>✅ <strong>Actions intégrées</strong> - Sauvegarder/Annuler dans le sidebar</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">🔧 Configuration Avancée</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ <strong>selectedPackage</strong> - Package à éditer en entrée</li>
                <li>✅ <strong>initialData</strong> - Données préremplies</li>
                <li>✅ <strong>onSave / onCancel</strong> - Callbacks pour les actions</li>
                <li>✅ <strong>allowPackageModification</strong> - Édition du nom de pack</li>
                <li>✅ <strong>showPackageDetails</strong> - Affichage des fonctionnalités</li>
              </ul>
            </div>
          </div>
          
          {/* Code d'exemple */}
          <div className="mt-8 bg-gray-100 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">📝 Configuration exemple :</h4>
            <pre className="text-sm text-gray-700 overflow-x-auto">
{`const config: FormConfig = {
  title: "Modifier votre pack",
  layout: {
    type: "package-edit",
    packageEditOptions: {
      selectedPackage: mySelectedPackage,
      initialData: existingData,
      onSave: (packageData, formData) => {
        // Sauvegarder les modifications
        updateOrder(packageData, formData);
      },
      onCancel: () => {
        // Annuler et revenir
        router.back();
      },
      showPackageDetails: true,
      allowPackageModification: false
    }
  },
  customDefaults: existingData,
  sections: [/* sections avec champs */]
}`}
            </pre>
          </div>

          {/* Avantages par rapport à PackageLayout */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-4">🔄 PackageLayout vs PackageEditLayout</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h5 className="font-medium text-blue-800 mb-2">📦 PackageLayout (Sélection)</h5>
                <ul className="space-y-1 text-blue-700">
                  <li>• Comparaison de plusieurs forfaits</li>
                  <li>• Sélection initiale avec personnalisation</li>
                  <li>• Actions "Conserver" / "Personnaliser"</li>
                  <li>• Parfait pour la découverte et choix</li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-blue-800 mb-2">✏️ PackageEditLayout (Édition)</h5>
                <ul className="space-y-1 text-blue-700">
                  <li>• Édition d'un pack déjà choisi</li>
                  <li>• Formulaire prérempli avec données existantes</li>
                  <li>• Récapitulatif temps réel avec calculs</li>
                  <li>• Parfait pour la modification et mise à jour</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 