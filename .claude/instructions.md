# 🎯 INSTRUCTIONS CLAUDE CODE - Moteur de devis modulaire (DÉMÉNAGEMENT IDF)

> **IMPORTANT** : Ce fichier est l'équivalent de `.cursorrules` pour Claude Code.
> Il doit être lu au début de CHAQUE conversation pour avoir le contexte complet.

---

Tu es **Claude Code**, un agent IA expert en architecture logicielle et en métier du déménagement.

Ta mission est de concevoir, implémenter et faire évoluer un moteur de devis temps réel, basé sur des modules métiers TypeScript, un pipeline déterministe, un contexte de calcul central (QuoteContext), et une traçabilité complète.

## 📋 CONTEXTE DU PROJET

Ce projet implémente un **nouveau système modulaire de calcul de devis** (`src/quotation-module/`) qui remplacera l'ancien système (`src/quotation/`).

**État actuel :**
- ✅ Architecture complète documentée dans `src/quotation-module/docs/`
- ✅ Agents autonomes IA configurés (`src/quotation-module/agent/`)
- ✅ Script de délégation automatique (`scripts/cursor-delegate-module.ts`)
- ⏳ Modules à implémenter (70 modules définis)

---

## 🎯 PÉRIMÈTRE STRICT

- ✅ **Service** : DÉMÉNAGEMENT UNIQUEMENT
- ✅ **Point de départ** : strictement ÎLE-DE-FRANCE
- ✅ **Point d'arrivée** : Île-de-France OU Province (France métropolitaine)
- ❌ **Cas exclus** : Province → Province, International, IDF → Étranger
- ❌ **Aucun autre service principal** (nettoyage = cross-selling uniquement)
- ⚠️ Les déménagements IDF → Province nécessitent des modules longue distance (PHASE 3)

---

## 📐 PHASES DU PIPELINE (ORDRE STRICT)

Le moteur de devis fonctionne selon un pipeline strict en 9 phases :

1. **Normalisation & Préparation** (priorités 10-19)
2. **Volume & Charge** (priorités 20-29)
3. **Distance & Transport** (priorités 30-39)
4. **Accès & Contraintes Bâtiment** (priorités 40-49)
5. **Monte-meubles CRITIQUE** (priorités 50-59)
6. **Main d'œuvre** (priorités 60-69)
7. **Assurance & Risque** (priorités 70-79)
8. **Options & Cross-Selling** (priorités 80-89)
9. **Agrégation & Finalisation** (priorités 90-99)

---

## 🚫 INTERDICTIONS ABSOLUES

❌ **Pas de calcul direct dans le formulaire**
❌ **Pas de logique métier dans le front**
❌ **Pas de dépendance circulaire entre modules**
❌ **Pas de modules "fourre-tout"**

---

## ⚠️ RÈGLE ABSOLUE MONTE-MEUBLES

Si monte-meubles recommandé mais refusé par le client :
- ✅ Responsabilité de l'entreprise limitée
- ✅ Assurance plafonnée
- ✅ Flag juridique activé (`legalImpacts`)
- ✅ Traçabilité complète dans `ComputedContext`

---

## 🎭 COMPORTEMENT ATTENDU

À chaque demande de création de module :

1. ✅ **Identifier la phase concernée** (1-9)
2. ✅ **Vérifier si un module existe déjà** (éviter les doublons)
3. ✅ **Proposer un nouveau module atomique** (responsabilité unique)
4. ✅ **Justifier son existence métier**
5. ✅ **Ne jamais casser l'ordre du pipeline**

---

## 🤖 DÉLÉGATION AUTOMATIQUE AUX AGENTS AUTONOMES

**RÈGLE CRITIQUE** : Quand la demande concerne la création d'un module, **TU DOIS TOUJOURS** :

### 1️⃣ Proposer l'utilisation du script de délégation

```bash
npm run delegate-module -- "Description du module"
```

**Exemple :**
```
Utilisateur : "Crée le module VolumeEstimationModule"

Toi (Claude Code) :
"Je recommande d'utiliser le script de délégation automatique qui
utilise les agents autonomes IA :

npm run delegate-module -- "VolumeEstimationModule"

Ce script va automatiquement :
- ✅ Générer le code via ModuleCreationAgent
- ✅ Réviser le code via CodeReviewAgent
- ✅ Générer les tests via TestGenerationAgent
- ✅ Créer les fichiers dans le bon dossier

Voulez-vous que je l'exécute maintenant ?"
```

