# 🏗️ Structure AddressCosts Enrichie - Documentation Finale

## 🎯 Vue d'ensemble

La structure `AddressCosts` a été **réorganisée et enrichie** pour fournir une **vue complète et auto-suffisante** de tous les coûts par adresse (pickup, delivery, global).

---

## ✅ Structure TypeScript

```typescript
export interface AddressCosts {
  // ═══════════════════════════════════════════════════════════════════════
  // SURCHARGES (contraintes logistiques + services supplémentaires)
  // ═══════════════════════════════════════════════════════════════════════

  /** Surcharges - Contraintes logistiques appliquées */
  constraints: AppliedRuleDetail[];

  /** Surcharges - Services supplémentaires appliqués */
  additionalServices: AppliedRuleDetail[];

  /** Sous-total des surcharges (constraints + additionalServices) */
  totalSurcharges: Money;

  // ═══════════════════════════════════════════════════════════════════════
  // ÉQUIPEMENTS
  // ═══════════════════════════════════════════════════════════════════════

  /** Équipements spéciaux appliqués (monte-meuble, diable, etc.) */
  equipment: AppliedRuleDetail[];

  /** Sous-total des équipements */
  totalEquipment: Money;

  // ═══════════════════════════════════════════════════════════════════════
  // RÉDUCTIONS
  // ═══════════════════════════════════════════════════════════════════════

  /** Réductions appliquées localement à cette adresse */
  reductions: AppliedRuleDetail[];

  /** Sous-total des réductions */
  totalReductions: Money;

  // ═══════════════════════════════════════════════════════════════════════
  // MONTE-MEUBLE (détection spécifique par adresse)
  // ═══════════════════════════════════════════════════════════════════════

  /** Monte-meuble requis pour cette adresse ? */
  furnitureLiftRequired: boolean;

  /** Raison de la détection du monte-meuble */
  furnitureLiftReason?: string;

  // ═══════════════════════════════════════════════════════════════════════
  // CONTRAINTES CONSOMMÉES (par adresse)
  // ═══════════════════════════════════════════════════════════════════════

  /** Contraintes absorbées par un équipement (ex: monte-meuble consomme escaliers) */
  consumedConstraints: string[];

  /** Raison de la consommation */
  consumptionReason?: string;

  // ═══════════════════════════════════════════════════════════════════════
  // TOTAL FINAL PAR ADRESSE
  // ═══════════════════════════════════════════════════════════════════════

  /** Total net pour cette adresse (surcharges + équipements - réductions) */
  total: Money;
}
```

---

## 🎯 Exemple concret : Déménagement avec monte-meuble

### Scénario

```typescript
{
  pickup: {
    floor: 5,
    elevator: "no",
    constraints: ["difficult_stairs", "narrow_corridors"]
  },
  delivery: {
    floor: 3,
    elevator: "no",
    constraints: ["difficult_parking"]
  },
  volume: 30,
  distance: 25
}
```

### Résultat `pickupCosts`

```typescript
{
  // SURCHARGES
  constraints: [],  // Vide car consommées par monte-meuble
  additionalServices: [],
  totalSurcharges: Money(0),

  // ÉQUIPEMENTS
  equipment: [],  // Monte-meuble est global, pas spécifique pickup
  totalEquipment: Money(0),

  // RÉDUCTIONS
  reductions: [],
  totalReductions: Money(0),

  // MONTE-MEUBLE (info spécifique pickup)
  furnitureLiftRequired: true,
  furnitureLiftReason: "Étage 5 sans ascenseur (seuil: 3)",

  // CONTRAINTES CONSOMMÉES (info spécifique pickup)
  consumedConstraints: ["difficult_stairs", "narrow_corridors"],
  consumptionReason: "Consommées par le Monte-meuble (départ)",

  // TOTAL
  total: Money(0)  // Rien de spécifique facturé pour pickup
}
```

### Résultat `deliveryCosts`

```typescript
{
  // SURCHARGES
  constraints: [],  // Parking difficile est dans globalCosts
  additionalServices: [],
  totalSurcharges: Money(0),

  // ÉQUIPEMENTS
  equipment: [],
  totalEquipment: Money(0),

  // RÉDUCTIONS
  reductions: [],
  totalReductions: Money(0),

  // MONTE-MEUBLE (info spécifique delivery)
  furnitureLiftRequired: false,  // Pas de monte-meuble requis à l'arrivée
  furnitureLiftReason: undefined,

  // CONTRAINTES CONSOMMÉES
  consumedConstraints: [],
  consumptionReason: undefined,

  // TOTAL
  total: Money(0)
}
```

