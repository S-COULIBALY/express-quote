# 🎼 Flux Complet d'Orchestration - Moteur de Devis

**Comment le moteur orchestre tous les modules pour calculer un devis**

---

## 📋 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUX COMPLET                                  │
└─────────────────────────────────────────────────────────────────┘

1. SERVICES (en amont) → QuoteContext
   ↓
2. QUOTEENGINE.initialize() → ComputedContext vide
   ↓
3. QUOTEENGINE.getApplicableModules() → Filtre + Trie par priorité
   ↓
4. QUOTEENGINE.execute() → Boucle séquentielle
   │
   ├─→ PHASE 1 (10-19) : Normalisation
   ├─→ PHASE 2 (20-29) : Volume & Charge
   ├─→ PHASE 3 (30-39) : Distance & Transport
   ├─→ PHASE 6 (60-69) : Main d'œuvre
   └─→ PHASE 7 (70-79) : Assurance & Risque
   ↓
5. QUOTEENGINE.aggregateFinalResults() → Prix final
   ↓
6. Résultat : QuoteContext enrichi avec ComputedContext complet
```

---

## 🎯 Exemple Concret Complet

### Scénario : Client avec vidéo analysée

**Données client** :
- F3, 65 m², Paris → Lyon
- Vidéo analysée : 42 m³ détectés
- Piano présent
- Valeur déclarée : 20 000 €

---

## 📊 ÉTAPE PAR ÉTAPE - Flux Détaillé

### ÉTAPE 0 : Services (en amont)

```typescript
// 1. Client envoie vidéo
const videoUrl = 'https://storage.example.com/video123.mp4';

// 2. VideoAnalysisService analyse (asynchrone)
import { VideoAnalysisService } from '@/quotation-module/services';
const videoService = new VideoAnalysisService({ provider: 'OPENAI' });
const analysis = await videoService.analyzeVideo(videoUrl);

// Résultat :
{
  estimatedVolume: 42.5,        // ← Volume détecté par IA
  confidence: 'HIGH',           // ← Confiance élevée (vidéo)
  detectedSpecialItems: {
    piano: true,                // ← Piano détecté
    bulkyFurniture: false
  }
}
```

**→ Ce résultat sera injecté dans `QuoteContext.estimatedVolume`**

---

### ÉTAPE 1 : Création du QuoteContext

```typescript
import { QuoteContext } from '@/quotation-module/core';

const quoteContext: QuoteContext = {
  // Identification
  serviceType: 'MOVING',
  region: 'IDF',
  
  // Date
  movingDate: '2025-03-15T10:00:00Z',
  
  // Logement
  housingType: 'F3',
  surface: 65,
  rooms: 3,
  
  // Volume (résultat du service vidéo)
  volumeMethod: 'VIDEO',           // ← Méthode vidéo
  estimatedVolume: 42.5,           // ← Volume détecté par IA
  volumeConfidence: 'HIGH',        // ← Confiance élevée
  
  // Objets spéciaux (détectés par IA)
  piano: true,
  
  // Adresses
  departureAddress: '123 Rue de Paris, 75001 Paris',
  departurePostalCode: '75001',
  pickupFloor: 3,
  pickupHasElevator: false,
  
  arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
  arrivalPostalCode: '69001',
  deliveryFloor: 2,
  deliveryHasElevator: true,
  
  // Assurance
  declaredValue: 20000,
  
  // computed: undefined (sera créé par le moteur)
};
```

---

### ÉTAPE 2 : Initialisation du Moteur

```typescript
import { QuoteEngine } from '@/quotation-module/core/QuoteEngine';
import { getAllModules } from '@/quotation-module/core/ModuleRegistry';

// Créer le moteur avec tous les modules
const engine = new QuoteEngine(getAllModules(), {
  executionPhase: 'QUOTE',
  debug: true
});

