import { PrismaClient } from '@prisma/client';

export class PackService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Créer un nouveau pack
  async createPack({
    name,
    description,
    price,
    truckSize,
    moversCount,
    driverIncluded,
  }: {
    name: string;
    description: string;
    price: number;
    truckSize?: number;
    moversCount?: number;
    driverIncluded?: boolean;
  }) {
    return this.prisma.pack.create({
      data: {
        name,
        description,
        price,
        truckSize,
        moversCount,
        driverIncluded: driverIncluded || false,
        active: true,
      },
    });
  }

  // Récupérer un pack par son ID
  async getPackById(id: string) {
    return this.prisma.pack.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });
  }

  // Mettre à jour un pack
  async updatePack(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      truckSize?: number;
      moversCount?: number;
      driverIncluded?: boolean;
      active?: boolean;
    }
  ) {
    return this.prisma.pack.update({
      where: { id },
      data,
    });
  }

  // Récupérer tous les packs
  async getAllPacks() {
    return this.prisma.pack.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
  }

  // Désactiver un pack sans le supprimer
  async deactivatePack(id: string) {
    return this.prisma.pack.update({
      where: { id },
      data: { active: false },
    });
  }

  // Supprimer un pack (utiliser avec précaution)
  async deletePack(id: string) {
    return this.prisma.pack.delete({
      where: { id },
    });
  }

  // Créer une réservation à partir d'un pack
  async createBookingFromPack({
    packId,
    customerId,
    professionalId,
    scheduledDate,
    originAddress,
    destAddress,
  }: {
    packId: string;
    customerId: string;
    professionalId: string;
    scheduledDate: Date;
    originAddress: string;
    destAddress: string;
  }) {
    return this.prisma.booking.create({
      data: {
        status: 'SCHEDULED',
        scheduledDate,
        originAddress,
        destAddress,
        packId,
        customerId,
        professionalId,
      },
      include: {
        pack: true,
        customer: true,
        professional: true,
      },
    });
  }

  // Fermer le client Prisma lors de l'arrêt de l'application
  async disconnect() {
    await this.prisma.$disconnect();
  }
} 