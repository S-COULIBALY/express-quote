# Tableau des Modules par Scénario

## Vue d'ensemble

Ce document récapitule les **38 modules** du système de cotation, organisés en **8 phases** :
- **11 modules BASE** (exécutés une seule fois en étape 1)
- **27 modules ADDITIONNELS** (exécutés par scénario en étape 2)

---

## Architecture 2 Étapes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : BaseCostEngine (exécution unique)                                 │
│ ─────────────────────────────────────────────────────────────────────────── │
│ • Exécute les 11 BASE_COST_MODULES une seule fois                           │
│ • Calcule : volume, distance, carburant, péages, véhicule, main d'œuvre     │
│ • Résultat : baseQuoteContext partagé par tous les scénarios                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : MultiQuoteService (6 exécutions parallèles)                       │
│ ─────────────────────────────────────────────────────────────────────────── │
│ • Applique les 27 modules additionnels selon chaque scénario                │
│ • Chaque scénario : enabledModules, disabledModules, overrides, marginRate  │
│ • Résultat : 6 devis personnalisés (ECO, STANDARD, CONFORT, etc.)           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tableau Complet des 38 Modules

### PHASE 1 — Normalisation & Validation (Priority 10-12)

**Objectif** : Nettoyer et valider les données d'entrée avant tout calcul.

| # | Module | Priority | Type | Rôle / Fonction |
|:-:|--------|:--------:|:----:|-----------------|
| 1 | `input-sanitization` | 10 | BASE | Sanitise les entrées (XSS, injection), normalise formats |
| 2 | `date-validation` | 11 | BASE | Valide date future, format ISO 8601, calcule daysUntilMoving |
| 3 | `address-normalization` | 12 | BASE | Normalise adresses, codes postaux, villes (majuscules, accents) |

---

### PHASE 2 — Estimation Volume (Priority 20-22)

**Objectif** : Estimer ou valider le volume à déménager.

| # | Module | Priority | Type | Rôle / Fonction |
|:-:|--------|:--------:|:----:|-----------------|
| 4 | `volume-estimation` | 20 | BASE | Estime volume si non fourni (surface × coeff + ajustements) |
| 5 | `volume-uncertainty-risk` | 22 | Additionnel | Surcoût si volume incertain (écart estimation/déclaré) |

---

### PHASE 3 — Distance & Transport (Priority 30-35)

**Objectif** : Calculer distances, carburant, péages et ajustements longue distance.

| # | Module | Priority | Type | Rôle / Fonction |
|:-:|--------|:--------:|:----:|-----------------|
| 6 | `distance-calculation` | 30 | BASE | Calcule distance via API Google Maps ou estimation |
| 7 | `long-distance-threshold` | 31 | BASE | Détermine si longue distance (>100km), active modules spécifiques |
| 8 | `fuel-cost` | 33 | BASE | Calcule coût carburant (distance × conso × prix/L) |
| 9 | `toll-cost` | 35 | BASE | Estime coût péages autoroute |
| 10 | `long-distance-surcharge` | 34 | Additionnel | Forfait kilométrique longue distance (usure, indisponibilité, frais annexes) |
| 11 | `overnight-stop-cost` | 36 | Additionnel | Coût arrêt nuit si >1000km (hôtel + repas équipe) |

---

### PHASE 4 — Accès & Contraintes (Priority 40-49)

**Objectif** : Évaluer les contraintes d'accès et leurs surcoûts.

| # | Module | Priority | Type | Rôle / Fonction |
|:-:|--------|:--------:|:----:|-----------------|
| 12 | `no-elevator-pickup` | 40 | Additionnel | Surcoût si étage départ sans ascenseur |
| 13 | `no-elevator-delivery` | 41 | Additionnel | Surcoût si étage arrivée sans ascenseur |
| 14 | `navette-required` | 42 | Additionnel | Surcoût navette si accès camion impossible |
| 15 | `traffic-idf` | 43 | Additionnel | Surcoût trafic Île-de-France |
| 16 | `time-slot-syndic` | 44 | Additionnel | Surcoût créneaux imposés par syndic |
| 17 | `loading-time-estimation` | 45 | Additionnel | Estime temps chargement/déchargement |

