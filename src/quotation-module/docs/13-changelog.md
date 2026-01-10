# 📝 Changelog

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## 📝 Changelog

### Version 1.8 (2025-01-XX)

**Refactorisation de la documentation** :
- ✅ Documentation divisée en fichiers séparés pour meilleure navigation
- ✅ Structure modulaire avec README principal
- ✅ Chaque section dans son propre fichier markdown

**Améliorations** :
- ✅ Navigation améliorée avec liens entre fichiers
- ✅ Structure claire et organisée
- ✅ Facilité de maintenance

---

### Version 1.7 (2025-01-XX)

**Multi-offres / Génération de devis parallèles** :
- ✅ Concept de `QuoteScenario` pour stratégies marketing
- ✅ Génération de 6 devis en parallèle depuis un même formulaire
- ✅ Filtrage de modules via `enabledModules` / `disabledModules`
- ✅ Overrides contrôlés du contexte
- ✅ Politique de marge différente par scénario
- ✅ 25 clarifications sur cas limites et ambiguïtés

---

### Version 1.6 (2025-01-XX)

**Corrections critiques** :
- ✅ **Duplication supprimée** : Chaque module apparaît UNE SEULE FOIS dans `getAllModules()`
- ✅ **Organisation par phases** : Modules organisés par PHASE (1-9), pas par Type (A/B/C)
- ✅ **Clarification priorité/phase** : La priorité détermine la phase, pas le type
- ✅ **Garde-fous ajoutés** : Validation des prérequis implicites (hasPrerequisites)
- ✅ **PHASE 1 renforcée** : Normalisation obligatoire avec arrêt sur erreur
- ✅ **Namespace cross-selling** : Modules cross-selling avec ID `CROSS_SELL_` ou `OPTION_`
- ✅ **Séparation stricte** : Requirements / Cross-Selling / Options bien distingués

---

### Version 1.5 (2025-01-XX)

**Clarifications importantes** :
- ✅ **Périmètre géographique clarifié** : Point de départ strictement IDF, arrivée IDF ou Province
- ✅ **Modules longue distance ajoutés** : Obligatoires pour IDF → Province
- ✅ **PHASE 8 clarifiée** : Distinction prix de base vs options additionnelles
- ✅ **Règle absolue Monte-meubles** : Conséquences explicites du refus

---

### Version 1.4 (2025-01-XX)

**Modules de coût structurels** :
- ✅ Structure `Cost` avec catégories (TRANSPORT, LABOR, VEHICLE, RISK, INSURANCE)
- ✅ Calcul du prix de base depuis les coûts + marge
- ✅ Modules de coût séparés des autres types de modules
- ✅ Documentation complète des modules de coût

---

### Version 1.3 (2025-01-XX)

**Phases du pipeline** :
- ✅ 9 phases strictes avec ordre d'exécution (1-9)
- ✅ Plages de priorités par phase (10-19, 20-29, etc.)
- ✅ Distinction claire entre phases pipeline vs phases temporelles
- ✅ Modules organisés selon les phases du pipeline

---

### Version 1.2 (2025-01-XX)

**Typologie des modules** :
- ✅ Type A (inconditionnels) : Pas de `isApplicable()`
- ✅ Type B (conditionnels métier) : `isApplicable()` obligatoire
- ✅ Type C (déclenchés par état) : `isApplicable()` avec dépendances
- ✅ `isApplicable()` est optionnel par design, pas par oubli

---

### Version 1.1 (2025-01-XX)

**Corrections critiques** :
- ✅ Suppression de `RiskScoreModule` : Le risque est agrégé par le moteur
- ✅ Séparation stricte Requirements / Cross-Selling
- ✅ Découpage de `VolumeBaseModule` en modules séparés
- ✅ Amélioration de `VehicleSelectionModule` avec contraintes IDF
- ✅ Ajout des modules manquants IDF
- ✅ Modules de coût structurels (CRITIQUES)
- ✅ Notion de PHASE (QUOTE, CONTRACT, OPERATIONS)
- ✅ Initialisation par le moteur uniquement
- ✅ Agrégation du risque par le moteur
- ✅ Calcul du prix de base depuis les coûts + marge

---

### Version 1.0 (2025-01-XX)

**Version initiale** :
- ✅ Architecture modulaire complète
- ✅ Types fondamentaux définis
- ✅ Structure du projet proposée
- ✅ Principes d'architecture établis
- ✅ Interdictions absolues définies

---

## 🔄 Historique des versions

| Version | Date | Principales modifications |
|---------|------|--------------------------|
| 1.8 | 2025-01-XX | Refactorisation documentation |
| 1.7 | 2025-01-XX | Multi-offres / Génération de devis parallèles |
| 1.6 | 2025-01-XX | Corrections critiques (duplication, organisation) |
| 1.5 | 2025-01-XX | Clarifications (périmètre, longue distance, PHASE 8) |
| 1.4 | 2025-01-XX | Modules de coût structurels |
| 1.3 | 2025-01-XX | Phases du pipeline |
| 1.2 | 2025-01-XX | Typologie des modules |
| 1.1 | 2025-01-XX | Corrections critiques |
| 1.0 | 2025-01-XX | Version initiale |

---

## 📌 Notes importantes

- **Version actuelle** : 1.8
- **Statut** : 🟢 Prêt pour implémentation
- **Dernière mise à jour** : 2025-01-XX
- **Prochaine version prévue** : 1.9 (après implémentation)

---

## 🔗 Liens

- Documentation complète : `docs/README.md`
- Vue d'ensemble : `docs/01-overview.md`
- Types fondamentaux : `docs/02-types-and-interfaces.md`
- Typologie des modules : `docs/03-module-typology.md`
- Phases du pipeline : `docs/04-pipeline-phases.md`
- Système d'exécution : `docs/05-execution-engine.md`
- Multi-offres : `docs/06-multi-offers.md`
- Modules de coût : `docs/07-cost-modules.md`
- Règles et interdictions : `docs/08-rules-and-prohibitions.md`
- Plan d'implémentation : `docs/10-implementation-plan.md`
- Migration : `docs/11-migration.md`
- Recommandations : `docs/12-recommendations.md`