// Modules chargés (11 modules) :
[
  InputSanitizationModule (priority: 10),
  DateValidationModule (priority: 11),
  AddressNormalizationModule (priority: 12),
  VolumeEstimationModule (priority: 20),
  VolumeUncertaintyRiskModule (priority: 24),
  DistanceModule (priority: 30),
  FuelCostModule (priority: 33),
  VehicleSelectionModule (priority: 60),
  WorkersCalculationModule (priority: 61),
  LaborBaseModule (priority: 62),
  DeclaredValueValidationModule (priority: 70),
  InsurancePremiumModule (priority: 71),
]
```

---

### ÉTAPE 3 : Exécution du Moteur

```typescript
const result = engine.execute(quoteContext);
```

**Ce qui se passe à l'intérieur** :

#### 3.1 Initialisation de `computed`

```typescript
// Le moteur crée un ComputedContext vide
enrichedCtx.computed = {
  costs: [],
  adjustments: [],
  riskContributions: [],
  legalImpacts: [],
  insuranceNotes: [],
  requirements: [],
  crossSellProposals: [],
  operationalFlags: [],
  activatedModules: [],
  metadata: {},
  // Tous les autres champs undefined
};
```

#### 3.2 Filtrage des modules applicables

```typescript
// getApplicableModules() filtre et trie :

1. Phase temporelle : QUOTE ✅ (tous les modules)
2. Disabled modules : [] ✅ (aucun)
3. Enabled modules : [] ✅ (tous activés)
4. isApplicable() : 
   - VolumeUncertaintyRiskModule : vérifie baseVolume > 0 (pas encore)
   - InsurancePremiumModule : vérifie declaredValue > 0 ✅

// Modules triés par priorité :
[
  InputSanitizationModule (10),
  DateValidationModule (11),
  AddressNormalizationModule (12),
  VolumeEstimationModule (20),        ← S'EXÉCUTE EN PREMIER
  VolumeUncertaintyRiskModule (24),  ← Attend baseVolume
  DistanceModule (30),
  FuelCostModule (33),
  VehicleSelectionModule (60),        ← Attend adjustedVolume
  WorkersCalculationModule (61),      ← Attend adjustedVolume
  LaborBaseModule (62),               ← Attend adjustedVolume
  DeclaredValueValidationModule (70),
  InsurancePremiumModule (71),        ← Attend adjustedVolume + distanceKm
]
```

---

### ÉTAPE 4 : Exécution Séquentielle des Modules

#### MODULE 1 : InputSanitizationModule (priority: 10)

```typescript
// ✅ Exécuté (pas de dépendances)
enrichedCtx = InputSanitizationModule.apply(enrichedCtx);

// Résultat :
enrichedCtx.computed.activatedModules = ['input-sanitization'];
// (Nettoyage des données, pas de modification visible)
```

#### MODULE 2 : DateValidationModule (priority: 11)

```typescript
// ✅ Exécuté (pas de dépendances)
enrichedCtx = DateValidationModule.apply(enrichedCtx);

// Résultat :
enrichedCtx.computed.activatedModules = ['input-sanitization', 'date-validation'];
```

#### MODULE 3 : AddressNormalizationModule (priority: 12)

```typescript
// ✅ Exécuté (pas de dépendances)
enrichedCtx = AddressNormalizationModule.apply(enrichedCtx);

// Résultat :
enrichedCtx.computed.activatedModules = [
  'input-sanitization',
  'date-validation',
  'address-normalization'
];
```

#### MODULE 4 : VolumeEstimationModule (priority: 20) ⭐ CRITIQUE

```typescript
// ✅ Exécuté (pas de dépendances, Type A)
enrichedCtx = VolumeEstimationModule.apply(enrichedCtx);

// Ce qui se passe à l'intérieur :
// 1. Volume fourni : 42.5 m³ (VIDEO)
// 2. Volume théorique : 65 × 0.45 = 29.25 m³
// 3. Comparaison : 42.5 vs 29.25 = +45% (sur-estimation)
// 4. Décision : Utiliser volume fourni (42.5 m³)
// 5. Objets spéciaux : Piano déjà inclus dans 42.5
// 6. Ajustement confiance : HIGH + VIDEO = 0% (volume précis)

