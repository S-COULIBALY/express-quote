# 📊 Plan d'implémentation

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## 👥 Qui lit ce plan et quand ?

### 🎯 Lecteurs principaux

#### 1. **Développeurs** (lecture manuelle)
- **Quand** : 
  - **Avant de commencer** : Phase de cadrage (PHASE 0)
  - **Pendant l'implémentation** : Consultation des phases en cours
  - **Lors de revues de code** : Vérification de conformité
  - **En cas de blocage** : Recherche de solutions dans les phases précédentes
- **Comment** : Accès direct au fichier ou via navigation depuis `README.md`
- **Usage** :
  - Comprendre l'ordre d'implémentation
  - Identifier les prérequis manquants
  - Valider la progression du projet
  - Planifier les sprints et itérations

#### 3. **Chefs de projet / Tech Leads** (lecture stratégique)
- **Quand** :
  - **Planification** : Estimation des délais et ressources
  - **Suivi de projet** : Vérification de l'avancement par phase
  - **Décisions d'architecture** : Validation des choix techniques
- **Usage** :
  - Vue d'ensemble de la stratégie MVP
  - Identification des risques et dépendances
  - Allocation des ressources par phase

### 📅 Moments clés de consultation

| Moment | Lecteur | Section consultée |
|--------|---------|-------------------|
| **Début de projet** | Tous | PHASE 0 (Cadrage) + Vue d'ensemble |
| **Avant implémentation** | Devs | PHASE concernée + Prérequis |
| **Pendant implémentation** | Devs | Section détaillée de la phase en cours |
| **Revue de code** | Devs + Tech Leads | Checklist de la phase + Règles |
| **Blocage / Erreur** | Tous | Dépendances + Ordre d'implémentation |
| **Planification sprint** | Tech Leads | Ordre d'implémentation + Semaines |
| **Validation MVP** | Tous | Critères de succès |

### 🔄 Flux de consultation typique

```
1. Développeur reçoit demande : "Créer un module DistanceModule"
   ↓
2. Développeur consulte :
   - Documentation complète (README.md)
   - Plan d'implémentation (10-implementation-plan.md)
   ↓
3. Développeur identifie :
   - PHASE 3 (Distance & Transport) → Priorité 30-39
   - Prérequis : PHASE 1 + PHASE 2
   - MVP Phase 1 → Module essentiel
   ↓
4. Développeur implémente en respectant :
   - Structure du module
   - Ordre des phases
   - Tests obligatoires
   ↓
5. Revieweur valide :
   - Conformité avec le plan
   - Checklist de la phase
   - Critères de succès MVP
```

### ⚠️ Points d'attention

- **Développeurs** : Le plan doit être consulté **régulièrement**, pas seulement au début
- **Tous** : Les prérequis doivent être **vérifiés systématiquement** avant de commencer une phase

---

## 📊 Plan d'implémentation

### 🔄 Vue d'ensemble du flux complet

**Flux global depuis le formulaire jusqu'aux devis** :

```
[ Formulaire ] (collecte uniquement)
      ↓
[ FormAdapter ] (mapping + normalisation)
      ↓
[ QuoteContextBuilder ] (construction contexte)
      ↓
[ OfferFactory ] → 6 contextes dérivés (multi-offres)
      ↓
[ QuoteEngine ] (x6 exécutions)
      ↓
[ Aggregation finale ] (prix, risques, décisions)
      ↓
[ Devis comparatifs ] (Front / PDF / API)
```

**Points clés** :
- ✅ Le formulaire n'est évalué qu'**une seule fois**
- ✅ Le moteur est exécuté **plusieurs fois** sur des contextes différents
- ✅ Chaque brique a un rôle précis et isolé
- ✅ Tout est traçable et explicable

---

### 🧠 Principes fondateurs (NON NÉGOCIABLES)

Avant toute implémentation, ces principes doivent être **strictement respectés** :

1. **Un formulaire = collecte uniquement** : Aucune logique métier dans le formulaire
2. **Toute la logique est côté moteur** : Le moteur décide, l'UI affiche
3. **Un module = une responsabilité** : Chaque module a une responsabilité unique et atomique
4. **Le prix = somme des coûts + marge** : Pas de calcul arbitraire, traçabilité complète
5. **Le moteur agrège, les modules contribuent** : Les modules produisent, le moteur agrège
6. **Pickup ET Delivery toujours symétriques** : Traitement identique pour départ et arrivée
7. **Multi-offres = variantes de contexte, pas hacks** : Même moteur, contextes différents
8. **Tout est traçable, explicable, versionnable** : Chaque décision est enregistrée

---

### PHASE 0 — CADRAGE & DESIGN (OBLIGATOIRE)

⚠️ **Cette phase doit être complétée AVANT toute implémentation technique.**

#### 0.1 Définition des livrables

**Livrables obligatoires** :
- [ ] JSON exhaustif du formulaire (tous les champs avec types et validations)
- [ ] Schéma `QuoteContext` complet (input normalisé)
- [ ] Schéma `ComputedContext` complet (output moteur)
- [ ] Liste exhaustive des modules (par phase, avec priorités)
- [ ] Pipeline d'exécution par phases (ordre strict)
- [ ] Output standardisé (devis, options, risques, traçabilité)

