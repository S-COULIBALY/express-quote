# Structure de l'API REST Express-Quote

Ce document décrit l'architecture complète de l'API REST du projet Express-Quote, détaillant tous les endpoints disponibles et leurs fonctionnalités.

## Vue d'ensemble

L'API Express-Quote est construite sur l'architecture Next.js API Routes, suivant les principes REST :

- Routes orientées ressources
- Méthodes HTTP standards (GET, POST, PUT, DELETE, PATCH)
- Format JSON pour les requêtes et réponses
- Codes de statut HTTP appropriés

## Points d'entrée principaux

```
API Express-Quote
│
├─ /api
│  │
│  ├─ /packs
│  │  ├─ GET    /                       # Liste tous les packs
│  │  ├─ POST   /                       # Crée un nouveau pack
│  │  │
│  │  └─ /[id]
│  │     ├─ GET    /                    # Récupère un pack spécifique
│  │     ├─ PUT    /                    # Met à jour un pack spécifique
│  │     └─ DELETE /                    # Supprime/désactive un pack
│  │
│  ├─ /services
│  │  ├─ GET    /                       # Liste tous les services (filtrable par ?type=...)
│  │  ├─ POST   /                       # Crée un nouveau service
│  │  │
│  │  └─ /[id]
│  │     ├─ GET    /                    # Récupère un service spécifique
│  │     ├─ PUT    /                    # Met à jour un service spécifique
│  │     └─ DELETE /                    # Supprime/désactive un service
│  │
│  ├─ /bookings
│  │  ├─ GET    /                       # Liste les réservations (filtrable par client/professionnel)
│  │  ├─ POST   /                       # Crée une réservation (3 types: quote, pack, service)
│  │  │
│  │  ├─ /summary
│  │  │  └─ GET    /                    # Statistiques sur les réservations (tableaux de bord)
│  │  │
│  │  └─ /[id]
│  │     ├─ GET    /                    # Récupère une réservation spécifique
│  │     ├─ PUT    /                    # Met à jour une réservation
│  │     ├─ PATCH  /                    # Ajoute/supprime des services à la réservation
│  │     └─ DELETE /                    # Annule/supprime une réservation
│  │
│  ├─ /quotes
│  │  ├─ GET    /                       # Liste tous les devis
│  │  ├─ POST   /                       # Crée un nouveau devis
│  │  │
│  │  └─ /[id]
│  │     ├─ GET    /                    # Récupère un devis spécifique
│  │     ├─ PUT    /                    # Met à jour un devis
│  │     └─ DELETE /                    # Supprime un devis
│  │
│  ├─ /customers
│  │  ├─ GET    /                       # Liste tous les clients
│  │  ├─ POST   /                       # Crée un nouveau client
│  │  │
│  │  └─ /[id]
│  │     ├─ GET    /                    # Récupère un client spécifique
│  │     ├─ PUT    /                    # Met à jour un client
│  │     └─ DELETE /                    # Supprime un client
│  │
│  └─ /professionals
│     ├─ GET    /                       # Liste tous les professionnels
│     ├─ POST   /                       # Crée un nouveau professionnel
│     │
│     └─ /[id]
│        ├─ GET    /                    # Récupère un professionnel spécifique
│        ├─ PUT    /                    # Met à jour un professionnel
│        └─ DELETE /                    # Supprime un professionnel
```

## Détails des endpoints

### Forfaits (Packs)

