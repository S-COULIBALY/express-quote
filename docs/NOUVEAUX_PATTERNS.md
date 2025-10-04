# Nouveaux Patterns de Développement

Ce document décrit les nouveaux patterns de développement utilisés dans le projet.

## Table des matières

1. [Architecture en couches](#architecture-en-couches)
2. [Pattern Template-Item-Selection](#pattern-template-item-selection)
3. [Presets de formulaires](#presets-de-formulaires)
4. [Gestion des états](#gestion-des-états)
5. [Validation et erreurs](#validation-et-erreurs)

## Architecture en couches

Le projet suit une architecture en couches claire :

```
src/
├── app/              # Couche présentation (Next.js App Router)
├── components/       # Composants réutilisables
├── quotation/       # Logique métier
│   ├── application/ # Services et handlers
│   ├── domain/      # Modèles et interfaces
│   └── infrastructure/ # Implémentations concrètes
└── utils/           # Utilitaires partagés
```

### Principes SOLID

1. **Single Responsibility**
   - Chaque composant a une seule responsabilité
   - Les presets sont séparés par type de service

2. **Open/Closed**
   - Les presets sont extensibles sans modification
   - Utilisation d'interfaces pour l'extension

3. **Liskov Substitution**
   - Les presets spécialisés peuvent remplacer les génériques
   - Respect des contrats d'interface

4. **Interface Segregation**
   - Interfaces spécifiques par type de service
   - Pas de dépendances inutiles

5. **Dependency Inversion**
   - Injection des dépendances
   - Couplage faible entre les composants

## Pattern Template-Item-Selection

### Template (Modèle)

```typescript
interface Template {
  id: string;
  name: string;
  type: ServiceType;
  description?: string;
  defaultConfig: ServiceConfig;
}
```

Responsabilités :

- Définir la structure de base d'un service
- Fournir la configuration par défaut
- Garantir la cohérence des services

### Item (Instance)

```typescript
interface Item {
  id: string;
  templateId: string;
  name: string;
  price: number;
  config: ServiceConfig;
  constraints: ServiceConstraints;
}
```

Responsabilités :

- Représenter une instance concrète
- Définir les prix et contraintes
- Personnaliser la configuration

### Selection (Présentation)

```typescript
interface CatalogSelection {
  id: string;
  itemId: string;
  name: string;
  description: string;
  features: string[];
  marketing: MarketingConfig;
}
```

Responsabilités :

- Gérer l'aspect marketing
- Définir la présentation
- Configurer les options de vente

## Presets de formulaires

### Structure des presets

```typescript
interface PresetConfig {
  fields: FormField[];
  validation: ValidationRules;
  calculations: CalculationRules;
  layout: LayoutConfig;
}
```

### Exemple de preset catalogue

```typescript
export const CatalogueMovingItemPreset: PresetConfig = {
  fields: [
    {
      name: "moveDate",
      type: "date",
      validation: {
        required: true,
        minDate: "today",
      },
    },
    // ... autres champs
  ],
  validation: {
    dependencies: [
      {
        field: "hasElevator",
        affects: ["floorNumber"],
      },
    ],
  },
  calculations: {
    basePrice: (data) => calculateBasePrice(data),
    adjustments: [
      {
        type: "distance",
        calculate: (data) => calculateDistancePrice(data),
      },
    ],
  },
};
```

## Gestion des états

### État local vs global

```typescript
// État local (composant)
const [formData, setFormData] = useState<FormData>();

// État global (contexte)
const { catalogueState, dispatch } = useCatalogueContext();
```

### Actions et réducteurs

```typescript
// Actions
export const catalogueActions = {
  updatePrice: (price: number) => ({
    type: "UPDATE_PRICE",
    payload: price,
  }),
  // ... autres actions
};

// Réducteur
export const catalogueReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_PRICE":
      return {
        ...state,
        price: action.payload,
      };
    // ... autres cas
  }
};
```

## Validation et erreurs

### Validation des données

```typescript
interface ValidationRule {
  type: "required" | "min" | "max" | "pattern";
  value?: any;
  message: string;
}

interface FieldValidation {
  field: string;
  rules: ValidationRule[];
}

const validateField = (value: any, rules: ValidationRule[]): string[] => {
  return rules
    .filter((rule) => !isValid(value, rule))
    .map((rule) => rule.message);
};
```

### Gestion des erreurs

```typescript
interface ErrorState {
  field: string;
  errors: string[];
  touched: boolean;
}

const ErrorDisplay: React.FC<ErrorState> = ({ field, errors, touched }) => {
  if (!touched || errors.length === 0) return null;

  return (
    <div className="error-messages">
      {errors.map(error => (
        <p key={error} className="text-red-500">{error}</p>
      ))}
    </div>
  );
};
```

## Bonnes pratiques

1. **Immutabilité**

   ```typescript
   // ❌ Mauvais
   const updatePrice = (item) => {
     item.price = calculatePrice(item);
   };

   // ✅ Bon
   const updatePrice = (item) => ({
     ...item,
     price: calculatePrice(item),
   });
   ```

2. **Composition**

   ```typescript
   // ✅ Composition de presets
   const customPreset = mergeWithGlobalPreset({
     fields: customFields,
     validation: customValidation,
   });
   ```

3. **Type Safety**

   ```typescript
   // ✅ Types stricts
   type ServiceType = "moving" | "cleaning" | "delivery";
   type PriceCalculation = (data: ServiceData) => number;
   ```

4. **Tests**
   ```typescript
   describe("CatalogueMovingItemPreset", () => {
     it("calculates correct price", () => {
       const data = mockServiceData();
       const price = calculatePrice(data);
       expect(price).toBe(expectedPrice);
     });
   });
   ```

## Conclusion

Ces nouveaux patterns apportent :

- Une meilleure organisation du code
- Une maintenance plus facile
- Une extensibilité accrue
- Une meilleure testabilité
- Une réutilisation simplifiée