#### 0.2 Découpage des responsabilités

| Couche | Rôle | Responsabilités |
|--------|------|-----------------|
| **Formulaire** | Collecte de données | Validation format uniquement, aucune logique métier |
| **Context Builder** | Normalisation / enrichissement | Préparation du contexte pour le moteur |
| **Module Engine** | Exécution des règles | Orchestration, agrégation, multi-offres |
| **Modules** | Logique métier isolée | Chaque module = une responsabilité atomique |
| **Aggregator** | Prix, risque, décisions finales | Calcul prix final, agrégation risques |
| **Output** | Front / PDF / API | Présentation des résultats |

#### 0.3 Périmètre fonctionnel validé

- [ ] Activité : Déménagement uniquement
- [ ] Zone de départ : Île-de-France (strict)
- [ ] Zone d'arrivée : IDF ou Province
- [ ] Exclusions : Province → Province, International
- [ ] Objectifs : Devis temps réel, Multi-offres (6 devis), Traçabilité complète

---

### 🎯 Stratégie : MVP d'abord, puis enrichissement progressif

⚠️ **IMPORTANT** : Pour éviter une implémentation naïve, commencer par un **MVP réduit** avec les modules essentiels, puis enrichir progressivement.

**Note sur la terminologie** :
- **MVP Phase 1/2/3** = Stratégie métier (quels modules implémenter en priorité)
- **PHASE 0-9** = Phases techniques d'implémentation (infrastructure, moteur, modules, etc.)
- Les MVP Phases guident **quels** modules créer, les PHASES techniques guident **comment** les créer

#### MVP Phase 1 (Modules essentiels - Semaine 1-2)

**Objectif** : Avoir un moteur fonctionnel avec les coûts de base calculés correctement.

**Modules à implémenter en priorité** :
1. ✅ **PHASE 1** : Normalisation (obligatoire)
   - `InputSanitizationModule`
   - `DateValidationModule`
   - `AddressNormalizationModule`

2. ✅ **PHASE 2** : Volume (base du calcul)
   - `VolumeEstimationModule`
   - `VolumeUncertaintyRiskModule`

3. ✅ **PHASE 3** : Distance & Transport (coûts structurels)
   - `DistanceModule`
   - `FuelCostModule`

4. ✅ **PHASE 6** : Main d'œuvre (coût principal)
   - `VehicleSelectionModule`
   - `WorkersCalculationModule`
   - `LaborBaseModule`

5. ✅ **PHASE 7** : Assurance (obligatoire)
   - `InsurancePremiumModule`