#### `GET /api/packs`
- **Description :** Récupère tous les forfaits actifs
- **Paramètres :** Aucun
- **Réponse :** Liste des packs disponibles
- **Exemple de réponse :**
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
    "active": true
  },
  {
    "id": "pack_456",
    "name": "Pack Essentiel",
    "description": "1 camion de 20m³ + 3 déménageurs",
    "price": 900,
    "truckSize": 20,
    "moversCount": 3,
    "driverIncluded": true,
    "active": true
  }
]
```

#### `POST /api/packs`
- **Description :** Crée un nouveau forfait
- **Corps :** Données du pack
- **Réponse :** Pack créé
- **Exemple de requête :**
```json
{
  "name": "Pack Famille",
  "description": "1 camion de 30m³ + 4 déménageurs",
  "price": 1200,
  "truckSize": 30,
  "moversCount": 4,
  "driverIncluded": true
}
```

#### `GET /api/packs/[id]`
- **Description :** Récupère un forfait spécifique
- **Paramètres :** ID du pack dans l'URL
- **Réponse :** Détails du pack demandé

#### `PUT /api/packs/[id]`
- **Description :** Met à jour un forfait
- **Paramètres :** ID du pack dans l'URL
- **Corps :** Données à mettre à jour
- **Réponse :** Pack mis à jour

#### `DELETE /api/packs/[id]`
- **Description :** Supprime ou désactive un forfait
- **Paramètres :** ID du pack dans l'URL
- **Réponse :** Confirmation de suppression ou désactivation
- **Comportement :** Si le pack est utilisé dans des réservations, il est désactivé plutôt que supprimé

### Services

#### `GET /api/services`
- **Description :** Récupère tous les services actifs
- **Paramètres query :**
  - `type` (optionnel) : Type de service (ex: "preparation", "livraison")
- **Réponse :** Liste des services disponibles

#### `POST /api/services`
- **Description :** Crée un nouveau service
- **Corps :** Données du service
- **Réponse :** Service créé
- **Exemple de requête :**
```json
{
  "name": "Démontage complet",
  "description": "Service de démontage complet de tous les meubles",
  "price": 350,
  "serviceType": "preparation",
  "durationDays": 1,
  "peopleCount": 2
}
```

#### `GET /api/services/[id]`
- **Description :** Récupère un service spécifique
- **Paramètres :** ID du service dans l'URL
- **Réponse :** Détails du service demandé

#### `PUT /api/services/[id]`
- **Description :** Met à jour un service
- **Paramètres :** ID du service dans l'URL
- **Corps :** Données à mettre à jour
- **Réponse :** Service mis à jour

#### `DELETE /api/services/[id]`
- **Description :** Supprime ou désactive un service
- **Paramètres :** ID du service dans l'URL
- **Réponse :** Confirmation de suppression ou désactivation
- **Comportement :** Si le service est utilisé dans des réservations, il est désactivé plutôt que supprimé

### Réservations (Bookings)

#### `GET /api/bookings`
- **Description :** Récupère les réservations
- **Paramètres query :**
  - `customerId` (optionnel) : Filtre par client
  - `professionalId` (optionnel) : Filtre par professionnel
- **Réponse :** Liste des réservations correspondantes

#### `POST /api/bookings`
- **Description :** Crée une nouvelle réservation
- **Corps :** Données de la réservation
- **Réponse :** Réservation créée
- **Types de réservations :**
  1. **Réservation avec devis :**
  ```json
  {
    "type": "quote",
    "quoteId": "quote_123",
    "customerId": "client_456",
    "professionalId": "pro_789",
    "scheduledDate": "2024-11-20T08:00:00Z",
    "originAddress": "123 Rue du Départ",
    "destAddress": "456 Avenue d'Arrivée"
  }
  ```
  
  2. **Réservation avec pack :**
  ```json
  {
    "type": "pack",
    "packId": "pack_123",
    "customerId": "client_456",
    "professionalId": "pro_789",
    "scheduledDate": "2024-11-25T09:00:00Z",
    "originAddress": "789 Boulevard Central",
    "destAddress": "101 Rue Principale"
  }
  ```
  
  3. **Réservation de service uniquement :**
  ```json
  {
    "type": "service",
    "serviceId": "service_123",
    "customerId": "client_456",
    "professionalId": "pro_789",
    "scheduledDate": "2024-11-18T14:00:00Z",
    "destAddress": "202 Avenue des Fleurs"
  }
  ```

#### `GET /api/bookings/summary`
- **Description :** Récupère des statistiques sur les réservations
- **Paramètres query :**
  - `period` (optionnel) : Période (day, week, month, year)
  - `format` (optionnel) : Format de sortie (json, chart)
- **Réponse :** Résumé des réservations pour tableaux de bord
- **Exemple de réponse (format=json) :**
```json
{
  "period": "month",
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
    {"name": "Démontage et Emballage", "count": 8},
    {"name": "Livraison de cartons", "count": 6},
    {"name": "Montage et Déballage", "count": 5}
  ]
}
```

#### `GET /api/bookings/[id]`
- **Description :** Récupère une réservation spécifique
- **Paramètres :** ID de la réservation dans l'URL
- **Réponse :** Détails de la réservation avec les relations (client, professionnel, pack/devis, services)

#### `PUT /api/bookings/[id]`
- **Description :** Met à jour une réservation
- **Paramètres :** ID de la réservation dans l'URL
- **Corps :** Données à mettre à jour
- **Réponse :** Réservation mise à jour

#### `PATCH /api/bookings/[id]`
- **Description :** Ajoute ou supprime un service d'une réservation
- **Paramètres :** ID de la réservation dans l'URL
- **Corps :** Action à effectuer
- **Réponse :** Réservation mise à jour
- **Exemples de requêtes :**
  
  1. **Ajouter un service :**
  ```json
  {
    "action": "addService",
    "serviceId": "service_123",
    "serviceDate": "2024-11-21T10:00:00Z"
  }
  ```
  
  2. **Supprimer un service :**
  ```json
  {
    "action": "removeService",
    "serviceId": "service_123"
  }
  ```

#### `DELETE /api/bookings/[id]`
- **Description :** Annule ou supprime une réservation
- **Paramètres :** 
  - ID de la réservation dans l'URL
  - `force` (query, optionnel) : Si true, supprime complètement la réservation
- **Réponse :** Confirmation d'annulation ou de suppression
- **Comportement :** Par défaut, change le statut à "CANCELED" ; avec `force=true`, supprime la réservation

## Codes de statut HTTP

L'API utilise les codes de statut HTTP standard :

- **200 OK** : Requête réussie (GET, PUT, PATCH)
- **201 Created** : Ressource créée avec succès (POST)
- **400 Bad Request** : Paramètres invalides ou manquants
- **404 Not Found** : Ressource non trouvée
- **500 Internal Server Error** : Erreur serveur

## Gestion des erreurs

Toutes les réponses d'erreur suivent un format cohérent :

```json
{
  "error": "Description de l'erreur"
}
```

## Authentification

*À implémenter ultérieurement avec Supabase Auth ou une autre solution d'authentification.*

## Modèle de données et relations

Les principales entités et leurs relations :

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

## Bonnes pratiques pour utiliser l'API

1. **Validation côté client** : Validez les données avant de les envoyer à l'API
2. **Gestion des erreurs** : Implémentez une gestion robuste des erreurs dans vos applications
3. **Mise en cache** : Utilisez les techniques de mise en cache appropriées pour les données qui ne changent pas fréquemment
4. **Tests** : Testez l'API avec différents scénarios pour assurer son bon fonctionnement 