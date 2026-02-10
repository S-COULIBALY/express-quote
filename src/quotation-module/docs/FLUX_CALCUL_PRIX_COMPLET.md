# Flux Complet de Calcul de Prix

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            FORMULAIRE CLIENT                                │
│   estimatedVolume (calculateur V3), distance, pickupFloor, deliveryFloor, constraints... │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         /api/quotation/calculate                            │
│                            BaseCostEngine                                   │
│   ═══════════════════════════════════════════════════════════════════════   │
│   PHASES 1-6 : Coûts opérationnels IDENTIQUES pour tous les scénarios       │
│   • Transport (carburant, péages)                                          │
│   • Contraintes d'accès (escaliers, navette, syndic, trafic IDF)           │
│   • Monte-meubles et pénalités d'étage                                     │
│   • Main-d'œuvre de base                                                   │
│   ═══════════════════════════════════════════════════════════════════════   │
│                            ↓ baseCost                                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       /api/quotation/multi-offers                           │
│                         MultiQuoteService                                   │
│   ═══════════════════════════════════════════════════════════════════════   │
│   PHASE 8 : Services cross-selling (différencie les scénarios)             │
│   • Emballage professionnel                                                │
│   • Démontage/Remontage meubles                                            │
│   • Nettoyage fin de chantier                                              │
│   • Stockage temporaire                                                    │
│   ═══════════════════════════════════════════════════════════════════════   │
│                                                                             │
│   FORMULE FINALE : (baseCost + options) × (1 + marge%)                     │
│                                                                             │
│   ┌─────────┬─────────┬─────────┬─────────┬─────────┬────────────┐         │
│   │   ECO   │STANDARD │  FLEX   │ CONFORT │ PREMIUM │SECURITY+   │         │
│   │ marge 5%│marge 15%│marge 20%│marge 25%│marge 35%│ marge 45%  │         │
│   └─────────┴─────────┴─────────┴─────────┴─────────┴────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## BASECOSTENGINE - Modules par Phase

### PHASE 1 - Normalisation (Priorités 10-19)

| Module               | ID                      | Priorité | Description                    | Formule             | Exemple                        |
| -------------------- | ----------------------- | -------- | ------------------------------ | ------------------- | ------------------------------ |
| InputSanitization    | `input-sanitization`    | 10       | Nettoie et valide les entrées  | N/A (sanitization)  | Trim strings, validation types |
| DateValidation       | `date-validation`       | 11       | Valide la date de déménagement | N/A (validation)    | Date future, format ISO        |
| AddressNormalization | `address-normalization` | 12       | Normalise les adresses         | N/A (normalization) | Format postal standard         |

---

### PHASE 2 - Volume (Priorités 20-29)

| Module           | ID                  | Priorité | Description                  | Formule                                    | Exemple                         |
| ---------------- | ------------------- | -------- | ---------------------------- | ------------------------------------------ | ------------------------------- |
| VolumeEstimation | `volume-estimation` | 20       | Utilise le volume fourni (calculateur V3) | `estimatedVolume` + ajustement confiance | 35 m³ × 1.1 = **38.5 m³** (MEDIUM) |

**Source du volume :** Le formulaire collecte le volume via le **calculateur V3** côté client (pièces, objets, etc.). Le module n’utilise plus surface/type de logement.

**Marges de confiance (FORM - Volume calculateur V3) :**
| Confiance | Marge |
|-----------|-------|
| LOW | +20% (×1.2) |
| MEDIUM | +10% (×1.1) |
| HIGH | +5% (×1.05) |

---

### PHASE 3 - Distance & Transport (Priorités 30-39)

| Module                | ID                        | Priorité | Dépendances               | Description                      | Formule                                          | Exemple                                 |
| --------------------- | ------------------------- | -------- | ------------------------- | -------------------------------- | ------------------------------------------------ | --------------------------------------- |
| DistanceCalculation   | `distance-calculation`    | 30       | -                         | Récupère la distance Google Maps | `ctx.distance` ou fallback 20 km                 | 150 km (API)                            |
| LongDistanceThreshold | `long-distance-threshold` | 31       | `distance-calculation`    | Détecte si distance > 50 km      | `distance > 50 km`                               | 150 > 50 → **true**                     |
| FuelCost              | `fuel-cost`               | 33       | `distance-calculation`    | Calcule le coût carburant        | `(distance / 100) × consumption × pricePerLiter` | (150 / 100) × 12 L × 1.70€ = **30.60€** |
| TollCost              | `toll-cost`               | 35       | `long-distance-threshold` | Calcule les péages (si > 50 km)  | `distance × highwayPercentage × costPerKm`       | 150 × 0.70 × 0.08€ = **8.40€**          |

