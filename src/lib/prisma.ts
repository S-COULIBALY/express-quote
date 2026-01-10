import { PrismaClient } from '@prisma/client';

// Déclaration pour TypeScript pour accéder à prisma comme propriété de global
declare global {
  var prisma: PrismaClient | undefined;
}

// Utiliser l'instance existante si disponible (en développement) ou en créer une nouvelle
export const prisma = global.prisma || new PrismaClient({
  // Remove verbose SQL query logs; keep only warnings/errors in dev, errors in prod
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// S'assurer que la connexion est établie
prisma.$connect()
  .then(() => console.log('✅ Prisma: Connexion à la base de données établie'))
  .catch(e => console.error('❌ Prisma: Échec de la connexion à la base de données:', e));

// En développement, sauvegarder l'instance dans le global pour éviter les connexions multiples
if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma;
} 