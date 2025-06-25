"use client";

import React, { useState, useEffect } from "react";
import { FormLayoutProps, PackageOption } from "../types";

interface PackageEditLayoutProps extends FormLayoutProps {
  selectedPackage: PackageOption;
  initialData?: any;
  onSave?: (packageData: any, formData: any) => void;
  onCancel?: () => void;
  editTitle?: string;
  showPackageDetails?: boolean;
  allowPackageModification?: boolean;
  formData?: any;
}

export const PackageEditLayout: React.FC<PackageEditLayoutProps> = ({
  title,
  description,
  children,
  actions,
  className = "",
  selectedPackage,
  initialData = {},
  onSave,
  onCancel,
  editTitle = "Éditer votre pack",
  showPackageDetails = true,
  allowPackageModification = false,
  formData = {}
}) => {
  const [editablePackage, setEditablePackage] = useState<PackageOption>(selectedPackage);
  const [modifications, setModifications] = useState<any>({});

  // Suivre les modifications du formulaire
  useEffect(() => {
    setModifications(formData);
  }, [formData]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  // Calculer le prix total avec les modifications
  const calculateTotalPrice = () => {
    let totalPrice = editablePackage.price;
    
    // Ajouter la logique de calcul selon les champs modifiés
    if (modifications.packingLevel === 'premium') totalPrice += 50;
    if (modifications.packingLevel === 'luxury') totalPrice += 120;
    if (modifications.cleaningService === 'basic') totalPrice += 80;
    if (modifications.cleaningService === 'deep') totalPrice += 150;
    if (modifications.timeSlot === 'evening') totalPrice += 30;
    if (modifications.extraWorkers) totalPrice += (modifications.extraWorkers * 40);
    
    return totalPrice;
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editablePackage, modifications);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handlePackageNameChange = (newName: string) => {
    if (allowPackageModification) {
      setEditablePackage(prev => ({ ...prev, name: newName }));
    }
  };

  const renderPackageSummary = () => (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
      {/* En-tête du pack */}
      <div className="text-center mb-6">
        {allowPackageModification ? (
          <input
            type="text"
            value={editablePackage.name}
            onChange={(e) => handlePackageNameChange(e.target.value)}
            className="text-xl font-bold text-gray-900 text-center bg-transparent border-b border-gray-300 focus:border-emerald-500 focus:outline-none"
          />
        ) : (
          <h2 className="text-xl font-bold text-gray-900">{editablePackage.name}</h2>
        )}
        {editablePackage.badge && (
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
            {editablePackage.badge}
          </span>
        )}
        {editablePackage.popular && (
          <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full mt-2 ml-2">
            ⭐ Populaire
          </span>
        )}
      </div>

      {/* Prix original et modifié */}
      <div className="text-center mb-6">
        {calculateTotalPrice() !== editablePackage.price ? (
          <>
            <div className="text-sm text-gray-500 mb-1">Prix de base</div>
            <div className="text-lg text-gray-400 line-through mb-1">
              {formatPrice(editablePackage.price)}
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatPrice(calculateTotalPrice())}
            </div>
            <div className="text-sm text-emerald-600 mt-1">
              +{formatPrice(calculateTotalPrice() - editablePackage.price)} d'options
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-1">Prix</div>
            <div className="text-2xl font-bold text-emerald-600">
              {formatPrice(editablePackage.price)}
            </div>
          </>
        )}
      </div>

      {/* Fonctionnalités de base */}
      {showPackageDetails && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Inclus dans ce pack :</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-2">
            {editablePackage.features.map((feature, index) => (
              <div key={index} className="flex items-center text-sm text-gray-700">
                <span className="text-emerald-500 mr-2 flex-shrink-0">✓</span>
                <span className="leading-tight">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modifications appliquées */}
      {Object.keys(modifications).length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Personnalisations :</h3>
          <div className="space-y-2 text-sm">
            {modifications.extraWorkers > 0 && (
              <div className="flex justify-between">
                <span>Déménageurs supplémentaires (×{modifications.extraWorkers})</span>
                <span className="text-emerald-600">+{formatPrice(modifications.extraWorkers * 40)}</span>
              </div>
            )}
            {modifications.packingLevel === 'premium' && (
              <div className="flex justify-between">
                <span>Emballage premium</span>
                <span className="text-emerald-600">+{formatPrice(50)}</span>
              </div>
            )}
            {modifications.packingLevel === 'luxury' && (
              <div className="flex justify-between">
                <span>Emballage luxe</span>
                <span className="text-emerald-600">+{formatPrice(120)}</span>
              </div>
            )}
            {modifications.cleaningService === 'basic' && (
              <div className="flex justify-between">
                <span>Ménage de base</span>
                <span className="text-emerald-600">+{formatPrice(80)}</span>
              </div>
            )}
            {modifications.cleaningService === 'deep' && (
              <div className="flex justify-between">
                <span>Grand ménage</span>
                <span className="text-emerald-600">+{formatPrice(150)}</span>
              </div>
            )}
            {modifications.timeSlot === 'evening' && (
              <div className="flex justify-between">
                <span>Créneau soir</span>
                <span className="text-emerald-600">+{formatPrice(30)}</span>
              </div>
            )}
            {modifications.storageOption && (
              <div className="flex justify-between">
                <span>Garde-meuble (1 mois)</span>
                <span className="text-emerald-600">Gratuit</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Informations supplémentaires */}
      {(modifications.date || modifications.contact || modifications.notes) && (
        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Détails :</h3>
          <div className="space-y-2 text-sm text-gray-600">
            {modifications.date && (
              <div>
                <span className="font-medium">Date :</span> {modifications.date}
              </div>
            )}
            {modifications.contact && (
              <div>
                <span className="font-medium">Contact :</span> {modifications.contact}
              </div>
            )}
            {modifications.notes && (
              <div>
                <span className="font-medium">Notes :</span>
                <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                  {modifications.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="border-t pt-4 mt-6">
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <span>💾</span>
            Sauvegarder
          </button>
          
          {onCancel && (
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <span>↩️</span>
              Annuler
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-50 min-h-screen py-8 ${className}`}>
      {/* En-tête */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h1 className="text-3xl font-bold text-gray-900">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-xl text-gray-600 mt-2">
                {description}
              </p>
            )}
          </div>
          
          {/* Indicateur du pack en cours d'édition */}
          <div className="hidden lg:flex items-center bg-white rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl mr-2">{editablePackage.icon}</span>
            <div>
              <div className="text-sm font-medium text-gray-900">En cours d'édition</div>
              <div className="text-xs text-gray-500">{editablePackage.name}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Formulaire d'édition - 60% */}
          <div className="lg:w-[60%]">
            <div className="bg-white rounded-2xl shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editTitle}
                </h2>
                <span className="text-sm text-gray-500">
                  Modifiez les options selon vos besoins
                </span>
              </div>
              
              {/* Formulaire */}
              {children}
            </div>
          </div>
          
          {/* Récapitulatif - 40% */}
          <div className="lg:w-[40%]">
            {renderPackageSummary()}
          </div>
        </div>
      </div>
    </div>
  );
}; 