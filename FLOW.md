# Flux Complet de la Méthode PUT /api/moving

Le document est structuré en 10 sections principales :
1. Point d'Entrée - Le point de départ de la requête
2. Contrôleur - La logique de contrôle
3. Service - La logique métier
4. Calculateur - Le calcul détaillé du prix
5. Création et Persistance - La création du devis
6. Création de la Réservation - La gestion des réservations
7. Points de Persistance - Les différents points de stockage en BDD
8. Flux de Données - Le parcours complet des données
9. Gestion des Erreurs - Les différents types d'erreurs
10. Statuts et Transitions - Les différents états possibles

Chaque section contient :
- Le code source pertinent
- Des commentaires détaillés
- Des explications sur le fonctionnement
- Les points importants à noter

Le document met particulièrement en évidence :
  - Le fait que la méthode PUT ne fait pas de persistance
  - Les points exacts où la persistance se fait
  - Le flux complet des données
  - Les différents statuts possibles



## 1. Point d'Entrée (src/app/api/moving/route.ts)

```typescript
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Extraction des données de la requête
    const body = await request.json();
    
    // 2. Appel du contrôleur pour calculer le devis
    const result = await quoteController.calculateQuote(body);
    
    // 3. Vérification du résultat
    if (!result.isValid) {
      return NextResponse.json(
        { success: false, errors: result.errors },
        { status: 400 }
      );
    }
    
    // 4. Retour du résultat calculé
    return NextResponse.json(
      { success: true, data: result.data },
      { status: 200 }
    );
  } catch (error) {
    // 5. Gestion des erreurs
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
```

## 2. Contrôleur (MovingQuoteController)

```typescript
public async calculateQuote(data: Record<string, any>): Promise<ValidationResult> {
  // 1. Validation des données d'entrée
  const validationResult = this.validateQuoteData(data);
  if (!validationResult.isValid) {
    return validationResult;
  }

  // 2. Transformation des données en contexte
  const validatedData = validationResult.data as MovingQuoteRequestDto;
  const context = this.assembleContext(validatedData);
  
  try {
    // 3. Calcul du devis via le service
    const quoteDetails = await this.movingQuoteService.calculateQuote(context);
    
    // 4. Retour du résultat (pas de persistance en BDD)
    return {
      isValid: true,
      data: {
        ...validatedData,
        ...quoteDetails
      }
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Erreur lors du calcul du devis']
    };
  }
}
```

## 3. Service (MovingQuoteService)

```typescript
async calculateQuote(context: QuoteContext): Promise<Quote> {
  try {
    // 1. Création du calculateur via la factory
    const calculator = this.quoteFactory.createCalculator(ServiceType.MOVING);
    
    // 2. Calcul du devis
    const quote = await calculator.calculate(context);
    
    // 3. Retour du devis calculé (non persisté)
    return quote;
  } catch (error) {
    console.error('Erreur lors du calcul du devis:', error);
    throw new Error(`Échec du calcul du devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}
```

## 4. Calculateur (MovingQuoteCalculator)

```typescript
async calculate(context: QuoteContext): Promise<Quote> {
  // 1. Vérification du type de service
  if (context.getServiceType() !== ServiceType.MOVING) {
    throw new QuoteCalculationError('Invalid context type for moving quote');
  }

  // 2. Enrichissement du contexte avec les ressources
  const enrichedContext = this.enrichContextWithResources(context);
  
  // 3. Calcul du prix de base
  const basePrice = this.getBasePrice(enrichedContext);
  
  // 4. Application des règles et récupération des réductions
  const { finalPrice, discounts } = this.ruleEngine.execute(enrichedContext, basePrice);
  
  // 5. Création d'un objet Quote (non persisté)
  return new Quote(basePrice, finalPrice, discounts, enrichedContext);
}

// Calcul du prix de base
getBasePrice(context: QuoteContext): Money {
  const volume = context.getValue<number>('volume') ?? 0;
  const distance = context.getValue<number>('distance') ?? 0;

  // Prix basé sur le volume
  const volumePrice = volume * BASE_PRICE_PER_M3;
  
  // Prix basé sur la distance
  const distancePrice = distance * DISTANCE_PRICE_PER_KM;
  
  // Frais de carburant
  const fuelCost = this.calculateFuelCost(distance);
  
  // Frais de péage
  const tollCost = this.calculateTollCost(distance);
  
  // Prix total
  const totalBasePrice = volumePrice + distancePrice + fuelCost + tollCost;

  return new Money(Math.round(totalBasePrice));
}

