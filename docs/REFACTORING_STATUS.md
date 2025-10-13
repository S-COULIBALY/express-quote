# 🚧 Statut du Refactoring - Nommage et Interface

## ✅ Terminé

### 1. Nouvelle Interface `RuleExecutionResult`

**Fichier** : `src/quotation/domain/interfaces/RuleExecutionResult.ts` ✅

Interface beaucoup plus explicite avec :

- Prix détaillés (base, final, réductions, surcharges)
- Règles par catégorie (réductions, surcharges, contraintes, services, équipements, règles temporelles)
- Coûts par adresse (pickup, delivery, global)
- Contraintes consommées et raison
- Métadonnées (monte-meuble requis, prix minimum, etc.)
- Builder pattern pour construire progressivement

### 2. Nouvelle Classe `AppliedRule`

**Fichier** : `src/quotation/domain/valueObjects/AppliedRule.ts` ✅

- Remplace `Discount` avec un nom plus clair
- Enum `RuleValueType` remplace `DiscountType`
- Méthodes `isReduction()` et `isSurcharge()` claires
- Gère l'application correcte (ajout pour surcharges, soustraction pour réductions)

### 3. Alias de Compatibilité

**Fichier** : `src/quotation/domain/valueObjects/Discount.ts` ✅

- Réexporte `AppliedRule as Discount`
- Permet la transition en douceur
- À supprimer après migration complète

## 🔄 En Cours

### RuleEngine.ts

**Statut** : En attente de refactoring complet

Le fichier `RuleEngine.ts` (444 lignes) doit être mis à jour pour :

1. **Imports**

   ```typescript
   // AVANT
   import { Discount, DiscountType } from "../valueObjects/Discount";
   interface RuleExecutionResult {
     finalPrice: Money;
     discounts: Discount[];
     appliedRules?: string[];
   }

   // APRÈS
   import { AppliedRule, RuleValueType } from "../valueObjects/AppliedRule";
   import {
     RuleExecutionResult,
     RuleExecutionResultBuilder,
     AppliedRuleDetail,
     AppliedRuleType,
   } from "../interfaces/RuleExecutionResult";
   ```

2. **Utiliser le Builder**

   ```typescript
   // Créer le builder
   const builder = new RuleExecutionResultBuilder(basePrice);

   // Ajouter les règles appliquées
   for (const rule of this.rules) {
     if (rule.isApplicable(enrichedContext)) {
       const appliedRule: AppliedRuleDetail = {
         id: rule.getId(),
         name: rule.getName(),
         type: this.determineRuleType(rule),
         value: rule.getValue(),
         isPercentage: rule.isPercentage(),
         impact: // calculer l'impact
         description: rule.getName(),
         address: this.determineAddress(rule, context)
       };

       builder.addAppliedRule(appliedRule);
     }
   }

   // Définir les contraintes consommées
   builder.setConsumedConstraints(
     Array.from(allConsumedConstraints),
     'Consommées par Monte-meuble'
   );

   // Définir le monte-meuble
   builder.setFurnitureLift(
     furnitureLiftRequired,
     pickupDetection.furnitureLiftReason || deliveryDetection.furnitureLiftReason
   );

   // Construire le résultat
   return builder.build();
   ```

3. **Déterminer le type de règle**

   ```typescript
   private determineRuleType(rule: Rule): AppliedRuleType {
     const name = rule.getName().toLowerCase();

     if (rule.isReduction()) return AppliedRuleType.REDUCTION;
     if (name.includes('monte-meuble')) return AppliedRuleType.EQUIPMENT;
     if (name.includes('weekend') || name.includes('week-end')) return AppliedRuleType.TEMPORAL;
     if (name.includes('escalier') || name.includes('ascenseur')) return AppliedRuleType.CONSTRAINT;
     if (name.includes('emballage') || name.includes('démontage')) return AppliedRuleType.ADDITIONAL_SERVICE;

     return AppliedRuleType.SURCHARGE;
   }
   ```

4. **Déterminer l'adresse**
   ```typescript
   private determineAddress(rule: Rule, context: QuoteContext): 'pickup' | 'delivery' | 'both' | undefined {
     // Analyser le contexte et la règle pour déterminer l'adresse concernée
     // Par exemple, si la contrainte est dans pickupLogisticsConstraints → 'pickup'
     // Si dans les deux → 'both'
     return undefined; // par défaut
   }
   ```

