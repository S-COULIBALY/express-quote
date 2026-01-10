# Système de Devis Modulaire - Guide de Démarrage Rapide

## 🎯 Vue d'ensemble

Système modulaire complet pour la génération de devis de déménagement avec :
- ✅ **Architecture en 2 étapes** : BaseCostEngine → MultiQuoteService (mode incrémental)
- ✅ **Mode incrémental** : Pas de recalcul des modules de base
- ✅ **Multi-offres natif** : 6 devis parallèles avec stratégies différenciées
- ✅ **Traçabilité complète** : Chaque décision est traçable
- ✅ **Prix transparent** : Coûts détaillés ligne par ligne

## 📦 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1: /api/quotation/calculate                              │
│  ─────────────────────────────────────────────                  │
│  BaseCostEngine → baseCost + context.computed                   │
│  (calcule les coûts opérationnels une seule fois)               │
│                              │                                  │
│                              ▼                                  │
│  ÉTAPE 2: /api/quotation/multi-offers                           │
│  ─────────────────────────────────────────────                  │
│  MultiQuoteService (mode incrémental)                           │
│  • Réutilise context.computed (pas de recalcul)                 │
│  • Exécute UNIQUEMENT les modules additionnels                  │
│  → Retourne 6 variantes avec marges différentes                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Utilisation Rapide

### 1. Via les APIs (Frontend)

```typescript
import { useModularQuotation } from '@/hooks/shared/useModularQuotation';

// Utiliser le hook
const { calculateFullQuote, multiOffers, isPriceLoading } = useModularQuotation();

// Appeler le flux complet (calculate → multi-offers)
const result = await calculateFullQuote(formData);

// Les 6 offres sont disponibles dans multiOffers
multiOffers?.quotes.forEach(quote => {
  console.log(`${quote.label}: ${quote.pricing.finalPrice}€`);
});
```

### 2. Via les services (Backend)

```typescript
import { BaseCostEngine, MultiQuoteService, STANDARD_SCENARIOS, getAllModules } from '@/quotation-module';

// Étape 1 : Calculer le coût de base
const baseCostEngine = new BaseCostEngine(getAllModules());
const baseCostResult = baseCostEngine.execute(context);

// Étape 2 : Générer les 6 variantes (mode incrémental)
const multiService = new MultiQuoteService(getAllModules());
const variants = multiService.generateMultipleQuotesFromBaseCost(
  baseCostResult.context,  // Contexte avec computed rempli
  STANDARD_SCENARIOS,
  baseCostResult.baseCost  // Coût opérationnel de base
);

// Analyser les résultats
variants.forEach(variant => {
  console.log(`${variant.label}: ${variant.finalPrice}€`);
});

// Obtenir la recommandation intelligente
const { recommended, recommendation } = multiService.getSmartRecommendedVariant(variants, context);
```

## 📋 Modules MVP Phase 1 Disponibles

| Module | Priorité | Phase | Description |
|--------|----------|-------|-------------|
| InputSanitizationModule | 10 | 1 | Sanitise les données d'entrée |
| DateValidationModule | 11 | 1 | Valide les dates |
| VolumeEstimationModule | 20 | 2 | Estime le volume |
| DistanceModule | 30 | 3 | Calcule la distance |
| FuelCostModule | 33 | 3 | Calcule le coût du carburant |
| VehicleSelectionModule | 60 | 6 | Sélectionne le véhicule |
| WorkersCalculationModule | 61 | 6 | Calcule le nombre de déménageurs |
| LaborBaseModule | 62 | 6 | Calcule le coût de la main-d'œuvre |
| InsurancePremiumModule | 71 | 7 | Calcule la prime d'assurance |

## 🎨 Les 6 Scénarios Multi-Offres

| Scénario | Marge | Description |
|----------|-------|-------------|
| **ECO** | 20% | L'essentiel à petit prix |
| **STANDARD** | 30% | Meilleur rapport qualité-prix ⭐ |
| **CONFORT** | 35% | Plus de services inclus |
| **SÉCURITÉ+** | 32% | Protection maximale avec assurance incluse |
| **PREMIUM** | 40% | Service clé en main |
| **FLEX** | 38% | Adaptabilité maximale |