**Configuration carburant :**

- Prix/litre : **1.70€**
- Consommation : **12 L/100km**

**Configuration péages :**

- Coût/km autoroute : **0.08€**
- % trajet autoroute : **70%**

---

### PHASE 4 - Contraintes d'Accès (Priorités 40-49)

| Module                   | ID                           | Priorité | Dépendances | Description                                     | Formule                                  | Exemple                             |
| ------------------------ | ---------------------------- | -------- | ----------- | ----------------------------------------------- | ---------------------------------------- | ----------------------------------- |
| NoElevatorPickup         | `no-elevator-pickup`         | 41       | -           | Pénalité étage départ sans ascenseur            | Géré par FloorPenaltyCostModule          | -                                   |
| NoElevatorDelivery       | `no-elevator-delivery`       | 42       | -           | Pénalité étage arrivée sans ascenseur           | Géré par FloorPenaltyCostModule          | -                                   |
| NavetteRequired          | `navette-required`           | 45       | -           | Navette si rue étroite/stationnement impossible | `baseCost + (distance × distanceFactor)` | 20€ + (150 × 0.50€) = **95€**       |
| TrafficIdf               | `traffic-idf`                | 46       | -           | Surcoût trafic IDF (heures pointe/vendredi)     | `transportCosts × surchargePercentage`   | 39€ × 2% = **0.78€** (vendredi 15h) |
| TimeSlotSyndic           | `time-slot-syndic`           | 47       | -           | Surcoût créneau syndic copropriété              | `baseSurcharge × multiplier`             | 80€ × 1.5 = **120€** (2 adresses)   |
| AccessConstraintsPenalty | `access-constraints-penalty` | 48       | -           | Pénalités % contraintes d'accès                 | `baseCost × totalPercent / 100`          | 500€ × 8.5% = **42.50€**            |

**Configuration navette :**

- Coût de base : **20€**
- Facteur distance : **0.50€/km**

**Configuration syndic :**

- Surcoût de base : **80€**
- Multiplicateur si 2 adresses : **×1.5**

**Configuration trafic IDF :**

- Heures de pointe (7h-9h, 17h-19h) : **+1%**
- Vendredi après-midi (14h-19h) : **+2%** (prioritaire)

**Contraintes d'accès (modal-data.ts) :**
| ID | Nom | Impact |
|----|-----|--------|
| constraint-2 | Circulation complexe | +6.5% |
| constraint-4 | Zone piétonne | +8.5% |
| constraint-7 | Ascenseur petit | +7.5% |
| constraint-8 | Escalier difficile | +8.5% |
| constraint-9 | Couloirs étroits | +6.5% |
| constraint-10 | Multi-niveaux | +9.5% |
| constraint-12 | Passage indirect | +8.2% |
| constraint-14 | Contrôle accès | +6.0% |
| constraint-16 | Sol fragile | +5.5% |

_Note : Si une contrainte s'applique aux 2 adresses, le pourcentage est multiplié par 1.5_

---

### PHASE 5 - Monte-meubles (Priorités 50-59)

| Module                     | ID                             | Priorité | Dépendances                    | Description                                 | Formule                      | Exemple                                 |
| -------------------------- | ------------------------------ | -------- | ------------------------------ | ------------------------------------------- | ---------------------------- | --------------------------------------- |
| MonteMeublesRecommendation | `monte-meubles-recommendation` | 52       | -                              | Recommande le monte-meubles selon étage     | N/A (recommendation)         | Étage ≥ 3 → HIGH, ≥ 5 → CRITICAL        |
| FurnitureLiftCost          | `furniture-lift-cost`          | 53       | -                              | Coût du monte-meubles                       | `baseCost + doubleSurcharge` | 250€ + 250€ = **500€** (2 adresses)     |
| FloorPenaltyCost           | `floor-penalty-cost`           | 54       | `monte-meubles-recommendation` | Pénalités étage (annulées si monte-meubles) | `étage × penaltyPerFloor`    | 4 × 65€ = **260€** (sans monte-meubles) |

**Configuration monte-meubles :**

- Coût de base : **250€** par adresse
- Surcoût double installation : **+250€**

**Configuration pénalités étage :**

- Coût par étage sans ascenseur : **65€**
- **IMPORTANT** : Pénalité **ANNULÉE** si monte-meubles accepté

---

