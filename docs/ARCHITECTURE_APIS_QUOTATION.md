# Architecture des APIs de Calcul de Devis

## Vue d'ensemble

Le système de calcul de devis est divisé en **deux APIs distinctes** avec des responsabilités clairement séparées et utilise un **mode incrémental** pour éviter les recalculs inutiles :

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      FLUX DE CALCUL (MODE INCRÉMENTAL)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Formulaire Client                                                              │
│         │                                                                        │
│         ▼                                                                        │
│   ┌─────────────────────────────────────┐                                        │
│   │  ÉTAPE 1: /api/quotation/calculate  │                                        │
│   │  ─────────────────────────────────  │                                        │
│   │  BaseCostEngine                     │                                        │
│   │  • Calcule les coûts opérationnels  │                                        │
│   │  • Initialise context.computed      │                                        │
│   │                                      │                                        │
│   │  Retour: {                          │                                        │
│   │    baseCost: 450€,                  │                                        │
│   │    context: { computed: {...} }     │  ← Réutilisé à l'étape 2              │
│   │  }                                   │                                        │
│   └───────────────┬─────────────────────┘                                        │
│                   │                                                              │
│                   ▼                                                              │
│   ┌─────────────────────────────────────┐                                        │
│   │  ÉTAPE 2: /api/quotation/multi-offers│                                       │
│   │  ─────────────────────────────────  │                                        │
│   │  MultiQuoteService (mode incrémental)│                                       │
│   │  • Réutilise context.computed       │  ← PAS de recalcul                    │
│   │  • Exécute UNIQUEMENT modules add.  │                                        │
│   │  • Applique marges par scénario     │                                        │
│   │                                      │                                        │
│   │  Retour: 6 variantes de prix        │                                        │
│   └─────────────────────────────────────┘                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mode Incrémental

Le **mode incrémental** est une optimisation majeure qui :

1. **Évite le recalcul** : Les modules de base FIXES (volume, distance, transport) ne sont calculés qu'une seule fois par `BaseCostEngine`
2. **Réutilise le contexte** : Le `context.computed` de l'étape 1 est passé à l'étape 2 via `startFromContext`
3. **Ignore les modules déjà exécutés** : Via `skipModules`, le `QuoteEngine` n'exécute pas les modules de base fixes
4. **Recalcule les coûts variables** : `workers-calculation` et `labor-base` sont recalculés pour chaque scénario
5. **Exécute les modules additionnels** : Cross-selling, assurance, ajustements temporels selon le scénario

### Architecture Coûts Fixes vs Variables

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ÉTAPE 1: /api/quotation/calculate                     │
│                              BaseCostEngine                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  COÛTS FIXES (inclus dans baseCost) :                                       │
│  ├─ fuel-cost (carburant)                                                   │
│  ├─ toll-cost (péages)                                                      │
│  └─ vehicle-selection (location véhicule)                                   │
│                                                                              │
│  COÛTS VARIABLES (exclus du baseCost, calculés pour référence) :            │
│  ├─ workers-calculation → workersCount de référence (ex: 8)                 │
│  └─ labor-base → laborCost de référence (ex: 2520€)                         │
│                                                                              │
│  RETOUR: baseCost = fuel + tolls + vehicle (SANS labor)                     │
│          context.computed = { workersCount, distanceKm, adjustedVolume... } │
│                                                                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │ context.computed réutilisé
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ÉTAPE 2: /api/quotation/multi-offers                   │
│                     MultiQuoteService (mode incrémental)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Pour CHAQUE scénario :                                                      │
│  1. Inject scenarioId dans ctx.metadata                                      │
│  2. Recalcule workers-calculation avec règles du scénario                   │
│     - ECO: max 2 déménageurs                                                │
│     - STANDARD: 50% du calcul de base                                       │
│  3. Recalcule labor-base avec le nouveau workersCount                       │
│  4. Exécute modules additionnels (cross-selling, assurance...)              │
│  5. Calcule: finalPrice = (baseCost + laborCost + options) × (1 + marge)    │
│                                                                              │
│  ECO:      baseCost + labor(2)  + options × 1.20                            │
│  STANDARD: baseCost + labor(4)  + options × 1.30                            │
│  CONFORT:  baseCost + labor(8)  + options × 1.35                            │
│  ...                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API 1 : `/api/quotation/calculate`

### Responsabilité

Calcule le **coût opérationnel brut** d'un déménagement de base, sans aucune stratégie commerciale.

### Ce qui est INCLUS (Coûts de base)

