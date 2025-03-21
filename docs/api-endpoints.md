# Documentation des Endpoints API Express-Quote

Ce document fournit une documentation technique détaillée pour tous les endpoints de l'API Express-Quote. Pour chaque endpoint, nous détaillons les paramètres, corps de requête, formats de réponse et exemples.

## Table des matières

- [Devis (Quotes)](#devis-quotes)
- [Forfaits (Packs)](#forfaits-packs)
- [Services](#services)
- [Réservations (Bookings)](#réservations-bookings)
- [Clients (Customers)](#clients-customers)
- [Professionnels (Professionals)](#professionnels-professionals)

---

## Devis (Quotes)

### `GET /api/quotes`

Récupère la liste des devis, avec possibilité de filtrage.

**Paramètres de requête (query params):**
- `customerId` (optionnel): Filtre les devis par client
- `status` (optionnel): Filtre par statut (DRAFT, PENDING, VALIDATED, REJECTED, CONVERTED)
- `limit` (optionnel): Limite le nombre de résultats (défaut: 20)
- `offset` (optionnel): Décalage pour la pagination (défaut: 0)

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "total": 35,
  "quotes": [
    {
      "id": "quote_123",
      "createdAt": "2024-05-10T14:30:00Z",
      "status": "VALIDATED",
      "serviceType": "moving",
      "volume": 25,
      "distance": 60,
      "basePrice": 270,
      "finalPrice": 720,
      "customer": {
        "id": "cust_456",
        "name": "Jean Dupont",
        "email": "jean@example.com"
      }
    },
    // ...autres devis
  ]
}
```

### `POST /api/quotes`

Crée un nouveau devis.

**Corps de la requête:**
```json
{
  "customerId": "cust_456",
  "serviceType": "moving",
  "volume": 25,
  "distance": 60,
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
    "country": "France"
  },
  "scheduledDate": "2024-06-15T08:00:00Z",
  "options": {
    "hasHeavyItems": true,
    "hasFragileItems": true,
    "hasAssemblyDisassembly": false
  }
}
```

**Réponse:**
- Code: 201 Created
- Corps:
```json
{
  "id": "quote_789",
  "createdAt": "2024-05-20T10:15:30Z",
  "status": "DRAFT",
  "serviceType": "moving",
  "volume": 25,
  "distance": 60,
  "basePrice": 270,
  "finalPrice": 720,
  "options": {
    "hasHeavyItems": true,
    "hasFragileItems": true,
    "hasAssemblyDisassembly": false
  },
  "priceBreakdown": [
    {
      "label": "Prix de base",
      "amount": 270,
      "type": "base"
    },
    {
      "label": "Articles lourds",
      "amount": 150,
      "type": "option"
    },
    {
      "label": "Articles fragiles",
      "amount": 100,
      "type": "option"
    },
    {
      "label": "Remise volume",
      "amount": -50,
      "type": "discount"
    },
    {
      "label": "Taxe",
      "amount": 250,
      "type": "tax"
    }
  ]
}
```

### `GET /api/quotes/[id]`

Récupère un devis spécifique.

**Paramètres d'URL:**
- `id`: Identifiant du devis

**Réponse:**
- Code: 200 OK
- Corps: Devis complet avec toutes les informations associées

### `PUT /api/quotes/[id]`

Met à jour un devis existant.

**Paramètres d'URL:**
- `id`: Identifiant du devis

**Corps de la requête:**
```json
{
  "status": "VALIDATED",
  "volume": 30,
  "distance": 65,
  "options": {
    "hasHeavyItems": true,
    "hasFragileItems": true,
    "hasAssemblyDisassembly": true
  }
}
```

**Réponse:**
- Code: 200 OK
- Corps: Devis mis à jour

### `DELETE /api/quotes/[id]`

Supprime un devis.

**Paramètres d'URL:**
- `id`: Identifiant du devis

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "success": true,
  "message": "Devis supprimé avec succès"
}
```

**Erreurs possibles:**
- 404 Not Found: Devis non trouvé
- 400 Bad Request: Impossible de supprimer un devis converti en réservation

---

## Forfaits (Packs)

### `GET /api/packs`

Récupère la liste des forfaits disponibles.

**Paramètres de requête:**
- `active` (optionnel): Si true, renvoie uniquement les forfaits actifs
- `minMovers` (optionnel): Nombre minimum de déménageurs
- `minTruckSize` (optionnel): Taille minimum du camion en m³

**Réponse:**
- Code: 200 OK
- Corps:
```json
[
  {
    "id": "pack_123",
    "name": "Pack Solo",
    "description": "1 camion de 20m³ + 2 déménageurs",
    "price": 600,
    "truckSize": 20,
    "moversCount": 2,
    "driverIncluded": true,
    "active": true,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  // ...autres forfaits
]
```

### `POST /api/packs`

Crée un nouveau forfait.

**Corps de la requête:**
```json
{
  "name": "Pack Famille",
  "description": "1 camion de 30m³ + 4 déménageurs",
  "price": 1200,
  "truckSize": 30,
  "moversCount": 4,
  "driverIncluded": true,
  "active": true
}
```

**Réponse:**
- Code: 201 Created
- Corps: Forfait créé

### `GET /api/packs/[id]`

Récupère les détails d'un forfait spécifique.

**Paramètres d'URL:**
- `id`: Identifiant du forfait

**Réponse:**
- Code: 200 OK
- Corps: Détails complets du forfait

### `PUT /api/packs/[id]`

Met à jour un forfait existant.

**Paramètres d'URL:**
- `id`: Identifiant du forfait

**Corps de la requête:**
```json
{
  "price": 1300,
  "description": "1 camion de 30m³ + 4 déménageurs professionnels",
  "active": true
}
```

**Réponse:**
- Code: 200 OK
- Corps: Forfait mis à jour

### `DELETE /api/packs/[id]`

Désactive ou supprime un forfait.

**Paramètres d'URL:**
- `id`: Identifiant du forfait

**Paramètres de requête:**
- `force` (optionnel): Si true, supprime complètement le forfait au lieu de le désactiver

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "success": true,
  "message": "Forfait désactivé avec succès"
}
```

**Erreurs possibles:**
- 404 Not Found: Forfait non trouvé
- 400 Bad Request: Impossible de supprimer un forfait utilisé dans des réservations actives

---

## Services

### `GET /api/services`

Récupère la liste des services disponibles.

**Paramètres de requête:**
- `type` (optionnel): Type de service (preparation, packing, assembly, cleaning, etc.)
- `active` (optionnel): Si true, renvoie uniquement les services actifs
- `minPrice` (optionnel): Prix minimum
- `maxPrice` (optionnel): Prix maximum

**Réponse:**
- Code: 200 OK
- Corps:
```json
[
  {
    "id": "service_123",
    "name": "Démontage complet",
    "description": "Service de démontage complet de tous les meubles",
    "price": 350,
    "serviceType": "preparation",
    "durationDays": 1,
    "peopleCount": 2,
    "active": true
  },
  // ...autres services
]
```

### `POST /api/services`

Crée un nouveau service.

**Corps de la requête:**
```json
{
  "name": "Nettoyage professionnel",
  "description": "Nettoyage complet de l'ancien domicile",
  "price": 250,
  "serviceType": "cleaning",
  "durationHours": 4,
  "peopleCount": 2,
  "active": true
}
```

**Réponse:**
- Code: 201 Created
- Corps: Service créé

### `GET /api/services/[id]`

Récupère les détails d'un service spécifique.

**Paramètres d'URL:**
- `id`: Identifiant du service

**Réponse:**
- Code: 200 OK
- Corps: Détails complets du service

### `PUT /api/services/[id]`

Met à jour un service existant.

**Paramètres d'URL:**
- `id`: Identifiant du service

**Corps de la requête:**
```json
{
  "price": 280,
  "description": "Nettoyage approfondi de l'ancien domicile",
  "active": true
}
```

**Réponse:**
- Code: 200 OK
- Corps: Service mis à jour

### `DELETE /api/services/[id]`

Désactive ou supprime un service.

**Paramètres d'URL:**
- `id`: Identifiant du service

**Paramètres de requête:**
- `force` (optionnel): Si true, supprime complètement le service au lieu de le désactiver

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "success": true,
  "message": "Service désactivé avec succès"
}
```

---

## Réservations (Bookings)

### `GET /api/bookings`

Récupère la liste des réservations, avec possibilité de filtrage.

**Paramètres de requête:**
- `customerId` (optionnel): Filtre par client
- `professionalId` (optionnel): Filtre par professionnel
- `status` (optionnel): Filtre par statut (SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELED)
- `startDate` (optionnel): Date de début pour le filtrage
- `endDate` (optionnel): Date de fin pour le filtrage
- `type` (optionnel): Type de réservation (quote, pack, service)

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "total": 25,
  "bookings": [
    {
      "id": "booking_123",
      "type": "QUOTE",
      "status": "SCHEDULED",
      "scheduledDate": "2024-06-15T08:00:00Z",
      "createdAt": "2024-05-10T14:30:00Z",
      "customer": {
        "id": "cust_456",
        "name": "Jean Dupont"
      },
      "professional": {
        "id": "pro_789",
        "name": "Déménagements Express"
      },
      "quote": {
        "id": "quote_abc",
        "finalPrice": 720
      }
    },
    // ...autres réservations
  ]
}
```

### `POST /api/bookings`

Crée une nouvelle réservation. Supporte trois types de réservations: basée sur un devis, sur un forfait, ou sur un service unique.

**Corps de la requête (basée sur un devis):**
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

**Corps de la requête (basée sur un forfait):**
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

**Corps de la requête (basée sur un service):**
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

**Réponse:**
- Code: 201 Created
- Corps: Réservation créée avec détails

**Erreurs possibles:**
- 400 Bad Request: Type de réservation invalide ou informations manquantes
- 404 Not Found: Devis, forfait, service, client ou professionnel non trouvé
- 409 Conflict: Professionnel non disponible à la date demandée

### `GET /api/bookings/summary`

Récupère des statistiques sur les réservations pour tableaux de bord.

**Paramètres de requête:**
- `period` (optionnel): Période d'analyse (day, week, month, year)
- `startDate` (optionnel): Date de début pour l'analyse
- `endDate` (optionnel): Date de fin pour l'analyse
- `format` (optionnel): Format de sortie (json, chart)

**Réponse:**
- Code: 200 OK
- Corps (format=json):
```json
{
  "period": "month",
  "startDate": "2024-05-01",
  "endDate": "2024-05-31",
  "totalBookings": 25,
  "bookingsByStatus": {
    "SCHEDULED": 10,
    "CONFIRMED": 8,
    "IN_PROGRESS": 2,
    "COMPLETED": 3,
    "CANCELED": 2
  },
  "totalRevenue": 15420,
  "bookingTypes": {
    "quote": 12,
    "pack": 10,
    "serviceOnly": 3
  },
  "topServices": [
    {"name": "Démontage et Emballage", "count": 8, "revenue": 2800},
    {"name": "Livraison de cartons", "count": 6, "revenue": 480},
    {"name": "Montage et Déballage", "count": 5, "revenue": 1750}
  ]
}
```

### `GET /api/bookings/[id]`

Récupère les détails d'une réservation spécifique.

**Paramètres d'URL:**
- `id`: Identifiant de la réservation

**Réponse:**
- Code: 200 OK
- Corps: Détails complets de la réservation avec toutes les relations (client, professionnel, devis/forfait, services additionnels)

### `PUT /api/bookings/[id]`

Met à jour une réservation existante.

**Paramètres d'URL:**
- `id`: Identifiant de la réservation

**Corps de la requête:**
```json
{
  "status": "CONFIRMED",
  "scheduledDate": "2024-06-16T10:00:00Z",
  "professionalId": "pro_456abc"
}
```

**Réponse:**
- Code: 200 OK
- Corps: Réservation mise à jour

**Erreurs possibles:**
- 404 Not Found: Réservation ou professionnel non trouvé
- 400 Bad Request: Statut invalide ou données incorrectes
- 409 Conflict: Nouveau professionnel non disponible à la date demandée

### `PATCH /api/bookings/[id]`

Permet d'ajouter ou supprimer des services additionnels pour une réservation.

**Paramètres d'URL:**
- `id`: Identifiant de la réservation

**Corps de la requête (ajout de service):**
```json
{
  "action": "addService",
  "serviceId": "service_123",
  "serviceDate": "2024-06-21T10:00:00Z",
  "quantity": 1,
  "address": {
    "street": "123 Rue du Service",
    "city": "Paris",
    "zipCode": "75001",
    "country": "France"
  }
}
```

**Corps de la requête (suppression de service):**
```json
{
  "action": "removeService",
  "serviceId": "service_123"
}
```

**Réponse:**
- Code: 200 OK
- Corps: Réservation mise à jour avec la liste des services actuels

**Erreurs possibles:**
- 404 Not Found: Réservation ou service non trouvé
- 400 Bad Request: Action invalide ou service déjà exécuté

### `DELETE /api/bookings/[id]`

Annule ou supprime une réservation.

**Paramètres d'URL:**
- `id`: Identifiant de la réservation

**Paramètres de requête:**
- `force` (optionnel): Si true, supprime complètement la réservation au lieu de la marquer comme annulée
- `reason` (optionnel): Raison de l'annulation

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "success": true,
  "message": "Réservation annulée avec succès"
}
```

**Erreurs possibles:**
- 404 Not Found: Réservation non trouvée
- 400 Bad Request: Impossible d'annuler une réservation déjà terminée
- 403 Forbidden: Permission insuffisante pour supprimer complètement la réservation

---

## Clients (Customers)

### `GET /api/customers`

Récupère la liste des clients.

**Paramètres de requête:**
- `search` (optionnel): Terme de recherche (nom, email, téléphone)
- `limit` (optionnel): Limite le nombre de résultats
- `offset` (optionnel): Décalage pour la pagination

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "total": 85,
  "customers": [
    {
      "id": "cust_123",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+33612345678",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    // ...autres clients
  ]
}
```

### `POST /api/customers`

Crée un nouveau client.

**Corps de la requête:**
```json
{
  "firstName": "Marie",
  "lastName": "Martin",
  "email": "marie.martin@example.com",
  "phone": "+33687654321",
  "address": {
    "street": "123 Avenue des Clients",
    "city": "Paris",
    "zipCode": "75002",
    "country": "France"
  }
}
```

**Réponse:**
- Code: 201 Created
- Corps: Client créé

**Erreurs possibles:**
- 400 Bad Request: Données manquantes ou invalides
- 409 Conflict: Email déjà utilisé par un autre client

### `GET /api/customers/[id]`

Récupère les détails d'un client spécifique.

**Paramètres d'URL:**
- `id`: Identifiant du client

**Réponse:**
- Code: 200 OK
- Corps: Détails complets du client avec historique des réservations

### `PUT /api/customers/[id]`

Met à jour un client existant.

**Paramètres d'URL:**
- `id`: Identifiant du client

**Corps de la requête:**
```json
{
  "firstName": "Marie",
  "lastName": "Durand",
  "phone": "+33687654322",
  "address": {
    "street": "456 Boulevard des Clients",
    "city": "Paris",
    "zipCode": "75002",
    "country": "France"
  }
}
```

**Réponse:**
- Code: 200 OK
- Corps: Client mis à jour

### `DELETE /api/customers/[id]`

Supprime un client.

**Paramètres d'URL:**
- `id`: Identifiant du client

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "success": true,
  "message": "Client supprimé avec succès"
}
```

**Erreurs possibles:**
- 404 Not Found: Client non trouvé
- 400 Bad Request: Impossible de supprimer un client ayant des réservations actives

---

## Professionnels (Professionals)

### `GET /api/professionals`

Récupère la liste des professionnels.

**Paramètres de requête:**
- `search` (optionnel): Terme de recherche (nom, spécialité)
- `available` (optionnel): Si true, renvoie uniquement les professionnels disponibles
- `date` (optionnel): Date de disponibilité pour filtrage
- `limit` (optionnel): Limite le nombre de résultats
- `offset` (optionnel): Décalage pour la pagination

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "total": 25,
  "professionals": [
    {
      "id": "pro_123",
      "name": "Déménagements Express",
      "contactName": "Pierre Dupuis",
      "email": "contact@demenagements-express.com",
      "phone": "+33123456789",
      "specialty": "Déménagement résidentiel",
      "rating": 4.8,
      "active": true
    },
    // ...autres professionnels
  ]
}
```

### `POST /api/professionals`

Crée un nouveau professionnel.

**Corps de la requête:**
```json
{
  "name": "Montage & Co",
  "contactName": "Sophie Leclerc",
  "email": "contact@montage-co.com",
  "phone": "+33123456780",
  "specialty": "Montage et démontage de meubles",
  "address": {
    "street": "10 Rue des Artisans",
    "city": "Lyon",
    "zipCode": "69002",
    "country": "France"
  },
  "active": true
}
```

**Réponse:**
- Code: 201 Created
- Corps: Professionnel créé

### `GET /api/professionals/[id]`

Récupère les détails d'un professionnel spécifique.

**Paramètres d'URL:**
- `id`: Identifiant du professionnel

**Réponse:**
- Code: 200 OK
- Corps: Détails complets du professionnel avec calendrier de disponibilité

### `GET /api/professionals/[id]/availability`

Récupère la disponibilité d'un professionnel pour une période donnée.

**Paramètres d'URL:**
- `id`: Identifiant du professionnel

**Paramètres de requête:**
- `startDate`: Date de début (obligatoire)
- `endDate`: Date de fin (obligatoire)

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "professionalId": "pro_123",
  "startDate": "2024-06-01",
  "endDate": "2024-06-30",
  "availability": [
    {
      "date": "2024-06-01",
      "status": "AVAILABLE",
      "slots": ["MORNING", "AFTERNOON"]
    },
    {
      "date": "2024-06-02",
      "status": "PARTIALLY_BOOKED",
      "slots": ["AFTERNOON"]
    },
    {
      "date": "2024-06-03",
      "status": "BOOKED",
      "slots": []
    },
    // ...autres dates
  ]
}
```

### `PUT /api/professionals/[id]`

Met à jour un professionnel existant.

**Paramètres d'URL:**
- `id`: Identifiant du professionnel

**Corps de la requête:**
```json
{
  "name": "Montage & Co Pro",
  "phone": "+33123456781",
  "specialty": "Montage, démontage et réparation de meubles",
  "active": true
}
```

**Réponse:**
- Code: 200 OK
- Corps: Professionnel mis à jour

### `DELETE /api/professionals/[id]`

Désactive ou supprime un professionnel.

**Paramètres d'URL:**
- `id`: Identifiant du professionnel

**Paramètres de requête:**
- `force` (optionnel): Si true, supprime complètement le professionnel au lieu de le désactiver

**Réponse:**
- Code: 200 OK
- Corps:
```json
{
  "success": true,
  "message": "Professionnel désactivé avec succès"
}
```

**Erreurs possibles:**
- 404 Not Found: Professionnel non trouvé
- 400 Bad Request: Impossible de supprimer un professionnel ayant des réservations à venir 