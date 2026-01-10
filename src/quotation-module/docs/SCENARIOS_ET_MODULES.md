# 📊 Scénarios Multi-Offres et Modules de Pricing

> Documentation complète du système de pricing modulaire et des 6 scénarios de devis.

---

## 🔄 Architecture du flux

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1: /api/quotation/calculate                                           │
│ → BaseCostEngine exécute les modules de base (PHASES 1-6)                   │
│ → Retourne: baseCost (coût opérationnel pur)                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2: /api/quotation/multi-offers                                        │
│ → MultiQuoteService génère 6 variantes                                      │
│ → Chaque scénario a ses propres enabledModules/disabledModules/overrides    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│ FORMULE PRIX FINAL                                                          │
│ finalPrice = (baseCost + additionalCosts) × (1 + marginRate)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Modules de base (TOUJOURS exécutés - inclus dans baseCost)

| Phase | Module | Priorité | Description |
|-------|--------|----------|-------------|
| 1 | `input-sanitization` | 10 | Nettoyage des entrées |
| 1 | `date-validation` | 11 | Validation des dates |
| 1 | `address-normalization` | 12 | Normalisation des adresses |
| 2 | `volume-estimation` | 20 | Estimation du volume |
| 2 | `volume-uncertainty-risk` | 24 | Risque d'incertitude volume |
| 3 | `distance-calculation` | 30 | Calcul de la distance |
| 3 | `long-distance-threshold` | 31 | Seuil longue distance |
| 3 | `fuel-cost` | 33 | Coût carburant |
| 3 | `long-distance-surcharge` | 34 | Forfait exploitation longue distance |
| 3 | `toll-cost` | 35 | Péages |
| 3 | `overnight-stop-cost` | 36 | Arrêt nuit (si distance > seuil) |
| 4 | `no-elevator-pickup` | 40 | Pénalité sans ascenseur (départ) |
| 4 | `no-elevator-delivery` | 41 | Pénalité sans ascenseur (arrivée) |
| 4 | `navette-required` | 45 | Navette si accès difficile |
| 4 | `traffic-idf` | 46 | Surcoût trafic Île-de-France |
| 4 | `time-slot-syndic` | 47 | Contraintes horaires syndic |
| 5 | `monte-meubles-recommendation` | 50 | Recommandation monte-meubles |
| 5 | `monte-meubles-refusal-impact` | 52 | Impact refus monte-meubles |
| 5 | `furniture-lift-cost` | 53 | Coût monte-meubles |
| 5 | `manual-handling-risk-cost` | 55 | Risque manutention manuelle |
| 6 | `vehicle-selection` | 60 | Sélection véhicule |
| 6 | `workers-calculation` | 61 | Calcul équipe |
| 6 | `labor-base` | 62 | Coût main-d'œuvre de base |
| 6 | `labor-access-penalty` | 66 | Pénalité accès difficile |
| 6 | `crew-flexibility` | 67 | Garantie flexibilité équipe |
| 6 | `loading-time-estimation` | 68 | Estimation temps chargement |

---

## 🎯 Détail des 6 scénarios

### 1️⃣ ECO - L'essentiel à petit prix

| Paramètre | Valeur |
|-----------|--------|
| **ID** | `ECO` |
| **Marge** | 20% |
| **Tags** | `LOW_PRICE`, `ENTRY` |

**Modules désactivés (`disabledModules`) :**
```typescript
[
  'packing-requirement',
  'packing-cost',
  'cleaning-end-requirement',
  'cleaning-end-cost',
  'dismantling-cost',
  'reassembly-cost',
  'high-value-item-handling',
]
```

**Overrides :** Aucun

**Services EXCLUS :**
- ❌ Emballage professionnel
- ❌ Nettoyage fin de bail
- ❌ Démontage/remontage
- ❌ Manutention objets de valeur

**Ce que le client doit faire :**
- Emballer TOUTES ses affaires lui-même
- Fournir ses propres cartons et protections
- Démonter TOUS les meubles lui-même
- Vider totalement le logement avant l'arrivée des déménageurs

**Ce qu'apporte le déménageur :**
- ✅ Transport sécurisé
- ✅ Main-d'œuvre pour chargement/déchargement
- ✅ Arrimage basique des biens
- ✅ Prix le plus bas du marché

**Durée typique :** 4-6 heures (dépend du volume)

**Idéal pour :** Petits budgets, étudiants, personnes qui ont le temps

