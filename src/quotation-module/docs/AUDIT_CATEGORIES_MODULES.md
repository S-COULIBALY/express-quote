# Audit des Catégories de Coûts - Modules de Cotation

## Contexte

Ce document présente l'audit complet des catégories utilisées dans les modules de cotation, les problèmes conceptuels identifiés, et les solutions proposées.

**Date de l'audit** : Décembre 2024
**Scope** : 38 modules dans `src/quotation-module/modules/`

---

## 1. Situation Actuelle : 7 Catégories

### Tableau des Catégories Existantes

| Catégorie | Nb Modules | Modules | Usage actuel |
|-----------|:----------:|---------|--------------|
| **TRANSPORT** | 5 | `fuel-cost`, `high-mileage-fuel-adjustment`, `toll-cost`, `overnight-stop-cost`, `traffic-idf` | Coûts liés au transport |
| **LABOR** | 3 | `labor-base`, `labor-access-penalty`, `crew-flexibility` | Main d'œuvre |
| **VEHICLE** | 2 | `vehicle-selection`, `furniture-lift-cost` | Véhicules et équipements |
| **ADMINISTRATIVE** | 5 | `packing-cost`, `storage-cost`, `cleaning-end-cost`, `dismantling-cost`, `reassembly-cost` | Services optionnels (fourre-tout) |
| **RISK** | 2 | `manual-handling-risk-cost`, `insurance-premium` | Risques et assurances |
| **INSURANCE** | 1 | `insurance-premium` | Assurance valeur déclarée |
| **TEMPORAL** | 2 | `weekend`, `end-of-month` | Majorations calendaires |

**Total : 7 catégories pour 20 modules générant des coûts**

---

## 2. Problèmes Conceptuels Identifiés

### 2.1. CRITIQUE : Double-Comptage Carburant

**Modules concernés** :
- `fuel-cost` (priority 33)
- `high-mileage-fuel-adjustment` (priority 34)

**Description du problème** :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXEMPLE : Trajet de 300 km (seuil longue distance = 50 km)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. FuelCostModule (priority 33) :                                           │
│    → Calcule le carburant sur 300 km COMPLETS                               │
│    → (300 / 100) × 12 L/100km × 1.70€/L = 61.20€                            │
│                                                                             │
│ 2. HighMileageFuelAdjustmentModule (priority 34) :                          │
│    → Distance excédentaire = 300 - 50 = 250 km                              │
│    → Tranche 1 : 200 km × 0.15€/km = 30€                                    │
│    → Tranche 2 : 50 km × 0.20€/km = 10€                                     │
│    → Total ajustement = 40€                                                 │
│                                                                             │
│ TOTAL FACTURÉ = 61.20€ + 40€ = 101.20€                                      │
│                                                                             │
│ ⚠️ PROBLÈME : Les 250 km excédentaires sont comptés DEUX FOIS :             │
│    - Une fois dans le calcul carburant complet (61.20€)                     │
│    - Une fois dans l'ajustement (40€)                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Analyse** :

Le module `high-mileage-fuel-adjustment` ajoute un coût avec le label "Ajustement carburant longue distance", suggérant qu'il s'agit de carburant supplémentaire. Or :

1. Le `FuelCostModule` calcule **déjà** le carburant pour la distance totale
2. L'ajustement de 0.15-0.20€/km n'est **pas** un coût carburant réel
3. C'est en réalité un **forfait d'exploitation** couvrant :
   - Usure accélérée du véhicule sur longue distance
   - Indisponibilité prolongée du véhicule
   - Frais annexes (pauses conducteur, etc.)

**Le nom du module est trompeur** : il ne s'agit pas d'un "ajustement carburant" mais d'un "forfait kilométrique longue distance".

---

### 2.2. HAUTE PRIORITÉ : Catégorie Mal Assignée - Monte-Meubles

**Module concerné** : `furniture-lift-cost`

**Problème** :
```typescript
// Code actuel dans FurnitureLiftCostModule.ts
{
  moduleId: this.id,
  category: 'VEHICLE',  // ❌ Incorrect
  label: 'Location monte-meubles',
  amount: liftCost,
}
```

