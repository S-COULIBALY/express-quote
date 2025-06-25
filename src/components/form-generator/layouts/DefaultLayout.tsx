"use client";

import React from "react";
import { FormLayoutProps } from "../types";

export const DefaultLayout: React.FC<FormLayoutProps> = ({
  title,
  description,
  children,
  actions,
  className = ""
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 ${className}`}>
      <div className="max-w-2xl mx-auto">
        {/* En-tête */}
        {(title || description) && (
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {title}
              </h1>
            )}
            {description && (
              <p className="text-lg text-gray-600">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow-xl p-8 border border-gray-200">
          {children}
          
          {/* Actions intégrées dans le contenu */}
          {actions && (
            <div className="mt-6 flex justify-end space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 