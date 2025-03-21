import { PrismaClient } from '@prisma/client';

export class CustomerService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Créer un nouveau client
  async createCustomer({
    email,
    firstName,
    lastName,
    phone,
  }: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) {
    return this.prisma.customer.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
      },
    });
  }

  // Récupérer un client par son ID
  async getCustomerById(id: string) {
    return this.prisma.customer.findUnique({
      where: { id },
      include: {
        bookings: true,
      },
    });
  }

  // Récupérer un client par son email
  async getCustomerByEmail(email: string) {
    return this.prisma.customer.findUnique({
      where: { email },
      include: {
        bookings: true,
      },
    });
  }

  // Mettre à jour un client
  async updateCustomer(
    id: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    }
  ) {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  // Récupérer tous les clients
  async getAllCustomers() {
    return this.prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Supprimer un client
  async deleteCustomer(id: string) {
    return this.prisma.customer.delete({
      where: { id },
    });
  }

  // Rechercher des clients
  async searchCustomers(searchTerm: string) {
    return this.prisma.customer.findMany({
      where: {
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
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