### Résultat `globalCosts`

```typescript
{
  // SURCHARGES
  constraints: [
    {
      id: "rule_parking",
      name: "Stationnement difficile ou payant",
      type: AppliedRuleType.CONSTRAINT,
      value: 30,
      isPercentage: true,
      impact: Money(30),
      address: undefined,  // Global, pas spécifique
      isConsumed: false
    }
  ],
  additionalServices: [],
  totalSurcharges: Money(30),

  // ÉQUIPEMENTS
  equipment: [
    {
      id: "rule_monte_meuble",
      name: "Monte-meuble",
      type: AppliedRuleType.EQUIPMENT,
      value: 300,
      isPercentage: false,
      impact: Money(300),
      address: undefined,  // Global (couvre pickup + delivery)
      isConsumed: false
    }
  ],
  totalEquipment: Money(300),

  // RÉDUCTIONS
  reductions: [],
  totalReductions: Money(0),

  // MONTE-MEUBLE
  furnitureLiftRequired: false,
  furnitureLiftReason: undefined,

  // CONTRAINTES CONSOMMÉES
  consumedConstraints: [],
  consumptionReason: undefined,

  // TOTAL
  total: Money(330)  // 30€ (parking) + 300€ (monte-meuble)
}
```

---

## 📊 Avantages de la nouvelle structure

### ✅ 1. Auto-suffisance par adresse

Chaque `AddressCosts` contient **TOUTES** les informations nécessaires :

- Pas besoin de chercher ailleurs pour savoir si monte-meuble requis
- Pas besoin de chercher ailleurs pour les contraintes consommées
- Sous-totaux pré-calculés

### ✅ 2. Facilite l'affichage frontend

```tsx
// Affichage simple des coûts pickup
function PickupCostsDisplay({ costs }: { costs: AddressCosts }) {
  return (
    <div>
      <h3>Coûts Départ</h3>

      {/* Monte-meuble */}
      {costs.furnitureLiftRequired && (
        <Alert>Monte-meuble requis : {costs.furnitureLiftReason}</Alert>
      )}

      {/* Contraintes consommées */}
      {costs.consumedConstraints.length > 0 && (
        <div>
          <strong>{costs.consumptionReason}</strong>
          <ul>
            {costs.consumedConstraints.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Surcharges */}
      {costs.constraints.map((rule) => (
        <div key={rule.id}>
          {rule.name}: +{rule.impact.getAmount()}€
        </div>
      ))}

      {/* Total */}
      <strong>Total départ: {costs.total.getAmount()}€</strong>
    </div>
  );
}
```

### ✅ 3. Séparation claire des responsabilités

```typescript
// AVANT (structure plate)
result.furnitureLiftRequired; // Global, mais pour quelle adresse ?
result.consumedConstraints; // Global, mais d'où viennent-elles ?

// APRÈS (structure enrichie par adresse)
result.pickupCosts.furnitureLiftRequired; // Clair : pickup
result.pickupCosts.consumedConstraints; // Clair : pickup
result.deliveryCosts.furnitureLiftRequired; // Clair : delivery
result.deliveryCosts.consumedConstraints; // Clair : delivery
```

### ✅ 4. Sous-totaux automatiques

```typescript
// Pas besoin de recalculer
const pickupTotal = pickupCosts.total.getAmount(); // Déjà calculé

// Détail disponible
const pickupSurcharges = pickupCosts.totalSurcharges.getAmount();
const pickupEquipment = pickupCosts.totalEquipment.getAmount();
const pickupReductions = pickupCosts.totalReductions.getAmount();
```

### ✅ 5. Backward compatible

Les propriétés globales sont toujours présentes :

```typescript
result.furnitureLiftRequired; // Toujours là (global)
result.consumedConstraints; // Toujours là (global)
result.pickupCosts.furnitureLiftRequired; // + Info détaillée par adresse
result.pickupCosts.consumedConstraints; // + Info détaillée par adresse
```

---

## 🔄 Utilisation dans le Builder

Le Builder gère automatiquement la répartition :

