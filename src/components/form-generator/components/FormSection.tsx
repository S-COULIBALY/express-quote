"use client";

import React, { useState } from "react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FormSection as FormSectionType } from "../types";
import { FormField } from "./FormField";

interface FormSectionProps {
  section: FormSectionType;
  register: UseFormRegister<any>;
  errors: FieldErrors;
  formData?: Record<string, any>;
  onFieldChange?: (fieldName: string, value: any) => void;
  layoutType?: "default" | "sidebar" | "tabs" | "wizard";
}

export const FormSection: React.FC<FormSectionProps> = ({
  section,
  register,
  errors,
  formData,
  onFieldChange,
  layoutType
}) => {
  const [isExpanded, setIsExpanded] = useState(
    section.defaultExpanded ?? true
  );

  const toggleExpanded = () => {
    if (section.collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  // Déterminer le nombre de colonnes : 
  // - Si section.columns est défini, l'utiliser
  // - Sinon, si on est en mode sidebar, utiliser 2 colonnes par défaut
  // - Sinon, utiliser 1 colonne
  const effectiveColumns = section.columns ?? (layoutType === "sidebar" ? 2 : 1);

  return (
    <div className={`space-y-8 sm:space-y-6 md:space-y-4 ${section.className || ""}`}>
      {/* En-tête de section */}
      {(section.title || section.description) && (
        <div className="border-b border-gray-200 pb-1 sm:pb-3">
          {section.title && (
            <div 
              className={`flex items-center justify-between ${
                section.collapsible ? "cursor-pointer" : ""
              }`}
              onClick={toggleExpanded}
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                {section.title}
              </h3>
              {section.collapsible && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={isExpanded ? "Réduire la section" : "Développer la section"}
                >
                  <svg
                    className={`w-5 h-5 transform transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
          {section.description && (
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
              {section.description}
            </p>
          )}
        </div>
      )}

      {/* Champs de la section */}
      {isExpanded && (
        <div className={`${
          effectiveColumns === 3
            ? "grid grid-cols-3 gap-x-2 gap-y-6 sm:gap-4"
            : effectiveColumns === 2
              ? "grid grid-cols-2 gap-x-2 gap-y-6 sm:gap-4"
              : layoutType === "default"
                ? "space-y-6 sm:space-y-4 w-full max-w-full"
                : "space-y-6 sm:space-y-4 max-w-md"
        }`}>
          {section.fields.map((field, index) => {
            // Vérifier les conditions d'affichage
            const shouldShow = field.conditional
              ? field.conditional.condition(formData?.[field.conditional.dependsOn], formData)
              : true;

            if (!shouldShow) {
              return null;
            }

            // Déterminer les classes CSS pour la grille
            const getFieldClasses = () => {
              if (effectiveColumns >= 2) {
                // Mode grille : utiliser columnSpan ou inline
                if (field.columnSpan === 2) {
                  return "col-span-2"; // Largeur 2/3 ou 2/2
                } else if (field.columnSpan === 3) {
                  return "col-span-3"; // Pleine largeur en 3 colonnes
                } else if (field.inline) {
                  return "col-span-1"; // Une colonne forcée
                } else if (field.columnSpan === 1) {
                  return "col-span-1"; // Une colonne
                } else {
                  // Par défaut, les textarea, adresses et whatsapp-consent prennent toute la largeur
                  return field.type === "textarea" || 
                         field.type === "address-pickup" || 
                         field.type === "address-delivery" ||
                         field.type === "whatsapp-consent"
                    ? (effectiveColumns === 3 ? "col-span-3" : "col-span-2")
                    : "col-span-1";
                }
              }
              return ""; // Mode normal : pas de classes de grille
            };

            return (
              <div
                key={field.name}
                className={`${getFieldClasses()} ${
                  field.type === "whatsapp-consent" ? "min-w-0 overflow-hidden" : ""
                }`}
              >
                <FormField
                  field={field}
                  register={register}
                  errors={errors}
                  value={formData?.[field.name]}
                  onChange={(value) => {
                    onFieldChange?.(field.name, value);
                  }}
                  formData={formData}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}; 