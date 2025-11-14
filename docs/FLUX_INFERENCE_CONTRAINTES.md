# 🔄 Flux Complet : Inférence des Contraintes depuis la Soumission du Formulaire

**Date**: 2025-01-27  
**Version**: 1.0  
**Objectif**: Expliquer le flux complet depuis la soumission du formulaire frontend jusqu'à l'inférence des contraintes

---

## 📋 Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Flux détaillé étape par étape](#2-flux-détaillé-étape-par-étape)
3. [Moment exact de l'inférence](#3-moment-exact-de-linférence)
4. [Exemple concret avec logs](#4-exemple-concret-avec-logs)
5. [Diagramme de séquence](#5-diagramme-de-séquence)

---

## 1. 🎯 Vue d'ensemble

### 1.1 Principe

L'**inférence des contraintes** se fait **uniquement lors de la soumission finale** du formulaire, dans le contexte du calcul de prix côté serveur. Elle ne se fait **PAS** lors des calculs en temps réel pendant la saisie.

### 1.2 Deux scénarios de calcul

| Scénario | Quand ? | Inférence activée ? |
|----------|---------|---------------------|
| **Calcul temps réel** | Pendant la saisie (onChange) | ❌ NON (mode draft) |
| **Calcul soumission** | Bouton "Réserver maintenant" | ✅ OUI (mode final) |

### 1.3 Point d'inférence

L'inférence se fait dans **`RuleContextEnricher.detectRequirements()`** qui appelle **`AutoDetectionService.detectFurnitureLift()`** avec `submissionContext: 'final'`.

---

## 2. 📊 Flux détaillé étape par étape

### Étape 1 : Frontend - Soumission du formulaire

**Fichier**: `src/hooks/shared/useCentralizedPricing.ts`

```typescript
// Le client remplit le formulaire et clique sur "Réserver maintenant"
const response = await fetch('/api/price/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    serviceType: 'MOVING',
    pickupFloor: 6,                    // ✅ Client déclare l'étage
    pickupElevator: 'no',              // ✅ Client déclare pas d'ascenseur
    pickupLogisticsConstraints: [      // ✅ Client a coché seulement "Escalier difficile"
      '40acdd70-5c1f-4936-a53c-8f52e6695a4c'  // UUID "Escalier difficile"
    ],
    // ❌ Client a OUBLIÉ de cocher "Couloirs étroits" et "Meubles encombrants"
    volume: 25,
    // ... autres données
  })
});
```

**État des contraintes** :
- ✅ **Déclarées** : `['40acdd70-5c1f-4936-a53c-8f52e6695a4c']` (Escalier difficile)
- ❌ **Oubliées** : Couloirs étroits, Meubles encombrants, Objets lourds, etc.

---

### Étape 2 : API Route - Réception de la requête

**Fichier**: `src/app/api/price/calculate/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const controller = new PriceController();
  const response = await controller.calculatePrice(request);
  return response;
}
```

**Action** : Délègue au contrôleur.

---

### Étape 3 : PriceController → PriceService

**Fichier**: `src/quotation/interfaces/http/controllers/PriceController.ts`

```typescript
async calculatePrice(request: NextRequest) {
  const priceService = new PriceService();
  return await priceService.calculatePrice(requestBody);
}
```

**Action** : Délègue au service de calcul de prix.

---

### Étape 4 : PriceService - Création du QuoteContext

**Fichier**: `src/quotation/application/services/PriceService.ts`

```typescript
async calculatePrice(request: PriceCalculationRequest) {
  // 1. Validation des données
  this.validateCalculationRequest(request);

  // 2. Créer le contexte de calcul
  const context = await this.createQuoteContext(request);
  // context contient maintenant:
  // - pickupFloor: 6
  // - pickupElevator: 'no'
  // - pickupLogisticsConstraints: ['40acdd70-5c1f-4936-a53c-8f52e6695a4c']
  // - volume: 25

  // 3. Calculer le prix avec le QuoteCalculator
  const quote = await this.quoteCalculator.calculateQuote(
    request.serviceType, 
    context
  );
}
```

**État** : Le contexte contient les données brutes du formulaire, **sans inférence encore**.

---

### Étape 5 : QuoteCalculator - Sélection de la stratégie

**Fichier**: `src/quotation/application/services/QuoteCalculator.ts`

```typescript
public async calculateQuote(serviceType: string, context: QuoteContext) {
  // Charger les stratégies
  await loadStrategies();
  
  // Obtenir la stratégie appropriée (ex: MovingQuoteStrategy)
  const strategy = getStrategy(serviceType);
  
  // Calculer le devis avec la stratégie
  const quote = await strategy.calculate(context);
  return quote;
}
```

**Action** : Sélectionne la stratégie appropriée selon le type de service.

---

### Étape 6 : Strategy - Chargement des règles et appel RuleEngine

**Fichier**: `src/quotation/application/strategies/MovingQuoteStrategy.ts` (ou CleaningQuoteStrategy.ts)

```typescript
async calculate(context: QuoteContext): Promise<Quote> {
  // 1. Recharger les règles métier depuis la BDD
  await this.initializeRulesWithContext(context);
  // Règles chargées: 45 règles MOVING depuis la BDD

  // 2. Enrichir le contexte (si nécessaire)
  const enrichedContext = await this.enrichContext(context);

  // 3. Calculer le prix de base
  const basePrice = await this.getBasePrice(enrichedContext);

  // 4. ⚠️ MOMENT CRITIQUE: Appel du RuleEngine
  const ruleResult = this.ruleEngine.execute(
    enrichedContext,  // Contexte avec données du formulaire
    new Money(basePrice)
  );
  
  return quote;
}
```

**État** : Les règles sont chargées depuis la BDD, mais **l'inférence n'a pas encore eu lieu**.

---

### Étape 7 : RuleEngine - Enrichissement du contexte

**Fichier**: `src/quotation/domain/services/RuleEngine.ts`

```typescript
execute(context: QuoteContext, basePrice: Money): RuleExecutionResult {
  // 1. ⚠️ MOMENT DE L'INFÉRENCE: Enrichir le contexte
  const enrichedContext = this.contextEnricher.enrichContext(context);
  // ↑ C'est ICI que l'inférence se fait !

  // 2. Appliquer les règles
  const appliedRules = this.applicationService.applyRules(
    this.rules,
    enrichedContext,  // Contexte enrichi avec contraintes inférées
    basePrice
  );

  // 3. Calculer le prix final
  const result = this.priceCalculator.calculateFinalPrice(
    basePrice,
    appliedRules
  );

  return result;
}
```

**Point d'inférence** : C'est dans `contextEnricher.enrichContext()` que l'inférence se produit.

---

### Étape 8 : RuleContextEnricher - Détection et inférence

**Fichier**: `src/quotation/domain/services/engine/RuleContextEnricher.ts`

```typescript
enrichContext(context: QuoteContext): EnrichedContext {
  const contextData = context.getAllData();

  // 1. Fusionner les services
  const allServices = this.fuseServices(contextData);

  // 2. ⚠️ MOMENT EXACT DE L'INFÉRENCE: Auto-détection
  const autoDetection = this.detectRequirements(contextData);
  // ↑ Cette méthode appelle AutoDetectionService.detectFurnitureLift()
  //   avec submissionContext: 'final' → INFÉRENCE ACTIVÉE

  // 3. Enrichir les UUIDs avec les noms
  const enrichedConstraints = {
    pickup: this.enrichConstraintsList(autoDetection.pickupConstraints),
    delivery: this.enrichConstraintsList(autoDetection.deliveryConstraints)
  };

  return {
    ...contextData,
    // ✅ Contraintes déclarées par le client
    declared_constraints: autoDetection.declaredConstraints,
    // ✅ Contraintes inférées automatiquement
    inferred_constraints: autoDetection.inferredConstraints,
    // ✅ Total des contraintes consommées (déclaré + inféré)
    consumed_constraints: autoDetection.consumedConstraints,
    // ... autres propriétés
  };
}
```

**Point d'inférence** : Dans `detectRequirements()`, qui appelle `AutoDetectionService.detectFurnitureLift()`.

---

### Étape 9 : AutoDetectionService - Inférence automatique

**Fichier**: `src/quotation/domain/services/AutoDetectionService.ts`

```typescript
private detectRequirements(contextData: any) {
  // Construire les données d'adresse
  const pickupData: AddressData = {
    floor: 6,                    // ✅ Depuis le formulaire
    elevator: 'no',              // ✅ Depuis le formulaire
    constraints: [                // ✅ Contraintes déclarées par le client
      '40acdd70-5c1f-4936-a53c-8f52e6695a4c'  // Escalier difficile
    ]
  };

  // ⚠️ APPEL AVEC INFÉRENCE ACTIVÉE
  const pickupDetection = AutoDetectionService.detectFurnitureLift(
    pickupData,
    contextData.volume,  // 25 m³
    {
      allowInference: true,           // ✅ Inférence activée
      submissionContext: 'final'      // ✅ Mode soumission finale
    }
  );
  // ↑ C'est ICI que l'inférence se fait réellement !

  // pickupDetection contient maintenant:
  // {
  //   furnitureLiftRequired: true,  // ✅ Détecté (étage 6 > 5, pas d'ascenseur)
  //   declaredConstraints: ['40acdd70-5c1f-4936-a53c-8f52e6695a4c'],
  //   inferredConstraints: [        // ✅ INFÉRÉES AUTOMATIQUEMENT
  //     'b2b8f00b-00a2-456c-ad06-1150d25d71a3',  // Couloirs étroits
  //     'a58d62cc-8de6-4ac5-99ec-0428e268c025',  // Meubles encombrants
  //     'fb522208-5206-482f-9ad5-9abf8cf6f0b1',  // Objets très lourds
  //     'ca6cb6e5-9f5a-4d50-8200-d78d9dedd901',  // Distance de portage
  //     '24e4e233-655e-4730-9b6b-451b3731789a',  // Passage indirect
  //     '293dc311-6f22-42d8-8b31-b322c0e888f9'   // Accès multi-niveaux
  //   ],
  //   consumedConstraints: [        // ✅ Total (déclaré + inféré)
  //     '40acdd70-5c1f-4936-a53c-8f52e6695a4c',  // Déclarée
  //     'b2b8f00b-00a2-456c-ad06-1150d25d71a3',  // Inférée
  //     'a58d62cc-8de6-4ac5-99ec-0428e268c025',  // Inférée
  //     // ... toutes les autres inférées
  //   ],
  //   inferenceMetadata: {
  //     reason: 'Monte-meuble requis, inférence automatique activée',
  //     inferredAt: new Date(),
  //     allowInference: true
  //   }
  // }

  return {
    pickupConstraints: [...],
    deliveryConstraints: [...],
    furnitureLiftRequired: true,
    consumedConstraints: allConsumedConstraints,
    declaredConstraints: allDeclaredConstraints,  // ✅ NOUVEAU
    inferredConstraints: allInferredConstraints,  // ✅ NOUVEAU
    pickupDetection,
    deliveryDetection
  };
}
```

**Logique d'inférence** : Dans `AutoDetectionService.detectFurnitureLift()` :

```typescript
static detectFurnitureLift(
  addressData: AddressData,
  volume?: number,
  options?: {
    allowInference?: boolean;
    submissionContext?: 'draft' | 'final';
  }
): AddressDetectionResult {
  // ...
  
  // 🎯 Déterminer si l'inférence doit être activée
  const shouldInfer = options?.allowInference !== false && 
                      options?.submissionContext !== 'draft';
  // → shouldInfer = true (car submissionContext: 'final')

  // CAS 2: Aucun ascenseur + étage > 5
  if (elevator === 'no' && floor > 5) {
    // ✅ INFÉRENCE: Si monte-meuble requis, inférer toutes les contraintes consommables non déclarées
    if (shouldInfer) {  // ✅ TRUE → Inférence activée
      const inferred = CONSUMED_BY_FURNITURE_LIFT.filter(
        c => !declaredConstraints.includes(c)
      );
      // → inferred = [6 contraintes non déclarées]
      inferredConstraints.push(...inferred);
    }
    
    // ✅ CONSOMMATION: Total (déclaré + inféré)
    consumedConstraints = [
      ...declaredConsumable,    // 1 contrainte déclarée
      ...inferredConstraints    // 6 contraintes inférées
    ];
    
    return {
      furnitureLiftRequired: true,
      declaredConstraints: [...],      // ✅ 1 contrainte
      inferredConstraints: [...],       // ✅ 6 contraintes
      consumedConstraints: [...],      // ✅ 7 contraintes total
      inferenceMetadata: { ... }
    };
  }
}
```

---

### Étape 10 : RuleApplicationService - Application des règles

**Fichier**: `src/quotation/domain/services/engine/RuleApplicationService.ts`

```typescript
applyRules(
  rules: Rule[],
  enrichedContext: EnrichedContext,
  basePrice: Money
): AppliedRuleResult[] {
  for (const rule of rules) {
    // Vérifier si la règle doit être ignorée (consommée)
    if (this.shouldSkipRule(rule, enrichedContext)) {
      // ✅ La règle "Couloirs étroits" est ignorée car dans consumed_constraints
      // ✅ Log: "🔍 RÈGLE 'Couloirs étroits' → ❌ CONSOMMÉE (INFÉRÉE)"
      continue;
    }

    // Vérifier l'applicabilité
    const isApplicable = rule.isApplicable(enrichedContext);
    if (!isApplicable) {
      continue;
    }

    // Appliquer la règle
    const ruleResult = this.applyRule(rule, currentPrice, enrichedContext, basePrice);
    appliedRules.push(ruleResult);
  }

  return appliedRules;
}
```

**Résultat** :
- ✅ Règle "Monte-meuble" : **APPLIQUÉE** (+300€)
- ✅ Règle "Escalier difficile" : **IGNORÉE** (consommée, déclarée)
- ✅ Règle "Couloirs étroits" : **IGNORÉE** (consommée, **inférée**)
- ✅ Règle "Meubles encombrants" : **IGNORÉE** (consommée, **inférée**)
- ✅ Autres règles inférées : **IGNORÉES** (consommées, **inférées**)

---

## 3. ⏰ Moment exact de l'inférence

### 3.1 Timeline détaillée

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND - Soumission formulaire                            │
│    POST /api/price/calculate                                   │
│    pickupLogisticsConstraints: ['uuid-escalier']               │
│    ❌ Inférence: PAS ENCORE                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API Route → PriceController → PriceService                  │
│    Création QuoteContext                                        │
│    ❌ Inférence: PAS ENCORE                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. QuoteCalculator → Strategy (ex: MovingQuoteStrategy)         │
│    Chargement règles depuis BDD                                │
│    ❌ Inférence: PAS ENCORE                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Strategy → RuleEngine.execute()                             │
│    ❌ Inférence: PAS ENCORE                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. RuleEngine → RuleContextEnricher.enrichContext()            │
│    ⚠️ MOMENT DE L'INFÉRENCE                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. RuleContextEnricher → detectRequirements()                   │
│    ⚠️ MOMENT DE L'INFÉRENCE                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. AutoDetectionService.detectFurnitureLift()                  │
│    options: { allowInference: true, submissionContext: 'final' }│
│    ✅ INFÉRENCE ACTIVÉE ICI                                     │
│    - Détection monte-meuble requis (étage 6 > 5, pas ascenseur) │
│    - Inférence des 6 contraintes non déclarées                  │
│    - Retour: declaredConstraints, inferredConstraints,          │
│              consumedConstraints                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. RuleContextEnricher → Retour contexte enrichi                │
│    enrichedContext = {                                          │
│      declared_constraints: Set(['uuid-escalier']),             │
│      inferred_constraints: Set([6 UUIDs inférées]),            │
│      consumed_constraints: Set([7 UUIDs total])                 │
│    }                                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. RuleApplicationService.applyRules()                          │
│    - Ignore les règles dans consumed_constraints                │
│    - Logs distinguent déclaré vs inféré                         │
│    - Applique seulement les règles non consommées               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. RulePriceCalculator → Prix final                           │
│     Total = Prix base + Monte-meuble (300€)                    │
│     ✅ Pas de double facturation                                │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Conditions d'activation de l'inférence

L'inférence est activée **uniquement si** :

1. ✅ `submissionContext === 'final'` (pas 'draft')
2. ✅ `allowInference !== false` (par défaut: true)
3. ✅ `furnitureLiftRequired === true` (monte-meuble détecté)

**Code exact** :
```typescript
// Dans AutoDetectionService.detectFurnitureLift()
const shouldInfer = options?.allowInference !== false && 
                    options?.submissionContext !== 'final';
// → shouldInfer = true si submissionContext === 'final'

if (furnitureLiftRequired && shouldInfer) {
  // ✅ INFÉRENCE ACTIVÉE
  const inferred = CONSUMED_BY_FURNITURE_LIFT.filter(
    c => !declaredConstraints.includes(c)
  );
  inferredConstraints.push(...inferred);
}
```

---

## 4. 📋 Exemple concret avec logs

### 4.1 Scénario

**Données client** :
- Étage : 6
- Ascenseur : Non
- Contraintes déclarées : `['Escalier difficile']`
- Contraintes oubliées : Couloirs étroits, Meubles encombrants, etc.

### 4.2 Logs du flux

```
📡 POST /api/price/calculate
   → PriceService.calculatePrice()
   → QuoteCalculator.calculateQuote('MOVING', context)
   → MovingQuoteStrategy.calculate(context)
   → RuleEngine.execute(context, basePrice)

📋 CONTEXTE: 45 règles | Prix base: 1907.00€
🔍 VALIDATION DU CONTEXTE...
✅ CONTEXTE VALIDÉ

🔧 [RuleContextEnricher] SERVICES FUSIONNÉS: ...

🏗️ [RuleContextEnricher] MONTE-MEUBLE REQUIS
   ✅ Contraintes DÉCLARÉES (1): Escalier difficile ou dangereux
   🔍 Contraintes INFÉRÉES (6): Couloirs étroits ou encombrés, Meubles encombrants, 
                                 Objets très lourds, Distance de portage > 30m, 
                                 Passage indirect obligatoire, Accès complexe multi-niveaux
   💡 Raison: Monte-meuble requis, inférence automatique activée pour éviter double facturation
   📦 TOTAL contraintes CONSOMMÉES (7): [Escalier difficile, Couloirs étroits, ...]
   ℹ️  Les règles liées à ces contraintes seront automatiquement ignorées

🔄 TRAITEMENT DE CHAQUE RÈGLE...

✅ RÈGLE "Monte-meuble" → ✅ APPLIQUÉE
   💰 Impact: +300.00€

🔍 RÈGLE "Couloirs étroits" → ❌ CONSOMMÉE (INFÉRÉE)
   🤖 Raison: Contrainte consommée par le monte-meuble (inférée automatiquement)
   🎯 Contrainte inférée automatiquement car monte-meuble requis
   💡 Évite la double facturation (principe: "Mieux vaut inférer trop que facturer deux fois")

✅ RÈGLE "Escalier difficile" → ❌ CONSOMMÉE (DÉCLARÉE)
   👤 Raison: Contrainte consommée par le monte-meuble (déclarée par le client)
   🎯 Contrainte déjà facturée dans le monte-meuble
   💡 Évite la double facturation

🔍 RÈGLE "Meubles encombrants" → ❌ CONSOMMÉE (INFÉRÉE)
   🤖 Raison: Contrainte consommée par le monte-meuble (inférée automatiquement)
   ...

📊 RÉSULTAT FINAL:
   Prix de base: 1907.00€
   Monte-meuble: +300.00€
   Total: 2207.00€
   ✅ Pas de double facturation (contraintes consommées ignorées)
```

---

## 5. 🔄 Diagramme de séquence

```
Frontend          API Route      PriceService    QuoteCalculator    Strategy        RuleEngine        RuleContextEnricher    AutoDetectionService
   │                  │               │                │              │                 │                      │                           │
   │ POST /api/price  │               │                │              │                 │                      │                           │
   ├─────────────────>│               │                │              │                 │                      │                           │
   │                  │               │                │              │                 │                      │                           │
   │                  │ calculatePrice│                │              │                 │                      │                           │
   │                  ├──────────────>│                │              │                 │                      │                           │
   │                  │               │                │              │                 │                      │                           │
   │                  │               │ createQuoteContext()          │                 │                      │                           │
   │                  │               ├───────────────────────────────────────────────────────────────────────────────────────────────────>│
   │                  │               │                │              │                 │                      │                           │
   │                  │               │ calculateQuote()              │                 │                      │                           │
   │                  │               ├───────────────>│              │                 │                      │                           │
   │                  │               │                │              │                 │                      │                           │
   │                  │               │                │ calculate()  │                 │                      │                           │
   │                  │               │                ├────────────>│                 │                      │                           │
   │                  │               │                │              │                 │                      │                           │
   │                  │               │                │              │ execute()      │                      │                           │
   │                  │               │                │              ├────────────────>│                      │                           │
   │                  │               │                │              │                 │                      │                           │
   │                  │               │                │              │ enrichContext() │                      │                           │
   │                  │               │                │              ├──────────────────────────────────────>│                           │
   │                  │               │                │              │                 │                      │                           │
   │                  │               │                │              │                 │ detectRequirements() │                           │
   │                  │               │                │              │                 ├──────────────────────────────────────────────────>│
   │                  │               │                │              │                 │                      │                           │
   │                  │               │                │              │                 │                      │ detectFurnitureLift()      │
   │                  │               │                │              │                 │                      │ options: {                 │
   │                  │               │                │              │                 │                      │   allowInference: true,    │
   │                  │               │                │              │                 │                      │   submissionContext: 'final'│
   │                  │               │                │              │                 │                      │ }                          │
   │                  │               │                │              │                 │                      ├───────────────────────────>│
   │                  │               │                │              │                 │                      │                           │
   │                  │               │                │              │                 │                      │ ⚠️ INFÉRENCE ICI           │
   │                  │               │                │              │                 │                      │ - Détecte monte-meuble     │
   │                  │               │                │              │                 │                      │ - Infère 6 contraintes     │
   │                  │               │                │              │                 │                      │ - Retour: declared,        │
   │                  │               │                │              │                 │                      │   inferred, consumed       │
   │                  │               │                │              │                 │                      │<───────────────────────────│
   │                  │               │                │              │                 │                      │                           │
   │                  │               │                │              │                 │<──────────────────────│                           │
   │                  │               │                │              │                 │                      │                           │
   │                  │               │                │              │<────────────────│                      │                           │
   │                  │               │                │              │                 │                      │                           │
   │                  │               │<───────────────  │              │                 │                      │                           │
   │                  │               │                │              │                 │                      │                           │
   │<─────────────────│               │                │              │                 │                      │                           │
   │                  │               │                │              │                 │                      │                           │
```

---

## 6. 🎯 Points clés à retenir

### 6.1 Quand l'inférence se fait

✅ **OUI** : Lors de la soumission finale du formulaire (bouton "Réserver maintenant")
- Appel : `POST /api/price/calculate`
- Contexte : `submissionContext: 'final'`
- Moment : Dans `RuleContextEnricher.detectRequirements()` → `AutoDetectionService.detectFurnitureLift()`

❌ **NON** : Lors des calculs en temps réel (onChange)
- Les calculs en temps réel utilisent `submissionContext: 'draft'` (implicite)
- L'inférence est désactivée en mode draft

### 6.2 Conditions d'activation

L'inférence est activée **uniquement si** :
1. ✅ `submissionContext === 'final'` (soumission finale)
2. ✅ `furnitureLiftRequired === true` (monte-meuble détecté)
3. ✅ `allowInference !== false` (par défaut: true)

### 6.3 Résultat de l'inférence

Après l'inférence, le contexte enrichi contient :
- `declared_constraints` : Contraintes sélectionnées par le client
- `inferred_constraints` : Contraintes inférées automatiquement
- `consumed_constraints` : Total (déclaré + inféré)
- `inference_metadata` : Métadonnées pour audit (raison, date, etc.)

### 6.4 Impact sur le calcul

Les règles dont l'ID est dans `consumed_constraints` sont **automatiquement ignorées** par `RuleApplicationService`, évitant ainsi la double facturation.

---

**Document créé le** : 2025-01-27  
**Auteur** : Documentation du flux d'inférence des contraintes

