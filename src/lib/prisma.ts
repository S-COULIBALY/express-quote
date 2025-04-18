import { PrismaClient } from '@prisma/client';

// Déclaration pour TypeScript pour accéder à prisma comme propriété de global
declare global {
  var prisma: PrismaClient | undefined;
}

// Utiliser l'instance existante si disponible (en développement) ou en créer une nouvelle
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Conserver l'instance en développement pour éviter de multiples instances pendant le hot-reloading
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 