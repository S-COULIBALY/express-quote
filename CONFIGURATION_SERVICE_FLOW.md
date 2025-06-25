# 🔄 Flux détaillé de `this.configService`

## 📋 Vue d'ensemble

Le `ConfigurationService` est le système central de gestion des paramètres configurables de l'application de devis. Il permet de gérer les prix, règles métier et paramètres de service de manière flexible et centralisée.

## 🏗️ Architecture globale

```mermaid
graph TD
    A[Application Start] --> B[ConfigurationLoaderService]
    B --> C[PrismaConfigurationRepository]
    C --> D[Base de données Prisma]
    C --> E[DefaultConfigurations.ts]
    E --> F[ConfigurationService]
    D --> F
    F --> G[Cache en mémoire]
    G --> H[MovingQuoteCalculator]
```

## 🚀 1. Initialisation du service

### Point d'entrée principal : `ConfigurationLoaderService.ts`

```typescript
async initialize(): Promise<ConfigurationService> {
  // 1. Récupération depuis la BDD via Prisma
  const pricingConfigs = await this.repository.findActiveByCategory(
    ConfigurationCategory.PRICING
  );
  const businessRulesConfigs = await this.repository.findActiveByCategory(
    ConfigurationCategory.BUSINESS_RULES
  );
  const limitsConfigs = await this.repository.findActiveByCategory(
    ConfigurationCategory.LIMITS
  );
  const serviceParamsConfigs = await this.repository.findActiveByCategory(
    ConfigurationCategory.SERVICE_PARAMS
  );
  
  // 2. Fusion de toutes les configurations
  const allConfigs = [
    ...pricingConfigs, 
    ...businessRulesConfigs, 
    ...limitsConfigs, 
    ...serviceParamsConfigs
  ];
  
  // 3. Création du service avec les configs chargées
  this.configService = new ConfigurationService(allConfigs);
  
  return this.configService;
}
```

## 🗄️ 2. Sources de données

### 🔹 Source principale : Base de données (via Prisma)

**Fichier :** `PrismaConfigurationRepository.ts`

```sql
-- Requête SQL générée par Prisma
SELECT * FROM configuration 
WHERE category = 'PRICING' 
  AND isActive = true 
  AND validFrom <= NOW() 
  AND (validTo IS NULL OR validTo > NOW())
ORDER BY validFrom DESC;
```

**Structure de la table `configuration` :**

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | String | Identifiant unique |
| `category` | Enum | Catégorie (PRICING, BUSINESS_RULES, etc.) |
| `key` | String | Clé de configuration |
| `value` | JSON | Valeur (peut être number, string, boolean, object) |
| `description` | String | Description de la configuration |
| `isActive` | Boolean | Configuration active/inactive |
| `validFrom` | DateTime | Date de début de validité |
| `validTo` | DateTime | Date de fin de validité (nullable) |

### 🔹 Source de fallback : Configurations par défaut

**Fichier :** `DefaultConfigurations.ts`

```typescript
export function createDefaultConfigurations(): Configuration[] {
  const configurations: Configuration[] = [];
  
  // ✅ MOVING - Configurations de déménagement
  configurations.push(createPricingConfig(
    PricingConfigKey.MOVING_BASE_PRICE_PER_M3, 10
  )); // 10€/m³
  configurations.push(createPricingConfig(
    PricingConfigKey.MOVING_DISTANCE_PRICE_PER_KM, 2
  )); // 2€/km
  configurations.push(createPricingConfig(
    PricingConfigKey.FUEL_CONSUMPTION_PER_100KM, 25
  )); // 25L/100km
  configurations.push(createPricingConfig(
    PricingConfigKey.FUEL_PRICE_PER_LITER, 1.8
  )); // 1.8€/L
  configurations.push(createPricingConfig(
    PricingConfigKey.TOLL_COST_PER_KM, 0.15
  )); // 0.15€/km
  configurations.push(createPricingConfig(
    PricingConfigKey.HIGHWAY_RATIO, 0.7
  )); // 70%
  
  // ✅ PACK - Configurations de forfaits
  configurations.push(createPricingConfig(
    PricingConfigKey.PACK_WORKER_PRICE, 120
  )); // 120€/jour
  configurations.push(createPricingConfig(
    PricingConfigKey.PACK_INCLUDED_DISTANCE, 20
  )); // 20km inclus
  configurations.push(createPricingConfig(
    PricingConfigKey.PACK_EXTRA_KM_PRICE, 1.5
  )); // 1.5€/km extra
  
  // ✅ SERVICE - Configurations de services
  configurations.push(createPricingConfig(
    PricingConfigKey.SERVICE_WORKER_PRICE_PER_HOUR, 35
  )); // 35€/h
  
  // ✅ BUSINESS_RULES - Règles métier
  configurations.push(createBusinessRulesConfig(
    BusinessRulesConfigKey.MOVING_EARLY_BOOKING_DAYS, 30
  )); // 30 jours
  configurations.push(createBusinessRulesConfig(
    BusinessRulesConfigKey.MOVING_WEEKEND_SURCHARGE, 15
  )); // 15% de supplément
  
  return configurations;
}
```

