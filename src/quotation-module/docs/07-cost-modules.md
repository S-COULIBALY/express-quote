# 💰 Modules de coût structurels (INDISPENSABLES)

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## 💰 Modules de coût structurels (INDISPENSABLES)

### Pourquoi ces modules sont critiques

**Sans modules de coût structurels, le moteur n'est qu'un simulateur, pas un vrai devis.**

Les modules de coût permettent de :
- ✅ Maîtriser la rentabilité (coûts réels + marge)
- ✅ Expliquer un prix au client ou au terrain
- ✅ Ajuster selon le trafic, les imprévus
- ✅ Garantir un devis économiquement viable

### Principe fondamental

⚠️ **Règle d'or** : Les modules de coût sont **séparés** des autres types de modules :
- ❌ Pas mélangés avec les modules de risque
- ❌ Pas mélangés avec les modules juridiques
- ❌ Pas mélangés avec les modules cross-selling

**Chaque coût = un module isolé, traçable, explicable.**

### Typologie des modules de coût

#### A. 🚚 Transport & déplacement

**DISTANCE_MODULE** (priorité 15)
- Calcule la distance réelle (km)
- Aller + retour
- Temps estimé selon trafic IDF

**FUEL_COST_MODULE** (priorité 25)
- Dépend de : distance, type de camion, trafic IDF
- Coût carburant aller-retour

**TOLL_COST_MODULE** (priorité 25)
- 0 en IDF (gratuit)
- Critique pour Paris → Province

#### B. 👷 Main-d'œuvre

**LABOR_BASE_MODULE** (priorité 30)
- Nombre de déménageurs × heures standard
- Dépend du volume + accès

**LABOR_ACCESS_PENALTY_MODULE** (priorité 35)
- Surcoût pour : étages, absence ascenseur, distance portage
- Pénalité d'accès difficile

#### C. 🚛 Véhicule

**VEHICLE_RENTAL_MODULE** (priorité 20)
- Camion 12m³ / 20m³ / 30m³
- Journée ou demi-journée
- Dépend du volume calculé

#### D. 🧱 Contraintes & options impactant le coût

**MONTE_MEUBLES_COST_MODULE** (priorité 50)
- Si monte-meubles accepté
- Coût de location

**MANUAL_HANDLING_RISK_COST_MODULE** (priorité 60)
- Si monte-meubles recommandé mais refusé
- Surcoût pour risque manutention manuelle

#### E. 🧾 Assurance & administratif

**INSURANCE_PREMIUM_MODULE** (priorité 70)
- Dépend de `declaredValue`
- Prime d'assurance calculée

### Exemple concret : Calcul complet

**Input** :
- Paris 11 → Paris 17
- Volume : 28 m³
- 5e étage sans ascenseur
- Volume confidence : LOW
- Monte-meubles recommandé mais refusé

**Modules de coût activés** :

| Module | Coût | Catégorie |
|--------|------|-----------|
| DISTANCE | 8 km | TRANSPORT |
| FUEL_COST | ~5€ | TRANSPORT |
| VEHICLE_RENTAL | 280€ | VEHICLE |
| LABOR_BASE | 720€ | LABOR |
| LABOR_ACCESS_PENALTY | 380€ | LABOR |
| MANUAL_HANDLING_RISK_COST | 120€ | RISK |
| INSURANCE_PREMIUM | 75€ | INSURANCE |
| **TOTAL COÛTS** | **≈ 1 580€** | |

**Calcul du prix** :
- Coûts totaux : 1 580€
- Marge (30%) : 474€
- **Prix de base** : 2 054€
- Ajustements (fin de mois, week-end, etc.) : +X€
- **Prix final** : 2 054€ + ajustements

### Structure des modules de coût

```typescript
// Exemple : FUEL_COST_MODULE
export class FuelCostModule implements QuoteModule {
  id = "FUEL_COST";
  description = "Coût carburant aller-retour";
  priority = 25;
  dependencies = ["DISTANCE"];

  isApplicable(ctx: QuoteContext): boolean {
    return !!ctx.computed?.distanceKm;
  }

  apply(ctx: QuoteContext): void {
    const km = ctx.computed!.distanceKm!;
    const fuelCostPerKm = 0.35; // Camion IDF
    const cost = km * 2 * fuelCostPerKm; // aller-retour

    ctx.computed!.costs.push({
      moduleId: this.id,
      label: "Carburant (aller-retour)",
      amount: cost,
      category: "TRANSPORT",
      metadata: {
        distanceKm: km,
        fuelCostPerKm,
        roundTrip: true
      }
    });

    ctx.computed!.activatedModules.push(this.id);
  }
}
```

### Intégration dans le calcul de prix

Le moteur calcule le prix de base ainsi :

```typescript
// 1. Tous les modules de coût s'exécutent
// 2. Le moteur somme les coûts
const totalCosts = ctx.computed.costs.reduce((sum, cost) => sum + cost.amount, 0);

// 3. Application de la marge
const marginRate = 0.30; // Configurable
const basePrice = totalCosts * (1 + marginRate);

// 4. Application des ajustements (surcharges, réductions)
const finalPrice = basePrice + adjustments;
```

---

## 🔗 Voir aussi

- [Types fondamentaux](./02-types-and-interfaces.md) - Interface Cost
- [Phases du pipeline](./04-pipeline-phases.md) - Organisation par phases
- [Système d'exécution](./05-execution-engine.md) - Calcul du prix de base

