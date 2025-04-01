# Flux de Réservation

Ce document décrit les différents flux de réservation dans l'application.

## 1. Flux de Déménagement

graph TD
    A[Client crée Booking] --> B[Type: MOVING_QUOTE]
    B --> C[Status: DRAFT]
    C --> D[Client remplit Moving]
    D --> E[Date du déménagement]
    E --> F[Options: packaging, furniture, etc.]
    F --> G[Calcul des coûts]
    G --> H[Client confirme]
    H --> I[Status: CONFIRMED]
    I --> J[Client renseigne infos personnelles]
    J --> K[Paiement]
    K --> L[Status: PAYMENT_COMPLETED]
    L --> M[Status: COMPLETED]

### Description
Le flux de déménagement permet aux clients de demander un devis pour un déménagement, avec des options spécifiques et des détails sur les biens à déménager.

### Étapes
1. **Création du devis (DRAFT)**
   - Le client crée une nouvelle réservation de type `MOVING_QUOTE`
   - Il remplit les informations de base :
     - Adresses de départ et d'arrivée
     - Date du déménagement
     - Volume estimé
     - Distance
     - Détails sur les lieux (étages, ascenseurs, etc.)
   - Il sélectionne les options souhaitées :
     - Emballage
     - Mobilier
     - Articles fragiles
     - Stockage
     - Démontage
     - Déballage
     - Fournitures
   - Le système calcule les coûts détaillés :
     - Coût de base
     - Coût par volume
     - Prix par distance
     - Coût des options
     - Péages
     - Carburant

2. **Confirmation (CONFIRMED)**
   - Le client examine le devis
   - Il confirme la réservation
   - Le statut passe à `CONFIRMED`

3. **Paiement (AWAITING_PAYMENT → PAYMENT_PROCESSING → PAYMENT_COMPLETED)**
   - Le client est redirigé vers la page de paiement
   - Le statut passe à `AWAITING_PAYMENT`
   - Pendant le traitement : `PAYMENT_PROCESSING`
   - Après succès : `PAYMENT_COMPLETED`
   - En cas d'échec : `PAYMENT_FAILED`

4. **Exécution (COMPLETED)**
   - À la date prévue, le déménagement est effectué
   - Le statut passe à `COMPLETED`

### Documents générés
- Devis (DRAFT)
- Confirmation de réservation (CONFIRMED)
- Facture (PAYMENT_COMPLETED)
- Attestation de service (COMPLETED)

## 2. Flux de Pack

graph TD
    A[Client crée Booking] --> B[Type: PACK]
    B --> C[Status: DRAFT]
    C --> D[Client sélectionne Pack]
    D --> E[Client renseigne infos supplémentaires]
    E --> F[Date et heure]
    F --> G[Adresse de départ]
    G --> H[Adresse d'arrivée]
    H --> I[Client confirme]
    I --> J[Status: CONFIRMED]
    J --> K[Client renseigne infos personnelles]
    K --> L[Paiement]
    L --> M[Status: PAYMENT_COMPLETED]
    M --> N[Status: COMPLETED]

### Description
Le flux de pack permet aux clients de réserver un forfait prédéfini pour l'emballage de leurs biens.

### Étapes
1. **Création de la réservation (DRAFT)**
   - Le client crée une nouvelle réservation de type `PACK`
   - Il sélectionne un pack prédéfini avec :
     - Nom et description
     - Prix
     - Durée
     - Volume maximum
     - Services inclus
   - Il spécifie :
     - Date et heure souhaitées
     - Adresses de départ et d'arrivée

2. **Confirmation (CONFIRMED)**
   - Le client examine les détails du pack
   - Il confirme la réservation
   - Le statut passe à `CONFIRMED`

3. **Paiement (AWAITING_PAYMENT → PAYMENT_PROCESSING → PAYMENT_COMPLETED)**
   - Le client est redirigé vers la page de paiement
   - Le statut passe à `AWAITING_PAYMENT`
   - Pendant le traitement : `PAYMENT_PROCESSING`
   - Après succès : `PAYMENT_COMPLETED`
   - En cas d'échec : `PAYMENT_FAILED`

4. **Exécution (COMPLETED)**
   - À la date prévue, le service d'emballage est effectué
   - Le statut passe à `COMPLETED`

### Documents générés
- Confirmation de réservation (CONFIRMED)
- Facture (PAYMENT_COMPLETED)
- Attestation de service (COMPLETED)

## 3. Flux de Service

graph TD
    A[Client crée Booking] --> B[Type: SERVICE]
    B --> C[Status: DRAFT]
    C --> D[Client sélectionne Service]
    D --> E[Client renseigne infos supplémentaires]
    E --> F[Date et heure]
    F --> G[Adresse de la prestation]
    G --> H[Client confirme]
    H --> I[Status: CONFIRMED]
    I --> J[Client renseigne infos personnelles]
    J --> K[Paiement]
    K --> L[Status: PAYMENT_COMPLETED]
    L --> M[Status: COMPLETED]
    
### Description
Le flux de service permet aux clients de réserver un service spécifique (nettoyage, réparation, etc.).

### Étapes
1. **Création de la réservation (DRAFT)**
   - Le client crée une nouvelle réservation de type `SERVICE`
   - Il sélectionne un service avec :
     - Nom et description
     - Prix
     - Durée
     - Services inclus
   - Il spécifie :
     - Date et heure souhaitées
     - Lieu du service

2. **Confirmation (CONFIRMED)**
   - Le client examine les détails du service
   - Il confirme la réservation
   - Le statut passe à `CONFIRMED`

3. **Paiement (AWAITING_PAYMENT → PAYMENT_PROCESSING → PAYMENT_COMPLETED)**
   - Le client est redirigé vers la page de paiement
   - Le statut passe à `AWAITING_PAYMENT`
   - Pendant le traitement : `PAYMENT_PROCESSING`
   - Après succès : `PAYMENT_COMPLETED`
   - En cas d'échec : `PAYMENT_FAILED`

4. **Exécution (COMPLETED)**
   - À la date prévue, le service est effectué
   - Le statut passe à `COMPLETED`

### Documents générés
- Confirmation de réservation (CONFIRMED)
- Facture (PAYMENT_COMPLETED)
- Attestation de service (COMPLETED)

## Notifications

À chaque étape importante, des notifications sont envoyées :

1. **Email de confirmation**
   - Envoyé après la confirmation de la réservation
   - Inclut les détails de la réservation
   - Inclut le lien de paiement

2. **Email de confirmation de paiement**
   - Envoyé après le paiement réussi
   - Inclut la facture

3. **Email de rappel**
   - Envoyé 24h avant le service
   - Inclut les détails de rendez-vous

4. **Email de confirmation de service**
   - Envoyé après la réalisation du service
   - Inclut l'attestation de service

## Annulation

À tout moment, une réservation peut être annulée :
- Le statut passe à `CANCELED`
- Un email de confirmation d'annulation est envoyé
- Si un paiement a été effectué, un remboursement est initié 