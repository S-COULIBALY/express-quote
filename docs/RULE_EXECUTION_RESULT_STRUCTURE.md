# 🧩 RuleExecutionResult

### Structure enrichie des résultats par adresse (pickup / delivery)

---

## 🎯 Objectif

Ce modèle fournit une **vue détaillée et structurée** du résultat de l'application des règles tarifaires par adresse.  
Chaque adresse (`pickup` et `delivery`) dispose de ses propres sections pour les contraintes, services, équipements et réductions,  
avec un calcul automatique des totaux et une agrégation finale.

---

## ✅ Exemple JSON complet et cohérent

```json
{
  "basePrice": 100,
  "appliedRules": {
    "pickupCosts": {
      "surcharges": {
        "constraints-logistiques": [
          { "Escalier difficile ou dangereux": 40 },
          { "Couloirs étroits ou encombrés": 25 },
          { "Accès camion limité": 30 },
          { "TotalContraintes": 95 }
        ],
        "services-supplementaires": [
          { "Aide au portage": 50 },
          { "Emballage des objets fragiles": 30 },
          { "TotalServices": 80 }
        ]
      },
      "equipment": [
        { "Monte-meubles": 300 },
        { "Chariot de transport": 15 },
        { "TotalEquipement": 315 }
      ],
      "furnitureLiftRequired": true,
      "consumedConstraints": [
        "Escalier difficile ou dangereux",
        "Couloirs étroits ou encombrés"
      ],
      "reductions": [{ "Remise fidélité": -20 }, { "TotalReductions": -20 }]
    },
    "deliveryCosts": {
      "surcharges": {
        "constraints-logistiques": [
          { "Stationnement difficile": 20 },
          { "Accès étroit à l'immeuble": 25 },
          { "TotalContraintes": 45 }
        ],
        "services-supplementaires": [
          { "Déballage sur place": 25 },
          { "Montage des meubles": 35 },
          { "TotalServices": 60 }
        ]
      },
      "equipment": [
        { "Monte-meubles": 300 },
        { "Protection sol & murs": 20 },
        { "Diable de manutention": 10 },
        { "TotalEquipement": 330 }
      ],
      "furnitureLiftRequired": false,
      "consumedConstraints": [],
      "reductions": [{ "Remise code promo": -10 }, { "TotalReductions": -10 }]
    }
  },
  "totauxGeneraux": {
    "totalPickup": 470,
    "totalDelivery": 425,
    "totalReductions": -30,
    "prixFinalGlobal": 865
  }
}
```

## 🧱 Interface TypeScript correspondante

```typescript
export interface RuleExecutionResultByAddress {
  basePrice: number; // Prix de base avant application des règles

  appliedRules: {
    pickupCosts: AddressRuleBreakdown;
    deliveryCosts: AddressRuleBreakdown;
  };

  totauxGeneraux: {
    totalPickup: number;
    totalDelivery: number;
    totalReductions: number;
    prixFinalGlobal: number;
  };
}

export interface AddressRuleBreakdown {
  surcharges: {
    "constraints-logistiques": RuleAmount[];
    "services-supplementaires": RuleAmount[];
  };
  equipment: RuleAmount[];
  furnitureLiftRequired: boolean;
  consumedConstraints: string[];
  reductions: RuleAmount[];
}

export interface RuleAmount {
  [ruleName: string]: number;
}
```

## 💰 Vérification de la cohérence

| Catégorie                | Pickup (€) | Delivery (€) | Total (€)          |
| ------------------------ | ---------- | ------------ | ------------------ |
| Contraintes logistiques  | 95         | 45           | 140                |
| Services supplémentaires | 80         | 60           | 140                |
| Équipements              | 315        | 330          | 345                |
| Réductions               | -20        | -10          | -30                |
| **Totaux**               | **470**    | **425**      | **895 - 30 = 865** |

✅ Prix final global cohérent : 100 (base) + 865 (charges nettes) = 965 € TTC

## 🧩 Structure hiérarchique claire

- **basePrice / finalPrice** → prix avant/après règles

- **appliedRules** → séparation stricte entre départ (pickupCosts) et arrivée (deliveryCosts)

- **Chaque adresse contient :**
  - `surcharges` → contraintes logistiques + services supplémentaires
  - `equipment` → équipements spécifiques
  - `furnitureLiftRequired` → booléen de détection monte-meubles
  - `consumedConstraints` → contraintes absorbées par un équipement (ex. monte-meubles)
  - `reductions` → remises appliquées localement

- **totauxGeneraux** → synthèse globale des coûts pour toute l'opération