**Résultat attendu** : Un devis avec prix de base calculé depuis les coûts réels (transport + main-d'œuvre + assurance).

#### MVP Phase 2 (Enrichissement - Semaine 3-4)

Ajouter les modules critiques pour la viabilité opérationnelle :

- **PHASE 3** : Modules longue distance (si nécessaire)
  - `LongDistanceThresholdModule`
  - `TollCostModule`
  - `HighMileageFuelAdjustmentModule`

- **PHASE 4** : Contraintes d'accès
  - `NoElevatorPickupModule`
  - `NoElevatorDeliveryModule`
  - `LaborAccessPenaltyModule`

- **PHASE 5** : Monte-meubles (critique juridique)
  - `MonteMeublesRecommendationModule`
  - `MonteMeublesRefusalImpactModule`
  - `ManualHandlingRiskCostModule`

**Résultat attendu** : Un devis complet avec gestion des contraintes et conséquences juridiques.

#### MVP Phase 3 (Complétude - Semaine 5-6)

Ajouter les modules restants par ordre de priorité métier :

- Modules temporels (fin de mois, week-end)
- Modules logistiques IDF
- Modules juridiques
- Modules cross-selling

**Résultat attendu** : Système complet et production-ready.

---

### Checklist de mise en place

#### Infrastructure (PHASE 1 — Infrastructure technique)

**Structure des dossiers** :
```
src/quotation-module/
├── core/                     # Types fondamentaux
│   ├── QuoteEngine.ts        # Moteur d'exécution
│   ├── QuoteContext.ts       # Contexte d'entrée
│   ├── ComputedContext.ts    # Contexte calculé
│   ├── QuoteModule.ts        # Interface module
│   ├── ModuleRegistry.ts     # Registre des modules
│   └── ModuleTypes.ts        # Types et enums
│
├── modules/                  # Modules métiers
│   ├── volume/              # Modules volume
│   ├── distance/            # Modules distance
│   ├── vehicle/             # Modules véhicule
│   ├── labor/               # Modules main-d'œuvre
│   ├── cost/                # Modules coût structurels
│   ├── risk/                # Modules risque
│   ├── legal/               # Modules juridiques
│   ├── logistics/           # Modules logistiques IDF
│   ├── insurance/           # Modules assurance
│   ├── temporal/            # Modules temporels
│   └── recommendations/     # Modules recommandations
│
├── multi-offers/            # Système multi-offres
│   ├── QuoteScenario.ts     # Interface scénario
│   ├── MultiQuoteService.ts # Service génération
│   └── DEFAULT_SCENARIOS.ts # Scénarios standards
│
├── services/                # Services d'orchestration
│   ├── ContextBuilderService.ts
│   └── QuoteResultBuilderService.ts
│
├── adapters/                # Adaptateurs (si nécessaire)
│   ├── FormAdapter.ts
│   └── FrontendAdapter.ts
│
└── tests/                   # Tests
    ├── unit/
    ├── integration/
    └── e2e/
```

**Checklist infrastructure (PHASE 1)** :
- [ ] Créer le dossier `src/quotation-module/`
- [ ] Créer la structure de dossiers complète (voir ci-dessus)
- [ ] Configurer TypeScript pour le nouveau dossier
- [ ] Configurer les tests (Jest/Vitest)
- [ ] Configurer le linting (ESLint)
- [ ] Créer les interfaces de base (`QuoteModule`, types fondamentaux)
- [ ] Structure de base `QuoteEngine` (classe, constructeur, structure minimale)

**Note** : 
- L'implémentation complète de `QuoteEngine` est dans **PHASE 3**
- Les modèles de données détaillés (`QuoteContext`, `ComputedContext`) sont dans **PHASE 2**
- Le `FormAdapter` est créé en **PHASE 2** car nécessaire pour construire le contexte

#### Modules de base
- [ ] `VolumeEstimationModule` (calcul du volume uniquement)
- [ ] `VolumeUncertaintyRiskModule` (gestion du risque d'incertitude)
- [ ] `VehicleSelectionModule` (avec contraintes IDF)
- [ ] `WorkersCalculationModule`
- [ ] Tests unitaires pour chaque module

#### Modules de coût structurels (CRITIQUES)
- [ ] `DistanceModule` (calcul distance réelle)
- [ ] `LongDistanceThresholdModule` (détection seuil longue distance - OBLIGATOIRE pour IDF → Province)
- [ ] `FuelCostModule` (coût carburant de base)
- [ ] `HighMileageFuelAdjustmentModule` (ajustement carburant longue distance)
- [ ] `TollCostModule` (coût péages - obligatoire IDF → Province)
- [ ] `DriverRestTimeModule` (temps de repos obligatoire si distance > X km - réglementation)
- [ ] `OvernightStopModule` (arrêt nuit si distance + planning le nécessite)
- [ ] `TransportTimeEstimationModule` (temps de transport estimé)
- [ ] `LaborBaseModule` (coût main-d'œuvre de base)
- [ ] `LaborAccessPenaltyModule` (surcoût accès difficile)
- [ ] `VehicleRentalModule` (location camion)
- [ ] `ManualHandlingRiskCostModule` (surcoût risque manutention)
- [ ] `InsurancePremiumModule` (prime assurance)
- [ ] Tests unitaires pour chaque module

#### Modules de contraintes
- [ ] `NoElevatorPickupModule`
- [ ] `NoElevatorDeliveryModule`
- [ ] `MonteMeublesRecommendationModule`
- [ ] `MonteMeublesRefusalImpactModule`
- [ ] `ParkingAuthorizationModule`
- [ ] Tests d'intégration

#### Modules logistiques IDF
- [ ] `NavetteRequiredModule`
- [ ] `TrafficIdfModule`
- [ ] `TimeSlotSyndicModule`
- [ ] `LoadingTimeEstimationModule`
- [ ] Tests

#### Modules juridiques
- [ ] `CoOwnershipRulesModule`
- [ ] `NeighborhoodDamageRiskModule`
- [ ] `PublicDomainOccupationModule`
- [ ] Tests

#### Modules assurance
- [ ] `DeclaredValueInsufficientModule`
- [ ] `HighValueItemHandlingModule`
- [ ] Tests

#### Modules temporels
- [ ] `EndOfMonthModule`
- [ ] `WeekendModule`
- [ ] Tests

#### Modules opérationnels
- [ ] `CrewSizeAdjustmentModule`
- [ ] `DeliveryTimeWindowConstraintModule`
- [ ] Tests

#### Modules de recommandations métier
- [ ] `PackingRequirementModule` (déclare le besoin, pas la vente)
- [ ] `CleaningEndRequirementModule`
- [ ] `StorageRequirementModule`
- [ ] Tests

#### ❌ Modules supprimés
- [x] ~~`RiskScoreModule`~~ **SUPPRIMÉ** - Le risque est agrégé par le moteur
- [x] ~~`ManualReviewModule`~~ **SUPPRIMÉ** - Déterminé automatiquement par le moteur

#### Formulaire dynamique (PHASE 6)

**Règles clés** :
- [ ] Champs progressifs (affichage conditionnel simple)
- [ ] Aucune logique métier dans le formulaire
- [ ] Conditions d'affichage basées uniquement sur les données collectées
- [ ] Alignement parfait avec les modules (chaque champ = input pour module)

**Rôle du formulaire** :
| ✅ Autorisé | ❌ Interdit |
|-------------|-------------|
| Collecte de données | Calcul de prix |
| Validation de format | Décision métier |
| UX (affichage conditionnel) | Pricing |
| Navigation | Logique métier |

**Exemple de structure formulaire** :
```typescript
// Exemple input brut (frontend)
{
  "moveDate": "2025-01-28",
  "estimatedVolume": 28,
  "volumeConfidence": "LOW",
  "pickup": {
    "address": "Paris 11",
    "floor": 5,
    "hasElevator": false
  },
  "delivery": {
    "address": "Paris 17",
    "floor": 2,
    "hasElevator": true
  },
  "bulkyFurniture": true,
  "refuseLiftDespiteRecommendation": true,
  "declaredValue": 25000
}
```

**FormAdapter (mapping uniquement)** :
```typescript
// adapters/FormAdapter.ts
import { QuoteContext } from "../core/QuoteContext";

export class FormAdapter {
  static toQuoteContext(input: any): QuoteContext {
    return {
      serviceType: "MOVING",
      region: "IDF",
      moveDate: new Date(input.moveDate),
      
      volume: {
        estimated: input.estimatedVolume,
        confidence: input.volumeConfidence || "LOW"
      },
      
      pickup: {
        address: input.pickup.address,
        floor: input.pickup.floor,
        hasElevator: input.pickup.hasElevator
      },
      
      delivery: {
        address: input.delivery.address,
        floor: input.delivery.floor,
        hasElevator: input.delivery.hasElevator
      },
      
      bulkyFurniture: input.bulkyFurniture || false,
      declaredValue: input.declaredValue,
      refuseLiftDespiteRecommendation: input.refuseLiftDespiteRecommendation || false
    };
  }
}
```

✅ **Aucune logique métier** : Simple mapping + normalisation (pas d'inférence complexe)

**Note** : Le `FormAdapter` est créé en **PHASE 2** car il est nécessaire pour construire le `QuoteContext` à partir du formulaire. Il sera utilisé dès PHASE 3 pour tester le moteur.

#### Sorties & Exploitation (PHASE 7)

**Outputs générés** :
- [ ] Devis temps réel (prix, détails, justifications)
- [ ] Détail par module (traçabilité complète)
- [ ] Comparatif multi-offres (6 devis en parallèle)
- [ ] Checklist terrain (requirements métier)
- [ ] Données contrat (éléments juridiques)
- [ ] Audit juridique (traçabilité décisions)

**Frontend** :
- [ ] Présentation comparative des 6 offres
- [ ] Mise en avant "meilleur choix" (scénario STANDARD)
- [ ] Justification des écarts de prix (modules activés/désactivés)
- [ ] Détail ligne par ligne (coûts, ajustements, risques)

#### Tests & Sécurité (PHASE 8)

**Tests** :
- [ ] Tests unitaires (1 module = 1 test minimum)
- [ ] Tests d'intégration (pipeline complet)
- [ ] Tests de scénarios métier IDF (cas réels)
- [ ] Tests multi-offres (6 scénarios validés)
- [ ] Tests de régression (non-régression)

**Sécurité** :
- [ ] Pas de logique métier côté front (vérification)
- [ ] Validation serveur obligatoire
- [ ] Logs de décisions modules (audit trail)
- [ ] Protection contre injection (sanitization)
- [ ] Validation des entrées (PHASE 1 obligatoire)

#### Évolutivité (PHASE 9)

**Extensions futures** :
- [ ] Ajout activité Nettoyage / Transport (nouveaux modules)
- [ ] Ajout IA vision (volume vidéo) - nouveau module
- [ ] Ajout scoring prédictif (nouveau module)
- [ ] Feature flags pour activation progressive
- [ ] Versioning modules (compatibilité ascendante)
- [ ] Migration automatique des anciens modules

**Architecture évolutive** :
- [ ] Interface `QuoteModule` extensible
- [ ] Système de plugins pour nouveaux modules
- [ ] Configuration externe (modules activés/désactivés)
- [ ] Monitoring des performances par module

---

### Ordre d'implémentation recommandé (détaillé)

**Structure** : Les PHASES 0-9 décrivent l'ordre technique d'implémentation. Les MVP Phases 1/2/3 (définies ci-dessus) guident quels modules implémenter dans PHASE 4.

**Résumé des dépendances** :
- **PHASE 0** : Cadrage (obligatoire avant tout)
- **PHASE 1** : Infrastructure (base technique)
- **PHASE 2** : Modèles de données + FormAdapter (nécessaire pour PHASE 3)
- **PHASE 3** : Moteur (nécessite PHASE 1 + PHASE 2)
- **PHASE 4** : Modules MVP (nécessite PHASE 3)
- **PHASE 5** : Multi-offres (nécessite PHASE 3 + PHASE 4)
- **PHASE 6** : Formulaire UI (nécessite PHASE 2 pour FormAdapter)
- **PHASE 7** : Sorties (nécessite PHASE 3 + PHASE 5 + PHASE 6)
- **PHASE 8** : Tests complets (nécessite toutes les phases)
- **PHASE 9** : Évolutivité (nécessite PHASE 8)

#### PHASE 0 — CADRAGE (Semaine 0)
- [ ] Définition des livrables (JSON formulaire, schémas)
- [ ] Découpage des responsabilités validé
- [ ] Périmètre fonctionnel confirmé
- [ ] Architecture technique validée

#### PHASE 1 — INFRASTRUCTURE (Semaine 1)
- [ ] Structure des dossiers créée
- [ ] Configuration TypeScript pour le nouveau dossier
- [ ] Configuration tests (Jest/Vitest) et linting (ESLint)
- [ ] Interfaces de base (`QuoteModule`, types fondamentaux)
- [ ] Structure de base `QuoteEngine` (classe, constructeur, structure)

#### PHASE 2 — MODÈLES DE DONNÉES (Semaine 1-2)
- [ ] `QuoteContext` complet (tous les champs détaillés)
  - [ ] Structure pickup/delivery symétrique
  - [ ] Volume avec méthode et confiance
  - [ ] Flags utilisateur (refus, acceptation, flexibilité)
  - [ ] Métadonnées IDF
- [ ] `ComputedContext` complet (tous les outputs détaillés)
  - [ ] Volume estimé/ajusté
  - [ ] Distance km / temps
  - [ ] Coûts détaillés (par module)
  - [ ] Contributions de risque
  - [ ] Requirements métiers
  - [ ] Options cross-sell
  - [ ] Flags opérationnels
  - [ ] Modules activés (traçabilité)
  - [ ] Ajustements (surcharges, réductions) pour PriceAggregator
- [ ] Validation des schémas (validation TypeScript + runtime si nécessaire)
- [ ] Tests de validation des schémas
- [ ] `FormAdapter` implémenté
  - [ ] Mapping formulaire → QuoteContext (sans logique métier)
  - [ ] Normalisation des données (dates, adresses, etc.)
  - [ ] Validation format uniquement
  - [ ] Tests du mapping
- [ ] `ContextBuilderService` / `QuoteContextBuilder` (si nécessaire)
  - [ ] Enrichissement du contexte (valeurs par défaut, inférences simples)
  - [ ] Préparation du contexte pour le moteur
  - [ ] Tests du builder

**Exemple de structure** :
```typescript
// QuoteContext (entrée immuable)
export interface QuoteContext {
  serviceType: "MOVING";
  region: "IDF";
  moveDate: Date;
  
  volume: {
    estimated?: number;
    confidence: "LOW" | "MEDIUM" | "HIGH";
  };
  
  pickup: AddressContext;
  delivery: AddressContext;
  
  bulkyFurniture: boolean;
  declaredValue: number;
  refuseLiftDespiteRecommendation?: boolean;
  
  computed?: ComputedContext; // injecté par le moteur
}

// ComputedContext (sortie moteur)
export interface ComputedContext {
  volumeM3?: number;
  distanceKm?: number;
  
  costs: CostLine[];
  riskContributions: RiskContribution[];
  requirements: Requirement[];
  options: OptionProposal[];
  
  adjustments?: Adjustment[]; // Surcharges et réductions pour PriceAggregator
  operationalFlags: string[];
  activatedModules: string[];
  metadata?: Record<string, any>;
}

// Adjustment pour PriceAggregator
export interface Adjustment {
  type: "SURCHARGE" | "REDUCTION";
  amount: number;
  reason: string;
  moduleId?: string;
}
```

#### PHASE 3 — MOTEUR DE MODULES (Semaine 2)
**Prérequis** : PHASE 1 (infrastructure) + PHASE 2 (modèles de données)

- [ ] `QuoteEngine` avec pipeline d'exécution complet
  - [ ] Méthode `execute()` avec gestion des phases
  - [ ] Méthodes privées : `hasDependencies()`, `hasPrerequisites()`
  - [ ] Agrégation : `aggregateRiskScore()`, `calculateBasePrice()`, `calculateFinalPrice()`, `determineManualReview()`
- [ ] Gestion des phases (1-9) avec ordre strict
- [ ] Gestion des erreurs (PHASE 1 critique, autres phases résilientes)
- [ ] `ModuleRegistry` / `getAllModules()` fonctionnel
- [ ] Tests unitaires du moteur (sans modules réels)
- [ ] Tests d'intégration avec modules mockés

**Structure simplifiée du moteur** :
```typescript
// core/QuoteEngine.ts
export class QuoteEngine {
  constructor(private modules: QuoteModule[]) {}

  execute(ctx: QuoteContext, phase: ExecutionPhase = "QUOTE"): QuoteContext {
    // 1. Initialisation stricte (JAMAIS par un module)
    ctx.computed = {
      costs: [],
      riskContributions: [],
      requirements: [],
      crossSellProposals: [],
      operationalFlags: [],
      activatedModules: [],
      metadata: {}
    };

    // 2. Tri par priorité
    const sorted = this.modules
      .filter(m => !m.executionPhase || m.executionPhase === phase)
      .sort((a, b) => a.priority - b.priority);

    // 3. Exécution séquentielle
    for (const module of sorted) {
      if (this.shouldExecute(module, ctx)) {
        module.apply(ctx);
        ctx.computed!.activatedModules.push(module.id);
      }
    }

    // 4. Agrégation finale (fait par le moteur)
    this.aggregateRiskScore(ctx);
    this.calculateBasePrice(ctx);
    this.calculateFinalPrice(ctx);
    this.determineManualReview(ctx);

    return ctx;
  }

  private shouldExecute(module: QuoteModule, ctx: QuoteContext): boolean {
    // Vérifier dépendances, prérequis, isApplicable()
    // ...
  }
}
```

👉 **Le moteur ne calcule rien lui-même** : Il orchestre, trace, agrège

#### PHASE 4 — MODULES MÉTIERS MVP (Semaine 2-3)
**Prérequis** : PHASE 3 (moteur fonctionnel)

⚠️ **Note** : Cette phase correspond à **MVP Phase 1** (modules essentiels). Les modules de MVP Phase 2 et 3 seront ajoutés progressivement après validation de MVP Phase 1.

- [ ] Modules essentiels (MVP Phase 1) :
  - [ ] PHASE 1 (pipeline) : `InputSanitizationModule`, `DateValidationModule`, `AddressNormalizationModule`
  - [ ] PHASE 2 (pipeline) : `VolumeEstimationModule`, `VolumeUncertaintyRiskModule`
  - [ ] PHASE 3 (pipeline) : `DistanceModule`, `FuelCostModule`
  - [ ] PHASE 6 (pipeline) : `VehicleSelectionModule`, `WorkersCalculationModule`, `LaborBaseModule`
  - [ ] PHASE 7 (pipeline) : `InsurancePremiumModule`
- [ ] Tests unitaires pour chaque module (fait en parallèle de l'implémentation)
- [ ] Tests d'intégration pipeline complet (tous les modules MVP ensemble)
- [ ] Validation : Prix de base calculé depuis les coûts réels

**Exemple de module concret** :
```typescript
// modules/costs/transport/FuelCostModule.ts
export class FuelCostModule implements QuoteModule {
  id = "FUEL_COST";
  description = "Coût carburant aller-retour";
  priority = 33; // PHASE 3

  isApplicable(ctx: QuoteContext): boolean {
    return !!ctx.computed?.distanceKm; // Dépend de DistanceModule
  }

  apply(ctx: QuoteContext): void {
    const km = ctx.computed!.distanceKm!;
    const costPerKm = 0.35; // Camion IDF
    const cost = km * 2 * costPerKm; // aller-retour

    ctx.computed!.costs.push({
      moduleId: this.id,
      label: "Carburant (aller-retour)",
      amount: cost,
      category: "TRANSPORT",
      metadata: {
        distanceKm: km,
        costPerKm,
        roundTrip: true
      }
    });

    ctx.computed!.activatedModules.push(this.id);
  }
}
```

**Ensuite (après validation MVP Phase 1)** :
- [ ] MVP Phase 2 : Modules critiques (contraintes, monte-meubles, longue distance)
- [ ] MVP Phase 3 : Modules restants (temporels, logistiques IDF, juridiques, cross-selling)

#### PHASE 5 — MULTI-OFFRES (Semaine 3-4)
**Prérequis** : PHASE 3 (moteur) + PHASE 4 (modules MVP minimum)

⚠️ **Note** : Le formulaire (PHASE 6) peut être développé en parallèle, mais les multi-offres peuvent être testées avec des contextes mockés.

- [ ] `QuoteScenario` interface définie
- [ ] `MultiQuoteService` / `OfferFactory` implémenté
  - [ ] Méthode `generateMultipleQuotes()` / `build()`
  - [ ] Clonage profond du contexte (structuredClone ou équivalent)
  - [ ] Gestion des scénarios (enabledModules, disabledModules, overrides)
- [ ] 6 scénarios standards (DEFAULT_SCENARIOS) définis
- [ ] Tests multi-offres (génération des 6 devis)
- [ ] Validation : 6 devis générés avec prix différents selon scénarios

**Structure OfferFactory** :
```typescript
// multi-offers/OfferFactory.ts
export interface OfferProfile {
  code: string;
  label: string;
  forcedModules?: string[];
  excludedModules?: string[];
  marginRate: number;
}

export class OfferFactory {
  static build(ctx: QuoteContext, profiles: OfferProfile[]): QuoteContext[] {
    return profiles.map(profile => {
      // Clone profond pour éviter mutations
      const clone = structuredClone(ctx);
      clone.computed = undefined; // Sera réinitialisé par le moteur
      
      // Marquer le profil
      clone.computed!.operationalFlags.push(`OFFER_${profile.code}`);
      (clone as any).pricingProfile = profile;
      
      return clone;
    });
  }
}

// Exemple profils marketing
const DEFAULT_SCENARIOS: OfferProfile[] = [
  { code: "ECO", label: "Économique", marginRate: 0.20 },
  { code: "STANDARD", label: "Standard", marginRate: 0.30 },
  { code: "CONFORT", label: "Confort", marginRate: 0.35 },
  { code: "SECURITE", label: "Sécurité", marginRate: 0.32 },
  { code: "PREMIUM", label: "Premium", marginRate: 0.40 },
  { code: "FLEX", label: "Flexible", marginRate: 0.38 }
];
```

#### PHASE 6 — FORMULAIRE DYNAMIQUE (Semaine 4-5)
**Prérequis** : PHASE 2 (QuoteContext complet + FormAdapter)

⚠️ **Note** : Le `FormAdapter` est déjà créé en PHASE 2. Cette phase concerne uniquement l'interface utilisateur du formulaire.

- [ ] JSON exhaustif du formulaire (tous les champs avec types et validations)
- [ ] Formulaire aligné avec `QuoteContext` (1 champ formulaire = 1 champ QuoteContext)
- [ ] Intégration avec `FormAdapter` (appel du mapping)
- [ ] Affichage conditionnel (sans logique métier, basé uniquement sur données collectées)
- [ ] Validation format uniquement (email, téléphone, dates, etc.)
- [ ] Tests formulaire (validation format, pas de logique métier)
- [ ] Tests d'intégration formulaire → FormAdapter → QuoteContext
- [ ] Validation : Aucune logique métier dans le formulaire

#### PHASE 7 — SORTIES & EXPLOITATION (Semaine 5-6)
**Prérequis** : PHASE 3 (moteur) + PHASE 5 (multi-offres) + PHASE 6 (formulaire) + PHASE 2 (FormAdapter)

- [ ] `PriceAggregator` implémenté
  - [ ] Calcul prix de base (somme des coûts + marge)
  - [ ] Calcul prix final (base + ajustements)
  - [ ] Application de la marge selon scénario
- [ ] Outputs standardisés
  - [ ] Devis temps réel (prix, détails, justifications)
  - [ ] Détail par module (traçabilité complète)
  - [ ] Comparatif multi-offres (6 devis en parallèle)
  - [ ] Checklist terrain (requirements métier)
  - [ ] Données contrat (éléments juridiques)
  - [ ] Audit juridique (traçabilité décisions)
- [ ] Frontend comparatif multi-offres
  - [ ] Présentation comparative des 6 offres
  - [ ] Mise en avant "meilleur choix" (scénario STANDARD)
  - [ ] Justification des écarts de prix
  - [ ] Détail ligne par ligne (coûts, ajustements, risques)
- [ ] Documentation API
- [ ] Tests end-to-end (formulaire → moteur → output)

**PriceAggregator** :
```typescript
// services/PriceAggregator.ts
export class PriceAggregator {
  static compute(ctx: QuoteContext): number {
    // Somme de tous les coûts structurels
    const costs = ctx.computed!.costs.reduce(
      (sum, c) => sum + c.amount,
      0
    );

    // Marge selon le scénario (ou défaut 30%)
    const margin = (ctx as any).pricingProfile?.marginRate || 0.30;
    const basePrice = costs * (1 + margin);

    // Ajustements (surcharges, réductions) - optionnel
    const adjustments = (ctx.computed!.adjustments || []).reduce(
      (sum, adj) => sum + (adj.type === "SURCHARGE" ? adj.amount : -adj.amount),
      0
    );

    return Math.round((basePrice + adjustments) * 100) / 100;
  }
}
```

**Flux end-to-end complet** :
```typescript
// Exemple d'utilisation complète
// 1. Entrée formulaire (depuis frontend)
const rawInput = req.body;

// 2. Adaptation (mapping uniquement via FormAdapter créé en PHASE 2)
const baseContext = FormAdapter.toQuoteContext(rawInput);

// 3. Enrichissement optionnel (via ContextBuilderService si nécessaire)
// const enrichedContext = ContextBuilderService.enrich(baseContext);

// 4. Génération des offres (6 contextes dérivés via OfferFactory créé en PHASE 5)
const contexts = OfferFactory.build(baseContext, DEFAULT_SCENARIOS);

// 5. Exécution moteur (x6 via QuoteEngine créé en PHASE 3)
const engine = new QuoteEngine(getAllModules());

const results = contexts.map(ctx => {
  const computedCtx = engine.execute(ctx);
  const price = PriceAggregator.compute(computedCtx);

  return {
    offer: (ctx as any).pricingProfile.label,
    price,
    details: computedCtx.computed,
    activatedModules: computedCtx.computed!.activatedModules
  };
});

// 6. Retour frontend (6 devis comparatifs)
res.json(results);
```

**Ordre d'exécution des briques** :
1. **FormAdapter** (PHASE 2) : Formulaire → QuoteContext
2. **ContextBuilderService** (PHASE 2, optionnel) : Enrichissement contexte
3. **OfferFactory** (PHASE 5) : QuoteContext → 6 contextes dérivés
4. **QuoteEngine** (PHASE 3) : Exécution modules sur chaque contexte
5. **PriceAggregator** (PHASE 7) : Calcul prix final
6. **Output** (PHASE 7) : Formatage pour frontend/PDF/API

#### PHASE 8 — TESTS & SÉCURITÉ (Semaine 6-7)
**Prérequis** : Toutes les phases précédentes

**Note** : Les tests unitaires sont faits en parallèle de l'implémentation (PHASE 4+). Cette phase concerne les tests d'intégration complets et la sécurité.

- [ ] Tests d'intégration complets
  - [ ] Pipeline complet avec tous les modules
  - [ ] Scénarios métier IDF (cas réels)
  - [ ] Tests multi-offres (6 scénarios validés)
  - [ ] Tests de régression (non-régression)
- [ ] Tests end-to-end complets
  - [ ] Formulaire → Moteur → Output
  - [ ] Multi-offres end-to-end
  - [ ] Cas limites et erreurs
- [ ] Sécurité validée
  - [ ] Vérification : Pas de logique métier côté front
  - [ ] Validation serveur obligatoire
  - [ ] Protection contre injection (sanitization PHASE 1)
  - [ ] Validation des entrées (PHASE 1 obligatoire)
- [ ] Logs et audit trail
  - [ ] Logs de décisions modules (audit trail)
  - [ ] Traçabilité complète (`activatedModules`)
- [ ] Tests de charge (performance)

#### PHASE 9 — ÉVOLUTIVITÉ (Semaine 7-8)
**Prérequis** : PHASE 8 (tests et sécurité validés)

- [ ] Feature flags
  - [ ] Système de feature flags pour activation progressive
  - [ ] Activation/désactivation de modules via configuration
- [ ] Versioning modules
  - [ ] Système de versioning pour compatibilité ascendante
  - [ ] Migration automatique des anciens modules
- [ ] Architecture évolutive
  - [ ] Interface `QuoteModule` extensible
  - [ ] Système de plugins pour nouveaux modules
  - [ ] Configuration externe (modules activés/désactivés)
- [ ] Monitoring
  - [ ] Monitoring des performances par module
  - [ ] Métriques de traçabilité
  - [ ] Alertes sur erreurs critiques
- [ ] Documentation complète
  - [ ] Documentation technique (architecture)
  - [ ] Documentation utilisateur (guide d'utilisation)
  - [ ] Documentation API

#### DÉPLOIEMENT (Semaine 8-10)
**Prérequis** : PHASE 9 (évolutivité)

- [ ] Feature flag pour activation progressive
- [ ] Monitoring et logging en production
- [ ] Documentation utilisateur finale
- [ ] Migration progressive (si nécessaire)
- [ ] Formation équipe
- [ ] Support et maintenance

---

### Critères de succès

#### MVP Phase 1
- ✅ Moteur fonctionnel avec modules essentiels
- ✅ Prix de base calculé depuis les coûts réels
- ✅ Tests unitaires pour chaque module
- ✅ Documentation de base

#### MVP Phase 2
- ✅ Gestion complète des contraintes
- ✅ Conséquences juridiques tracées
- ✅ Tests d'intégration passants
- ✅ Documentation complète

#### MVP Phase 3
- ✅ Tous les modules implémentés
- ✅ Tests end-to-end passants
- ✅ Intégration avec système existant
- ✅ Production-ready

---

### Points d'attention

⚠️ **Ne pas oublier** :
- Les modules de PHASE 1 sont **obligatoires** et doivent arrêter le calcul en cas d'erreur
- Les modules de coût structurels sont **indispensables** pour un vrai devis
- Les modules longue distance sont **obligatoires** pour IDF → Province
- La séparation stricte Requirements / Cross-Selling / Options
- Les interdictions absolues (pas de calcul dans le front, pas de logique métier dans le front, etc.)
- **Pickup ET Delivery toujours symétriques** : Traitement identique pour départ et arrivée
- **Multi-offres = variantes de contexte** : Même moteur, contextes différents, pas de hacks
- **Tout est traçable** : Chaque décision doit être enregistrée dans `activatedModules`

---

### 🎯 Résultat final attendu

À la fin de l'implémentation complète :

✅ **Moteur métier industrialisable** : Architecture modulaire, extensible, maintenable  
✅ **Prix expliqué ligne par ligne** : Traçabilité complète de chaque coût et ajustement  
✅ **6 offres marketing intelligentes** : Multi-offres avec stratégies différenciées  
✅ **Vérité unique** : Même moteur pour devis, terrain, contrat, juridique  
✅ **Implémentation sans ambiguïté** : Documentation complète pour développeurs  
✅ **Production-ready** : Tests complets, sécurité validée, monitoring en place

---

## 🔗 Voir aussi

- [Vue d'ensemble](./01-overview.md) - Principes et structure du projet
- [Système d'exécution](./05-execution-engine.md) - Code canonique QuoteEngine
- [Multi-offres](./06-multi-offers.md) - Génération de 6 devis parallèles
- [Migration](./11-migration.md) - Stratégie de migration progressive

