// Réexporter toutes les interfaces du fichier form.ts
export * from "./types/form";

// Réexporter les interfaces des presets
export * from "./types/presets";

// Nouvelles interfaces pour la configuration adaptable des services
export interface PricingRule {
  type: "hourly" | "per_worker" | "flat_fee" | "custom";
  rate: number;
  label: string;
  unit?: string;
}

export interface Prestation {
  icon?: React.ReactNode;
  text: string;
  included: boolean;
}

export interface Garantie {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export interface ServiceConfig {
  prestations?: Prestation[];
  garanties?: Garantie[];
  pricingRules?: {
    extraHours?: PricingRule;
    extraWorkers?: PricingRule;
    customRules?: PricingRule[];
  };
  insuranceConfig?: {
    show: boolean;
    price: number;
    label: string;
    description: string;
  };
}

export interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ServiceSummaryOptions {
  // Données du service
  serviceDetails: {
    id: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
    workers: number;
    type?: "cleaning" | "moving" | "package" | "maintenance" | "other";
  };

  // Données du devis
  quoteDetails: {
    id: string;
    scheduledDate?: string;
    duration?: number;
    workers?: number;
    location?: string;
    additionalInfo?: string;
    calculatedPrice: number;
  };

  // Configuration adaptable par type de service
  serviceConfig?: ServiceConfig;

  // Configuration d'affichage
  showInsurance?: boolean;
  insurancePrice?: number;
  vatRate?: number;

  // Callbacks
  onEditQuote?: () => void;
  onConfirmQuote?: (
    customerData: CustomerFormData,
    hasInsurance: boolean,
  ) => void;
  onInsuranceChange?: (hasInsurance: boolean, newTotal: number) => void;
  onBack?: () => void;

  // Customisation
  title?: string;
  description?: string;
  sections?: {
    showPrestations?: boolean;
    showGaranties?: boolean;
    showCustomerForm?: boolean;
  };

  // État de chargement
  isLoading?: boolean;
  saveStatus?: "saving" | "saved" | "error" | null;
}

// Interfaces pour les layouts
export interface SidebarLayoutOptions {
  autoSummary?: "moving" | "pack" | "contact" | React.ComponentType;
  summaryConfig?: Record<string, unknown>;
  // Nouvelles fonctionnalités du SidebarLayout amélioré
  showPriceCalculation?: boolean;
  showConstraintsByAddress?: boolean;
  showModificationsSummary?: boolean;
  initialPrice?: number;
  externalCalculatedPrice?: number;
  onPriceCalculated?: (price: number) => void;
  priceModifications?: Array<{
    label: string;
    amount: number;
    condition?: (formData: Record<string, unknown>) => boolean;
  }>;
  headerActions?: React.ReactNode;
  serviceInfo?: {
    name: string;
    description?: string;
    icon?: string;
    badge?: string;
    popular?: boolean;
    features?: string[];
    originalPrice?: number;
  };
}

// Type pour les presets d'industrie
export type IndustryPreset =
  | "catalogueMovingItem"
  | "catalogueCleaningItem"
  | "catalogueDeliveryItem"
  | "demenagement-sur-mesure"
  | "menage-sur-mesure"
  | "contact"
  | "default";
