# Analyse détaillée du service BookingService

Ce document présente l'analyse complète du fonctionnement du service `BookingService` et servira de référence pour la conception de l'interface utilisateur.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Flux de réservation](#flux-de-réservation)
3. [Types de réservation](#types-de-réservation)
   - [Type MOVING (Déménagement)](#type-moving-déménagement)
   - [Type PACK](#type-pack)
   - [Type SERVICE](#type-service)
4. [Calcul des prix](#calcul-des-prix)
5. [Cas d'utilisation des différents flux](#cas-dutilisation-des-différents-flux)
6. [Cycle de vie et relations entre objets](#cycle-de-vie-et-relations-entre-objets)
7. [Considérations pour l'interface utilisateur](#considérations-pour-linterface-utilisateur)
8. [Exemple concret: Flux en deux étapes](#exemple-concret-flux-en-deux-étapes)
9. [Cycle de vie complet des entités](#cycle-de-vie-complet-des-entités)

## Vue d'ensemble

Le service `BookingService` est responsable de:
- La création et gestion des demandes de devis
- La création et gestion des réservations
- Le traitement des paiements
- La liaison avec les différentes entités spécifiques (Moving, Pack, Service)

## Flux de réservation

Il existe deux flux principaux pour créer une réservation:

### 1. Flux en deux étapes

```
Demande de devis → Finalisation → Paiement (optionnel)
```

1. **Demande de devis (`createQuoteRequest`)**
   - Client anonyme
   - Stockage temporaire (avec date d'expiration)
   - Crée l'entité spécifique selon le type (Moving, Pack, Service)

2. **Finalisation (`finalizeBooking`)**
   - Association avec un client (nouveau ou existant)
   - Création d'une réservation complète
   - Changement de statut du devis à `CONVERTED`

### 2. Flux direct

```
Création directe → Paiement (optionnel)
```

1. **Création directe (`createBooking`)**
   - Nécessite toutes les informations (client et détails)
   - Calcul immédiat du prix (pour Moving)
   - Création simultanée de la réservation et de l'entité spécifique

## Types de réservation

### Type MOVING (Déménagement)

#### Flux en deux étapes pour MOVING

**Étape 1: Demande de devis**
- **Méthodes appelées**: 
  - `createQuoteRequest`: Valide le type et crée l'objet `QuoteRequest`
  - `createMovingQuote`: Crée un objet `Moving` lié au `quoteRequestId`
  - `movingRepository.save`: Persiste l'objet Moving en base de données

- **Objets créés**:
  - `QuoteRequest`: Stocke toutes les données du formulaire client
  - `Moving`: Stocke les détails spécifiques du déménagement

**Étape 2: Finalisation**
- **Méthodes appelées**:
  - `quoteRequestRepository.findById`: Récupère la demande de devis
  - `customerService.findOrCreateCustomer`: Crée/récupère le client
  - `Booking.fromQuoteRequest`: Convertit la demande en réservation
  - `quoteRequestRepository.updateStatus`: Marque la demande comme CONVERTED
  - `bookingRepository.save`: Persiste la réservation

- **Objets créés/modifiés**:
  - `Customer`: Créé à partir des données client
  - `Quote`: Créé à partir du type et du montant du devis
  - `Booking`: Entité principale qui associe Customer, Quote et détails de paiement

#### Flux direct pour MOVING

- **Méthodes appelées**:
  - `createBooking`: Méthode principale qui orchestre le processus
  - **`MovingQuoteCalculator.calculate`**: Calcule explicitement le prix
  - `bookingRepository.save`: Persiste la réservation
  - `createMoving`: Crée l'entité spécifique
  - `movingRepository.save`: Persiste les détails du déménagement

- **Objets créés**:
  - `QuoteContext`: Encapsule toutes les données nécessaires au calcul
  - `Quote`: Contient le résultat du calcul et les données client
  - `Booking`: Entité principale de réservation
  - `Moving`: Entité détaillée avec les spécificités du déménagement

### Type PACK

#### Flux en deux étapes pour PACK

**Étape 1: Demande de devis**
- **Méthodes appelées**:
  - `createQuoteRequest`: Valide et crée la demande
  - `createPackQuote`: Crée un objet `Pack`
  - `packRepository.save`: Persiste le pack

- **Objets créés**:
  - `QuoteRequest`: Stocke les données brutes de demande
  - `Pack`: Stocke les détails du pack choisi (nom, description, prix fixe)

**Étape 2: Finalisation**
- Identique au processus Moving, le prix du pack est directement utilisé

#### Flux direct pour PACK
- **Particularité**:
  - Prix fixe déterminé par la sélection du pack
  - L'objet `Pack` est créé via la méthode `createPack`

### Type SERVICE

#### Flux en deux étapes pour SERVICE
- **Méthodes appelées**:
  - `createQuoteRequest` puis `createServiceQuote`
  - `serviceRepository.save`: Persiste les détails du service

- **Objets créés**:
  - `Service`: Contient nom, description, prix, durée et date planifiée
  
- **Particularité**:
  - Prix fixe sans calcul complexe
  - Paramètre `duration` en minutes (défaut: 60)

#### Flux direct pour SERVICE
- Similaire au type PACK, prix fixe spécifié dans les données d'entrée
- Utilise `createService` pour l'entité spécifique

## Calcul des prix

### Pour le type MOVING

Le calcul du prix pour les déménagements est **toujours dynamique** et basé sur de nombreux facteurs:

#### Dans le flux en deux étapes
1. **Pré-calcul avant `createQuoteRequest`**:
   - Le prix est généralement calculé via une API utilisant `MovingQuoteCalculator` avant l'appel au service
   - Ce prix pré-calculé est inclus dans les données (dto) envoyées à `createQuoteRequest`
   - Lors de la finalisation, ce prix est récupéré via `quoteData.totalAmount`

#### Dans le flux direct
1. **Calcul explicite dans `createBooking`**:
   - Création d'un objet `QuoteContext` avec toutes les données nécessaires
   - Appel direct à `this.movingQuoteCalculator.calculate(context)`
   - Utilisation du résultat pour définir `totalAmount`

### Pour PACK et SERVICE
- Prix fixes déterminés par la sélection du pack ou service
- Pas de calcul dynamique complexe

## Cas d'utilisation des différents flux

### Flux en deux étapes 
Utilisé lorsque:
1. Le client souhaite obtenir un devis avant de décider
2. Le processus de réservation est interrompu entre le devis et la confirmation
3. Une période de réflexion est nécessaire
4. Parcours utilisateur classique sur le site web public

### Flux direct
Utilisé dans les contextes suivants:

1. **Réservation par téléphone ou en personne**
   - Prise de réservation par un agent
   - Réservation en bureau physique

2. **Clients professionnels ou réguliers**
   - Clients ayant déjà une relation établie
   - Clients connaissant déjà les tarifs

3. **Intégrations avec systèmes externes**
   - API utilisées par des applications partenaires
   - Systèmes CRM automatisés

4. **Back-office et administration**
   - Interface admin pour les gestionnaires
   - Conversion manuelle de leads

5. **Campagnes promotionnelles**
   - Offres "one-click" 
   - Offres flash avec prix garantis

## Cycle de vie et relations entre objets

### Relations principales
- `Booking` ↔ `Customer`: Relation one-to-many
- `Booking` ↔ `Moving/Pack/Service`: Relation one-to-one
- `Booking` ↔ `Quote`: Relation one-to-one
- `QuoteRequest` → `Booking`: Relation optionnelle

### Cycle de vie selon paiement

#### Avec paiement (`processPayment`)
1. État initial → `PAYMENT_PROCESSING` → `PAYMENT_COMPLETED`
2. Traitement du paiement (intégration externe)

#### Sans paiement
- État reste `DRAFT` ou `PENDING`
- Possibilité de suppression via `deleteBooking`

## Considérations pour l'interface utilisateur

### Interface publique
1. **Formulaire de demande de devis**
   - Champs variables selon le type
   - Pour MOVING: inclure champs d'adresses, volumes, options
   - Affichage du prix calculé en temps réel (appel API)

2. **Finalisation de réservation**
   - Formulaire de données personnelles client
   - Récapitulatif du devis avec prix
   - Options de paiement

### Interface administration
1. **Création directe**
   - Formulaire complet (données client + détails spécifiques)
   - Calcul dynamique pour MOVING

2. **Gestion**
   - Vues dédiées pour chaque type
   - Filtres par statut, client, date

3. **Suivi du cycle de vie**
   - Visualisation des statuts
   - Actions selon statut (paiement, annulation, etc.)

## Exemple concret: Flux en deux étapes

Pour illustrer concrètement le flux en deux étapes, voici un exemple complet d'une réservation de déménagement (MOVING) avec les transitions d'état des objets et les liens entre eux, en respectant strictement la structure des entités du domaine.

### Étape 1: Création de la demande de devis

Un client remplit un formulaire de demande de devis sur le site web avec les informations suivantes:

**Données saisies:**
- Type: MOVING
- Adresse de départ: 15 rue de Paris, 75001 Paris
- Adresse d'arrivée: 25 avenue de Lyon, 69003 Lyon
- Volume estimé: 25m³
- Date souhaitée: 15/07/2023
- Options: "Démontage meubles", "Emballage fragiles"
- Email de contact: client@example.com

#### Transition des objets:

1. **Création d'un `QuoteRequest`**:
   ```typescript
   // Les données du formulaire sont structurées dans quoteData
   const movingData = {
     departure: '15 rue de Paris, 75001 Paris',
     destination: '25 avenue de Lyon, 69003 Lyon',
     volume: 25,
     preferredDate: '2023-07-15',
     options: ['Démontage meubles', 'Emballage fragiles'],
     contactEmail: 'client@example.com',
     // Autres données pertinentes...
   };
   
   // Création de l'entité QuoteRequest selon la définition dans QuoteRequest.ts
   const quoteRequest = new QuoteRequest(
     QuoteRequestType.MOVING,
     movingData
     // L'ID est généré automatiquement par Entity
   );
   ```
   
   **État initial:**
   - `id`: UUID généré par Entity (via la méthode uuidv4)
   - `type`: QuoteRequestType.MOVING
   - `status`: QuoteRequestStatus.TEMPORARY (valeur par défaut)
   - `createdAt`: Date actuelle
   - `updatedAt`: Date actuelle
   - `expiresAt`: Date actuelle + 7 jours
   - `temporaryId`: Identifiant temporaire généré

2. **Création d'un objet `Moving`**:
   ```typescript
   // L'entité Moving contient certaines données qui apparaissent également dans QuoteRequest.quoteData
   // Cette duplication est intentionnelle et sert à des fins d'audit et de traçabilité
   const moving = new Moving(
     new Date(movingData.preferredDate),
     movingData.departure,
     movingData.destination,
     movingData.distance || 465, // Calculé automatiquement ou fourni
     movingData.volume,
     quoteRequest.getId(),
     // Autres propriétés spécifiques au déménagement selon le modèle Moving
     movingData.pickupFloor,
     movingData.deliveryFloor,
     movingData.pickupElevator,
     movingData.deliveryElevator,
     // etc.
   );
   ```

   **État initial:**
   - `id`: UUID généré par Entity
   - `quoteRequestId`: Référence à l'ID du QuoteRequest
   - Autres propriétés: Certaines données sont dupliquées depuis QuoteRequest.quoteData pour:
     1. Permettre l'indépendance du cycle de vie des entités
     2. Conserver l'historique précis des données à chaque étape
     3. Faciliter les requêtes directes sans joindre constamment les entités

  #### Confirmation et changement d'état:

```typescript
// Si le client confirme le devis
quoteRequest.updateStatus(QuoteRequestStatus.CONFIRMED);
```

#### Sauvegarde en base de données:

1. `quoteRequestRepository.save(quoteRequest)`
2. `movingRepository.save(moving)`

#### Relations entre objets après l'étape 1:

```
QuoteRequest (id: QR123) <------ Moving (id: M456)
     |                           quoteRequestId: QR123
     |
     v
status: CONFIRMED
```

**Réponse au client:**
- Une confirmation par email avec un lien contenant temporaryId
- Possibilité d'accéder au devis via temporaryId pour finalisation

### Étape 2: Finalisation de la réservation

Quelques jours plus tard, le client clique sur le lien et complète son profil pour finaliser la réservation:

**Données saisies:**
- Nom: Jean Dupont
- Téléphone: 0607080910
- Adresse: 15 rue de Paris, 75001 Paris
- Informations de paiement (optionnel)

#### Transition des objets:

1. **Récupération du `QuoteRequest`**:
   ```typescript
   // Récupération par temporaryId ou ID interne
   const quoteRequest = await quoteRequestRepository.findById(quoteRequestId);
   
   // Vérification de non-expiration
   if (quoteRequest.isExpired()) {
     throw new Error('Le devis a expiré');
   }
   ```

2. **Création ou récupération du `Customer`**:
   ```typescript
   const customerData = {
     email: 'client@example.com',
     name: 'Jean Dupont',
     phone: '0607080910',
     address: '15 rue de Paris, 75001 Paris'
   };
   
   const customer = await customerService.findOrCreateCustomer(customerData);
   ```
   
   **État:**
   - `id`: C789 (nouveau client créé)
   - Informations personnelles complétées

3. **Création d'un objet `Quote`**:
   ```typescript
   // Récupération des données du QuoteRequest
   const quoteData = quoteRequest.getQuoteData();
   
   const quote = new Quote({
     type: quoteRequest.getType(),
     totalAmount: calculatedAmount, // Calculé en fonction du type et des données
     quoteData: quoteData
   });
   ```
   
   **État:**
   - `id`: Q012 (généré)
   - `type`: Hérite du type du QuoteRequest (MOVING)
   - `totalAmount`: Montant calculé

4. **Création d'un objet `Booking`**:
   ```typescript
   const booking = new Booking({
     customerId: customer.getId(),
     quoteId: quote.getId(),
     quoteRequestId: quoteRequest.getId(),
     status: BookingStatus.PENDING,
     // Autres propriétés du booking
   });
   ```
   
   **État:**
   - `id`: B345 (généré)
   - `status`: PENDING
   - Références aux autres entités par ID

5. **Mise à jour du statut du `QuoteRequest`**:
   ```typescript
   quoteRequest.updateStatus(QuoteRequestStatus.CONVERTED);
   await quoteRequestRepository.save(quoteRequest);
   ```
   
   **Nouvel état:**
   - `status`: CONVERTED
   - `updatedAt`: Date actuelle (mis à jour par updateStatus)

#### Sauvegarde en base de données:

1. `bookingRepository.save(booking)` - **Note importante**: L'entité `Quote` n'a pas de table dédiée en base de données. Elle est encapsulée dans l'entité `Booking` et ses données sont persistées dans la table `Booking`.
2. `quoteRequestRepository.save(quoteRequest)`

#### Relations entre objets après l'étape 2:

```
                    +------------+
                    | Customer   |
                    | (id: C789) |
                    +------------+
                          ^
                          |
                          |
QuoteRequest          +-------------+          Moving
(id: QR123)  <------> | Booking     | <------> (id: M456)
status: CONVERTED     | (id: B345)  |          
                      +-------------+
                          |
                          | (encapsule)
                          v
                      [Quote object]
                    (objet en mémoire,
                    persisté dans Booking)
```

### Processus de paiement (Optionnel)

Si le client choisit de procéder au paiement immédiatement:

#### Transition des objets:

1. **Mise à jour du statut du `Booking`**:
   ```typescript
   booking.updateStatus(BookingStatus.PAYMENT_PROCESSING);
   await bookingRepository.save(booking);
   ```

2. **Traitement du paiement**:
   ```typescript
   const paymentResult = await paymentService.processPayment({
     amount: quote.getTotalAmount(),
     paymentMethod: 'card',
     cardDetails: { /* ... */ },
     bookingId: booking.getId()
   });
   ```

3. **Mise à jour finale du statut**:
   ```typescript
   if (paymentResult.success) {
     booking.updateStatus(BookingStatus.PAYMENT_COMPLETED);
     booking.setPaymentDetails({
       transactionId: paymentResult.transactionId,
       date: new Date(),
       method: 'card'
     });
   } else {
     booking.updateStatus(BookingStatus.PAYMENT_FAILED);
     booking.setPaymentDetails({
       errorMessage: paymentResult.error
     });
   }
   await bookingRepository.save(booking);
   ```

#### État final des objets:

- **QuoteRequest**: CONVERTED (archivé)
- **Customer**: Données complètes (réutilisables pour futures réservations)
- **Booking**: PAYMENT_COMPLETED
- **Quote**: Montant final fixé
- **Moving**: Détails du déménagement inchangés

### Diagramme d'état complet

```
État initial                          État intermédiaire                    État final
-----------                          ------------------                    -----------

[QuoteRequest:TEMPORARY] --> [QuoteRequest:CONFIRMED] --> [QuoteRequest:CONVERTED]
       |                                  |
       |                                  |
       v                                  v
   [Moving] ----------------------> [Moving]
                                         ^
                                         |
                                         |
                              [Customer] --> [Booking:PENDING]
                                                    |
                                                    |
                                                    v
                                          [Booking:PAYMENT_PROCESSING]
                                                    |
                                                    |
                                                    v
                                          [Booking:PAYMENT_COMPLETED]
```

Cette séquence corrigée montre comment les objets sont créés, liés et évoluent en termes d'état tout au long du processus de réservation en deux étapes, en respectant la structure des entités telle que définie dans le code source du projet.

## Cycle de vie complet des entités

### Cycle de vie détaillé de QuoteRequest

Le `QuoteRequest` est au cœur du parcours client et traverse plusieurs états qui reflètent les différentes étapes du processus de réservation. Voici son cycle de vie complet:

#### 1. TEMPORARY (Création initiale)
- **Déclencheur**: Soumission du formulaire de demande de devis par le client
- **Actions système**:
  - Création d'un nouvel objet `QuoteRequest` avec statut `TEMPORARY`
  - Attribution d'un `temporaryId` unique
  - Stockage des données brutes dans `quoteData`
  - Définition d'une date d'expiration (généralement +7 jours)
  - Création de l'entité métier correspondante (exemple: `Moving`)
- **Notification**:
  - Envoi d'un email de confirmation au client avec:
    - Récapitulatif des informations fournies
    - Lien contenant le `temporaryId` pour confirmer/modifier la demande
    - Estimation de prix préliminaire
  - Email interne à l'équipe de vente pour nouvelle opportunité
- **Validité**: État transitoire, en attente d'action du client

#### 2. CONFIRMED (Validation par le client)
- **Déclencheur**: Clic sur le lien de confirmation par le client
- **Actions système**:
  - Mise à jour du statut à `CONFIRMED`
  - Enregistrement de la date de confirmation (`updatedAt`)
  - Éventuelle mise à jour des données suite aux modifications client
- **Notification**:
  - Email au client confirmant la validation du devis
  - Email à l'équipe commerciale pour suivi pro-actif
  - Possibilité d'alertes SMS selon configuration
- **Validité**: Jusqu'à expiration ou conversion en réservation

#### 3. CONVERTED (Transformation en réservation)
- **Déclencheur**: Client complète ses informations personnelles et finalise la réservation
- **Actions système**:
  - Création d'un nouveau `Booking` basé sur le `QuoteRequest`
  - Mise à jour du statut à `CONVERTED`
  - Liaison avec l'entité `Customer` (nouveau ou existant)
  - Association avec les détails de paiement (si applicable)
- **Notification**:
  - Email de confirmation de réservation au client
  - Email de notification au professionnel assigné
  - Email interne à l'équipe logistique pour planification
- **Validité**: Archivé indéfiniment (historique des transactions)

#### 4. EXPIRED (Fin de validité)
- **Déclencheur**: Passage de la date d'expiration sans action du client
- **Actions système**:
  - Mise à jour automatique (via tâche cron) du statut à `EXPIRED`
  - Marquage comme inactif dans le système
- **Notification**:
  - Email de relance "Votre devis expire bientôt" (envoyé 48h avant expiration)
  - Email "Votre devis a expiré" avec incitation à créer un nouveau devis
- **Validité**: Archivé pour statistiques et analyse

### Cycle de vie parallèle de Moving

L'entité `Moving` évolue en parallèle du `QuoteRequest` puis du `Booking`:

#### 1. Création avec QuoteRequest
- **Déclencheur**: Création du `QuoteRequest` de type MOVING
- **État**: Associé au `quoteRequestId`
- **Contenu**: Détails spécifiques du déménagement (adresses, volume, options)
- **Rôle**: Stockage des informations métier spécifiques au déménagement

#### 2. Maintien pendant la confirmation
- **Déclencheur**: Aucun (reste inchangé)
- **État**: Identique, toujours associé au `QuoteRequest`
- **Modifications possibles**: Ajustements des options ou dates si le client modifie sa demande

#### 3. Transition lors de la création du Booking
- **Déclencheur**: Finalisation du devis et création du `Booking`
- **Action système**: Mise à jour du champ `bookingId` dans l'entité `Moving`
- **Nouvelle relation**: Double association avec `QuoteRequest` et `Booking`

#### 4. Utilisation pendant l'exécution
- **Déclencheur**: Progression de la réservation vers la réalisation
- **Utilisateurs**: Équipe logistique, déménageurs sur le terrain
- **Rôle**: Source d'informations opérationnelles pour l'exécution du service

### Interactions clés entre entités

```
Temps ─────────────────────────────────────────────────────────────────────────────────►

QuoteRequest:  [TEMPORARY] ──────► [CONFIRMED] ──────► [CONVERTED] ────────► (Archivé)
                    │                   │                   │
                    ▼                   │                   │
Moving:        [Création] ─────────────┼───────────────────┼────────────────► (Utilisé)
                                       │                   │
                                       │                   ▼
Booking:                               │             [DRAFT/PENDING] ──────► [COMPLETED]
                                       │                   │
                                       │                   ▼
Customer:                              └──────────► [Création/Récupération] ──► (Fidélisation)
```

### Flux des communications client

Durant ce cycle de vie, plusieurs emails sont envoyés au client et aux parties prenantes:

1. **Email de demande reçue**
   - Moment: Après création du `QuoteRequest` (TEMPORARY)
   - Contenu: Confirmation de réception, résumé des informations, lien de confirmation
   - Objectif: Rassurer le client et l'inciter à confirmer

2. **Email de devis confirmé**
   - Moment: Après passage à l'état CONFIRMED
   - Contenu: Devis détaillé, prix final, bouton "Finaliser ma réservation"
   - Objectif: Conversion en réservation ferme

3. **Email de rappel avant expiration**
   - Moment: 48h avant la date d'expiration
   - Contenu: Rappel de l'offre, incitatif à finaliser, contact commercial
   - Objectif: Augmenter le taux de conversion

4. **Email de confirmation de réservation**
   - Moment: Après création du `Booking` (QuoteRequest → CONVERTED)
   - Contenu: Détails complets de la réservation, prochaines étapes
   - Objectif: Informer le client et préparer la prestation

5. **Email de confirmation de paiement**
   - Moment: Après traitement réussi du paiement
   - Contenu: Reçu, montant, référence de transaction
   - Objectif: Preuve de paiement et tranquillité d'esprit

Cette communication orchestrée accompagne le client à chaque étape du processus, maximisant ainsi les chances de conversion tout en fournissant une expérience utilisateur claire et rassurante.