# 🐛 BUG CRITIQUE: Les règles ne s'additionnent pas aux deux adresses

## 📋 Description du problème

Quand une **même contrainte logistique** est présente à la fois au **départ ET à l'arrivée**, la règle associée ne s'applique **qu'une seule fois** au lieu de **deux fois**.

**Impact financier:** Perte de revenus importante car les surcharges ne sont pas facturées correctement.

---

## 🔍 Exemple concret

### Scénario

- **Départ:** Étage 2 sans ascenseur → `pickupLogisticsConstraints: ["difficult_stairs"]`
- **Arrivée:** Étage 3 sans ascenseur → `deliveryLogisticsConstraints: ["difficult_stairs"]`
- **Règle:** "Escalier difficile ou dangereux" (+40%)

### Comportement actuel (❌ INCORRECT)

- Règle appliquée **1 fois**: 100€ + 40% = **140€**
- La règle est ajoutée à `global` avec `address: undefined`

### Comportement attendu (✅ CORRECT)

- Règle appliquée **2 fois** (une pour chaque adresse):
  - Pickup: +40€
  - Delivery: +40€
  - Total: 100€ + 80€ = **180€**

**Perte:** 40€ non facturés!

---

## 🧪 Résultats des tests

Test script: `scripts/test-double-address-rules.ts`

| Test   | Contrainte          | Adresses concernées  | Attendu      | Obtenu       | Statut   |
| ------ | ------------------- | -------------------- | ------------ | ------------ | -------- |
| TEST 1 | `difficult_stairs`  | Départ uniquement    | 1x (40€)     | 1x (40€)     | ✅ OK    |
| TEST 2 | `difficult_stairs`  | Arrivée uniquement   | 1x (40€)     | 1x (40€)     | ✅ OK    |
| TEST 3 | `difficult_stairs`  | **Départ + Arrivée** | **2x (80€)** | **1x (40€)** | ❌ ÉCHEC |
| TEST 4 | `narrow_corridors`  | **Départ + Arrivée** | **2x (50€)** | **1x (25€)** | ❌ ÉCHEC |
| TEST 5 | `difficult_parking` | **Départ + Arrivée** | **2x (60€)** | **1x (30€)** | ❌ ÉCHEC |

