# Processus de création d'une réservation dans BookingService

La classe `BookingService` gère la création de réservations à travers plusieurs étapes selon le type de service demandé. Voici une explication détaillée du processus avec un exemple de réservation de déménagement.

## Étapes principales

1. **Création de la demande de devis** (`createQuoteRequest`)
2. **Finalisation de la réservation** (`finalizeBooking`) ou **Création directe** (`createBooking`)
3. **Création de l'entité spécifique** (déménagement, pack ou service)
4. **Traitement du paiement** (facultatif, avec `processPayment`)

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

1. **Flux en deux étapes** (avec devis préalable):
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
- Elle calcule le prix avec le calculateur de devis de déménagement
- Elle crée un objet `Quote` avec les informations du client et le prix calculé
- Elle crée une réservation `Booking` avec le client, le devis et le montant total
- Elle sauvegarde la réservation principale
- Elle crée et sauvegarde l'entité spécifique (`Moving`) avec la méthode `createMoving`

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
- Pour les déménagements, un calculateur spécial (`MovingQuoteCalculator`) détermine le prix en fonction de nombreux paramètres
- Chaque réservation génère une entité spécifique (Moving, Pack ou Service) liée à la réservation principale
- Le service gère à la fois les flux de création en deux étapes (devis puis finalisation) et les créations directes

Cette architecture permet de gérer efficacement différents types de réservations tout en conservant une base de code cohérente et maintenable. 