## 🔄 3. Flux de récupération d'une valeur

### Exemple d'appel dans `MovingQuoteCalculator.ts` :

```typescript
const pricePerM3 = this.configService.getNumberValue(
  PricingConfigKey.MOVING_BASE_PRICE_PER_M3, 
  10
);
```

### Séquence d'exécution :

```typescript
// 1. ConfigurationService.getNumberValue()
getNumberValue(key: PricingConfigKey, defaultValue: number): number {
  // 2. Recherche de la configuration
  const config = this.getConfiguration(ConfigurationCategory.PRICING, key);
  
  // 3. Fallback si non trouvé
  if (!config) return defaultValue;
  
  // 4. Conversion et validation
  const value = config.value;
  if (typeof value === 'number') return value;
  
  const numValue = Number(value);
  return isNaN(numValue) ? defaultValue : numValue;
}

// 5. Recherche dans le cache
getConfiguration(category: ConfigurationCategory, key: string): Configuration | null {
  const cacheKey = `${category}_${key}`;
  
  // Vérification du cache mémoire
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey) || null;
  }
  
  // Recherche dans la liste des configurations
  const config = this.configurations.find(
    c => c.category === category && c.key === key && c.isValid()
  );
  
  // Mise en cache si trouvé
  if (config) {
    this.cache.set(cacheKey, config);
    return config;
  }
  
  return null;
}
```

## 📊 4. Système de cache multi-niveaux

### 🔹 Niveau 1 : Cache mémoire (ConfigurationService)

```typescript
private cache: Map<string, Configuration> = new Map();

// Exemple d'entrée :
// Clé : "PRICING_MOVING_BASE_PRICE_PER_M3"
// Valeur : Configuration { 
//   category: 'PRICING', 
//   key: 'MOVING_BASE_PRICE_PER_M3', 
//   value: 12,
//   description: "Prix par m³ pour déménagement"
// }
```

### 🔹 Niveau 2 : Cache global (ConfigurationCacheService)

```typescript
private memoryCache: Map<string, any> = new Map();

// Optimisation pour accès ultra-rapide
// Clé : "PRICING_MOVING_BASE_PRICE_PER_M3"
// Valeur : 12 (valeur directe, sans objet Configuration)
```

### 🔹 Stratégie de cache

1. **Lecture** : Cache mémoire → Liste configurations → Base de données
2. **Écriture** : Base de données → Invalidation cache → Rechargement
3. **TTL** : Rafraîchissement automatique toutes les X minutes
4. **Fallback** : Configurations par défaut si échec de chargement

## 📂 5. Fichiers impliqués dans le flux

### 🔧 Configuration & Chargement

| Fichier | Rôle | Description |
|---------|------|-------------|
| `DefaultConfigurations.ts` | **Valeurs par défaut** | Configurations de fallback |
| `ConfigurationLoaderService.ts` | **Orchestrateur** | Chargement et initialisation |
| `PrismaConfigurationRepository.ts` | **Accès BDD** | Interface avec Prisma |
| `ConfigurationCacheService.ts` | **Cache global** | Optimisation des performances |

### 🏗️ Services & Domain

| Fichier | Rôle | Description |
|---------|------|-------------|
| `ConfigurationService.ts` (domain) | **Service métier** | Logique de récupération |
| `ConfigurationService.ts` (application) | **Service application** | Interface avec repository |
| `Configuration.ts` | **Entité domaine** | Modèle de données |
| `ConfigurationKey.ts` | **Énumérations** | Clés typées |

### 🔌 Injection de dépendances

| Fichier | Rôle | Description |
|---------|------|-------------|
| `container.ts` | **Enregistrement** | Configuration des services |
| `dependency-injection.ts` | **Configuration DI** | Injection globale |

