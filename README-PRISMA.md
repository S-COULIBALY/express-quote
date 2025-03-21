# Configuration de Prisma et Supabase

Ce document explique comment configurer Prisma et Supabase pour la gestion de la persistance des données dans le projet.

## Prérequis

- Node.js 16+ et npm
- PostgreSQL ou un compte Supabase

## Étapes de configuration

### 1. Installation des dépendances

```bash
npm install @prisma/client
npm install prisma --save-dev
npm install @supabase/supabase-js
```

### 2. Configuration de Supabase

1. Créez un compte sur [Supabase](https://supabase.com)
2. Créez un projet
3. Notez l'URL de votre projet et la clé anon
4. Configurez les variables d'environnement dans `.env` :

```
SUPABASE_URL=https://votre-project-url.supabase.co
SUPABASE_KEY=votre-clé-anon
SUPABASE_SERVICE_KEY=votre-clé-service

# URL de connexion PostgreSQL pour Prisma
DATABASE_URL="postgresql://postgres:mot-de-passe@db.votre-project-url.supabase.co:5432/postgres"
```

### 3. Initialisation de Prisma

Le schéma Prisma est déjà configuré dans `prisma/schema.prisma`. Il définit les modèles suivants :

- `BusinessRule` - Règles métier
- `Customer` - Clients
- `Professional` - Professionnels
- `Quote` - Devis
- `Pack` - Forfaits prédéfinis
- `Service` - Services additionnels
- `Booking` - Réservations
- `BookingService` - Relation entre réservations et services

### 4. Génération des tables

Pour créer les tables dans la base de données :

```bash
# Soit pousser le schéma directement (développement)
npm run prisma:db:push

# Soit créer une migration (production)
npm run prisma:migrate:dev
```

### 5. Génération du client Prisma

Pour régénérer le client Prisma après des modifications du schéma :

```bash
npm run prisma:generate
```

### 6. Initialisation des données

Pour initialiser des données de test :

```bash
npm run prisma:db:seed
```

Cela créera :
- Packs de déménagement prédéfinis
- Services additionnels
- Exemples de clients et professionnels
- Exemples de réservations

### 7. Explorer la base de données

Pour visualiser et gérer les données :

```bash
npm run prisma:studio
```

## Utilisation dans le code

### Importer le client Prisma

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

### Utilisation de base

```typescript
// Créer un pack
const pack = await prisma.pack.create({
  data: {
    name: 'Pack Solo',
    description: '1 camion + 2 déménageurs',
    price: 600,
    truckSize: 20,
    moversCount: 2,
  },
});

// Récupérer tous les services actifs
const services = await prisma.service.findMany({
  where: { active: true },
});

// Créer une réservation avec un pack
const booking = await prisma.booking.create({
  data: {
    status: 'SCHEDULED',
    scheduledDate: new Date(),
    originAddress: '123 rue de Paris',
    destAddress: '456 avenue de Lyon',
    pack: { connect: { id: packId } },
    customer: { connect: { id: customerId } },
    professional: { connect: { id: professionalId } },
  },
});
```

### Toujours fermer la connexion

```typescript
// Dans une fonction async
try {
  // Opérations Prisma
} finally {
  await prisma.$disconnect();
}
```

## Modèle de réservation

Le système supporte trois types de réservations :

1. **Réservation avec devis personnalisé** : basée sur un calcul complexe
2. **Réservation avec pack** : forfait à prix fixe
3. **Réservation de service uniquement** : services isolés

De plus, chaque réservation peut avoir des services additionnels.

## API REST

Des endpoints REST sont disponibles :

- `/api/packs` - Gestion des packs
- `/api/services` - Gestion des services
- `/api/bookings` - Gestion des réservations

## Services disponibles

Les classes de service suivantes facilitent l'interaction avec la base de données :

- `QuoteService` - Gestion des devis
- `PackService` - Gestion des packs
- `ServiceItemService` - Gestion des services additionnels
- `BookingService` - Gestion des réservations
- `CustomerService` - Gestion des clients
- `ProfessionalService` - Gestion des professionnels

## Résolution des problèmes courants

### Erreurs de type Prisma

Si vous rencontrez des erreurs de type après modification du schéma, exécutez :

```bash
npm run prisma:generate
```

### Erreurs de connexion à la base de données

Vérifiez les variables d'environnement dans `.env` et assurez-vous que l'URL de connexion est correcte. 