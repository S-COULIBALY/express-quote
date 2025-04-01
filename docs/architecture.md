# Architecture de l'Application

## Vue d'ensemble

L'application suit une architecture hexagonale (ou en oignon) avec une séparation claire des responsabilités. Le flux de données suit le schéma suivant :

```
Frontend <-> API <-> DTOs <-> Assembler <-> Domain Entities <-> Repository <-> Database
```

## Flux de Données

### Frontend vers Database (Création/Modification)

1. **Frontend → API**
```typescript
// Frontend envoie des données brutes
fetch('/api/quotes', {
  method: 'POST',
  body: JSON.stringify({
    type: 'MOVING',
    totalAmount: 1000,
    // ... autres données
  })
})
```

2. **API → DTOs**
```typescript
// API reçoit et valide les données
const quoteDTO: QuoteDTO = {
  type: request.body.type,
  totalAmount: request.body.totalAmount,
  // ... validation et transformation
}
```

3. **DTOs → Assembler → Domain Entities**
```typescript
// Assembler convertit le DTO en entité du domaine
const quote = QuoteAssembler.toEntity(quoteDTO);
// quote est maintenant une entité du domaine avec des méthodes et de la logique métier
```

4. **Domain Entities → Database**
```typescript
// Le repository convertit l'entité en format de base de données
class PrismaQuoteRepository {
  async save(quote: Quote) {
    // Conversion de l'entité en format Prisma
    const prismaData = {
      type: quote.type,
      totalAmount: quote.totalAmount.getAmount(),
      // ... autres conversions
    }
    return prisma.quote.create({ data: prismaData });
  }
}
```

### Database vers Frontend (Lecture)

1. **Database → Domain Entities**
```typescript
// Le repository convertit les données de la base en entité
class PrismaQuoteRepository {
  async findById(id: string): Promise<Quote> {
    const data = await prisma.quote.findUnique({ where: { id } });
    // Conversion des données brutes en entité
    return new Quote({
      type: data.type,
      totalAmount: new Money(data.totalAmount),
      // ... autres conversions
    });
  }
}
```

2. **Domain Entities → Assembler → DTOs**
```typescript
// Assembler convertit l'entité en DTO
const quoteDTO = QuoteAssembler.toDTO(quote);
// Le DTO est un objet simple sans logique métier
```

3. **DTOs → API → Frontend**
```typescript
// API renvoie le DTO
res.json(quoteDTO);
// Frontend reçoit des données simples
```

## Rôles des Composants

### Assembler
- Fait partie de la couche "application"
- Sert de pont entre le domaine et les DTOs
- Convertit les entités du domaine en DTOs et vice versa
- Gère la transformation des types complexes (ex: Money) en types simples

### Repository
- Cache les détails de la persistance
- Gère la conversion entre le format de la base de données et les entités du domaine
- Fournit une interface cohérente pour accéder aux données

### DTOs (Data Transfer Objects)
- Objets simples sans logique métier
- Optimisés pour le transfert de données
- Contiennent uniquement les données nécessaires

### Domain Entities
- Contiennent la logique métier
- Utilisent des objets de valeur (ex: Money)
- Sont indépendantes de la persistance

## Avantages de l'Architecture

1. **Séparation des Responsabilités**
   - Chaque couche a un rôle précis
   - Les modifications dans une couche n'affectent pas les autres

2. **Indépendance de la Base de Données**
   - Le domaine est isolé des détails de persistance
   - Facilite le changement de base de données

3. **Testabilité**
   - Les composants peuvent être testés isolément
   - Facilite les tests unitaires et d'intégration

4. **Maintenance**
   - Code plus organisé et plus facile à comprendre
   - Modifications localisées et contrôlées

## Exemple de Structure de Fichiers

```
src/
├── application/
│   ├── assemblers/
│   │   └── QuoteAssembler.ts
│   └── dtos/
│       └── QuoteDTO.ts
├── domain/
│   ├── entities/
│   │   └── Quote.ts
│   └── valueObjects/
│       └── Money.ts
├── infrastructure/
│   └── repositories/
│       └── PrismaQuoteRepository.ts
└── api/
    └── routes/
        └── quotes.ts
``` 