## 💾 6. Exemple de données chargées

### Configuration complète au démarrage :

```json
{
  "PRICING": {
    "MOVING_BASE_PRICE_PER_M3": 12,
    "MOVING_DISTANCE_PRICE_PER_KM": 2.5,
    "FUEL_CONSUMPTION_PER_100KM": 25,
    "FUEL_PRICE_PER_LITER": 1.8,
    "TOLL_COST_PER_KM": 0.15,
    "HIGHWAY_RATIO": 0.7,
    "PACK_WORKER_PRICE": 120,
    "PACK_INCLUDED_DISTANCE": 20,
    "PACK_EXTRA_KM_PRICE": 1.5,
    "PACK_LIFT_PRICE": 200,
    "SERVICE_WORKER_PRICE_PER_HOUR": 35
  },
  "BUSINESS_RULES": {
    "MOVING_EARLY_BOOKING_DAYS": 30,
    "MOVING_EARLY_BOOKING_DISCOUNT": 10,
    "MOVING_WEEKEND_SURCHARGE": 15,
    "SERVICE_EARLY_BOOKING_DAYS": 14,
    "SERVICE_EARLY_BOOKING_DISCOUNT": 5,
    "PACK_URGENT_BOOKING_SURCHARGE": 20
  },
  "SERVICE_PARAMS": {
    "AVAILABLE_SERVICE_TYPES": ["MOVING", "PACK", "SERVICE"],
    "DEFAULT_CURRENCY": "EUR",
    "WORKING_HOURS_START": "08:00",
    "WORKING_HOURS_END": "18:00"
  },
  "LIMITS": {
    "MAX_VOLUME_M3": 100,
    "MAX_DISTANCE_KM": 500,
    "MIN_BOOKING_ADVANCE_HOURS": 24
  }
}
```

## 🔄 7. Cycle de vie d'une configuration

### Création/Modification

```typescript
// 1. Création via l'interface admin
const newConfig = Configuration.create(
  ConfigurationCategory.PRICING,
  'NEW_PRICE_KEY',
  25.50,
  'Nouveau prix pour service X'
);

// 2. Sauvegarde en base
await configRepository.save(newConfig);

// 3. Invalidation du cache
await cacheService.refreshCache();

// 4. Disponible immédiatement
const price = configService.getNumberValue('NEW_PRICE_KEY', 0);
```

### Historisation

- **Versioning** : Chaque modification crée une nouvelle version
- **Validité temporelle** : `validFrom` et `validTo` pour planifier les changements
- **Rollback** : Possibilité de revenir à une version antérieure
- **Audit** : Traçabilité complète des modifications

## 🎯 8. Résumé du flux

1. **🚀 Démarrage** → `ConfigurationLoaderService.initialize()`
2. **🗄️ BDD** → `PrismaConfigurationRepository` charge depuis la table `configuration`
3. **🔄 Fallback** → `DefaultConfigurations.ts` si BDD indisponible
4. **💾 Cache** → `ConfigurationService` stocke en mémoire pour performances
5. **⚡ Accès** → `getNumberValue()` retourne la valeur depuis le cache
6. **🔧 Usage** → `MovingQuoteCalculator` utilise les prix configurés

## ✅ Avantages du système

- **🎛️ Flexibilité** : Modification des prix sans redéploiement
- **🛡️ Robustesse** : Fallback automatique sur les valeurs par défaut
- **⚡ Performance** : Cache multi-niveaux pour accès rapide
- **📊 Traçabilité** : Historique complet des modifications
- **🔒 Validation** : Contrôle de cohérence des valeurs
- **⏰ Planification** : Changements programmés dans le temps

## 🔧 Configuration pour les développeurs

### Variables d'environnement

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/express_quote"

# Cache
CACHE_TTL_MINUTES=30
CACHE_REFRESH_INTERVAL_MINUTES=5

# Fallback
USE_DEFAULT_CONFIG_ON_ERROR=true
LOG_CONFIG_ERRORS=true
```

### Tests

```typescript
// Test avec mock de configuration
const mockConfigService = {
  getNumberValue: jest.fn().mockReturnValue(15)
};

const calculator = new MovingQuoteCalculator(mockConfigService, [], [], []);
// Tests avec valeurs contrôlées
```

Ce système garantit une gestion flexible et robuste de toutes les configurations de l'application ! 🚀 