Le `baseCost` retourné par `/calculate` contient **uniquement les coûts FIXES** (qui ne varient pas selon le scénario).

| Module                          | Priorité | Description           | Formule/Tarif                             | Inclus dans baseCost     |
| ------------------------------- | -------- | --------------------- | ----------------------------------------- | ------------------------ |
| **VolumeEstimationModule**      | 20       | Estimation du volume  | `surface × coefficient` (0.40-0.50 m³/m²) | ✅ (calcul uniquement)   |
| **DistanceModule**              | 30       | Récupération distance | Via Google Maps API (fallback: 20km)      | ✅ (calcul uniquement)   |
| **FuelCostModule**              | 33       | Coût carburant        | `(distance / 100) × 12L × 1.70€/L`        | ✅ Coût fixe             |
| **TollCostModule**              | 35       | Péages (si >50km)     | `distance × 70% × 0.08€/km`               | ✅ Coût fixe             |
| **VehicleSelectionModule**      | 60       | Location véhicule     | 50€ à 400€ selon type                     | ✅ Coût fixe             |
| **WorkersCalculationModule**    | 61       | Nombre déménageurs    | 2 à 6 selon volume/complexité             | ❌ Variable par scénario |
| **LaborBaseModule**             | 62       | Main d'œuvre          | `45€/h × 7h × nb déménageurs`             | ❌ Variable par scénario |
| **LoadingTimeEstimationModule** | 68       | Temps de chargement   | Dépend du nombre de déménageurs           | ❌ Variable par scénario |

> **IMPORTANT - Coûts VARIABLES exclus du baseCost :**
> Les modules `workers-calculation` et `labor-base` sont exécutés par `BaseCostEngine` mais leurs coûts sont **exclus du baseCost retourné** car ils varient selon le scénario :
>
> - **ECO** : Maximum 2 déménageurs
> - **STANDARD** : 50% du nombre calculé
> - **Autres scénarios** : 100% du nombre calculé

#### Détail des formules de base

**Volume (VolumeEstimationModule) :**

```
Coefficients par type de logement :
- STUDIO : 0.50 m³/m² (mobilier dense)
- F2/F3/F4 : 0.45 m³/m² (mobilier standard)
- HOUSE : 0.40 m³/m² (mobilier moins dense)

Volumes par défaut (sans surface) :
- STUDIO : 12 m³
- F2 : 20 m³
- F3 : 30 m³
- F4 : 40 m³
- HOUSE : 60 m³

Volumes objets spéciaux (ajoutés si non inclus dans estimation) :
- Piano : +8 m³
- Meubles encombrants : +5 m³
- Coffre-fort : +3 m³
- Œuvres d'art : +2 m³
- Électroménager encastré : +3 m³

Ajustement confiance (méthode FORM) :
- LOW : +20%
- MEDIUM : +10%
- HIGH : +5%
```

**Carburant (FuelCostModule) :**

```
Consommation : 12 L/100km (utilitaire moyen)
Prix carburant : 1.70€/L

Formule : (distanceKm / 100) × 12 × 1.70€
Exemple 100km : (100 / 100) × 12 × 1.70 = 20.40€
```

**Péages (TollCostModule) - si distance > 50km :**

```
Coût moyen péages : 0.08€/km
Part autoroute estimée : 70%

Formule : distanceKm × 70% × 0.08€
Exemple 200km : 200 × 0.70 × 0.08 = 11.20€
```

**Véhicule (VehicleSelectionModule) :**

```
Tarifs selon volume :
- UTILITAIRE_PETIT (≤10m³) : 50€  - capacité 5m³
- UTILITAIRE_MOYEN (≤30m³) : 80€  - capacité 10m³
- CAMIONNETTE_COMPACT (≤50m³, Paris) : 120€ - capacité 15m³
- CAMION_12M3 (≤50m³) : 180€ - capacité 12m³
- CAMION_20M3 (≤100m³) : 250€ - capacité 20m³
- CAMION_50M3 (>100m³) : 400€ - capacité 50m³

Nombre de véhicules = ceil(volume / capacité)
```

**Déménageurs (WorkersCalculationModule) :**