// Résultat :
enrichedCtx.computed = {
  baseVolume: 42.5,              // ← Volume de base
  adjustedVolume: 42.5,          // ← Volume ajusté (pas de marge, vidéo précise)
  activatedModules: [
    'input-sanitization',
    'date-validation',
    'address-normalization',
    'volume-estimation'           // ← Ajouté
  ],
  metadata: {
    volumeMethod: 'VIDEO',
    volumeConfidence: 'HIGH',
    volumeConfidenceScore: 0.95,
    userProvidedVolume: 42.5,
    theoreticalVolume: 29.25,
    volumeDiffPercentage: 45.3,
    volumeBaseSource: 'USER_PROVIDED',
    volumeCalculationMethod: 'VIDEO_ANALYSIS',
    // ...
  }
};
```

#### MODULE 5 : VolumeUncertaintyRiskModule (priority: 24)

```typescript
// ✅ Vérification dépendance : 'volume-estimation' dans activatedModules ✅
// ✅ Vérification isApplicable : baseVolume > 0 ✅ (42.5 > 0)
enrichedCtx = VolumeUncertaintyRiskModule.apply(enrichedCtx);

// Ce qui se passe :
// baseVolume: 42.5, adjustedVolume: 42.5
// Différence : 0% (volume précis)
// Confiance : HIGH → risque faible (3 points)

// Résultat :
enrichedCtx.computed.riskContributions = [
  {
    moduleId: 'volume-uncertainty-risk',
    amount: 3,                    // ← Risque faible (HIGH confidence)
    reason: 'Incertitude sur le volume (confiance: HIGH, écart: 0.0%)',
    metadata: {
      volumeConfidence: 'HIGH',
      volumeDiffPercentage: 0,
      baseVolume: 42.5,
      adjustedVolume: 42.5
    }
  }
];
enrichedCtx.computed.activatedModules.push('volume-uncertainty-risk');
```

#### MODULE 6 : DistanceModule (priority: 30)

```typescript
// ✅ Exécuté (pas de dépendances)
// Note : En production, distance vient du formulaire (Google Maps)
enrichedCtx = DistanceModule.apply(enrichedCtx);

// Résultat :
enrichedCtx.computed.distanceKm = 465;  // ← Paris → Lyon
enrichedCtx.computed.isLongDistance = true;  // ← > 200 km
enrichedCtx.computed.activatedModules.push('distance-calculation');
```

#### MODULE 7 : FuelCostModule (priority: 33)

```typescript
// ✅ Vérification prérequis : distanceKm existe ✅ (465 km)
enrichedCtx = FuelCostModule.apply(enrichedCtx);

// Calcul : 465 km × 0.15 €/km = 69.75 €

// Résultat :
enrichedCtx.computed.costs = [
  {
    moduleId: 'fuel-cost',
    label: 'Coût carburant',
    amount: 69.75,
    category: 'TRANSPORT',
    metadata: { distanceKm: 465, costPerKm: 0.15 }
  }
];
enrichedCtx.computed.activatedModules.push('fuel-cost');
```

#### MODULE 8 : VehicleSelectionModule (priority: 60)

```typescript
// ✅ Vérification dépendance : 'volume-estimation' ✅
// ✅ Vérification prérequis : adjustedVolume existe ✅ (42.5 m³)
enrichedCtx = VehicleSelectionModule.apply(enrichedCtx);

// Calcul :
// Volume : 42.5 m³
// Type véhicule : CAMION_20M3 (42.5 > 30, < 50)
// Nombre : Math.ceil(42.5 / 20) = 3 véhicules
// Coût : 250 € × 3 = 750 €

// Résultat :
enrichedCtx.computed.vehicleCount = 3;
enrichedCtx.computed.vehicleTypes = ['CAMION_20M3'];
enrichedCtx.computed.costs.push({
  moduleId: 'vehicle-selection',
  label: 'Location véhicule CAMION_20M3 (×3)',
  amount: 750,
  category: 'VEHICLE',
  metadata: {
    vehicleType: 'CAMION_20M3',
    vehicleCount: 3,
    costPerVehicle: 250
  }
});
enrichedCtx.computed.activatedModules.push('vehicle-selection');
```

#### MODULE 9 : WorkersCalculationModule (priority: 61)

```typescript
// ✅ Vérification dépendance : 'volume-estimation' ✅
// ✅ Vérification prérequis : adjustedVolume existe ✅
enrichedCtx = WorkersCalculationModule.apply(enrichedCtx);

// Calcul :
// Volume : 42.5 m³ → Base : 3 déménageurs (> 30 m³)
// Escaliers départ : +1 (étage 3, pas d'ascenseur)
// Piano : +1
// Distance longue : +1 (> 200 km)
// Total : 3 + 1 + 1 + 1 = 6 déménageurs (plafonné à 6)

