import { PrismaClient } from '@prisma/client';

export class QuoteService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Créer un nouveau devis
  async createQuote({
    serviceType,
    volume,
    distance,
    basePrice,
    finalPrice,
  }: {
    serviceType: string;
    volume?: number;
    distance?: number;
    basePrice: number;
    finalPrice: number;
  }) {
    return this.prisma.quote.create({
      data: {
        status: 'DRAFT',
        serviceType,
        volume,
        distance,
        basePrice,
        finalPrice,
      },
    });
  }

  // Récupérer un devis par son ID
  async getQuoteById(id: string) {
    return this.prisma.quote.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            customer: true,
            professional: true,
          },
        },
      },
    });
  }

  // Mettre à jour un devis
  async updateQuote(
    id: string,
    data: {
      status?: string;
      serviceType?: string;
      volume?: number;
      distance?: number;
      basePrice?: number;
      finalPrice?: number;
    }
  ) {
    return this.prisma.quote.update({
      where: { id },
      data,
    });
  }

  // Récupérer tous les devis
  async getAllQuotes() {
    return this.prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Supprimer un devis
  async deleteQuote(id: string) {
    return this.prisma.quote.delete({
      where: { id },
    });
  }

  // Créer une réservation à partir d'un devis
  async createBooking({
    quoteId,
    customerId,
    professionalId,
    scheduledDate,
  }: {
    quoteId: string;
    customerId: string;
    professionalId: string;
    scheduledDate: Date;
  }) {
    return this.prisma.booking.create({
      data: {
        status: 'SCHEDULED',
        scheduledDate,
        quoteId,
        customerId,
        professionalId,
      },
    });
  }

  // Fermer le client Prisma lors de l'arrêt de l'application
  async disconnect() {
    await this.prisma.$disconnect();
  }
} 