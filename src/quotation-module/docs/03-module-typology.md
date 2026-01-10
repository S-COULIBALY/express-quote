# 📊 Typologie des modules

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## Guide de décision : Quand utiliser `isApplicable()` ?

**Règle fondamentale** : `isApplicable()` est **optionnel par design**, pas par oubli.

### 🟢 Type A — Modules inconditionnels (systématiques)

**Caractéristiques** :
- ✅ Toujours exécutés
- ✅ Ne nécessitent aucune condition métier
- ✅ Leur exécution dépend uniquement de l'ordre du pipeline
- ✅ **PAS de `isApplicable()`** (inutile et redondant)

**Exemples** :
- `DistanceModule` : Calcule toujours la distance
- `FuelCostModule` : Calcule toujours le coût carburant
- `InsurancePremiumModule` : Calcule toujours la prime d'assurance

**Exemple de code** :
```typescript
export class DistanceModule implements QuoteModule {
  id = "DISTANCE";
  description = "Calcul de la distance réelle";
  priority = 15;
  // ❌ PAS de isApplicable() - module systématique

  apply(ctx: QuoteContext): void {
    const km = this.computeDistance(
      ctx.departureAddress,
      ctx.arrivalAddress
    );
    ctx.computed!.distanceKm = km;
    ctx.computed!.activatedModules.push(this.id);
  }

  private computeDistance(from: string, to: string): number {
    // Calcul de distance réel (API, etc.)
    return 8; // Exemple: Paris 11 → Paris 17
  }
}
```

### 🟡 Type B — Modules conditionnels métier

**Caractéristiques** :
- ✅ Exécutés uniquement si certaines conditions sont vraies
- ✅ Conditions explicites et lisibles
- ✅ Décision métier claire
- ✅ **`isApplicable()` OBLIGATOIRE**

**Exemples** :
- `NoElevatorPickupModule` : Si étage > 0 ET pas d'ascenseur
- `MonteMeublesRecommendationModule` : Si mobilier encombrant + étage élevé
- `WeekendModule` : Si jour = samedi ou dimanche
- `EndOfMonthModule` : Si jour >= 25

**Exemple de code** :
```typescript
export class NoElevatorPickupModule implements QuoteModule {
  id = "NO_ELEVATOR_PICKUP";
  description = "Surcoût absence d'ascenseur au départ";
  priority = 40;
  // ✅ isApplicable() OBLIGATOIRE - module conditionnel

  isApplicable(ctx: QuoteContext): boolean {
    return (
      (ctx.pickupFloor ?? 0) > 0 &&
      ctx.pickupHasElevator === false
    );
  }

  apply(ctx: QuoteContext): void {
    const floor = ctx.pickupFloor ?? 0;
    const surchargePerFloor = 50;
    const surcharge = floor * surchargePerFloor;

    ctx.computed!.costs.push({
      moduleId: this.id,
      label: `Absence d'ascenseur au départ (étage ${floor})`,
      amount: surcharge,
      category: "LABOR"
    });

    ctx.computed!.riskContributions.push({
      moduleId: this.id,
      amount: floor * 2,
      reason: `Étage ${floor} sans ascenseur`
    });

    ctx.computed!.activatedModules.push(this.id);
  }
}
```

### 🔴 Type C — Modules déclenchés par état calculé (post-modules)

**Caractéristiques** :
- ✅ Dépendent d'un autre module activé
- ✅ Dépendent d'un choix utilisateur explicite
- ✅ Dépendent d'un flag calculé
- ✅ **`isApplicable()` OBLIGATOIRE avec vérification de dépendances**

**Exemples** :
- `MonteMeublesRefusalImpactModule` : Si monte-meubles recommandé ET refusé
- `ManualReviewModule` : Si riskScore > seuil
- `InsuranceExclusionModule` : Si valeur déclarée insuffisante

**Exemple de code** :
```typescript
export class MonteMeublesRefusalImpactModule implements QuoteModule {
  id = "MONTE_MEUBLES_REFUSAL_IMPACT";
  description = "Conséquences du refus du monte-meubles recommandé";
  priority = 80;
  dependencies = ["MONTE_MEUBLES_RECOMMENDATION"];
  // ✅ isApplicable() OBLIGATOIRE - dépend d'un autre module

  isApplicable(ctx: QuoteContext): boolean {
    return (
      ctx.refuseLiftDespiteRecommendation === true &&
      ctx.computed?.activatedModules.includes("MONTE_MEUBLES_RECOMMENDATION") === true
    );
  }

