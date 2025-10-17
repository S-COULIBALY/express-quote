# 📍 Répartition des règles par adresse

## 🎯 Logique de répartition

Les règles sont automatiquement réparties entre **pickup**, **delivery** et **global** selon leur adresse d'application.

### Méthode `getAddressCosts()` dans RuleExecutionResultBuilder

```typescript
private getAddressCosts(address: "pickup" | "delivery" | "both" | undefined): AddressCosts {
  if (address === "pickup") {
    return this.result.pickupCosts!;
  } else if (address === "delivery") {
    return this.result.deliveryCosts!;
  } else {
    // address === "both" OU address === undefined
    return this.result.globalCosts!;
  }
}
```

## 📊 Cas d'usage

### 1. Règle spécifique au départ (`address: "pickup"`)
**Exemple:** Emballage professionnel départ
```
🔵 DÉPART:
   Services: Emballage professionnel (+120€)
```

### 2. Règle spécifique à l'arrivée (`address: "delivery"`)
**Exemple:** Déballage professionnel arrivée
```
🟢 ARRIVÉE:
   Services: Déballage professionnel (+100€)
```

### 3. Règle globale (`address: undefined`)
**Exemple:** Tarif minimum (s'applique au prix total)
```
🟡 GLOBAL:
   Règles: Tarif minimum (200€)
```

### 4. Règle présente aux DEUX adresses (`address: "both"`) ⚠️
**Traitement spécial:** La règle est **dupliquée** en pickup ET delivery

**Exemple:** Escalier difficile au départ ET à l'arrivée
```typescript
// Dans RuleEngine.ts (lignes 291-299)
if (ruleAddress === "both") {
  builder.addAppliedRule({
    ...appliedRuleDetail,
    address: "pickup",  // Première application
  });
  builder.addAppliedRule({
    ...appliedRuleDetail,
    address: "delivery", // Deuxième application
  });
}
```

**Résultat:**
```
🔵 DÉPART:
   Contraintes: Escalier difficile (+40€)

🟢 ARRIVÉE:
   Contraintes: Escalier difficile (+40€)

🟡 GLOBAL:
   (rien car la règle est séparée en pickup + delivery)
```

## 🔍 Cas particulier: Monte-meuble

Le monte-meuble est un équipement qui peut être requis à une ou deux adresses.

### Scénario 1: Monte-meuble requis UNIQUEMENT au départ
```
Contexte:
  pickupFloor: 5, pickupElevator: no    → Monte-meuble requis
  deliveryFloor: 0, deliveryElevator: - → Pas de monte-meuble

Résultat:
  address: "pickup"

🔵 DÉPART:
   Équipements: Monte-meuble (+300€)
🟢 ARRIVÉE:
   (rien)
🟡 GLOBAL:
   (rien)
```

### Scénario 2: Monte-meuble requis aux DEUX adresses
```
Contexte:
  pickupFloor: 8, pickupElevator: no    → Monte-meuble requis
  deliveryFloor: 7, deliveryElevator: small → Monte-meuble requis

Résultat:
  address: "both" → Dupliqué en pickup + delivery

🔵 DÉPART:
   Équipements: Monte-meuble (+300€)
🟢 ARRIVÉE:
   Équipements: Monte-meuble (+300€)
🟡 GLOBAL:
   (rien)

Total: 600€ (2 monte-meubles) ✅
```

**Pourquoi 2 monte-meubles?**
- Un monte-meuble est nécessaire au départ (étage 8)
- Un autre monte-meuble est nécessaire à l'arrivée (étage 7)
- Ce sont deux opérations distinctes qui nécessitent chacune leur équipement

## ✅ Global vide = Normal!

Il est **parfaitement normal** que `globalCosts` soit vide (Total: 0€) dans certains tests.

Cela arrive quand:
- ✅ Toutes les règles ont une adresse spécifique (pickup ou delivery)
- ✅ Toutes les règles "both" ont été séparées en pickup + delivery
- ✅ Aucune règle vraiment globale (tarif minimum, etc.) n'est appliquée

### Exemple de test avec global vide

```
📍 Coûts détaillés par adresse:

   🔵 DÉPART:
      Total: 23€
      Surcharges: 23€ (3 règles)
      Équipements: 0€ (0 règles)

   🟢 ARRIVÉE:
      Total: 15€
      Surcharges: 15€ (2 règles)
      Équipements: 0€ (0 règles)

   🟡 GLOBAL:
      Total: 0€          ← Normal! Pas de règles globales
      Surcharges: 0€ (0 règles)
      Équipements: 0€ (0 règles)
```

## 📝 Quand le global contient des règles?

Le global contient des règles dans ces cas:

### 1. Tarif minimum
```typescript
if (minimumPrice !== null && finalPrice >= minimumPrice) {
  builder.addAppliedRule({
    name: "Tarif minimum",
    address: undefined,  // → Ira dans global
    ...
  });
}
```

### 2. Règles sans adresse définie
Règles dont la condition ne mentionne ni pickup ni delivery, et qui ne sont pas dans les contraintes logistiques.

**Exemple:** Majoration week-end
```typescript
{
  name: "Majoration week-end",
  condition: { type: "temporal", day: "weekend" },
  address: undefined  // → Ira dans global
}
```

## 🎯 Résumé

| Adresse | Destination | Exemple |
|---------|-------------|---------|
| `"pickup"` | 🔵 DÉPART | Escalier au départ uniquement |
| `"delivery"` | 🟢 ARRIVÉE | Escalier à l'arrivée uniquement |
| `"both"` | 🔵 + 🟢 (dupliqué) | Escalier aux deux adresses |
| `undefined` | 🟡 GLOBAL | Tarif minimum, majoration week-end |

**Note importante:** Quand `address === "both"`, la règle n'apparaît **jamais** dans global car elle est automatiquement séparée en pickup + delivery par RuleEngine.