### PHASE 6 - Main d'œuvre (Priorités 60-69)

| Module             | ID                     | Priorité | Dépendances                                | Description                      | Formule                                | Exemple                             |
| ------------------ | ---------------------- | -------- | ------------------------------------------ | -------------------------------- | -------------------------------------- | ----------------------------------- |
| VehicleSelection   | `vehicle-selection`    | 60       | `volume-estimation`                        | Sélection véhicule selon volume  | Seuils : ≤12m³, ≤20m³, ≤30m³           | 33 m³ → **CAMION_30M3 = 350€**     |
| WorkersCalculation | `workers-calculation`  | 61       | `volume-estimation`                        | Calcule le nombre de déménageurs | `round(volume / volumePerWorker)`      | round(33 / 5) = **6 déménageurs** |
| LaborBase          | `labor-base`           | 62       | `volume-estimation`, `workers-calculation` | Coût de base main-d'œuvre        | `tauxHoraire × heures × workers`       | 30€ × 7h × 6 = **1 260€**           |
| LaborAccessPenalty | `labor-access-penalty` | 66       | `labor-base`                               | Surcoût accès difficile          | `(étage × €/étage) + (distance × €/m)` | (5 × 25€) + (40 × 2€) = **205€**    |

**Configuration véhicules :**
| Type | Capacité | Coût |
|------|----------|------|
| CAMION_12M3 | 12 m³ | 80€ |
| CAMION_20M3 | 20 m³ | 250€ |
| CAMION_30M3 | 30 m³ | 350€ |

**Configuration main-d'œuvre :**

- Volume par déménageur : **5 m³**
- Taux horaire : **30€/h**
- Heures par jour : **7h**
- Maximum déménageurs : **6**

**Configuration pénalités accès :**

- Par étage (> seuil 3, sans ascenseur, sans monte-meubles) : **25€/étage**
- Par mètre de portage (> seuil 30m) : **2€/m**

---

## MULTIQUOTESERVICE - Modules Cross-Selling (Phase 8)

### Services additionnels

| Module          | ID                  | Priorité | Condition                       | Formule                                        | Exemple                     |
| --------------- | ------------------- | -------- | ------------------------------- | ---------------------------------------------- | --------------------------- |
| PackingCost     | `packing-cost`      | 85       | `ctx.packing === true`          | `volume × costPerM3`                           | 33 m³ × 5€ = **148.50€**   |
| DismantlingCost | `dismantling-cost`  | 86.5     | `ctx.dismantling === true`      | `baseCost + bulkyItems + complexItems + piano` | 50€ + 40€ + 50€ = **140€**  |
| ReassemblyCost  | `reassembly-cost`   | 86.6     | `ctx.reassembly === true`       | `baseCost + bulkyItems + complexItems + piano` | 50€ + 40€ + 50€ = **140€**  |
| CleaningEndCost | `cleaning-end-cost` | 86       | `ctx.cleaningEnd === true`      | Surface déduite du volume (volume/2.5) × costPerM2 | 80 m² (200 m³) × 8€ = **640€** |
| StorageCost     | `storage-cost`      | 87       | `ctx.temporaryStorage === true` | `volume × costPerM3 × months`                  | 33 m³ × 30€ × 1 = **891€** |

**Configuration cross-selling :**
| Service | Tarif |
|---------|-------|
| Emballage | 5€/m³ |
| Nettoyage | 8€/m² |
| Stockage | 30€/m³/mois |
| Démontage base | 50€ |
| Remontage base | 50€ |
| Meuble encombrant | +40€ |
| Meuble complexe | +25€ |
| Piano | +60€ |

---

### Scénarios et marges

| Scénario          | Marge | Services inclus                             | Services désactivés        |
| ----------------- | ----- | ------------------------------------------- | -------------------------- |
| **ECO**           | 5%    | Aucun                                       | Tous (via disabledModules) |
| **STANDARD**      | 15%   | Sélection client                            | -                          |
| **FLEX**          | 20%   | Sélection client + démontage/remontage      | -                          |
| **CONFORT**       | 25%   | Emballage + démontage/remontage             | -                          |
| **PREMIUM**       | 35%   | Emballage + démontage/remontage + nettoyage | -                          |
| **SECURITY_PLUS** | 45%   | Tous services + assurance premium           | -                          |

---

## Formule de Calcul Finale

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   PRIX FINAL = (baseCost + additionalCosts) × (1 + marginRate)    │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

