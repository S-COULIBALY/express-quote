# 📡 Documentation API - Système Modulaire de Devis

**Version** : 1.0  
**Date** : 2025-12-23  
**Base URL** : `/api/quotation`

---

## 🎯 Vue d'ensemble

Cette API permet de calculer des devis de déménagement en utilisant le **système modulaire** avec :

- ✅ Calcul déterministe basé sur des modules métier
- ✅ Multi-offres (6 variantes parallèles)
- ✅ Traçabilité complète (modules activés, décisions)
- ✅ Formatage standardisé (devis, checklist, contrat, audit)

### Architecture

L'API est organisée selon une architecture en couches :

- **Routes** (`src/app/api/quotation/`) : Points d'entrée HTTP uniquement, délèguent au contrôleur
- **Contrôleur** (`src/quotation-module/interfaces/http/controllers/QuoteController.ts`) : Orchestration de la logique métier
- **Moteur modulaire** (`src/quotation-module/core/`) : Exécution des modules métier
- **Services** (`src/quotation-module/services/`) : Formatage et agrégation des résultats

---

## 📋 Table des matières

1. [Endpoints principaux](#endpoints-principaux)
2. [Schémas de données](#schémas-de-données)
3. [Exemples d'utilisation](#exemples-dutilisation)
4. [Gestion d'erreurs](#gestion-derreurs)
5. [Rate limiting](#rate-limiting)

---

## 🔌 Endpoints principaux

### 1. Calcul de devis simple

**`POST /api/quotation/calculate`**

Calcule un devis unique avec le moteur modulaire.

#### Requête

```typescript
{
  // Informations déménagement
  movingDate: string;              // ISO 8601: "2026-03-20T10:00:00Z"
  housingType: "STUDIO" | "F2" | "F3" | "F4" | "HOUSE";
  surface: number;                 // m²
  rooms?: number;

  // Volume
  volumeMethod: "FORM" | "LIST" | "VIDEO";
  estimatedVolume?: number;        // m³
  volumeConfidence?: "LOW" | "MEDIUM" | "HIGH";

  // Adresses
  departureAddress: string;
  departurePostalCode?: string;
  departureCity?: string;
  pickupFloor?: number;
  pickupHasElevator?: boolean;
  pickupCarryDistance?: number;    // mètres

  arrivalAddress: string;
  arrivalPostalCode?: string;
  arrivalCity?: string;
  deliveryFloor?: number;
  deliveryHasElevator?: boolean;
  deliveryCarryDistance?: number;  // mètres

  // Distance (calculée par le frontend via Google Maps)
  distance?: number;               // kilomètres

  // Inventaire
  bulkyFurniture?: boolean;
  piano?: boolean;
  safe?: boolean;
  artwork?: boolean;

  // Services
  packing?: boolean;
  cleaningEnd?: boolean;
  temporaryStorage?: boolean;
  storageDurationDays?: number;

  // Assurance
  declaredValue?: number;           // €

  // Options
  refuseLiftDespiteRecommendation?: boolean;

  // Options moteur (optionnel)
  marginRate?: number;              // Défaut: 0.30 (30%)
  executionPhase?: "QUOTE" | "CONTRACT" | "OPERATIONS"; // Défaut: "QUOTE"
}
```

#### Réponse (200 OK)

```typescript
{
  success: true;
  quoteId: string;                  // ID unique du devis
  generatedAt: string;              // ISO 8601

  // Prix
  pricing: {
    totalCosts: number;             // Coûts bruts totaux
    basePrice: number;              // Prix de base (coûts + marge)
    finalPrice: number;             // Prix final (base + ajustements)
    marginRate: number;             // Taux de marge appliqué
    breakdown: {
      costsByCategory: {            // Coûts par catégorie
        TRANSPORT: number;
        VEHICLE: number;
        LABOR: number;
        INSURANCE: number;
        RISK: number;
        ADMINISTRATIVE: number;
        TEMPORAL: number;
      };
      costsByModule: Array<{        // Détail par module
        moduleId: string;
        label: string;
        amount: number;
        category: string;
      }>;
      adjustments: Array<{          // Ajustements (surcharges/réductions)
        moduleId: string;
        label: string;
        amount: number;
        type: string;
        reason: string;
      }>;
    };
  };

  // Logistique
  logistics: {
    baseVolume: number;             // Volume de base (m³)
    adjustedVolume: number;         // Volume ajusté (m³)
    vehicleCount: number;           // Nombre de véhicules
    vehicleTypes: string[];        // Types de véhicules
    workersCount: number;          // Nombre de déménageurs
    estimatedDurationHours: number; // Durée estimée (heures)
  };

  // Risque
  risk: {
    riskScore: number;              // Score de risque (0-100)
    manualReviewRequired: boolean;  // Revérification manuelle nécessaire
    riskContributions: Array<{      // Contributions au risque
      moduleId: string;
      amount: number;
      reason: string;
    }>;
  };

  // Requirements (checklist terrain)
  requirements: Array<{
    type: string;                   // Ex: "LIFT_RECOMMENDED"
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    reason: string;
    moduleId: string;
  }>;

  // Impacts juridiques
  legalImpacts: Array<{
    type: string;                   // Ex: "LIABILITY_LIMITATION"
    severity: "INFO" | "WARNING" | "CRITICAL";
    message: string;
    moduleId: string;
  }>;

  // Notes assurance
  insuranceNotes: string[];

  // Cross-selling
  crossSellProposals: Array<{
    id: string;
    label: string;
    reason: string;
    benefit: string;
    priceImpact: number;
    optional: boolean;
  }>;

  // Traçabilité
  traceability: {
    activatedModules: string[];    // Modules activés
    operationalFlags: string[];     // Flags opérationnels
  };

  // Checklist terrain formatée
  checklist: {
    title: string;                  // "Checklist Terrain - Déménagement"
    generatedAt: string;            // ISO 8601
    items: Array<{
      id: string;                   // "req-1", "req-2", etc.
      type: string;                 // "LIFT_RECOMMENDED", etc.
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      description: string;          // Message détaillé
      required: boolean;             // true si HIGH ou CRITICAL
      moduleId: string;             // Module source
    }>;
  };

  // Données contrat formatées
  contract: {
    quoteId?: string;
    generatedAt: string;            // ISO 8601
    legalImpacts: Array<{
      type: string;                 // "LIABILITY_LIMITATION", etc.
      severity: string;
      message: string;
      moduleId: string;
      timestamp: string;            // ISO 8601
    }>;
    insurance: {
      declaredValue: number;         // Valeur déclarée (€)
      premium: number;               // Prime d'assurance (€)
      coverage: number;               // Couverture effective (€)
      notes: string[];               // Notes assurance
    };
    operationalConstraints: string[]; // Contraintes opérationnelles
  };

  // Audit juridique formaté
  audit: {
    quoteId?: string;
    generatedAt: string;            // ISO 8601
    decisions: Array<{
      moduleId: string;             // Module source
      decision: string;              // "ACTIVATED", "LIABILITY_LIMITATION", etc.
      reason: string;                // Raison de la décision
      timestamp: string;             // ISO 8601
      impact: "COST" | "RISK" | "LEGAL" | "OPERATIONAL";
    }>;
    riskScore: number;               // Score de risque (0-100)
    manualReviewRequired: boolean;   // Revérification manuelle nécessaire
    legalFlags: string[];            // Flags juridiques
  };
}
```

#### Exemple de requête

```bash
curl -X POST https://api.example.com/api/quotation/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "movingDate": "2026-03-20T10:00:00Z",
    "housingType": "F3",
    "surface": 65,
    "rooms": 3,
    "volumeMethod": "FORM",
    "estimatedVolume": 30,
    "volumeConfidence": "MEDIUM",
    "departureAddress": "123 Rue de Paris, 75001 Paris",
    "departurePostalCode": "75001",
    "departureCity": "Paris",
    "pickupFloor": 3,
    "pickupHasElevator": false,
    "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
    "arrivalPostalCode": "75008",
    "arrivalCity": "Paris",
    "deliveryFloor": 2,
    "deliveryHasElevator": true,
    "distance": 15,
    "declaredValue": 15000
  }'
```

---

### 2. Multi-offres (6 variantes)

**`POST /api/quotation/multi-offers`**

Génère 6 variantes de devis parallèles avec différentes stratégies marketing.

> 📖 **Documentation détaillée** : Voir [Structure de la réponse multi-offres](./API_MULTI_OFFERS_RESPONSE.md) pour la structure complète de l'objet retourné.

#### Requête

Même structure que `/calculate`, mais avec option pour spécifier les scénarios :

```typescript
{
  // ... mêmes champs que /calculate ...

  // Optionnel : scénarios personnalisés
  scenarios?: Array<{
    id: string;
    enabledModules?: string[];
    disabledModules?: string[];
    marginRate: number;
    overrides?: Record<string, any>;
  }>;
}
```

#### Réponse (200 OK)

```typescript
{
  success: true;
  generatedAt: string;
  variants: Array<{
    scenarioId: string;             // "ECO", "STANDARD", "CONFORT", etc.
    label: string;                  // "Économique", "Standard", etc.
    description: string;
    finalPrice: number;
    basePrice: number;
    marginRate: number;
    tags: string[];
    context: {                      // Contexte complet du devis
      // ... même structure que réponse /calculate ...
    };
    checklist: {                    // Checklist terrain formatée
      title: string;
      generatedAt: string;
      items: Array<{
        id: string;
        type: string;
        severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
        description: string;
        required: boolean;
        moduleId: string;
      }>;
    };
    contract: {                     // Données contrat formatées
      quoteId?: string;
      generatedAt: string;
      legalImpacts: Array<{
        type: string;
        severity: string;
        message: string;
        moduleId: string;
        timestamp: string;
      }>;
      insurance: {
        declaredValue: number;
        premium: number;
        coverage: number;
        notes: string[];
      };
      operationalConstraints: string[];
    };
    audit: {                        // Audit juridique formaté
      quoteId?: string;
      generatedAt: string;
      decisions: Array<{
        moduleId: string;
        decision: string;
        reason: string;
        timestamp: string;
        impact: "COST" | "RISK" | "LEGAL" | "OPERATIONAL";
      }>;
      riskScore: number;
      manualReviewRequired: boolean;
      legalFlags: string[];
    };
  }>;
  comparison: {
    cheapest: {
      scenarioId: string;
      label: string;
      price: number;
    };
    mostExpensive: {
      scenarioId: string;
      label: string;
      price: number;
    };
    recommended: {
      scenarioId: string;
      label: string;
      price: number;
    } | null;
    priceRange: number;
    averagePrice: number;
  };
}
```

#### Exemple de requête

```bash
curl -X POST https://api.example.com/api/quotation/multi-offers \
  -H "Content-Type: application/json" \
  -d '{
    "movingDate": "2026-03-20T10:00:00Z",
    "housingType": "F3",
    "surface": 65,
    "rooms": 3,
    "volumeMethod": "FORM",
    "estimatedVolume": 30,
    "departureAddress": "123 Rue de Paris, 75001 Paris",
    "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
    "distance": 15,
    "declaredValue": 15000
  }'
```

---

### 3. Checklist terrain

**`GET /api/quotation/quote/{quoteId}/checklist`**

Génère une checklist terrain formatée pour l'équipe de déménagement.

#### Réponse (200 OK)

```typescript
{
  success: true;
  quoteId: string;
  title: "Checklist Terrain - Déménagement";
  generatedAt: string;
  items: Array<{
    id: string; // "req-1", "req-2", etc.
    type: string; // "LIFT_RECOMMENDED", etc.
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
    required: boolean; // true si HIGH ou CRITICAL
    moduleId: string;
  }>;
}
```

---

### 4. Données contrat

**`GET /api/quotation/quote/{quoteId}/contract`**

Génère les données contractuelles formatées pour la signature.

#### Réponse (200 OK)

```typescript
{
  success: true;
  quoteId: string;
  generatedAt: string;
  legalImpacts: Array<{
    type: string;
    severity: string;
    message: string;
    moduleId: string;
    timestamp: string;
  }>;
  insurance: {
    declaredValue: number;
    premium: number;
    coverage: number;               // Peut être réduit si assurance plafonnée
    notes: string[];
  };
  operationalConstraints: string[];
}
```

---

### 5. Audit juridique

**`GET /api/quotation/quote/{quoteId}/audit`**

Génère un audit juridique complet avec traçabilité.

#### Réponse (200 OK)

```typescript
{
  success: true;
  quoteId: string;
  generatedAt: string;
  decisions: Array<{
    moduleId: string;
    decision: string;               // "ACTIVATED", "LIABILITY_LIMITATION", etc.
    reason: string;
    timestamp: string;
    impact: "COST" | "RISK" | "LEGAL" | "OPERATIONAL";
  }>;
  riskScore: number;
  manualReviewRequired: boolean;
  legalFlags: string[];
}
```

---

## 📊 Schémas de données

### QuoteContext (Entrée)

Voir [QuoteContext.ts](../../src/quotation-module/core/QuoteContext.ts) pour la définition complète.

### StandardizedQuote (Sortie)

Voir [QuoteOutputService.ts](../../src/quotation-module/services/QuoteOutputService.ts) pour la définition complète.

---

## 💡 Exemples d'utilisation

### Exemple 1 : Déménagement simple IDF → IDF

```typescript
const response = await fetch("/api/quotation/calculate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    movingDate: "2026-03-20T10:00:00Z",
    housingType: "F3",
    surface: 65,
    rooms: 3,
    volumeMethod: "FORM",
    estimatedVolume: 30,
    volumeConfidence: "MEDIUM",
    departureAddress: "123 Rue de Paris, 75001 Paris",
    departurePostalCode: "75001",
    arrivalAddress: "456 Avenue Montaigne, 75008 Paris",
    arrivalPostalCode: "75008",
    distance: 15,
    declaredValue: 15000,
  }),
});

const quote = await response.json();
console.log(`Prix final: ${quote.pricing.finalPrice} €`);
```

### Exemple 2 : Longue distance avec contraintes

```typescript
const response = await fetch("/api/quotation/calculate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    movingDate: "2026-03-20T10:00:00Z",
    housingType: "F3",
    surface: 65,
    rooms: 3,
    volumeMethod: "FORM",
    estimatedVolume: 30,
    departureAddress: "123 Rue de Paris, 75001 Paris",
    departurePostalCode: "75001",
    pickupFloor: 5,
    pickupHasElevator: false,
    arrivalAddress: "22 Avenue Rockefeller, 69008 Lyon",
    arrivalPostalCode: "69008",
    deliveryFloor: 4,
    deliveryHasElevator: false,
    distance: 477, // Longue distance > 50 km
    declaredValue: 20000,
    piano: true,
    bulkyFurniture: true,
  }),
});

const quote = await response.json();
console.log(`Prix final: ${quote.pricing.finalPrice} €`);
console.log(`Longue distance: ${quote.logistics.distanceKm > 50}`);
console.log(
  `Monte-meubles recommandé: ${quote.requirements.some((r) => r.type === "LIFT_RECOMMENDED")}`,
);
```

### Exemple 3 : Multi-offres avec comparaison

```typescript
const response = await fetch("/api/quotation/multi-offers", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    movingDate: "2026-03-20T10:00:00Z",
    housingType: "F3",
    surface: 65,
    rooms: 3,
    volumeMethod: "FORM",
    estimatedVolume: 30,
    departureAddress: "123 Rue de Paris, 75001 Paris",
    arrivalAddress: "456 Avenue Montaigne, 75008 Paris",
    distance: 15,
    declaredValue: 15000,
  }),
});

const result = await response.json();
console.log(`Variantes générées: ${result.variants.length}`);
console.log(
  `Moins cher: ${result.comparison.cheapest.label} - ${result.comparison.cheapest.price} €`,
);
console.log(
  `Plus cher: ${result.comparison.mostExpensive.label} - ${result.comparison.mostExpensive.price} €`,
);
console.log(
  `Recommandé: ${result.comparison.recommended?.label} - ${result.comparison.recommended?.price} €`,
);
```

---

## ⚠️ Gestion d'erreurs

### Codes de statut HTTP

| Code | Signification         | Description                              |
| ---- | --------------------- | ---------------------------------------- |
| 200  | OK                    | Requête réussie                          |
| 400  | Bad Request           | Données invalides (validation échouée)   |
| 422  | Unprocessable Entity  | Données valides mais incohérentes métier |
| 429  | Too Many Requests     | Rate limit dépassé                       |
| 500  | Internal Server Error | Erreur serveur                           |

### Format d'erreur

```typescript
{
  success: false;
  error: string;                    // Code d'erreur
  message: string;                  // Message lisible
  details?: {
    field?: string;                 // Champ en erreur (si validation)
    reason?: string;                // Raison détaillée
    moduleId?: string;              // Module source (si erreur module)
  };
  timestamp: string;                // ISO 8601
}
```

### Exemples d'erreurs

#### 400 - Validation échouée

```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Données invalides",
  "details": {
    "field": "movingDate",
    "reason": "Date invalide ou dans le passé"
  },
  "timestamp": "2026-03-20T10:00:00Z"
}
```

#### 422 - Incohérence métier

```json
{
  "success": false,
  "error": "BUSINESS_RULE_VIOLATION",
  "message": "Règle métier violée",
  "details": {
    "reason": "Déménagement Province → Province non autorisé",
    "moduleId": "address-normalization"
  },
  "timestamp": "2026-03-20T10:00:00Z"
}
```

#### 500 - Erreur serveur

```json
{
  "success": false,
  "error": "INTERNAL_ERROR",
  "message": "Erreur lors du calcul du devis",
  "details": {
    "moduleId": "volume-estimation",
    "reason": "Erreur inattendue dans le module"
  },
  "timestamp": "2026-03-20T10:00:00Z"
}
```

---

## 🚦 Rate Limiting

### Limites par endpoint

| Endpoint                              | Limite       | Fenêtre    |
| ------------------------------------- | ------------ | ---------- |
| `/api/quotation/calculate`            | 100 requêtes | 15 minutes |
| `/api/quotation/multi-offers`         | 50 requêtes  | 15 minutes |
| `/api/quotation/quote/{id}/checklist` | 200 requêtes | 15 minutes |
| `/api/quotation/quote/{id}/contract`  | 200 requêtes | 15 minutes |
| `/api/quotation/quote/{id}/audit`     | 200 requêtes | 15 minutes |

### Headers de réponse

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647878400
```

### Réponse 429

```json
{
  "success": false,
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Trop de requêtes. Réessayez dans 5 minutes.",
  "retryAfter": 300
}
```

---

## 🔐 Authentification

### Headers requis (si authentification activée)

```
Authorization: Bearer {token}
```

### Réponse 401

```json
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Token d'authentification manquant ou invalide"
}
```

---

## 📈 Performance

### Temps de réponse attendus

| Endpoint                              | Temps moyen | Temps max |
| ------------------------------------- | ----------- | --------- |
| `/api/quotation/calculate`            | < 100ms     | < 500ms   |
| `/api/quotation/multi-offers`         | < 200ms     | < 1000ms  |
| `/api/quotation/quote/{id}/checklist` | < 50ms      | < 200ms   |
| `/api/quotation/quote/{id}/contract`  | < 50ms      | < 200ms   |
| `/api/quotation/quote/{id}/audit`     | < 50ms      | < 200ms   |

### Optimisations

- ✅ Calculs déterministes (pas d'appels API externes)
- ✅ Cache possible sur résultats identiques
- ✅ Parallélisation pour multi-offres

---

## 🧪 Tests

### Endpoint de test

**`POST /api/quotation/test`**

Endpoint dédié aux tests avec données de test pré-configurées.

```typescript
{
  scenario: "SIMPLE" | "LONG_DISTANCE" | "CONSTRAINTS" | "REFUSAL_LIFT";
}
```

---

## 📝 Exemples complets

### Exemple 1 : Déménagement simple avec réponse complète

**Requête** :

```bash
POST /api/quotation/calculate
Content-Type: application/json

{
  "movingDate": "2026-03-20T10:00:00Z",
  "housingType": "F3",
  "surface": 65,
  "rooms": 3,
  "volumeMethod": "FORM",
  "estimatedVolume": 30,
  "volumeConfidence": "MEDIUM",
  "departureAddress": "123 Rue de Paris, 75001 Paris",
  "departurePostalCode": "75001",
  "departureCity": "Paris",
  "pickupFloor": 0,
  "pickupHasElevator": true,
  "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
  "arrivalPostalCode": "75008",
  "arrivalCity": "Paris",
  "deliveryFloor": 0,
  "deliveryHasElevator": true,
  "distance": 15,
  "declaredValue": 15000
}
```

**Réponse** :

```json
{
  "success": true,
  "quoteId": "quote-1703078400000-abc123",
  "generatedAt": "2026-03-20T10:00:00.000Z",
  "movingDate": "2026-03-20T10:00:00Z",
  "departureAddress": "123 Rue de Paris, 75001 Paris",
  "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
  "distanceKm": 15,
  "pricing": {
    "totalCosts": 1003.06,
    "basePrice": 1303.98,
    "finalPrice": 1303.98,
    "marginRate": 0.3,
    "breakdown": {
      "costsByCategory": {
        "TRANSPORT": 3.06,
        "VEHICLE": 360.0,
        "LABOR": 540.0,
        "INSURANCE": 67.5,
        "RISK": 0,
        "ADMINISTRATIVE": 0,
        "TEMPORAL": 0
      },
      "costsByModule": [
        {
          "moduleId": "fuel-cost",
          "label": "Coût carburant",
          "amount": 3.06,
          "category": "TRANSPORT"
        },
        {
          "moduleId": "vehicle-selection",
          "label": "Location véhicule CAMIONNETTE_COMPACT (×3)",
          "amount": 360.0,
          "category": "VEHICLE"
        },
        {
          "moduleId": "labor-base",
          "label": "Main-d'œuvre de base",
          "amount": 540.0,
          "category": "LABOR"
        },
        {
          "moduleId": "insurance-premium",
          "label": "Prime d'assurance",
          "amount": 67.5,
          "category": "INSURANCE"
        }
      ],
      "adjustments": []
    }
  },
  "logistics": {
    "baseVolume": 30,
    "adjustedVolume": 31.5,
    "vehicleCount": 3,
    "vehicleTypes": ["CAMIONNETTE_COMPACT"],
    "workersCount": 3,
    "estimatedDurationHours": 6
  },
  "risk": {
    "riskScore": 8,
    "manualReviewRequired": false,
    "riskContributions": [
      {
        "moduleId": "volume-uncertainty-risk",
        "amount": 8,
        "reason": "Confiance moyenne sur le volume estimé"
      }
    ]
  },
  "requirements": [
    {
      "type": "CLEANING_RECOMMENDED",
      "severity": "LOW",
      "reason": "Nettoyage de fin de chantier recommandé : surface importante (65 m²), déménagement complet.",
      "moduleId": "cleaning-end-requirement"
    }
  ],
  "legalImpacts": [],
  "insuranceNotes": [
    "Prime d'assurance calculée : 67.50 € (valeur déclarée : 15000 €)"
  ],
  "crossSellProposals": [
    {
      "id": "CLEANING_END_OPTION",
      "label": "Nettoyage de fin de chantier",
      "reason": "Recommandé pour surface importante (65 m²)",
      "benefit": "Remise en état du logement pour faciliter la remise des clés",
      "priceImpact": 520,
      "optional": true
    }
  ],
  "traceability": {
    "activatedModules": [
      "input-sanitization",
      "date-validation",
      "address-normalization",
      "volume-estimation",
      "volume-uncertainty-risk",
      "distance-calculation",
      "long-distance-threshold",
      "fuel-cost",
      "vehicle-selection",
      "workers-calculation",
      "labor-base",
      "declared-value-validation",
      "insurance-premium",
      "cleaning-end-requirement"
    ],
    "operationalFlags": []
  }
}
```

### Exemple 2 : Longue distance avec monte-meubles recommandé

**Requête** :

```json
{
  "movingDate": "2026-03-20T10:00:00Z",
  "housingType": "F3",
  "surface": 65,
  "rooms": 3,
  "volumeMethod": "FORM",
  "estimatedVolume": 30,
  "departureAddress": "123 Rue de Paris, 75001 Paris",
  "departurePostalCode": "75001",
  "pickupFloor": 5,
  "pickupHasElevator": false,
  "arrivalAddress": "22 Avenue Rockefeller, 69008 Lyon",
  "arrivalPostalCode": "69008",
  "deliveryFloor": 4,
  "deliveryHasElevator": false,
  "distance": 477,
  "declaredValue": 20000,
  "piano": true
}
```

**Réponse** (extrait) :

```json
{
  "success": true,
  "pricing": {
    "totalCosts": 1453.06,
    "basePrice": 1888.98,
    "finalPrice": 1888.98
  },
  "logistics": {
    "distanceKm": 477,
    "isLongDistance": true
  },
  "requirements": [
    {
      "type": "LIFT_RECOMMENDED",
      "severity": "HIGH",
      "reason": "Monte-meubles fortement recommandé : Étage 5 sans ascenseur au départ, Étage 4 sans ascenseur à l'arrivée...",
      "moduleId": "monte-meubles-recommendation"
    }
  ],
  "traceability": {
    "activatedModules": [
      "monte-meubles-recommendation",
      "long-distance-threshold",
      "high-mileage-fuel-adjustment",
      "toll-cost"
    ]
  }
}
```

### Exemple 3 : Refus monte-meubles avec conséquences juridiques

**Requête** :

```json
{
  "movingDate": "2026-03-20T10:00:00Z",
  "housingType": "F3",
  "surface": 65,
  "rooms": 3,
  "volumeMethod": "FORM",
  "estimatedVolume": 30,
  "departureAddress": "123 Rue de Paris, 75001 Paris",
  "pickupFloor": 5,
  "pickupHasElevator": false,
  "arrivalAddress": "456 Avenue Montaigne, 75008 Paris",
  "deliveryFloor": 4,
  "deliveryHasElevator": false,
  "distance": 15,
  "declaredValue": 15000,
  "refuseLiftDespiteRecommendation": true
}
```

**Réponse** (extrait) :

```json
{
  "success": true,
  "legalImpacts": [
    {
      "type": "LIABILITY_LIMITATION",
      "severity": "WARNING",
      "message": "⚠️ Responsabilité limitée : Vous avez refusé le monte-meubles malgré la recommandation...",
      "moduleId": "monte-meubles-refusal-impact"
    },
    {
      "type": "INSURANCE_CAP",
      "severity": "WARNING",
      "message": "⚠️ Assurance plafonnée : Votre couverture assurance est réduite de 50%...",
      "moduleId": "monte-meubles-refusal-impact"
    }
  ],
  "insuranceNotes": [
    "⚠️ COUVERTURE ASSURANCE RÉDUITE DE 50% : Vous avez déclaré 15000 € mais êtes protégé seulement pour 7500 €..."
  ],
  "pricing": {
    "breakdown": {
      "costsByCategory": {
        "RISK": 500.0
      },
      "costsByModule": [
        {
          "moduleId": "manual-handling-risk-cost",
          "label": "Surcoût risque manutention manuelle (500 €). 💡 Le monte-meubles vous aurait coûté 350 €...",
          "amount": 500.0,
          "category": "RISK"
        }
      ]
    }
  }
}
```

---

## 📚 Références

- [Architecture modulaire](../../src/quotation-module/docs/README.md)
- [Types et interfaces](../../src/quotation-module/core/QuoteContext.ts)
- [Services de sortie](../../src/quotation-module/services/QuoteOutputService.ts)
- [Contrôleur HTTP](../../src/quotation-module/interfaces/http/controllers/QuoteController.ts)
- [Exemples d'utilisation](../../src/quotation-module/examples/)

---

## 🔄 Changelog

### Version 1.0 (2025-12-23)

- ✅ Endpoint `/api/quotation/calculate` - Calcul de devis simple
- ✅ Endpoint `/api/quotation/multi-offers` - Génération de 6 variantes
- ✅ Endpoint `/api/quotation/quote/{id}/checklist` - Checklist terrain
- ✅ Endpoint `/api/quotation/quote/{id}/contract` - Données contrat
- ✅ Endpoint `/api/quotation/quote/{id}/audit` - Audit juridique
- ✅ Contrôleur `QuoteController` dans `src/quotation-module/interfaces/http/controllers/`
- ✅ Rate limiting configuré
- ✅ Gestion d'erreurs standardisée
- ✅ Architecture modulaire avec séparation des responsabilités
