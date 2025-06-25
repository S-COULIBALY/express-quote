"use client";

import React, { useState } from "react";
import { FormLayoutProps, PackageOption } from "../types";

interface PackageLayoutProps extends FormLayoutProps {
  packages: PackageOption[];
  selectedPackage?: string;
  onKeepPackage?: (packageId: string, formData: any) => void;
  onCustomizePackage?: (packageId: string, formData: any) => void;
  customizationTitle?: string;
  formData?: any;
}

export const PackageLayout: React.FC<PackageLayoutProps> = ({
  title,
  description,
  children,
  className = "",
  packages,
  selectedPackage,
  onKeepPackage,
  onCustomizePackage,
  customizationTitle = "Personnaliser ce pack",
  formData
}) => {
  const [activePackage, setActivePackage] = useState<string>(selectedPackage || packages[0]?.id);
  const [showCustomization, setShowCustomization] = useState(false);

  const currentPackage = packages.find(pkg => pkg.id === activePackage);

  const handleKeepPackage = () => {
    if (onKeepPackage && currentPackage) {
      onKeepPackage(currentPackage.id, formData);
    }
  };

  const handleCustomizePackage = () => {
    if (currentPackage?.customizable) {
      setShowCustomization(true);
      if (onCustomizePackage) {
        onCustomizePackage(currentPackage.id, formData);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  return (
    <div className={`bg-gray-50 min-h-screen py-8 ${className}`}>
      {/* En-tête */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        {title && (
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-xl text-gray-600 text-center mt-2">
            {description}
          </p>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!showCustomization ? (
          <>
            {/* Grille des packages */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all duration-200 ${
                    activePackage === pkg.id
                      ? "ring-2 ring-emerald-500 transform scale-105"
                      : "hover:shadow-xl hover:scale-102"
                  } ${pkg.popular ? "border-2 border-emerald-400" : "border border-gray-200"}`}
                  onClick={() => setActivePackage(pkg.id)}
                >
                  {/* Badge populaire */}
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        ⭐ Populaire
                      </span>
                    </div>
                  )}

                  {/* Badge personnalisé */}
                  {pkg.badge && !pkg.popular && (
                    <div className="absolute -top-3 right-4">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        {pkg.badge}
                      </span>
                    </div>
                  )}

                  {/* Icône */}
                  {pkg.icon && (
                    <div className="flex justify-center mb-4">
                      {typeof pkg.icon === 'string' ? (
                        <div className="text-4xl">{pkg.icon}</div>
                      ) : (
                        pkg.icon
                      )}
                    </div>
                  )}

                  {/* Nom et description */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {pkg.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {pkg.description}
                    </p>
                  </div>

                  {/* Prix */}
                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-3xl font-bold text-emerald-600">
                        {formatPrice(pkg.price)}
                      </span>
                      {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                        <span className="text-lg text-gray-400 line-through">
                          {formatPrice(pkg.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Fonctionnalités */}
                  <div className="space-y-2 mb-6">
                    {pkg.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-700">
                        <span className="text-emerald-500 mr-2">✓</span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Indicateur de sélection */}
                  {activePackage === pkg.id && (
                    <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Package sélectionné - Détails et actions */}
            {currentPackage && (
              <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Pack sélectionné : {currentPackage.name}
                  </h2>
                  <p className="text-gray-600">
                    {currentPackage.description}
                  </p>
                  <div className="text-3xl font-bold text-emerald-600 mt-4">
                    {formatPrice(currentPackage.price)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <button
                    onClick={handleKeepPackage}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <span>✓</span>
                    Je conserve ce pack
                  </button>
                  
                  {currentPackage.customizable && (
                    <button
                      onClick={handleCustomizePackage}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                    >
                      <span>⚙️</span>
                      Je personnalise ce pack
                    </button>
                  )}
                </div>

                {!currentPackage.customizable && (
                  <p className="text-center text-sm text-gray-500 mt-4">
                    Ce pack n'est pas personnalisable
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          // Mode personnalisation
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {customizationTitle}
                </h2>
                <p className="text-gray-600">
                  Pack de base : {currentPackage?.name}
                </p>
              </div>
              <button
                onClick={() => setShowCustomization(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Formulaire de personnalisation */}
            <div className="border-t pt-6">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 