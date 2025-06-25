"use client";

import React from "react";
import { PackageOption } from "../types";

interface PackageCardLayoutProps {
  title?: string;
  description?: string;
  className?: string;
  packages: PackageOption[];
  onSelectPackage?: (packageId: string, packageData: PackageOption) => void;
  cardStyle?: "compact" | "detailed";
  showPricing?: boolean;
  columns?: 1 | 2 | 3 | 4;
}

export const PackageCardLayout: React.FC<PackageCardLayoutProps> = ({
  title,
  description,
  className = "",
  packages,
  onSelectPackage,
  cardStyle = "detailed",
  showPricing = true,
  columns = 3
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const handleSelectPackage = (pkg: PackageOption) => {
    if (onSelectPackage) {
      onSelectPackage(pkg.id, pkg);
    }
  };

  const getGridCols = () => {
    const colsMap = {
      1: "grid-cols-1",
      2: "grid-cols-1 md:grid-cols-2",
      3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    };
    return colsMap[columns];
  };

  const renderPackageCard = (pkg: PackageOption) => (
    <div
      key={pkg.id}
      className={`bg-white rounded-xl shadow-md border transition-all duration-200 hover:shadow-lg hover:scale-[1.02] max-w-sm mx-auto ${
        pkg.popular ? "border-2 border-emerald-400 relative" : "border border-gray-200"
      }`}
    >
      {/* Badge populaire */}
      {pkg.popular && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
          <span className="bg-emerald-500 text-white px-3 py-0.5 rounded-full text-xs font-medium">
            ⭐ Populaire
          </span>
        </div>
      )}

      {/* Badge personnalisé */}
      {pkg.badge && !pkg.popular && (
        <div className="absolute -top-2 right-3 z-10">
          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
            {pkg.badge}
          </span>
        </div>
      )}

      <div className="p-3">
        {/* Icône et nom */}
        <div className="text-center mb-3">
          {pkg.icon && (
            <div className="text-2xl mb-2">
              {typeof pkg.icon === 'string' ? pkg.icon : pkg.icon}
            </div>
          )}
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {pkg.name}
          </h3>
          {cardStyle === "detailed" && (
            <p className="text-gray-600 text-xs leading-relaxed">
              {pkg.description}
            </p>
          )}
        </div>

        {/* Prix */}
        {showPricing && (
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-bold text-emerald-600">
                {formatPrice(pkg.price)}
              </span>
              {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(pkg.originalPrice)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Fonctionnalités */}
        {cardStyle === "detailed" && (
          <div className="mb-3">
            <div className="space-y-1">
              {pkg.features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-start text-xs text-gray-700">
                  <span className="text-emerald-500 mr-1.5 flex-shrink-0 mt-0.5">✓</span>
                  <span className="leading-tight">{feature}</span>
                </div>
              ))}
              {pkg.features.length > 4 && (
                <div className="text-xs text-gray-500 italic mt-1">
                  +{pkg.features.length - 4} autres fonctionnalités...
                </div>
              )}
            </div>
          </div>
        )}

        {cardStyle === "compact" && pkg.features.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-600 text-center">
              {pkg.features.length} fonctionnalités incluses
            </div>
          </div>
        )}

        {/* Bouton de sélection */}
        <button
          onClick={() => handleSelectPackage(pkg)}
          className={`w-full font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-1.5 text-sm ${
            pkg.popular
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-gray-800 hover:bg-gray-900 text-white"
          }`}
        >
          <span>✓</span>
          Je choisis ce pack
        </button>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-50 min-h-screen py-4 ${className}`}>
      {/* En-tête */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        {title && (
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            {title}
          </h1>
        )}
        {description && (
          <p className="text-lg text-gray-600 text-center mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Grille des packages */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid ${getGridCols()} gap-4`}>
          {packages.map(renderPackageCard)}
        </div>
      </div>

      {/* Message d'encouragement */}
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Sélectionnez le pack qui correspond le mieux à vos besoins
          </p>
          <div className="mt-3 flex justify-center items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center">
              <span className="text-green-500 mr-1">✓</span>
              Satisfaction garantie
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-1">✓</span>
              Prix transparent
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-1">✓</span>
              Support inclus
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 