```
Formule de base : volume / 5 m³ (arrondi standard)
Exemples :
- 40 m³ / 5 = 8 déménageurs
- 27 m³ / 5 = 5.4 → 5 déménageurs (arrondi à l'inférieur)
- 28 m³ / 5 = 5.6 → 6 déménageurs (arrondi au supérieur)

Ajustements selon le scénario (detecté via ctx.metadata.scenarioId) :
┌───────────┬────────────────────────────────────────────┐
│ Scénario  │ Règle d'ajustement                         │
├───────────┼────────────────────────────────────────────┤
│ ECO       │ Maximum 2 déménageurs (plafonné)           │
│ STANDARD  │ 50% du nombre calculé (arrondi standard)   │
│ Autres    │ 100% du nombre calculé (pas d'ajustement)  │
└───────────┴────────────────────────────────────────────┘

Exemple avec 40 m³ :
- Calcul de base : 40 / 5 = 8 déménageurs
- ECO : 8 → plafonné à 2 déménageurs
- STANDARD : 8 × 50% = 4 déménageurs
- CONFORT/PREMIUM/etc. : 8 déménageurs
```

**Main d'œuvre (LaborBaseModule) :**

```
Taux horaire : 45€/h (configurable via MODULES_CONFIG.labor.BASE_HOURLY_RATE)
Heures de travail : 7h par journée (configurable via MODULES_CONFIG.labor.BASE_WORK_HOURS)

Formule : 45€/h × 7h × workersCount

Exemple avec 40 m³ :
- Calcul de base : 8 déménageurs
- ECO (2 déménageurs) : 45 × 7 × 2 = 630€
- STANDARD (4 déménageurs) : 45 × 7 × 4 = 1260€
- CONFORT (8 déménageurs) : 45 × 7 × 8 = 2520€

Note : Ce module dépend de WorkersCalculationModule pour obtenir workersCount.
Le coût de main d'œuvre est EXCLU du baseCost car il varie selon le scénario.
```

### Ce qui est EXCLU

| Catégorie                 | Modules exclus                                                                     | Raison                 |
| ------------------------- | ---------------------------------------------------------------------------------- | ---------------------- |
| **Marge commerciale**     | -                                                                                  | Ajoutée par scénario   |
| **Ajustements temporels** | WeekendModule, EndOfMonthModule                                                    | Spécifique au scénario |
| **Cross-selling**         | PackingCostModule, CleaningEndCostModule, StorageCostModule, DismantlingCostModule | Options payantes       |
| **Objets spéciaux**       | HighValueItemHandlingModule                                                        | Surcoût optionnel      |
| **Monte-meubles**         | FurnitureLiftCostModule                                                            | Optionnel              |
| **Assurance**             | InsurancePremiumModule                                                             | Option client          |
| **Garantie flexibilité**  | CrewFlexibilityModule                                                              | Option premium         |

### Retour API

```typescript
{
  success: true,
  baseCost: number,  // Coût opérationnel brut en €
  breakdown: {
    volume: { baseVolume: number, adjustedVolume: number },
    distance: { km: number, isLongDistance: boolean },
    transport: { fuel: number, tolls: number, vehicle: number },
    labor: { workers: number, hours: number, cost: number }
  },
  context: {
    // Contexte enrichi avec computed (réutilisé par /multi-offers)
    computed: ComputedContext,  // ← IMPORTANT : passé à l'étape 2
    original: QuoteContext      // Données du formulaire
  },
  activatedModules: string[]   // Liste des modules exécutés
}
```

> **Note importante** : Le `context.computed` retourné est réutilisé par `/multi-offers` en mode incrémental pour éviter de recalculer les modules de base.

---

## API 2 : `/api/quotation/multi-offers`

### Responsabilité

Génère **6 variantes de devis** en appliquant différentes stratégies commerciales au `baseCost`.

### Mode Incrémental (Optimisation)

Le `MultiQuoteService` utilise le **mode incrémental** du `QuoteEngine` :

```typescript
// Configuration du QuoteEngine en mode incrémental
const engine = new QuoteEngine(modules, {
  // Mode incrémental
  startFromContext: baseComputed, // Réutilise le computed de /calculate
  skipModules: BASE_COST_MODULES, // Ignore les modules de base fixes

  // Configuration du scénario
  enabledModules: scenario.enabledModules,
  disabledModules: scenario.disabledModules,
  marginRate: scenario.marginRate,
});
```

**Modules de base ignorés (coûts FIXES - déjà calculés)** :

- `input-sanitization`, `date-validation`, `address-normalization`
- `volume-estimation`
- `distance-calculation`, `long-distance-threshold`, `fuel-cost`, `toll-cost`
- `vehicle-selection`

**Modules de coûts VARIABLES (recalculés par scénario)** :

- `workers-calculation` - Le nombre de déménageurs varie selon le scénario (ECO: max 2, STANDARD: 50%)
- `labor-base` - Le coût main d'œuvre dépend du nombre de déménageurs

