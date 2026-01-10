# 📚 Historique des Modifications des Scénarios

**Date** : 2025-01-07  
**Source** : Analyse critique vs pratiques du secteur déménagement  
**Objectif** : Aligner les scénarios avec les standards du marché

---

## 📋 Problèmes Identifiés (Analyse Initiale)

### 1. ❌ `furniture-lift-cost` forcé uniquement en SÉCURITÉ

**Problème** : Le monte-meubles est une contrainte technique, pas une prestation de confort. Il devrait être conditionnel partout selon les contraintes d'accès, pas forcé par scénario.

**Solution appliquée** : Rendre `furniture-lift-cost` conditionnel partout (basé sur `pickupFurnitureLift` / `deliveryFurnitureLift`), sauf si contrainte technique l'impose.

---

### 2. ❌ `insurance-premium` jamais forcé

**Problème** : Les formules Premium / Sécurité incluent généralement une assurance renforcée par défaut. Laisser l'assurance toujours optionnelle est atypique pour le haut de gamme.

**Solution appliquée** : Forcer `insurance-premium` en PREMIUM et SÉCURITÉ+ avec une valeur déclarée par défaut (50 000€).

---

### 3. ❌ `supplies-cost` toujours optionnel

**Problème** : En Confort / Premium, les fournitures (cartons, protections) sont incluses. Les rendre optionnelles dilue la promesse de confort.

**Solution appliquée** : Inclure `supplies-cost` en CONFORT, PREMIUM et SÉCURITÉ+ (forcé). **Note** : Initialement fixé à 100€, puis remplacé par un calcul dynamique basé sur le volume (voir `SOLUTION_FOURNITURES_DYNAMIQUES.md`).

---

### 4. ⚠️ Distinction CONFORT / SÉCURITÉ peu lisible

**Problème** : Actuellement, SÉCURITÉ = monte-meubles + démontage. Mais dans le secteur, la sécurité se traduit plutôt par :
- Assurance renforcée
- Gestion objets fragiles
- Méthodes de manutention
- Responsabilité accrue

**Solution appliquée** : Renommer SÉCURITÉ en SÉCURITÉ+ et repositionner comme formule de protection maximale avec assurance incluse.

---

## ✅ Modifications Appliquées

### 1. QuoteScenario.ts - Scénarios Mis à Jour

#### ECO
- ✅ Ajout de `supplies-cost`, `overnight-stop-cost`, `crew-flexibility` dans `disabledModules`

#### STANDARD
- ✅ Aucun changement (reste conditionnel sur tous les modules)

#### CONFORT
- ✅ Ajout de `supplies-cost` dans `enabledModules`
- ✅ Retrait de `high-value-item-handling` des modules forcés (reste conditionnel ⭕)
- ✅ Ajout de `forceSupplies: true` dans `overrides` (remplace `crossSellingSuppliesTotal: 100`)

#### PREMIUM
- ✅ Ajout de `supplies-cost` et `insurance-premium` dans `enabledModules`
- ✅ Ajout de `declaredValueInsurance: true` et `declaredValue: 50000` dans `overrides`
- ✅ Ajout de `forceSupplies: true` dans `overrides` (remplace `crossSellingSuppliesTotal: 100`)

#### SÉCURITÉ+ (anciennement SÉCURITÉ)
- ✅ Renommé `id: 'SECURITY'` → `id: 'SECURITY_PLUS'`
- ✅ Renommé `label: 'Sécurité'` → `label: 'Sécurité+'`
- ✅ Retrait de `furniture-lift-cost` des `enabledModules` (reste conditionnel ⭕*)
- ✅ Retrait de `refuseLiftDespiteRecommendation: false` des `overrides`
- ✅ Ajout de `packing-cost`, `cleaning-end-cost`, `high-value-item-handling`, `supplies-cost`, `insurance-premium` dans `enabledModules`
- ✅ Ajout de `packing: true`, `cleaningEnd: true` dans `overrides`
- ✅ Ajout de `declaredValueInsurance: true` et `declaredValue: 50000` dans `overrides`
- ✅ Ajout de `forceSupplies: true` dans `overrides` (remplace `crossSellingSuppliesTotal: 100`)
- ✅ Mise à jour de la description pour clarifier le positionnement

#### FLEX
- ✅ Aucun changement (déjà conforme)

---

### 2. ScenarioRecommendationEngine.ts - Moteur de Recommandation

- ✅ Renommé `CLIENT_PHRASES.SECURITY` → `CLIENT_PHRASES.SECURITY_PLUS`
- ✅ Renommé `scoreSECURITY()` → `scoreSECURITY_PLUS()`
- ✅ Mise à jour de la logique de scoring pour SÉCURITÉ+ :
  - Focus sur objets de valeur et assurance incluse
  - Monte-meubles reste conditionnel (pas forcé)
  - Pénalités ajustées pour petits volumes sans objets de valeur

---

### 3. SuppliesCostModule.ts - Calcul Dynamique des Fournitures