---

### PHASE 5 — Monte-Meubles (Priority 50-55)

**Objectif** : Gérer la recommandation et tarification du monte-meubles.

| # | Module | Priority | Type | Rôle / Fonction |
|:-:|--------|:--------:|:----:|-----------------|
| 18 | `monte-meubles-recommendation` | 50 | Additionnel | Recommande monte-meubles si étage > 2 sans ascenseur |
| 19 | `monte-meubles-refusal-impact` | 52 | Additionnel | Impact refus : -50% assurance, responsabilité limitée |
| 20 | `furniture-lift-cost` | 53 | Additionnel | Coût monte-meubles (250€ simple, 500€ double) |
| 21 | `manual-handling-risk-cost` | 55 | Additionnel | Surcoût risque si refus monte-meubles recommandé |

---

### PHASE 6 — Main d'Œuvre (Priority 60-65)

**Objectif** : Calculer véhicule, équipe et coûts main d'œuvre.

| # | Module | Priority | Type | Rôle / Fonction |
|:-:|--------|:--------:|:----:|-----------------|
| 22 | `vehicle-selection` | 60 | BASE | Sélectionne véhicule adapté au volume |
| 23 | `workers-calculation` | 61 | BASE | Calcule nombre déménageurs nécessaires |
| 24 | `labor-base` | 62 | BASE | Calcule coût main d'œuvre de base |
| 25 | `labor-access-penalty` | 63 | Additionnel | Majoration main d'œuvre si accès difficile |
| 26 | `crew-flexibility` | 65 | Additionnel | Garantie flexibilité équipe (+500€) |

---

### PHASE 7 — Assurance & Risque (Priority 70-79)

**Objectif** : Gérer assurances, valeur déclarée et risques.

| # | Module | Priority | Type | Rôle / Fonction |
|:-:|--------|:--------:|:----:|-----------------|
| 27 | `declared-value-validation` | 70 | Additionnel | Valide cohérence valeur déclarée |
| 28 | `insurance-premium` | 71 | Additionnel | Calcule prime assurance selon valeur |
| 29 | `high-value-item-handling` | 72 | Additionnel | Surcoût manipulation objets de valeur (piano, coffre, art) |
| 30 | `co-ownership-rules` | 73 | Additionnel | Applique règles copropriété |
| 31 | `neighborhood-damage-risk` | 74 | Additionnel | Évalue risque dégâts parties communes |
| 32 | `public-domain-occupation` | 75 | Additionnel | Coût occupation domaine public |

---

### PHASE 8 — Options & Cross-Selling (Priority 80-90)

**Objectif** : Proposer et facturer les services additionnels.

| # | Module | Priority | Type | Rôle / Fonction |
|:-:|--------|:--------:|:----:|-----------------|
| 33 | `end-of-month` | 80 | Additionnel | Majoration fin de mois (haute demande) |
| 34 | `weekend` | 81 | Additionnel | Majoration week-end |
| 35 | `packing-requirement` | 82 | Additionnel | Détecte besoin emballage, propose cross-sell |
| 36 | `packing-cost` | 85 | Additionnel | Coût emballage professionnel (5€/m³) |
| 37 | `cleaning-end-requirement` | 83 | Additionnel | Détecte besoin nettoyage, propose cross-sell |
| 38 | `cleaning-end-cost` | 86 | Additionnel | Coût nettoyage fin de bail (8€/m²) |
| 39 | `dismantling-cost` | 86.5 | Additionnel | Coût démontage meubles (50€ base + extras) |
| 40 | `reassembly-cost` | 86.6 | Additionnel | Coût remontage meubles (50€ base + extras) |
| 41 | `storage-requirement` | 84 | Additionnel | Détecte besoin stockage temporaire |
| 42 | `storage-cost` | 87 | Additionnel | Coût stockage (30€/m³/mois) |

---