**Résultat:** 3/5 tests échouent (60% d'échec sur les cas avec deux adresses)

---

## 🔎 Cause racine

### Fichier: `src/quotation/domain/services/RuleEngine.ts`

#### Ligne 278: Appel de `determineAddress()`

```typescript
const appliedRuleDetail: AppliedRuleDetail = {
  id: rule.id || "unknown",
  name: rule.name,
  type: this.determineRuleType(rule),
  value: Math.abs(rule.value),
  isPercentage: rule.isPercentage(),
  impact: new Money(absoluteImpact),
  description: rule.name,
  address: this.determineAddress(rule, contextData), // ⚠️ PROBLÈME ICI
  isConsumed: false,
};

builder.addAppliedRule(appliedRuleDetail); // Ajoute la règle UNE SEULE FOIS
```

#### Lignes 589-620: Méthode `determineAddress()`

```typescript
private determineAddress(
  rule: Rule,
  contextData: Record<string, unknown>,
): "pickup" | "delivery" | "both" | undefined {
  const name = rule.name.toLowerCase();

  // ❌ PROBLÈME: Analyse SEULEMENT le nom de la règle
  const hasPickupMention =
    name.includes("départ") ||
    name.includes("chargement") ||
    name.includes("pickup");
  const hasDeliveryMention =
    name.includes("arrivée") ||
    name.includes("livraison") ||
    name.includes("delivery");

  if (hasPickupMention && !hasDeliveryMention) return "pickup";
  if (hasDeliveryMention && !hasPickupMention) return "delivery";
  if (hasPickupMention && hasDeliveryMention) return "both";

  // ❌ PROBLÈME: Analyse la condition de la règle (JSON)
  // mais NE REGARDE JAMAIS les données du contexte!
  const condition = rule.condition;
  if (typeof condition === "object" && condition !== null) {
    const conditionStr = JSON.stringify(condition).toLowerCase();
    if (conditionStr.includes("pickup") && !conditionStr.includes("delivery"))
      return "pickup";
    if (conditionStr.includes("delivery") && !conditionStr.includes("pickup"))
      return "delivery";
  }

  // ❌ RÉSULTAT: Retourne undefined
  // La règle est ajoutée au "global" UNE SEULE FOIS
  return undefined;
}
```

### Pourquoi ça ne marche pas?

1. **La méthode regarde uniquement:**
   - Le **nom** de la règle (ex: "Escalier difficile" → pas de mention "départ"/"arrivée")
   - La **condition** JSON de la règle (ex: `{type: "building", stairs: "difficult"}` → pas de mention pickup/delivery)

2. **La méthode NE regarde PAS:**
   - Les **données du contexte** (`pickupLogisticsConstraints` et `deliveryLogisticsConstraints`)
   - Si la **contrainte est présente aux deux adresses**

3. **Résultat:**
   - `determineAddress()` retourne `undefined`
   - La règle est ajoutée **une seule fois** au `global`
   - Au lieu d'être ajoutée **deux fois** (une fois pour pickup, une fois pour delivery)

---

## ✅ Solution requise

### Option 1: Vérifier le contexte dans `determineAddress()`

Modifier `determineAddress()` pour analyser les contraintes du contexte:

```typescript
private determineAddress(
  rule: Rule,
  contextData: Record<string, unknown>,
): "pickup" | "delivery" | "both" | undefined {
  // ... logique existante ...

  // ✅ NOUVEAU: Vérifier si la contrainte est présente dans le contexte
  const constraintName = this.extractConstraintNameFromCondition(rule.condition);

  if (constraintName) {
    const pickupConstraints = contextData.pickupLogisticsConstraints as string[] || [];
    const deliveryConstraints = contextData.deliveryLogisticsConstraints as string[] || [];

    const isInPickup = pickupConstraints.includes(constraintName);
    const isInDelivery = deliveryConstraints.includes(constraintName);

    if (isInPickup && isInDelivery) return "both";
    if (isInPickup) return "pickup";
    if (isInDelivery) return "delivery";
  }

  return undefined;
}
```

### Option 2: Appliquer la règle deux fois dans la boucle

Au lieu d'appeler `builder.addAppliedRule()` une seule fois, l'appeler **deux fois** quand `address === "both"`:

```typescript
// Si la règle s'applique aux deux adresses
if (appliedRuleDetail.address === "both") {
  // Ajouter une fois pour pickup
  builder.addAppliedRule({ ...appliedRuleDetail, address: "pickup" });
  // Ajouter une fois pour delivery
  builder.addAppliedRule({ ...appliedRuleDetail, address: "delivery" });
} else {
  // Ajouter normalement
  builder.addAppliedRule(appliedRuleDetail);
}
```

---

## 📊 Impact estimé

### Sur les scénarios réels

Pour un déménagement typique avec **3 contraintes communes** aux deux adresses:

- Escalier difficile: +40% = 40€
- Couloirs étroits: +25% = 25€
- Stationnement difficile: +30% = 30€

**Perte totale:** 95€ non facturés par devis!

### Fréquence

Les contraintes communes aux deux adresses sont **fréquentes** dans les déménagements:

- Immeubles anciens sans ascenseur (départ + arrivée)
- Quartiers urbains denses (stationnement difficile des deux côtés)
- Immeubles avec couloirs étroits

**Estimation:** 30-40% des devis concernés

---

## 🎯 Priorité

**CRITIQUE** 🔴

- Impact financier direct important
- Sous-facturation systématique
- Affecte une proportion significative des devis
- Facile à corriger (modification localisée)

---

## 📝 Actions recommandées

1. ✅ **Implémenter la correction** (Option 1 ou 2)
2. ✅ **Tester avec `test-double-address-rules.ts`** (doit passer 5/5 tests)
3. ✅ **Vérifier la non-régression** avec `test-consumed-constraints.ts` (doit passer 12/12 tests)
4. ✅ **Vérifier les tests d'intégration** (23 tests)
5. ✅ **Commiter les changements**
6. 🔍 **Auditer les devis récents** pour identifier les cas impactés

---

## 🔗 Fichiers concernés

- **RuleEngine.ts**: `src/quotation/domain/services/RuleEngine.ts` (lignes 278, 589-620)
- **Test de vérification**: `scripts/test-double-address-rules.ts`
- **Test de non-régression**: `scripts/test-consumed-constraints.ts`
- **Interface**: `src/quotation/domain/interfaces/RuleExecutionResult.ts`

---

## 📅 Historique

- **2025-10-14**: Découverte du bug lors de la vérification de l'addition des règles
- **2025-10-14**: Création du test de validation `test-double-address-rules.ts`
- **2025-10-14**: Confirmation du bug (3/5 tests échouent)
- **2025-10-14**: Documentation du bug dans ce fichier
