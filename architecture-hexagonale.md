# Architecture Hexagonale de l'Application de Devis

Ce document détaille l'architecture hexagonale (Clean Architecture) de notre application de devis en suivant le flux de données de l'API externe jusqu'à la base de données.

## Table des matières

1. [Principes de l'architecture hexagonale](#principes-de-larchitecture-hexagonale)
2. [Vue d'ensemble des couches](#vue-densemble-des-couches)
3. [Flux complet de données](#flux-complet-de-données)
4. [Détail des couches](#détail-des-couches)
5. [Bonnes pratiques et recommandations](#bonnes-pratiques-et-recommandations)

## Principes de l'architecture hexagonale

L'architecture hexagonale (ou ports et adaptateurs) est structurée selon ces principes fondamentaux :

- **Indépendance du domaine** : Le cœur métier ne dépend d'aucune technologie externe
- **Dépendances vers l'intérieur** : Les couches externes dépendent des couches internes, jamais l'inverse
- **Ports** : Interfaces définissant comment le domaine interagit avec l'extérieur
- **Adaptateurs** : Implémentations concrètes des ports pour connecter avec les technologies externes

![Architecture Hexagonale](https://miro.medium.com/max/1400/1*LJ-J5rG71QJ9n9IBwOoYQQ.png)

## Vue d'ensemble des couches

Notre application est structurée en quatre couches principales :

1. **Interface (API/UI)** : Points d'entrée externes (routes API Next.js)
2. **Application** : Orchestration et coordination (contrôleurs, services)
3. **Domaine** : Logique métier pure (entités, value objects)
4. **Infrastructure** : Accès aux technologies externes (repositories, adaptateurs)

## Flux complet de données

Voici le flux de données complet pour le calcul d'un devis, de l'API à la base de données :

```
API (Route) → Controller → Service → Domain Entities ↔ Repositories → Database
```

### 1. API (Routes Next.js)

**Point d'entrée : `src/app/api/quotes/route.ts`**

```typescript
// 1. Réception de la requête HTTP
export async function POST(request: NextRequest) {
  // 2. Extraction des données
  const body = await request.json();
  
  // 3. Initialisation des dépendances
  const rules = await ruleService.getAllRules();
  const domainRules = rules.map(convertToRule);
  const quoteFactory = new QuoteFactory(domainRules);
  const quoteController = new QuoteController(quoteFactory);
  
  // 4. Délégation au contrôleur
  const quote = await quoteController.calculateQuote(body);
  
  // 5. Renvoi de la réponse HTTP
  return NextResponse.json({ quote }, { status: 200 });
}
```

**Responsabilités :**
- Interception des requêtes HTTP
- Extraction et validation préliminaire des données
- Initialisation des dépendances
- Injection des dépendances
- Formatage des réponses HTTP

### 2. Couche Application (Contrôleurs)

**Contrôleur principal : `src/quotation/application/controllers/QuoteController.ts`**

```typescript
export class QuoteController {
  constructor(private readonly quoteFactory: QuoteFactory) {}

  async calculateQuote(data: Record<string, any>): Promise<Quote> {
    // 1. Validation des données via DTO
    const validatedData = validateQuoteRequest(data);
    
    // 2. Assemblage du contexte
    const contextData = this.assembleContext(validatedData);
    
    // 3. Création du contexte métier
    const context = new QuoteContext(contextData);
    
    // 4. Obtention du calculateur approprié
    const calculator = this.quoteFactory.createCalculator(context.getServiceType());
    
    // 5. Délégation du calcul
    return calculator.calculate(context);
  }
  
  // Méthodes privées d'assemblage
  private assembleContext(dto: QuoteRequestDto): QuoteContextData { /* ... */ }
  private createContact(data: any): ContactInfo { /* ... */ }
  private createAddresses(data: any): { pickup: Address; delivery: Address } { /* ... */ }
  private parseAddressString(addressStr: string): { street: string, city: string, postalCode: string } { /* ... */ }
}
```

**Responsabilités :**
- Validation approfondie des données (via DTOs)
- Transformation des données brutes en objets du domaine
- Coordination du flux entre adaptateurs et domaine
- Gestion des erreurs applicatives

### 3. Couche Application (Services)

**Service principal : `src/quotation/application/services/QuoteService.ts`**

```typescript
export class QuoteService {
  constructor(
    private readonly quoteFactory: QuoteFactory,
    private readonly ruleService: RuleService,
    private readonly bookingService: BookingService,
    private readonly customerService: CustomerService
  ) {}

  // Orchestration d'opérations complexes impliquant plusieurs entités
  async createQuoteAndBooking(data: Record<string, any>, customerId?: string): Promise<{ quote: Quote, booking: Booking }> {
    // 1. Calculer le devis
    const quote = await this.calculateQuote(data);
    
    // 2. Créer ou récupérer le client
    const customer = await this.getOrCreateCustomer(customerId, data);
    
    // 3. Déterminer le type de réservation
    const bookingType = this.determineBookingType(quote);
    
    // 4. Extraire les données d'adresse
    const addressData = this.extractAddressData(quote, bookingType);
    
    // 5. Créer la réservation
    const booking = await this.bookingService.createBooking(/* ... */);
    
    return { quote, booking };
  }
  
  // Autres méthodes
  async calculateQuote(data: Record<string, any>): Promise<Quote> { /* ... */ }
  async getRulesForService(serviceType: ServiceType): Promise<any[]> { /* ... */ }
  async saveRules(serviceType: ServiceType, rules: any[]): Promise<void> { /* ... */ }
}
```

**Responsabilités :**
- Orchestration d'opérations métier complexes
- Coordination entre plusieurs entités du domaine
- Gestion des transactions
- Logique métier de haut niveau

### 4. Couche Domaine (Factories)

**Factory principale : `src/quotation/application/factories/QuoteFactory.ts`**

```typescript
export class QuoteFactory {
  private readonly calculators = new Map<ServiceType, IQuoteCalculator>();

  constructor(rules: Rule[]) {
    this.calculators.set(ServiceType.CLEANING, new CleaningQuoteCalculator(rules));
    this.calculators.set(ServiceType.MOVING, new MovingQuoteCalculator(rules));
  }

  createCalculator(serviceType: ServiceType): IQuoteCalculator {
    const calculator = this.calculators.get(serviceType);
    if (!calculator) {
      throw new Error(`No calculator found for service type: ${serviceType}`);
    }
    return calculator;
  }
}
```

**Responsabilités :**
- Création des objets du domaine
- Initialisation des dépendances internes du domaine
- Encapsulation de la logique de création

### 5. Couche Domaine (Calculateurs)

**Calculateur : `src/quotation/domain/calculators/MovingQuoteCalculator.ts`**

```typescript
export class MovingQuoteCalculator extends AbstractQuoteCalculator {
  constructor(private rules: Rule[]) {
    super();
  }

  getBasePrice(context: QuoteContext): Money {
    // Calcul du prix de base selon le volume et la distance
    const volume = context.getValue<number>('volume') || 0;
    const distance = context.getValue<number>('distance') || 0;
    
    // Logique métier spécifique au déménagement
    const volumePrice = volume * VOLUME_PRICE_PER_M3;
    const distancePrice = distance * DISTANCE_PRICE_PER_KM;
    
    return new Money(volumePrice + distancePrice);
  }

  async calculate(context: QuoteContext): Promise<Quote> {
    // Valider le contexte
    this.validateContext(context);
    
    // 1. Enrichir le contexte avec des ressources calculées
    const enrichedContext = this.enrichContextWithResources(context);
    
    // 2. Calculer le prix de base
    const basePrice = this.getBasePrice(enrichedContext);
    
    // 3. Appliquer les règles métier
    const { finalPrice, appliedRules } = this.applyRules(basePrice, enrichedContext);
    
    // 4. Calculer les réductions
    const discounts = this.getApplicableDiscounts(enrichedContext);
    
    // 5. Créer et retourner le devis
    return new Quote(basePrice, finalPrice, discounts, enrichedContext);
  }
}
```

**Responsabilités :**
- Implémentation des règles métier spécifiques
- Calculs métier complexes
- Validation des données du domaine
- Application des règles et contraintes métier

### 6. Couche Domaine (Entités et Value Objects)

**Value Object : `src/quotation/domain/valueObjects/Quote.ts`**

```typescript
export class Quote extends Entity {
  private readonly calculatedAt: Date;
  private status: QuoteStatus;

  constructor(
    private readonly basePrice: Money,
    private readonly totalPrice: Money,
    private readonly discounts: Discount[],
    private readonly context: QuoteContext,
    id?: UniqueId
  ) {
    super(id);
    this.calculatedAt = new Date();
    this.status = QuoteStatus.PENDING;
    this.validate();
  }

  private validate(): void {
    if (this.basePrice.getAmount() < 0) {
      throw new Error('Base price cannot be negative');
    }
    // Autres validations...
  }

  // Getters et méthodes de changement d'état
  public accept(): void { /* ... */ }
  public reject(): void { /* ... */ }
  public expire(): void { /* ... */ }
  public getBasePrice(): Money { /* ... */ }
  // ...
}
```

**Responsabilités :**
- Encapsulation des données et comportements du domaine
- Validation des règles métier invariantes
- Logique métier pure
- Définition de l'état et des transitions d'état

### 7. Couche Infrastructure (Services)

**Service de règles : `src/quotation/application/services/RuleService.ts`**

```typescript
export class RuleService implements IRuleService {
  private repository: RuleRepository;
  private cacheService: CacheService;

  constructor(dbClient: Pool) {
    this.repository = new RuleRepository(dbClient);
    this.cacheService = CacheService.getInstance();
  }

  async getRulesForService(serviceType: ServiceType): Promise<IPersistedRule[]> {
    const cacheKey = `${this.RULES_CACHE_KEY}:${serviceType}`;
    
    // Tentative de récupération depuis le cache
    const cachedRules = this.cacheService.get<IPersistedRule[]>(cacheKey);
    if (cachedRules) {
      return cachedRules;
    }
    
    // Récupération depuis la base de données
    const rules = await this.repository.findRulesByActivity(serviceType);
    
    // Mise en cache
    this.cacheService.set(cacheKey, rules, this.CACHE_TTL);
    
    return rules;
  }

  async saveRules(serviceType: ServiceType, rules: any[]): Promise<void> {
    // Sauvegarde en base de données
    await this.repository.saveRules(serviceType, rules);
    
    // Invalidation du cache
    const cacheKey = `${this.RULES_CACHE_KEY}:${serviceType}`;
    this.cacheService.del(cacheKey);
  }
}
```

**Responsabilités :**
- Gestion de la récupération des données métier
- Interactions avec les services externes
- Gestion du cache et des performances
- Conversion des données entre formats

### 8. Couche Infrastructure (Repositories)

**Repository : `src/quotation/infrastructure/repositories/RuleRepository.ts`**

```typescript
export class RuleRepository {
  constructor(private readonly dbClient: Pool) {}

  async findRulesByActivity(activityType: string): Promise<IPersistedRule[]> {
    try {
      const query = `
        SELECT * FROM business_rules
        WHERE activity_type = $1
        ORDER BY priority DESC
      `;
      
      const result = await this.dbClient.query(query, [activityType]);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type,
        value: row.value,
        condition: row.condition,
        activityType: row.activity_type
      }));
    } catch (error) {
      console.error(`Error fetching rules for activity ${activityType}:`, error);
      throw new Error(`Failed to fetch rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveRules(activityType: string, rules: any[]): Promise<void> {
    // Implémentation de la sauvegarde en base
    // ...
  }
}
```

**Responsabilités :**
- Accès à la base de données
- Conversion entre modèles de données et entités du domaine
- Gestion des transactions de bas niveau
- Isolation des détails techniques de persistance

### 9. Base de données

**Schéma Prisma : `prisma/schema.prisma`**

```prisma
model Booking {
  id            String        @id @default(uuid())
  type          BookingType
  status        BookingStatus @default(DRAFT)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Common fields for all booking types
  customerId    String
  customer      Customer      @relation(fields: [customerId], references: [id])
  
  // Relation avec le professionnel assigné
  professionalId String?
  professional   Professional? @relation(fields: [professionalId], references: [id])
  
  totalAmount   Float
  paymentMethod String?
  
  // Moving quote specific fields
  moveDate      DateTime?
  pickupAddress String?
  deliveryAddress String?
  distance      Float?
  volume        Float?
  
  // ... autres champs ...
}

model BusinessRule {
  id           String   @id @default(uuid())
  name         String
  type         String   // 'percentage', 'fixed'
  value        Float
  condition    String?  // Condition stockée en JSON ou en chaîne
  activityType String   // 'MOVING', 'CLEANING', etc.
  priority     Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

**Responsabilités :**
- Stockage persistant des données
- Structure physique des données
- Contraintes d'intégrité
- Relations entre entités

## Détail des couches

### Couche Interface (API/UI)

**Responsabilités principales :**
- Initialisation des dépendances externes
- Configuration des adaptateurs
- Injection des dépendances
- Intercepteur de requêtes/réponses
- Validation préliminaire des données
- Formatage des réponses

**Classes clés :**
- Routes API Next.js (`src/app/api/*/route.ts`)
- Components React (`src/app/components/*`)

### Couche Application

**Responsabilités principales :**
- Validation approfondie des entrées
- Transformation des données
- Orchestration des opérations métier
- Coordination entre entités
- Gestion des erreurs métier

**Classes clés :**
- Contrôleurs (`*Controller`)
- Services applicatifs (`*Service`)
- Assembleurs (`*Assembler`)
- Factories (`*Factory`)
- DTOs (`*Dto`)

### Couche Domaine

**Responsabilités principales :**
- Logique métier pure
- Règles invariantes du domaine
- Validation des données du domaine
- Entités et identités
- Value objects

**Classes clés :**
- Entités (`Customer`, `Booking`, etc.)
- Value Objects (`Money`, `Address`, etc.)
- Interfaces du domaine (Ports)
- Calculateurs (`*Calculator`)
- Règles (`Rule`)

### Couche Infrastructure

**Responsabilités principales :**
- Accès aux bases de données
- Communication avec services externes
- Implémentation des adaptateurs
- Conversion de données
- Services techniques

**Classes clés :**
- Repositories (`*Repository`)
- Services d'infrastructure (`EmailService`, etc.)
- Adaptateurs (`PrismaAdapter`, etc.)
- Configuration (`Database`)

## Bonnes pratiques et recommandations

1. **Initialisation des dépendances**
   - L'initialisation de toutes les dépendances **doit se faire dans la couche API** (routes)
   - Les contrôleurs, services et entités doivent **recevoir leurs dépendances** via leurs constructeurs
   - Utilisez l'**injection de dépendances** plutôt que d'instancier directement

2. **Séparation des responsabilités**
   - La **validation et transformation des données** se fait dans la couche application
   - La **logique métier pure** reste dans le domaine
   - Les **détails techniques** sont isolés dans l'infrastructure

3. **Flux de données**
   - Les données entrantes doivent être **validées le plus tôt possible**
   - Les **transformations graduelles** permettent de passer des DTO aux objets du domaine
   - Les données retournées doivent être **formatées selon les besoins de l'API**

4. **Gestion des erreurs**
   - Chaque couche doit avoir ses **propres types d'erreurs**
   - Les erreurs doivent être **enrichies à chaque niveau**
   - La couche API doit **traduire les erreurs** en codes HTTP appropriés

5. **Tests**
   - Chaque couche doit être **testable indépendamment**
   - Utilisez des **mocks** pour remplacer les dépendances externes
   - Les **tests d'intégration** valident les interactions entre couches

En suivant ces principes, votre application maintiendra une séparation claire des responsabilités, facilitera la maintenance et permettra l'évolution indépendante de chaque couche. 