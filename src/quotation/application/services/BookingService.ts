import { PrismaClient } from '@prisma/client';
import { ServiceItemService } from './ServiceItemService';

export class BookingService {
  private prisma: PrismaClient;
  private serviceItemService: ServiceItemService;

  constructor() {
    this.prisma = new PrismaClient();
    this.serviceItemService = new ServiceItemService();
  }

  // Créer une nouvelle réservation basée sur un devis
  async createBookingFromQuote({
    quoteId,
    customerId,
    professionalId,
    scheduledDate,
    originAddress,
    destAddress,
  }: {
    quoteId: string;
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
        quoteId,
        customerId,
        professionalId,
      },
      include: {
        quote: true,
        customer: true,
        professional: true,
      },
    });
  }

  // Créer une nouvelle réservation basée sur un pack
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

  // Créer une nouvelle réservation pour un service uniquement
  async createServiceOnlyBooking({
    serviceId,
    customerId,
    professionalId,
    scheduledDate,
    destAddress,
    serviceDate,
  }: {
    serviceId: string;
    customerId: string;
    professionalId: string;
    scheduledDate: Date;
    destAddress: string;
    serviceDate: Date;
  }) {
    // Créer d'abord la réservation
    const booking = await this.prisma.booking.create({
      data: {
        status: 'SCHEDULED',
        scheduledDate,
        destAddress,
        customerId,
        professionalId,
      },
    });

    // Ensuite attacher le service
    await this.serviceItemService.addServiceToBooking({
      bookingId: booking.id,
      serviceId,
      serviceDate,
      address: destAddress,
    });

    // Récupérer la réservation complète avec le service
    return this.prisma.booking.findUnique({
      where: { id: booking.id },
      include: {
        customer: true,
        professional: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Récupérer une réservation par son ID
  async getBookingById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        quote: true,
        pack: true,
        customer: true,
        professional: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Mettre à jour une réservation
  async updateBooking(
    id: string,
    data: {
      status?: string;
      scheduledDate?: Date;
      originAddress?: string;
      destAddress?: string;
      quoteId?: string;
      packId?: string;
      customerId?: string;
      professionalId?: string;
    }
  ) {
    return this.prisma.booking.update({
      where: { id },
      data,
      include: {
        quote: true,
        pack: true,
        customer: true,
        professional: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Récupérer toutes les réservations
  async getAllBookings() {
    return this.prisma.booking.findMany({
      orderBy: { scheduledDate: 'desc' },
      include: {
        quote: true,
        pack: true,
        customer: true,
        professional: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Récupérer les réservations par client
  async getBookingsByCustomer(customerId: string) {
    return this.prisma.booking.findMany({
      where: { customerId },
      orderBy: { scheduledDate: 'desc' },
      include: {
        quote: true,
        pack: true,
        professional: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Récupérer les réservations par professionnel
  async getBookingsByProfessional(professionalId: string) {
    return this.prisma.booking.findMany({
      where: { professionalId },
      orderBy: { scheduledDate: 'desc' },
      include: {
        quote: true,
        pack: true,
        customer: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Récupérer les réservations par date
  async getBookingsByDate(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.booking.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        quote: true,
        pack: true,
        customer: true,
        professional: true,
        services: {
          include: {
            service: true,
          },
        },
      },
    });
  }

  // Annuler une réservation
  async cancelBooking(id: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // Marquer une réservation comme terminée
  async completeBooking(id: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  // Ajouter un service à une réservation existante
  async addServiceToBooking(bookingId: string, serviceId: string, serviceDate: Date, address?: string) {
    return this.serviceItemService.addServiceToBooking({
      bookingId,
      serviceId,
      serviceDate,
      address,
    });
  }

  // Supprimer un service d'une réservation
  async removeServiceFromBooking(bookingId: string, serviceId: string) {
    return this.serviceItemService.removeServiceFromBooking(bookingId, serviceId);
  }

  // Calculer le prix total d'une réservation (devis/pack + services)
  async calculateTotalPrice(bookingId: string): Promise<number> {
    const booking = await this.getBookingById(bookingId);
    
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    let basePrice = 0;
    
    // Prix du devis personnalisé
    if (booking.quote) {
      basePrice = booking.quote.finalPrice;
    } 
    // Prix du pack
    else if (booking.pack) {
      basePrice = booking.pack.price;
    }
    
    // Ajouter le prix des services
    let servicesPrice = 0;
    if (booking.services && booking.services.length > 0) {
      servicesPrice = booking.services.reduce((total, bs) => {
        if (bs.service) {
          return total + bs.service.price;
        }
        return total;
      }, 0);
    }
    
    return basePrice + servicesPrice;
  }

  // Fermer le client Prisma lors de l'arrêt de l'application
  async disconnect() {
    await this.prisma.$disconnect();
    await this.serviceItemService.disconnect();
  }
} 