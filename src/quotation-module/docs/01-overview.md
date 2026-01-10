# 🎯 Vue d'ensemble & Principes

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## 🎯 Vue d'ensemble

### Objectif

Créer un **moteur de devis modulaire, professionnel et exhaustif** pour remplacer progressivement le système actuel basé sur des règles métier simples.

### Philosophie

> **Le formulaire collecte des signaux, les modules métiers interprètent, décident et produisent des effets.**

### Avantages

✅ **Modularité** : Chaque module est autonome, testable, traçable  
✅ **Traçabilité** : Chaque décision est enregistrée dans le contexte  
✅ **Extensibilité** : Ajout de nouveaux modules sans modifier l'existant  
✅ **Réutilisabilité** : Même moteur pour devis, terrain, contrat, scoring  
✅ **Maintenabilité** : Code clair, séparation des responsabilités  

### Périmètre géographique

⚠️ **IMPORTANT** : Le service couvre exclusivement des déménagements dont le point de départ est situé en **Île-de-France**.

**Point de départ** : strictement **ÎLE-DE-FRANCE**

**Point d'arrivée** :
- ✅ Île-de-France
- ✅ Province (France métropolitaine)

**Cas exclus** :
- ❌ Province → Province
- ❌ International
- ❌ Île-de-France → Étranger