## Récapitulatif par Phase

| Phase | Objectif | Modules BASE | Modules Additionnels | Total |
|:-----:|----------|:------------:|:--------------------:|:-----:|
| 1 | Normalisation & Validation | 3 | 0 | 3 |
| 2 | Estimation Volume | 1 | 1 | 2 |
| 3 | Distance & Transport | 4 | 2 | 6 |
| 4 | Accès & Contraintes | 0 | 6 | 6 |
| 5 | Monte-Meubles | 0 | 4 | 4 |
| 6 | Main d'Œuvre | 3 | 2 | 5 |
| 7 | Assurance & Risque | 0 | 6 | 6 |
| 8 | Options & Cross-Selling | 0 | 10 | 10 |
| **TOTAL** | | **11** | **27** | **38** |

---

## Tableau des Modules - Lecture Orientée Client

> **Principe** : Modules les plus souvent inclus placés en haut, lecture verticale évidente

| Module / Prestation              |  ECO  |  STANDARD  |  CONFORT  |  PREMIUM  |  SÉCURITÉ+  |  FLEX  |
| -------------------------------- | :---: | :--------: | :-------: | :-------: | :---------: | :----: |
| **Emballage (packing)**          |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ⭕   |
| **Fournitures (cartons, etc.)**  |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ⭕   |
| **Démontage des meubles**        |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ✅   |
| **Remontage des meubles**        |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ✅   |
| **Objets de valeur / fragiles**  |   ❌   |      ⭕     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| **Assurance renforcée**          |   ⭕   |      ⭕     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| -------------------------------- | ----- | ---------- | --------- | --------- | ----------- | ------ |
| **Nettoyage fin de prestation**  |   ❌   |      ❌     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| **Monte-meubles (si requis)**    |   ⭕*  |     ⭕*     |     ⭕*    |     ⭕*    |      ⭕*     |   ⭕*   |
| **Étape / nuit intermédiaire**   |   ❌   |      ❌     |     ⭕     |     ⭕     |      ⭕      |    ✅   |
| **Flexibilité équipe / planning**|   ❌   |      ❌     |     ⭕     |     ⭕     |      ⭕      |    ✅   |

**Légende :**
- ✅ = **Inclus d'office** dans la formule
- ❌ = **Non disponible** dans cette formule
- ⭕ = **Disponible en option** (selon vos besoins)
- ⭕* = **Conditionnel technique** (recommandé automatiquement si nécessaire, ex: étage ≥3 ou ≥5)

---

## Tableau Technique Détaillé - 27 Modules Additionnels par Scénario

| Module | ECO | STANDARD | CONFORT | SÉCURITÉ+ | PREMIUM | FLEX |
|--------|:---:|:--------:|:-------:|:--------:|:-------:|:----:|
| **PHASE 2 - Volume** |
| `volume-uncertainty-risk` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **PHASE 3 - Distance** |
| `long-distance-surcharge` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `overnight-stop-cost` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |
| **PHASE 4 - Accès & Contraintes** |
| `no-elevator-pickup` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `no-elevator-delivery` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `navette-required` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `traffic-idf` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `time-slot-syndic` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `loading-time-estimation` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **PHASE 5 - Monte-Meubles** |
| `monte-meubles-recommendation` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `monte-meubles-refusal-impact` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `furniture-lift-cost` | ⚪ | ⚪ | ⚪ | ✅ | ⚪ | ⚪ |
| `manual-handling-risk-cost` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **PHASE 6 - Main d'œuvre** |
| `labor-access-penalty` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `crew-flexibility` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |
| **PHASE 7 - Assurance & Risque** |
| `declared-value-validation` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `insurance-premium` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `high-value-item-handling` | ❌ | ⚪ | ✅ | ⚪ | ✅ | ⚪ |
| `co-ownership-rules` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `neighborhood-damage-risk` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `public-domain-occupation` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| **PHASE 8 - Options & Cross-Selling** |
| `end-of-month` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `weekend` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `packing-requirement` | ❌ | ⚪ | ✅ | ⚪ | ✅ | ⚪ |
| `packing-cost` | ❌ | ⚪ | ✅ | ⚪ | ✅ | ⚪ |
| `cleaning-end-requirement` | ❌ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ |
| `cleaning-end-cost` | ❌ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ |
| `dismantling-cost` | ❌ | ⚪ | ✅ | ✅ | ✅ | ✅ |
| `reassembly-cost` | ❌ | ⚪ | ✅ | ✅ | ✅ | ✅ |
| `storage-requirement` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| `storage-cost` | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |

