# 🔄 Migration progressive

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## 🔄 Migration progressive

### Stratégie de migration

**Principe** : Système parallèle, migration progressive, pas de breaking changes

### Phase 1 : Infrastructure (Semaine 1-2)

1. ✅ Créer la structure `src/quotation-module/`
2. ✅ Implémenter les types fondamentaux (`QuoteContext`, `ComputedContext`, `QuoteModule`)
3. ✅ Créer le `QuoteEngine` de base
4. ✅ Créer les adaptateurs pour le système existant

**Livrables** :
- Structure de dossiers créée
- Types fondamentaux implémentés
- Moteur de base fonctionnel
- Adaptateurs créés (non utilisés encore)

---

### Phase 2 : Modules de base (Semaine 3-4)

1. ✅ Implémenter `VolumeEstimationModule`
2. ✅ Implémenter `VehicleSelectionModule`
3. ✅ Implémenter `WorkersCalculationModule`
4. ✅ Tests unitaires pour chaque module

**Livrables** :
- Modules de base implémentés
- Tests unitaires passants
- Documentation de chaque module

---

### Phase 3 : Modules de contraintes (Semaine 5-6)

1. ✅ Implémenter les modules d'ascenseur (pickup/delivery)
2. ✅ Implémenter `MonteMeublesRecommendationModule`
3. ✅ Implémenter `MonteMeublesRefusalImpactModule`
4. ✅ Tests d'intégration

**Livrables** :
- Modules de contraintes implémentés
- Tests d'intégration passants
- Gestion complète des contraintes

---

### Phase 4 : Modules temporels et cross-selling (Semaine 7-8)

1. ✅ Implémenter les modules temporels (week-end, fin de mois)
2. ✅ Implémenter les modules cross-selling
3. ✅ Tests end-to-end

**Livrables** :
- Modules temporels implémentés
- Modules cross-selling implémentés
- Tests end-to-end passants

---

### Phase 5 : Intégration (Semaine 9-10)

1. ✅ Créer l'adaptateur pour `PriceService`
2. ✅ Créer l'adaptateur pour le frontend
3. ✅ Tests de régression
4. ✅ Déploiement en staging

**Livrables** :
- Adaptateurs fonctionnels
- Tests de régression passants
- Système déployé en staging

---

### Phase 6 : Production (Semaine 11-12)

1. ✅ Déploiement progressif (feature flag)
2. ✅ Monitoring et ajustements
3. ✅ Documentation utilisateur
4. ✅ Migration complète

**Livrables** :
- Système en production
- Monitoring en place
- Documentation complète
- Migration terminée

---

### Feature Flag

**Stratégie** : Utiliser un feature flag pour activer/désactiver le nouveau système progressivement.

```typescript
// Configuration
const USE_MODULAR_QUOTE_ENGINE = process.env.USE_MODULAR_QUOTE_ENGINE === 'true';

// Dans PriceService
export class PriceService {
  calculatePrice(request: PriceCalculationRequest): Quote {
    if (USE_MODULAR_QUOTE_ENGINE) {
      // Nouveau système modulaire
      return calculateQuoteFromPriceRequest(request);
    } else {
      // Ancien système
      return this.legacyCalculatePrice(request);
    }
  }
}
```

**Activation progressive** :
1. **Semaine 1** : Feature flag activé pour 10% des requêtes
2. **Semaine 2** : Feature flag activé pour 25% des requêtes
3. **Semaine 3** : Feature flag activé pour 50% des requêtes
4. **Semaine 4** : Feature flag activé pour 100% des requêtes
5. **Semaine 5** : Ancien système désactivé

---

### Monitoring

**Métriques à surveiller** :
- Temps de réponse du nouveau système vs ancien
- Taux d'erreur
- Différence de prix entre les deux systèmes
- Activation des modules (quels modules s'activent le plus)
- Score de risque moyen

**Alertes** :
- Temps de réponse > seuil
- Taux d'erreur > seuil
- Différence de prix > seuil (pour détecter les bugs)

---

### Rollback

**Plan de rollback** :
1. Désactiver le feature flag
2. Vérifier que l'ancien système fonctionne toujours
3. Analyser les logs pour identifier les problèmes
4. Corriger les bugs
5. Réactiver progressivement

---

### Tests de régression

**Tests à effectuer** :
- Comparer les prix entre ancien et nouveau système
- Vérifier que tous les cas de figure sont couverts
- Vérifier que les contraintes sont bien gérées
- Vérifier que les conséquences juridiques sont tracées

---

### Documentation

**Documentation à créer** :
- Guide de migration pour les développeurs
- Guide d'utilisation pour les utilisateurs
- Documentation API
- Changelog

---

### Points d'attention

⚠️ **Ne pas oublier** :
- Garder l'ancien système fonctionnel pendant la migration
- Tester chaque phase avant de passer à la suivante
- Monitorer les performances et les erreurs
- Documenter les changements
- Former l'équipe sur le nouveau système