**Analyse** :
- Le monte-meubles n'est **pas** un véhicule de transport
- C'est un **équipement de manutention** spécialisé
- Regrouper avec `vehicle-selection` (location camion) crée une confusion analytique

**Impact** :
- Impossible de distinguer coûts véhicule vs équipement dans les rapports
- Analytics faussées sur le poste "VEHICLE"

---

### 2.3. HAUTE PRIORITÉ : Logique Ambiguë - Risque Manutention

**Module concerné** : `manual-handling-risk-cost`

**Problème** :
```typescript
// Le module ajoute un "surcoût risque" si monte-meubles refusé
{
  category: 'RISK',
  label: `Surcoût risque manutention manuelle (refus monte-meubles) - Vous auriez économisé ${savings}€`,
  amount: riskCost,  // ~500€
}
```

**Question conceptuelle non résolue** :
- Est-ce une **pénalité** pour non-acceptation (aspect punitif) ?
- Ou une **estimation du coût réel** de manutention manuelle (aspect opérationnel) ?

Le label actuel mélange les deux concepts ("surcoût" + "vous auriez économisé"), ce qui est confus pour le client.

---

### 2.4. HAUTE PRIORITÉ : Cumul Non Contrôlé - Surcharges Temporelles

**Modules concernés** :
- `weekend` (priority 81) : +10% si samedi/dimanche
- `end-of-month` (priority 80) : +5% si jour >= 25

**Problème** :
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXEMPLE : Samedi 28 du mois                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Prix de base : 1000€                                                        │
│                                                                             │
│ Ordre d'exécution actuel :                                                  │
│ 1. EndOfMonthModule (priority 80) : 1000€ × 1.05 = 1050€                    │
│ 2. WeekendModule (priority 81) : 1050€ × 1.10 = 1155€                       │
│                                                                             │
│ Multiplicateur réel : 1.05 × 1.10 = 1.155 (15.5%)                           │
│ vs. Multiplicateur attendu : 1.15 (15%) si additif                          │
│                                                                             │
│ ⚠️ Effet de composition non documenté ni contrôlé                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Risque futur** : Si on ajoute d'autres modules temporels (vacances scolaires, jours fériés), le cumul devient imprévisible.

---

### 2.5. MOYENNE PRIORITÉ : Catégorie Ambiguë - Arrêt Nuit

**Module concerné** : `overnight-stop-cost`

**Problème** :
```typescript
// Décomposition du coût
const hotelCost = workersCount * 120€;    // Hébergement personnel
const parkingCost = 50€;                  // Infrastructure
const mealCost = workersCount * 30€;      // Repas personnel

// Catégorie actuelle
category: 'TRANSPORT'  // ❓ Questionnable
```

**Analyse** :
- `TRANSPORT` suggère des coûts de déplacement (carburant, péages)
- Or ce module facture principalement des **frais d'hébergement** (hôtel, repas)
- Une catégorie `LOGISTICS` serait plus appropriée

---

### 2.6. MOYENNE PRIORITÉ : Noms de Modules Trompeurs

**Modules concernés** :
- `no-elevator-pickup`
- `no-elevator-delivery`

**Problème** :
- Le nom suggère qu'ils ajoutent un coût ("NoElevator" = surcoût sans ascenseur)
- En réalité, ils **n'ajoutent aucun coût** : pas d'entrée dans `computed.costs`
- Ils ajoutent uniquement des `requirements` et `riskContributions`

**Ce sont des modules DÉTECTEURS, pas des modules de COÛT**.

---

### 2.7. MOYENNE PRIORITÉ : Dépendances Logiques Manquantes

**Modules concernés** :
- `dismantling-cost` (priority 86.5)
- `reassembly-cost` (priority 86.6)

**Problème** :
```typescript
// Les deux modules déclarent zéro dépendances
readonly dependencies = [];
```