> **IMPORTANT** : Les modules `workers-calculation` et `labor-base` ne sont PAS dans `BASE_COST_MODULES` car ils doivent être recalculés pour chaque scénario avec des règles d'ajustement différentes.

**Modules exécutés par scénario** :

- Cross-selling : `packing-cost`, `cleaning-end-cost`, `storage-cost`, `dismantling-cost`
- Assurance : `insurance-premium`, `declared-value-validation`
- Ajustements temporels : `weekend`, `end-of-month`
- Options : `furniture-lift-cost`, `crew-flexibility`, `overnight-stop-cost`

### Les 6 Scénarios

---

#### 1. ECO - L'essentiel à petit prix

| Caractéristique | Valeur               |
| --------------- | -------------------- |
| **ID**          | `ECO`                |
| **Marge**       | 20%                  |
| **Tags**        | `LOW_PRICE`, `ENTRY` |

**Ce que le CLIENT fait :**

- Emballe TOUTES ses affaires lui-même
- Fournit ses propres cartons et protections
- Démonte TOUS les meubles lui-même
- Vide totalement le logement avant l'arrivée

**Ce qu'apporte le DÉMÉNAGEUR :**

- Transport sécurisé
- Main-d'œuvre chargement/déchargement (équipe réduite)
- Arrimage basique des biens

**Ajustement main d'œuvre (WorkersCalculationModule) :**

```
Règle ECO : Maximum 2 déménageurs
- Si le calcul de base donne 4 déménageurs → plafonné à 2
- Permet de proposer un tarif compétitif
- Le client accepte un temps de chargement/déchargement plus long
```

**Modules désactivés :**

- `packing-requirement`, `packing-cost`
- `cleaning-end-requirement`, `cleaning-end-cost`
- `dismantling-cost`
- `high-value-item-handling`

**Formule :** `(baseCost + laborCost_ECO) × 1.20`

- `baseCost` = coûts fixes (transport, véhicule, carburant, péages)
- `laborCost_ECO` = 45€/h × 7h × 2 déménageurs max

---

#### 2. STANDARD - Meilleur rapport qualité-prix

| Caractéristique | Valeur                    |
| --------------- | ------------------------- |
| **ID**          | `STANDARD`                |
| **Marge**       | 30%                       |
| **Tags**        | `RECOMMENDED`, `BALANCED` |

**Ce que le CLIENT fait :**

- Emballe les objets fragiles et personnels
- Vide armoires et commodes
- Indique les meubles à démonter

**Ce qu'apporte le DÉMÉNAGEUR :**

- Protection renforcée des meubles
- Démontage/remontage simple si nécessaire
- Organisation fluide du jour J
- Équipe optimisée

**Ajustement main d'œuvre (WorkersCalculationModule) :**

```
Règle STANDARD : 50% du nombre calculé (arrondi standard)
- Si le calcul de base donne 8 déménageurs → 8 × 50% = 4 déménageurs
- Si le calcul de base donne 5 déménageurs → 5 × 50% = 2.5 → 3 déménageurs (arrondi au supérieur)
- Équilibre optimal entre coût et efficacité
```

