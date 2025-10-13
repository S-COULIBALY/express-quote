# 📚 Guide Complet des Tests - Express Quote

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Tests d'intégration Jest](#tests-dintégration-jest)
3. [Script de test standalone](#script-de-test-standalone)
4. [Commandes npm](#commandes-npm)
5. [Résultats attendus](#résultats-attendus)

---

## 🎯 Vue d'ensemble

Le projet contient deux types de tests pour le système de règles et contraintes :

### Tests d'Intégration Jest

- **Localisation** : `src/__tests__/integration/rules-calculation.test.ts`
- **Nombre de tests** : **23 tests**
- **Framework** : Jest + ts-jest
- **Base de données** : PostgreSQL (via Prisma)

### Script de Test Standalone

- **Localisation** : `scripts/test-consumed-constraints.ts`
- **Nombre de tests** : **12 scénarios**
- **Exécution** : ts-node directement
- **Base de données** : PostgreSQL (via Prisma)

---

## 🧪 Tests d'Intégration Jest

### Fichier : `src/__tests__/integration/rules-calculation.test.ts`

### 📊 Couverture des Tests (23 tests)

#### ✅ Tests Originaux (11 tests)

1. **Sans monte-meubles** - Étage 2, pas d'ascenseur
2. **Avec monte-meubles** - Étage 5, pas d'ascenseur
3. **Ascenseur inadapté** - Étage 4, ascenseur small
4. **Contraintes mixtes** - Consommées vs non-consommées
5. **Règles temporelles** - Week-end (samedi)
6. **Pas de week-end** - En semaine (lundi)
7. **Règles de réduction** - Client fidèle
8. **Prix minimum** - Petit volume/distance
9. **Validation règles** - Chargement BDD
10. **Règles de contraintes** - Présence escaliers/couloirs/monte-meuble
11. **Structure valide** - Toutes les règles ont une condition

#### 🔥 Crash Test - Valeurs Extrêmes (3 tests)

12. **Volume extrême** - 500m³, étages 45 et 38, 6 contraintes
13. **Toutes contraintes** - 13 contraintes départ + 7 arrivée
14. **Prix élevé** - Prix de base 50000€

#### 🎯 Edge Cases - Cas Limites (5 tests)

15. **Seuil exact** - Étage 3 (pas de monte-meuble)
16. **Seuil+1** - Étage 4 (monte-meuble requis)
17. **Rez-de-chaussée** - Étage 0
18. **Distance 0** - Même immeuble
19. **Volume minimal** - 1m³

#### ⚡ Performance (1 test)

20. **100 calculs** - Moins de 10 secondes

#### ✅ Cohérence du Système (3 tests)

21. **Pas de prix négatif** - 3 cas de test
22. **Déterminisme** - Résultats identiques pour contexte identique
23. **Contraintes consommées** - Exclues de la facturation

### 🚀 Commandes Jest

#### Lancer tous les tests d'intégration

```bash
npm run test:integration
```

#### Lancer avec couverture de code

```bash
npm run test:integration -- --coverage
```

#### Lancer en mode watch (surveillance des changements)

```bash
npm run test:integration -- --watch
```

#### Lancer un test spécifique

```bash
npm run test:integration -- -t "devrait gérer un volume extrêmement élevé"
```

#### Lancer une catégorie de tests

```bash
# Tests de crash
npm run test:integration -- -t "CRASH TEST"

# Tests edge cases
npm run test:integration -- -t "EDGE CASES"

# Tests de performance
npm run test:integration -- -t "PERFORMANCE"

# Tests de cohérence
npm run test:integration -- -t "CONSISTENCY"
```

---

## 🔧 Script de Test Standalone

### Fichier : `scripts/test-consumed-constraints.ts`

### 📊 Couverture des Tests (12 scénarios)

#### ✅ Tests de Base (4 scénarios)

1. **Sans monte-meubles** - Étage 2
2. **Étage élevé** - Étage 5
3. **Ascenseur inadapté** - Étage 4, ascenseur small
4. **Contraintes mixtes** - Consommées + non-consommées

#### 🔥 Crash Test (2 scénarios)

5. **Volume extrême** - 500m³, étages 45 et 38
6. **Toutes contraintes** - 13 contraintes départ + 7 arrivée

#### 🎯 Edge Cases (5 scénarios)

7. **Seuil exact** - Étage 3
8. **Seuil+1** - Étage 4
9. **Rez-de-chaussée** - Étage 0
10. **Distance 0** - Même immeuble
11. **Volume minimal** - 1m³

#### ✅ Cohérence (1 scénario)

12. **Prix élevé** - Prix de base 50000€

### 🚀 Commandes Script Standalone

#### Lancer le script de test

```bash
npm run test:consumed-constraints
```

Ou directement avec ts-node :

```bash
npx ts-node scripts/test-consumed-constraints.ts
```

---

## 📝 Commandes NPM Disponibles

### Tests

```bash
# Tests unitaires (configuration principale)
npm test

# Tests unitaires en mode watch
npm run test:watch

# Tests avec couverture de code
npm run test:coverage

# Tests d'intégration (Jest)
npm run test:integration

# Tests d'intégration avec couverture
npm run test:integration -- --coverage

# Tests d'intégration en mode watch
npm run test:integration -- --watch

# Script de test standalone
npm run test:consumed-constraints
```

### Analyse et Vérification

```bash
# Analyser les règles en base de données
npm run analyze:rules

# Vérification TypeScript
npm run type-check

# Linting
npm run lint
```

---

## ✅ Résultats Attendus

### Tests d'Intégration Jest

```
PASS src/__tests__/integration/rules-calculation.test.ts

Rules Calculation Integration Tests
  Scénario 1-11: Tests originaux
    ✓ 11/11 tests passent

  🔥 CRASH TEST - Valeurs extrêmes
    ✓ devrait gérer un volume extrêmement élevé
    ✓ devrait gérer TOUTES les contraintes simultanément
    ✓ devrait gérer prix de base très élevé

  🎯 EDGE CASES - Cas limites
    ✓ devrait gérer étage exactement au seuil
    ✓ devrait gérer étage juste au-dessus du seuil
    ✓ devrait gérer rez-de-chaussée
    ✓ devrait gérer distance minimale
    ✓ devrait gérer volume minimal

  ⚡ PERFORMANCE - Tests de charge
    ✓ devrait exécuter 100 calculs en moins de 10 secondes

  ✅ CONSISTENCY - Cohérence du système
    ✓ le prix final ne doit JAMAIS être négatif
    ✓ deux calculs identiques => résultats identiques
    ✓ monte-meuble requis => contraintes consommées NON facturées

Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Time:        ~17s
```

### Script Standalone

```
============================================================================
🧪 DÉBUT DES TESTS: CONTRAINTES CONSOMMÉES PAR LE MONTE-MEUBLES
============================================================================

📋 Chargement des règles depuis la base de données...
✅ 32 règles chargées

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ TEST 1: Sans monte-meubles
📝 Étage 2 sans ascenseur - Pas de monte-meubles requis

🔍 Vérification AutoDetectionService...
   Monte-meubles détecté: ❌ NON
   Contraintes consommées: []

💰 Exécution du RuleEngine...

📊 Résultats:
   Prix de base: 100€
   Prix final: 165€
   Nombre de règles appliquées: 2

✅ TEST RÉUSSI

[... 11 autres tests ...]

============================================================================
📊 RÉSUMÉ DES TESTS
============================================================================
✅ Tests réussis: 12/12
❌ Tests échoués: 0/12

🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS!
✅ Les contraintes consommées ne sont pas facturées (pas de double facturation)
```

---

## 🐛 Debugging

### Activer les logs détaillés

Les logs sont déjà activés dans le RuleEngine. Pour les désactiver temporairement :

```typescript
// Dans RuleEngine.ts, commenter les console.log
// Ou définir une variable d'environnement
process.env.DISABLE_RULE_LOGS = "true";
```

### Examiner un test spécifique

```bash
# Jest avec pattern
npm run test:integration -- -t "Volume extrême"

# Script standalone - modifier le tableau scenarios
# Pour exécuter seulement certains tests
```

### Vérifier la base de données

```bash
# Analyser les règles
npm run analyze:rules

# Ouvrir Prisma Studio
npm run prisma:studio
```

---

## 📈 Métriques de Performance

### Résultats Actuels

- **Jest (23 tests)** : ~17 secondes
- **Script standalone (12 tests)** : ~5 secondes
- **Moyenne par test Jest** : ~740ms
- **Moyenne par test standalone** : ~417ms

### Tests de Performance Spécifiques

- **100 calculs séquentiels** : ~10 secondes (100ms/calcul avec logs)
- **Sans logs** : ~5 secondes (50ms/calcul estimé)

---

## 🎯 Cas de Test Couverts

### ✅ Scénarios Fonctionnels

- ✓ Sans monte-meuble (étages bas)
- ✓ Avec monte-meuble (étages élevés)
- ✓ Ascenseur inadapté
- ✓ Contraintes mixtes (consommées + non-consommées)
- ✓ Règles temporelles (week-end, heures)
- ✓ Réductions et prix minimum

### 🔥 Valeurs Extrêmes

- ✓ Volume massif (500m³)
- ✓ Étages très élevés (45ème étage)
- ✓ Distance longue (500km)
- ✓ Prix de base élevé (50000€)
- ✓ Accumulation de contraintes (20+ contraintes)

### 🎯 Cas Limites

- ✓ Seuils de détection (étage 3 vs 4)
- ✓ Valeurs minimales (0km, 1m³, étage 0)
- ✓ Configurations extrêmes
- ✓ Absence de contraintes

### ⚡ Performance

- ✓ Tests de charge (100 calculs)
- ✓ Stabilité temporelle
- ✓ Déterminisme

### ✅ Cohérence

- ✓ Pas de prix négatif
- ✓ Résultats déterministes
- ✓ Contraintes consommées exclues
- ✓ Règles appliquées correctement

---

## 📚 Documentation Associée

- [TESTS_INTEGRATION_REGLES.md](./TESTS_INTEGRATION_REGLES.md) - Documentation détaillée des tests d'intégration
- [FIX_MONTE_MEUBLE_INTEGRATION_TESTS.md](./FIX_MONTE_MEUBLE_INTEGRATION_TESTS.md) - Fix du système de contraintes consommées
- [ANALYSE_TESTS_EXISTANTS.md](./ANALYSE_TESTS_EXISTANTS.md) - Analyse des tests existants avant réorganisation

---

**Dernière mise à jour** : 2025-01-13
**Tests totaux** : 35 (23 Jest + 12 standalone)
**Taux de réussite** : 100% ✅
