"use client";

import React from "react";
import { IndustryPreset, GlobalFormConfig } from "../types";

interface FormStylesSimplifiedProps {
  preset?: IndustryPreset;
  customStyles?: string;
  globalConfig?: GlobalFormConfig;
}

/**
 * 🎨 Version simplifiée de FormStyles
 * Utilise les nouvelles classes utilitaires au lieu de générer du CSS inline
 * Réduit de 828 lignes à ~50 lignes
 */
export const FormStylesSimplified: React.FC<FormStylesSimplifiedProps> = ({ 
  preset = "default", 
  customStyles,
  globalConfig 
}) => {
  // 🎨 Styles minimaux pour les cas spécifiques uniquement
  const minimalStyles = `
    /* 🎨 Variables CSS pour la compatibilité avec l'ancien système */
    :root {
      --form-primary-color: var(--color-primary, #1B5E20);
      --form-secondary-color: var(--color-secondary, #2E7D32);
      --form-accent-color: var(--color-accent, #4CAF50);
      --form-light-color: var(--color-light, #C8E6C9);
      --form-dark-color: var(--color-dark, #0D2818);
      --form-success-color: var(--color-success, #66BB6A);
      --form-warning-color: var(--color-warning, #FFA726);
      --form-error-color: var(--color-error, #EF5350);
      --form-font-family: var(--font-family-primary, -apple-system, BlinkMacSystemFont, "SF Pro Display");
      --form-font-size: var(--font-size-base, 16px);
      --form-border-radius: var(--ios18-border-radius, 14px);
      --form-gradient-primary: var(--gradient-primary);
      --form-gradient-accent: var(--gradient-accent);
      --form-gradient-subtle: var(--gradient-subtle);
    }

    /* 🎨 Styles spécifiques pour les formulaires uniquement */
    .form-generator {
      font-family: var(--form-font-family);
      font-size: var(--form-font-size);
    }

    /* 🍏 Styles iOS 18 pour les champs de formulaire */
    .form-generator input,
    .form-generator select,
    .form-generator textarea {
      border-radius: var(--form-border-radius) !important;
      border: 1px solid rgba(0, 0, 0, 0.15) !important;
      background-color: transparent !important;
      font-family: var(--form-font-family) !important;
      padding: 12px 16px !important;
      font-size: 16px !important;
      transition: all 0.2s ease-in-out !important;
      color: #000000 !important;
    }

    .form-generator input:focus,
    .form-generator select:focus,
    .form-generator textarea:focus {
      border-color: var(--form-primary-color) !important;
      background-color: rgba(255, 255, 255, 0.9) !important;
      box-shadow: 0 0 0 4px rgba(27, 94, 32, 0.15) !important;
      outline: none !important;
      transform: scale(1.01) !important;
    }

    /* 🍏 Styles iOS 18 pour les boutons de formulaire */
    .form-generator .button-primary,
    .form-generator button[type="submit"],
    .form-generator .btn-primary {
      background: var(--form-gradient-primary) !important;
      border: none !important;
      border-radius: var(--form-border-radius) !important;
      color: white !important;
      font-family: var(--form-font-family) !important;
      font-weight: 600 !important;
      font-size: 16px !important;
      padding: 14px 24px !important;
      transition: all 0.2s ease-in-out !important;
      box-shadow: 0 2px 8px rgba(27, 94, 32, 0.4) !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    }

    .form-generator .button-primary:hover,
    .form-generator button[type="submit"]:hover,
    .form-generator .btn-primary:hover {
      background: var(--form-gradient-accent) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 16px rgba(27, 94, 32, 0.5) !important;
    }

    /* 🍏 Styles iOS 18 pour les labels */
    .form-generator label,
    .form-generator .form-label {
      font-family: var(--form-font-family) !important;
      font-weight: 600 !important;
      font-size: 12px !important;
      color: rgba(60, 60, 67, 0.85) !important;
      margin-bottom: 4px !important;
      display: block !important;
    }

    /* Placeholders par défaut */
    .form-generator ::placeholder {
      color: rgba(60, 60, 67, 0.6) !important;
      opacity: 1 !important; /* Firefox */
    }

    /* 🍏 Styles iOS 18 pour les messages d'erreur */
    .form-generator .error-message {
      color: var(--form-error-color) !important;
      font-size: 12px !important;
      font-weight: 500 !important;
      margin-top: 4px !important;
      font-family: var(--form-font-family) !important;
    }

    /* 📱 Mobile-first optimizations */
    @media (max-width: 768px) {
      .form-generator {
        font-size: 16px !important; /* Évite le zoom sur iOS */
      }

      .form-generator input,
      .form-generator select,
      .form-generator textarea {
        font-size: 16px !important; /* Critical pour éviter le zoom sur iOS */
        padding: 19px 14px !important; /* +2px supplémentaires de hauteur */
        min-height: 49px !important; /* +2px supplémentaires */
        border-color: rgba(0, 0, 0, 0.40) !important; /* Bordures encore plus visibles */
        border-width: 1.5px !important; /* Légère augmentation d'épaisseur */
        border-radius: 12px !important; /* Plus petit border-radius sur mobile */
      }

      .form-generator button,
      .form-generator .button-primary,
      .form-generator button[type="submit"],
      .form-generator .btn-primary {
        min-height: 48px !important; /* Taille tactile optimale */
        font-size: 16px !important;
        padding: 16px 24px !important;
        width: 100% !important; /* Boutons full-width sur mobile */
        border-radius: 12px !important;
      }

      /* Espacement mobile optimisé */
      .form-generator .form-field {
        margin-bottom: 18px !important; /* Plus d'espace entre les champs */
      }

      .form-generator .form-section {
        padding: 16px !important;
        margin-bottom: 12px !important;
      }

      /* Labels plus petits sur mobile (mobile-first) */
      .form-generator label,
      .form-generator .form-label {
        font-size: 12px !important;
        margin-bottom: 6px !important;
      }

      /* Placeholders légèrement réduits sur mobile */
      .form-generator ::placeholder {
        font-size: 13px !important;
      }

      /* Titres de section plus compacts sur mobile */
      .form-generator .form-section-title,
      .form-generator .form-section h2,
      .form-generator .form-section h3 {
        font-size: 14px !important;
        line-height: 1.25 !important;
      }

      /* Messages d'erreur compacts mais lisibles */
      .form-generator .error-message {
        font-size: 13px !important;
        margin-top: 6px !important;
      }

      /* Réduit spécifiquement le texte "Contraintes & Spécificités" dans les boutons access-constraints */
      .form-generator button.border-orange-300 span.flex.items-center {
        font-size: 12px !important;
        line-height: 1.4 !important;
      }
    }

    /* 📱 Mobile touch optimizations */
    @media (max-width: 640px) {
      .form-generator {
        padding: 0 !important; /* Supprime le padding container sur mobile */
      }

      .form-generator input,
      .form-generator select,
      .form-generator textarea {
        padding: 19px 12px !important; /* +2px supplémentaires sur très petits écrans */
        border-color: rgba(0, 0, 0, 0.40) !important; /* Bordures encore plus visibles */
        border-width: 1.5px !important; /* Légère augmentation d'épaisseur */
      }

      /* Légère augmentation du gap horizontal pour les lignes multi-champs */
      .form-generator .form-row,
      .form-generator .form-group,
      .form-generator .form-grid {
        gap: 12px !important;
        column-gap: 12px !important;
        row-gap: 12px !important;
      }

      /* Réduit encore plus le texte "Contraintes & Spécificités" sur très petits écrans */
      .form-generator button.border-orange-300 span.flex.items-center {
        font-size: 11px !important;
        line-height: 1.3 !important;
      }

      /* Safe area optimizations pour iPhone */
      .form-generator.safe-area {
        padding-top: calc(16px + env(safe-area-inset-top)) !important;
        padding-bottom: calc(16px + env(safe-area-inset-bottom)) !important;
        padding-left: calc(16px + env(safe-area-inset-left)) !important;
        padding-right: calc(16px + env(safe-area-inset-right)) !important;
      }
    }

    /* 🌙 Dark mode pour les formulaires */
    @media (prefers-color-scheme: dark) {
      .form-generator input,
      .form-generator select,
      .form-generator textarea {
        background-color: transparent !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
        color: #FFFFFF !important;
      }

      .form-generator input:focus,
      .form-generator select:focus,
      .form-generator textarea:focus {
        background-color: rgba(255, 255, 255, 0.05) !important;
        border-color: var(--form-primary-color) !important;
      }

      .form-generator label,
      .form-generator .form-label {
        color: rgba(235, 235, 245, 0.85) !important;
      }
    }

    ${customStyles || ''}
  `;

  // 🎨 Debug en développement (supprimé pour éviter les logs répétitifs)

  return (
    <style dangerouslySetInnerHTML={{
      __html: minimalStyles
    }} />
  );
};