**Modules activés :** Tous les modules de base (pas de modules désactivés, pas d'overrides)

**Formule :** `(baseCost + laborCost_STANDARD) × 1.30`

- `baseCost` = coûts fixes (transport, véhicule, carburant, péages)
- `laborCost_STANDARD` = 45€/h × 7h × (workersCalculés × 50%)

---

#### 3. CONFORT - Emballage et démontage professionnels

| Caractéristique | Valeur              |
| --------------- | ------------------- |
| **ID**          | `CONFORT`           |
| **Marge**       | 35%                 |
| **Tags**        | `COMFORT`, `UPSELL` |

**Ce que le CLIENT fait :**

- Signale les objets fragiles ou précieux
- Vide frigo/congélateur

**Ce qu'apporte le DÉMÉNAGEUR :**

- Emballage professionnel complet
- Fourniture de tout le matériel (cartons, bulles, adhésif)
- Démontage/remontage complet des meubles
- Manutention soignée et sans stress

**Modules activés :**

- `packing-requirement`, `packing-cost`
- `dismantling-cost`
- `high-value-item-handling`

**Overrides contexte :**

```typescript
{
  packing: true,
  bulkyFurniture: true,
  artwork: true
}
```

**Coûts additionnels :**

- Emballage : `volume × 25€/m³`
- Démontage : 80€ base + 40€/meuble complexe + 60€/meuble encombrant + 100€ si piano
- Objets de valeur : Piano 150€, Coffre-fort 200€, Œuvres d'art 100€

**Formule :** `(baseCost + emballage + démontage + objets valeur) × 1.35`

---

#### 4. SECURITY - Protection maximale de vos biens

| Caractéristique | Valeur            |
| --------------- | ----------------- |
| **ID**          | `SECURITY`        |
| **Marge**       | 32%               |
| **Tags**        | `SECURITY`, `PRO` |

**Ce que le CLIENT fait :**

- Autorise l'installation du monte-meubles
- Libère l'accès fenêtres/balcon

**Ce qu'apporte le DÉMÉNAGEUR :**

- Monte-meubles systématique
- Protocoles de manutention sécurisés
- Protection premium de tous les biens
- Assurance renforcée

**Avantages sécurité :**

- Risque de casse réduit de 80% vs portage manuel
- Pas de dégradation murs/portes dans les escaliers
- Conformité totale aux normes de sécurité

**Modules activés :**

- `furniture-lift-cost`

**Overrides contexte :**

```typescript
{
  refuseLiftDespiteRecommendation: false; // Force l'acceptation du monte-meubles
}
```

**Coût monte-meubles (FurnitureLiftCostModule) :**

```
Base : 250€ (installation + opérateur)
Par étage supplémentaire (>1er) départ : +50€/étage
Par étage supplémentaire (>1er) arrivée : +50€/étage
Double installation (départ + arrivée) : +150€

Exemples :
- 3ème étage départ seul : 250€ + (2 × 50€) = 350€
- 3ème départ + 2ème arrivée : 250€ + (2×50€) + (1×50€) + 150€ = 550€
```

**Formule :** `(baseCost + monte-meubles) × 1.32`

---

#### 5. PREMIUM - Service clé en main tout inclus

| Caractéristique | Valeur                     |
| --------------- | -------------------------- |
| **ID**          | `PREMIUM`                  |
| **Marge**       | 40%                        |
| **Tags**        | `PREMIUM`, `ALL_INCLUSIVE` |

**Ce que le CLIENT fait :**

- Fournit le plan d'installation du nouveau logement
- Est présent en début/fin de journée

**Ce qu'apporte le DÉMÉNAGEUR :**

- Délégation totale du déménagement
- Emballage + démontage + remontage intégral
- Nettoyage fin de bail inclus
- Créneau horaire garanti + SAV dédié
- Chef d'équipe dédié (coordinateur)
- Récupération cartons vides sous 48h
- Support téléphonique prioritaire J-7 à J+7
- Assurance tous risques valeur maximale

**Modules activés :**

- `packing-requirement`, `packing-cost`
- `cleaning-end-requirement`, `cleaning-end-cost`
- `dismantling-cost`
- `high-value-item-handling`

**Overrides contexte :**

```typescript
{
  packing: true,
  cleaningEnd: true,
  bulkyFurniture: true,
  artwork: true,
  surface: 80  // Assure que le nettoyage est recommandé (>60m²)
}
```

**Coûts additionnels :**

- Emballage : `volume × 25€/m³`
- Nettoyage : `surface × 8€/m²`
- Démontage : 80€ base + suppléments
- Objets de valeur : selon type

**Formule :** `(baseCost + emballage + nettoyage + démontage + objets valeur) × 1.40`

---

#### 6. FLEX - Adaptabilité maximale (longue distance)

| Caractéristique | Valeur                        |
| --------------- | ----------------------------- |
| **ID**          | `FLEX`                        |
| **Marge**       | 38%                           |
| **Tags**        | `FLEXIBILITY`, `RISK_COVERED` |

**Ce que le CLIENT fait :**

- Accepte une flexibilité horaire
- Donne une estimation de volume

**Ce qu'apporte le DÉMÉNAGEUR :**

- Ajustement équipe en temps réel
- Gestion des imprévus sans surcoût immédiat
- Logistique longue distance maîtrisée
- Suppression des litiges volume
- Arrêt nuit sécurisé si >500km

**Avantages FLEX :**

- Aucun risque de mauvaise surprise volume
- Équipe adaptée même si estimation incorrecte
- Flexibilité totale planning et logistique

**Modules activés :**

- `overnight-stop-cost` (si >500km)
- `crew-flexibility`

**Overrides contexte :**

```typescript
{
  crewFlexibility: true; // Force la garantie flexibilité
}
```

**Coût garantie flexibilité (CrewFlexibilityModule) :**

```
Forfait : 150€
Couvre :
- +1 déménageur si besoin
- +2h de travail
- Véhicule plus grand si nécessaire
```

**Coût arrêt nuit (OvernightStopCostModule) - si >500km :**

```
Hébergement : 120€ par déménageur (nuit + petit-déjeuner)
Parking sécurisé : 50€
Indemnité repas : 30€ par déménageur (dîner)

Formule : (120€ + 30€) × nb déménageurs + 50€

Exemple 3 déménageurs : (120 + 30) × 3 + 50 = 500€
```

**Formule :** `(baseCost + garantie flexibilité + arrêt nuit si applicable) × 1.38`

---

## Tableau récapitulatif des marges et ajouts

| Scénario     | Marge | Main d'œuvre      | Modules spécifiques                        | Coûts additionnels typiques       |
| ------------ | ----- | ----------------- | ------------------------------------------ | --------------------------------- |
| **ECO**      | 20%   | Max 2 déménageurs | Modules désactivés                         | Labor réduit                      |
| **STANDARD** | 30%   | 50% du calcul     | Tous modules de base                       | Labor optimisé                    |
| **CONFORT**  | 35%   | 100%              | packing, dismantling, high-value           | Emballage + démontage             |
| **SECURITY** | 32%   | 100%              | furniture-lift                             | Monte-meubles (250€+)             |
| **PREMIUM**  | 40%   | 100%              | packing, cleaning, dismantling, high-value | Emballage + nettoyage + démontage |
| **FLEX**     | 38%   | 100%              | crew-flexibility, overnight-stop           | Garantie (150€) + arrêt nuit      |

### Impact des ajustements main d'œuvre sur le prix final

```
Exemple avec 40 m³, baseCost fixe = 500€ :

┌───────────┬─────────────┬─────────────┬───────────┬───────────────┐
│ Scénario  │ Déménageurs │ Labor Cost  │ Sous-total│ Prix Final    │
├───────────┼─────────────┼─────────────┼───────────┼───────────────┤
│ ECO       │ 2 (max)     │ 630€        │ 1130€     │ 1356€ (×1.20) │
│ STANDARD  │ 4 (50%)     │ 1260€       │ 1760€     │ 2288€ (×1.30) │
│ CONFORT   │ 8 (100%)    │ 2520€       │ 3020€     │ 4077€ (×1.35) │
│ SECURITY  │ 8 (100%)    │ 2520€       │ 3020€     │ 3986€ (×1.32) │
│ PREMIUM   │ 8 (100%)    │ 2520€       │ 3020€     │ 4228€ (×1.40) │
│ FLEX      │ 8 (100%)    │ 2520€       │ 3020€     │ 4168€ (×1.38) │
└───────────┴─────────────┴─────────────┴───────────┴───────────────┘

Note : Cet exemple exclut les options additionnelles (emballage, nettoyage, etc.)
       qui s'ajoutent au sous-total avant application de la marge.
```

---

## Détail des coûts additionnels (modules cross-selling)

### Cross-selling (options payantes)

| Service                 | Module              | Tarif       | Formule exacte                                      |
| ----------------------- | ------------------- | ----------- | --------------------------------------------------- |
| Emballage professionnel | `packing-cost`      | 25€/m³      | `volume × 25€`                                      |
| Nettoyage fin de bail   | `cleaning-end-cost` | 8€/m²       | `surface × 8€`                                      |
| Stockage temporaire     | `storage-cost`      | 30€/m³/mois | `volume × 30€ × ceil(jours/30)`                     |
| Démontage meubles       | `dismantling-cost`  | Variable    | 80€ base + 40€/meuble + 60€/encombrant + 100€/piano |

### Objets de valeur (HighValueItemHandlingModule)

| Objet                 | Surcoût manutention   | Condition                        |
| --------------------- | --------------------- | -------------------------------- |
| Piano                 | 150€                  | `ctx.piano === true`             |
| Coffre-fort           | 200€                  | `ctx.safe === true`              |
| Œuvres d'art          | 100€                  | `ctx.artwork === true`           |
| Valeur déclarée >50k€ | Requirement seulement | Protection renforcée recommandée |

### Monte-meubles (FurnitureLiftCostModule)

| Élément                          | Tarif      |
| -------------------------------- | ---------- |
| Base (installation + opérateur)  | 250€       |
| Par étage supplémentaire (>1er)  | +50€/étage |
| Double installation (2 adresses) | +150€      |

### Ajustements temporels

| Période                 | Module         | Surcoût | Base de calcul                   |
| ----------------------- | -------------- | ------- | -------------------------------- |
| Week-end (sam=6, dim=0) | `weekend`      | +20%    | Sur totalité des coûts existants |
| Fin de mois (jour ≥25)  | `end-of-month` | +15%    | Sur totalité des coûts existants |

### Longue distance (>50km)

| Élément    | Module                | Seuil  | Tarif                              |
| ---------- | --------------------- | ------ | ---------------------------------- |
| Péages     | `toll-cost`           | >50km  | `distance × 70% × 0.08€/km`        |
| Arrêt nuit | `overnight-stop-cost` | >500km | `(120€ + 30€) × déménageurs + 50€` |

### Assurance (InsurancePremiumModule)

| Élément                 | Valeur                                                   |
| ----------------------- | -------------------------------------------------------- |
| Taux                    | 1% de la valeur déclarée                                 |
| Prime minimale          | 50€                                                      |
| Prime maximale          | 5000€                                                    |
| Assureur partenaire     | AXA                                                      |
| Condition d'application | `declaredValueInsurance === true` ET `declaredValue > 0` |

### Garantie flexibilité (CrewFlexibilityModule)

| Élément                 | Valeur                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------- |
| Forfait                 | 150€                                                                                    |
| Couverture              | +1 déménageur, +2h travail, véhicule plus grand                                         |
| Condition d'application | `crewFlexibility === true` OU `volumeMethod === 'FORM'` OU `volumeConfidence === 'LOW'` |

---

## Avantages de cette architecture

### 1. Séparation claire des responsabilités

- **`/calculate`** : Coûts opérationnels purs (carburant, main d'œuvre, véhicule)
- **`/multi-offers`** : Stratégie commerciale et options

### 2. Réutilisabilité

- `/calculate` peut être utilisé pour :
  - Estimations rapides B2B
  - Comparaisons internes
  - Calcul de rentabilité

### 3. Performance

- `/calculate` est léger (modules de base uniquement)
- `/multi-offers` enrichit le résultat de manière ciblée

### 4. Flexibilité

- Les scénarios peuvent évoluer sans toucher au calcul de base
- Nouvelles marges, nouveaux services facilement ajoutables

### 5. Transparence client

- Le client voit clairement ce qui est inclus dans chaque offre
- Pas de coûts cachés : tout est explicité par scénario

---

## Flux d'implémentation (Frontend)

Le hook `useModularQuotation` expose les méthodes suivantes pour le flux séquentiel :

```typescript
// Utilisation recommandée : flux complet séquentiel
const { calculateFullQuote, multiOffers, isPriceLoading } =
  useModularQuotation();

// Appel unique qui exécute calculate → multi-offers
const result = await calculateFullQuote(formData);
// result contient les 6 offres avec leurs prix

// Ou utilisation avec debounce (pour formulaire en temps réel)
const { calculateWithDebounce } = useModularQuotation();
calculateWithDebounce(formData); // Automatiquement débounce + flux séquentiel
```

### Méthodes disponibles

| Méthode                           | Description                   | Usage                                       |
| --------------------------------- | ----------------------------- | ------------------------------------------- |
| `calculateBaseCost(formData)`     | Étape 1 : Calcule le baseCost | Appel direct à /calculate                   |
| `calculateMultiOffers(formData)`  | Étape 2 : Génère les 6 offres | Nécessite baseCost (auto-calculé si absent) |
| `calculateFullQuote(formData)`    | Flux complet séquentiel       | **Recommandé** - Exécute les 2 étapes       |
| `calculateWithDebounce(formData)` | Avec debounce 800ms           | Pour formulaires temps réel                 |

### États exposés

| État                       | Type               | Description     |
| -------------------------- | ------------------ | --------------- | --------------------------- |
| `baseCostResult`           | `BaseCostResult    | null`           | Résultat étape 1            |
| `multiOffers`              | `MultiOffersResult | null`           | Résultat étape 2 (6 offres) |
| `isCalculatingBaseCost`    | `boolean`          | Loading étape 1 |
| `isCalculatingMultiOffers` | `boolean`          | Loading étape 2 |
| `isPriceLoading`           | `boolean`          | Loading global  |
| `calculatedPrice`          | `number`           | Prix recommandé |
| `error`                    | `string            | null`           | Message d'erreur            |

---

## Fichiers sources

| Fichier                                                                                      | Description                                               |
| -------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| [BaseCostEngine.ts](../src/quotation-module/core/BaseCostEngine.ts)                          | Moteur calcul coût de base (étape 1)                      |
| [QuoteEngine.ts](../src/quotation-module/core/QuoteEngine.ts)                                | Moteur d'exécution des modules (mode complet/incrémental) |
| [QuoteScenario.ts](../src/quotation-module/multi-offers/QuoteScenario.ts)                    | Définition des 6 scénarios                                |
| [MultiQuoteService.ts](../src/quotation-module/multi-offers/MultiQuoteService.ts)            | Service génération multi-offres (mode incrémental)        |
| [ModuleRegistry.ts](../src/quotation-module/core/ModuleRegistry.ts)                          | Registre de tous les modules                              |
| [calculate/route.ts](../src/app/api/quotation/calculate/route.ts)                            | API calcul de base                                        |
| [multi-offers/route.ts](../src/app/api/quotation/multi-offers/route.ts)                      | API multi-offres                                          |
| [QuoteController.ts](../src/quotation-module/interfaces/http/controllers/QuoteController.ts) | Contrôleur des APIs                                       |
| [useModularQuotation.ts](../src/hooks/shared/useModularQuotation.ts)                         | Hook frontend                                             |
| [insurance.config.ts](../src/quotation-module/config/insurance.config.ts)                    | Configuration assurance                                   |

### Architecture des moteurs

```
┌─────────────────────────────────────────────────────────────────┐
│                        QuoteEngine                              │
│  ─────────────────────────────────────────────────────────────  │
│  Moteur d'exécution des modules avec 2 modes :                  │
│                                                                  │
│  MODE COMPLET (par défaut) :                                    │
│  • Initialise ctx.computed vide                                 │
│  • Exécute TOUS les modules applicables                         │
│  • Utilisé par BaseCostEngine                                   │
│                                                                  │
│  MODE INCRÉMENTAL (startFromContext + skipModules) :            │
│  • Réutilise ctx.computed existant                              │
│  • Ignore les modules dans skipModules                          │
│  • Exécute uniquement les modules additionnels                  │
│  • Utilisé par MultiQuoteService                                │
└─────────────────────────────────────────────────────────────────┘
          ▲                                    ▲
          │                                    │
┌─────────┴─────────┐              ┌──────────┴──────────┐
│  BaseCostEngine   │              │  MultiQuoteService  │
│  (MODE COMPLET)   │──────────────│ (MODE INCRÉMENTAL)  │
│                   │  context     │                     │
│  Calcule baseCost │  .computed   │  Génère 6 variantes │
└───────────────────┘──────────────└─────────────────────┘
```

---

## Résumé des informations vérifiées

Ce document a été mis à jour avec les formules et tarifs exacts extraits du code source :

### Modules de base (coûts FIXES - inclus dans baseCost)

1. **VolumeEstimationModule** : Coefficients précis (0.40-0.50 m³/m²), volumes par défaut, volumes objets spéciaux, ajustements confiance
2. **FuelCostModule** : `(distance/100) × 12L × 1.70€/L`
3. **TollCostModule** : `distance × 70% × 0.08€/km` (si >50km)
4. **VehicleSelectionModule** : Tarifs de 50€ à 400€ avec capacités

### Modules variables (coûts EXCLUS du baseCost - recalculés par scénario)

5. **WorkersCalculationModule** : `volume / 5 m³` avec ajustements par scénario :
   - ECO : Maximum 2 déménageurs
   - STANDARD : 50% du nombre calculé (arrondi standard)
   - Autres : 100% du nombre calculé
6. **LaborBaseModule** : `45€/h × 7h × workersCount`
7. **LoadingTimeEstimationModule** : Priorité 68 (PHASE 6), dépend de workers-calculation

### Modules additionnels (cross-selling, options)

8. **CleaningEndCostModule** : `surface × 8€/m²`
9. **StorageCostModule** : `volume × 30€/m³ × mois`
10. **DismantlingCostModule** : 80€ base + 40€/meuble + 60€/encombrant + 100€/piano
11. **HighValueItemHandlingModule** : Piano 150€, Coffre-fort 200€, Œuvres d'art 100€
12. **OvernightStopCostModule** : `(120€ + 30€) × déménageurs + 50€` (si >500km)
13. **CrewFlexibilityModule** : 150€ forfait
14. **EndOfMonthModule** : +15% (jour ≥25)
15. **WeekendModule** : +20% (sam/dim)
16. **InsurancePremiumModule** : 1% (min 50€, max 5000€), assureur AXA

### Architecture clé

- **BaseCostEngine** : Calcule les coûts fixes et initialise `context.computed`
- **VARIABLE_COST_MODULES** : `['workers-calculation', 'labor-base']` - exclus du baseCost
- **MultiQuoteService** : Mode incrémental, recalcule les coûts variables par scénario
- **Formule finale** : `(baseCost + laborCost_scénario + options) × (1 + marge)`
