import { PrismaClient } from '@prisma/client';

export class ServiceItemService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Créer un nouveau service
  async createService({
    name,
    description,
    price,
    serviceType,
    durationDays,
    peopleCount,
  }: {
    name: string;
    description: string;
    price: number;
    serviceType: string;
    durationDays?: number;
    peopleCount?: number;
  }) {
    return this.prisma.service.create({
      data: {
        name,
        description,
        price,
        serviceType,
        durationDays,
        peopleCount,
        active: true,
      },
    });
  }

  // Récupérer un service par son ID
  async getServiceById(id: string) {
    return this.prisma.service.findUnique({
      where: { id },
      include: {
        bookingServices: {
          include: {
            booking: true,
          },
        },
      },
    });
  }

  // Mettre à jour un service
  async updateService(
    id: string,
    data: {
      name?: string;
      description?: string;
      price?: number;
      serviceType?: string;
      durationDays?: number;
      peopleCount?: number;
      active?: boolean;
    }
  ) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  // Récupérer tous les services actifs
  async getAllServices() {
    return this.prisma.service.findMany({
      where: { active: true },
      orderBy: { price: 'asc' },
    });
  }

  // Récupérer les services par type
  async getServicesByType(serviceType: string) {
    return this.prisma.service.findMany({
      where: { 
        serviceType,
        active: true,
      },
      orderBy: { price: 'asc' },
    });
  }

  // Désactiver un service sans le supprimer
  async deactivateService(id: string) {
    return this.prisma.service.update({
      where: { id },
      data: { active: false },
    });
  }

  // Supprimer un service (utiliser avec précaution)
  async deleteService(id: string) {
    return this.prisma.service.delete({
      where: { id },
    });
  }

  // Ajouter un service à une réservation
  async addServiceToBooking({
    bookingId,
    serviceId,
    serviceDate,
    address,
  }: {
    bookingId: string;
    serviceId: string;
    serviceDate: Date;
    address?: string;
  }) {
    return this.prisma.bookingService.create({
      data: {
        bookingId,
        serviceId,
        serviceDate,
        address,
      },
      include: {
        booking: true,
        service: true,
      },
    });
  }

  // Supprimer un service d'une réservation
  async removeServiceFromBooking(bookingId: string, serviceId: string) {
    // Trouver l'entrée existante dans bookingService
    const bookingService = await this.prisma.bookingService.findFirst({
      where: {
        bookingId,
        serviceId,
      },
    });

    if (!bookingService) {
      throw new Error('Service not found in this booking');
    }

    // Supprimer l'entrée
    return this.prisma.bookingService.delete({
      where: {
        id: bookingService.id,
      },
    });
  }

  // Mettre à jour les détails d'un service sur une réservation
  async updateBookingService(
    bookingId: string,
    serviceId: string,
    data: {
      serviceDate?: Date;
      address?: string;
    }
  ) {
    // Trouver l'entrée existante dans bookingService
    const bookingService = await this.prisma.bookingService.findFirst({
      where: {
        bookingId,
        serviceId,
      },
    });

    if (!bookingService) {
      throw new Error('Service not found in this booking');
    }

    // Mettre à jour l'entrée
    return this.prisma.bookingService.update({
      where: {
        id: bookingService.id,
      },
      data,
      include: {
        booking: true,
        service: true,
      },
    });
  }

  // Fermer le client Prisma lors de l'arrêt de l'application
  async disconnect() {
    await this.prisma.$disconnect();
  }
} 