// Résultat :
enrichedCtx.computed.workersCount = 6;
enrichedCtx.computed.activatedModules.push('workers-calculation');
```

#### MODULE 10 : LaborBaseModule (priority: 62)

```typescript
// ✅ Vérification dépendance : 'volume-estimation' ✅
// ✅ Vérification prérequis : adjustedVolume existe ✅
enrichedCtx = LaborBaseModule.apply(enrichedCtx);

// Calcul :
// Volume : 42.5 m³
// Workers : 6
// Heures de base : 3h minimum
// Facteur volume : Math.ceil(42.5 / 10) = 5
// Facteur accès : +30% (escaliers départ)
// Total heures : 3 × 5 × 1.3 = 19.5 heures
// Coût : 45 €/h × 19.5h × 6 déménageurs = 5265 €

// Résultat :
enrichedCtx.computed.baseDurationHours = 19.5;
enrichedCtx.computed.costs.push({
  moduleId: 'labor-base',
  label: 'Main-d\'œuvre de base',
  amount: 5265,
  category: 'LABOR',
  metadata: {
    hourlyRate: 45,
    estimatedHours: 19.5,
    workersCount: 6
  }
});
enrichedCtx.computed.activatedModules.push('labor-base');
```

#### MODULE 11 : DeclaredValueValidationModule (priority: 70)

```typescript
// ✅ Exécuté (Type B, isApplicable vérifie declaredValue)
enrichedCtx = DeclaredValueValidationModule.apply(enrichedCtx);

// Validation : 20000 € < 50000 € → OK
// Résultat :
enrichedCtx.computed.legalImpacts = [];  // Aucun impact
enrichedCtx.computed.activatedModules.push('declared-value-validation');
```

#### MODULE 12 : InsurancePremiumModule (priority: 71)

```typescript
// ✅ Vérification dépendances : ['volume-estimation', 'distance-calculation'] ✅
// ✅ Vérification isApplicable : declaredValue > 0 ✅ (20000)
// ✅ Vérification prérequis : adjustedVolume existe ✅
enrichedCtx = InsurancePremiumModule.apply(enrichedCtx);

// Calcul :
// Valeur déclarée : 20000 €
// Taux de base : 0.3%
// Facteur distance : 1.5 (> 500 km)
// Facteur volume : 1.5 (42.5 m³ > 30)
// Prime : 20000 × 0.003 × 1.5 × 1.5 = 135 €

// Résultat :
enrichedCtx.computed.costs.push({
  moduleId: 'insurance-premium',
  label: 'Prime d\'assurance',
  amount: 135,
  category: 'INSURANCE',
  metadata: {
    declaredValue: 20000,
    baseRate: 0.003,
    distanceRiskFactor: 1.5,
    volumeRiskFactor: 1.5,
    adjustedVolume: 42.5,
    distanceKm: 465
  }
});
enrichedCtx.computed.insuranceNotes.push(
  'Prime d\'assurance calculée : 135.00 € (valeur déclarée : 20000 €)'
);
enrichedCtx.computed.activatedModules.push('insurance-premium');
```

---

### ÉTAPE 5 : Agrégation Finale

```typescript
// aggregateFinalResults() est appelé automatiquement

// 1. Score de risque
enrichedCtx.computed.riskScore = 3;  // Seulement volume uncertainty

// 2. Revue manuelle
enrichedCtx.computed.manualReviewRequired = false;  // Risk < 70

// 3. Prix de base (somme des coûts × marge)
const totalCosts = 69.75 + 750 + 5265 + 135 = 6219.75 €
enrichedCtx.computed.basePrice = 6219.75 × 1.30 = 8085.68 €  // +30% marge

