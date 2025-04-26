# Processus de création d'une réservation dans BookingService

La classe `BookingService` gère la création de réservations à travers plusieurs étapes selon le type de service demandé. Voici une explication détaillée du processus avec un exemple de réservation de déménagement.

## Étapes principales

1. **Création de la demande de devis** (`createQuoteRequest`)
2. **Finalisation de la réservation** (`finalizeBooking`) ou **Création directe** (`createBooking`)
3. **Création de l'entité spécifique** (déménagement, pack ou service)
4. **Traitement du paiement** (facultatif, avec `processPayment`)

## Architecture de calcul des prix

Le système utilise une architecture centralisée pour le calcul des prix, assurant cohérence et résilience:

1. **Service centralisé de calcul**: `QuoteCalculatorService` fournit un point d'accès unique aux calculateurs
2. **Pattern Singleton**: Garantit qu'une seule instance du calculateur est utilisée dans toute l'application
3. **Mécanisme de fallback**: En cas d'échec d'accès à la base de données des règles, le système utilise automatiquement des règles codées en dur
4. **Initialisation à la demande**: Les calculateurs sont chargés uniquement lorsque nécessaire

Cette architecture améliore la fiabilité du système et simplifie la maintenance des règles de tarification.

## Lien entre la demande de devis et la réservation

### Nature de la relation

1. **Relation chronologique**: La demande de devis est une étape préliminaire qui peut précéder la création d'une réservation.

2. **Relation de transformation**: Une demande de devis peut être convertie en réservation via la méthode `finalizeBooking()`.

3. **Relation de données**: La réservation hérite des informations contenues dans la demande de devis.

### Aspects techniques

- Une demande de devis (`QuoteRequest`) reçoit un identifiant unique (`quoteRequestId`)
- Lors de la finalisation, la réservation conserve une référence à cet identifiant
- Quand une demande est transformée en réservation, son statut passe à `CONVERTED`
- Les deux entités partagent des informations communes (dates, adresses, volumes, options)

### Différences clés

