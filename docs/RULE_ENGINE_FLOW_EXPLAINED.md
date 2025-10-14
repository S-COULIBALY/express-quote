# 🔄 Flux du RuleEngine après Refactoring

1. Vue d'ensemble du flux
2. Point d'entrée (Strategy)
3. RuleEngine.execute() en détail
4. Builder et auto-catégorisation
5. Structure complète du RuleExecutionResult
6. Exemple concret avec escaliers + couloirs
7. Utilisation dans les strategies
8. Comparaison Avant/Après
9. Points clés du système

## Vue d'ensemble

Ce document explique le flux complet du système de règles métier après le refactoring, de l'appel initial à la réponse finale enrichie.

---

## 1️⃣ Point d'entrée : Strategy.calculate()

Les stratégies de calcul (MovingQuoteStrategy, CleaningQuoteStrategy, etc.) appellent le RuleEngine :

```typescript
// Exemple : MovingQuoteStrategy.ts ligne 708
const ruleResult = this.ruleEngine.execute(context, baseMoneyAmount);
```

**Entrée :**

- `context: QuoteContext` - Contient toutes les données du devis (adresses, contraintes, dates, etc.)
- `baseMoneyAmount: Money` - Prix de base AVANT application des règles métier

---

## 2️⃣ RuleEngine.execute() - Construction du résultat

Le RuleEngine parcourt toutes les règles applicables et construit un résultat enrichi.

### Initialisation du Builder

```typescript
// RuleEngine.ts ligne 170
const builder = new RuleExecutionResultBuilder(basePrice);
```

Le Builder initialise automatiquement :

- Toutes les listes de règles vides (reductions, surcharges, constraints, etc.)
- Les totaux à 0€
- Les coûts par adresse (pickup, delivery, global)

### Boucle sur les règles

```typescript
// RuleEngine.ts lignes 183-343
for (const rule of this.rules) {
  // Vérifier si la règle est applicable
  if (rule.isApplicable(context)) {
    // Appliquer la règle
    const ruleResult = rule.apply(currentPrice, contextData, basePrice);

    // Créer un AppliedRuleDetail avec toutes les infos
    const appliedRuleDetail: AppliedRuleDetail = {
      id: rule.id,
      name: rule.name,
      type: this.determineRuleType(rule), // AUTO-DÉTECTION du type
      value: Math.abs(rule.value),
      isPercentage: rule.isPercentage(),
      impact: new Money(absoluteImpact),
      description: rule.name,
      address: this.determineAddress(rule, contextData), // AUTO-DÉTECTION de l'adresse
      isConsumed: false,
    };

    // Ajouter au Builder (qui va auto-catégoriser)
    builder.addAppliedRule(appliedRuleDetail);
  }
}
```

### Auto-détection du type de règle

```typescript
// RuleEngine.ts ligne 504
private determineRuleType(rule: Rule): AppliedRuleType {
  const name = rule.name.toLowerCase();

  // Réduction (valeur négative)
  if (rule.value < 0) return AppliedRuleType.REDUCTION;

  // Équipement (Monte-meuble)
  if (name.includes("monte-meuble")) return AppliedRuleType.EQUIPMENT;

  // Temporel (Week-end, période spéciale)
  if (name.includes("weekend") || name.includes("férié"))
    return AppliedRuleType.TEMPORAL;

  // Contraintes logistiques
  if (name.includes("escalier") || name.includes("ascenseur"))
    return AppliedRuleType.CONSTRAINT;

  // Services additionnels
  if (name.includes("emballage") || name.includes("nettoyage"))
    return AppliedRuleType.ADDITIONAL_SERVICE;

  // Par défaut = surcharge
  return AppliedRuleType.SURCHARGE;
}
```

### Auto-détection de l'adresse

```typescript
// RuleEngine.ts ligne 562
private determineAddress(
  rule: Rule,
  contextData: Record<string, unknown>
): "pickup" | "delivery" | "both" | undefined {
  const name = rule.name.toLowerCase();

  const hasPickupMention = name.includes("départ") || name.includes("chargement");
  const hasDeliveryMention = name.includes("arrivée") || name.includes("livraison");

  if (hasPickupMention && !hasDeliveryMention) return "pickup";
  if (hasDeliveryMention && !hasPickupMention) return "delivery";
  if (hasPickupMention && hasDeliveryMention) return "both";

  return undefined;  // Global (pas d'adresse spécifique)
}
```