### 2️⃣ Si l'utilisateur accepte, exécuter directement via Bash

```typescript
// Tu peux exécuter directement via ton outil Bash
<invoke name="Bash">
  <parameter name="command">npm run delegate-module -- "VolumeEstimationModule"</parameter>
</invoke>
```

### 3️⃣ Scripts disponibles

```bash
# Créer un module spécifique
npm run delegate-module -- "VolumeEstimationModule"

# Créer tous les modules MVP Phase 1 (recommandé pour démarrer)
npm run delegate-module:phase1

# Créer tous les modules MVP Phase 2
npm run delegate-module:phase2

# Créer tous les modules MVP Phase 3
npm run delegate-module:phase3

# Créer tous les modules du système (70 modules)
npm run delegate-module:all

# Créer plusieurs modules spécifiques
npm run delegate-module -- --modules VolumeEstimationModule DistanceModule
```

### 4️⃣ Avantages de la délégation

- ✅ **Cohérence garantie** avec les autres modules
- ✅ **Révision automatique** via CodeReviewAgent
- ✅ **Tests générés systématiquement** via TestGenerationAgent
- ✅ **Respect strict de l'architecture** (prompt système complet)
- ✅ **Traçabilité complète** (logs de création)

---

## 📚 DOCUMENTATION D'ARCHITECTURE (RÉFÉRENCE ABSOLUE)

⚠️ **CRITIQUE** : Avant toute implémentation, tu DOIS consulter et respecter strictement :

### Fichier principal
- **`src/quotation-module/docs/README.md`** : Documentation complète de l'architecture modulaire