## 🏗️ Architecture

\`\`\`
src/quotation-module/
├── core/                      # Types et moteur fondamentaux
│   ├── QuoteContext.ts       # Contexte d'entrée
│   ├── ComputedContext.ts    # Contexte calculé
│   ├── QuoteModule.ts        # Interface des modules
│   ├── QuoteEngine.ts        # Moteur d'exécution (mode complet/incrémental)
│   ├── BaseCostEngine.ts     # Calcul coût de base (étape 1)
│   └── ModuleRegistry.ts     # Registre des modules
│
├── modules/                   # Modules métiers
│   ├── base/                 # Modules de base (volume)
│   ├── costs/                # Modules de coûts
│   ├── normalization/        # Modules de normalisation
│   └── risk/                 # Modules de risque
│
├── multi-offers/             # Système multi-devis
│   ├── QuoteScenario.ts      # Définition des 6 scénarios
│   └── MultiQuoteService.ts  # Service de génération (mode incrémental)
│
├── interfaces/http/          # Contrôleurs HTTP
│   └── controllers/
│       └── QuoteController.ts
│
└── docs/                      # Documentation technique
\`\`\`

## 🔧 Créer de Nouveaux Modules

\`\`\`typescript
import { QuoteContext, QuoteModule } from '../types/quote-types';

export class MyCustomModule implements QuoteModule {
  readonly id = 'my-custom-module';
  readonly description = 'Description du module';
  readonly priority = 42; // Phase 4 (40-49)

  // Optionnel : pour modules conditionnels (Type B/C)
  isApplicable(ctx: QuoteContext): boolean {
    return ctx.pickupFloor > 0 && !ctx.pickupHasElevator;
  }

  apply(ctx: QuoteContext): QuoteContext {
    if (!ctx.computed) return ctx;

    // Ajouter un coût
    ctx.computed.costs.push({
      moduleId: this.id,
      label: 'Mon coût personnalisé',
      amount: 100,
      category: 'LABOR',
    });

    // Ajouter à la traçabilité
    ctx.computed.activatedModules.push(this.id);

    return ctx;
  }
}
\`\`\`

## 📊 Résultats Générés

Le contexte enrichi contient :

- **Volume** : baseVolume, adjustedVolume, vehicleCount
- **Distance** : distanceKm, travelTimeMinutes, isLongDistance
- **Main-d'œuvre** : workersCount, baseDurationHours, totalDurationHours
- **Coûts** : Liste détaillée des coûts par catégorie
- **Prix** : basePrice (coûts + marge), adjustments, finalPrice
- **Risque** : riskScore (0-100), riskContributions, manualReviewRequired
- **Juridique** : legalImpacts, insuranceNotes
- **Traçabilité** : activatedModules (IDs des modules exécutés)

## 🧪 Tests

\`\`\`bash
# Exécuter l'exemple de démonstration
npm run quote-module:example

# Lancer les tests unitaires des modules
npm test -- src/quotation-module
\`\`\`

## 📚 Documentation Complète

Pour la documentation complète de l'architecture, consultez :
- \`src/quotation-module/docs/README.md\` - Vue d'ensemble
- \`src/quotation-module/docs/01-overview.md\` - Concepts fondamentaux
- \`src/quotation-module/docs/05-execution-engine.md\` - Moteur d'exécution
- \`src/quotation-module/docs/06-multi-offers.md\` - Système multi-offres

## 🎯 Prochaines Étapes

1. ✅ **MVP Phase 1 Complet** : 10 modules essentiels fonctionnels
2. ⏳ **MVP Phase 2** : Modules de contraintes (accès, monte-meubles)
3. ⏳ **MVP Phase 3** : Modules cross-selling et temporels
4. ⏳ **Intégration** : Adaptateurs pour l'ancien système
5. ⏳ **Production** : Feature flag et déploiement progressif

---

**Le système modulaire est prêt à être utilisé et étendu !** 🚀