---

## 3️⃣ Builder.addAppliedRule() - Auto-catégorisation

Quand une règle est ajoutée au Builder, elle est **automatiquement catégorisée** dans les bonnes listes.

```typescript
// RuleExecutionResultBuilder.ts
addAppliedRule(rule: AppliedRuleDetail): this {
  // 1. Ajouter à la liste globale
  this.result.appliedRules!.push(rule);
  this.result.totalRulesApplied!++;

  // 2. Catégoriser par TYPE
  switch (rule.type) {
    case AppliedRuleType.REDUCTION:
      this.result.reductions!.push(rule);
      this.result.totalReductions = this.result.totalReductions!.add(rule.impact);
      break;

    case AppliedRuleType.SURCHARGE:
      this.result.surcharges!.push(rule);
      this.result.totalSurcharges = this.result.totalSurcharges!.add(rule.impact);
      break;

    case AppliedRuleType.CONSTRAINT:
      this.result.constraints!.push(rule);
      // Les contraintes peuvent aussi avoir un impact sur le prix
      if (rule.impact.getAmount() > 0) {
        this.result.totalSurcharges = this.result.totalSurcharges!.add(rule.impact);
      }
      break;

    case AppliedRuleType.EQUIPMENT:
      this.result.equipment!.push(rule);
      this.result.totalSurcharges = this.result.totalSurcharges!.add(rule.impact);
      break;

    case AppliedRuleType.TEMPORAL:
      this.result.temporalRules!.push(rule);
      this.result.totalSurcharges = this.result.totalSurcharges!.add(rule.impact);
      break;

    case AppliedRuleType.ADDITIONAL_SERVICE:
      this.result.additionalServices!.push(rule);
      this.result.totalSurcharges = this.result.totalSurcharges!.add(rule.impact);
      break;
  }

  // 3. Catégoriser par ADRESSE
  if (rule.address === 'pickup') {
    this.result.pickupCosts!.rules.push(rule);
    this.result.pickupCosts!.total = this.result.pickupCosts!.total.add(rule.impact);

    if (rule.impact.getAmount() > 0) {
      this.result.pickupCosts!.surcharges = this.result.pickupCosts!.surcharges.add(rule.impact);
    } else {
      this.result.pickupCosts!.reductions = this.result.pickupCosts!.reductions.add(rule.impact.multiply(-1));
    }
  } else if (rule.address === 'delivery') {
    // Pareil pour delivery
    this.result.deliveryCosts!.rules.push(rule);
    // ...
  } else {
    // Global (pas d'adresse spécifique)
    this.result.globalCosts!.rules.push(rule);
    // ...
  }

  return this;
}
```

**Points clés :**

- Une règle peut être dans **plusieurs catégories** (ex: CONSTRAINT + pickupCosts)
- Les totaux sont **calculés automatiquement**
- Pas besoin de logique de catégorisation dans les strategies

---

## 4️⃣ Finalisation et retour

```typescript
// RuleEngine.ts lignes 419-447

// Finaliser avec les métadonnées
builder.setFinalPrice(new Money(finalPrice));
builder.setConsumedConstraints(
  Array.from(allConsumedConstraints),
  "Consommées par le Monte-meuble",
);
builder.setFurnitureLift(furnitureLiftRequired, reason);
builder.setMinimumPrice(true, new Money(minimumPrice));

// Construire le résultat complet
const result = builder.build();

// ⚠️ COMPATIBILITÉ BACKWARD - Ajouter l'ancienne propriété
(result as any).discounts = discounts;

return result; // Type: RuleExecutionResult
```

---

## 📦 Structure du RuleExecutionResult retourné

