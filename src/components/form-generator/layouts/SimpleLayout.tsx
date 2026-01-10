"use client";

import React from "react";
import { FormLayoutProps } from "../types";

/**
 * SimpleLayout - Layout simple sans sidebar
 * 
 * Affiche uniquement le formulaire en pleine largeur, sans sidebar latérale.
 * Parfait pour les formulaires qui n'ont pas besoin d'affichage latéral.
 * 
 * Version simplifiée : occupe 100% de la largeur disponible sans padding/conteneur externe.
 */
export const SimpleLayout: React.FC<FormLayoutProps> = ({
  title,
  description,
  children,
  actions,
  className = "",
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* En-tête */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          )}
          {description && (
            <p className="text-xl text-gray-600 mt-2">{description}</p>
          )}
        </div>
      )}

      {/* Formulaire en pleine largeur - 100% de la colonne */}
      <div className="w-full">
        {children}

        {/* Actions du formulaire */}
        {actions && (
          <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-200">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

