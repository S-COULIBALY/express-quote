"use client";

import React from "react";
import { FormSummaryConfig } from "../types";

interface FormSummaryProps {
  formData: any;
  config: FormSummaryConfig;
}

/**
 * FormSummary est un composant qui affiche un récapitulatif des données d'un formulaire.
 * 
 * Il prend en entrée:
 * - formData: les données du formulaire à afficher
 * - config: la configuration du récapitulatif qui définit:
 *   - title: le titre du récapitulatif
 *   - sections: les sections qui regroupent les champs à afficher
 *   - footer: optionnel, pour afficher un total ou sous-total
 *   - className: classes CSS optionnelles
 * 
 * Chaque section contient:
 * - title: titre de la section
 * - icon: icône optionnelle
 * - fields: tableau des champs à afficher avec:
 *   - key: clé pour accéder à la valeur dans formData
 *   - label: libellé du champ
 *   - format: fonction optionnelle pour formater la valeur
 *   - condition: fonction optionnelle pour conditionner l'affichage
 *   - style: classes CSS optionnelles
 * 
 * Le composant filtre et formate les données selon la config
 * et les affiche de manière structurée et stylisée.
 */
export const FormSummary: React.FC<FormSummaryProps> = ({ formData, config }) => {
  const formatValue = (field: any, value: any) => {
    if (field.format) {
      return field.format(value, formData);
    }
    return value?.toString() || "";
  };

  const shouldShowField = (field: any, value: any) => {
    if (field.condition) {
      return field.condition(value, formData);
    }
    return !!value;
  };

  return (
    <div className={`bg-white rounded-2xl shadow-md p-6 border border-emerald-600 ${config.className || ""}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {config.title}
      </h3>
      
      <div className="space-y-3">
        {config.sections.map((section, sectionIndex) => {
          const sectionFields = section.fields.filter(field => 
            shouldShowField(field, formData[field.key])
          );

          if (sectionFields.length === 0) return null;

          return (
            <div key={sectionIndex}>
              {section.fields.map((field, fieldIndex) => {
                const value = formData[field.key];
                if (!shouldShowField(field, value)) return null;

                return (
                  <div key={fieldIndex}>
                    {field.label && (
                      <span className="text-sm text-gray-600">
                        {section.icon} {field.label}:
                      </span>
                    )}
                    <p className={`text-sm font-medium whitespace-pre-line ${field.style || ""} ${formatValue(field, value).includes('Contraintes particulières') ? 'constraints-list' : ''}`}>
                      {formatValue(field, value)}
                    </p>
                  </div>
                );
              })}
            </div>
          );
        })}

        {config.footer && (
          <div className="border-t pt-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{config.footer.totalLabel || "Total estimé"}:</span>
              <span className="text-lg font-bold text-emerald-600">
                {typeof config.footer.totalValue === "function" 
                  ? config.footer.totalValue(formData)
                  : config.footer.totalValue || "À calculer"
                }
              </span>
            </div>
            {config.footer.subtitle && (
              <p className="text-xs text-gray-500 mt-1">
                {config.footer.subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 