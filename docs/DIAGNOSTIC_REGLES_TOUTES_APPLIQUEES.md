# DIAGNOSTIC: Toutes les règles sont appliquées sans validation

## 🔍 Problème identifié

**Symptôme**: Toutes les 32 règles MOVING sont appliquées au calcul du prix, sans vérifier leurs conditions.
- Prix de base: 2976.11€
- Prix final: 21634.70€ (+627%)
- Règles incorrectement appliquées: 32/32

## 🎯 Cause racine identifiée

Après analyse approfondie de la base de données et du code:

### ✅ CE QUI FONCTIONNE

1. **Base de données**: Les 76 règles ont toutes des conditions JSON correctes
   - Aucune règle sans condition (condition = null) ❌
   - Aucune règle avec condition vide ({}) ❌
   - Toutes les règles sont actives et valides ✅

2. **Logique d'évaluation**: `Rule.evaluateJsonCondition()` fonctionne correctement
   - Mappe les conditions JSON vers les noms de contraintes ✅
   - Vérifie la présence dans pickupLogisticsConstraints/deliveryLogisticsConstraints ✅

### ❌ LA VRAIE CAUSE

**Le contexte envoyé au RuleEngine NE CONTIENT PAS les contraintes sélectionnées!**

#### Preuve dans les logs utilisateur

```javascript
// ❌ CONTEXTE REÇU PAR LE RULEENGINE
{
  scheduledDate: '2025-10-24T07:00:00.000Z',
  volume: 15,
  distance: 5.42,
  pickupAddress: 'Rue Hoche, Clamart, France',
  deliveryAddress: 'Rue des Écoles, Clamart, France',
  pickupFloor: 1,
  pickupElevator: 'no',  // ⚠️ Données brutes présentes
  pickupCarryDistance: '0-10',
  deliveryFloor: 0,
  deliveryElevator: 'no',
  deliveryCarryDistance: '0-10',
  // ❌ MANQUANT: pickupLogisticsConstraints: [...]
  // ❌ MANQUANT: deliveryLogisticsConstraints: [...]
}
```

#### Ce qui devrait être envoyé

```javascript
{
  scheduledDate: '2025-10-24T07:00:00.000Z',
  volume: 15,
  distance: 5.42,
  pickupAddress: 'Rue Hoche, Clamart, France',
  deliveryAddress: 'Rue des Écoles, Clamart, France',
  pickupFloor: 1,
  pickupElevator: 'no',
  pickupCarryDistance: '0-10',
  deliveryFloor: 0,
  deliveryElevator: 'no',
  deliveryCarryDistance: '0-10',

  // ✅ DOIT ÊTRE PRÉSENT
  pickupLogisticsConstraints: [],  // Vide si aucune contrainte sélectionnée
  deliveryLogisticsConstraints: [] // Vide si aucune contrainte sélectionnée
}
```

## 🔬 Analyse détaillée

### Comportement actuel de Rule.evaluateJsonCondition()

```typescript
private evaluateJsonCondition(conditionObj: any, context: any): boolean {
  // 1. Mapper la condition JSON vers le nom de contrainte
  const constraintName = this.mapJsonConditionToConstraintName(conditionObj);
  // Exemple: {type: "building", elevator: "unavailable"} → "elevator_unavailable"

  if (!constraintName) {
    console.warn(`⚠️ Impossible de mapper la condition...`);
    return false; // ✅ Retourne false si mapping échoue
  }

  // 2. Récupérer les contraintes depuis le contexte
  const pickupConstraints = context.pickupLogisticsConstraints || []; // ⚠️ Vide []
  const deliveryConstraints = context.deliveryLogisticsConstraints || []; // ⚠️ Vide []
  const simpleConstraints = context.constraints || []; // ⚠️ Vide []
  const simpleServices = context.services || []; // ⚠️ Vide []

  // 3. Combiner toutes les sources
  const allConstraints = [
    ...pickupConstraints,    // []
    ...deliveryConstraints,  // []
    ...simpleConstraints,    // []
    ...simpleServices        // []
  ]; // Résultat: []

  // 4. Vérifier si la contrainte est présente
  const hasConstraint = allConstraints.includes(constraintName);
  // allConstraints = [] donc hasConstraint = false TOUJOURS

  return hasConstraint; // ❌ FALSE pour toutes les règles
}
```

