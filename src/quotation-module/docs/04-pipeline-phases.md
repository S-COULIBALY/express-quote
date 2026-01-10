# 🔄 Phases du pipeline

**Version** : 1.8  
**Date** : 2025-01-XX  
**Statut** : 🟢 Prêt pour implémentation

---

## ⚠️ IMPORTANT : Distinction fondamentale

Il existe **DEUX types de phases** :

1. **Phases du pipeline de calcul** (1-9) : Ordre strict d'exécution des modules dans le calcul du devis
2. **Phases temporelles** (QUOTE/CONTRACT/OPERATIONS) : Moment dans le cycle de vie où le module s'exécute

---

## Les 9 phases du pipeline (ORDRE STRICT)

Le moteur exécute les modules dans l'ordre strict suivant :

### PHASE 1 — Normalisation & Préparation

**Objectif** : Fiabiliser les données entrantes et garantir un contexte valide  
**Plage de priorités** : 10-19

Modules :
- `InputSanitizationModule` : Nettoie et valide les données d'entrée
- `DateValidationModule` : Valide et normalise les dates
- `AddressNormalizationModule` : Normalise les adresses (formatage, géocodage)
- `UrbanZoneDetectionModule` : Détecte la zone urbaine (Paris / Petite Couronne / Grande Couronne)

⚠️ **RÈGLE CRITIQUE** : Cette phase est **OBLIGATOIRE** et doit garantir :
- ✅ Tous les champs requis sont présents et valides
- ✅ Les adresses sont normalisées et géocodées
- ✅ Les dates sont valides et dans le futur
- ✅ Le contexte est prêt pour les phases suivantes

**Garde-fous** : Si un module de PHASE 1 échoue, le calcul doit s'arrêter avec une erreur explicite.

---

### PHASE 2 — Volume & Charge

**Objectif** : Déterminer la charge réelle à déplacer  
**Plage de priorités** : 20-29

Modules :
- `VolumeEstimationModule` : Calcule le volume de base (FORM / MANUAL)
- `VolumeConfidenceAdjustmentModule` : Ajuste selon la confiance du volume
- `BulkyFurnitureAdjustmentModule` : Ajuste pour mobilier encombrant
- `SafetyMarginVolumeModule` : Ajoute une marge de sécurité
- `VolumeUncertaintyRiskModule` : Contribue au risque d'incertitude volume

---

### PHASE 3 — Distance & Transport

**Objectif** : Calculer l'effort de transport  
**Plage de priorités** : 30-39

Modules :
- `DistanceModule` : Calcule la distance réelle (km)
- `LongDistanceThresholdModule` : Détecte si distance > seuil IDF (déclenche modules longue distance)
- `RouteComplexityModule` : Évalue la complexité du trajet (trafic, rues étroites)
- `FuelCostModule` : Coût carburant de base
- `HighMileageFuelAdjustmentModule` : Ajustement carburant pour longue distance (si distance > seuil)
- `TollCostModule` : Coût péages (obligatoire pour IDF → Province)
- `TransportTimeEstimationModule` : Temps de transport estimé
- `DriverRestTimeModule` : Temps de repos obligatoire si distance > X km (réglementation)
- `OvernightStopModule` : Arrêt nuit si distance + planning le nécessite

⚠️ **RÈGLE CRITIQUE** : Les modules longue distance s'activent automatiquement dès que `ctx.distanceKm > DISTANCE_IDF_THRESHOLD` (ex: 200 km). Ils ne sont PAS optionnels et doivent être implémentés pour couvrir les déménagements IDF → Province.

**Garde-fous** :
- `FuelCostModule` nécessite `ctx.computed.distanceKm` (vérifié par prérequis)
- `HighMileageFuelAdjustmentModule` nécessite `ctx.computed.distanceKm` ET distance > seuil
- `TollCostModule` nécessite détection automatique IDF → Province
- `DriverRestTimeModule` nécessite `ctx.computed.distanceKm` ET distance > seuil réglementaire

---

### PHASE 4 — Accès & Contraintes Bâtiment

**Objectif** : Mesurer la pénibilité humaine et matérielle  
**Plage de priorités** : 40-49

Modules :
- `NoElevatorPickupModule` : Gère l'absence d'ascenseur au départ
- `NoElevatorDeliveryModule` : Gère l'absence d'ascenseur à l'arrivée
- `CarryDistancePenaltyModule` : Pénalité pour distance de portage
- `StairComplexityModule` : Complexité des escaliers
- `ParkingAuthorizationModule` : Autorisation de stationnement requise
- `NavetteRequiredModule` : Navette requise (logistique IDF)
- `TrafficIdfModule` : Impact du trafic IDF
- `TimeSlotSyndicModule` : Créneau syndic requis
- `LoadingTimeEstimationModule` : Estimation temps de chargement

---

### PHASE 5 — Monte-meubles (CRITIQUE)

**Objectif** : Sécurité, responsabilité, assurance  
**Plage de priorités** : 50-59