```typescript
// Ajouter une règle
builder.addAppliedRule({
  id: "rule_123",
  name: "Escalier difficile",
  type: AppliedRuleType.CONSTRAINT,
  address: "pickup", // Spécifie l'adresse
  impact: Money(40),
  // ...
});

// Le Builder met à jour automatiquement:
// - result.pickupCosts.constraints (ajoute la règle)
// - result.pickupCosts.totalSurcharges (ajoute 40€)
// - result.pickupCosts.total (ajoute 40€)

// Configurer monte-meuble par adresse
builder.setAddressFurnitureLift("pickup", true, "Étage 5 sans ascenseur");
builder.setAddressConsumedConstraints(
  "pickup",
  ["difficult_stairs"],
  "Consommées par monte-meuble",
);

// Résultat: pickupCosts contient toutes ces infos
```

---

## 📈 Cas d'usage frontend

### 1. Affichage détaillé par étape

```tsx
<CheckoutFlow>
  <Step1>
    <h2>Adresse de départ</h2>
    <AddressCostsBreakdown costs={result.pickupCosts} />
    {result.pickupCosts.furnitureLiftRequired && (
      <MonteMenubleAlert reason={result.pickupCosts.furnitureLiftReason} />
    )}
  </Step1>

  <Step2>
    <h2>Adresse d'arrivée</h2>
    <AddressCostsBreakdown costs={result.deliveryCosts} />
  </Step2>

  <Step3>
    <h2>Services globaux</h2>
    <AddressCostsBreakdown costs={result.globalCosts} />
  </Step3>

  <Summary>
    <TotalPrice value={result.finalPrice} />
  </Summary>
</CheckoutFlow>
```

### 2. Comparaison côte à côte

```tsx
<ComparisonView>
  <Column title="Départ">
    <Cost label="Contraintes" value={pickupCosts.totalSurcharges} />
    <Cost label="Équipements" value={pickupCosts.totalEquipment} />
    <Cost label="Réductions" value={pickupCosts.totalReductions} negative />
    <Total value={pickupCosts.total} />
  </Column>

  <Column title="Arrivée">
    <Cost label="Contraintes" value={deliveryCosts.totalSurcharges} />
    <Cost label="Équipements" value={deliveryCosts.totalEquipment} />
    <Cost label="Réductions" value={deliveryCosts.totalReductions} negative />
    <Total value={deliveryCosts.total} />
  </Column>

  <Column title="Global">
    <Cost label="Services" value={globalCosts.total} />
  </Column>
</ComparisonView>
```

### 3. Alertes conditionnelles

```tsx
function SmartAlerts({ result }: { result: RuleExecutionResult }) {
  return (
    <>
      {/* Alerte si monte-meuble requis au départ */}
      {result.pickupCosts.furnitureLiftRequired && (
        <Alert type="warning">
          Monte-meuble requis au départ:{" "}
          {result.pickupCosts.furnitureLiftReason}
          <br />
          Contraintes incluses:{" "}
          {result.pickupCosts.consumedConstraints.join(", ")}
        </Alert>
      )}

      {/* Alerte si monte-meuble requis à l'arrivée */}
      {result.deliveryCosts.furnitureLiftRequired && (
        <Alert type="warning">
          Monte-meuble requis à l'arrivée:{" "}
          {result.deliveryCosts.furnitureLiftReason}
        </Alert>
      )}

      {/* Alerte si réductions disponibles */}
      {(result.pickupCosts.reductions.length > 0 ||
        result.deliveryCosts.reductions.length > 0) && (
        <Alert type="success">
          Réductions appliquées ! Vous économisez{" "}
          {result.totalReductions.getAmount()}€
        </Alert>
      )}
    </>
  );
}
```

---

## 🎯 Résumé des améliorations

| Aspect                     | Avant                    | Après                             |
| -------------------------- | ------------------------ | --------------------------------- |
| **Info monte-meuble**      | Global uniquement        | Global + par adresse              |
| **Contraintes consommées** | Global uniquement        | Global + par adresse              |
| **Sous-totaux**            | À calculer manuellement  | Pré-calculés                      |
| **Séparation surcharges**  | Mélangées                | Séparées (constraints / services) |
| **Réductions par adresse** | Non disponible           | Disponible                        |
| **Auto-suffisance**        | Besoin chercher ailleurs | Tout dans l'objet                 |
| **Frontend**               | Complexe à afficher      | Simple et direct                  |

---

**Date** : 14 octobre 2025
**Version** : 2.0 (Structure enrichie)
**Auteur** : Refactoring Phase 3+