---

## Légende

| Symbole | Signification | Description |
|:-------:|---------------|-------------|
| ✅ | **Enabled** | Forcé via `enabledModules` + `overrides` |
| ❌ | **Disabled** | Bloqué via `disabledModules` |
| ⚪ | **Default** | Exécuté si `isApplicable(ctx)` retourne `true` |

---

## Résumé par Scénario

| Scénario | Marge | Modules forcés | Modules bloqués | Stratégie |
|----------|:-----:|----------------|-----------------|-----------|
| **ECO** | 20% | - | 7 modules (packing, cleaning, dismantling, reassembly, high-value) | Prix minimum, client fait tout |
| **STANDARD** | 30% | - | - | Équilibre prix/service |
| **CONFORT** | 35% | 5 (packing, dismantling, reassembly, high-value) | - | Emballage + démontage/remontage pro |
| **SÉCURITÉ+** | 32% | 8 (packing, cleaning, dismantling, reassembly, high-value, supplies, insurance) | - | Protection maximale avec emballage, nettoyage, fournitures et assurance incluse |
| **PREMIUM** | 40% | 7 (packing, cleaning, dismantling, reassembly, high-value) | - | Clé en main tout inclus |
| **FLEX** | 38% | 4 (overnight-stop, crew-flexibility, dismantling, reassembly) | - | Longue distance + démontage/remontage |

---

## Comportement des modules ⚪ Default

Un module marqué ⚪ ne s'exécute **que si** sa méthode `isApplicable(ctx)` retourne `true`.

### Exemples de conditions `isApplicable()`

| Module | Condition d'activation |
|--------|------------------------|
| `weekend` | Date est un samedi ou dimanche |
| `end-of-month` | Date dans les 5 derniers jours du mois |
| `no-elevator-pickup` | `pickupFloor > 0` ET pas d'ascenseur |
| `no-elevator-delivery` | `deliveryFloor > 0` ET pas d'ascenseur |
| `overnight-stop-cost` | `distanceKm > 1000` OU `forceOvernightStop === true` |
| `insurance-premium` | Client a opté pour l'assurance |
| `high-value-item-handling` | `piano`, `safe` ou `artwork` présent |
| `storage-cost` | `temporaryStorage === true` |
| `packing-cost` | `packing === true` |
| `cleaning-end-cost` | `cleaningEnd === true` |
| `dismantling-cost` | `dismantling === true` OU `bulkyFurniture === true` |
| `reassembly-cost` | `reassembly === true` OU `bulkyFurniture === true` |

---

## Implications par Scénario

### ECO (20% marge)
- **Modules bloqués (7)** :
  - `packing-requirement` - Vérification besoin emballage
  - `packing-cost` - Coût emballage professionnel
  - `cleaning-end-requirement` - Vérification besoin nettoyage
  - `cleaning-end-cost` - Coût nettoyage fin de bail
  - `dismantling-cost` - Coût démontage meubles
  - `reassembly-cost` - Coût remontage meubles
  - `high-value-item-handling` - Manipulation objets de valeur
- **Résultat** : Prix le plus bas, client fait tout lui-même
- **Modules actifs** : Uniquement les modules conditionnels (accès, distance, etc.)

### STANDARD (30% marge)
- **Aucune restriction** : Tous les modules s'exécutent selon `isApplicable()`
- **Résultat** : Équilibre prix/service, recommandé par défaut