// 4. Prix final (basePrice + ajustements)
enrichedCtx.computed.finalPrice = 8085.68 + 0 = 8085.68 €
```

---

## 📊 Résultat Final Complet

```typescript
const result: QuoteContext = {
  // ... données d'entrée inchangées ...
  
  computed: {
    // VOLUME
    baseVolume: 42.5,
    adjustedVolume: 42.5,
    
    // VÉHICULES
    vehicleCount: 3,
    vehicleTypes: ['CAMION_20M3'],
    
    // MAIN-D'ŒUVRE
    workersCount: 6,
    baseDurationHours: 19.5,
    
    // DISTANCE
    distanceKm: 465,
    isLongDistance: true,
    
    // COÛTS (tableau)
    costs: [
      { moduleId: 'fuel-cost', label: 'Coût carburant', amount: 69.75, category: 'TRANSPORT' },
      { moduleId: 'vehicle-selection', label: 'Location véhicule CAMION_20M3 (×3)', amount: 750, category: 'VEHICLE' },
      { moduleId: 'labor-base', label: 'Main-d\'œuvre de base', amount: 5265, category: 'LABOR' },
      { moduleId: 'insurance-premium', label: 'Prime d\'assurance', amount: 135, category: 'INSURANCE' },
    ],
    
    // RISQUE
    riskContributions: [
      { moduleId: 'volume-uncertainty-risk', amount: 3, reason: '...' }
    ],
    riskScore: 3,
    
    // PRIX
    basePrice: 8085.68,
    finalPrice: 8085.68,
    
    // TRACABILITÉ
    activatedModules: [
      'input-sanitization',
      'date-validation',
      'address-normalization',
      'volume-estimation',           // ← CRITIQUE pour les autres
      'volume-uncertainty-risk',
      'distance-calculation',        // ← CRITIQUE pour fuel + insurance
      'fuel-cost',
      'vehicle-selection',
      'workers-calculation',
      'labor-base',
      'declared-value-validation',
      'insurance-premium'
    ],
    
    // MÉTADONNÉES
    metadata: {
      volumeMethod: 'VIDEO',
      volumeConfidence: 'HIGH',
      volumeConfidenceScore: 0.95,
      userProvidedVolume: 42.5,
      theoreticalVolume: 29.25,
      volumeDiffPercentage: 45.3,
      // ...
    },
    
    // AUTRES
    adjustments: [],
    legalImpacts: [],
    insuranceNotes: ['Prime d\'assurance calculée : 135.00 €...'],
    requirements: [],
    crossSellProposals: [],
    operationalFlags: [],
  }
};
```

---

## 🔍 Points Clés de l'Orchestration

### 1. Ordre d'Exécution Strict

```
PHASE 1 (10-19) → PHASE 2 (20-29) → PHASE 3 (30-39) → PHASE 6 (60-69) → PHASE 7 (70-79)
```

**Pourquoi cet ordre ?**
- Volume doit être calculé AVANT véhicules/main-d'œuvre
- Distance doit être calculée AVANT carburant/assurance
- Chaque phase dépend des phases précédentes

### 2. Vérification des Dépendances

```typescript
// Le moteur vérifie AVANT chaque module :

// Exemple : VehicleSelectionModule (priority: 60)
hasDependencies(module, ctx) {
  // Vérifie : 'volume-estimation' dans activatedModules ✅
  return ctx.computed.activatedModules.includes('volume-estimation');
}

hasPrerequisites(module, ctx) {
  // Vérifie : adjustedVolume existe ✅
  return !!ctx.computed.adjustedVolume;
}
```

### 3. Gestion des Erreurs

```typescript
// PHASE 1 (10-19) : Erreur critique → ARRÊT
if (module.priority >= 10 && module.priority < 20) {
  throw new Error('Erreur critique');
}

// Autres phases : CONTINUER (résilience)
// Le module échoue silencieusement, les autres continuent
```

### 4. Traçabilité

```typescript
// Chaque module s'ajoute à activatedModules
enrichedCtx.computed.activatedModules.push(module.id);

// Permet de savoir exactement quels modules ont été exécutés
// Utile pour debugging et audit
```

---

## 🎯 Exemple avec Service Vidéo Intégré

### Flux Complet avec Service

```typescript
import { VideoAnalysisService } from '@/quotation-module/services';
import { QuoteEngine } from '@/quotation-module/core/QuoteEngine';
import { getAllModules } from '@/quotation-module/core/ModuleRegistry';

// 1. ANALYSE VIDÉO (service externe)
const videoService = new VideoAnalysisService({ provider: 'OPENAI' });
const analysis = await videoService.analyzeVideo(videoUrl);
// → estimatedVolume: 42.5, confidence: 'HIGH', piano: true