```typescript
interface RuleExecutionResult {
  // ═══════════════════════════════════════
  // 💰 PRIX DÉTAILLÉS
  // ═══════════════════════════════════════
  basePrice: Money; // Prix de base initial
  finalPrice: Money; // Prix final après toutes les règles
  totalReductions: Money; // Somme de toutes les réductions
  totalSurcharges: Money; // Somme de toutes les surcharges

  // ═══════════════════════════════════════
  // 📋 TOUTES LES RÈGLES APPLIQUÉES
  // ═══════════════════════════════════════
  appliedRules: AppliedRuleDetail[]; // Liste complète (non filtrée)

  // ═══════════════════════════════════════
  // 📊 RÈGLES PAR CATÉGORIE (AUTO-TRIÉES)
  // ═══════════════════════════════════════
  reductions: AppliedRuleDetail[]; // Réductions uniquement
  surcharges: AppliedRuleDetail[]; // Surcharges uniquement
  constraints: AppliedRuleDetail[]; // Contraintes logistiques
  additionalServices: AppliedRuleDetail[]; // Services additionnels
  equipment: AppliedRuleDetail[]; // Équipements spéciaux (monte-meuble)
  temporalRules: AppliedRuleDetail[]; // Règles temporelles (week-end, nuit)

  // ═══════════════════════════════════════
  // 📍 COÛTS PAR ADRESSE (AUTO-CALCULÉS)
  // ═══════════════════════════════════════
  pickupCosts: AddressCosts; // Coûts liés à l'adresse de départ
  deliveryCosts: AddressCosts; // Coûts liés à l'adresse d'arrivée
  globalCosts: AddressCosts; // Coûts globaux (pas d'adresse spécifique)

  // ═══════════════════════════════════════
  // 🚧 CONTRAINTES CONSOMMÉES
  // ═══════════════════════════════════════
  consumedConstraints: string[]; // Liste des contraintes consommées
  consumptionReason?: string; // Raison (ex: "Monte-meuble")

  // ═══════════════════════════════════════
  // 📊 MÉTADONNÉES
  // ═══════════════════════════════════════
  totalRulesEvaluated: number; // Nombre total de règles vérifiées
  totalRulesApplied: number; // Nombre de règles réellement appliquées
  furnitureLiftRequired: boolean; // Monte-meuble requis ?
  furnitureLiftReason?: string; // Raison du monte-meuble
  minimumPriceApplied: boolean; // Prix minimum appliqué ?
  minimumPriceAmount?: Money; // Montant du prix minimum

  // ═══════════════════════════════════════
  // ⚠️ COMPATIBILITÉ BACKWARD
  // ═══════════════════════════════════════
  discounts: Discount[]; // Format ancien (ajouté dynamiquement)
}
```

### Structure AddressCosts

```typescript
interface AddressCosts {
  total: Money; // Total des coûts pour cette adresse
  rules: AppliedRuleDetail[]; // Règles appliquées à cette adresse
  reductions: Money; // Total des réductions
  surcharges: Money; // Total des surcharges
}
```

### Structure AppliedRuleDetail

```typescript
interface AppliedRuleDetail {
  id: string; // ID unique de la règle
  name: string; // Nom lisible
  type: AppliedRuleType; // Type (REDUCTION, SURCHARGE, CONSTRAINT, etc.)
  value: number; // Valeur de la règle (40 pour 40%)
  isPercentage: boolean; // true si c'est un pourcentage
  impact: Money; // Impact réel sur le prix (en €)
  description: string; // Description complète
  address?: "pickup" | "delivery" | "both"; // Adresse concernée
  isConsumed?: boolean; // true si consommée par monte-meuble
  consumedBy?: string; // Nom de la règle qui l'a consommée
}
```

---

## 🎯 Exemple concret : Escaliers + Couloirs étroits

### INPUT

```typescript
basePrice = 100€
context = {
  pickupFloor: 2,
  pickupElevator: 'no',
  pickupLogisticsConstraints: ['difficult_stairs', 'narrow_corridors']
}

rules = [
  Rule("Escalier difficile ou dangereux", +40%, CONSTRAINT),
  Rule("Couloirs étroits ou encombrés", +25%, CONSTRAINT)
]
```

### PROCESSING