**Question métier** :
- Un client peut-il demander le remontage **sans** le démontage ?
- Si les deux sont demandés, devrait-on appliquer un **forfait groupé** ?

**Situation actuelle** : Les deux modules sont totalement indépendants, chacun facture son coût complet.

---

### 2.8. FAIBLE PRIORITÉ : Catégorie Fourre-Tout ADMINISTRATIVE

**Modules concernés** (5) :
- `packing-cost` - Emballage professionnel
- `storage-cost` - Stockage temporaire
- `cleaning-end-cost` - Nettoyage fin de bail
- `dismantling-cost` - Démontage meubles
- `reassembly-cost` - Remontage meubles

**Problème** :
- `ADMINISTRATIVE` ne reflète pas la nature de ces services
- Ce sont tous des **services optionnels** proposés au client
- Une catégorie `SERVICE` serait plus explicite

---

## 3. Solutions Proposées

### 3.1. Nouvelle Structure des Catégories

| Catégorie | Modules | Rôle |
|-----------|---------|------|
| **TRANSPORT** | `fuel-cost`, `toll-cost`, `traffic-idf` | Coûts de déplacement réels |
| **LABOR** | `labor-base`, `labor-access-penalty`, `crew-flexibility` | Main d'œuvre |
| **VEHICLE** | `vehicle-selection` | Location véhicule uniquement |
| **EQUIPMENT** | `furniture-lift-cost` | Équipements spéciaux (monte-meubles) |
| **LOGISTICS** | `overnight-stop-cost` | Hébergement, arrêts, logistique |
| **SERVICE** | `packing-cost`, `cleaning-end-cost`, `storage-cost`, `dismantling-cost`, `reassembly-cost` | Services optionnels client |
| **RISK** | `manual-handling-risk-cost` | Surcoûts liés aux risques |
| **INSURANCE** | `insurance-premium` | Assurances |
| **TEMPORAL** | `weekend`, `end-of-month` | Majorations calendaires |
| **SURCHARGE** | `long-distance-surcharge` (ex `high-mileage-fuel-adjustment`) | Forfaits kilométriques/exploitation |

**Total : 10 catégories** (vs 7 actuellement)

---

### 3.2. Correction du Double-Comptage Carburant

**Renommer et recatégoriser `HighMileageFuelAdjustmentModule`** :

| Attribut | Avant | Après |
|----------|-------|-------|
| Fichier | `HighMileageFuelAdjustmentModule.ts` | `LongDistanceSurchargeModule.ts` |
| `id` | `high-mileage-fuel-adjustment` | `long-distance-surcharge` |
| `category` | `TRANSPORT` | `SURCHARGE` |
| `label` | "Ajustement carburant longue distance" | "Forfait kilométrique longue distance" |
| `description` | "Ajustement carburant pour longue distance..." | "Forfait exploitation longue distance (usure, indisponibilité, frais annexes)" |

**Exemple après correction** :
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ EXEMPLE CORRIGÉ : Trajet de 300 km                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ 1. fuel-cost (TRANSPORT) :                                                  │
│    → Carburant réel : 61.20€                                                │
│    → Label : "Coût carburant"                                               │
│                                                                             │
│ 2. long-distance-surcharge (SURCHARGE) :                                    │
│    → Forfait exploitation : 40€                                             │
│    → Label : "Forfait kilométrique longue distance"                         │
│    → Couvre : usure véhicule, indisponibilité, frais annexes                │
│                                                                             │
│ TOTAL = 101.20€ (même montant, mais sémantique correcte)                    │
│                                                                             │
│ ✅ Le client comprend maintenant qu'il paie :                               │
│    - Le carburant réel (61.20€)                                             │
│    - Un forfait d'exploitation longue distance (40€)                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3.3. Correction Monte-Meubles

**Changer la catégorie de `FurnitureLiftCostModule`** :

```typescript
// Avant
category: 'VEHICLE'

// Après
category: 'EQUIPMENT'
```

---

### 3.4. Correction Services Optionnels