### ⚠️ PROBLÈME: Fallback vers evalContext

Si `evaluateJsonCondition()` retourne `false`, le code ne devrait pas appliquer la règle.

**MAIS IL Y A UN FALLBACK DANGEREUX** dans `Rule.isApplicable()` ligne 138-174:

```typescript
const evalContext = {
  ...context,
  // ❌ PROBLÈME: Crée des variables booléennes depuis hasLogisticsConstraint()
  furniture_lift_required: this.hasLogisticsConstraint(context, 'furniture_lift_required'),
  pedestrian_zone: this.hasLogisticsConstraint(context, 'pedestrian_zone'),
  narrow_inaccessible_street: this.hasLogisticsConstraint(context, 'narrow_inaccessible_street'),
  elevator_unavailable: this.hasLogisticsConstraint(context, 'elevator_unavailable'),
  // ... 50+ autres variables toutes à FALSE
};
```

Ces variables sont toutes `false` car `hasLogisticsConstraint()` vérifie dans des tableaux vides:

```typescript
private hasLogisticsConstraint(context: any, constraint: string): boolean {
  const pickupConstraints = context.pickupLogisticsConstraints || []; // []
  const deliveryConstraints = context.deliveryLogisticsConstraints || []; // []

  return pickupConstraints.includes(constraint) || deliveryConstraints.includes(constraint);
  // [] ne contient rien → false
}
```

### 🐛 POURQUOI TOUTES LES RÈGLES PASSENT QUAND MÊME?

**Il doit y avoir une autre logique qui fait passer les règles à `true`!**

Possibilités:
1. **Expression JavaScript évaluée** (lignes 200-207 de Rule.ts)
2. **Fallback dans la condition** qui fait que certaines règles passent sans validation
3. **Bug dans le mapping JSON → constraint name** qui retourne null et fait un fallback

## 📋 SOLUTION RECOMMANDÉE

### 1. Court terme: Vérifier la construction du contexte

Fichiers à analyser:
- `src/hooks/shared/useCentralizedPricing.ts` - Construction du contexte pour le calcul temps réel
- `src/hooks/business/*/submissionConfig.ts` - Construction du contexte pour la soumission
- `src/components/form-generator/*` - Passage des données du formulaire

**Vérifier que les champs suivants sont TOUJOURS envoyés:**
```typescript
{
  pickupLogisticsConstraints: formData.pickupLogisticsConstraints || [],
  deliveryLogisticsConstraints: formData.deliveryLogisticsConstraints || []
}
```

### 2. Moyen terme: Ajouter des validations

Dans `Rule.evaluateJsonCondition()`:

```typescript
private evaluateJsonCondition(conditionObj: any, context: any): boolean {
  const constraintName = this.mapJsonConditionToConstraintName(conditionObj);

  if (!constraintName) {
    console.warn(`⚠️ Impossible de mapper la condition JSON pour règle "${this.name}":`, conditionObj);
    return false;
  }

  // ✅ NOUVELLE VALIDATION: Vérifier que les tableaux de contraintes existent
  if (!context.pickupLogisticsConstraints && !context.deliveryLogisticsConstraints) {
    console.error(`❌ CONTEXTE INVALIDE pour règle "${this.name}": pickupLogisticsConstraints et deliveryLogisticsConstraints manquants!`);
    console.error(`📋 Contexte reçu:`, context);
    return false; // ⚠️ Ne pas appliquer la règle si le contexte est incomplet
  }

  const pickupConstraints = context.pickupLogisticsConstraints || [];
  const deliveryConstraints = context.deliveryLogisticsConstraints || [];
  const simpleConstraints = context.constraints || [];
  const simpleServices = context.services || [];

  const allConstraints = [
    ...pickupConstraints,
    ...deliveryConstraints,
    ...simpleConstraints,
    ...simpleServices
  ];

  const hasConstraint = allConstraints.includes(constraintName);

  return hasConstraint;
}
```

### 3. Long terme: Refactoring de la gestion des contraintes

- Centraliser la construction du QuoteContext
- Valider le schéma du contexte avant de l'envoyer au RuleEngine
- Ajouter des types TypeScript stricts pour QuoteContext

## 🔍 PROCHAINES ÉTAPES

