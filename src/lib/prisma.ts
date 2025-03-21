import { PrismaClient } from '@prisma/client';

// Initialiser une seule instance de Prisma Client et la réutiliser
// pour éviter la création de multiples connexions à la base de données

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // En développement, on garde une référence globale pour éviter 
  // les connexions multiples lors des rechargements à chaud
  if (!(global as any).prisma) {
    (global as any).prisma = new PrismaClient();
  }
  prisma = (global as any).prisma;
}

export { prisma }; 