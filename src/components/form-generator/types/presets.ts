import React from "react";
import { FormConfig } from "./form";

// Types pour les presets
export type IndustryPreset = "moving" | "cleaning" | "catalogueMovingItem" | "catalogueCleaningItem" | "catalogueDeliveryItem" | "contact" | "default";

// Configuration d'un preset complet
export interface PresetConfig {
  // Configuration du formulaire
  form: FormConfig;
  
  // Valeurs par défaut spécifiques
  defaultValues: Record<string, any>;
  
  // Configuration du récapitulatif (sidebar)
  summary?: FormSummaryConfig;
  
  // Layout personnalisé pour ce métier
  layout?: React.ComponentType<any>;
  
  // Styles CSS spécifiques
  styles?: string;
  
  // Métadonnées
  meta: {
    industry: string;
    name: string;
    description: string;
    version: string;
  };
}

// Configuration pour les récapitulatifs (sidebar)
export interface FormSummarySection {
  title: string;
  icon?: string;
  fields: Array<{
    key: string;
    label: string;
    format?: (value: any, formData: any) => string;
    condition?: (value: any, formData: any) => boolean;
    style?: string;
  }>;
}

export interface FormSummaryConfig {
  title: string;
  sections: FormSummarySection[];
  footer?: {
    totalLabel?: string;
    totalValue?: string | ((formData: any) => string);
    subtitle?: string;
  };
  className?: string;
}

// Configuration pour les layouts personnalisés
export interface FormLayoutProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  formData?: any;
  sidebar?: React.ReactNode;
  className?: string;
}

// Configuration pour les defaultValues
export interface FormDefaultValuesConfig {
  preset?: IndustryPreset;
  customDefaults?: Record<string, any>;
} 