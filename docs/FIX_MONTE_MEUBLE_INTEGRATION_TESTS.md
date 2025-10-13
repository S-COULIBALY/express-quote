# Fix des Tests d'Intégration - Règle Monte-meuble

## 📋 Problème Initial

Les tests d'intégration `src/__tests__/integration/rules-calculation.test.ts` échouaient pour les scénarios utilisant le monte-meuble. 9 tests sur 11 passaient, mais les tests 2 et 4 échouaient avec l'erreur :

```
expect(hasMonteMenuble).toBe(true)
Expected: true
Received: false
```

## 🔍 Investigation

### 1. Analyse de la Règle en Base de Données

La règle "Monte-meuble" existe bien en base avec la condition suivante :

```json
{
  "type": "equipment",
  "lift": "required"
}
```

### 2. Flux d'Exécution du RuleEngine

Le `RuleEngine.execute()` fonctionne ainsi:

1. **Auto-détection** : Appelle `AutoDetectionService.detectFurnitureLift()` pour détecter automatiquement si le monte-meuble est requis selon l'étage et l'ascenseur
2. **Enrichissement** : Enrichit le contexte avec `monte_meuble_requis: true` et les contraintes consommées
3. **Évaluation des règles** : Pour chaque règle, appelle `Rule.isApplicable()` qui :
   - Crée un `evalContext` enrichi
   - Évalue la condition JSON via `evaluateJsonCondition()`
   - La méthode `mapJsonConditionToConstraintName()` mappe `{type: 'equipment', lift: 'required'}` vers `'furniture_lift_required'`
   - Vérifie si `'furniture_lift_required'` est présent dans les contraintes logistiques

### 3. Cause du Problème

**Le problème** : L'`AutoDetectionService` détecte bien que le monte-meuble est requis (`furnitureLiftRequired = true`), mais il ne l'ajoute PAS dans les listes `pickupLogisticsConstraints` ou `deliveryLogisticsConstraints`.

La règle "Monte-meuble" attend que la contrainte `'furniture_lift_required'` soit présente dans ces listes pour être applicable.

## ✅ Solution Implémentée

### Modification de `src/quotation/domain/services/RuleEngine.ts`

Ajout d'un enrichissement des contraintes logistiques AVANT l'évaluation des règles :

```typescript
// ✅ Enrichir les contraintes logistiques avec furniture_lift_required si nécessaire
const enrichedPickupConstraints = [
  ...(contextData.pickupLogisticsConstraints || []),
];
const enrichedDeliveryConstraints = [
  ...(contextData.deliveryLogisticsConstraints || []),
];

if (
  pickupDetection.furnitureLiftRequired &&
  !enrichedPickupConstraints.includes("furniture_lift_required")
) {
  enrichedPickupConstraints.push("furniture_lift_required");
}
if (
  deliveryDetection.furnitureLiftRequired &&
  !enrichedDeliveryConstraints.includes("furniture_lift_required")
) {
  enrichedDeliveryConstraints.push("furniture_lift_required");
}

const enrichedContextData = {
  ...contextData,
  pickupLogisticsConstraints: enrichedPickupConstraints,
  deliveryLogisticsConstraints: enrichedDeliveryConstraints,
  monte_meuble_requis: furnitureLiftRequired,
  consumedConstraints: allConsumedConstraints,
};
```

### Impact

Cette modification permet :

1. ✅ La règle "Monte-meuble" d'être correctement détectée comme applicable
2. ✅ La contrainte `'furniture_lift_required'` d'être présente dans le contexte
3. ✅ L'évaluation de la condition JSON de fonctionner correctement
4. ✅ Les contraintes consommées (escaliers difficiles, couloirs étroits, etc.) de ne PAS être facturées séparément

## 🧪 Résultats des Tests

**AVANT** : 9/11 tests passaient
**APRÈS** : ✅ **11/11 tests passent**

```bash
PASS src/__tests__/integration/rules-calculation.test.ts
Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

### Tests Corrigés

- ✅ **Scénario 2** : Avec monte-meubles - Étage élevé
- ✅ **Scénario 4** : Contraintes mixtes

## 📚 Documentation Technique

### Flux Complet de l'Auto-détection

1. `RuleEngine.execute()` reçoit le contexte avec :
   - `pickupFloor: 5`
   - `pickupElevator: 'no'`
   - `pickupLogisticsConstraints: ['difficult_stairs', 'narrow_corridors', ...]`

2. `AutoDetectionService.detectFurnitureLift()` analyse et retourne :
   - `furnitureLiftRequired: true` (car étage 5 > seuil 3)
   - `consumedConstraints: ['difficult_stairs', 'narrow_corridors', ...]`

3. `RuleEngine` enrichit le contexte en ajoutant :
   - `'furniture_lift_required'` dans `pickupLogisticsConstraints`
   - `monte_meuble_requis: true`
   - `consumedConstraints: Set(['difficult_stairs', 'narrow_corridors', ...])`

4. `Rule.isApplicable()` évalue la condition :
   - Mappe `{type: 'equipment', lift: 'required'}` → `'furniture_lift_required'`
   - Vérifie la présence dans `pickupLogisticsConstraints` ✅
   - Retourne `true`

5. `RuleEngine` applique la règle :
   - Ajoute 300€ de surcharge
   - Exclut les contraintes consommées de la facturation

## 🎯 Bénéfices

1. **Cohérence** : L'auto-détection et l'évaluation des règles fonctionnent ensemble harmonieusement
2. **Pas de double facturation** : Les contraintes consommées ne sont pas facturées séparément
3. **Testabilité** : Les tests d'intégration vérifient le comportement réel du système
4. **Maintenabilité** : La logique est centralisée dans le RuleEngine

## 📝 Notes Supplémentaires

- Les tests ne nécessitent plus d'ajouter manuellement `context.setValue('lift', 'required')` car l'auto-détection le fait automatiquement
- Le système fonctionne aussi bien pour les formulaires utilisateur que pour les tests
- La solution respecte l'architecture DDD existante

---

**Date** : 2025-01-XX
**Fichiers modifiés** :

- `src/quotation/domain/services/RuleEngine.ts` (lignes 80-99)

**Tests vérifiés** :

- `src/__tests__/integration/rules-calculation.test.ts` (11/11 ✅)