Modules :
- `MonteMeublesRecommendationModule` : Recommande le monte-meubles si nécessaire
- `MonteMeublesCostModule` : Calcule le coût si accepté
- `MonteMeublesRefusalImpactModule` : Gère les conséquences du refus
- `LiabilityLimitationModule` : Limite la responsabilité en cas de refus
- `ManualReviewFlagModule` : Active le flag de revue manuelle si nécessaire
- `ManualHandlingRiskCostModule` : Surcoût risque manutention si refus

⚠️ **RÈGLE ABSOLUE** : Si le monte-meubles est recommandé mais refusé :

**Conséquences OBLIGATOIRES** :
1. ✅ **Responsabilité limitée** : La responsabilité de l'entreprise est limitée en cas de dommages liés à la manutention manuelle
2. ✅ **Assurance plafonnée** : L'assurance est plafonnée à un montant réduit
3. ✅ **Flag juridique activé** : Un flag juridique est activé dans le contexte
4. ✅ **Avertissement client** : Un avertissement explicite est généré pour le client
5. ✅ **Revue manuelle possible** : Une revue manuelle peut être déclenchée selon le niveau de risque
6. ✅ **Historique conservé** : Le refus et ses conséquences sont tracés dans le contexte

**Exemple concret** :
```
Si :
- Étage élevé (≥ 3e étage)
- Pas d'ascenseur
- Volume important (> 20m³)
- Mobilier encombrant

Alors :
- Monte-meubles recommandé (requirement HIGH)
- Si refusé :
  - Limitation de responsabilité (legalImpact LIMITATION)
  - Assurance plafonnée (insuranceNote)
  - Surcoût manutention (cost RISK)
  - Contribution au risque (+25 points)
  - Flag opérationnel (operationalFlag)
  - Revue manuelle si risque > seuil
```

---

### PHASE 6 — Main d'œuvre

**Objectif** : Calcul précis du coût humain  
**Plage de priorités** : 60-69

Modules :
- `VehicleSelectionModule` : Sélection du véhicule (dépend du volume)
- `WorkersCalculationModule` : Calcul du nombre de déménageurs
- `LaborBaseModule` : Coût de base de la main-d'œuvre
- `LaborIntensityModule` : Ajuste selon l'intensité du travail
- `LaborOvertimeModule` : Gère les heures supplémentaires
- `TeamSizingModule` : Détermine la taille de l'équipe
- `LaborAccessPenaltyModule` : Surcoût pour accès difficile
- `CrewSizeAdjustmentModule` : Ajustement taille équipe (opérationnel)

---

### PHASE 7 — Assurance & Risque

**Objectif** : Couvrir le risque financier  
**Plage de priorités** : 70-79

Modules :
- `DeclaredValueValidationModule` : Valide la valeur déclarée
- `InsurancePremiumModule` : Calcule la prime d'assurance
- `DeclaredValueInsufficientModule` : Gère valeur déclarée insuffisante
- `HighValueItemHandlingModule` : Gestion objets de valeur
- `HighRiskManualReviewModule` : Déclenche revue manuelle si risque élevé
- `CoOwnershipRulesModule` : Règles copropriété (juridique)
- `NeighborhoodDamageRiskModule` : Risque dommages voisinage (juridique)
- `PublicDomainOccupationModule` : Occupation domaine public (juridique)
- `DeliveryTimeWindowConstraintModule` : Contrainte créneau horaire (opérationnel)

⚠️ **Note** : Le `riskScore` est agrégé par le moteur depuis les `riskContributions`, pas calculé par un module.

---

### PHASE 8 — Options & Cross-Selling

**Objectif** : Augmenter le panier moyen sans compromettre la validité opérationnelle et juridique du devis principal  
**Plage de priorités** : 80-89

**Modules Requirements (déclarent des besoins métier)** :
- `PackingRequirementModule` : Recommande l'emballage si nécessaire (déclare requirement)
- `CleaningEndRequirementModule` : Recommande nettoyage fin de déménagement (déclare requirement)
- `StorageRequirementModule` : Recommande stockage temporaire (déclare requirement)

**Modules Cross-Selling (transforment requirements en propositions commerciales)** :
- `PackingCostModule` : Calcule le coût si accepté (basé sur requirement PACKING_RECOMMENDED)
- `CleaningEndCostModule` : Calcule le coût si accepté (basé sur requirement CLEANING_RECOMMENDED)
- `StorageCostModule` : Calcule le coût si accepté (basé sur requirement STORAGE_RECOMMENDED)

**Modules Options (prestations additionnelles facturées)** :
- `FurnitureDismantlingModule` : Démontage de mobilier (option facturée)

**Modules temporels** :
- `EndOfMonthModule` : Surcoût fin de mois (si jour >= 25)
- `WeekendModule` : Surcoût week-end (si samedi ou dimanche)

⚠️ **SÉPARATION STRICTE** :
- Les modules **Requirements** déclarent des besoins métier (pas de prix)
- Les modules **Cross-Selling** transforment les requirements en propositions commerciales
- Les modules **Options** ajoutent des lignes tarifaires mais n'impactent pas le prix de base
- **Namespace strict** : Tous les modules cross-selling doivent avoir un ID commençant par `CROSS_SELL_` ou `OPTION_`