// Enrichissement du contexte
private enrichContextWithResources(context: QuoteContext): QuoteContext {
  const volume = context.getValue<number>('volume') ?? 0;
  const distance = context.getValue<number>('distance') ?? 0;
  
  // Calcul des ressources nécessaires
  const numberOfMovers = this.resourceCalculator.calculateRequiredMovers(volume);
  const numberOfBoxes = this.resourceCalculator.calculateEstimatedBoxes(volume);
  
  // Calcul des frais
  const fuelCost = this.calculateFuelCost(distance);
  const tollCost = this.calculateTollCost(distance);
  
  // Enrichissement du contexte
  const enrichedData = {
    ...context.getAllData(),
    numberOfMovers,
    numberOfBoxes,
    fuelCost,
    tollCost
  };
  
  return new QuoteContext(enrichedData);
}
```

## 5. Création et Persistance (MovingQuoteService)

```typescript
async createQuote(context: QuoteContext): Promise<Quote> {
  try {
    // 1. Calculer les détails du devis
    const calculation = await this.calculateQuote(context);
    
    // 2. Créer l'entité Quote
    const quote = new Quote(
      calculation.basePrice,
      calculation.totalCost,
      context
    );
    
    // 3. Persister le devis en base de données
    return await this.quoteRepository.save(quote);
  } catch (error) {
    console.error('Erreur lors de la création du devis:', error);
    throw new Error(`Échec de la création du devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}
```

## 6. Création de la Réservation (QuoteService)

```typescript
async createQuoteAndBooking(data: Record<string, any>, customerId?: string) {
  try {
    // 1. Créer et persister le devis
    const quote = await this.createQuote(data);
    
    // 2. Gérer le client
    const customer = customerId 
      ? await this.customerService.getCustomerById(customerId)
      : await this.customerService.createCustomer(data);
    
    // 3. Extraire les informations nécessaires
    const context = quote.getContext();
    const addresses = context.getAddresses();
    const pickupAddress = addresses.pickup.toString();
    const deliveryAddress = addresses.delivery.toString();
    const distance = context.getValue<number>('distance');
    const volume = context.getValue<number>('volume');
    
    // 4. Créer et persister la réservation
    const booking = await this.bookingService.createBooking(
      BookingType.MOVING_QUOTE,
      customer,
      quote.getTotalPrice(),
      pickupAddress,
      deliveryAddress,
      distance,
      volume
    );
    
    return { quote, booking };
  } catch (error) {
    throw new Error(`Error creating quote and booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

## 7. Points de Persistance en Base de Données

### 7.1 Création du Devis
- Se fait via la méthode `createQuote` du `MovingQuoteService`
- Persiste dans la table `quotes` via `PrismaMovingQuoteRepository`
- Stocke :
  - Prix de base
  - Prix total
  - Contexte complet
  - Statut initial (DRAFT)

### 7.2 Création du Client
- Se fait via `CustomerService`
- Persiste dans la table `customers`
- Stocke :
  - Informations de contact
  - Historique des devis
  - Préférences

### 7.3 Création de la Réservation
- Se fait via `BookingService`
- Persiste dans la table `bookings`
- Stocke :
  - Référence au devis
  - Référence au client
  - Adresses de départ et d'arrivée
  - Distance et volume
  - Prix total
  - Statut de la réservation

## 8. Flux de Données

1. **Requête PUT /api/moving**
   - Réception des données
   - Validation initiale

2. **Calcul du Devis**
   - Validation des données
   - Transformation en contexte
   - Calcul du prix
   - Application des règles
   - Retour du résultat (pas de persistance)

3. **Création du Devis** (POST /api/moving)
   - Calcul du devis
   - Création de l'entité
   - Persistance en BDD

4. **Création de la Réservation**
   - Création/récupération du client
   - Création de la réservation
   - Persistance en BDD

## 9. Gestion des Erreurs

### 9.1 Validation
- Validation des données d'entrée
- Vérification des champs requis
- Validation des formats

### 9.2 Calcul
- Erreurs de type de service
- Erreurs de calcul
- Erreurs de règles

### 9.3 Persistance
- Erreurs de connexion à la BDD
- Erreurs de contraintes
- Erreurs de transaction

## 10. Statuts et Transitions

### 10.1 Devis
- DRAFT → PENDING
- PENDING → ACCEPTED/REJECTED
- ACCEPTED → COMPLETED/CANCELLED

### 10.2 Réservation
- PENDING → CONFIRMED
- CONFIRMED → IN_PROGRESS
- IN_PROGRESS → COMPLETED/CANCELLED