**Conséquence architecturale** : Les déménagements IDF → Province doivent être couverts avec des modules dédiés pour gérer les impacts logistiques, humains et financiers des longues distances (voir [PHASE 3 — Distance & Transport](./04-pipeline-phases.md#phase-3--distance--transport)).

---

## 🧠 Principes d'architecture

### Ce qu'un module N'EST PAS

❌ **Pas un simple `if`** : Un module contient une logique métier complexe  
❌ **Pas une option UI** : Un module produit des effets mesurables  
❌ **Pas un champ du formulaire** : Un module interprète les données du formulaire  
❌ **Pas un module "finalisateur"** : Un module ne recalcule pas ce que d'autres ont déjà produit  
❌ **Pas un moteur marketing** : Un module métier ne décide pas de la vente, il déclare des besoins  

### Ce qu'un module EST

✅ **Stateless** : Ne conserve pas d'état entre les appels  
✅ **Idempotent** : Même entrée = même sortie  
✅ **Activé par le contexte** : S'active selon les données disponibles  
✅ **Responsable d'un impact mesurable** : Prix, risque, juridique, opérationnel  
✅ **Traçable** : Laisse une trace explicite dans le contexte  
✅ **Responsabilité unique** : Chaque module est responsable de ses propres effets, pas de ceux des autres  

### Principes de conception

1. **Souveraineté du moteur** : Le moteur décide, l'UI affiche
2. **Séparation des préoccupations** : Formulaire ≠ Logique métier ≠ Vente
3. **Composition** : Modules composables, pas de dépendances rigides
4. **Versionnable** : Architecture évolutive sans breaking changes
5. **Séparation stricte** : Règle métier ≠ Recommandation ≠ Cross-selling
6. **Pas d'initialisation par les modules** : Le moteur initialise `ctx.computed`, jamais un module
7. **Risque produit, pas recalculé** : Chaque module contribue au risque, aucun module ne le recalcule

---

## 📁 Structure du projet

### Organisation proposée

```
src/
├── quotation/                    # Système existant (conservé)
│   ├── application/
│   ├── domain/
│   └── infrastructure/
│
└── quotation-module/             # 🆕 NOUVEAU SYSTÈME MODULAIRE
    ├── core/                     # Types fondamentaux
    │   ├── QuoteContext.ts
    │   ├── QuoteModule.ts
    │   ├── ComputedContext.ts
    │   └── QuoteEngine.ts
    │
    ├── modules/                  # Modules métiers
    │   ├── base/                 # Modules de base
    │   │   ├── VolumeEstimationModule.ts
    │   │   ├── VolumeUncertaintyRiskModule.ts
    │   │   ├── VehicleSelectionModule.ts
    │   │   └── WorkersCalculationModule.ts
    │   │
    │   ├── costs/                # Modules de coût structurels
    │   │   ├── transport/        # Transport & déplacement
    │   │   │   ├── DistanceModule.ts
    │   │   │   ├── FuelCostModule.ts
    │   │   │   └── TollCostModule.ts
    │   │   ├── labor/            # Main-d'œuvre
    │   │   │   ├── LaborBaseModule.ts
    │   │   │   └── LaborAccessPenaltyModule.ts
    │   │   ├── vehicle/          # Véhicule
    │   │   │   └── VehicleRentalModule.ts
    │   │   ├── risk/             # Coûts de risque
    │   │   │   └── ManualHandlingRiskCostModule.ts
    │   │   └── insurance/        # Assurance
    │   │       └── InsurancePremiumModule.ts
    │   │
    │   ├── constraints/          # Modules de contraintes
    │   │   ├── NoElevatorPickupModule.ts
    │   │   ├── NoElevatorDeliveryModule.ts
    │   │   ├── MonteMeublesRecommendationModule.ts
    │   │   ├── MonteMeublesRefusalImpactModule.ts
    │   │   └── ParkingAuthorizationModule.ts
    │   │
    │   ├── logistics/            # Modules logistiques IDF
    │   │   ├── NavetteRequiredModule.ts
    │   │   ├── TrafficIdfModule.ts
    │   │   ├── TimeSlotSyndicModule.ts
    │   │   └── LoadingTimeEstimationModule.ts
    │   │
    │   ├── temporal/             # Modules temporels
    │   │   ├── EndOfMonthModule.ts
    │   │   ├── WeekendModule.ts
    │   │   └── HolidayModule.ts
    │   │
    │   ├── legal/                # Modules juridiques
    │   │   ├── CoOwnershipRulesModule.ts
    │   │   ├── NeighborhoodDamageRiskModule.ts
    │   │   └── PublicDomainOccupationModule.ts
    │   │
    │   ├── insurance/            # Modules assurance
    │   │   ├── DeclaredValueInsufficientModule.ts
    │   │   └── HighValueItemHandlingModule.ts
    │   │
    │   ├── operational/          # Modules opérationnels
    │   │   ├── CrewSizeAdjustmentModule.ts
    │   │   └── DeliveryTimeWindowConstraintModule.ts
    │   │
    │   └── requirements/         # Modules de recommandations métier
    │       ├── PackingRequirementModule.ts
    │       ├── CleaningEndRequirementModule.ts
    │       └── StorageRequirementModule.ts
    │
    ├── services/                 # Services d'orchestration
    │   ├── ModuleExecutionService.ts
    │   ├── ContextBuilderService.ts
    │   └── QuoteResultBuilderService.ts
    │
    ├── adapters/                 # Adaptateurs pour intégration
    │   ├── LegacyContextAdapter.ts
    │   └── QuoteResultAdapter.ts
    │
    └── index.ts                  # Point d'entrée principal
```

### Justification de la structure

- **`core/`** : Types fondamentaux réutilisables partout
- **`modules/`** : Organisation par catégorie métier
  - **`base/`** : Modules de base (volume, distance, véhicule)
  - **`costs/`** : Modules de coût structurels (transport, main-d'œuvre, véhicule, assurance)
  - **`constraints/`** : Modules de contraintes (ascenseur, monte-meubles, parking)
  - **`logistics/`** : Modules logistiques IDF (navette, trafic, créneaux)
  - **`legal/`** : Modules juridiques
  - **`insurance/`** : Modules assurance
  - **`operational/`** : Modules opérationnels
  - **`requirements/`** : Modules de recommandations métier
- **`services/`** : Orchestration et logique transversale
- **`adapters/`** : Pont avec le système existant

### Note sur la structure

⚠️ **Important** : Cette structure utilise `quotation-module/` pour rester parallèle au système existant (`quotation/`).  
Si vous préférez une structure différente (par exemple `quotation/domain/modules/`), elle peut être adaptée, mais le principe de séparation reste le même.

### Structure alternative (si intégration dans quotation/)

Si vous souhaitez intégrer dans `quotation/` au lieu de `quotation-module/` :

```
src/quotation/
├── domain/
│   ├── context/
│   │   ├── QuoteContext.ts
│   │   └── ComputedContext.ts
│   ├── modules/
│   │   ├── core/
│   │   │   └── QuoteModule.ts
│   │   ├── base/
│   │   ├── costs/
│   │   ├── constraints/
│   │   └── ...
│   └── ...
└── application/
    └── ModuleEngine.ts
```

**Recommandation** : Garder `quotation-module/` pour la migration progressive, puis fusionner si souhaité.

---

## 📚 Navigation

- [Retour au README](./README.md)
- [Types fondamentaux](./02-types-and-interfaces.md)
- [Typologie des modules](./03-module-typology.md)
- [Phases du pipeline](./04-pipeline-phases.md)
