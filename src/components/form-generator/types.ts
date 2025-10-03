// Réexporter toutes les interfaces du fichier form.ts
export * from './types/form';

// Réexporter les interfaces des presets
export * from './types/presets';

// Nouvelles interfaces pour la configuration adaptable des services
export interface PricingRule {
  type: 'hourly' | 'per_worker' | 'flat_fee' | 'custom';
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
    type?: 'cleaning' | 'moving' | 'package' | 'maintenance' | 'other';
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
  
  // Configuration d'affichage (legacy, maintenant dans serviceConfig)
  showInsurance?: boolean;
  insurancePrice?: number;
  vatRate?: number;
  
  // Callbacks
  onEditQuote?: () => void;
  onConfirmQuote?: (customerData: CustomerFormData, hasInsurance: boolean) => void;
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
  saveStatus?: 'saving' | 'saved' | 'error' | null;
}

// Interfaces pour les layouts (définies après l'import de PackageOption)
export interface DefaultLayoutOptions {
  // Options pour le layout par défaut
}

export interface SidebarLayoutOptions {
  autoSummary?: "moving" | "pack" | "contact" | React.ComponentType<any>;
  summaryConfig?: any;
  // Nouvelles fonctionnalités du SidebarLayout amélioré
  showPriceCalculation?: boolean;
  showConstraintsByAddress?: boolean;
  showModificationsSummary?: boolean;
  initialPrice?: number;
  externalCalculatedPrice?: number; // ✅ Ajouter le prix calculé externe
  onPriceCalculated?: (price: number) => void;
  priceModifications?: Array<{
    label: string;
    amount: number;
    condition?: (formData: any) => boolean;
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

export interface AuthLayoutOptions {
  logo?: React.ReactNode | string;
  showSecurityBadge?: boolean;
  footerLinks?: Array<{
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  backgroundImage?: string;
  variant?: "centered" | "split" | "minimal";
  // Providers de confiance
  trustedProviders?: {
    enabled?: boolean;
    title?: string;
    providers?: Array<{
      name: string;
      label: string;
      icon?: React.ReactNode;
      onClick: () => void;
      bgColor?: string;
      textColor?: string;
      borderColor?: string;
    }>;
  };
}

// Import du type PackageOption depuis form.ts
import type { PackageOption } from './types/form';

export interface PackageLayoutOptions {
  packages: PackageOption[];
  selectedPackage?: string;
  onKeepPackage?: (packageId: string, formData: any) => void;
  onCustomizePackage?: (packageId: string, formData: any) => void;
  customizationTitle?: string;
}

export interface PackageCardLayoutOptions {
  packages: PackageOption[];
  onSelectPackage?: (packageId: string, packageData: PackageOption) => void;
  cardStyle?: "compact" | "detailed";
  showPricing?: boolean;
  columns?: 1 | 2 | 3 | 4;
}

export interface PackageEditLayoutOptions {
  selectedPackage: PackageOption;
  initialData?: any;
  onSave?: (packageData: any, formData: any) => void;
  onCancel?: () => void;
  editTitle?: string;
  showPackageDetails?: boolean;
  allowPackageModification?: boolean;
}

// Type pour les presets d'industrie
export type IndustryPreset = "moving" | "cleaning" | "catalogueMovingItem" | "catalogueCleaningItem" | "catalogueDeliveryItem" | "contact" | "default" | "demenagement-sur-mesure" | "menage-sur-mesure"; 