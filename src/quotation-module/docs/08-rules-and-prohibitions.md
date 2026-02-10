# 🚫 Interdictions absolues

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## 🚫 Interdictions absolues

### Règles strictes à respecter

Le PROMPT SYSTÈME définit **4 interdictions absolues** :

#### ❌ 1. Pas de calcul direct dans le formulaire

**Interdit** :
- Calculer le prix dans le frontend
- Appliquer des règles métier dans le formulaire
- Valider des règles métier côté client

**Autorisé** :
- Collecte de données uniquement
- Validation de format (email, téléphone, etc.)
- Affichage des résultats du moteur

---

#### ❌ 2. Pas de logique métier dans le front

**Interdit** :
- Règles métier dans les composants React
- Calculs de prix dans le frontend
- Décisions métier dans l'UI

**Autorisé** :
- Affichage conditionnel basé sur les résultats du moteur
- Formatage des données pour l'affichage
- Interactions utilisateur (clics, saisies)

---

#### ❌ 3. Pas de dépendance circulaire entre modules

**Interdit** :
- Module A dépend de Module B qui dépend de Module A
- Boucles de dépendances

**Autorisé** :
- Dépendances linéaires : A → B → C
- Dépendances multiples : D dépend de A et B

**Exemple interdit** :
```typescript
// ❌ MAUVAIS : Dépendance circulaire
export class ModuleA implements QuoteModule {
  dependencies = ["MODULE_B"];
  // ...
}

export class ModuleB implements QuoteModule {
  dependencies = ["MODULE_A"]; // ❌ CIRCULAIRE
  // ...
}
```

**Exemple autorisé** :
```typescript
// ✅ BON : Dépendance linéaire
export class VolumeEstimationModule implements QuoteModule {
  id = "VOLUME_ESTIMATION";
  priority = 20;
  // Pas de dépendance
}

export class VehicleSelectionModule implements QuoteModule {
  id = "VEHICLE_SELECTION";
  priority = 30;
  dependencies = ["VOLUME_ESTIMATION"]; // ✅ Dépend de VolumeEstimation
}
```

---

#### ❌ 4. Pas de modules "fourre-tout"

**Interdit** :
- Module qui fait plusieurs choses non liées
- Module qui gère plusieurs responsabilités
- Module qui recalcule ce que d'autres ont produit

**Autorisé** :
- Module avec responsabilité unique
- Module qui produit ses propres effets
- Module qui déclare des besoins métier

**Exemple interdit** :
```typescript
// ❌ MAUVAIS : Module fourre-tout
export class AllInOneModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    // Calcule le volume
    ctx.computed!.baseVolume = (ctx.estimatedVolume ?? 0) * 1;
    // Calcule le prix
    ctx.computed!.basePrice = 1000;
    // Ajuste le risque
    ctx.computed!.riskScore = 50;
    // Ajoute des flags
    ctx.computed!.operationalFlags.push("FLAG1");
    // ❌ Trop de responsabilités
  }
}
```

**Exemple autorisé** :
```typescript
// ✅ BON : Modules séparés, responsabilité unique
export class VolumeEstimationModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    ctx.computed!.baseVolume = (ctx.estimatedVolume ?? 0) * 1;
  }
}

export class PriceAggregationModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    // Agrège les coûts (fait par le moteur normalement)
  }
}
```

---

## ⚠️ Erreurs critiques à éviter

### ❌ Erreur 1 : Module "finalisateur" qui recalcule

**FAUX** :
```typescript
// ❌ MAUVAIS : Module qui recalcule le risque
export class RiskScoreModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    // Recalcule le risque depuis d'autres données
    let risk = 0;
    if (ctx.volumeConfidence === "LOW") risk += 10;
    if (ctx.multiplePickupPoints) risk += 5;
    // ... duplique la logique des autres modules
    ctx.computed!.riskScore = risk;
  }
}
```

**CORRECT** :
```typescript
// ✅ BON : Module qui contribue au risque
export class VolumeUncertaintyRiskModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    if (ctx.volumeConfidence === "LOW") {
      ctx.computed!.riskContributions.push({
        moduleId: this.id,
        amount: 10,
        reason: "Volume incertain (confiance faible)"
      });
    }
  }
}

// Le moteur agrège ensuite :
// ctx.computed.riskScore = sum(riskContributions)
```

### ❌ Erreur 2 : Module qui initialise ctx.computed

**FAUX** :
```typescript
// ❌ MAUVAIS : Module qui initialise
export class VolumeEstimationModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    if (!ctx.computed) {
      ctx.computed = { /* ... */ }; // ❌ JAMAIS
    }
    // ...
  }
}
```

**CORRECT** : Le moteur initialise toujours `ctx.computed` avant d'exécuter les modules.

### ❌ Erreur 3 : Module métier qui fait du cross-selling

**FAUX** :
```typescript
// ❌ MAUVAIS : Module métier qui propose la vente
export class MonteMeublesRecommendationModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    ctx.computed!.crossSellProposals.push({
      id: "MONTE_MEUBLES",
      label: "Location monte-meubles",
      // ... ❌ C'est du marketing, pas de la logique métier
    });
  }
}
```

**CORRECT** :
```typescript
// ✅ BON : Module métier déclare un besoin
export class MonteMeublesRecommendationModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    ctx.computed!.requirements.push({
      type: "LIFT_RECOMMENDED",
      severity: "HIGH",
      reason: "Bulky furniture + étage élevé sans ascenseur",
      moduleId: this.id
    });
  }
}

// Un module cross-selling séparé transforme ensuite le requirement en proposition
```