// 2. CONSTRUCTION DU CONTEXTE
const quoteContext: QuoteContext = {
  serviceType: 'MOVING',
  region: 'IDF',
  volumeMethod: 'VIDEO',           // ← Depuis service
  estimatedVolume: analysis.estimatedVolume,  // ← 42.5
  volumeConfidence: analysis.confidence,       // ← 'HIGH'
  piano: analysis.detectedSpecialItems.piano,  // ← true
  // ... autres champs
};

// 3. EXÉCUTION DU MOTEUR
const engine = new QuoteEngine(getAllModules());
const result = engine.execute(quoteContext);

// 4. RÉSULTAT
console.log(`Volume: ${result.computed?.adjustedVolume} m³`);  // 42.5
console.log(`Prix: ${result.computed?.finalPrice} €`);        // 8085.68
console.log(`Modules: ${result.computed?.activatedModules.join(', ')}`);
```

---

## 📈 Visualisation du Flux

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENT                                                       │
│  └─> Envoie vidéo                                            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ VideoAnalysisService (Service Externe)                       │
│  ├─> Analyse vidéo avec OpenAI                              │
│  └─> Retourne: { estimatedVolume: 42.5, confidence: HIGH }  │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ QuoteContext (Input)                                         │
│  {                                                            │
│    volumeMethod: 'VIDEO',                                    │
│    estimatedVolume: 42.5,                                    │
│    volumeConfidence: 'HIGH',                                 │
│    piano: true,                                              │
│    ...                                                       │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ QuoteEngine.execute()                                        │
│                                                              │
│  1. Initialise computed = {}                                 │
│  2. Filtre modules (11 modules applicables)                 │
│  3. Trie par priorité (10 → 71)                               │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ PHASE 1 (10-19) : Normalisation                   │     │
│  │  ✓ InputSanitizationModule (10)                    │     │
│  │  ✓ DateValidationModule (11)                         │     │
│  │  ✓ AddressNormalizationModule (12)                 │     │
│  └────────────────────────────────────────────────────┘     │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ PHASE 2 (20-29) : Volume & Charge                 │     │
│  │  ✓ VolumeEstimationModule (20) ⭐                  │     │
│  │    → baseVolume: 42.5, adjustedVolume: 42.5      │     │
│  │  ✓ VolumeUncertaintyRiskModule (24)               │     │
│  │    → riskScore: +3                                 │     │
│  └────────────────────────────────────────────────────┘     │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ PHASE 3 (30-39) : Distance & Transport            │     │
│  │  ✓ DistanceModule (30)                             │     │
│  │    → distanceKm: 465                               │     │
│  │  ✓ FuelCostModule (33)                            │     │
│  │    → cost: 69.75 €                                │     │
│  └────────────────────────────────────────────────────┘     │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ PHASE 6 (60-69) : Main d'œuvre                    │     │
│  │  ✓ VehicleSelectionModule (60)                    │     │
│  │    → vehicleCount: 3, cost: 750 €                 │     │
│  │  ✓ WorkersCalculationModule (61)                  │     │
│  │    → workersCount: 6                               │     │
│  │  ✓ LaborBaseModule (62)                            │     │
│  │    → cost: 5265 €                                  │     │
│  └────────────────────────────────────────────────────┘     │
│                    ↓                                         │
│  ┌────────────────────────────────────────────────────┐     │
│  │ PHASE 7 (70-79) : Assurance & Risque              │     │
│  │  ✓ DeclaredValueValidationModule (70)              │     │
│  │  ✓ InsurancePremiumModule (71)                    │     │
│  │    → cost: 135 €                                  │     │
│  └────────────────────────────────────────────────────┘     │
│                    ↓                                         │
│  4. Agrége résultats finaux                                  │
│     → basePrice: 8085.68 €                                  │
│     → finalPrice: 8085.68 €                                │
│     → riskScore: 3                                          │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ QuoteContext enrichi (Output)                                │
│  {                                                            │
│    computed: {                                               │
│      adjustedVolume: 42.5,                                   │
│      vehicleCount: 3,                                        │
│      workersCount: 6,                                        │
│      costs: [69.75, 750, 5265, 135],                        │
│      basePrice: 8085.68,                                     │
│      finalPrice: 8085.68,                                    │
│      activatedModules: [12 modules],                         │
│      ...                                                     │
│    }                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔑 Points Critiques

### 1. VolumeEstimationModule est CRITIQUE

**Pourquoi ?**
- 6 modules dépendent de lui :
  - `VolumeUncertaintyRiskModule` (dépendance explicite)
  - `VehicleSelectionModule` (prérequis implicite)
  - `WorkersCalculationModule` (prérequis implicite)
  - `LaborBaseModule` (prérequis implicite)
  - `InsurancePremiumModule` (prérequis implicite)

**Si VolumeEstimationModule échoue :**
- Les modules dépendants ne s'exécutent pas
- Le moteur continue mais avec données incomplètes
- `adjustedVolume` reste undefined

### 2. Ordre Strict par Priorité

**Règle absolue** : Les modules s'exécutent dans l'ordre des priorités croissantes.

**Exemple** :
- Priority 20 (VolumeEstimationModule) → S'exécute AVANT
- Priority 60 (VehicleSelectionModule) → S'exécute APRÈS

**Pourquoi ?**
- `VehicleSelectionModule` a besoin de `adjustedVolume` calculé par `VolumeEstimationModule`

### 3. Vérifications Multiples

**Le moteur vérifie 3 fois avant d'exécuter un module** :

1. **Phase temporelle** : Module dans la bonne phase ?
2. **Dépendances explicites** : Modules requis exécutés ?
3. **Prérequis implicites** : Données nécessaires présentes ?

**Exemple pour VehicleSelectionModule** :
```typescript
// Vérification 1 : Phase temporelle
executionPhase === 'QUOTE' ✅