**Problème identifié** : Les scénarios forçaient `crossSellingSuppliesTotal: 100` au lieu d'utiliser le total réel ou un calcul dynamique.

**Solution appliquée** :
- ✅ Suppression des overrides `crossSellingSuppliesTotal: 100`
- ✅ Ajout du flag `forceSupplies: true` dans les scénarios
- ✅ Modification de `SuppliesCostModule` pour calculer un pack recommandé selon le volume si le client n'a rien sélectionné
- ✅ Respect du total réel si le client a sélectionné des fournitures

**Voir** : `SOLUTION_FOURNITURES_DYNAMIQUES.md` pour les détails

---

### 4. Tests

- ✅ `two-step-calculation.test.ts` : Mis à jour pour utiliser `SECURITY_PLUS`
- ✅ `FurnitureLiftCostModule.test.ts` : Mis à jour le test pour refléter que le monte-meubles est conditionnel

---

### 5. Documentation

- ✅ `SCENARIOS_ET_MODULES.md` : Section SÉCURITÉ+ mise à jour avec nouveaux modules
- ✅ `TABLEAU_MODULES_PAR_SCENARIO.md` : Tableau récapitulatif mis à jour
- ✅ `06-multi-offers.md` : Scénarios mis à jour
- ✅ `SYNTHESE_FLUX_CALCUL.md` : Exemples de prix mis à jour
- ✅ `QuoteController.ts` : Commentaire mis à jour

---

## 📊 Tableau Final des Scénarios

| Module                   | ECO | STANDARD | CONFORT | SÉCURITÉ+ | PREMIUM | FLEX |
| ------------------------ | :-: | :------: | :-----: | :-------: | :-----: | :--: |
| `packing-cost`           |  ❌  |     ⭕    |    ✅    |     ✅     |    ✅    |   ⭕  |
| `cleaning-end-cost`      |  ❌  |     ❌    |    ⭕    |     ✅     |    ✅    |   ⭕  |
| `dismantling-cost`       |  ❌  |     ⭕    |    ✅    |     ✅     |    ✅    |   ✅  |
| `reassembly-cost`        |  ❌  |     ⭕    |    ✅    |     ✅     |    ✅    |   ✅  |
| `furniture-lift-cost`    |  ⭕  |     ⭕    |    ⭕    |     ⭕*    |    ⭕    |   ⭕  |
| `high-value-item-handling` |  ❌  |     ⭕    |    ⭕    |     ✅     |    ✅    |   ⭕  |
| `overnight-stop-cost`    |  ❌  |     ❌    |    ⭕    |     ⭕     |    ⭕    |   ✅  |
| `crew-flexibility`       |  ❌  |     ❌    |    ⭕    |     ⭕     |    ⭕    |   ✅  |
| `supplies-cost`          |  ❌  |     ⭕    |    ✅    |     ✅     |    ✅    |   ⭕  |
| `insurance-premium`      |  ⭕  |     ⭕    |    ⭕    |     ✅     |    ✅    |   ⭕  |

**Légende :**
- ✅ = **Forcé** (inclus d'office dans la formule)
- ❌ = **Désactivé** (jamais inclus, même si client coche)
- ⭕ = **Conditionnel** (selon sélection client ou contraintes techniques)
- ⭕* = **Conditionnel technique** (forcé uniquement si contrainte technique l'impose, ex: étage ≥5)

---

## 🎯 Bénéfices des Modifications

### Côté Business
- ✅ Meilleure différenciation des offres
- ✅ Upsell naturel vers PREMIUM / SÉCURITÉ+
- ✅ FLEX reste un vrai « devis à la carte »
- ✅ Alignement avec les standards du marché

### Côté Technique
- ✅ Modules techniques (monte-meubles) pilotés par règles métier
- ✅ Modules commerciaux lisibles et progressifs
- ✅ Système override / ctx reste exploitable
- ✅ Architecture modulaire respectée
- ✅ Calcul dynamique des fournitures selon le volume

---

## 📝 Checklist Finale

- [x] Modification 1 : Retirer `furniture-lift-cost` des modules forcés en SÉCURITÉ+
- [x] Modification 2 : Ajouter `insurance-premium` en PREMIUM et SÉCURITÉ+
- [x] Modification 3 : Ajouter `supplies-cost` en CONFORT, PREMIUM et SÉCURITÉ+
- [x] Modification 4 : Renommer SÉCURITÉ en SÉCURITÉ+
- [x] Modification 5 : Ajuster les modules désactivés en ECO
- [x] Modification 6 : Ajuster CONFORT selon nouveau tableau
- [x] Modification 7 : Ajuster PREMIUM selon nouveau tableau
- [x] Modification 8 : Ajuster SÉCURITÉ+ selon nouveau tableau
- [x] Modification 9 : Ajuster FLEX selon nouveau tableau
- [x] Mettre à jour ScenarioRecommendationEngine.ts
- [x] Mettre à jour SuppliesCostModule.ts (calcul dynamique)
- [x] Mettre à jour les tests
- [x] Mettre à jour toute la documentation

---

**Dernière mise à jour** : 2025-01-07