```
Étape 1 : Escalier difficile
  - Applicable ? Oui (pickupElevator='no' && pickupFloor >= 1)
  - Calcul : 100€ × 40% = +40€
  - Type détecté : CONSTRAINT (car "escalier" dans le nom)
  - Adresse détectée : pickup (conditions pickup*)
  - Impact total : +40€

Étape 2 : Couloirs étroits
  - Applicable ? Oui ('narrow_corridors' dans pickupLogisticsConstraints)
  - Calcul : 100€ × 25% = +25€ (sur prix de base, pas sur 140€)
  - Type détecté : CONSTRAINT (car "couloir" dans le nom)
  - Adresse détectée : pickup
  - Impact total : +40€ + 25€ = +65€

Prix final : 100€ + 65€ = 165€
```

### OUTPUT : RuleExecutionResult

```typescript
{
  // ═══ PRIX ═══
  basePrice: Money(100),
  finalPrice: Money(165),
  totalReductions: Money(0),
  totalSurcharges: Money(65),

  // ═══ TOUTES LES RÈGLES ═══
  appliedRules: [
    {
      id: "rule_123",
      name: "Escalier difficile ou dangereux",
      type: "CONSTRAINT",
      value: 40,
      isPercentage: true,
      impact: Money(40),
      description: "Escalier difficile ou dangereux",
      address: "pickup",
      isConsumed: false
    },
    {
      id: "rule_124",
      name: "Couloirs étroits ou encombrés",
      type: "CONSTRAINT",
      value: 25,
      isPercentage: true,
      impact: Money(25),
      description: "Couloirs étroits ou encombrés",
      address: "pickup",
      isConsumed: false
    }
  ],

  // ═══ PAR CATÉGORIE ═══
  reductions: [],
  surcharges: [
    /* Les 2 règles */
  ],
  constraints: [
    /* Les 2 règles aussi (double classification) */
  ],
  additionalServices: [],
  equipment: [],
  temporalRules: [],

  // ═══ PAR ADRESSE ═══
  pickupCosts: {
    total: Money(65),
    rules: [/* Les 2 règles */],
    reductions: Money(0),
    surcharges: Money(65)
  },
  deliveryCosts: {
    total: Money(0),
    rules: [],
    reductions: Money(0),
    surcharges: Money(0)
  },
  globalCosts: {
    total: Money(0),
    rules: [],
    reductions: Money(0),
    surcharges: Money(0)
  },

  // ═══ CONTRAINTES CONSOMMÉES ═══
  consumedConstraints: [],  // Aucune (pas de monte-meuble)
  consumptionReason: undefined,

  // ═══ MÉTADONNÉES ═══
  totalRulesEvaluated: 32,
  totalRulesApplied: 2,
  furnitureLiftRequired: false,
  furnitureLiftReason: undefined,
  minimumPriceApplied: false,
  minimumPriceAmount: undefined,

  // ═══ COMPATIBILITÉ ═══
  discounts: [Discount(...), Discount(...)]  // Format ancien
}
```

---

## 5️⃣ Utilisation dans les Strategies

Les strategies peuvent maintenant exploiter toutes ces informations enrichies :

```typescript
// MovingQuoteStrategy.ts lignes 711-856
console.log(`📊 Résultat du RuleEngine (nouvelle architecture):`);
console.log(`   └─ Prix de base: ${ruleResult.basePrice.getAmount()}€`);
console.log(`   └─ Prix final: ${ruleResult.finalPrice.getAmount()}€`);
console.log(
  `   └─ Total réductions: ${ruleResult.totalReductions.getAmount()}€`,
);
console.log(
  `   └─ Total surcharges: ${ruleResult.totalSurcharges.getAmount()}€`,
);
console.log(`   └─ Nombre total de règles: ${ruleResult.appliedRules.length}`);

// Afficher par catégorie
if (ruleResult.reductions.length > 0) {
  console.log("\n  📉 RÉDUCTIONS:");
  ruleResult.reductions.forEach((rule, index) => {
    console.log(`   ${index + 1}. ${rule.description}`);
    console.log(`      └─ Montant: -${rule.impact.getAmount()}€`);
  });
}

if (ruleResult.surcharges.length > 0) {
  console.log("\n  📈 SURCHARGES:");
  ruleResult.surcharges.forEach((rule, index) => {
    console.log(`   ${index + 1}. ${rule.description}`);
    console.log(`      └─ Montant: +${rule.impact.getAmount()}€`);
  });
}

// Afficher par adresse
console.log("\n📍 COÛTS PAR ADRESSE:");
console.log(`   └─ Départ: ${ruleResult.pickupCosts.total.getAmount()}€`);
console.log(`   └─ Arrivée: ${ruleResult.deliveryCosts.total.getAmount()}€`);
console.log(`   └─ Global: ${ruleResult.globalCosts.total.getAmount()}€`);
```

