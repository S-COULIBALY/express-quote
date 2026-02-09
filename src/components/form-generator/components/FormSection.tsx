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
  layoutType,
}) => {
  const [isExpanded, setIsExpanded] = useState(section.defaultExpanded ?? true);

  const toggleExpanded = () => {
    if (section.collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  // Déterminer le nombre de colonnes :
  // - Si section.columns est défini, l'utiliser
  // - Sinon, si on est en mode sidebar, utiliser 2 colonnes par défaut
  // - Sinon, utiliser 1 colonne
  const effectiveColumns =
    section.columns ?? (layoutType === "sidebar" ? 2 : 1);

  return (
    <div
      className={`space-y-4 sm:space-y-5 md:space-y-6 ${section.className || ""}`}
    >
      {/* En-tête de section */}
      {(section.title || section.description) && (
        <div className="border-b border-gray-200 pb-1 sm:pb-2 md:pb-3">
          {section.title && (
            <div
              className={`flex items-center ${section.collapsible ? "cursor-pointer" : ""}`}
              onClick={toggleExpanded}
              style={{
                width: "100%",
                minWidth: 0,
                position: "relative",
                justifyContent: section.collapsible
                  ? "space-between"
                  : "flex-start",
                gap: 0,
                display: "flex",
                alignItems: "center",
                flexWrap: "nowrap", // Empêcher le wrap
              }}
            >
              <h3
                className="text-xs sm:text-sm md:text-base font-semibold leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
                style={
                  {
                    color: "#111827",
                    fontWeight: 600,
                    flex: "1 1 0%", // flex-grow: 1, flex-shrink: 1, flex-basis: 0% (prendre l'espace disponible)
                    minWidth: 0, // Permettre au flex de se rétrécir si nécessaire
                    width: "auto", // Largeur automatique basée sur flex
                    maxWidth: "100%",
                    paddingRight: 0,
                    display: "block",
                    visibility: "visible",
                    opacity: 1,
                    boxSizing: "border-box",
                  } as React.CSSProperties
                }
              >
                {section.title}
              </h3>
              {section.collapsible && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                  aria-label={
                    isExpanded ? "Réduire la section" : "Développer la section"
                  }
                  style={{
                    flexShrink: 0,
                    flexGrow: 0,
                    width: "auto",
                    minWidth: "auto",
                    maxWidth: "none",
                    marginLeft: "8px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded();
                  }}
                >
                  <svg
                    className={`w-4 h-4 sm:w-5 sm:h-5 transform transition-transform ${
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
        <div
          className={`${
            effectiveColumns === 3
              ? "grid grid-cols-3 gap-x-2 gap-y-6 sm:gap-4"
              : effectiveColumns === 2
                ? "grid grid-cols-2 gap-x-2 gap-y-6 sm:gap-4"
                : layoutType === "default"
                  ? "space-y-6 sm:space-y-4 w-full max-w-full"
                  : "space-y-6 sm:space-y-4 max-w-md"
          }`}
        >
          {section.fields.map((field, index) => {
            // Vérifier les conditions d'affichage
            const shouldShow = field.conditional
              ? field.conditional.condition(
                  formData?.[field.conditional.dependsOn],
                  formData,
                )
              : true;

            if (!shouldShow) {
              return null;
            }

            // Déterminer les classes CSS pour la grille
            const getFieldClasses = () => {
              if (effectiveColumns >= 2) {
                // Vérifier si le champ a des classes de largeur personnalisées (w-[80%], w-[20%], etc.)
                const hasCustomWidth = field.className?.includes("w-[");
                
                if (hasCustomWidth && field.className) {
                  // Si largeur personnalisée, extraire les classes de largeur et les autres classes
                  const widthClass = field.className.match(/w-\[[\d%]+\]/)?.[0] || "";
                  const otherClasses = field.className.replace(/w-\[[\d%]+\]/g, "").trim();
                  // Retourner la largeur + autres classes, avec flex-shrink-0 pour éviter le rétrécissement
                  return `${widthClass} flex-shrink-0 ${otherClasses}`.trim();
                }
                
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
                    ? effectiveColumns === 3
                      ? "col-span-3"
                      : "col-span-2"
                    : "col-span-1";
                }
              }
              return ""; // Mode normal : pas de classes de grille
            };

            // Vérifier si le champ a des largeurs personnalisées
            const hasCustomWidth = field.className?.includes("w-[");
            
            // Si le champ précédent avait une largeur personnalisée et que celui-ci aussi,
            // on doit les grouper. Pour simplifier, on vérifie si le champ suivant a aussi une largeur personnalisée
            const nextField = section.fields[index + 1];
            const nextHasCustomWidth = nextField?.className?.includes("w-[");
            const prevField = section.fields[index - 1];
            const prevHasCustomWidth = prevField?.className?.includes("w-[");
            
            // Si c'est le premier champ d'un groupe avec largeurs personnalisées
            if (hasCustomWidth && !prevHasCustomWidth) {
              // Trouver tous les champs consécutifs avec largeurs personnalisées
              const groupFields: typeof section.fields = [];
              let j = index;
              while (j < section.fields.length && section.fields[j].className?.includes("w-[")) {
                const groupField = section.fields[j];
                const shouldShowGroup = groupField.conditional
                  ? groupField.conditional.condition(
                      formData?.[groupField.conditional.dependsOn],
                      formData,
                    )
                  : true;
                if (shouldShowGroup) {
                  groupFields.push(groupField);
                }
                j++;
              }
              
              // Rendre le groupe dans un conteneur flex qui span toute la largeur de la grille
              return (
                <div
                  key={`group-${field.name}`}
                  className={`flex flex-nowrap items-start gap-x-2 ${
                    effectiveColumns >= 2 ? "col-span-2" : ""
                  }`}
                >
                  {groupFields.map((groupField) => {
                    const widthClass = groupField.className?.match(/w-\[[\d%]+\]/)?.[0] || "";
                    const otherClasses = groupField.className?.replace(/w-\[[\d%]+\]/g, "").trim() || "";
                    
                    return (
                      <div
                        key={groupField.name}
                        className={`${widthClass} flex-shrink-0 ${otherClasses}`.trim()}
                      >
                        <FormField
                          field={groupField}
                          register={register}
                          errors={errors}
                          value={formData?.[groupField.name]}
                          onChange={(value) => {
                            onFieldChange?.(groupField.name, value);
                          }}
                          formData={formData}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            }
            
            // Si ce champ fait partie d'un groupe déjà rendu, le sauter
            if (hasCustomWidth && prevHasCustomWidth) {
              return null;
            }
            
            // Champ normal - utiliser le système de grille
            return (
              <div
                key={field.name}
                className={`${getFieldClasses()} ${
                  field.type === "whatsapp-consent"
                    ? "min-w-0 overflow-hidden"
                    : ""
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
