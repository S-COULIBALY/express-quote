"use client";

import React, { useState } from "react";
import { FormGenerator, availablePresets } from "@/components/form-generator";
import { MovingFormExample } from "@/components/form-generator/presets/moving-service/example";
import ContactFormExample from "@/components/form-generator/presets/contact/example";
import Link from "next/link";

type DemoType = "moving" | "contact" | "comparison";

export default function FormGeneratorPresetsDemo() {
  const [activeDemo, setActiveDemo] = useState<DemoType>("moving");

  const renderDemo = () => {
    switch (activeDemo) {
      case "moving":
        return <MovingFormExample />;
      case "contact":
        return <ContactFormExample />;
      case "comparison":
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Preset "Moving"</h3>
              <div className="scale-75 origin-top">
                <MovingFormExample />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Preset "Contact"</h3>
              <div className="scale-75 origin-top">
                <ContactFormExample />
              </div>
            </div>
          </div>
        );
      default:
        return <MovingFormExample />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation des démos */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-gray-900">
                🧩 Presets Sidebar - Démo Spécialisée
              </h1>
              
              <nav className="flex space-x-4">
                <button
                  onClick={() => setActiveDemo("moving")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeDemo === "moving"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🚚 Déménagement
                </button>
                
                <button
                  onClick={() => setActiveDemo("contact")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeDemo === "contact"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  📧 Contact
                </button>
                
                <button
                  onClick={() => setActiveDemo("comparison")}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeDemo === "comparison"
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  🔄 Comparaison
                </button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                href="/demo"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ← Tous les layouts
              </Link>
              <span className="text-sm text-gray-500">
                {availablePresets.length} presets disponibles
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Note de redirection vers la démo principale */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">💡</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Page spécialisée presets sidebar.</strong> Pour voir tous les layouts (Auth, Default, Sidebar), rendez-vous sur la{" "}
                <Link href="/demo" className="font-semibold underline hover:text-blue-900">
                  démo principale
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informations sur la nouvelle architecture */}
      {activeDemo !== "comparison" && (
        <div className="bg-emerald-50 border-b border-emerald-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">✨</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-emerald-800">
                  Nouvelle Architecture Optimisée
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                  <strong>Preset "{activeDemo}"</strong> : Styles automatiques, valeurs par défaut intégrées, 
                  récapitulatif configuré, layout personnalisé. 
                  <span className="font-semibold">Configuration réduite de 90%</span> !
                </p>
                <div className="mt-2 flex items-center space-x-4 text-xs text-emerald-600">
                  <span>📁 Structure modulaire</span>
                  <span>⚙️ Presets par métier</span>
                  <span>🎨 Styles centralisés</span>
                  <span>🔄 Réutilisabilité maximale</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenu de la démo */}
      <div className="py-8">
        {renderDemo()}
      </div>

      {/* Footer avec informations techniques */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🏗️ Architecture</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Types TypeScript complets</li>
                <li>✅ Validation Zod automatique</li>
                <li>✅ React Hook Form intégré</li>
                <li>✅ Composants modulaires</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">⚙️ Presets Disponibles</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {availablePresets.map(preset => (
                  <li key={preset.id}>✅ {preset.name} - {preset.description.substring(0, 40)}...</li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🚀 Avantages</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✅ Configuration ultra-simplifiée</li>
                <li>✅ Layouts automatiques par métier</li>
                <li>✅ Sidebar intelligent</li>
                <li>✅ Extensibilité maximale</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 