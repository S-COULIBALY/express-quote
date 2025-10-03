# 🧪 Tests de Validation - Migration UnifiedDataService

Ce dossier contient les scripts de test pour valider la migration complète du pipeline de calcul de devis vers UnifiedDataService.

## 📋 Scripts Disponibles

### 🎮 Script Principal - Lanceur de Tests
```bash
node run-quote-tests.js
```

**Interface interactive** qui permet de choisir le type de test à exécuter.

**Mode automatique :**
```bash
node run-quote-tests.js 1  # Test Direct
node run-quote-tests.js 2  # Test Simulation
node run-quote-tests.js 3  # Test API Réel
node run-quote-tests.js 4  # Tous les Tests
```

---

### 🎯 Test Direct des Services
```bash
node test-quote-services-direct.js
```

**✅ Recommandé pour un test rapide**

- **Durée**: ~30 secondes
- **Description**: Teste directement les services migrés sans passer par l'API
- **Valide**: FallbackCalculatorService + configurations UnifiedDataService
- **Prérequis**: Aucun (tests simulés)

---

### 🧪 Test Simulation Complète
```bash
node test-all-quote-strategies.js
```

**📊 Test complet avec données d'exemple**

- **Durée**: ~1 minute
- **Description**: Simule des calculs de devis pour toutes les stratégies
- **Valide**: Toutes les stratégies (MOVING, CLEANING, DELIVERY, PACKING)
- **Prérequis**: Aucun (simulations)
- **Génère**: Fichier JSON avec les résultats

---

### 🌐 Test API Réel
```bash
node test-real-quote-api.js
```

**🔗 Appels HTTP réels à l'API**

- **Durée**: ~2 minutes
- **Description**: Fait de vrais appels HTTP à `/api/quotesRequest`
- **Valide**: API complète + pipeline complet
- **Prérequis**: Serveur Express démarré (`npm run dev`)
- **Teste**: Connectivité API + calculs réels

---

## 🚀 Guide d'Utilisation Rapide

### Pour un test rapide après migration :
```bash
cd scripts
node run-quote-tests.js 1
```

### Pour une validation complète :
```bash
cd scripts
node run-quote-tests.js 4
```

### Pour tester l'API en cours de développement :
```bash
# Terminal 1 : Démarrer le serveur
npm run dev

# Terminal 2 : Tester l'API
cd scripts
node run-quote-tests.js 3
```

---

## 📊 Types de Tests

| Script | Objectif | Prérequis | Durée | Recommandé pour |
|--------|----------|-----------|-------|-----------------|
| Direct | Validation rapide des services | Aucun | 30s | Développement |
| Simulation | Test complet des stratégies | Aucun | 1min | Tests approfondis |
| API Réel | Validation du pipeline complet | Serveur démarré | 2min | Tests d'intégration |
| Tous | Validation exhaustive | Variable | 3min | Validation finale |

---

## 🎯 Ce que Testent les Scripts

### ✅ Services Migrés Testés
- **FallbackCalculatorService** : Tous les calculs fallback
- **QuoteCalculationService** : Valeurs par défaut par service
- **DeliveryQuoteStrategy** : Calculs volume, urgence, distance
- **CleaningQuoteStrategy** : Calculs surface, pièces, travailleurs
- **MovingQuoteStrategy** : Seuils et multiplicateurs
- **BookingService** : Prix assurance et facteur d'estimation

### ⚙️ Configurations Testées
- **PricingFactorsConfigKey** : Facteurs de prix et réductions
- **ServiceParamsConfigKey** : Valeurs par défaut par service
- **BusinessTypePricingConfigKey** : Prix spécifiques par type
- **ThresholdsConfigKey** : Seuils de calcul
- **SystemMetricsConfigKey** : Métriques système

---

## 📈 Interprétation des Résultats

### ✅ Succès Attendu
```
🎉 MIGRATION ENTIÈREMENT VALIDÉE !
✅ Toutes les stratégies fonctionnent correctement
⚙️ UnifiedDataService est opérationnel
🚀 Le système est entièrement configurable
```

### ⚠️ Problèmes Partiels
```
⚠️ Migration majoritairement réussie
🔧 Quelques ajustements nécessaires
```
→ Vérifier les logs détaillés pour identifier les problèmes

### ❌ Échec
```
❌ Migration nécessite des corrections importantes
💥 Erreurs critiques détectées
```
→ Consulter les messages d'erreur pour diagnostiquer

---

## 🔧 Dépannage

### Erreur "Module not found"
```bash
npm install  # Réinstaller les dépendances
```

### Erreur "API non accessible"
```bash
npm run dev  # Démarrer le serveur Express
```

### Erreur "Permission denied"
```bash
chmod +x scripts/*.js  # Donner les permissions d'exécution
```

### Tests qui échouent systématiquement
1. Vérifier que la migration UnifiedDataService est complète
2. Contrôler les imports dans les fichiers migrés
3. S'assurer que les nouvelles clés de configuration existent

---

## 📝 Structure des Résultats

### Format de sortie JSON (test-simulation)
```json
{
  "timestamp": "2024-01-XX...",
  "summary": {
    "total": 4,
    "successful": 4,
    "failed": 0
  },
  "testData": { ... },
  "results": [
    {
      "serviceType": "MOVING",
      "price": 650,
      "details": { ... }
    }
  ]
}
```

### Logs détaillés
```
🧮 [MOVING-STRATEGY] Calcul du prix...
💰 [MOVING-STRATEGY] Prix final: 650€
📊 [MOVING-STRATEGY] Détails: {...}
```

---

## 🎯 Objectifs de Validation

Ces scripts valident que :

1. **✅ Migration Technique** : Tous les services utilisent UnifiedDataService
2. **✅ Fonctionnalité** : Les calculs produisent des résultats cohérents
3. **✅ Performance** : Les temps de calcul restent acceptables
4. **✅ Robustesse** : Les fallbacks fonctionnent en cas d'erreur
5. **✅ Configuration** : Toutes les valeurs sont désormais configurables

---

## 🚀 Après les Tests

### Si tous les tests passent :
- ✅ Migration réussie !
- 🎯 Système entièrement configurable
- 🚀 Prêt pour la production

### Si des tests échouent :
- 🔍 Analyser les logs d'erreur
- 🔧 Corriger les problèmes identifiés
- 🔄 Relancer les tests

---

*Créé le 2024 pour valider la migration vers UnifiedDataService*