## ⏳ À Faire

### Fichiers à Mettre à Jour (par priorité)

#### 🔴 Critiques (18 fichiers)

1. ✅ `src/quotation/domain/valueObjects/Discount.ts` → Alias de compatibilité
2. ✅ `src/quotation/domain/valueObjects/AppliedRule.ts` → Nouvelle classe
3. ⏳ `src/quotation/domain/services/RuleEngine.ts` → Utiliser nouvelle interface
4. ⏳ `src/quotation/domain/services/__tests__/RuleEngine.test.ts`
5. ⏳ `src/quotation/domain/valueObjects/Quote.ts`
6. ⏳ `src/quotation/application/strategies/MovingQuoteStrategy.ts`
7. ⏳ `src/quotation/application/strategies/CleaningQuoteStrategy.ts`
8. ⏳ `src/quotation/application/strategies/DeliveryQuoteStrategy.ts`
9. ⏳ `src/quotation/application/strategies/PackingQuoteStrategy.ts`
10. ⏳ `src/quotation/application/services/PriceService.ts`
11. ⏳ `src/quotation/application/services/FallbackCalculatorService.ts`
12. ⏳ `src/__tests__/integration/rules-calculation.test.ts`
13. ⏳ `scripts/test-consumed-constraints.ts`
14. ⏳ `src/quotation/interfaces/http/controllers/QuoteRequestController.ts`
15. ⏳ `src/lib/calculation-debug-logger.ts`
16. ⏳ `src/types/quote.ts`
17. ⏳ `src/types/professional-attribution.ts`
18. ⏳ `src/notifications/infrastructure/events/handlers/invoicing.handler.ts`

## 📝 Décision Requise

Le refactoring est **assez massif** (18 fichiers, 444+ lignes dans RuleEngine seul).

### Options :

#### Option 1 : Refactoring Complet Immédiat (Recommandé pour cohérence)

- ✅ Cohérence totale immédiate
- ✅ Pas de dette technique
- ⏱️ Temps : 2-3 heures
- ⚠️ Risque : Moyen (beaucoup de changements)

#### Option 2 : Migration Progressive avec Alias

- ✅ Minimise les risques
- ✅ Permet de tester progressivement
- ⏱️ Temps : 4-5 heures (étalé sur plusieurs jours)
- ✅ Risque : Faible
- ⚠️ Dette : Coexistence temporaire de deux systèmes

#### Option 3 : Refactoring Partiel (Core Only)

- Mettre à jour seulement RuleEngine, Quote, et tests
- Garder l'alias pour le reste
- ⏱️ Temps : 1-2 heures
- ⚠️ Incohérence partielle

### Ma Recommandation

**Option 2 - Migration Progressive** pour les raisons suivantes :

1. **Sécurité** : Les alias permettent de tester sans tout casser
2. **Tests Continus** : On peut valider après chaque fichier
3. **Rollback Facile** : Si problème, on peut revenir en arrière
4. **Moins de Pression** : Pas besoin de tout faire d'un coup

### Plan de Migration Progressive

**Phase 1 (30 min)** ✅ Terminée

- Créer nouvelle interface
- Créer AppliedRule
- Créer alias

**Phase 2 (1h)** ⏳ En cours

- Refactoriser RuleEngine
- Mettre à jour tests RuleEngine
- Valider que les tests passent

**Phase 3 (1h)**

- Mettre à jour les 4 strategies
- Mettre à jour PriceService
- Valider que les tests passent

**Phase 4 (1h)**

- Mettre à jour tests d'intégration
- Mettre à jour script standalone
- Valider que tous les tests passent

**Phase 5 (30 min)**

- Mettre à jour types et controllers
- Supprimer les alias
- Build final et validation complète

## 🎯 Prochaine Étape Immédiate

**Voulez-vous que je continue avec le refactoring du RuleEngine maintenant ?**

Ou préférez-vous :

1. Voir d'abord un exemple concret de l'avant/après
2. Reporter le refactoring à plus tard
3. Faire seulement une partie (ex: juste l'interface, garder Discount)

---

**Temps écoulé** : 30 minutes
**Temps restant estimé** : 2-3 heures (option 2)
**Fichiers modifiés** : 3/18 (17%)