// Vérification 2 : Dépendances explicites
dependencies.includes('volume-estimation')
→ Vérifie : 'volume-estimation' dans activatedModules ✅

// Vérification 3 : Prérequis implicites
hasPrerequisites() {
  // Vérifie : adjustedVolume existe ✅
  return !!ctx.computed.adjustedVolume;
}
```

---

## ✅ Résumé du Flux

1. **Services** → Analysent données (vidéo, liste) → `estimatedVolume`
2. **QuoteContext** → Construit avec données utilisateur + résultats services
3. **QuoteEngine** → Initialise `computed` vide
4. **Filtrage** → Sélectionne modules applicables selon phase/dépendances
5. **Tri** → Ordonne par priorité croissante (10 → 71)
6. **Exécution** → Boucle séquentielle, vérifie dépendances avant chaque module
7. **Agrégation** → Calcule prix final, risque global
8. **Résultat** → QuoteContext enrichi avec ComputedContext complet

**Temps d'exécution** : < 100ms (calculs déterministes, pas d'appels API)

---

## 🎯 Exemple Code Complet

```typescript
import { VideoAnalysisService } from '@/quotation-module/services';
import { QuoteEngine } from '@/quotation-module/core/QuoteEngine';
import { getAllModules } from '@/quotation-module/core/ModuleRegistry';
import type { QuoteContext } from '@/quotation-module/core/QuoteContext';

async function calculateQuoteWithVideo(videoUrl: string) {
  // 1. Analyser vidéo
  const videoService = new VideoAnalysisService({ provider: 'OPENAI' });
  const analysis = await videoService.analyzeVideo(videoUrl);
  
  // 2. Construire contexte
  const ctx: QuoteContext = {
    serviceType: 'MOVING',
    region: 'IDF',
    movingDate: '2025-03-15T10:00:00Z',
    housingType: 'F3',
    surface: 65,
    volumeMethod: 'VIDEO',
    estimatedVolume: analysis.estimatedVolume,
    volumeConfidence: analysis.confidence,
    piano: analysis.detectedSpecialItems.piano,
    departureAddress: '123 Rue de Paris, 75001 Paris',
    arrivalAddress: '456 Avenue de Lyon, 69001 Lyon',
    declaredValue: 20000,
  };
  
  // 3. Exécuter moteur
  const engine = new QuoteEngine(getAllModules(), { debug: true });
  const result = engine.execute(ctx);
  
  // 4. Résultat
  return {
    volume: result.computed?.adjustedVolume,
    price: result.computed?.finalPrice,
    vehicles: result.computed?.vehicleCount,
    workers: result.computed?.workersCount,
    modules: result.computed?.activatedModules,
  };
}
```

---

**Le moteur orchestre tout automatiquement, dans le bon ordre, avec vérifications de dépendances !** 🎼