⚠️ **DISTINCTION FONDAMENTALE** :

**Prix de base du déménagement (core)** :
- Couvre le cœur incompressible : transport, main-d'œuvre, accès, volume, risques structurels, assurance minimale
- Ce prix doit être défendable seul juridiquement et opérationnellement
- Il reste valide même si toutes les options sont refusées
- Le déménagement peut s'exécuter sans ces options

**Options / services additionnels** :
- Ce sont des prestations supplémentaires **facturées**
- Mais non nécessaires à l'exécution du déménagement
- Elles n'altèrent pas la viabilité du déménagement si elles sont refusées

**Règles d'implémentation** :
- ✅ Ces modules **AJOUTENT** des lignes tarifaires
- ✅ Ils n'impactent **PAS** les contraintes critiques (transport, sécurité, responsabilité)
- ✅ Ils sont **désactivables** sans invalider le devis
- ✅ Le déménagement reste valide opérationnellement et juridiquement sans ces options

**Exemple concret** :
```
Devis déménagement (core) :
- Transport & main-d'œuvre : 1 450 €
- Accès difficile : 180 €
- Assurance : 95 €
Total déménagement : 1 725 €

Options (PHASE 8) :
- Packing cuisine : 180 €
- Démontage meubles : 120 €
- Nettoyage fin : 150 €

➡️ Refuser toutes les options → le déménagement reste valide à 1 725 €
```

---

### PHASE 9 — Agrégation & Finalisation

**Objectif** : Produire un devis clair et traçable  
**Plage de priorités** : 90-99

Modules :
- `PriceAggregationModule` : Agrège tous les coûts (fait par le moteur)
- `VATCalculationModule` : Calcule la TVA (fait par le moteur)
- `QuoteSummaryModule` : Génère le résumé du devis (fait par le moteur)
- `ComplianceCheckModule` : Vérifie la conformité légale (fait par le moteur)

⚠️ **Note** : Ces modules sont généralement exécutés par le moteur, pas comme modules séparés dans certains cas.

---

## Ordre d'exécution dans le moteur

```typescript
// Le moteur exécute les modules dans l'ordre strict des phases
// Les priorités doivent respecter les plages définies par phase

// PHASE 1 : 10-19
// PHASE 2 : 20-29
// PHASE 3 : 30-39
// PHASE 4 : 40-49
// PHASE 5 : 50-59
// PHASE 6 : 60-69
// PHASE 7 : 70-79
// PHASE 8 : 80-89
// PHASE 9 : 90-99
```

⚠️ **RÈGLE CRITIQUE** : 
- **La priorité détermine la phase, pas le type (A/B/C)**
- Un module Type C peut s'exécuter très tôt (ex: VolumeUncertaintyRiskModule en PHASE 2)
- Un module Type A peut s'exécuter tard (ex: InsurancePremiumModule en PHASE 7)
- **Chaque module apparaît UNE SEULE FOIS** dans `getAllModules()`
- Le moteur gère l'ordre via `priority`, pas via duplication

---

## 🎯 Phases temporelles (QUOTE/CONTRACT/OPERATIONS)

### Concept

Certains modules doivent s'exécuter à différentes phases du cycle de vie :

- **QUOTE** : Phase de devis (temps réel, avant validation)
- **CONTRACT** : Phase de validation/contrat (après acceptation du devis)
- **OPERATIONS** : Phase opérationnelle (le jour J, post-vente)

### Exemples

```typescript
// Module qui s'exécute uniquement au devis
export class VolumeEstimationModule implements QuoteModule {
  id = "VOLUME_ESTIMATION";
  executionPhase = "QUOTE"; // ✅ S'exécute uniquement au devis
  // ...
}

// Module qui s'exécute à la validation du contrat
export class ContractValidationModule implements QuoteModule {
  id = "CONTRACT_VALIDATION";
  executionPhase = "CONTRACT"; // ✅ S'exécute uniquement à la validation
  // ...
}

// Module qui s'exécute le jour J
export class OnSiteVerificationModule implements QuoteModule {
  id = "ONSITE_VERIFICATION";
  executionPhase = "OPERATIONS"; // ✅ S'exécute uniquement le jour J
  // ...
}

// Module qui s'exécute à toutes les phases (défaut)
export class BasePriceModule implements QuoteModule {
  id = "BASE_PRICE";
  // executionPhase non défini = s'exécute à toutes les phases
  // ...
}
```

### Utilisation dans le moteur

```typescript
// Le moteur filtre les modules selon la phase
const applicableModules = this.modules.filter(m => 
  !m.executionPhase || m.executionPhase === phase
);
```

---

## 📚 Références

- [Typologie des modules](./03-module-typology.md) : Types A/B/C et `isApplicable()`
- [Système d'exécution](./05-execution-engine.md) : Code canonique du `QuoteEngine`
- [Règles et interdictions](./08-rules-and-prohibitions.md) : Erreurs à éviter

