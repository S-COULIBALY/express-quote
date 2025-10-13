# 🧪 Tests d'Intégration - Système de Règles et Contraintes

**Date**: 2025-10-11
**Objectif**: Transformation du script de test en tests d'intégration Jest avec BDD

---

## 📋 Table des matières

1. [Analyse du Backend](#analyse-du-backend)
2. [Architecture Identifiée](#architecture-identifiée)
3. [Transformation Effectuée](#transformation-effectuée)
4. [Structure des Tests](#structure-des-tests)
5. [Exécution des Tests](#exécution-des-tests)
6. [Résultats Attendus](#résultats-attendus)

---

## 🏗️ Analyse du Backend

### Architecture DDD (Domain-Driven Design)

Le backend suit une architecture en couches stricte:

```
src/quotation/
├── domain/              # 🎯 Logique métier pure (pas de dépendances externes)
│   ├── entities/        # Entités du domaine
│   ├── valueObjects/    # Objets-valeurs immuables
│   ├── services/        # Services du domaine
│   └── enums/          # Énumérations
├── application/         # 🔧 Use cases et orchestration
│   ├── services/        # Services applicatifs
│   └── dtos/           # Data Transfer Objects
└── infrastructure/      # 💾 Implémentation technique
    ├── repositories/    # Accès données (Prisma)
    └── services/       # Services externes
```

### Modèle de Données Prisma

#### Table `rules` - Règles de Tarification

```prisma
model rules {
  id           String       @id
  name         String       # "Monte-meuble", "Escalier difficile", etc.
  description  String?
  value        Float        # 300 (€) ou 40 (%)
  percentBased Boolean      # true = pourcentage, false = fixe
  serviceType  ServiceType  # MOVING, CLEANING, DELIVERY
  ruleType     RuleType?    # CONSTRAINT, BUSINESS, PRICING, etc.
  category     RuleCategory # SURCHARGE, REDUCTION, etc.
  condition    Json?        # Condition d'application (JSON)
  isActive     Boolean      # Règle active ou non
  priority     Int?         # Ordre d'application
  validFrom    DateTime?    # Date début validité
  validTo      DateTime?    # Date fin validité
  tags         String[]     # Tags pour classification
  metadata     Json?        # Métadonnées additionnelles
}
```

**Exemples de conditions JSON:**

```json
// Escalier difficile
{
  "type": "building",
  "stairs": "difficult"
}

// Ascenseur inadapté
{
  "type": "building",
  "elevator": "small"
}

// Zone piétonne
{
  "type": "vehicle_access",
  "zone": "pedestrian"
}

// Week-end
{
  "type": "temporal",
  "dayOfWeek": [6, 0]  // Samedi et dimanche
}
```

#### Table `Moving` - Données Déménagement

```prisma
model Moving {
  id                    String   @id
  bookingId             String   @unique
  moveDate              DateTime
  pickupAddress         String
  deliveryAddress       String
  distance              Float
  volume                Float
  pickupFloor           Int?
  deliveryFloor         Int?
  pickupElevator        Boolean  # ⚠️ Devrait être string
  deliveryElevator      Boolean  # ⚠️ Devrait être string
  pickupCarryDistance   Float?
  deliveryCarryDistance Float?
  // Options
  packaging             Boolean
  furniture             Boolean
  fragile               Boolean
  // ... autres champs
}
```

---

## 🎯 Services Clés Identifiés

### 1. **RuleEngine** (`domain/services/RuleEngine.ts`)

**Responsabilités:**

- Charge et applique les règles de tarification
- Gère l'ordre d'application (par priorité)
- **Filtre les contraintes consommées** (évite double facturation)
- Calcule le prix final

**Méthodes clés:**

```typescript
class RuleEngine {
  constructor(private rules: Rule[])

  // Exécute toutes les règles applicables
  execute(context: QuoteContext, basePrice: Money): RuleExecutionResult

  // Vérifie si une règle doit être ignorée (consommée)
  private isRuleConstraintConsumed(rule: Rule, consumedConstraints: Set<string>): boolean

  // Extrait le nom de contrainte d'une condition JSON
  private extractConstraintNameFromCondition(condition: any): string | null
}
```

**Flux d'exécution:**

```
1. Trier les règles par priorité
2. Analyser les contraintes consommées (AutoDetectionService)
3. Pour chaque règle:
   a. Vérifier si consommée → ignorer
   b. Vérifier si applicable (condition)
   c. Appliquer la règle (% ou fixe)
4. Retourner prix final + règles appliquées
```

### 2. **AutoDetectionService** (`domain/services/AutoDetectionService.ts`)

**Responsabilités:**

- Détecte automatiquement si monte-meubles requis
- Détecte distance de portage longue
- **Retourne les contraintes consommées**
- Calcule les surcharges associées

**Méthodes clés:**

```typescript
class AutoDetectionService {
  static FURNITURE_LIFT_FLOOR_THRESHOLD = 3; // Seuil étage
  static FURNITURE_LIFT_SURCHARGE = 200; // Prix monte-meuble
  static LONG_CARRYING_DISTANCE_THRESHOLD = "30+";
  static LONG_CARRYING_DISTANCE_SURCHARGE = 50;

  // Détecte monte-meuble pour une adresse
  static detectFurnitureLift(
    addressData: AddressData,
    volume?: number,
  ): AddressDetectionResult;

  // Détecte distance de portage longue
  static detectLongCarryingDistance(
    addressData: AddressData,
  ): AddressDetectionResult;

  // Détecte toutes les contraintes automatiques
  static detectAutomaticConstraints(
    pickupData: AddressData,
    deliveryData: AddressData,
    volume?: number,
  ): AutoDetectionResult;
}
```

**Logique de détection monte-meubles:**

```typescript
// CAS 1: Ascenseur medium/large OK → PAS de monte-meubles
if (elevator === 'medium' || elevator === 'large') {
  if (!elevatorUnavailable && !elevatorUnsuitable && !elevatorForbiddenMoving) {
    return { furnitureLiftRequired: false };
  }
}

// CAS 2: Pas d'ascenseur
if (elevator === 'no') {
  if (floor > 3) {
    // ✅ Monte-meubles requis
    // ✅ Consommer: difficult_stairs, narrow_corridors, bulky_furniture, etc.
    return {
      furnitureLiftRequired: true,
      consumedConstraints: [...]
    };
  }
}

// CAS 3: Ascenseur small ou problèmes
if (elevator === 'small' || elevatorUnavailable || ...) {
  if (floor > 3) {
    // ✅ Monte-meubles requis
    // ✅ Consommer: elevator_unsuitable_size, difficult_stairs, etc.
    return {
      furnitureLiftRequired: true,
      consumedConstraints: [...]
    };
  }
}
```

**Contraintes consommées par le monte-meubles:**

- ✅ `difficult_stairs` - Escaliers difficiles
- ✅ `narrow_corridors` - Couloirs étroits
- ✅ `bulky_furniture` - Meubles encombrants
- ✅ `heavy_items` - Objets lourds
- ✅ `elevator_unsuitable_size` - Ascenseur inadapté
- ✅ `elevator_unavailable` - Ascenseur en panne
- ✅ `elevator_forbidden_moving` - Ascenseur interdit déménagement
- ✅ `indirect_exit` - Sortie indirecte
- ✅ `complex_multilevel_access` - Accès multi-niveaux complexe

**Contraintes NON consommées (toujours facturées):**

- ❌ `pedestrian_zone` - Zone piétonne (problème véhicule)
- ❌ `difficult_parking` - Stationnement difficile (problème véhicule)
- ❌ `complex_traffic` - Circulation complexe (problème véhicule)
- ❌ `access_control` - Contrôle d'accès (administratif)
- ❌ `time_restrictions` - Restrictions horaires (administratif)

### 3. **QuoteContext** (`domain/valueObjects/QuoteContext.ts`)

**Responsabilités:**

- Value Object immuable pour les données de devis
- Validation des champs requis
- Conversion et normalisation des types

**Champs clés:**

```typescript
export type QuoteContextData = {
  serviceType?: ServiceType;
  pickupAddress?: Address;
  deliveryAddress?: Address;
  moveDate?: Date;
  volume?: number;
  distance?: number;
  pickupElevator?: "no" | "small" | "medium" | "large"; // ✅ Corrigé (était boolean)
  deliveryElevator?: "no" | "small" | "medium" | "large"; // ✅ Corrigé (était boolean)
  pickupFloor?: number;
  deliveryFloor?: number;
  pickupLogisticsConstraints?: string[];
  deliveryLogisticsConstraints?: string[];
  // ... autres champs
};
```

### 4. **QuoteCalculationService** (`application/services/QuoteCalculationService.ts`)

**Responsabilités:**

- Orchestre le calcul complet des devis
- Crée le QuoteContext depuis les données brutes
- Appelle RuleEngine
- Normalise et valide les données

**Flux:**

```typescript
async calculateQuotePrice(serviceType: ServiceType, data: Record<string, any>): Promise<Quote> {
  // 1. Créer le contexte
  const context = await this.createQuoteContext(serviceType, data);

  // 2. Calculer le devis (appelle RuleEngine)
  const quote = await this.quoteCalculator.calculateQuote(serviceType, context);

  return quote;
}
```

---

## 🔄 Transformation Effectuée

### De: Script de Test Standalone (`scripts/test-consumed-constraints.ts`)

**Caractéristiques:**

- ✅ Script exécutable avec `ts-node`
- ✅ Tests manuels avec logs détaillés
- ✅ Connexion directe à Prisma
- ❌ Pas de framework de tests
- ❌ Pas de assertions automatisées
- ❌ Difficile à intégrer en CI/CD

**Structure:**

```typescript
interface TestScenario {
  name: string;
  contextData: any;
  expectedMonteMenuble: boolean;
  shouldApplyRules: string[];
  shouldNotApplyRules: string[];
}

const scenarios: TestScenario[] = [
  {
    /* TEST 1 */
  },
  {
    /* TEST 2 */
  },
  {
    /* TEST 3 */
  },
  {
    /* TEST 4 */
  },
];

// Exécution
for (const scenario of scenarios) {
  console.log(`\n\n${"=".repeat(76)}`);
  console.log(`✅ ${scenario.name}`);
  // ... logique de test manuelle
}
```

### Vers: Tests d'Intégration Jest (`src/tests/integration/rules-calculation.integration.test.ts`)

**Caractéristiques:**

- ✅ Framework Jest (assertions, matchers)
- ✅ Structure `describe()` / `it()` standard
- ✅ Hooks `beforeAll()` / `afterAll()`
- ✅ Isolation des tests
- ✅ Intégration CI/CD
- ✅ Rapports de couverture
- ✅ Exécution sélective

**Structure:**

```typescript
describe('Rules Calculation Integration Tests', () => {
  let movingRules: Rule[];

  beforeAll(async () => {
    // Setup: Charger règles depuis BDD
  });

  afterAll(async () => {
    // Teardown: Déconnexion Prisma
  });

  describe('Scénario 1: Sans monte-meubles', () => {
    it('devrait facturer toutes les contraintes normalement', async () => {
      // Arrange
      const context = new QuoteContext(...);
      const basePrice = new Money(100);
      const ruleEngine = new RuleEngine(movingRules);

      // Act
      const result = ruleEngine.execute(context, basePrice);

      // Assert
      expect(result.finalPrice.getAmount()).toBeGreaterThan(100);
      expect(appliedRuleNames).not.toContainEqual(
        expect.stringContaining('Monte-meuble')
      );
    });
  });

  // ... 7 autres scénarios
});
```

---

## 📊 Structure des Tests

### 8 Scénarios de Test

#### **Scénario 1: Sans Monte-Meubles**

```typescript
// Étage 2, pas d'ascenseur
// ✅ Contraintes facturées normalement
// ❌ Monte-meubles NON facturé
```

**Contexte:**

- Étage: 2 (sous seuil 3)
- Ascenseur: 'no'
- Contraintes: ['difficult_stairs', 'narrow_corridors']

**Assertions:**

```typescript
expect(appliedRuleNames).not.toContainEqual(
  expect.stringContaining("Monte-meuble"),
);
expect(result.finalPrice.getAmount()).toBeGreaterThan(100);
```

#### **Scénario 2: Avec Monte-Meubles - Étage Élevé**

```typescript
// Étage 5, pas d'ascenseur
// ✅ Monte-meubles facturé
// ❌ Contraintes consommées NON facturées
```

**Contexte:**

- Étage: 5 (> seuil 3)
- Ascenseur: 'no'
- Contraintes: ['difficult_stairs', 'narrow_corridors', 'bulky_furniture', 'heavy_items']

**Vérifications:**

```typescript
// Détection
const detection = AutoDetectionService.detectFurnitureLift(pickupData, 30);
expect(detection.furnitureLiftRequired).toBe(true);
expect(detection.consumedConstraints).toContain("difficult_stairs");

// Facturation
const hasMonteMenuble = appliedRuleNames.some((name) =>
  name.toLowerCase().includes("monte"),
);
expect(hasMonteMenuble).toBe(true);

// Pas de double facturation
const hasEscalier = appliedRuleNames.some((name) =>
  name.toLowerCase().includes("escalier"),
);
expect(hasEscalier).toBe(false);
```

#### **Scénario 3: Avec Monte-Meubles - Ascenseur Small**

```typescript
// Étage 4, ascenseur small
// ✅ Monte-meubles facturé
// ✅ elevator_unsuitable_size consommée
// ❌ Règle "Ascenseur inadapté" NON facturée
```

**Contexte:**

- Étage: 4 (> seuil 3)
- Ascenseur: 'small'
- Contraintes: ['elevator_unsuitable_size', 'narrow_corridors', 'bulky_furniture']

**Vérifications:**

```typescript
expect(detection.consumedConstraints).toContain("elevator_unsuitable_size");

const hasAscenseurInadapte = appliedRuleNames.some(
  (name) =>
    name.toLowerCase().includes("ascenseur") &&
    name.toLowerCase().includes("petit"),
);
expect(hasAscenseurInadapte).toBe(false);
```

#### **Scénario 4: Contraintes Mixtes**

```typescript
// Étage 5, pas d'ascenseur
// ✅ Monte-meubles facturé
// ✅ Contraintes véhicule facturées (NON consommées)
// ❌ Contraintes accès building NON facturées (consommées)
```

**Contexte:**

- Contraintes consommées: ['difficult_stairs', 'narrow_corridors']
- Contraintes NON consommées: ['difficult_parking', 'pedestrian_zone', 'complex_traffic']

**Vérifications:**

```typescript
// Monte-meubles facturé
expect(hasMonteMenuble).toBe(true);

// Contraintes véhicule facturées
expect(hasStationnement || hasZonePietonne || hasCirculation).toBe(true);

// Contraintes consommées NON facturées
expect(hasEscalier).toBe(false);
expect(hasCouloirs).toBe(false);
```

#### **Scénario 5: Règles Temporelles**

```typescript
// Test week-end vs semaine
// ✅ Majoration week-end le samedi
// ❌ Pas de majoration le lundi
```

**Tests:**

- 5a: Samedi → majoration week-end appliquée
- 5b: Lundi → pas de majoration

```typescript
// Samedi
context.setValue("scheduledDate", new Date("2025-11-15T10:00:00"));
const hasWeekendRule = appliedRuleNames.some((name) =>
  name.toLowerCase().includes("week-end"),
);
expect(hasWeekendRule).toBe(true);

// Lundi
context.setValue("scheduledDate", new Date("2025-11-17T10:00:00"));
expect(hasWeekendRule).toBe(false);
```

#### **Scénario 6: Règles de Réduction**

```typescript
// Gros volume + client fidèle
// ✅ Réductions appliquées
// ✅ Prix final < prix de base
```

**Contexte:**

- Volume: 50 m³ (gros volume)
- `isReturningCustomer`: true

```typescript
const reductions = result.discounts.filter((d) => d.isReduction());
expect(result.finalPrice.getAmount()).toBeLessThan(500);
```

#### **Scénario 7: Prix Minimum**

```typescript
// Petit volume + courte distance
// ✅ Prix minimum respecté
// ✅ Prix final >= prix minimum
```

**Contexte:**

- Volume: 5 m³
- Distance: 5 km
- Prix de base: 50€

```typescript
const hasPrixMinimum = appliedRuleNames.some((name) =>
  name.toLowerCase().includes("minimum"),
);
// Si règle existe, prix final >= minimum
```

#### **Scénario 8: Validation Globale**

```typescript
// Tests de validation du système
// ✅ Règles chargées depuis BDD
// ✅ Règles de contraintes présentes
// ✅ Structure des règles valide
```

```typescript
expect(movingRules.length).toBeGreaterThan(0);
expect(constraintRules.length).toBeGreaterThan(0);
```

---

## 🚀 Exécution des Tests

### Prérequis

1. **Base de données de test avec règles seedées:**

```bash
npm run prisma:migrate:dev
npm run prisma:db:seed
```

2. **Variables d'environnement:**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/express_quote_test"
NODE_ENV="test"
```

### Commandes

```bash
# Tous les tests d'intégration
npm run test:integration

# Test spécifique
npm run test:integration -- rules-calculation

# Avec couverture
npm run test:integration -- --coverage

# Mode watch
npm run test:integration -- --watch

# Verbose
npm run test:integration -- --verbose
```

### Configuration Jest

**Fichier:** `jest.integration.config.js`

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests/integration"],
  testMatch: ["**/*.integration.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testTimeout: 30000, // 30 secondes
  // ...
};
```

---

## ✅ Résultats Attendus

### Sortie Console (Succès)

```bash
$ npm run test:integration

 PASS  src/tests/integration/rules-calculation.integration.test.ts (15.234 s)
  Rules Calculation Integration Tests
    ✅ 32 règles MOVING chargées depuis la BDD

    Scénario 1: Sans monte-meubles
      ✓ devrait facturer toutes les contraintes normalement (245 ms)
        ✅ TEST 1 RÉUSSI
           Prix de base: 100€
           Prix final: 165€
           Règles appliquées: Escalier difficile, Couloirs étroits

    Scénario 2: Avec monte-meubles - Étage élevé
      ✓ devrait consommer les contraintes et facturer le monte-meubles (312 ms)
        ✅ TEST 2 RÉUSSI
           Monte-meubles détecté: true
           Contraintes consommées: difficult_stairs, narrow_corridors, bulky_furniture, heavy_items
           Prix final: 300€
           Règles appliquées: Monte-meuble

    Scénario 3: Avec monte-meubles - Ascenseur inadapté
      ✓ devrait consommer elevator_unsuitable_size (198 ms)
        ✅ TEST 3 RÉUSSI
           Contraintes consommées: elevator_unsuitable_size, narrow_corridors, bulky_furniture
           Prix final: 300€

    Scénario 4: Contraintes mixtes
      ✓ devrait facturer uniquement les contraintes NON consommées (287 ms)
        ✅ TEST 4 RÉUSSI
           Prix final: 495€
           Règles appliquées: Monte-meuble, Stationnement difficile, Zone piétonne, Circulation complexe

    Scénario 5: Règles temporelles
      ✓ devrait appliquer majoration week-end (156 ms)
        ✅ TEST 5 RÉUSSI - Majoration week-end appliquée
           Prix final: 250€
           Règles appliquées: Majoration week-end (25%)

      ✓ ne devrait PAS appliquer majoration week-end en semaine (134 ms)
        ✅ TEST 5b RÉUSSI - Pas de majoration en semaine

    Scénario 6: Règles de réduction
      ✓ devrait appliquer réductions si disponibles (178 ms)
        ✅ TEST 6 RÉUSSI - Réductions appliquées
           Nombre de réductions: 2
           Réductions: Réduction volume (-10%), Réduction fidélité (-5%)

    Scénario 7: Prix minimum
      ✓ devrait respecter le prix minimum si défini (142 ms)
        ✅ TEST 7 RÉUSSI - Prix minimum respecté
           Prix de base: 50€
           Prix final: 150€

    Scénario 8: Validation globale
      ✓ devrait avoir chargé des règles depuis la BDD (12 ms)
        ✅ 32 règles chargées

      ✓ devrait avoir des règles de contraintes (8 ms)
        ✅ 15 règles de contraintes trouvées

      ✓ toutes les règles doivent avoir une condition valide (6 ms)
        ✅ Toutes les règles ont une structure valide

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        15.234 s
```

### Sortie Console (Échec - Double Facturation Détectée)

```bash
$ npm run test:integration

 FAIL  src/tests/integration/rules-calculation.integration.test.ts
  Rules Calculation Integration Tests
    Scénario 2: Avec monte-meubles - Étage élevé
      ✕ devrait consommer les contraintes et facturer le monte-meubles (287 ms)

    ● Scénario 2 › devrait consommer les contraintes

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      281 |     // Contraintes consommées ne doivent PAS être facturées
      282 |     const hasEscalierDifficile = appliedRuleNames.some(name =>
    > 283 |       name.toLowerCase().includes('escalier')
          |                                   ^
      284 |     );
      285 |     expect(hasEscalierDifficile).toBe(false);

      ❌ DOUBLE FACTURATION DÉTECTÉE!
      La règle "Escalier difficile" a été facturée alors qu'elle devrait être consommée par le monte-meubles.

      Règles appliquées:
        - Monte-meuble (300€)
        - Escalier difficile ou dangereux (+40%)  ← ⚠️ NE DEVRAIT PAS ÊTRE LÀ!
        - Couloirs étroits ou encombrés (+25%)    ← ⚠️ NE DEVRAIT PAS ÊTRE LÀ!

      at Object.<anonymous> (src/tests/integration/rules-calculation.integration.test.ts:283:37)
```

---

## 📚 Avantages de la Transformation

### Avant (Script Standalone)

❌ **Inconvénients:**

- Pas d'intégration CI/CD
- Vérifications manuelles (logs)
- Pas de reporting automatique
- Difficile à maintenir
- Exécution séquentielle uniquement
- Pas de couverture de code

### Après (Tests Jest)

✅ **Avantages:**

- ✅ Intégration CI/CD native
- ✅ Assertions automatisées
- ✅ Rapports détaillés (JUnit, HTML)
- ✅ Structure maintenable
- ✅ Exécution parallèle possible
- ✅ Couverture de code
- ✅ Mode watch pour développement
- ✅ Isolation des tests
- ✅ Hooks setup/teardown
- ✅ Matchers Jest puissants

---

## 🔗 Références

### Fichiers Créés

- `src/tests/integration/rules-calculation.integration.test.ts` - Tests d'intégration

### Fichiers Analysés

- `src/quotation/domain/services/RuleEngine.ts`
- `src/quotation/domain/services/AutoDetectionService.ts`
- `src/quotation/domain/valueObjects/QuoteContext.ts`
- `src/quotation/domain/valueObjects/Rule.ts`
- `src/quotation/domain/valueObjects/Money.ts`
- `src/quotation/application/services/QuoteCalculationService.ts`
- `prisma/schema.prisma`

### Documentation Connexe

- [CORRECTIONS_CONTRAINTES_CONSOMMEES.md](./CORRECTIONS_CONTRAINTES_CONSOMMEES.md)
- [FORM_CONSTRUCTION_FLOW.md](./FORM_CONSTRUCTION_FLOW.md)

---

**Note**: Les tests d'intégration nécessitent une base de données de test avec des règles seedées. S'assurer que les migrations et le seed sont exécutés avant de lancer les tests.
