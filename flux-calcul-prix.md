# Flux de calcul des prix dans l'application

Ce document détaille le flux de récupération et d'utilisation des règles métier et configurations pour le calcul des prix dans l'application.

## 1. Structure des fichiers clés

### Repositories (Accès aux données)
- **PrismaRuleRepository** (`src/quotation/infrastructure/repositories/PrismaRuleRepository.ts`)
  - Récupère les règles de la base de données
  - Méthodes clés: `findByServiceType()`, `findAllActive()`

- **PrismaConfigurationRepository** (`src/quotation/infrastructure/repositories/PrismaConfigurationRepository.ts`)
  - Récupère les configurations depuis la base de données
  - Méthodes clés: `findActiveByCategory()`, `findActiveByKey()`

### Définition des règles métier
- **MovingRules** (`src/quotation/domain/rules/MovingRules.ts`)
- **PackRules** (`src/quotation/domain/rules/PackRules.ts`)
- **ServiceRules** (`src/quotation/domain/rules/ServiceRules.ts`)
- **CleaningRules** (`src/quotation/domain/rules/cleaningRules.ts`)

### Factory et calculateurs
- **QuoteCalculatorFactory** (`src/quotation/application/factories/QuoteCalculatorFactory.ts`)
  - Crée le calculateur avec les règles et configurations
- **QuoteCalculator** (`src/quotation/domain/calculators/MovingQuoteCalculator.ts`)
  - Effectue les calculs de prix
- **RuleEngine** (`src/quotation/domain/services/RuleEngine.ts`)
  - Applique les règles métier

### Modèles de données
- **Rule** (`src/quotation/domain/valueObjects/Rule.ts`)
  - Représente une règle de tarification
- **Configuration** (`src/quotation/domain/configuration/Configuration.ts`)
  - Représente une configuration système

## 2. Flux de récupération et calcul

```
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│    Base de        │     │   Repositories    │     │    Factory        │
│    données        │────▶│  - RuleRepository │────▶│QuoteCalculator    │
│  - rules          │     │  - ConfigRepo     │     │     Factory       │
│  - configurations │     └───────────────────┘     └───────────────────┘
└───────────────────┘                                         │
                                                              ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│     Context       │     │    RuleEngine     │     │ QuoteCalculator   │
│  (informations    │────▶│  - Exécute les    │◀────│  - Calcule prix   │
│  pour le devis)   │     │    règles         │     │    de base        │
└───────────────────┘     └───────────────────┘     └───────────────────┘
                                   │
                                   ▼
                           ┌───────────────────┐
                           │      Quote        │
                           │   - Prix final    │
                           │   - Réductions    │
                           └───────────────────┘
```

### 2.1 Récupération des règles et configurations

```typescript
// Dans QuoteCalculatorFactory.createDefaultCalculator()
// Récupération des règles de la base de données
const movingRules = await QuoteCalculatorFactory.ruleRepository.findByServiceType(ServiceType.MOVING);
const packRules = await QuoteCalculatorFactory.ruleRepository.findByServiceType(ServiceType.PACK); 
const serviceRules = await QuoteCalculatorFactory.ruleRepository.findByServiceType(ServiceType.SERVICE);

// Récupération des configurations de la base de données
const pricingConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
  ConfigurationCategory.PRICING
);
const businessRulesConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
  ConfigurationCategory.BUSINESS_RULES
);
const limitsConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
  ConfigurationCategory.LIMITS
);
const serviceParamsConfigs = await QuoteCalculatorFactory.configRepository.findActiveByCategory(
  ConfigurationCategory.SERVICE_PARAMS
);

// Combiner les configurations
const allConfigurations = [
  ...pricingConfigs,
  ...businessRulesConfigs,
  ...limitsConfigs,
  ...serviceParamsConfigs
];

// Créer le service de configuration
const configService = new ConfigurationService(allConfigurations);

// Créer le calculateur
return new QuoteCalculator(configService, movingRules, packRules, serviceRules);
```

### 2.2 Calcul de prix avec application des règles