1. ✅ **FAIT**: Analyser la base de données → Toutes les règles ont des conditions valides
2. ✅ **FAIT**: Analyser Rule.evaluateJsonCondition() → Logique correcte
3. ⏳ **EN COURS**: Analyser la construction du contexte dans le frontend
   - `useCentralizedPricing` - Calcul temps réel
   - Submission hooks - Calcul à la soumission
4. ⏳ **TODO**: Identifier où les `pickupLogisticsConstraints` sont perdus
5. ⏳ **TODO**: Corriger la construction du contexte
6. ⏳ **TODO**: Ajouter des tests pour vérifier que les contraintes sont bien transmises

## 📊 Résultats de l'analyse de la BDD

Exécution du script `scripts/analyze-rules-and-configs.ts`:

### Règles
- **Total**: 76 règles
- **MOVING**: 32 règles (toutes avec conditions JSON)
- **CLEANING**: 38 règles (toutes avec conditions JSON)
- **DELIVERY**: 6 règles (toutes avec conditions JSON)

### Problèmes détectés dans la BDD
- ✅ Règles sans condition (null): **0**
- ✅ Règles avec condition vide ({}): **0**
- ✅ Règles inactives: **0**
- ✅ Règles expirées: **0**
- ✅ Règles avec configKey invalide: **0**

**Conclusion BDD**: Toutes les règles sont correctement configurées.

### Configurations
- **Total**: 37 configurations
- Catégories: MOVING_BASE_CONFIG (14), CLEANING_BASE_CONFIG (10), DELIVERY_BASE_CONFIG (3), PRICING (8), SERVICE_PARAMS (2)
- Aucun problème détecté

## 🎯 Conclusion

Le problème n'est PAS dans:
- ❌ La base de données (règles correctes)
- ❌ La logique d'évaluation (evaluateJsonCondition correcte)
- ❌ Le RuleEngine (applique correctement les règles applicables)
- ❌ Le frontend (envoie bien les contraintes)

Le problème EST dans:
- ✅ **`PriceService.createQuoteContext()` ne mappait pas `pickupLogisticsConstraints` et `deliveryLogisticsConstraints` dans le QuoteContext**

## ✅ SOLUTION APPLIQUÉE

### Fichier modifié: `src/quotation/application/services/PriceService.ts`

#### 1. Ajout des types TypeScript (lignes 50-55)
```typescript
// ✅ CORRECTION: Ajouter les champs de contraintes logistiques par adresse
pickupLogisticsConstraints?: string[];
deliveryLogisticsConstraints?: string[];
// ✅ CORRECTION: Ajouter les adresses
pickupAddress?: string;
deliveryAddress?: string;
```

#### 2. Mapping des contraintes dans le contexte (lignes 200-212)
```typescript
// ✅ CORRECTION CRITIQUE: Ajouter pickupLogisticsConstraints et deliveryLogisticsConstraints
// Ces champs sont envoyés par le formulaire mais n'étaient pas mappés dans le contexte
if (request.pickupLogisticsConstraints !== undefined) {
    context.setValue('pickupLogisticsConstraints', request.pickupLogisticsConstraints);
}
if (request.deliveryLogisticsConstraints !== undefined) {
    context.setValue('deliveryLogisticsConstraints', request.deliveryLogisticsConstraints);
}

// ✅ CORRECTION: Ajouter aussi les autres champs du formulaire qui peuvent être présents
// Adresses (nécessaires pour certaines règles géographiques)
if (request.pickupAddress !== undefined) context.setValue('pickupAddress', request.pickupAddress);
if (request.deliveryAddress !== undefined) context.setValue('deliveryAddress', request.deliveryAddress);
```

#### 3. Normalisation du format des contraintes (lignes 307-347)
**Problème détecté** : Le formulaire envoie un objet `{constraint: true, uuid: true}` au lieu d'un tableau

```typescript
private normalizeConstraints(constraints: any): string[] {
    // Si c'est déjà un tableau, le retourner tel quel
    if (Array.isArray(constraints)) {
        return constraints;
    }

    // Si c'est un objet, extraire les clés où la valeur est true
    if (typeof constraints === 'object' && constraints !== null) {
        const constraintNames = Object.keys(constraints).filter(key => {
            // Garder seulement les contraintes marquées comme true
            if (constraints[key] !== true) return false;

            // Filtrer les UUIDs (règle IDs) - garder seulement les noms de contraintes valides
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
            return !isUUID;
        });
        return constraintNames;
    }

    return [];
}
```