### CONFORT (35% marge)
- **Modules forcés (5)** : `packing-*`, `dismantling-cost`, `reassembly-cost`, `high-value-item-handling`
- **Overrides** : `packing: true`, `dismantling: true`, `reassembly: true`, `bulkyFurniture: true`, `artwork: true`
- **Résultat** : Emballage et démontage/remontage professionnels inclus

### SÉCURITÉ+ (32% marge)
- **Modules forcés (8)** : `packing-cost`, `cleaning-end-cost`, `dismantling-cost`, `reassembly-cost`, `high-value-item-handling`, `supplies-cost`, `insurance-premium`
- **Overrides** : `packing: true`, `cleaningEnd: true`, `dismantling: true`, `reassembly: true`, `bulkyFurniture: true`, `artwork: true`, `declaredValueInsurance: true`, `declaredValue: 50000`, `crossSellingSuppliesTotal: 100`
- **Note** : Monte-meubles reste conditionnel selon contraintes techniques (étage ≥3 ou ≥5)
- **Résultat** : Monte-meubles + démontage/remontage professionnels, protection maximale

### PREMIUM (40% marge)
- **Modules forcés (7)** : Tous les services (packing, cleaning, dismantling, reassembly, high-value)
- **Overrides** : `packing: true`, `cleaningEnd: true`, `dismantling: true`, `reassembly: true`, `bulkyFurniture: true`, `artwork: true`, `surface: 80`
- **Résultat** : Service clé en main tout inclus

### FLEX (38% marge)
- **Modules forcés (4)** : `overnight-stop-cost`, `crew-flexibility`, `dismantling-cost`, `reassembly-cost`
- **Overrides** : `crewFlexibility: true`, `forceOvernightStop: true`, `dismantling: true`, `reassembly: true`
- **Résultat** : Adaptabilité maximale + démontage/remontage, longue distance avec arrêt nuit si >1000km

---

## Monte-Meubles : Chaîne de 4 Modules (Phase 5)

Le monte-meubles suit une chaîne de décision en 4 modules :

| Module | Priority | Déclenche si... | Action |
|--------|:--------:|-----------------|--------|
| `monte-meubles-recommendation` | 50 | Étage > 0 ET pas d'ascenseur adapté | Recommande monte-meubles (MEDIUM/HIGH/CRITICAL) |
| `monte-meubles-refusal-impact` | 52 | Recommandation + **refus client** | Réduit assurance -50%, limite responsabilité |
| `furniture-lift-cost` | 53 | Acceptation explicite OU (reco + étage > 3) | Facture 250€ (ou 500€ si double localité) |
| `manual-handling-risk-cost` | 55 | Refus malgré recommandation | Surcoût risque : 150€ + 50€/étage |

### Contrôle du Monte-Meubles par Scénario

| Scénario | Monte-meubles | Mécanisme |
|----------|---------------|-----------|
| **ECO/STANDARD** | Selon règles métier | Recommandation si nécessaire, client choisit |
| **CONFORT/PREMIUM/FLEX** | Selon règles métier | Recommandation si nécessaire, client choisit |
| **SÉCURITÉ+** | ⚪ Conditionnel | Monte-meubles conditionnel selon contraintes techniques (étage ≥3 ou ≥5), géré par règles métier |

### Tarification Monte-Meubles

```
Configuration (modules.config.ts):
├── BASE_LIFT_COST: 250€        # Coût unique installation + opérateur
├── DOUBLE_LIFT_SURCHARGE: 250€ # Si pickup ET delivery nécessitent monte-meubles
├── MANUAL_HANDLING_RISK:
│   ├── BASE_COST: 150€         # Coût de base si refus
│   └── COST_PER_FLOOR: 50€     # Par étage cumulé (pickup + delivery)
```

**Exemple de calcul surcoût refus :**
```
Pickup : Étage 3 sans ascenseur → 3 étages
Delivery : Étage 2 sans ascenseur → 2 étages
Total : 5 étages
Surcoût = 150€ + (5 × 50€) = 400€
Économie si accepté = 400€ - 350€ = 50€
```

---

## Cross-Selling : Pattern Requirement → Cost