```typescript
// Dans QuoteCalculator.calculate()
async calculate(context: QuoteContext): Promise<Quote> {
  const serviceType = context.getServiceType();
  let rules: Rule[];
  
  // Sélectionner les règles en fonction du type de service
  switch(serviceType) {
    case ServiceType.MOVING:
      rules = this.rules; // règles de déménagement
      break;
    case ServiceType.PACK:
      rules = this.packRules;
      break;
    case ServiceType.SERVICE:
      rules = this.serviceRules;
      break;
  }
  
  // Calculer le prix de base
  const basePrice = this.getBasePrice(context);
  
  // Appliquer les règles via le RuleEngine
  const { finalPrice, discounts } = this.ruleEngine.execute(context, basePrice);
  
  // Retourner le devis final
  return new Quote(
    basePrice,
    finalPrice,
    discounts,
    serviceType
  );
}
```

### 2.3 Exécution des règles par le RuleEngine

```typescript
// Dans RuleEngine.execute()
execute(context: QuoteContext, basePrice: Money): RuleExecutionResult {
  let finalPrice = basePrice;
  const discounts: Discount[] = [];
  
  // 1. Appliquer d'abord les règles en pourcentage
  const percentageRules = this.rules.filter(rule => rule.isPercentage());
  for (const rule of percentageRules) {
    const result = rule.apply(finalPrice, context);
    if (result.isApplied) {
      finalPrice = result.newPrice;
      
      // Si c'est une réduction, l'ajouter à la liste des réductions
      if (result.impact < 0) {
        discounts.push(new Discount(
          rule.name,
          DiscountType.PERCENTAGE,
          Math.abs(rule.value),
          rule.name
        ));
      }
    }
  }
  
  // 2. Ensuite appliquer les règles en montant fixe
  const fixedRules = this.rules.filter(rule => !rule.isPercentage());
  for (const rule of fixedRules) {
    // Traitement spécial pour la règle "Tarif minimum"
    if (rule.name === 'Tarif minimum') {
      const minimumAmount = rule.value;
      if (finalPrice.getAmount() < minimumAmount) {
        finalPrice = new Money(minimumAmount);
      }
      continue;
    }
    
    const result = rule.apply(finalPrice, context);
    if (result.isApplied) {
      finalPrice = result.newPrice;
      
      // Si c'est une réduction, l'ajouter à la liste des réductions
      if (result.impact < 0) {
        discounts.push(new Discount(
          rule.name,
          DiscountType.FIXED,
          Math.abs(result.impact),
          rule.name
        ));
      }
    }
  }
  
  return { finalPrice, discounts };
}
```

## 3. Structure des données

### 3.1 Rule (Règle métier)
Une règle définit comment modifier le prix en fonction de certaines conditions.

```typescript
export class Rule {
  constructor(
    public readonly name: string,
    public readonly serviceType: string,
    public readonly value: number,
    private readonly condition?: string | ((context: QuoteContext) => boolean),
    public readonly isActive: boolean = true,
    public readonly id?: string
  ) {}
  
  // Vérifie si la règle s'applique au contexte donné
  public isApplicable(context: QuoteContext): boolean { ... }
  
  // Applique la règle au prix donné
  public apply(basePrice: Money, context: QuoteContext): { 
    isApplied: boolean; 
    newPrice: Money; 
    impact: number 
  } { ... }
}
```

### 3.2 Configuration
Une configuration stocke les paramètres système nécessaires au calcul.

```typescript
export class Configuration {
  constructor(
    public readonly id: string,
    public readonly category: ConfigurationCategory,
    public readonly key: string,
    public readonly value: any,
    public readonly description?: string,
    public readonly isActive: boolean = true,
    public readonly validFrom: Date = new Date(),
    public readonly validTo?: Date,
    public readonly updatedAt?: Date
  ) {}
}
```

## 4. Exemple de règles dans la base de données

Exemples de règles trouvées dans la base de données :

- **Majoration week-end** (type: SERVICE, valeur: 25%)
- **Réduction réservation anticipée** (type: SERVICE, valeur: 5%)
- **Majoration horaires étendus** (type: SERVICE, valeur: 15%)
- **Réduction longue durée** (type: SERVICE)

## 5. Exemple de configurations dans la base de données

Exemples de configurations trouvées dans la base de données :

- **SERVICE_WORKER_DISCOUNT_RATE_SHORT** (valeur: 0.1)
- **MOVING_EARLY_BOOKING_DAYS** (valeur: 30 jours)
- **PACK_EXTRA_DAY_DISCOUNT_RATE** (valeur: 0.8)
- **SERVICE_WORKER_PRICE_PER_HOUR** (valeur: 35)
- **SERVICE_EARLY_BOOKING_DAYS** (valeur: 14 jours) 