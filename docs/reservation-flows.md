# Flux de réservation dans Express-Quote

Ce document détaille les processus complets de réservation pour les trois types supportés dans l'application Express-Quote (basé sur devis, forfait, ou service unique), depuis l'interface utilisateur jusqu'à la persistance en base de données.

## Table des matières

- [Flux de réservation avec devis](#flux-de-réservation-avec-devis)
- [Flux de réservation avec forfait](#flux-de-réservation-avec-forfait)
- [Flux de réservation de service unique](#flux-de-réservation-de-service-unique)
- [Comparaison des types de réservation](#comparaison-des-types-de-réservation)

## Flux de réservation avec devis

### Étape 1: Interface utilisateur - Formulaire de devis

1. L'utilisateur accède au formulaire de devis via l'interface utilisateur
2. L'utilisateur remplit les informations requises:
   - Volume estimé du déménagement (m³)
   - Distance entre l'adresse d'origine et de destination (km)
   - Adresse d'origine complète
   - Adresse de destination complète
   - Date souhaitée du déménagement
   - Informations personnelles (nom, prénom, téléphone, email)
   - Options supplémentaires (étage, ascenseur, démontage, etc.)

### Étape 2: Calcul du prix

1. Le système utilise le moteur de calcul (`MovingQuoteCalculator`) pour déterminer:
   - Prix de base (en fonction du volume et de la distance)
   - Prix des options supplémentaires
   - Prix total estimé

2. Le système applique les règles métier via le moteur de règles (`RuleEngine`):
   - Ajustements saisonniers (haute saison, weekend)
   - Remises volume
   - Facteurs complexité (accès difficile, objets lourds)

### Étape 3: Validation du devis

1. L'utilisateur vérifie le devis détaillé avec sa décomposition
2. L'utilisateur peut modifier certaines options et voir le prix recalculé en temps réel
3. L'utilisateur valide le devis et le transforme en réservation

### Étape 4: Création de la réservation

1. L'interface utilisateur présente un formulaire de confirmation avec:
   - Récapitulatif du devis
   - Choix du professionnel (si non attribué automatiquement)
   - Vérification finale des dates et adresses
   - Conditions générales à accepter

2. L'utilisateur confirme la réservation

### Étape 5: Traitement API

1. Une requête POST est envoyée à l'API `/api/bookings` avec:

```json
{
  "type": "quote",
  "quoteId": "quote_123abc",
  "customerId": "customer_456def",
  "professionalId": "pro_789ghi",
  "scheduledDate": "2024-06-15T08:00:00Z",
  "originAddress": {
    "street": "123 Rue du Départ",
    "city": "Paris",
    "zipCode": "75001",
    "country": "France",
    "additionalInfo": "3ème étage sans ascenseur"
  },
  "destAddress": {
    "street": "456 Avenue d'Arrivée",
    "city": "Lyon",
    "zipCode": "69001",
    "country": "France",
    "additionalInfo": "Accès camion difficile"
  }
}
```

2. Le contrôleur API vérifie:
   - La validité du devis
   - La disponibilité du professionnel à la date donnée
   - L'existence du client ou création d'un nouveau client
   - Les informations d'adresse complètes

### Étape 6: Persistance en base de données

1. Création d'un enregistrement de réservation (booking):

```sql
-- Exemple simplifié de ce qui se passe au niveau Prisma
INSERT INTO Booking (
  id, 
  type, 
  quoteId, 
  customerId, 
  professionalId, 
  scheduledDate, 
  status,
  originAddressId,
  destAddressId,
  createdAt,
  updatedAt
) 
VALUES (
  'booking_abc123', 
  'QUOTE', 
  'quote_123abc', 
  'customer_456def', 
  'pro_789ghi', 
  '2024-06-15 08:00:00',
  'SCHEDULED',
  'address_111aaa',
  'address_222bbb',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

2. Mise à jour du statut du devis:

```sql
UPDATE Quote 
SET status = 'CONVERTED', 
    bookingId = 'booking_abc123', 
    updatedAt = CURRENT_TIMESTAMP
WHERE id = 'quote_123abc';
```

3. Mise à jour de la disponibilité du professionnel:

```sql
INSERT INTO ProfessionalAvailability (
  professionalId, 
  date, 
  status, 
  bookingId
)
VALUES (
  'pro_789ghi', 
  '2024-06-15', 
  'BOOKED', 
  'booking_abc123'
);
```

## Flux de réservation avec forfait

### Étape 1: Interface utilisateur - Sélection de forfait

1. L'utilisateur accède à la liste des forfaits disponibles
2. L'utilisateur peut filtrer les forfaits selon ses besoins:
   - Taille du camion
   - Nombre de déménageurs
   - Prix

3. L'utilisateur sélectionne un forfait qui lui convient (ex: "Pack Essentiel")

### Étape 2: Saisie des détails

1. L'utilisateur remplit un formulaire avec:
   - Adresse d'origine complète
   - Adresse de destination complète
   - Date souhaitée
   - Informations personnelles (nom, prénom, téléphone, email)
   - Remarques spécifiques (optionnel)

2. L'utilisateur peut ajouter des services complémentaires:
   - Emballage
   - Démontage/remontage
   - Nettoyage
   - Stockage temporaire

### Étape 3: Confirmation de la réservation

1. L'interface affiche un récapitulatif:
   - Détails du forfait sélectionné
   - Services complémentaires ajoutés
   - Prix total (forfait + services)
   - Adresses et date

2. L'utilisateur confirme la réservation

### Étape 4: Traitement API

1. Une requête POST est envoyée à l'API `/api/bookings` avec:

```json
{
  "type": "pack",
  "packId": "pack_abc123",
  "customerId": "customer_456def",
  "professionalId": "pro_789ghi",
  "scheduledDate": "2024-06-20T09:00:00Z",
  "originAddress": {
    "street": "789 Boulevard Central",
    "city": "Paris",
    "zipCode": "75008",
    "country": "France"
  },
  "destAddress": {
    "street": "101 Rue Principale",
    "city": "Marseille",
    "zipCode": "13001",
    "country": "France"
  },
  "additionalServices": [
    {
      "serviceId": "service_pkg1",
      "date": "2024-06-19T14:00:00Z"
    }
  ]
}
```

2. Le contrôleur API vérifie:
   - L'existence et la disponibilité du forfait
   - La disponibilité du professionnel
   - L'existence du client ou création d'un nouveau client
   - La validité des services complémentaires

### Étape 5: Persistance en base de données

1. Création d'un enregistrement de réservation:

```sql
-- Exemple simplifié
INSERT INTO Booking (
  id, 
  type, 
  packId, 
  customerId, 
  professionalId, 
  scheduledDate, 
  status,
  originAddressId,
  destAddressId,
  createdAt,
  updatedAt
) 
VALUES (
  'booking_def456', 
  'PACK', 
  'pack_abc123', 
  'customer_456def', 
  'pro_789ghi', 
  '2024-06-20 09:00:00',
  'SCHEDULED',
  'address_333ccc',
  'address_444ddd',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

2. Ajout des services complémentaires:

```sql
INSERT INTO BookingService (
  bookingId, 
  serviceId, 
  scheduledDate, 
  status
)
VALUES (
  'booking_def456', 
  'service_pkg1', 
  '2024-06-19 14:00:00', 
  'SCHEDULED'
);
```

3. Mise à jour de la disponibilité du professionnel:

```sql
INSERT INTO ProfessionalAvailability (
  professionalId, 
  date, 
  status, 
  bookingId
)
VALUES (
  'pro_789ghi', 
  '2024-06-20', 
  'BOOKED', 
  'booking_def456'
);
```

## Flux de réservation de service unique

### Étape 1: Interface utilisateur - Sélection de service

1. L'utilisateur accède au catalogue de services disponibles
2. L'utilisateur filtre par type de service (préparation, livraison, montage, etc.)
3. L'utilisateur sélectionne un service spécifique (ex: "Montage de meubles")

### Étape 2: Saisie des détails

1. L'utilisateur remplit un formulaire avec:
   - Adresse d'intervention (une seule adresse requise)
   - Date et heure souhaitées
   - Quantité ou durée si applicable (nombre de meubles, heures de service)
   - Informations personnelles (nom, prénom, téléphone, email)
   - Instructions spécifiques (optionnel)

### Étape 3: Confirmation de la réservation

1. L'interface affiche un récapitulatif:
   - Détails du service sélectionné
   - Prix total
   - Adresse et date/heure

2. L'utilisateur confirme la réservation

### Étape 4: Traitement API

1. Une requête POST est envoyée à l'API `/api/bookings` avec:

```json
{
  "type": "service",
  "serviceId": "service_xyz789",
  "customerId": "customer_456def",
  "professionalId": "pro_789ghi",
  "scheduledDate": "2024-06-18T14:00:00Z",
  "destAddress": {
    "street": "202 Avenue des Fleurs",
    "city": "Nice",
    "zipCode": "06000",
    "country": "France",
    "additionalInfo": "Contacter 15min avant arrivée"
  },
  "quantity": 5,
  "instructions": "5 meubles IKEA à monter, références listées dans les remarques"
}
```

2. Le contrôleur API vérifie:
   - L'existence et la disponibilité du service
   - La disponibilité du professionnel
   - L'existence du client ou création d'un nouveau client

### Étape 5: Persistance en base de données

1. Création d'un enregistrement de réservation:

```sql
-- Exemple simplifié
INSERT INTO Booking (
  id, 
  type, 
  customerId, 
  professionalId, 
  scheduledDate, 
  status,
  destAddressId,
  instructions,
  createdAt,
  updatedAt
) 
VALUES (
  'booking_ghi789', 
  'SERVICE', 
  'customer_456def', 
  'pro_789ghi', 
  '2024-06-18 14:00:00',
  'SCHEDULED',
  'address_555eee',
  '5 meubles IKEA à monter, références listées dans les remarques',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
```

2. Liaison du service à la réservation:

```sql
INSERT INTO BookingService (
  bookingId, 
  serviceId, 
  scheduledDate, 
  status,
  quantity
)
VALUES (
  'booking_ghi789', 
  'service_xyz789', 
  '2024-06-18 14:00:00', 
  'SCHEDULED',
  5
);
```

3. Mise à jour de la disponibilité du professionnel:

```sql
INSERT INTO ProfessionalAvailability (
  professionalId, 
  date, 
  status, 
  bookingId
)
VALUES (
  'pro_789ghi', 
  '2024-06-18', 
  'BOOKED', 
  'booking_ghi789'
);
```

## Comparaison des types de réservation

| Caractéristique | Réservation avec devis | Réservation avec forfait | Réservation de service unique |
|-----------------|------------------------|---------------------------|-------------------------------|
| Prix | Calculé dynamiquement avec `MovingQuoteCalculator` et `RuleEngine` | Prix fixe du forfait + services additionnels | Prix du service (fixe ou calculé selon quantité) |
| Entrées BDD | Quote + Booking + Addresses | Pack + Booking + Addresses + BookingServices (optionnel) | Service + Booking + Address + BookingService |
| Adresses requises | Origine et destination | Origine et destination | Une seule adresse (destination) |
| Ajout de services | Possible après création | Possible pendant et après création | Non applicable (est déjà un service) |
| Utilisé pour | Déménagements complexes personnalisés | Déménagements standards | Services ponctuels (montage, livraison, etc.) |

**Note**: Pour tous les types de réservation, il est possible d'ajouter des services supplémentaires après la création de la réservation via une requête PATCH à `/api/bookings/{id}` avec l'action `addService`. 