---

## 📊 Comparaison Avant/Après

### ❌ AVANT le refactoring

```typescript
// Résultat minimal
{
  finalPrice: Money(165),
  discounts: [Discount, Discount],  // Liste non structurée
  appliedRules?: ["Escalier", "Couloirs"]  // Juste les noms
}

// Problèmes :
// ❌ Pas de séparation réductions/surcharges
// ❌ Pas de catégorisation par type
// ❌ Pas d'info sur l'adresse concernée
// ❌ Pas de totaux calculés
// ❌ Nom "discounts" trompeur (contient aussi les surcharges)
```

### ✅ APRÈS le refactoring

```typescript
// Résultat enrichi et explicite
{
  basePrice: Money(100),
  finalPrice: Money(165),
  totalReductions: Money(0),
  totalSurcharges: Money(65),

  appliedRules: [...],        // Liste complète avec tous les détails
  reductions: [...],          // Séparation claire
  surcharges: [...],          // Séparation claire
  constraints: [...],         // Par type
  equipment: [...],           // Par type

  pickupCosts: {...},         // Par adresse
  deliveryCosts: {...},       // Par adresse

  consumedConstraints: [...], // Contraintes consommées
  furnitureLiftRequired: true,// Métadonnées

  discounts: [...]            // Compatibilité backward
}

// Avantages :
// ✅ Séparation claire réductions/surcharges
// ✅ Auto-catégorisation par type
// ✅ Auto-attribution par adresse
// ✅ Totaux calculés automatiquement
// ✅ Noms explicites et cohérents
// ✅ Backward compatible
```

---

## 🎯 Points clés du flux

1. **Auto-catégorisation intelligente** : Le `determineRuleType()` analyse le nom de la règle pour détecter automatiquement son type (CONSTRAINT, EQUIPMENT, TEMPORAL, etc.)

2. **Auto-attribution d'adresse** : Le `determineAddress()` détecte automatiquement si une règle concerne le départ, l'arrivée, les deux, ou est globale

3. **Double classification possible** : Une règle peut être à la fois CONSTRAINT et SURCHARGE (ex: escalier difficile)

4. **Calculs automatiques** : Le Builder calcule automatiquement tous les totaux (par catégorie, par adresse)

5. **Compatibilité backward complète** : L'ancienne propriété `discounts` est ajoutée dynamiquement pour ne pas casser le code existant

6. **Pas de logique dans les strategies** : Toute la logique de catégorisation est centralisée dans le RuleEngine et le Builder

---

## 🚀 Prochaines étapes possibles

Les phases suivantes du refactoring (non encore implémentées) seraient :

- **Phase 4** : Mettre à jour PriceService et FallbackCalculatorService
- **Phase 5** : Nettoyer les types et controllers
- **Phase 6** : Supprimer les alias de compatibilité (Discount → AppliedRule)
- **Phase 7** : Exploiter les nouvelles données dans le frontend

---

## 📝 Fichiers concernés

- `src/quotation/domain/interfaces/RuleExecutionResult.ts` - Définition de l'interface
- `src/quotation/domain/services/RuleEngine.ts` - Logique d'exécution et auto-détection
- `src/quotation/domain/valueObjects/AppliedRule.ts` - Classe de règle appliquée
- `src/quotation/application/strategies/*.ts` - Utilisation du résultat enrichi

---

**Date de création** : 13 octobre 2025
**Version** : 1.0
**Auteur** : Refactoring Phase 2 & 3
