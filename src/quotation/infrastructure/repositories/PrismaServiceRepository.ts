import { PrismaClient } from '@prisma/client';
import { Service } from '../../domain/entities/Service';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { Database } from '../config/database';

export class PrismaServiceRepository implements IServiceRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  async findAll(): Promise<Service[]> {
    try {
      const services = await this.prisma.service.findMany({
        include: { booking: true }
      });
      return services.map(this.mapDbToService);
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
      throw new Error(`Erreur lors de la récupération des services: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async findById(id: string): Promise<Service | null> {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id },
        include: { booking: true }
      });
      
      if (!service) {
        return null;
      }
      
      return this.mapDbToService(service);
    } catch (error) {
      console.error(`Erreur lors de la recherche du service ${id}:`, error);
      throw new Error(`Erreur lors de la recherche du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async findByBookingId(bookingId: string): Promise<Service | null> {
    try {
      const service = await this.prisma.service.findUnique({
        where: { bookingId },
        include: { booking: true }
      });
      
      if (!service) {
        return null;
      }
      
      return this.mapDbToService(service);
    } catch (error) {
      console.error(`Erreur lors de la recherche du service par bookingId ${bookingId}:`, error);
      throw new Error(`Erreur lors de la recherche du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async save(service: Service): Promise<Service> {
    try {
      const existingService = service.getId() 
        ? await this.prisma.service.findUnique({ where: { id: service.getId() } })
        : null;

      const serviceData = {
        name: service.getName(),
        description: service.getDescription(),
        price: service.getPrice(),
        duration: service.getDuration(),
        includes: service.getIncludes(),
        scheduledDate: service.getScheduledDate(),
        location: service.getLocation(),
        bookingId: service.getBookingId()
      };

      if (existingService) {
        // Mise à jour d'un service existant
        const updatedService = await this.prisma.service.update({
          where: { id: service.getId() },
          data: serviceData,
          include: { booking: true }
        });
        return this.mapDbToService(updatedService);
      } else {
        // Création d'un nouveau service
        const createdService = await this.prisma.service.create({
          data: {
            ...serviceData,
            id: service.getId() || undefined
          },
          include: { booking: true }
        });
        return this.mapDbToService(createdService);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du service:', error);
      throw new Error(`Erreur lors de la sauvegarde du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async update(id: string, service: Service): Promise<Service> {
    try {
      const updatedService = await this.prisma.service.update({
        where: { id },
        data: {
          name: service.getName(),
          description: service.getDescription(),
          price: service.getPrice(),
          duration: service.getDuration(),
          includes: service.getIncludes(),
          scheduledDate: service.getScheduledDate(),
          location: service.getLocation()
        },
        include: { booking: true }
      });
      
      return this.mapDbToService(updatedService);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du service ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.service.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du service ${id}:`, error);
      throw new Error(`Erreur lors de la suppression du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  private mapDbToService(dbService: any): Service {
    return new Service(
      dbService.name,
      dbService.description,
      dbService.price,
      dbService.duration,
      dbService.includes,
      dbService.scheduledDate,
      dbService.location,
      dbService.bookingId,
      dbService.id
    );
  }
} 