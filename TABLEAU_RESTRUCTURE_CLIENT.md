# 📊 Tableau Restructuré - Lecture Orientée Client

**Date** : 2025-01-XX  
**Objectif** : Restructurer le tableau des modules pour une lecture client immédiate et claire

---

## 🎯 Principe de Restructuration

### Organisation Hiérarchique

1. **Modules les plus souvent inclus par défaut** → Placés en haut
2. **Lecture verticale évidente** → Plus on monte en gamme, plus de "✅"
3. **Modules techniques ou contextuels** → Regroupés en bas

### Avantages

- ✅ Lecture client immédiate sans légende technique
- ✅ Progression claire de l'offre (ECO → PREMIUM)
- ✅ Meilleure conversion (compréhension rapide)
- ✅ Distinction claire entre services inclus et conditionnels

---

## 📋 Tableau Restructuré - Formules de Déménagement

| Module / Prestation              |  ECO  |  STANDARD  |  CONFORT  |  PREMIUM  |  SÉCURITÉ+  |  FLEX  |
| -------------------------------- | :---: | :--------: | :-------: | :-------: | :---------: | :----: |
| **Emballage (packing)**          |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ⭕   |
| **Fournitures (cartons, etc.)**  |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ⭕   |
| **Démontage des meubles**        |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ✅   |
| **Remontage des meubles**        |   ❌   |      ⭕     |     ✅     |     ✅     |      ✅      |    ✅   |
| **Objets de valeur / fragiles**  |   ❌   |      ⭕     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| **Assurance renforcée**          |   ⭕   |      ⭕     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| -------------------------------- | ----- | ---------- | --------- | --------- | ----------- | ------ |
| **Nettoyage fin de prestation**  |   ❌   |      ❌     |     ⭕     |     ✅     |      ✅      |    ⭕   |
| **Monte-meubles (si requis)**    |   ⭕*  |     ⭕*     |     ⭕*    |     ⭕*    |      ⭕*     |   ⭕*   |
| **Étape / nuit intermédiaire**   |   ❌   |      ❌     |     ⭕     |     ⭕     |      ⭕      |    ✅   |
| **Flexibilité équipe / planning**|   ❌   |      ❌     |     ⭕     |     ⭕     |      ⭕      |    ✅   |

**Légende :**
- ✅ = **Inclus d'office** dans la formule
- ❌ = **Non disponible** dans cette formule
- ⭕ = **Disponible en option** (selon vos besoins)
- ⭕* = **Conditionnel technique** (recommandé automatiquement si nécessaire, ex: étage ≥3 ou ≥5)

---

## 🧩 Lecture Client Immédiate

### ECO - Transport uniquement
- ❌ Aucun service inclus
- ✅ Transport sécurisé uniquement
- ✅ Main-d'œuvre pour chargement/déchargement
- **Idéal pour** : Petits budgets, client prêt à tout faire

### STANDARD - Participation client
- ⭕ Services disponibles en option selon vos besoins
- ✅ Équilibre prix/service
- **Idéal pour** : La majorité des déménagements

### CONFORT - Déménageur fait l'essentiel
- ✅ Emballage professionnel inclus
- ✅ Fournitures incluses
- ✅ Démontage/remontage inclus
- ⭕ Objets de valeur en option
- **Idéal pour** : Familles, personnes pressées

### PREMIUM - Prise en charge complète
- ✅ Tous les services inclus (emballage, fournitures, démontage, remontage, objets de valeur)
- ✅ Nettoyage fin de bail inclus
- ✅ Assurance renforcée incluse
- **Idéal pour** : Délégation totale, service clé en main

### SÉCURITÉ+ - Premium + Protection maximale
- ✅ Tous les services PREMIUM inclus
- ✅ Protection maximale avec assurance incluse
- ⭕* Monte-meubles si nécessaire (recommandé automatiquement)
- **Idéal pour** : Objets de valeur, biens fragiles, protection maximale

### FLEX - Devis sur mesure
- ✅ Démontage/remontage inclus
- ✅ Garantie flexibilité équipe
- ✅ Arrêt nuit si longue distance
- ⭕ Autres services en option
- **Idéal pour** : Déménagements longue distance, volume incertain

---

## 📝 Correspondance Technique

| Prestation Client | Module Technique | ID Module |
|-------------------|------------------|-----------|
| Emballage | PackingCostModule | `packing-cost` |
| Fournitures | SuppliesCostModule | `supplies-cost` |
| Démontage des meubles | DismantlingCostModule | `dismantling-cost` |
| Remontage des meubles | ReassemblyCostModule | `reassembly-cost` |
| Objets de valeur / fragiles | HighValueItemHandlingModule | `high-value-item-handling` |
| Assurance renforcée | InsurancePremiumModule | `insurance-premium` |
| Nettoyage fin de prestation | CleaningEndCostModule | `cleaning-end-cost` |
| Monte-meubles (si requis) | FurnitureLiftCostModule | `furniture-lift-cost` |
| Étape / nuit intermédiaire | OvernightStopCostModule | `overnight-stop-cost` |
| Flexibilité équipe / planning | CrewFlexibilityModule | `crew-flexibility` |

---

## 🎯 Bénéfices de cette Restructuration

### Côté Client
- ✅ Compréhension immédiate sans formation technique
- ✅ Progression claire de l'offre (ECO → PREMIUM)
- ✅ Distinction évidente entre inclus et optionnel
- ✅ Meilleure conversion (décision facilitée)

### Côté Business
- ✅ Upsell naturel vers CONFORT/PREMIUM
- ✅ Positionnement clair de chaque formule
- ✅ Réduction des questions clients
- ✅ Tableau utilisable directement en UI

---

## 📱 Utilisation en Interface Client

Ce tableau peut être utilisé directement dans l'interface utilisateur :

1. **Section comparaison** : Afficher ce tableau pour comparer les formules
2. **Sélection de formule** : Afficher les ✅ pour montrer ce qui est inclus
3. **Tooltips** : Expliquer les ⭕* (conditionnel technique)
4. **Recommandation** : Mettre en évidence la formule recommandée

---

**Dernière mise à jour** : 2025-01-XX