---

### 2️⃣ STANDARD - Meilleur rapport qualité-prix

| Paramètre | Valeur |
|-----------|--------|
| **ID** | `STANDARD` |
| **Marge** | 30% |
| **Tags** | `RECOMMENDED`, `BALANCED` |

**Modules désactivés :** Aucun

**Modules activés :** Aucun (tous les modules applicables s'exécutent)

**Overrides :** Aucun

**Services inclus :** Selon les choix du formulaire et du catalogue

**Ce que le client doit faire :**
- Emballer les objets fragiles et personnels
- Vider armoires et commodes
- Indiquer les meubles à démonter

**Ce qu'apporte le déménageur :**
- ✅ Protection renforcée des meubles
- ✅ Démontage/remontage simple si nécessaire
- ✅ Organisation fluide du jour J
- ✅ Équipe expérimentée

**Durée typique :** 5-7 heures (dépend du volume)

**Idéal pour :** La majorité des déménagements, bon équilibre prix/service

---

### 3️⃣ CONFORT - Emballage et démontage professionnels

| Paramètre | Valeur |
|-----------|--------|
| **ID** | `CONFORT` |
| **Marge** | 35% |
| **Tags** | `COMFORT`, `UPSELL` |

**Modules activés (`enabledModules`) :**
```typescript
[
  'packing-requirement',
  'packing-cost',
  'dismantling-cost',
  'reassembly-cost',
  'high-value-item-handling',
]
```

**Overrides :**
```typescript
{
  packing: true,
  dismantling: true,
  reassembly: true,
  bulkyFurniture: true,
  artwork: true,
}
```

**Services FORCÉS (inclus d'office) :**
- ✅ Emballage professionnel (5€/m³)
- ✅ Démontage meubles (50€ base + 25€/meuble complexe)
- ✅ Remontage meubles (50€ base + 25€/meuble complexe)
- ✅ Manutention objets précieux

**Ce que le client doit faire :**
- Signaler les objets fragiles ou précieux
- Vider frigo/congélateur

**Ce qu'apporte le déménageur :**
- ✅ Emballage professionnel complet
- ✅ Fourniture de tout le matériel (cartons, bulles, adhésif)
- ✅ Démontage/remontage complet des meubles
- ✅ Manutention soignée et sans stress

**Durée typique :** 7-10 heures (emballage + déménagement)

**Idéal pour :** Familles, personnes pressées, déménagements complexes

---

### 4️⃣ SÉCURITÉ+ - Protection maximale avec assurance incluse

| Paramètre | Valeur |
|-----------|--------|
| **ID** | `SECURITY_PLUS` |
| **Marge** | 32% |
| **Tags** | `SECURITY_PLUS`, `PRO`, `INSURANCE_INCLUDED` |

**Modules activés (`enabledModules`) :**
```typescript
[
  'packing-requirement',
  'packing-cost',
  'cleaning-end-requirement',
  'cleaning-end-cost',
  'dismantling-cost',
  'reassembly-cost',
  'high-value-item-handling',
  'supplies-cost',
  'insurance-premium',
]
```

**Overrides :**
```typescript
{
  packing: true,
  cleaningEnd: true,
  dismantling: true,
  reassembly: true,
  bulkyFurniture: true,
  artwork: true,
  surface: 80,
  declaredValueInsurance: true,
  declaredValue: 50000,
  crossSellingSuppliesTotal: 100,
}
```

**Services FORCÉS :**
- ✅ Emballage professionnel complet (5€/m³)
- ✅ Nettoyage fin de bail inclus (8€/m²)
- ✅ Démontage/remontage professionnels
- ✅ Fournitures d'emballage incluses
- ✅ Assurance renforcée incluse (valeur déclarée 50 000€)
- ✅ Manutention sécurisée objets de valeur

**Note importante :** Le monte-meubles reste **conditionnel** selon les contraintes techniques (étage ≥3 ou ≥5). Il n'est pas forcé par la formule mais recommandé si nécessaire.

**Ce que le client doit faire :**
- Signaler les objets fragiles ou précieux
- Libère l'accès fenêtres/balcon si monte-meubles nécessaire

**Ce qu'apporte le déménageur :**
- ✅ Emballage professionnel complet
- ✅ Nettoyage fin de bail inclus
- ✅ Assurance tous risques incluse par défaut
- ✅ Protection premium de tous les biens
- ✅ Manutention sécurisée objets de valeur

**Avantages SÉCURITÉ+ :**
- Protection maximale avec emballage professionnel
- Assurance tous risques incluse (valeur déclarée 50 000€)
- Gestion sécurisée des objets fragiles et de valeur
- Responsabilité accrue et réduction drastique du risque

**Durée typique :** 7-10 heures (emballage + déménagement)

**Idéal pour :** Objets de valeur, biens fragiles, protection maximale souhaitée

---

### 5️⃣ PREMIUM - Service clé en main tout inclus

| Paramètre | Valeur |
|-----------|--------|
| **ID** | `PREMIUM` |
| **Marge** | 40% |
| **Tags** | `PREMIUM`, `ALL_INCLUSIVE` |

**Modules activés (`enabledModules`) :**
```typescript
[
  'packing-requirement',
  'packing-cost',
  'cleaning-end-requirement',
  'cleaning-end-cost',
  'dismantling-cost',
  'reassembly-cost',
  'high-value-item-handling',
]
```

**Overrides :**
```typescript
{
  packing: true,
  cleaningEnd: true,
  dismantling: true,
  reassembly: true,
  bulkyFurniture: true,
  artwork: true,
  surface: 80, // Assure que le nettoyage est recommandé (>60m²)
}
```

**Services FORCÉS :**
- ✅ Emballage professionnel complet (5€/m³)
- ✅ Nettoyage fin de bail (8€/m²)
- ✅ Démontage/remontage intégral
- ✅ Manutention objets de valeur

**Ce que le client doit faire :**
- Fournir le plan d'installation du nouveau logement
- Être présent en début/fin de journée

**Ce qu'apporte le déménageur :**
- ✅ Délégation totale du déménagement
- ✅ Emballage + démontage + remontage intégral
- ✅ Nettoyage fin de bail inclus
- ✅ Créneau horaire garanti + SAV dédié

**Services inclus :**
- Chef d'équipe dédié (coordinateur)
- Récupération cartons vides sous 48h
- Support téléphonique prioritaire J-7 à J+7
- Assurance tous risques valeur maximale

**Durée typique :** 2-3 jours
- Jour J-1 : Emballage complet
- Jour J : Déménagement
- Jour J+1 : Nettoyage ancien logement

**Idéal pour :** Cadres pressés, familles nombreuses, expatriés

---

### 6️⃣ FLEX - Adaptabilité maximale (Longue distance)

| Paramètre | Valeur |
|-----------|--------|
| **ID** | `FLEX` |
| **Marge** | 38% |
| **Tags** | `FLEXIBILITY`, `RISK_COVERED` |

**Modules activés (`enabledModules`) :**
```typescript
[
  'overnight-stop-cost',
  'crew-flexibility',
  'dismantling-cost',
  'reassembly-cost',
]
```

**Overrides :**
```typescript
{
  crewFlexibility: true,
  forceOvernightStop: true,
  dismantling: true,
  reassembly: true,
}
```

**Services FORCÉS :**
- ✅ Garantie flexibilité équipe (500€)
- ✅ Arrêt nuit si distance > 1000km
- ✅ Démontage/remontage professionnels

**Ce que le client doit faire :**
- Accepter une flexibilité horaire
- Donner une estimation de volume

**Ce qu'apporte le déménageur :**
- ✅ Ajustement équipe en temps réel
- ✅ Gestion des imprévus sans surcoût immédiat
- ✅ Logistique longue distance maîtrisée
- ✅ Suppression des litiges volume

**Avantages FLEX :**
- Aucun risque de mauvaise surprise volume
- Équipe adaptée même si estimation incorrecte
- Arrêt nuit sécurisé si >500km
- Flexibilité totale planning et logistique

**Durée typique :** 1-2 jours selon distance
- <300km : 1 jour (8-12h)
- >300km : 2 jours (arrêt nuit)

**Idéal pour :** Déménagements IDF→Province, volume incertain, imprévus possibles

---

## 🛒 Sources de données et interaction client

### Sources de données

| Source | Éléments concernés | Fichiers |
|--------|-------------------|----------|
| **Formulaire (checkbox)** | `pickupFurnitureLift`, `deliveryFurnitureLift` | `FurnitureLiftCheckbox.tsx` |
| **Modal Access Constraints** | Contraintes d'accès, difficultés logistiques | `LogisticsModal.tsx` |
| **Catalogue Cross-Selling** | `packing`, `dismantling`, `reassembly`, `cleaningEnd`, `storage`, objets spéciaux, fournitures | `CrossSellingContext.tsx`, `services-catalog.ts` |
| **PaymentPriceSection** | Assurance (`declaredValueInsurance` + `declaredValue`) | `page.tsx`, `insurance.config.ts` |

### Comportement quand le client coche des éléments

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ RÈGLE D'OR : Les sélections client S'AJOUTENT aux services du scénario     │
│                                                                              │
│ finalPrice = (baseCost + scénarioServices + clientSelections) × (1 + marge) │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Exemple 1 : Scénario ECO + Client coche "Emballage" dans le catalogue

| Élément | ECO seul | ECO + sélection client |
|---------|----------|------------------------|
| baseCost | 800€ | 800€ |
| `packing-cost` | ❌ SKIPPÉ (dans disabledModules) | ❌ SKIPPÉ (dans disabledModules) |
| Prix final | 800€ × 1.20 = **960€** | 800€ × 1.20 = **960€** |

> ⚠️ **Attention** : Dans ECO, l'emballage est **désactivé** (`disabledModules`), donc même si le client coche, le module ne s'exécute pas pour CE scénario.

#### Exemple 2 : Scénario STANDARD + Client coche "Emballage" dans le catalogue

| Élément | STANDARD seul | STANDARD + sélection client |
|---------|---------------|----------------------------|
| baseCost | 800€ | 800€ |
| `packing-cost` (ctx.packing=true) | ❌ pas applicable | ✅ +50€ (10m³ × 5€) |
| Prix final | 800€ × 1.30 = **1040€** | 850€ × 1.30 = **1105€** |

#### Exemple 3 : Scénario CONFORT (emballage forcé) + Client ajoute fournitures

| Élément | CONFORT seul | CONFORT + fournitures |
|---------|--------------|----------------------|
| baseCost | 800€ | 800€ |
| `packing-cost` (forcé) | +50€ | +50€ |
| `dismantling-cost` (forcé) | +75€ | +75€ |
| `reassembly-cost` (forcé) | +75€ | +75€ |
| `supplies-cost` | ❌ | +89€ (Pack Famille) |
| Sous-total | 1000€ | 1089€ |
| Prix final | 1000€ × 1.35 = **1350€** | 1089€ × 1.35 = **1470€** |

---

## 📋 Tableau récapitulatif - Lecture Orientée Client

> **Principe** : Modules les plus souvent inclus placés en haut, lecture verticale évidente (plus on monte en gamme, plus de ✅)

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

### 🧩 Lecture Client Immédiate

- **ECO** : Transport uniquement
- **STANDARD** : Participation client
- **CONFORT** : Déménageur fait l'essentiel
- **PREMIUM** : Prise en charge complète
- **SÉCURITÉ+** : Premium + Protection maximale
- **FLEX** : Devis sur mesure

---

## 📋 Tableau technique détaillé (référence développeur)

| Module ID | ECO | STANDARD | CONFORT | SÉCURITÉ+ | PREMIUM | FLEX |
|--------|:---:|:--------:|:-------:|:---------:|:-------:|:----:|
| `packing-cost` | ❌ | ⭕ | ✅ | ✅ | ✅ | ⭕ |
| `cleaning-end-cost` | ❌ | ❌ | ⭕ | ✅ | ✅ | ⭕ |
| `dismantling-cost` | ❌ | ⭕ | ✅ | ✅ | ✅ | ✅ |
| `reassembly-cost` | ❌ | ⭕ | ✅ | ✅ | ✅ | ✅ |
| `furniture-lift-cost` | ⭕ | ⭕ | ⭕ | ⭕* | ⭕ | ⭕ |
| `high-value-item-handling` | ❌ | ⭕ | ⭕ | ✅ | ✅ | ⭕ |
| `overnight-stop-cost` | ❌ | ❌ | ⭕ | ⭕ | ⭕ | ✅ |
| `crew-flexibility` | ❌ | ❌ | ⭕ | ⭕ | ⭕ | ✅ |
| `supplies-cost` | ❌ | ⭕ | ✅ | ✅ | ✅ | ⭕ |
| `storage-cost` | ⭕ | ⭕ | ⭕ | ⭕ | ⭕ | ⭕ |
| `insurance-premium` | ⭕ | ⭕ | ⭕ | ✅ | ✅ | ⭕ |

**Légende technique :**
- ✅ = **Forcé** (override ou enabledModules avec override) - inclus d'office dans la formule
- ❌ = **Désactivé** (disabledModules) - même si le client coche, le module ne s'exécute pas
- ⭕ = **Conditionnel** (s'applique si `ctx.xxx === true` ou selon contraintes techniques)
- ⭕* = **Conditionnel technique** (forcé uniquement si contrainte technique l'impose, ex: étage ≥5)

---

## 🔐 Éléments gérés séparément (hors scénarios)

| Élément | Gestion | Module pricing | Fichiers |
|---------|---------|----------------|----------|
| **Monte-meubles** | `FurnitureLiftCheckbox` par adresse (seuils HIGH≥3/CRITICAL≥5) | `furniture-lift-cost` | `FurnitureLiftCheckbox.tsx`, `FurnitureLiftCostModule.ts` |
| **Assurance** | `PaymentPriceSection` (après affichage scénarios) | `insurance-premium` | `page.tsx`, `insurance.config.ts`, `InsurancePremiumModule.ts` |
| **Fournitures** | Catalogue cross-selling | `supplies-cost` | `services-catalog.ts`, `SuppliesCostModule.ts` |

Ces éléments sont **toujours additifs** au prix du scénario sélectionné. Le monte-meubles reste conditionnel selon les contraintes techniques (étage ≥3 ou ≥5), même en SÉCURITÉ+.

---

## 📁 Fichiers de référence

| Fichier | Description |
|---------|-------------|
| `src/quotation-module/multi-offers/QuoteScenario.ts` | Définition des 6 scénarios |
| `src/quotation-module/multi-offers/MultiQuoteService.ts` | Service de génération multi-offres |
| `src/quotation-module/core/ModuleRegistry.ts` | Registre de tous les modules |
| `src/quotation-module/core/QuoteEngine.ts` | Moteur d'exécution des modules |
| `src/quotation-module/core/BaseCostEngine.ts` | Calcul du coût de base |
| `src/quotation-module/services/ScenarioRecommendationEngine.ts` | Moteur de recommandation intelligent |
| `src/config/services-catalog.ts` | Catalogue des services cross-selling |
| `src/contexts/CrossSellingContext.tsx` | Context React pour le cross-selling |
| `src/quotation-module/config/insurance.config.ts` | Configuration de l'assurance |

---

## 🔄 Flux complet simplifié

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FORMULAIRE CLIENT                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ • Adresses (départ/arrivée)                                                  │
│ • Étages + Ascenseurs                                                        │
│ • Volume / Nombre de pièces                                                  │
│ • Date souhaitée                                                             │
│ • Checkbox monte-meubles (pickupFurnitureLift, deliveryFurnitureLift)        │
│ • Modal contraintes d'accès                                                  │
│ • Bouton Cross-Selling → Catalogue                                           │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ÉTAPE 1 : /api/quotation/calculate                        │
├──────────────────────────────────────────────────────────────────────────────┤
│ BaseCostEngine exécute :                                                     │
│ • PHASE 1-6 (normalisation → main-d'œuvre)                                   │
│ • Retourne baseCost = 800€ (exemple)                                         │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                   ÉTAPE 2 : /api/quotation/multi-offers                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ MultiQuoteService génère 6 variantes :                                       │
│                                                                              │
│ ECO        : (800 + 0) × 1.20 = 960€                                        │
│ STANDARD   : (800 + 0) × 1.30 = 1040€  ← Recommandé                         │
│ CONFORT    : (800 + 300) × 1.35 = 1485€ (emballage + fournitures + démontage)│
│ SÉCURITÉ+  : (800 + 600) × 1.32 = 1848€ (emballage + nettoyage + assurance) │
│ PREMIUM    : (800 + 750) × 1.40 = 2170€ (tout inclus + assurance)           │
│ FLEX       : (800 + 575) × 1.38 = 1898€ (garantie flexibilité + démontage)  │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                      AFFICHAGE MULTI-OFFRES                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ Client sélectionne un scénario (ex: STANDARD)                                │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│                       PAYMENT PRICE SECTION                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ • Prix du scénario sélectionné : 1040€                                       │
│ • + Fournitures cross-selling : +89€                                         │
│ • + Assurance (si cochée) : +50€                                             │
│ • = TOTAL À PAYER : 1179€                                                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

*Dernière mise à jour : Janvier 2026*
