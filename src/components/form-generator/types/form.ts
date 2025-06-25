export interface FormFieldOption {
  value: string; //   value: "express",
  label: string; //   label: "Livraison Express"
}

export interface FormFieldValidation {
  min?: number; //   min: 0,  
  max?: number; //   max: 100,
  pattern?: string; //   pattern: "^[0-9]+$",
  required?: boolean; //   required: true,
  custom?: (value: any, formData: any) => boolean | string; //   custom: (value, formData) => value < formData.maxBudget || "Le montant dépasse le budget"
}

export interface FormFieldConditional {
  dependsOn: string; //   dependsOn: "hasDelivery",
  condition: (value: any, formData?: any) => boolean; //   condition: (value, formData) => value === true && formData?.otherField > 3,
  validation?: FormFieldValidation; //   validation: {
  //     required: true
  //   }
}

export interface FormField {
  name: string; //   name: "deliveryOption",
  type: 
    | "text" 
    | "email" 
    | "password"
    | "number" 
    | "date" 
    | "textarea" 
    | "select" 
    | "checkbox" 
    | "radio"
    | "separator" // Pour les séparateurs visuels
    | "custom" // Pour les composants personnalisés
    | "address-pickup" // Pour PickupAddressAutocomplete
    | "address-delivery" // Pour DeliveryAddressAutocomplete
      | "logistics-modal" // Pour MovingConstraintsAndServicesModal
  | "service-constraints" // Pour MovingConstraintsAndServicesModal (contraintes d'accès et services) ou CleaningConstraintsModal (contraintes nettoyage)
    | "whatsapp-consent"; // Pour WhatsAppOptInConsent
  label?: string; //   label: "Option de livraison",                  
  required?: boolean; //   required: true,
  options?: FormFieldOption[]; //   options: [
  //     { value: "standard", label: "Standard (2-3 jours)" },
  //     { value: "express", label: "Express (24h)" }
  //   ],
  validation?: FormFieldValidation; //   validation: {
  //     custom: (value, formData) => 
  //       !(value === "express" && formData.distance > 100) || 
  //       "La livraison express n'est pas disponible pour cette distance"
  //   },
  conditional?: FormFieldConditional; //   conditional: {
  //     dependsOn: "hasDelivery",
  //     condition: (value) => value === true,
  //     validation: {
  //       required: true
  //     }
  //   }, 
  className?: string; //   className: "custom-field",
  icon?: string; //   icon: "fa-solid fa-truck",
  defaultValue?: any; //   defaultValue: "standard",
  // Propriétés de grille pour layout en colonnes
  columnSpan?: 1 | 2 | 3; //   columnSpan: 1, // 1 = une colonne, 2 = deux colonnes, 3 = trois colonnes (défaut: 1)
  inline?: boolean; //   inline: true, // Pour forcer sur la même ligne que le champ précédent
  // Pour les composants personnalisés
  component?: React.ComponentType<any>; //   component: CustomComponent,
  componentProps?: Record<string, any>; //   componentProps: {
  //     label: "Option de livraison",
  //     options: [
  //       { value: "standard", label: "Standard (2-3 jours)" },
  //       { value: "express", label: "Express (24h)" }
  //     ]
  //   },     
}

export interface FormSection {
  title?: string; //   title: "Informations de livraison",
  description?: string; //   description: "Veuillez remplir les champs ci-dessous",
  fields: FormField[]; //   fields: [
  //     { name: "deliveryOption", type: "select", label: "Option de livraison" }
  //   ],
  className?: string; //   className: "delivery-section",
  collapsible?: boolean; //   collapsible: true,
  defaultExpanded?: boolean; //   defaultExpanded: true,
  // Propriétés de grille pour la section
  columns?: 1 | 2 | 3; //   columns: 3, // Nombre de colonnes par défaut pour cette section (défaut: 1)
  // Conditions d'affichage de la section
  conditional?: FormFieldConditional; //   conditional: {
  //     dependsOn: "hasDelivery",
  //     condition: (value) => value === true
  //   },
}

export interface FormConfig {
  title?: string; //   title: "Formulaire de commande",
  description?: string; //   description: "Veuillez remplir les champs ci-dessous",
  serviceType?: "moving" | "cleaning" | "package" | "maintenance" | "general"; // Type de service pour le backend
  sections?: FormSection[]; //   sections: [
  //     { title: "Informations de livraison", fields: [
  //       { name: "deliveryOption", type: "select", label: "Option de livraison" }
  //     ] }
  //   ],
  fields?: FormField[]; // Pour compatibilité avec structure simple
  
