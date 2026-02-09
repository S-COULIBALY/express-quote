"use client";

import React, { useEffect, useState } from "react";

/**
 * Seuils pour la gestion automatique du monte-meubles
 */
interface FurnitureLiftThresholds {
  HIGH: number;      // Seuil >=3 : Coché par défaut, décochable avec warning
  CRITICAL: number;  // Seuil >=5 : Coché et non décochable
}

interface FurnitureLiftCheckboxProps {
  addressType: "pickup" | "delivery";
  floorFieldName: string;
  elevatorFieldName: string;
  thresholds: FurnitureLiftThresholds;
  value?: boolean;
  onChange?: (value: boolean) => void;
  formData?: Record<string, unknown>;
  error?: string;
}

/**
 * FurnitureLiftCheckbox - Checkbox monte-meubles avec logique de seuils
 *
 * Logique automatique :
 * - Étage < HIGH (3) avec ascenseur : Décoché, libre
 * - Étage < HIGH (3) sans ascenseur : Décoché, libre
 * - Étage >= HIGH (3) sans ascenseur adapté : Coché par défaut, décochable avec warning
 * - Étage >= CRITICAL (5) sans ascenseur adapté : Coché, non décochable
 */
export const FurnitureLiftCheckbox: React.FC<FurnitureLiftCheckboxProps> = ({
  addressType,
  floorFieldName,
  elevatorFieldName,
  thresholds,
  value = false,
  onChange,
  formData,
  error,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [isAutoChecked, setIsAutoChecked] = useState(false);

  // Récupérer les valeurs du formulaire
  const floor = formData?.[floorFieldName];
  const elevator = formData?.[elevatorFieldName];

  // Convertir l'étage en nombre
  const floorNumber = typeof floor === 'string' ? parseInt(floor, 10) : (typeof floor === 'number' ? floor : 0);

  // Vérifier si l'ascenseur est adapté (medium ou large = adapté aux meubles)
  const hasAdaptedElevator = elevator === 'medium' || elevator === 'large';
  const hasNoElevator = elevator === 'no';
  const hasSmallElevator = elevator === 'small';

  // Déterminer si monte-meubles nécessaire selon les seuils
  const needsLift = floorNumber > 0 && (hasNoElevator || hasSmallElevator);
  const isHighFloor = floorNumber >= thresholds.HIGH;
  const isCriticalFloor = floorNumber >= thresholds.CRITICAL;

  // État : monte-meubles recommandé/obligatoire
  const isRecommended = needsLift && isHighFloor && !isCriticalFloor;
  const isMandatory = needsLift && isCriticalFloor;

  // Effet pour auto-cocher/décocher selon les seuils
  useEffect(() => {
    if (isMandatory && !value) {
      onChange?.(true);
      setIsAutoChecked(true);
    } else if (isRecommended && !value && !isAutoChecked) {
      onChange?.(true);
      setIsAutoChecked(true);
    } else if (!needsLift && value && isAutoChecked) {
      onChange?.(false);
      setIsAutoChecked(false);
    }
  }, [floorNumber, elevator, isMandatory, isRecommended, needsLift, value, isAutoChecked, onChange]);

  // Gérer le changement manuel
  const handleChange = (checked: boolean) => {
    if (isMandatory) return;
    if (isRecommended && !checked) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
      onChange?.(checked);
    }
  };

  // Confirmer le décochage malgré l'avertissement
  const confirmUncheck = () => {
    setShowWarning(false);
    onChange?.(false);
  };

  // Annuler le décochage
  const cancelUncheck = () => {
    setShowWarning(false);
  };

  // Label selon l'adresse
  const addressLabel = addressType === "pickup" ? "Départ" : "Arrivée";

  // Explication contextuelle pour le badge
  const getStatusInfo = () => {
    if (isMandatory) {
      return {
        badge: "Obligatoire",
        badgeClass: "bg-red-100 text-red-700 border-red-200",
        explanation: `Étage ${floorNumber} sans ascenseur adapté`,
        icon: (
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        )
      };
    }
    if (isRecommended) {
      return {
        badge: "Recommandé",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
        explanation: `Étage ${floorNumber} sans ascenseur adapté`,
        icon: null
      };
    }
    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="relative">
      {/* Container horizontal - optimisé mobile avec plus d'espace pour le texte */}
      <div
        className={`flex flex-row items-center gap-1.5 sm:gap-3 py-2 sm:py-2.5 px-2 sm:px-3 rounded-lg border cursor-pointer transition-all duration-150 w-full ${
          isMandatory
            ? "bg-red-50 border-red-200"
            : isRecommended
            ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
            : value
            ? "bg-emerald-50 border-emerald-200"
            : "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50"
        }`}
        onClick={() => !isMandatory && handleChange(!value)}
      >
        {/* Checkbox avec padding visible - optimisé mobile */}
        <div
          className={`flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 rounded border-2 flex-shrink-0 ${
            value
              ? isMandatory
                ? "bg-red-500 border-red-500"
                : "bg-emerald-500 border-emerald-500"
              : "bg-white border-gray-300"
          }`}
        >
          {value && (
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>

        {/* Label - Monte / meuble (sans tiret, sans pluriel, retour à la ligne) + Départ/Arrivée */}
        <span className={`text-[10px] sm:text-xs font-medium flex-1 min-w-0 leading-tight ${isMandatory ? "text-red-700" : "text-gray-800"}`}>
          Monte
          <br />
          meuble {addressLabel}
        </span>

        {/* Badge de statut - optimisé mobile - plus compact */}
        {statusInfo && (
          <span className={`ml-1 sm:ml-auto px-1 sm:px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] sm:text-xs font-medium border flex-shrink-0 ${statusInfo.badgeClass}`}>
            {statusInfo.badge}
          </span>
        )}

        {/* Icône cadenas pour mode obligatoire - optimisé mobile - plus petite */}
        {statusInfo?.icon && (
          <div className="flex-shrink-0 ml-0.5">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        )}
      </div>

      {/* Explication sous le checkbox (si applicable) - optimisé mobile */}
      {statusInfo && (
        <p className={`text-[10px] sm:text-xs mt-1 ${isMandatory ? "text-red-600" : "text-amber-600"}`}>
          {statusInfo.explanation}
        </p>
      )}

      {/* Modal compact de confirmation - optimisé mobile */}
      {showWarning && (
        <div className="absolute left-0 sm:left-full top-full sm:top-0 mt-2 sm:mt-0 ml-0 sm:ml-2 z-50 w-full sm:w-72">
          <div className="bg-white rounded-lg shadow-xl border border-amber-200 overflow-hidden">
            {/* Header compact - optimisé mobile */}
            <div className="bg-amber-50 px-2.5 sm:px-3 py-1.5 sm:py-2 border-b border-amber-100 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-gray-900">Voulez-vous retirer le monte-meubles ?</span>
            </div>

            {/* Contenu compact - optimisé mobile */}
            <div className="px-2.5 sm:px-3 py-2">
              <p className="text-[11px] sm:text-xs text-gray-600 mb-2">
                <strong>Fortement recommandé</strong> pour les étages élévés comme l'étage {floorNumber} dans votre cas. Sans monte-meuble risques de:
              </p>
              <ul className="text-[11px] sm:text-xs text-gray-500 space-y-0.5 mb-2">
                <li>• Dégradation des parties communes</li>
                <li>• Temps de portage plus long (+30-60 min)</li>
                <li>• Fatigue de l'équipe, risque de casse</li>
              </ul>
            </div>

            {/* Boutons compacts - optimisé mobile */}
            <div className="px-2.5 sm:px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button
                onClick={cancelUncheck}
                className="flex-1 px-2.5 sm:px-3 py-1.5 bg-emerald-600 text-white text-xs rounded font-medium hover:bg-emerald-700 transition-colors min-h-[36px] sm:min-h-auto"
              >
                Garder
              </button>
              <button
                onClick={confirmUncheck}
                className="px-2.5 sm:px-3 py-1.5 border border-gray-300 text-gray-600 text-xs rounded font-medium hover:bg-white transition-colors min-h-[36px] sm:min-h-auto"
              >
                Retirer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
};