| Demande de devis | Réservation |
|------------------|-------------|
| Temporaire (a une date d'expiration) | Persistante |
| Sans client associé | Nécessairement liée à un client |
| Sans obligation de paiement | Peut être liée à un paiement |
| Statut simple (PENDING, EXPIRED, CONVERTED) | Statuts multiples (DRAFT, PENDING, CONFIRMED, etc.) |

### Flux de création possibles

1. **Flux en deux étapes** (avec devis préalable - *recommandé*):
   - Création d'une demande de devis → Stockage temporaire → Finalisation en réservation

2. **Flux direct** (sans devis préalable):
   - Création directe d'une réservation avec toutes les informations nécessaires

Dans les deux cas, le résultat final est une réservation complète, mais le flux en deux étapes permet au client de recevoir d'abord un devis avant de s'engager définitivement.

## Exemple concret : Réservation d'un déménagement

### 1. Création de la demande de devis

```javascript
// Données envoyées par le client
const demandeDeDéménagement = {
  type: "MOVING",
  firstName: "Marie",
  lastName: "Dupont",
  email: "marie.dupont@example.com",
  phone: "0601020304",
  moveDate: "2024-08-15T09:00:00",
  pickupAddress: "12 rue des Lilas, 75020 Paris",
  pickupCity: "Paris",
  pickupPostalCode: "75020",
  pickupCountry: "France",
  deliveryAddress: "8 avenue du Parc, 69001 Lyon",
  deliveryCity: "Lyon",
  deliveryPostalCode: "69001",
  deliveryCountry: "France",
  distance: 465,
  volume: 30,
  furniture: true,
  packaging: true
};

// Appel au service
const quoteRequest = await bookingService.createQuoteRequest(demandeDeDéménagement);
```

Ce qui se passe en interne:
- La méthode `createQuoteRequest` valide le type de devis
- Elle crée une instance de `QuoteRequest` et la sauvegarde
- Selon le type (ici "MOVING"), elle appelle la méthode `createMovingQuote`
- Cette méthode crée un objet `Moving` et le sauvegarde avec une référence au `quoteRequestId`
- Le prix est calculé via le `QuoteCalculatorService` centralisé qui fournit une instance de `QuoteCalculator`

### 2. Finalisation de la réservation

```javascript
// Données client complémentaires
const clientData = {
  firstName: "Marie",
  lastName: "Dupont",
  email: "marie.dupont@example.com",
  phone: "0601020304"
};

// Finalisation
const booking = await bookingService.finalizeBooking(quoteRequest.getId(), clientData);
```

Ce qui se passe en interne:
- La méthode `finalizeBooking` vérifie que la demande de devis existe et n'a pas expiré
- Elle crée ou récupère un client avec `customerService.findOrCreateCustomer`
- Elle récupère les données du devis et crée un objet `Quote`
- Elle crée une réservation `Booking` à partir de la demande de devis
- Elle met à jour le statut de la demande de devis à "CONVERTED"
- Elle sauvegarde la réservation

### 3. Alternative: Création directe de réservation

```javascript
// Données complètes pour une création directe
const donneesReservation = {
  type: "MOVING_QUOTE",
  firstName: "Thomas",
  lastName: "Martin",
  email: "thomas.martin@example.com",
  phone: "0607080910",
  moveDate: "2024-07-20T08:30:00",
  pickupAddress: "22 rue du Commerce, 75015 Paris",
  pickupCity: "Paris",
  pickupPostalCode: "75015",
  pickupCountry: "France",
  deliveryAddress: "5 rue de la Paix, 44000 Nantes",
  deliveryCity: "Nantes",
  deliveryPostalCode: "44000",
  deliveryCountry: "France",
  distance: 380,
  volume: 25,
  pickupFloor: 2,
  pickupElevator: false,
  deliveryFloor: 1,
  deliveryElevator: true,
  furniture: true,
  fragile: true,
  packaging: true,
  paymentMethod: "CARD"
};

// Création d'un objet ContactInfo pour le client
const contactInfo = new ContactInfo(
  donneesReservation.firstName,
  donneesReservation.lastName,
  donneesReservation.email,
  donneesReservation.phone
);

// Création du client
const customer = new Customer("client123", contactInfo);

// Création directe de la réservation
const booking = await bookingService.createBooking(donneesReservation, customer);
```

Ce qui se passe en interne:
- La méthode `createBooking` vérifie le type de réservation
- Elle crée un contexte de devis avec les adresses et options
- Elle obtient une instance de calculateur via `QuoteCalculatorService.getCalculator()`
- Elle calcule le prix en appelant `calculator.calculate(context)`
- Si le calculateur principal échoue, un mécanisme de fallback est activé automatiquement
- Elle crée un objet `Quote` avec les informations du client et le prix calculé
- Elle crée une réservation `Booking` avec le client, le devis et le montant total
- Elle sauvegarde la réservation principale
- Elle crée et sauvegarde l'entité spécifique (`Moving`) avec la méthode `createMoving`

## Exemple concret : Réservation d'un service

### 1. Depuis l'interface utilisateur

Lorsqu'un client réserve un service depuis la page de détail du service:

1. **Phase de calcul de prix dynamique**:
   - Chaque modification de durée ou nombre de travailleurs déclenche un calcul via `/api/bookings/calculate`
   - L'API utilise `QuoteCalculatorService` pour obtenir le calculateur approprié
   - Le calculateur applique les règles métier pour déterminer le prix
   - En cas d'erreur, le système utilise automatiquement `FallbackCalculatorService`

2. **Phase de soumission**:
   - Le client remplit le formulaire (date, adresse, options)
   - Les données sont envoyées à `/api/bookings` via une requête POST
   - L'API délègue au `BookingController` qui utilise le `BookingService`
   - Le service crée d'abord une demande de devis (méthode recommandée)
   - Puis finalise immédiatement la réservation avec les données client

```javascript
// Exemple de données envoyées par le frontend
const formData = {
  type: 'service',
  serviceId: 'service123',
  scheduledDate: '2024-07-01',
  location: '15 rue des Fleurs, 75001 Paris',
  duration: 3,
  workers: 2,
  additionalInfo: 'Accès au 2e étage par escalier',
  calculatedPrice: 180
};

// Côté backend, cela se traduit par:
const quoteRequest = await bookingService.createQuoteRequest({
  type: 'SERVICE',
  scheduledDate: formData.scheduledDate,
  location: formData.location,
  serviceId: formData.serviceId,
  duration: formData.duration, 
  workers: formData.workers,
  notes: formData.additionalInfo
});

// Puis finalisation immédiate (dans le même flux)
const booking = await bookingService.finalizeBooking(quoteRequest.getId(), customerData);
```

### 4. Traitement du paiement

```javascript
// Données de paiement
const donneesPayment = {
  paymentMethod: "CARD",
  cardNumber: "4242 4242 4242 4242",
  expiryDate: "12/25",
  cvc: "123"
};

// Traitement du paiement
const bookingPayee = await bookingService.processPayment(booking.getId(), donneesPayment);
```

Ce qui se passe en interne:
- La méthode `processPayment` récupère la réservation
- Elle met à jour le statut à `PAYMENT_PROCESSING`
- Elle traiterait normalement le paiement via Stripe ou autre
- Elle met à jour le statut à `PAYMENT_COMPLETED` une fois le paiement réussi

## Points importants

- Le service utilise une architecture en couches avec entités de domaine et repositories
- Les calculs de prix sont centralisés via `QuoteCalculatorService` pour garantir cohérence et résilience
- Chaque type de service (déménagement, pack, service) a ses propres règles de calcul 
- Le système inclut un mécanisme de fallback automatique en cas d'erreur
- L'architecture favorise le flux en deux étapes (création de devis puis finalisation)
- Chaque réservation génère une entité spécifique (Moving, Pack ou Service) liée à la réservation principale

Cette architecture améliorée permet de gérer efficacement différents types de réservations tout en assurant une meilleure résilience du système et une maintenance simplifiée. 