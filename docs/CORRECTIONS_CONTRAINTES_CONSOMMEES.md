# 🔧 Corrections: Contraintes Consommées par le Monte-Meubles

**Date**: 2025-10-11
**Objectif**: Éviter la double facturation des contraintes consommées par le monte-meubles

---

## 📋 Table des matières

1. [Contexte du problème](#contexte-du-problème)
2. [Correction 1: QuoteContext.ts](#correction-1-quotecontextts)
3. [Correction 2: RuleEngine.ts](#correction-2-ruleenginets)
4. [Correction 3: AutoDetectionService.ts](#correction-3-autodetectionservicets)
5. [Résultats des tests](#résultats-des-tests)
6. [Résumé visuel](#résumé-visuel)

---

## 🎯 Contexte du problème

### Problème initial

Lorsqu'un monte-meubles est requis, certaines contraintes sont "consommées" (résolues par le monte-meubles). Ces contraintes ne doivent **PAS** être facturées séparément pour éviter la double facturation.

**Exemple concret:**

- Étage 5 sans ascenseur → Monte-meubles requis (300€)
- Contrainte "Escaliers difficiles" → Ne doit PAS être facturée en plus
- **Pourquoi?** Le monte-meubles résout déjà le problème des escaliers

### Tests créés

Script de test: `scripts/test-consumed-constraints.ts`

**4 scénarios testés:**

1. ✅ Sans monte-meubles (étage 2) → Contraintes facturées normalement
2. ❌ Avec monte-meubles (étage 5) → Contraintes consommées non facturées
3. ❌ Avec monte-meubles (ascenseur small) → Contraintes consommées non facturées
4. ❌ Contraintes mixtes → Seules les non-consommées facturées

**Résultat initial:** 1/4 tests passaient

---

## 🔧 Correction 1: QuoteContext.ts

### 📍 Fichier modifié

`src/quotation/domain/valueObjects/QuoteContext.ts`

### 🐛 Problème identifié

**Ligne 19-20** - Types incorrects:

```typescript
// ❌ AVANT
pickupElevator?: boolean;
deliveryElevator?: boolean;
```

**Lignes 96-103** - Conversion booléenne inappropriée:

```typescript
// ❌ AVANT - Code original qui causait le bug
if (
  key.includes("Elevator") ||
  key.includes("NeedsLift") ||
  key === "packaging" ||
  key === "fragile" ||
  key === "storage" ||
  key === "disassembly" ||
  key === "unpacking" ||
  key === "supplies"
) {
  // Conversion en booléen
  this.values[key] = Boolean(value); // ⚠️ BUG: Boolean('no') = true!
  return;
}
```

### ✅ Solution appliquée

**Ligne 19-20** - Types corrigés:

```typescript
// ✅ APRÈS
pickupElevator?: 'no' | 'small' | 'medium' | 'large';
deliveryElevator?: 'no' | 'small' | 'medium' | 'large';
```

**Lignes 96-110** - Logique séparée:

```typescript
// ✅ APRÈS - Logique séparée pour les ascenseurs
// Validation pour les champs ascenseur (doivent rester des strings)
if (key.includes("Elevator")) {
  // Ne pas convertir en booléen, garder la valeur string
  this.values[key] = value; // ✅ Préserve 'no', 'small', 'medium', 'large'
  return;
}

// Validation pour les autres champs booléens
if (
  key.includes("NeedsLift") ||
  key === "packaging" ||
  key === "fragile" ||
  key === "storage" ||
  key === "disassembly" ||
  key === "unpacking" ||
  key === "supplies"
) {
  // Conversion en booléen
  this.values[key] = Boolean(value);
  return;
}
```

### 📝 Explication détaillée

**Pourquoi c'était un problème:**

1. Test définit: `context.setValue('pickupElevator', 'no')`
2. Ancienne logique détectait `'Elevator'` dans la clé
3. Exécutait `Boolean('no')` qui retourne `true` (toute string non-vide = truthy)
4. Contexte contenait `pickupElevator: true` au lieu de `'no'`
5. La logique de détection du monte-meubles vérifiait `elevator === 'no'` → échouait car `true !== 'no'`

**Impact de la correction:**

- ✅ Les valeurs `'no'`, `'small'`, `'medium'`, `'large'` sont préservées
- ✅ AutoDetectionService peut comparer les valeurs correctement
- ✅ Les types TypeScript correspondent à la réalité du runtime

---

## 🔧 Correction 2: RuleEngine.ts

### 📍 Fichier modifié

`src/quotation/domain/services/RuleEngine.ts`

### 🐛 Problème identifié

**Lignes 329-360** - Comparaison objet vs string:

```typescript
// ❌ AVANT - Méthode isRuleConstraintConsumed()
private isRuleConstraintConsumed(rule: Rule, consumedConstraints: Set<string>): boolean {
  if (rule.condition === 'furniture_lift_required' || rule.name === 'Monte-meuble') {
    return false;
  }

  // ⚠️ BUG: Comparaison directe objet vs string
  // rule.condition = { type: "building", stairs: "difficult" }
  // consumedConstraints = Set(['difficult_stairs', 'narrow_corridors'])
  // Cette comparaison ne matche JAMAIS car on compare un objet avec des strings!
  if (consumedConstraints.has(rule.condition)) {
    return true;
  }

  // Mapping manuel incomplet
  const constraintMappings: Record<string, string> = {
    'difficult_stairs': 'difficult_stairs',
    'narrow_corridors': 'narrow_corridors',
    // ... seulement 9 contraintes mappées
  };

  const mappedConstraint = constraintMappings[rule.condition];
  if (mappedConstraint && consumedConstraints.has(mappedConstraint)) {
    return true;
  }

  return false;
}
```

### ✅ Solution appliquée

**Lignes 329-343** - Méthode refactorisée:

```typescript
// ✅ APRÈS - Méthode avec extraction du nom de contrainte
private isRuleConstraintConsumed(rule: Rule, consumedConstraints: Set<string>): boolean {
  // Si cette règle est la règle du monte-meuble elle-même, ne pas l'ignorer
  if (rule.condition === 'furniture_lift_required' ||
      rule.name === 'Monte-meuble' ||
      rule.name === 'Supplément monte-meuble') {
    return false;
  }

  // ✅ CORRECTION: Extraire le nom de contrainte de l'objet JSON
  const constraintName = this.extractConstraintNameFromCondition(rule.condition);

  if (constraintName && consumedConstraints.has(constraintName)) {
    return true;
  }

  return false;
}
```

**Lignes 345-431** - Nouvelle méthode d'extraction:

```typescript
// ✅ NOUVELLE MÉTHODE: Mapper objet JSON → nom de contrainte
private extractConstraintNameFromCondition(condition: any): string | null {
  // Si c'est déjà un string, le retourner
  if (typeof condition === 'string') {
    return condition;
  }

  // Si c'est un objet JSON, analyser sa structure
  if (typeof condition === 'object' && condition !== null) {
    const type = condition.type;

    // Vehicle Access
    if (type === 'vehicle_access') {
      if (condition.zone === 'pedestrian') return 'pedestrian_zone';
      if (condition.road === 'narrow') return 'narrow_inaccessible_street';
      if (condition.parking === 'difficult') return 'difficult_parking';
      if (condition.parking === 'limited') return 'limited_parking';
      if (condition.traffic === 'complex') return 'complex_traffic';
    }

    // Building
    if (type === 'building') {
      if (condition.elevator === 'unavailable') return 'elevator_unavailable';
      if (condition.elevator === 'small') return 'elevator_unsuitable_size';
      if (condition.elevator === 'forbidden') return 'elevator_forbidden_moving';
      if (condition.stairs === 'difficult') return 'difficult_stairs';
      if (condition.corridors === 'narrow') return 'narrow_corridors';
    }

    // Distance
    if (type === 'distance') {
      if (condition.carrying === 'long') return 'long_carrying_distance';
      if (condition.access === 'indirect') return 'indirect_exit';
      if (condition.access === 'multilevel') return 'complex_multilevel_access';
    }

    // Security
    if (type === 'security') {
      if (condition.access === 'strict') return 'access_control';
      if (condition.permit === 'required') return 'administrative_permit';
      if (condition.time === 'restricted') return 'time_restrictions';
      if (condition.floor === 'fragile') return 'fragile_floor';
    }

    // Equipment
    if (type === 'equipment') {
      if (condition.lift === 'required') return 'furniture_lift_required';
    }

    // Service - Handling
    if (type === 'service') {
      if (condition.handling === 'bulky') return 'bulky_furniture';
      if (condition.handling === 'disassembly') return 'furniture_disassembly';
      if (condition.handling === 'reassembly') return 'furniture_reassembly';
      if (condition.handling === 'piano') return 'transport_piano';

      // Service - Packing
      if (condition.packing === 'departure') return 'professional_packing_departure';
      if (condition.packing === 'arrival') return 'professional_unpacking_arrival';
      if (condition.packing === 'supplies') return 'packing_supplies';
      if (condition.packing === 'artwork') return 'artwork_packing';

      // Service - Protection
      if (condition.protection === 'fragile') return 'fragile_valuable_items';
      if (condition.protection === 'heavy') return 'heavy_items';
      if (condition.protection === 'insurance') return 'additional_insurance';
      if (condition.protection === 'inventory') return 'photo_inventory';

      // Service - Storage
      if (condition.storage === 'temporary') return 'temporary_storage_service';

      // Service - Cleaning
      if (condition.cleaning === 'post_move') return 'post_move_cleaning';

      // Service - Admin
      if (condition.admin === 'management') return 'administrative_management';

      // Service - Transport
      if (condition.transport === 'animals') return 'animal_transport';
    }
  }

  return null;
}
```

### 📝 Explication détaillée

**Exemple concret avec la règle "Escalier difficile ou dangereux":**

Dans la BDD, la condition stockée est:

```json
{
  "type": "building",
  "stairs": "difficult"
}
```

AutoDetectionService retourne:

```javascript
consumedConstraints = Set(["difficult_stairs", "narrow_corridors"]);
```

**AVANT la correction:**

```javascript
// ❌ Comparaison qui échoue
const condition = { type: "building", stairs: "difficult" };
consumedConstraints.has(condition); // false
// Car Set.has() compare par référence, pas par contenu!
```

**APRÈS la correction:**

```javascript
// ✅ Étape 1: Extraction du nom de contrainte
const condition = { type: "building", stairs: "difficult" };
const constraintName = extractConstraintNameFromCondition(condition);
// → retourne 'difficult_stairs'

// ✅ Étape 2: Comparaison string avec string
consumedConstraints.has("difficult_stairs"); // true ✅
```

**Impact de la correction:**

- ✅ Les règles dont les contraintes sont consommées sont correctement ignorées
- ✅ Évite la double facturation (monte-meubles + contraintes individuelles)
- ✅ Mapping complet de toutes les conditions JSON possibles
- ✅ Tests 2, 3, 4 passent maintenant

---

## 🔧 Correction 3: AutoDetectionService.ts

### 📍 Fichier modifié

`src/quotation/domain/services/AutoDetectionService.ts`

### 🐛 Problème identifié

**Lignes 287-304** - Logique incomplète pour `elevator === 'small'`:

```typescript
// ❌ AVANT
if (
  elevator === "small" ||
  elevatorUnavailable ||
  elevatorUnsuitable ||
  elevatorForbiddenMoving
) {
  if (floor > this.FURNITURE_LIFT_FLOOR_THRESHOLD) {
    let reason = `Étage ${floor} avec ascenseur ${elevator}`;

    // ✅ CONSOMMATION: Problèmes d'ascenseur
    if (elevatorUnavailable) {
      reason += " (indisponible)";
      if (constraints.includes("elevator_unavailable")) {
        consumedConstraints.push("elevator_unavailable");
      }
    }
    if (elevatorUnsuitable) {
      reason += " (inadapté)";
      if (constraints.includes("elevator_unsuitable_size")) {
        consumedConstraints.push("elevator_unsuitable_size");
      }
    }
    // ...

    // ⚠️ PROBLÈME: Si elevator === 'small' mais elevatorUnsuitable === false,
    // la contrainte 'elevator_unsuitable_size' n'est PAS consommée!
  }
}
```

### ✅ Solution appliquée

**Lignes 287-304** - Ajout de la logique pour ascenseur small:

```typescript
// ✅ APRÈS
if (
  elevator === "small" ||
  elevatorUnavailable ||
  elevatorUnsuitable ||
  elevatorForbiddenMoving
) {
  if (floor > this.FURNITURE_LIFT_FLOOR_THRESHOLD) {
    let reason = `Étage ${floor} avec ascenseur ${elevator}`;

    // ✅ CONSOMMATION: Problèmes d'ascenseur
    // Si elevator === 'small', c'est implicitement inadapté pour les meubles
    if (
      elevator === "small" &&
      constraints.includes("elevator_unsuitable_size")
    ) {
      consumedConstraints.push("elevator_unsuitable_size");
    }

    if (elevatorUnavailable) {
      reason += " (indisponible)";
      if (constraints.includes("elevator_unavailable")) {
        consumedConstraints.push("elevator_unavailable");
      }
    }
    if (elevatorUnsuitable) {
      reason += " (inadapté)";
      if (constraints.includes("elevator_unsuitable_size")) {
        consumedConstraints.push("elevator_unsuitable_size");
      }
    }
    if (elevatorForbiddenMoving) {
      reason += " (interdit déménagement)";
      if (constraints.includes("elevator_forbidden_moving")) {
        consumedConstraints.push("elevator_forbidden_moving");
      }
    }

    // ... suite du code (consommation des autres contraintes)
  }
}
```

### 📝 Explication détaillée

**Contexte du TEST 3:**

```javascript
{
  pickupFloor: 4,
  pickupElevator: 'small',  // ← Ascenseur petit
  pickupLogisticsConstraints: [
    'elevator_unsuitable_size',  // ← Cette contrainte doit être consommée
    'narrow_corridors',
    'bulky_furniture'
  ]
}
```

**AVANT la correction:**

```javascript
// elevator === 'small' → monte-meubles requis (étage 4 > seuil 3) ✅
// MAIS elevatorUnsuitable === false (flag non fourni par le test)
// DONC le code ne consommait PAS 'elevator_unsuitable_size'
// RÉSULTAT: La règle "Ascenseur trop petit" était facturée EN PLUS du monte-meubles!
// → Double facturation: 300€ (monte-meubles) + 30€ (ascenseur inadapté) = 330€ ❌
```

**APRÈS la correction:**

```javascript
// elevator === 'small' → monte-meubles requis (étage 4 > seuil 3) ✅
// Nouvelle logique: si elevator === 'small' ET contrainte présente
if (elevator === "small" && constraints.includes("elevator_unsuitable_size")) {
  consumedConstraints.push("elevator_unsuitable_size"); // ✅ Consommée!
}
// RÉSULTAT: La règle "Ascenseur trop petit" n'est PAS facturée
// → Facturation correcte: 300€ (monte-meubles seulement) ✅
```

**Logique métier:**

- Un ascenseur `'small'` est **implicitement** inadapté pour transporter des meubles de déménagement
- Si le monte-meubles est requis à cause d'un ascenseur small, la contrainte `elevator_unsuitable_size` est automatiquement résolue par le monte-meubles
- Il ne faut donc pas facturer les deux: soit le monte-meubles (300€), soit la contrainte individuelle (30%), mais **pas les deux**

**Impact de la correction:**

- ✅ TEST 3 passe maintenant
- ✅ Pas de double facturation quand `elevator === 'small'`
- ✅ Cohérence avec la logique métier (un petit ascenseur EST inadapté par définition)

---

## ✅ Résultats des tests

### Avant les corrections

```bash
$ npm run test:consumed-constraints

✅ Tests réussis: 1/4
❌ Tests échoués: 3/4

⚠️  CERTAINS TESTS ONT ÉCHOUÉ
```

### Après les corrections

```bash
$ npm run test:consumed-constraints

============================================================================
📊 RÉSUMÉ DES TESTS
============================================================================
✅ Tests réussis: 4/4
❌ Tests échoués: 0/4

🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!
✅ Les contraintes consommées ne sont pas facturées (pas de double facturation)
```

### Détail des 4 tests

#### ✅ TEST 1: Sans monte-meubles

- **Scénario**: Étage 2 sans ascenseur
- **Résultat**: Les contraintes "Escaliers difficiles" et "Couloirs étroits" sont facturées normalement
- **Explication**: Pas de monte-meubles requis, donc les contraintes doivent être facturées

#### ✅ TEST 2: Avec monte-meubles - Étage élevé

- **Scénario**: Étage 5 sans ascenseur
- **Résultat**: Monte-meubles facturé, contraintes consommées NON facturées
- **Contraintes consommées**: `difficult_stairs`, `narrow_corridors`, `bulky_furniture`, `heavy_items`
- **Explication**: Le monte-meubles résout ces problèmes, pas de double facturation

#### ✅ TEST 3: Avec monte-meubles - Ascenseur inadapté

- **Scénario**: Étage 4 avec ascenseur small
- **Résultat**: Monte-meubles facturé, contraintes consommées NON facturées
- **Contraintes consommées**: `elevator_unsuitable_size`, `narrow_corridors`, `bulky_furniture`
- **Explication**: Ascenseur small = inadapté, contrainte consommée par le monte-meubles

#### ✅ TEST 4: Contraintes mixtes

- **Scénario**: Monte-meubles requis + contraintes non consommées
- **Résultat**: Monte-meubles + contraintes non-consommées facturées
- **Contraintes consommées**: `difficult_stairs`, `narrow_corridors`
- **Contraintes facturées**: `difficult_parking`, `pedestrian_zone`, `complex_traffic`
- **Explication**: Seules les contraintes d'accès véhicule sont facturées (non résolues par le monte-meubles)

---

## 📊 Résumé visuel

```
┌─────────────────────────────────────────────────────────────────┐
│ PROBLÈME INITIAL: Tests échouaient (1/4 passait)                │
│ • Double facturation des contraintes                            │
│ • Comparaisons types incorrectes                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CORRECTION 1: QuoteContext.ts (lignes 19-20, 96-110)            │
│ ✅ Séparation logique Elevator vs autres champs booléens        │
│ ✅ Préservation des valeurs string ('no', 'small', etc.)        │
│ ✅ Correction des types TypeScript                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    pickupElevator: 'no' ✅
                    (au lieu de true ❌)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CORRECTION 2: RuleEngine.ts (lignes 329-431)                    │
│ ✅ Ajout méthode extractConstraintNameFromCondition()           │
│ ✅ Mapping objet JSON → nom de contrainte                       │
│ ✅ Comparaison correcte dans isRuleConstraintConsumed()         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Règles consommées filtrées ✅
                    (TEST 2, 4 passent)
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ CORRECTION 3: AutoDetectionService.ts (lignes 289-290)          │
│ ✅ Consommation explicite de elevator_unsuitable_size           │
│ ✅ Logique: small elevator = implicitement inadapté             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    TEST 3 passe ✅
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ RÉSULTAT FINAL: Tous les tests passent (4/4) ✅                 │
│ ✅ Pas de double facturation                                    │
│ ✅ Contraintes consommées correctement ignorées                 │
│ ✅ Types corrects (string vs boolean)                           │
│ ✅ Mapping complet des conditions JSON                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Points clés à retenir

### 1. Types TypeScript importants

```typescript
// ✅ Bon type
pickupElevator: "no" | "small" | "medium" | "large";

// ❌ Mauvais type
pickupElevator: boolean; // Impossible de distinguer 'no' de 'small'
```

### 2. Conditions JSON dans la BDD

Les règles stockent leurs conditions au format JSON:

```json
{
  "type": "building",
  "stairs": "difficult"
}
```

Il faut mapper ces objets vers des noms de contraintes: `'difficult_stairs'`

### 3. Contraintes consommées

Quand le monte-meubles est requis, ces contraintes sont consommées:

- `difficult_stairs` - Escaliers résolus par le monte-meubles
- `narrow_corridors` - Couloirs contournés
- `bulky_furniture` - Meubles transportés par la fenêtre
- `heavy_items` - Objets lourds gérés par l'équipement
- `elevator_unsuitable_size` - Ascenseur contourné
- `indirect_exit` - Sortie indirecte contournée
- `complex_multilevel_access` - Accès complexe résolu

### 4. Contraintes NON consommées

Ces contraintes restent facturées même avec monte-meubles:

- `pedestrian_zone` - Zone piétonne (problème véhicule)
- `difficult_parking` - Stationnement (problème véhicule)
- `complex_traffic` - Circulation (problème véhicule)
- `access_control` - Contrôle d'accès (administratif)
- `time_restrictions` - Restrictions horaires (administratif)

---

## 📚 Références

### Scripts

- **Test**: `npm run test:consumed-constraints`
- **Script source**: `scripts/test-consumed-constraints.ts`
- **Analyse BDD**: `npm run analyze:rules`

### Fichiers modifiés

1. `src/quotation/domain/valueObjects/QuoteContext.ts`
2. `src/quotation/domain/services/RuleEngine.ts`
3. `src/quotation/domain/services/AutoDetectionService.ts`

### Documentation connexe

- [FORM_CONSTRUCTION_FLOW.md](./FORM_CONSTRUCTION_FLOW.md) - Flux de construction des formulaires
- [CACHE_ARCHITECTURE_EXPLAINED.md](./CACHE_ARCHITECTURE_EXPLAINED.md) - Architecture du cache

---

**Note**: Ce document a été généré automatiquement après la résolution des bugs de contraintes consommées le 2025-10-11.