### ❌ Erreur 4 : Module qui fait trop de choses

**FAUX** :
```typescript
// ❌ MAUVAIS : Module qui fait tout
export class VolumeBaseModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    // Calcule le volume
    ctx.computed!.baseVolume = (ctx.estimatedVolume ?? 0) * 1;
    // Ajuste le risque
    ctx.computed!.riskScore = (ctx.computed!.riskScore || 0) + 10;
    // Ajoute des metadata UI
    ctx.computed!.metadata.volumeSource = "SURFACE";
    // ... trop de responsabilités
  }
}
```

**CORRECT** :
```typescript
// ✅ BON : Modules séparés, responsabilité unique
export class VolumeEstimationModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    ctx.computed!.baseVolume = (ctx.estimatedVolume ?? 0) * 1;
    ctx.computed!.adjustedVolume = ctx.computed!.baseVolume;
  }
}

export class VolumeUncertaintyRiskModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    if (ctx.volumeConfidence === "LOW") {
      ctx.computed!.riskContributions.push({
        moduleId: this.id,
        amount: 10,
        reason: "Volume incertain"
      });
    }
  }
}
```

### ❌ Erreur 5 : Omission des modules de coût structurels

**FAUX** :
```typescript
// ❌ MAUVAIS : Prix calculé arbitrairement sans coûts réels
export class BasePriceModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    ctx.computed!.basePrice = 1000; // ❌ Prix arbitraire, pas de traçabilité
  }
}
```

**CORRECT** :
```typescript
// ✅ BON : Coûts structurels déclarés par modules séparés
// Le moteur calcule ensuite : basePrice = sum(costs) * (1 + marge)

export class FuelCostModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    ctx.computed!.costs.push({
      moduleId: this.id,
      label: "Carburant",
      amount: calculatedFuelCost,
      category: "TRANSPORT"
    });
  }
}

// Le moteur fait ensuite :
// basePrice = sum(ctx.computed.costs) * (1 + marginRate)
```

### ❌ Erreur 6 : Omission de `isApplicable()` pour un module conditionnel

**FAUX** :
```typescript
// ❌ MAUVAIS : Module conditionnel sans isApplicable()
export class NoElevatorPickupModule implements QuoteModule {
  id = "NO_ELEVATOR_PICKUP";
  priority = 40;
  // ❌ Pas de isApplicable() alors que c'est un module conditionnel

  apply(ctx: QuoteContext): void {
    // S'exécute toujours, même si pas d'étage ou ascenseur présent
    const surcharge = (ctx.pickupFloor ?? 0) * 50;
    // ...
  }
}
```

**CORRECT** :
```typescript
// ✅ BON : Module conditionnel avec isApplicable()
export class NoElevatorPickupModule implements QuoteModule {
  id = "NO_ELEVATOR_PICKUP";
  priority = 40;
  
  isApplicable(ctx: QuoteContext): boolean {
    return (ctx.pickupFloor ?? 0) > 0 && ctx.pickupHasElevator === false;
  }

  apply(ctx: QuoteContext): void {
    // S'exécute uniquement si la condition est vraie
    // ...
  }
}
```

### ❌ Erreur 7 : `isApplicable()` inutile pour un module systématique

**FAUX** :
```typescript
// ❌ MAUVAIS : isApplicable() inutile pour un module systématique
export class DistanceModule implements QuoteModule {
  id = "DISTANCE";
  priority = 15;
  
  isApplicable(ctx: QuoteContext): boolean {
    return true; // ❌ Toujours true = inutile
  }

  apply(ctx: QuoteContext): void {
    // ...
  }
}
```

**CORRECT** :
```typescript
// ✅ BON : Pas de isApplicable() pour un module systématique
export class DistanceModule implements QuoteModule {
  id = "DISTANCE";
  priority = 15;
  // Pas de isApplicable() - module systématique

  apply(ctx: QuoteContext): void {
    // Toujours exécuté
    // ...
  }
}
```

### ❌ Erreur 8 : Module qui ignore les contraintes IDF

**FAUX** :
```typescript
// ❌ MAUVAIS : Sélection véhicule simpliste
export class VehicleSelectionModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    const volume = ctx.computed!.adjustedVolume!;
    ctx.computed!.vehicleCount = Math.ceil(volume / 20);
    // ❌ Ignore les contraintes urbaines IDF
  }
}
```

**CORRECT** :
```typescript
// ✅ BON : Prise en compte des contraintes IDF
export class VehicleSelectionModule implements QuoteModule {
  apply(ctx: QuoteContext): void {
    const volume = ctx.computed!.adjustedVolume!;
    let vehicleCount = Math.ceil(volume / 20);
    
    // Contraintes IDF
    if (ctx.urbanZoneType === "PARIS" || ctx.pickupStreetNarrow || ctx.deliveryStreetNarrow) {
      // Rues étroites = véhicules plus petits
      vehicleCount = Math.ceil(volume / 15);
      ctx.computed!.operationalFlags.push("SMALL_VEHICLES_REQUIRED");
    }
    
    if (ctx.pickupParkingAuthorizationRequired || ctx.deliveryParkingAuthorizationRequired) {
      ctx.computed!.operationalFlags.push("PARKING_AUTHORIZATION_REQUIRED");
    }
    
    ctx.computed!.vehicleCount = vehicleCount;
  }
}
```

---

## 🔗 Voir aussi

- [Typologie des modules](./03-module-typology.md) - Types A/B/C et `isApplicable()`
- [Système d'exécution](./05-execution-engine.md) - Initialisation par le moteur
- [Modules de coût](./07-cost-modules.md) - Coûts structurels indispensables

