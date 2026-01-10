'use client';

import React from 'react';

interface FormSaveIndicatorProps {
  isVisible: boolean;
  message?: string;
}

/**
 * Indicateur visuel de sauvegarde des données de formulaire
 * Affiche une notification temporaire quand les données sont sauvegardées
 */
export const FormSaveIndicator: React.FC<FormSaveIndicatorProps> = ({ 
  isVisible, 
  message = "saved" 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path 
          fillRule="evenodd" 
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
          clipRule="evenodd" 
        />
      </svg>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};