Chaque service cross-selling suit le pattern **2 modules** :

```
RequirementModule (Type B) → Détecte besoin + propose cross-sell
     ↓
CostModule (Type C) → Facture si client accepte (flag = true)
```

### Services Cross-Selling Disponibles

| Service | Requirement | Cost | Condition d'activation | Tarification |
|---------|:-----------:|:----:|------------------------|--------------|
| **Emballage** | 82 | 85 | Volume > 40m³ OU fragile OU longue distance | volume × 5€/m³ |
| **Nettoyage** | 83 | 86 | Surface fournie (toujours disponible) | surface × 8€/m² |
| **Stockage** | 84 | 87 | `temporaryStorage` OU `storageDurationDays > 0` | volume × 30€/m³/mois |
| **Démontage** | - | 86.5 | `dismantling` OU `bulkyFurniture` | 50€ base + extras |
| **Remontage** | - | 86.6 | `reassembly` OU `bulkyFurniture` | 50€ base + extras |

### Contrôle du Cross-Selling par Scénario

| Scénario | Emballage | Nettoyage | Démontage/Remontage | Stockage |
|----------|:---------:|:---------:|:-------------------:|:--------:|
| **ECO** | ❌ Bloqué | ❌ Bloqué | ❌ Bloqué | ⚪ Default |
| **STANDARD** | ⚪ Default | ⚪ Default | ⚪ Default | ⚪ Default |
| **CONFORT** | ✅ Forcé | ⚪ Default | ✅ Forcé | ⚪ Default |
| **SÉCURITÉ+** | ✅ Forcé | ✅ Forcé | ✅ Forcé | ✅ Forcé |
| **PREMIUM** | ✅ Forcé | ✅ Forcé | ✅ Forcé | ⚪ Default |
| **FLEX** | ⚪ Default | ⚪ Default | ✅ Forcé | ⚪ Default |

### Tarification Cross-Selling

```
Configuration (modules.config.ts):
├── PACKING_COST_PER_M3: 5€/m³
├── CLEANING_COST_PER_M2: 8€/m²
├── STORAGE_COST_PER_M3_PER_MONTH: 30€/m³/mois
├── DISMANTLING:
│   ├── BASE_COST: 50€
│   ├── COST_PER_COMPLEX_ITEM: 25€
│   ├── COST_PER_BULKY_FURNITURE: 40€
│   └── PIANO_COST: 60€
└── REASSEMBLY:
    ├── BASE_COST: 50€
    ├── COST_PER_COMPLEX_ITEM: 25€
    ├── COST_PER_BULKY_FURNITURE: 40€
    └── PIANO_COST: 60€
```

---

## Mécanisme de Contrôle des Scénarios

Les scénarios contrôlent les modules via 3 mécanismes :

### 1. `disabledModules` - Bloquer (priorité absolue)

```typescript
disabledModules: ['packing-cost', 'cleaning-end-cost']
// → Ces modules ne s'exécuteront JAMAIS
```

### 2. `enabledModules` - Forcer l'activation

```typescript
enabledModules: ['furniture-lift-cost', 'dismantling-cost']
// → Ces modules s'exécuteront SI leurs conditions métier sont respectées
```

### 3. `overrides` - Modifier le contexte

```typescript
overrides: {
  packing: true,                          // Client "accepte" emballage
  cleaningEnd: true,                      // Client "accepte" nettoyage
  dismantling: true,                      // Client "accepte" démontage
  reassembly: true,                       // Client "accepte" remontage
  refuseLiftDespiteRecommendation: false  // Client "accepte" monte-meubles
}
```

### Ordre de priorité

```
disabledModules > enabledModules > règles métier (isApplicable)
```

---

## Voir aussi

- [SYNTHESE_FLUX_CALCUL.md](./SYNTHESE_FLUX_CALCUL.md) - Architecture complète du flux
- [06-multi-offers.md](./06-multi-offers.md) - Documentation multi-offres
- [QuoteScenario.ts](../multi-offers/QuoteScenario.ts) - Code source des scénarios