**Changer la catégorie ADMINISTRATIVE → SERVICE pour** :
- `PackingCostModule`
- `CleaningEndCostModule`
- `StorageCostModule`
- `DismantlingCostModule`
- `ReassemblyCostModule`

```typescript
// Avant
category: 'ADMINISTRATIVE'

// Après
category: 'SERVICE'
```

---

### 3.5. Correction Arrêt Nuit

**Changer la catégorie de `OvernightStopCostModule`** :

```typescript
// Avant
category: 'TRANSPORT'

// Après
category: 'LOGISTICS'
```

---

## 4. Plan d'Implémentation

### Phase 1 : Corrections Critiques
1. ✅ Renommer `HighMileageFuelAdjustmentModule` → `LongDistanceSurchargeModule`
2. ✅ Changer catégorie `TRANSPORT` → `SURCHARGE`
3. ✅ Mettre à jour label et description

### Phase 2 : Corrections de Catégories
4. ✅ `FurnitureLiftCostModule` : `VEHICLE` → `EQUIPMENT`
5. ✅ `OvernightStopCostModule` : `TRANSPORT` → `LOGISTICS`
6. ✅ Services optionnels : `ADMINISTRATIVE` → `SERVICE`

### Phase 3 : Documentation
7. ✅ Mettre à jour `TABLEAU_MODULES_PAR_SCENARIO.md`
8. ✅ Mettre à jour les commentaires dans les modules

### Phase 4 : Validation
9. ✅ Ajouter un type TypeScript pour les catégories valides (`CostCategory` dans ComputedContext.ts)
10. ⬜ Ajouter des tests unitaires vérifiant les catégories

---

## 5. Impact sur les Rapports

### Avant (7 catégories)

```
TRANSPORT     : Carburant + Ajustement carburant + Péages + Arrêt nuit + Trafic IDF
VEHICLE       : Véhicule + Monte-meubles
ADMINISTRATIVE: Emballage + Stockage + Nettoyage + Démontage + Remontage
LABOR         : Main d'œuvre + Pénalité accès + Flexibilité
RISK          : Risque manutention
INSURANCE     : Assurance
TEMPORAL      : Week-end + Fin de mois
```

### Après (10 catégories)

```
TRANSPORT     : Carburant + Péages + Trafic IDF
SURCHARGE     : Forfait kilométrique longue distance
VEHICLE       : Véhicule uniquement
EQUIPMENT     : Monte-meubles
LOGISTICS     : Arrêt nuit
SERVICE       : Emballage + Stockage + Nettoyage + Démontage + Remontage
LABOR         : Main d'œuvre + Pénalité accès + Flexibilité
RISK          : Risque manutention
INSURANCE     : Assurance
TEMPORAL      : Week-end + Fin de mois
```

---

## 6. Récapitulatif des Changements

| Module | Catégorie Avant | Catégorie Après | Autre changement |
|--------|-----------------|-----------------|------------------|
| `high-mileage-fuel-adjustment` | TRANSPORT | **SURCHARGE** | Renommer → `long-distance-surcharge` |
| `furniture-lift-cost` | VEHICLE | **EQUIPMENT** | - |
| `overnight-stop-cost` | TRANSPORT | **LOGISTICS** | - |
| `packing-cost` | ADMINISTRATIVE | **SERVICE** | - |
| `cleaning-end-cost` | ADMINISTRATIVE | **SERVICE** | - |
| `storage-cost` | ADMINISTRATIVE | **SERVICE** | - |
| `dismantling-cost` | ADMINISTRATIVE | **SERVICE** | - |
| `reassembly-cost` | ADMINISTRATIVE | **SERVICE** | - |

**Total : 8 modules à modifier**

---

## 7. Voir Aussi

- [TABLEAU_MODULES_PAR_SCENARIO.md](./TABLEAU_MODULES_PAR_SCENARIO.md) - Tableau des modules par scénario
- [SYNTHESE_FLUX_CALCUL.md](./SYNTHESE_FLUX_CALCUL.md) - Architecture du flux de calcul
- [QuoteScenario.ts](../multi-offers/QuoteScenario.ts) - Définition des scénarios
