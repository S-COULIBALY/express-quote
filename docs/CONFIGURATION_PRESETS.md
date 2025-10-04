# Configuration des Presets de Formulaires

Ce document détaille la configuration des presets de formulaires dans le nouveau système de catalogue.

## Table des matières

1. [Structure des presets](#structure-des-presets)
2. [Types de champs](#types-de-champs)
3. [Validation](#validation)
4. [Calculs de prix](#calculs-de-prix)
5. [Layouts](#layouts)
6. [Exemples](#exemples)

## Structure des presets

Un preset est composé de plusieurs sections :

```typescript
interface PresetConfig {
  // Configuration générale
  name: string;
  description?: string;
  type: ServiceType;

  // Structure du formulaire
  fields: FormField[];
  sections?: FormSection[];

  // Règles et comportements
  validation: ValidationRules;
  calculations: CalculationRules;

  // Présentation
  layout: LayoutConfig;
  styles: StyleConfig;
}
```

### Configuration minimale

```typescript
const MinimalPreset: PresetConfig = {
  name: "minimal",
  type: "basic",
  fields: [],
  validation: {},
  calculations: {
    basePrice: 0,
  },
  layout: {
    type: "default",
  },
};
```

## Types de champs

### Champs de base

```typescript
interface BaseField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
}
```

### Types disponibles

```typescript
type FieldType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "address"
  | "phone"
  | "email"
  | "textarea";
```

### Exemples de champs

```typescript
// Champ texte
const textField: FormField = {
  name: "customerName",
  label: "Nom du client",
  type: "text",
  required: true,
};

// Champ select
const selectField: FormField = {
  name: "serviceType",
  label: "Type de service",
  type: "select",
  options: [
    { value: "basic", label: "Basique" },
    { value: "premium", label: "Premium" },
  ],
};

// Champ adresse
const addressField: FormField = {
  name: "pickupAddress",
  label: "Adresse de départ",
  type: "address",
  required: true,
  validation: {
    geocoding: true,
  },
};
```

## Validation

### Règles de validation

```typescript
interface ValidationRules {
  // Règles par champ
  fields?: {
    [fieldName: string]: FieldValidation[];
  };

  // Règles globales
  form?: FormValidation[];

  // Dépendances entre champs
  dependencies?: FieldDependency[];
}
```

### Types de validation

```typescript
interface FieldValidation {
  type: ValidationType;
  value?: any;
  message: string;
}

type ValidationType =
  | "required"
  | "min"
  | "max"
  | "pattern"
  | "email"
  | "phone"
  | "date"
  | "custom";
```

### Exemple de validation

```typescript
const validation: ValidationRules = {
  fields: {
    email: [
      {
        type: "required",
        message: "L'email est requis",
      },
      {
        type: "email",
        message: "Format d'email invalide",
      },
    ],
    phone: [
      {
        type: "pattern",
        value: /^(\+33|0)[1-9](\d{2}){4}$/,
        message: "Format de téléphone invalide",
      },
    ],
  },
  dependencies: [
    {
      field: "hasElevator",
      affects: ["floorNumber"],
      condition: (value) => value === false,
      validation: {
        type: "required",
        message: "L'étage est requis sans ascenseur",
      },
    },
  ],
};
```

## Calculs de prix

### Structure des calculs

```typescript
interface CalculationRules {
  // Prix de base
  basePrice: number | ((data: FormData) => number);

  // Ajustements
  adjustments?: PriceAdjustment[];

  // Multiplicateurs
  multipliers?: PriceMultiplier[];

  // Réductions
  discounts?: Discount[];
}
```

### Types d'ajustements

```typescript
interface PriceAdjustment {
  type: string;
  amount: number | ((data: FormData) => number);
  condition?: (data: FormData) => boolean;
}

interface PriceMultiplier {
  factor: number;
  condition: (data: FormData) => boolean;
}

interface Discount {
  type: "percentage" | "fixed";
  value: number;
  condition?: (data: FormData) => boolean;
}
```

### Exemple de calculs

```typescript
const calculations: CalculationRules = {
  basePrice: 299.99,

  adjustments: [
    {
      type: "distance",
      amount: (data) => calculateDistancePrice(data.distance),
      condition: (data) => data.distance > 50,
    },
    {
      type: "floor",
      amount: (data) => data.floor * 20,
      condition: (data) => !data.hasElevator,
    },
  ],

  multipliers: [
    {
      factor: 1.5,
      condition: (data) => data.isUrgent,
    },
  ],

  discounts: [
    {
      type: "percentage",
      value: 10,
      condition: (data) => data.isFirstTime,
    },
  ],
};
```

## Layouts

### Types de layouts

```typescript
type LayoutType = "default" | "sidebar" | "service-summary";

interface LayoutConfig {
  type: LayoutType;
  options?: LayoutOptions;
}
```

### Options de layout

```typescript
interface SidebarLayoutOptions {
  showPriceCalculation?: boolean;
  showConstraintsByAddress?: boolean;
  showModificationsSummary?: boolean;
  headerActions?: React.ReactNode;
}

interface ServiceSummaryOptions {
  showPrestations?: boolean;
  showGaranties?: boolean;
  showCustomerForm?: boolean;
}
```

### Exemple de layout

```typescript
const layout: LayoutConfig = {
  type: "sidebar",
  options: {
    showPriceCalculation: true,
    showConstraintsByAddress: true,
    headerActions: <PriceAlert />
  }
};
```

## Exemples

### Preset complet pour déménagement

```typescript
export const CatalogueMovingItemPreset: PresetConfig = {
  name: "catalogue-moving",
  type: "moving",

  fields: [
    {
      name: "moveDate",
      label: "Date du déménagement",
      type: "date",
      required: true,
      validation: {
        minDate: "today",
      },
    },
    {
      name: "pickupAddress",
      label: "Adresse de départ",
      type: "address",
      required: true,
      validation: {
        geocoding: true,
      },
    },
    {
      name: "deliveryAddress",
      label: "Adresse d'arrivée",
      type: "address",
      required: true,
      validation: {
        geocoding: true,
      },
    },
    {
      name: "hasElevator",
      label: "Ascenseur disponible",
      type: "checkbox",
    },
    {
      name: "floorNumber",
      label: "Étage",
      type: "number",
      condition: (data) => !data.hasElevator,
    },
  ],

  validation: {
    fields: {
      moveDate: [
        {
          type: "required",
          message: "La date est requise",
        },
        {
          type: "date",
          value: "future",
          message: "La date doit être future",
        },
      ],
    },
    dependencies: [
      {
        field: "hasElevator",
        affects: ["floorNumber"],
        condition: (value) => !value,
        validation: {
          type: "required",
          message: "L'étage est requis sans ascenseur",
        },
      },
    ],
  },

  calculations: {
    basePrice: 299.99,
    adjustments: [
      {
        type: "distance",
        amount: (data) =>
          calculateDistancePrice(data.pickupAddress, data.deliveryAddress),
      },
      {
        type: "floor",
        amount: (data) => data.floorNumber * 20,
        condition: (data) => !data.hasElevator,
      },
    ],
    multipliers: [
      {
        factor: 1.2,
        condition: (data) => isWeekend(data.moveDate),
      },
    ],
  },

  layout: {
    type: "sidebar",
    options: {
      showPriceCalculation: true,
      showConstraintsByAddress: true,
      showModificationsSummary: true,
    },
  },
};
```

### Preset pour nettoyage

```typescript
export const CatalogueCleaningItemPreset: PresetConfig = {
  name: "catalogue-cleaning",
  type: "cleaning",

  fields: [
    {
      name: "serviceDate",
      label: "Date du service",
      type: "date",
      required: true,
    },
    {
      name: "address",
      label: "Adresse",
      type: "address",
      required: true,
    },
    {
      name: "surface",
      label: "Surface (m²)",
      type: "number",
      required: true,
      validation: {
        min: 20,
        max: 500,
      },
    },
    {
      name: "options",
      label: "Options",
      type: "checkbox",
      options: [
        { value: "windows", label: "Vitres" },
        { value: "carpet", label: "Moquette" },
        { value: "dishes", label: "Vaisselle" },
      ],
    },
  ],

  calculations: {
    basePrice: (data) => data.surface * 2,
    adjustments: [
      {
        type: "windows",
        amount: 30,
        condition: (data) => data.options.includes("windows"),
      },
      {
        type: "carpet",
        amount: (data) => data.surface * 0.5,
        condition: (data) => data.options.includes("carpet"),
      },
    ],
  },

  layout: {
    type: "service-summary",
    options: {
      showPrestations: true,
      showGaranties: true,
    },
  },
};
```

## Bonnes pratiques

1. **Nommage explicite**

   ```typescript
   // ✅ Bon
   const field = {
     name: "pickupAddress",
     label: "Adresse de départ",
   };

   // ❌ Mauvais
   const field = {
     name: "addr1",
     label: "Adresse",
   };
   ```

2. **Validation complète**

   ```typescript
   // ✅ Bon
   const validation = {
     required: true,
     pattern: /^\d{5}$/,
     message: "Code postal invalide (5 chiffres)",
   };

   // ❌ Mauvais
   const validation = {
     required: true,
   };
   ```

3. **Calculs modulaires**

   ```typescript
   // ✅ Bon
   const calculations = {
     basePrice: calculateBasePrice,
     adjustments: [
       { type: "distance", amount: calculateDistance },
       { type: "options", amount: calculateOptions },
     ],
   };

   // ❌ Mauvais
   const calculations = {
     basePrice: (data) => {
       let price = 100;
       if (data.distance) price += data.distance * 2;
       if (data.options) price += Object.keys(data.options).length * 10;
       return price;
     },
   };
   ```

4. **Documentation**
   ```typescript
   // ✅ Bon
   /**
    * Calcule le prix en fonction de la distance
    * @param {number} distance - Distance en km
    * @returns {number} Prix calculé
    */
   const calculateDistancePrice = (distance: number): number => {
     return distance * PRICE_PER_KM;
   };
   ```

## Conclusion

Une bonne configuration des presets est essentielle pour :

- La maintenabilité du code
- La réutilisabilité des composants
- La cohérence de l'expérience utilisateur
- La fiabilité des calculs
- La validation des données