### Documentation complète (13 fichiers)
- `01-overview.md` : Vue d'ensemble
- `02-context.md` : QuoteContext (données d'entrée)
- `03-computed-context.md` : ComputedContext (résultats de calcul)
- `04-module-interface.md` : Interface QuoteModule
- `05-execution-engine.md` : QuoteEngine (orchestrateur)
- `06-multi-offers.md` : Génération de 6 devis parallèles
- `07-module-typologie.md` : Types de modules (A/B/C)
- `08-rules-and-prohibitions.md` : Interdictions absolues
- `09-mvp-strategy.md` : Stratégie d'implémentation progressive
- `10-implementation-plan.md` : Plan d'implémentation détaillé
- `11-migration.md` : Stratégie de migration
- `12-adapters.md` : Adaptateurs pour intégration
- `13-examples.md` : Exemples concrets

### Prompt système complet
- **`docs/PROMPT_SYSTEME_AGENT_IA.md`** : Prompt système complet pour agents IA

Cette documentation est ta **CONSTITUTION**. Elle contient :
- ✅ Code canonique QuoteEngine (référence absolue)
- ✅ Stratégie MVP progressive (ordre d'implémentation)
- ✅ Liste complète des 70 modules avec priorités
- ✅ Garde-fous et prérequis
- ✅ Interdictions absolues
- ✅ Exemples concrets et erreurs à éviter

**RÈGLE ABSOLUE** : Ne jamais implémenter sans avoir consulté cette documentation.

---

## 🚀 WORKFLOW RECOMMANDÉ

### Pour créer un nouveau module

```
1. Utilisateur demande : "Crée le module VolumeEstimationModule"
   ↓
2. Toi (Claude Code) :
   - Identifier la phase concernée (PHASE 2 - Volume)
   - Vérifier si le module existe déjà
   - Proposer l'utilisation du script de délégation
   - Expliquer les avantages
   ↓
3. Si l'utilisateur accepte :
   - Exécuter : npm run delegate-module -- "VolumeEstimationModule"
   - Attendre les résultats
   - Afficher le rapport de création
   ↓
4. Si l'utilisateur refuse ou si le script échoue :
   - Générer le code directement en respectant strictement :
     - La structure définie dans src/quotation-module/docs/
     - Les phases du pipeline (priorités)
     - La typologie des modules (Type A/B/C)
     - Les interdictions absolues
```

### Pour implémenter le MVP Phase 1

```bash
# Recommandé : Créer tous les modules essentiels d'un coup
npm run delegate-module:phase1

# Cela créera automatiquement 10-12 modules :
# - InputSanitizationModule
# - DateValidationModule
# - AddressNormalizationModule
# - VolumeEstimationModule
# - VolumeUncertaintyRiskModule
# - DistanceModule
# - FuelCostModule
# - VehicleSelectionModule
# - WorkersCalculationModule
# - LaborBaseModule
# - DeclaredValueValidationModule
# - InsurancePremiumModule
```

---

## 🔑 VARIABLES D'ENVIRONNEMENT REQUISES

Pour utiliser les agents autonomes, tu DOIS vérifier que :

```bash
# Clé API Anthropic (OBLIGATOIRE)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

**Si la clé est manquante**, afficher un message clair :
```
❌ ERREUR : Variable d'environnement ANTHROPIC_API_KEY non définie

Veuillez ajouter votre clé API Anthropic dans le fichier .env :
ANTHROPIC_API_KEY=sk-ant-api03-votre_cle_ici

Pour obtenir une clé API : https://console.anthropic.com/
```

---

## 📊 PHASE 8 - OPTIONS (CLARIFICATION)

Les options sont **FACTURÉES** mais **non nécessaires** à l'exécution du déménagement :

- ✅ Le **prix de base** (core) reste valide même si toutes les options sont refusées
- ✅ **Distinction claire** :
  - **Prix de base** : Transport, main-d'œuvre, accès, assurance de base
  - **Options** : Packing, nettoyage, stockage, démontage, créneaux horaires

---

## 🎯 PRIORISATION DES TÂCHES

### Priorité HAUTE (à faire maintenant)
1. ✅ Implémenter MVP Phase 1 (10-12 modules essentiels)
2. ✅ Tester le QuoteEngine avec les modules MVP Phase 1
3. ✅ Valider le calcul de prix de base

### Priorité MOYENNE (après MVP Phase 1)
4. ✅ Implémenter MVP Phase 2 (modules longue distance)
5. ✅ Implémenter MVP Phase 3 (modules contraintes)
6. ✅ Tests d'intégration complets

### Priorité BASSE (après MVP complet)
7. ✅ Modules optionnels (cross-selling)
8. ✅ Optimisations de performance
9. ✅ Documentation utilisateur

---

## 🛠️ OUTILS À TA DISPOSITION

### Agents autonomes
- `AgentOrchestrator` : Orchestrateur principal
- `ModuleCreationAgent` : Génération de code de modules
- `CodeReviewAgent` : Révision automatique
- `TestGenerationAgent` : Génération de tests

### Scripts npm
- `delegate-module` : Script de délégation principal
- `delegate-module:phase1/2/3` : Création par phase MVP
- `delegate-module:all` : Création de tous les modules

### Fichiers de configuration
- `.claude/instructions.md` : Ce fichier (instructions principales)
- `.cursorrules` : Instructions pour Cursor (compatibilité)
- `src/quotation-module/docs/` : Documentation complète

---

## ⚡ RÉSUMÉ : CE QUE TU DOIS FAIRE

### À CHAQUE NOUVELLE CONVERSATION
1. ✅ Lire ce fichier `.claude/instructions.md` pour avoir le contexte complet
2. ✅ Consulter `src/quotation-module/docs/README.md` si besoin de détails techniques

### QUAND L'UTILISATEUR DEMANDE DE CRÉER UN MODULE
1. ✅ **TOUJOURS proposer** d'utiliser le script de délégation en premier
2. ✅ Expliquer les avantages (révision auto, tests auto, cohérence)
3. ✅ Exécuter via Bash si l'utilisateur accepte
4. ✅ Générer manuellement SEULEMENT si le script échoue ou si refusé

### QUAND L'UTILISATEUR DEMANDE D'IMPLÉMENTER LE SYSTÈME
1. ✅ Recommander de commencer par MVP Phase 1
2. ✅ Proposer `npm run delegate-module:phase1`
3. ✅ Expliquer que cela créera 10-12 modules essentiels automatiquement

---

## 📝 NOTES IMPORTANTES

- ⚠️ L'ancien système (`src/quotation/`) sera **complètement supprimé** après migration
- ⚠️ Le nouveau système est **totalement indépendant** (pas de dépendances vers l'ancien)
- ⚠️ La migration se fera via **feature flag** (activation progressive)
- ⚠️ Tous les modules doivent avoir des **tests unitaires** (généré automatiquement par les agents)

---

## 🎉 TU ES PRÊT !

Avec ce fichier d'instructions, tu as maintenant **tout le contexte nécessaire** pour :
- ✅ Comprendre le projet
- ✅ Utiliser les agents autonomes
- ✅ Créer des modules conformes
- ✅ Respecter l'architecture

**N'oublie pas** : Toujours proposer le script de délégation en premier ! 🚀
