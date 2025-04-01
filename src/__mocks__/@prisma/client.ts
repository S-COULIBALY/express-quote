/**
 * Mock du client Prisma pour les tests
 */

export class PrismaClient {
  constructor() {
    return {
      customer: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      booking: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      moving: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      pack: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      service: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
  }
}

const mockPrisma = {
  PrismaClient
};

export default mockPrisma; 