# 🏗️ Architecture Modulaire pour le Moteur de Devis Déménagement

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## 📚 Documentation

Cette documentation est organisée en plusieurs fichiers thématiques pour faciliter la navigation et la maintenance.

### 📖 Documents principaux

1. **[Vue d'ensemble & Principes](./01-overview.md)**
   - Objectif, philosophie, périmètre géographique
   - Principes d'architecture
   - Structure du projet

2. **[Types fondamentaux](./02-types-and-interfaces.md)**
   - QuoteContext, ComputedContext, QuoteModule
   - Interfaces et types TypeScript complets
   - Typologie des modules (Type A/B/C)

3. **[Typologie des modules](./03-module-typology.md)**
   - Guide de décision : Quand utiliser `isApplicable()` ?
   - Type A — Modules inconditionnels
   - Type B — Modules conditionnels métier
   - Type C — Modules déclenchés par état calculé
   - Séparation Requirements / Cross-Selling

4. **[Phases du pipeline](./04-pipeline-phases.md)**
   - Les 9 phases du pipeline (ORDRE STRICT)
   - Phases temporelles (QUOTE/CONTRACT/OPERATIONS)
   - Ordre d'exécution dans le moteur

5. **[Système d'exécution](./05-execution-engine.md)**
   - QuoteEngine (code canonique complet)
   - Registre des modules (getAllModules)
   - Point d'entrée principal

### 🎯 Fonctionnalités avancées

6. **[Multi-offres](./06-multi-offers.md)**
   - Génération de 6 devis parallèles
   - Concept QuoteScenario
   - Les 6 scénarios marketing standards
   - Clarifications importantes et cas limites (25 points)
   - Recommandations UI

7. **[Modules de coût structurels](./07-cost-modules.md)**
   - Pourquoi ces modules sont critiques
   - Typologie des modules de coût
   - Exemples concrets de calcul

### 📋 Guides et règles

8. **[Règles et interdictions](./08-rules-and-prohibitions.md)**
   - Interdictions absolues (4 règles strictes)
   - Erreurs critiques à éviter (8 erreurs communes)
   - Exemples de code correct/incorrect

9. **[Plan d'implémentation](./10-implementation-plan.md)**
    - Stratégie MVP (3 phases)
    - Checklist complète de mise en place
    - Modules par catégorie

10. **[Migration](./11-migration.md)**
    - Stratégie de migration progressive
    - 6 phases de migration (Semaine 1-12)

11. **[Recommandations](./12-recommendations.md)**
    - Points forts de l'organisation
    - Points d'attention
    - Recommandations pratiques
    - Prochaines étapes

12. **[Changelog](./13-changelog.md)**
    - Historique des corrections
    - Versions et dates
    - Corrections critiques par version

---

## 🚀 Démarrage rapide

Pour comprendre rapidement l'architecture :

1. **Commencez par** [Vue d'ensemble](./01-overview.md) - Comprendre les objectifs et principes
2. **Lisez** [Types fondamentaux](./02-types-and-interfaces.md) - Connaître les interfaces de base
3. **Consultez** [Système d'exécution](./05-execution-engine.md) - Voir comment tout s'orchestre
4. **Explorez** [Multi-offres](./06-multi-offers.md) - Découvrir les fonctionnalités avancées

---

## 📋 Navigation rapide par sujet

### Pour comprendre les modules
- [Typologie des modules](./03-module-typology.md) - Types A/B/C et `isApplicable()`
- [Phases du pipeline](./04-pipeline-phases.md) - Ordre d'exécution strict
- [Modules de coût](./07-cost-modules.md) - Coûts structurels indispensables

### Pour éviter les erreurs
- [Règles et interdictions](./08-rules-and-prohibitions.md) - Ce qu'il ne faut JAMAIS faire
- [Erreurs critiques](./08-rules-and-prohibitions.md#erreurs-critiques-à-éviter) - 8 erreurs communes

### Pour implémenter
- [Plan d'implémentation](./10-implementation-plan.md) - Stratégie MVP et checklist
- [Migration](./11-migration.md) - Comment migrer progressivement

### Pour les fonctionnalités avancées
- [Multi-offres](./06-multi-offers.md) - Génération de 6 devis parallèles
- [Système d'exécution](./05-execution-engine.md) - Code canonique complet

---

## 🔗 Liens externes

---

## 📝 Note importante

Cette documentation est la référence principale pour l'architecture modulaire du moteur de devis.

**Pour toute modification** : Modifier les fichiers dans `src/quotation-module/docs/` directement.

---

## 🎯 Structure de la documentation

```
src/quotation-module/docs/
├── README.md                    # ← Vous êtes ici
├── 01-overview.md              # Vue d'ensemble & Principes
├── 02-types-and-interfaces.md  # Types fondamentaux
├── 03-module-typology.md       # Typologie des modules
├── 04-pipeline-phases.md       # Phases du pipeline
├── 05-execution-engine.md      # Système d'exécution
├── 06-multi-offers.md          # Multi-offres
├── 07-cost-modules.md          # Modules de coût structurels
├── 08-rules-and-prohibitions.md # Règles & Erreurs
├── 10-implementation-plan.md   # Plan d'implémentation
├── 11-migration.md             # Migration progressive
├── 12-recommendations.md       # Avis et recommandations
└── 13-changelog.md             # Corrections apportées
```

---

**Dernière mise à jour** : 2025-01-XX (v1.8 - Multi-offres / Génération de devis parallèles)