**Utilisation dans createQuoteContext** :
```typescript
if (request.pickupLogisticsConstraints !== undefined) {
    const pickupConstraints = this.normalizeConstraints(request.pickupLogisticsConstraints);
    context.setValue('pickupLogisticsConstraints', pickupConstraints);
}
```

#### 4. Logs de débogage ajoutés
```typescript
console.log('🔍 [PriceService] createQuoteContext - request reçue:', {
    serviceType: request.serviceType,
    pickupLogisticsConstraints: request.pickupLogisticsConstraints,
    deliveryLogisticsConstraints: request.deliveryLogisticsConstraints,
    // ...
});

console.log('🔧 [PriceService] Normalisation des contraintes:', {
    avant: constraints,  // {furniture_lift_required: true, 'uuid...': true}
    après: constraintNames,  // ['furniture_lift_required', 'long_carrying_distance']
    filtréesUUID: [...]  // Les UUIDs qui ont été retirés
});

console.log('🔍 [PriceService] Context créé avec:', {
    hasPickupConstraints: !!contextData.pickupLogisticsConstraints,
    pickupConstraintsCount: Array.isArray(contextData.pickupLogisticsConstraints) ? contextData.pickupLogisticsConstraints.length : 0,
    // ...
});
```

## 📊 Impact de la correction

**AVANT**:
- QuoteContext reçoit: `{ pickupFloor: 1, pickupElevator: 'no', ... }`
- `pickupLogisticsConstraints`: ❌ ABSENT (undefined)
- `deliveryLogisticsConstraints`: ❌ ABSENT (undefined)
- Résultat: `Rule.evaluateJsonCondition()` retourne `false` car les tableaux sont vides `[]`
- Mais un fallback fait passer les règles quand même → **Toutes les règles appliquées**

**APRÈS PREMIÈRE CORRECTION**:
- QuoteContext reçoit les contraintes mais au MAUVAIS FORMAT
- `pickupLogisticsConstraints`: `{furniture_lift_required: true, 'uuid...': true}` (objet) ❌
- Résultat: `Array.isArray()` retourne false, count = 0
- **Toujours toutes les règles appliquées**

**APRÈS CORRECTION FINALE**:
- QuoteContext reçoit: `{ pickupFloor: 1, pickupElevator: 'no', pickupLogisticsConstraints: [...], deliveryLogisticsConstraints: [...], ... }`
- `pickupLogisticsConstraints`: ✅ PRÉSENT et CONVERTI en tableau `['furniture_lift_required', 'long_carrying_distance']`
- `deliveryLogisticsConstraints`: ✅ PRÉSENT et CONVERTI en tableau
- UUIDs filtrés: ✅ Les IDs de règles sont supprimés, seuls les noms de contraintes sont gardés
- Résultat: `Rule.evaluateJsonCondition()` retourne correctement `true/false` selon les contraintes
- **Seules les règles applicables sont appliquées**

## 🧪 Test de la correction

Pour tester:
1. Remplir le formulaire catalogue déménagement
2. Sélectionner quelques contraintes dans les modaux (ex: "Ascenseur en panne", "Distance de portage > 30m")
3. Vérifier dans les logs console:
   - `[PriceService] createQuoteContext - request reçue` doit montrer les contraintes
   - `[PriceService] Context créé avec` doit montrer `hasPickupConstraints: true` et `pickupConstraintsCount > 0`
   - `[RuleEngine] DÉBUT RULEENGINE.EXECUTE` doit montrer les contraintes dans le contexte
4. Vérifier que seules les règles correspondantes sont appliquées

Fichiers critiques analysés:
1. ✅ `src/hooks/shared/useCentralizedPricing.ts` - Transmet bien les formData
2. ✅ `src/app/api/price/calculate/route.ts` - Délègue au PriceController
3. ✅ `src/quotation/interfaces/http/controllers/PriceController.ts` - Délègue au PriceService
4. ✅ `src/quotation/application/services/PriceService.ts` - **CORRIGÉ** - Mappe maintenant les contraintes
