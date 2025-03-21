import { PrismaClient } from '@prisma/client';

export class ProfessionalService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Créer un nouveau professionnel
  async createProfessional({
    email,
    firstName,
    lastName,
    phone,
    serviceType,
  }: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    serviceType: string;
  }) {
    return this.prisma.professional.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        serviceType,
      },
    });
  }

  // Récupérer un professionnel par son ID
  async getProfessionalById(id: string) {
    return this.prisma.professional.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });
  }

  // Récupérer un professionnel par son email
  async getProfessionalByEmail(email: string) {
    return this.prisma.professional.findUnique({
      where: { email },
      include: {
        bookings: true,
      },
    });
  }

  // Mettre à jour un professionnel
  async updateProfessional(
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      serviceType?: string;
    }
  ) {
    return this.prisma.professional.update({
      where: { id },
      data,
    });
  }

  // Récupérer tous les professionnels
  async getAllProfessionals() {
    return this.prisma.professional.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Récupérer les professionnels par type de service
  async getProfessionalsByServiceType(serviceType: string) {
    return this.prisma.professional.findMany({
      where: { serviceType },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Supprimer un professionnel
  async deleteProfessional(id: string) {
    return this.prisma.professional.delete({
      where: { id },
    });
  }

  // Rechercher des professionnels
  async searchProfessionals(searchTerm: string) {
    return this.prisma.professional.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { serviceType: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Fermer le client Prisma lors de l'arrêt de l'application
  async disconnect() {
    await this.prisma.$disconnect();
  }
} 