Où :
- baseCost = Σ(coûts phases 1-6) → Identique pour tous les scénarios
- additionalCosts = Σ(coûts phase 8) → Varie selon le scénario
- marginRate = 0.05 à 0.45 selon le scénario
```

---

## Exemple Complet de Calcul

**Données d'entrée :**

- Volume : 30 m³ (calculateur V3)
- Distance : 150 km
- Étage départ : 4 (sans ascenseur, monte-meubles refusé)
- Étage arrivée : 2 (avec ascenseur)
- Créneau syndic : 2 adresses
- Date : Vendredi 15h

### Calcul baseCost (Phases 1-6)

| Phase | Module                | Calcul                | Montant       |
| ----- | --------------------- | --------------------- | ------------- |
| 2     | Volume                | 30 m³ (fourni) × 1.1  | 33 m³         |
| 3     | Carburant             | (150/100) × 12 × 1.70 | 30.60€        |
| 3     | Péages                | 150 × 0.70 × 0.08     | 8.40€         |
| 4     | Trafic IDF            | 39€ × 2%              | 0.78€         |
| 4     | Créneau syndic        | 80 × 1.5              | 120.00€       |
| 5     | Pénalité étage départ | 4 × 65                | 260.00€       |
| 6     | Véhicule              | CAMION_30M3           | 350.00€       |
| 6     | Main-d'œuvre          | 30 × 7 × 6            | 1 260.00€     |
| 6     | Pénalité accès        | 4 × 25                | 100.00€       |
|       | **TOTAL baseCost**    |                       | **2 129.78€** |

### Calcul par scénario

| Scénario  | Options                                 | Sous-total | Marge | Prix Final    |
| --------- | --------------------------------------- | ---------- | ----- | ------------- |
| ECO       | 0€                                      | 2 129.78€  | ×1.05 | **2 236.27€** |
| STANDARD  | 0€                                      | 2 129.78€  | ×1.15 | **2 449.25€** |
| FLEX      | 280€ (démontage+remontage)              | 2 409.78€  | ×1.20 | **2 891.74€** |
| CONFORT   | 428.50€ (emballage+démontage+remontage) | 2 558.28€  | ×1.25 | **3 197.85€** |
| PREMIUM   | 908.50€ (tous services)                 | 3 038.28€  | ×1.35 | **4 101.68€** |
| SECURITY+ | 908.50€ + assurance                     | 3 038.28€  | ×1.45 | **4 405.51€** |

---

## Configuration Centralisée

Toutes les valeurs sont définies dans `src/quotation-module/config/modules.config.ts` :

```typescript
MODULES_CONFIG = {
  distance: { LONG_DISTANCE_THRESHOLD_KM: 50, ... },
  fuel: { PRICE_PER_LITER: 1.7, VEHICLE_CONSUMPTION_L_PER_100KM: 12, ... },
  tolls: { COST_PER_KM: 0.08, HIGHWAY_PERCENTAGE: 0.7 },
  vehicle: { VEHICLE_COSTS: { CAMION_12M3: 80, CAMION_20M3: 250, CAMION_30M3: 350 } },
  labor: { BASE_HOURLY_RATE: 30, BASE_WORK_HOURS: 7, VOLUME_PER_WORKER: 5 },
  furnitureLift: { BASE_LIFT_COST: 250, FLOOR_PENALTY_PER_FLOOR: 65 },
  logistics: { NAVETTE: { BASE_COST: 20, DISTANCE_FACTOR: 0.5 }, SYNDIC_SURCHARGE: 80 },
  crossSelling: { PACKING_COST_PER_M3: 5, CLEANING_COST_PER_M2: 8, STORAGE_COST_PER_M3_PER_MONTH: 30 },
}
```

---

## Source Unique de Vérité - Contraintes d'accès

Les 16 contraintes d'accès sont définies dans `src/components/form-generator/components/modal-data.ts` :

```typescript
ACCESS_CONSTRAINTS = [
  { id: "constraint-1", name: "Rue étroite", value: 0, impactType: "navette" },
  {
    id: "constraint-2",
    name: "Circulation complexe",
    value: 6.5,
    impactType: "percentage",
  },
  {
    id: "constraint-3",
    name: "Stationnement impossible",
    value: 0,
    impactType: "navette",
  },
  {
    id: "constraint-4",
    name: "Zone piétonne",
    value: 8.5,
    impactType: "percentage",
  },
  // ... etc.
];
```

Les contraintes avec `impactType: 'navette'` déclenchent `NavetteRequiredModule`.
Les contraintes avec `impactType: 'percentage'` sont gérées par `AccessConstraintsPenaltyModule`.