  apply(ctx: QuoteContext): void {
    // Conséquences juridiques, assurance, risque, pricing
    ctx.computed!.legalImpacts.push({
      type: "LIMITATION",
      description: "Responsabilité limitée en cas de dommages liés à la manutention manuelle",
      moduleId: this.id
    });

    ctx.computed!.costs.push({
      moduleId: this.id,
      label: "Surcoût manutention sans monte-meubles",
      amount: 120,
      category: "RISK"
    });

    ctx.computed!.riskContributions.push({
      moduleId: this.id,
      amount: 25,
      reason: "Refus monte-meubles recommandé"
    });

    ctx.computed!.activatedModules.push(this.id);
  }
}
```

### Tableau récapitulatif

| Type | Exemples | `isApplicable()` | Justification |
|------|----------|------------------|---------------|
| **A - Inconditionnel** | Distance, Fuel, Insurance | ❌ **NON** | Toujours exécuté |
| **B - Conditionnel métier** | NoElevator, Weekend, EndOfMonth | ✅ **OUI** | Condition métier explicite |
| **C - Déclenché par état** | RefusalImpact, ManualReview | ✅ **OUI** | Dépendance d'un autre module |

---

## ⚠️ IMPORTANT : Distinction Type vs Phase

**La typologie (Type A/B/C) est indépendante de la phase du pipeline.**

- Un module Type C peut s'exécuter très tôt (ex: `VolumeUncertaintyRiskModule` en PHASE 2)
- Un module Type A peut s'exécuter tard (ex: `InsurancePremiumModule` en PHASE 7)
- **La priorité détermine la phase, pas le type.**

Pour plus de détails sur les phases, voir [Phases du pipeline](./04-pipeline-phases.md).

---

## 🔀 Séparation Requirements / Cross-Selling

### Principe fondamental

**Un module métier déclare un BESOIN, pas une VENTE.**

### Requirements (Besoins métier)

Les `requirements` sont des **vérités métier** déclarées par les modules :

```typescript
ctx.computed!.requirements.push({
  type: "LIFT_RECOMMENDED",
  severity: "HIGH",
  reason: "Bulky furniture + étage élevé sans ascenseur",
  moduleId: "MONTE_MEUBLES_RECOMMENDATION"
});
```

**Caractéristiques** :
- Déclaré par un module métier
- Vérité terrain, pas marketing
- Utilisé pour : contrat, terrain, juridique
- **NE PROPOSE PAS** de service à vendre

### Cross-Selling (Propositions de vente)

Les `crossSellProposals` sont des **propositions commerciales** basées sur les requirements :

```typescript
// Module cross-selling séparé qui transforme un requirement en proposition
if (ctx.computed.requirements.some(r => r.type === "LIFT_RECOMMENDED")) {
  ctx.computed!.crossSellProposals.push({
    id: "MONTE_MEUBLES",
    label: "Location monte-meubles",
    reason: "Recommandé pour garantir la sécurité",
    benefit: "Réduction du risque de casse",
    priceImpact: 350,
    optional: true,
    moduleId: "CROSS_SELL_LIFT",
    basedOnRequirement: "LIFT_RECOMMENDED"
  });
}
```

**Caractéristiques** :
- Déclaré par un module cross-selling dédié
- Basé sur un ou plusieurs requirements
- Utilisé pour : UI, vente
- **PROPOSE** un service à vendre

### Flux complet

```
1. Module métier détecte un besoin
   ↓
2. Déclare un requirement
   ↓
3. Module cross-selling (séparé) détecte le requirement
   ↓
4. Transforme en proposition commerciale
   ↓
5. UI affiche la proposition
   ↓
6. Client accepte/refuse
   ↓
7. Si refusé, module d'impact gère les conséquences
```

### Exemple concret : Monte-meubles

```typescript
// 1. Module métier déclare le besoin
export class MonteMeublesRecommendationModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    ctx.computed!.requirements.push({
      type: "LIFT_RECOMMENDED",
      severity: "HIGH",
      reason: "Étage élevé sans ascenseur + mobilier encombrant",
      moduleId: this.id
    });
  }
}

// 2. Module cross-selling transforme en proposition
export class CrossSellLiftModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    const liftRequired = ctx.computed!.requirements.some(
      r => r.type === "LIFT_RECOMMENDED"
    );
    
    if (liftRequired) {
      ctx.computed!.crossSellProposals.push({
        id: "MONTE_MEUBLES",
        label: "Location monte-meubles",
        reason: "Recommandé pour garantir la sécurité",
        benefit: "Réduction du risque de casse et gain de temps",
        priceImpact: 350,
        optional: true,
        moduleId: this.id,
        basedOnRequirement: "LIFT_RECOMMENDED"
      });
    }
  }
}

// 3. Si refusé, module d'impact gère les conséquences
export class MonteMeublesRefusalImpactModule implements QuoteModule {
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.refuseLiftDespiteRecommendation === true &&
           ctx.computed?.requirements.some(r => r.type === "LIFT_RECOMMENDED");
  }
  
  apply(ctx: QuoteContext): void {
    // Conséquences juridiques, assurance, risque, pricing
    // ...
  }
}
```

---

## 📚 Références

- [Types fondamentaux](./02-types-and-interfaces.md) : Définition de `Requirement` et `CrossSellProposal`
- [Phases du pipeline](./04-pipeline-phases.md) : Ordre d'exécution des modules
- [Règles et interdictions](./08-rules-and-prohibitions.md) : Erreurs à éviter