  // Configuration du preset et layout
  preset?: "moving" | "contact" | "default"; // Preset automatique à utiliser
  customDefaults?: Record<string, any>; // Valeurs par défaut personnalisées
  customStyles?: string; // Styles CSS personnalisés
  layout?: {
    type?: "default" | "sidebar" | "custom" | "auth" | "package" | "package-edit" | "package-card" | "service-summary";
    autoSummary?: "moving" | "contact" | React.ComponentType<any>;
    summaryConfig?: any;
    component?: React.ComponentType<any>; // Pour layout custom
    
    // Options spécifiques au layout sidebar (nouvelles fonctionnalités)
    showPriceCalculation?: boolean;
    showConstraintsByAddress?: boolean;
    showModificationsSummary?: boolean;
    initialPrice?: number;
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
    
    // Options spécifiques au layout package
    packageOptions?: {
      packages: PackageOption[];
      selectedPackage?: string;
      onKeepPackage?: (packageId: string, formData: any) => void;
      onCustomizePackage?: (packageId: string, formData: any) => void;
      customizationTitle?: string;
    };
    
    // Options spécifiques au layout package-card
    packageCardOptions?: {
      packages: PackageOption[];
      onSelectPackage?: (packageId: string, packageData: PackageOption) => void;
      cardStyle?: "compact" | "detailed";
      showPricing?: boolean;
      columns?: 1 | 2 | 3 | 4;
    };
    
    // Options spécifiques au layout package-edit
    packageEditOptions?: {
      selectedPackage: PackageOption;
      initialData?: any;
      onSave?: (packageData: any, formData: any) => void;
      onCancel?: () => void;
      editTitle?: string;
      showPackageDetails?: boolean;
      allowPackageModification?: boolean;
    };
    
    // Options spécifiques au layout service-summary
    serviceSummaryOptions?: {
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
      serviceConfig?: {
        prestations?: Array<{
          icon?: React.ReactNode;
          text: string;
          included: boolean;
        }>;
        garanties?: Array<{
          title: string;
          description: string;
          icon?: React.ReactNode;
        }>;
        pricingRules?: {
          extraHours?: {
            type: 'hourly' | 'per_worker' | 'flat_fee' | 'custom';
            rate: number;
            label: string;
            unit?: string;
          };
          extraWorkers?: {
            type: 'hourly' | 'per_worker' | 'flat_fee' | 'custom';
            rate: number;
            label: string;
            unit?: string;
          };
          customRules?: Array<{
            type: 'hourly' | 'per_worker' | 'flat_fee' | 'custom';
            rate: number;
            label: string;
            unit?: string;
          }>;
        };
        insuranceConfig?: {
          show: boolean;
          price: number;
          label: string;
          description: string;
        };
      };
      
      // Configuration d'affichage (legacy, maintenant dans serviceConfig)
      showInsurance?: boolean;
      insurancePrice?: number;
      vatRate?: number;
      
      // Callbacks
      onEditQuote?: () => void;
      onConfirmQuote?: (customerData: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
      }, hasInsurance: boolean) => void;
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
    };
    
    // Options spécifiques au layout auth
    authOptions?: {
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
    };
  };
  
  submitLabel?: string; //   submitLabel: "Valider",
  cancelLabel?: string; //   cancelLabel: "Annuler",
  onSubmit?: (data: any) => void | Promise<void>; //   onSubmit: (data) => {
  //     console.log(data);
  //   },
  onCancel?: () => void; //   onCancel: () => {
  //     console.log("Annulation");
  //   },
  onChange?: (fieldName: string, value: any, formData: any) => void; //   onChange: (fieldName, value, formData) => {
  //     console.log(fieldName, value, formData);
  //   },
  onValidationError?: (errors: Record<string, any>) => void; //   onValidationError: (errors) => {
  //     console.log(errors);
  //   },
  className?: string; //   className: "form-container",
  isLoading?: boolean; //   isLoading: true,
  loadingText?: string; //   loadingText: "Chargement en cours...",
}

export interface FormGeneratorProps {
  config: FormConfig; //   config: FormConfig,    
}

export interface PackageOption {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: string;
  features: string[];
  icon?: React.ReactNode | string;
  popular?: boolean;
  customizable?: boolean;
  customizationFields?: FormField[];
} 