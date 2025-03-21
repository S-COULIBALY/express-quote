# Schéma de la Base de Données Express-Quote

Ce document décrit le schéma de la base de données utilisé dans le projet Express-Quote, détaillant les tables, leurs champs et les relations entre elles.

## Vue d'ensemble

Express-Quote utilise Prisma ORM avec une base de données PostgreSQL. Le modèle de données est conçu pour gérer l'ensemble du cycle de vie des services de déménagement et services associés.

## Entités principales

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Customer  │───┐   │    Quote    │       │    Pack     │
└─────────────┘   │   └─────────────┘       └─────────────┘
                  │          │                    │
                  │          │                    │
                  ▼          ▼                    ▼
┌─────────────┐  ┌─────────────────────────────────────┐
│Professional │◄─┤             Booking                 │
└─────────────┘  └─────────────────────────────────────┘
                                  ▲
                                  │
┌─────────────┐                   │
│   Service   │───────────────────┘
└─────────────┘
```

## Tables et leurs champs

### Customer (Client)

Table qui stocke les informations sur les clients.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique du client  | @id, @default(cuid()) |
| firstName   | String       | Prénom du client              | Non null          |
| lastName    | String       | Nom de famille du client      | Non null          |
| email       | String       | Adresse e-mail                | @unique, Non null |
| phone       | String       | Numéro de téléphone           | Non null          |
| addressId   | String       | Référence à l'adresse         | Foreign key       |
| address     | Address      | Relation vers l'adresse       | Relation          |
| bookings    | Booking[]    | Réservations du client        | Relation          |
| quotes      | Quote[]      | Devis du client               | Relation          |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

### Professional (Professionnel)

Table qui stocke les informations sur les prestataires de services.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique            | @id, @default(cuid()) |
| name        | String       | Nom de l'entreprise           | Non null          |
| contactName | String       | Nom du contact                | Non null          |
| email       | String       | Adresse e-mail                | @unique, Non null |
| phone       | String       | Numéro de téléphone           | Non null          |
| specialty   | String       | Spécialité                    |                   |
| addressId   | String       | Référence à l'adresse         | Foreign key       |
| address     | Address      | Relation vers l'adresse       | Relation          |
| bookings    | Booking[]    | Réservations associées        | Relation          |
| availability| ProfessionalAvailability[] | Disponibilités  | Relation          |
| rating      | Float        | Note moyenne (0-5)            | @default(0)       |
| active      | Boolean      | Statut actif                  | @default(true)    |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

### Quote (Devis)

Table qui stocke les devis pour des déménagements personnalisés.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique            | @id, @default(cuid()) |
| customerId  | String       | Référence au client           | Foreign key       |
| customer    | Customer     | Relation vers le client       | Relation          |
| serviceType | String       | Type de service (ex: "moving") | Non null          |
| status      | QuoteStatus  | Statut du devis               | Enum, @default(DRAFT) |
| volume      | Float        | Volume en m³                  | Non null          |
| distance    | Float        | Distance en km                | Non null          |
| basePrice   | Float        | Prix de base calculé          | Non null          |
| finalPrice  | Float        | Prix final après règles       | Non null          |
| originAddressId | String    | Adresse d'origine            | Foreign key       |
| destAddressId | String     | Adresse de destination        | Foreign key       |
| originAddress | Address    | Relation vers l'adresse d'origine | Relation      |
| destAddress | Address      | Relation vers l'adresse de destination | Relation  |
| options     | Json         | Options supplémentaires       |                   |
| scheduledDate | DateTime   | Date prévue                   |                   |
| bookingId   | String       | Référence à la réservation    | Foreign key, @unique |
| booking     | Booking      | Relation vers la réservation  | Relation          |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

### Pack (Forfait)

Table qui stocke les forfaits de déménagement prédéfinis.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique            | @id, @default(cuid()) |
| name        | String       | Nom du forfait                | Non null          |
| description | String       | Description détaillée         | Non null          |
| price       | Float        | Prix fixe                     | Non null          |
| truckSize   | Float        | Taille du camion en m³        | Non null          |
| moversCount | Int          | Nombre de déménageurs         | Non null          |
| driverIncluded | Boolean   | Conducteur inclus             | @default(true)    |
| bookings    | Booking[]    | Réservations associées        | Relation          |
| active      | Boolean      | Statut actif                  | @default(true)    |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

### Service

Table qui stocke les services complémentaires disponibles.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique            | @id, @default(cuid()) |
| name        | String       | Nom du service                | Non null          |
| description | String       | Description détaillée         | Non null          |
| price       | Float        | Prix du service               | Non null          |
| serviceType | String       | Type (preparation, cleaning, assembly, etc.) | Non null |
| durationHours | Float      | Durée en heures               |                   |
| durationDays | Int         | Durée en jours                |                   |
| peopleCount | Int          | Nombre de personnes requises  |                   |
| bookingServices | BookingService[] | Lien vers les réservations | Relation      |
| active      | Boolean      | Statut actif                  | @default(true)    |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

### Booking (Réservation)

Table centrale qui stocke toutes les réservations.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique            | @id, @default(cuid()) |
| type        | BookingType  | Type de réservation           | Enum, Non null    |
| status      | BookingStatus| Statut de la réservation      | Enum, @default(SCHEDULED) |
| customerId  | String       | Référence au client           | Foreign key       |
| customer    | Customer     | Relation vers le client       | Relation          |
| professionalId | String    | Référence au professionnel    | Foreign key       |
| professional | Professional | Relation vers le professionnel | Relation         |
| scheduledDate | DateTime   | Date et heure prévues         | Non null          |
| originAddressId | String   | Adresse d'origine             | Foreign key       |
| destAddressId | String     | Adresse de destination        | Foreign key       |
| originAddress | Address    | Relation vers l'adresse d'origine | Relation      |
| destAddress | Address      | Relation vers l'adresse de destination | Relation  |
| quoteId     | String       | Référence au devis (si type=QUOTE) | Foreign key, @unique |
| quote       | Quote        | Relation vers le devis        | Relation          |
| packId      | String       | Référence au forfait (si type=PACK) | Foreign key |
| pack        | Pack         | Relation vers le forfait      | Relation          |
| bookingServices | BookingService[] | Services additionnels | Relation          |
| instructions | String      | Instructions spéciales        |                   |
| cancellationReason | String | Raison d'annulation          |                   |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

### BookingService

Table de jonction qui associe des services à des réservations.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique            | @id, @default(cuid()) |
| bookingId   | String       | Référence à la réservation    | Foreign key       |
| booking     | Booking      | Relation vers la réservation  | Relation          |
| serviceId   | String       | Référence au service          | Foreign key       |
| service     | Service      | Relation vers le service      | Relation          |
| serviceDate | DateTime     | Date et heure du service      | Non null          |
| status      | ServiceStatus| Statut du service             | Enum, @default(SCHEDULED) |
| addressId   | String       | Référence à l'adresse         | Foreign key       |
| address     | Address      | Relation vers l'adresse       | Relation          |
| quantity    | Int          | Quantité (pour service multiple) | @default(1)     |
| notes       | String       | Notes spécifiques             |                   |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

### Address (Adresse)

Table qui stocke les informations d'adresse.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique            | @id, @default(cuid()) |
| street      | String       | Rue et numéro                 | Non null          |
| city        | String       | Ville                         | Non null          |
| zipCode     | String       | Code postal                   | Non null          |
| country     | String       | Pays                          | @default("France")|
| additionalInfo | String    | Informations complémentaires  |                   |
| customers   | Customer[]   | Clients liés à cette adresse  | Relation          |
| professionals | Professional[] | Professionnels liés       | Relation          |
| bookingOrigins | Booking[] | Réservations (origine)        | Relation          |
| bookingDestinations | Booking[] | Réservations (destination) | Relation       |
| quoteOrigins | Quote[]     | Devis (origine)               | Relation          |
| quoteDestinations | Quote[] | Devis (destination)          | Relation          |
| bookingServices | BookingService[] | Services liés         | Relation          |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

### ProfessionalAvailability (Disponibilité des professionnels)

Table qui gère la disponibilité des professionnels.

| Champ       | Type         | Description                   | Contraintes       |
|-------------|--------------|-------------------------------|-------------------|
| id          | String       | Identifiant unique            | @id, @default(cuid()) |
| professionalId | String    | Référence au professionnel    | Foreign key       |
| professional | Professional | Relation vers le professionnel | Relation        |
| date        | DateTime     | Date concernée                | Non null          |
| status      | AvailabilityStatus | Statut de disponibilité | Enum, Non null    |
| morningAvailable | Boolean | Disponibilité le matin        | @default(true)    |
| afternoonAvailable | Boolean | Disponibilité l'après-midi  | @default(true)    |
| bookingId   | String       | Réservation liée              | Foreign key       |
| booking     | Booking      | Relation vers la réservation  | Relation          |
| createdAt   | DateTime     | Date de création              | @default(now())   |
| updatedAt   | DateTime     | Date de dernière modification | @updatedAt        |

## Énumérations

### BookingType
- `QUOTE`: Réservation basée sur un devis
- `PACK`: Réservation basée sur un forfait
- `SERVICE`: Réservation de service uniquement

### BookingStatus
- `SCHEDULED`: Planifiée
- `CONFIRMED`: Confirmée
- `IN_PROGRESS`: En cours
- `COMPLETED`: Terminée
- `CANCELED`: Annulée

### QuoteStatus
- `DRAFT`: Brouillon
- `PENDING`: En attente
- `VALIDATED`: Validé
- `REJECTED`: Rejeté
- `CONVERTED`: Converti en réservation

### ServiceStatus
- `SCHEDULED`: Planifié
- `IN_PROGRESS`: En cours
- `COMPLETED`: Terminé
- `CANCELED`: Annulé

### AvailabilityStatus
- `AVAILABLE`: Disponible
- `PARTIALLY_BOOKED`: Partiellement réservé
- `BOOKED`: Entièrement réservé
- `UNAVAILABLE`: Indisponible

## Relations importantes

1. **Booking-Customer**: Chaque réservation appartient à un client.
2. **Booking-Professional**: Chaque réservation est attribuée à un professionnel.
3. **Booking-Quote**: Une réservation de type QUOTE est liée à un devis (relation 1:1).
4. **Booking-Pack**: Une réservation de type PACK est liée à un forfait.
5. **Booking-Service**: Les réservations peuvent avoir plusieurs services associés via BookingService.
6. **Quote-Customer**: Chaque devis appartient à un client.
7. **Professional-Availability**: Chaque professionnel a son calendrier de disponibilité.

## Considérations de performance

- Indexation sur `customerId`, `professionalId`, `scheduledDate` et `status` dans la table Booking
- Indexation sur `email` dans Customer et Professional
- Indexation sur `status` dans Quote

## Exemple de schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Customer {
  id          String    @id @default(cuid())
  firstName   String
  lastName    String
  email       String    @unique
  phone       String
  addressId   String?
  address     Address?  @relation(fields: [addressId], references: [id])
  bookings    Booking[]
  quotes      Quote[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Professional {
  id          String    @id @default(cuid())
  name        String
  contactName String
  email       String    @unique
  phone       String
  specialty   String?
  addressId   String?
  address     Address?  @relation(fields: [addressId], references: [id])
  bookings    Booking[]
  availability ProfessionalAvailability[]
  rating      Float     @default(0)
  active      Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Quote {
  id              String      @id @default(cuid())
  customerId      String
  customer        Customer    @relation(fields: [customerId], references: [id])
  serviceType     String
  status          QuoteStatus @default(DRAFT)
  volume          Float
  distance        Float
  basePrice       Float
  finalPrice      Float
  originAddressId String?
  destAddressId   String?
  originAddress   Address?    @relation("QuoteOrigins", fields: [originAddressId], references: [id])
  destAddress     Address?    @relation("QuoteDestinations", fields: [destAddressId], references: [id])
  options         Json?
  scheduledDate   DateTime?
  bookingId       String?     @unique
  booking         Booking?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}

model Pack {
  id              String    @id @default(cuid())
  name            String
  description     String
  price           Float
  truckSize       Float
  moversCount     Int
  driverIncluded  Boolean   @default(true)
  bookings        Booking[]
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Service {
  id              String    @id @default(cuid())
  name            String
  description     String
  price           Float
  serviceType     String
  durationHours   Float?
  durationDays    Int?
  peopleCount     Int?
  bookingServices BookingService[]
  active          Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Booking {
  id                String    @id @default(cuid())
  type              BookingType
  status            BookingStatus @default(SCHEDULED)
  customerId        String
  customer          Customer  @relation(fields: [customerId], references: [id])
  professionalId    String
  professional      Professional @relation(fields: [professionalId], references: [id])
  scheduledDate     DateTime
  originAddressId   String?
  destAddressId     String?
  originAddress     Address?  @relation("BookingOrigins", fields: [originAddressId], references: [id])
  destAddress       Address?  @relation("BookingDestinations", fields: [destAddressId], references: [id])
  quoteId           String?   @unique
  quote             Quote?    @relation(fields: [quoteId], references: [id])
  packId            String?
  pack              Pack?     @relation(fields: [packId], references: [id])
  bookingServices   BookingService[]
  professionalAvailability ProfessionalAvailability[]
  instructions      String?
  cancellationReason String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([customerId])
  @@index([professionalId])
  @@index([scheduledDate])
  @@index([status])
}

model BookingService {
  id          String        @id @default(cuid())
  bookingId   String
  booking     Booking       @relation(fields: [bookingId], references: [id])
  serviceId   String
  service     Service       @relation(fields: [serviceId], references: [id])
  serviceDate DateTime
  status      ServiceStatus @default(SCHEDULED)
  addressId   String?
  address     Address?      @relation(fields: [addressId], references: [id])
  quantity    Int           @default(1)
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([bookingId])
  @@index([serviceId])
}

model Address {
  id                String    @id @default(cuid())
  street            String
  city              String
  zipCode           String
  country           String    @default("France")
  additionalInfo    String?
  customers         Customer[]
  professionals     Professional[]
  bookingOrigins    Booking[] @relation("BookingOrigins")
  bookingDestinations Booking[] @relation("BookingDestinations")
  quoteOrigins      Quote[]   @relation("QuoteOrigins")
  quoteDestinations Quote[]   @relation("QuoteDestinations")
  bookingServices   BookingService[]
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

model ProfessionalAvailability {
  id                String    @id @default(cuid())
  professionalId    String
  professional      Professional @relation(fields: [professionalId], references: [id])
  date              DateTime
  status            AvailabilityStatus
  morningAvailable  Boolean   @default(true)
  afternoonAvailable Boolean   @default(true)
  bookingId         String?
  booking           Booking?  @relation(fields: [bookingId], references: [id])
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  @@index([professionalId])
  @@index([date])
}

enum BookingType {
  QUOTE
  PACK
  SERVICE
}

enum BookingStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELED
}

enum QuoteStatus {
  DRAFT
  PENDING
  VALIDATED
  REJECTED
  CONVERTED
}

enum ServiceStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELED
}

enum AvailabilityStatus {
  AVAILABLE
  PARTIALLY_BOOKED
  BOOKED
  UNAVAILABLE
}
``` 