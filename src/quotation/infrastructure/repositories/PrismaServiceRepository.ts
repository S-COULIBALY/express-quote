import { PrismaClient } from '@prisma/client';
import { Service } from '../../domain/entities/Service';
import { IServiceRepository } from '../../domain/repositories/IServiceRepository';
import { Database } from '../config/database';
import { Money } from '../../domain/valueObjects/Money';

export class PrismaServiceRepository implements IServiceRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Méthodes liées au catalogue de services
   */

  // Récupérer tous les services du catalogue (actifs uniquement)
  async findAll(): Promise<Service[]> {
    try {
      const services = await this.prisma.service.findMany({
        where: { isActive: true }
      });
      return services.map(service => this.mapToDomainService(service));
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
      throw new Error(`Erreur lors de la récupération des services: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Récupérer un service du catalogue par son ID
  async findById(id: string): Promise<Service | null> {
    try {
      const service = await this.prisma.service.findUnique({
        where: { id }
      });
      
      if (!service) {
        return null;
      }
      
      return this.mapToDomainService(service);
    } catch (error) {
      console.error(`Erreur lors de la recherche du service ${id}:`, error);
      throw new Error(`Erreur lors de la recherche du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Récupérer les services par catégorie
  async findByCategory(categoryId: string): Promise<Service[]> {
    try {
      const services = await this.prisma.service.findMany({
        where: { 
          categoryId,
          isActive: true 
        }
      });
      return services.map(service => this.mapToDomainService(service));
    } catch (error) {
      console.error(`Erreur lors de la récupération des services par catégorie ${categoryId}:`, error);
      throw new Error(`Erreur lors de la récupération des services: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Ajouter ou mettre à jour un service dans le catalogue
  async save(service: Service): Promise<Service> {
    try {
      // Créer ou mettre à jour le service dans le catalogue
      const savedService = await this.prisma.service.upsert({
        where: { 
          id: service.getId() || 'temp-id' 
        },
        update: {
          name: service.getName(),
          description: service.getDescription(),
          price: service.getPrice().getAmount(),
          duration: service.getDuration(),
          workers: service.getWorkers(),
          includes: service.getIncludes(),
          features: service.getFeatures ? service.getFeatures() : [],
          categoryId: service.getCategoryId?.() || null,
          imagePath: service.getImagePath?.() || null,
          isActive: true
        },
        create: {
          id: service.getId() || undefined,
          name: service.getName(),
          description: service.getDescription(),
          price: service.getPrice().getAmount(),
          duration: service.getDuration(),
          workers: service.getWorkers(),
          includes: service.getIncludes(),
          features: service.getFeatures ? service.getFeatures() : [],
          categoryId: service.getCategoryId?.() || null,
          imagePath: service.getImagePath?.() || null,
          isActive: true
        }
      });
      
      return this.mapToDomainService(savedService);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du service:', error);
      throw new Error(`Erreur lors de la sauvegarde du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Mettre à jour un service existant dans le catalogue
  async update(id: string, service: Service): Promise<Service> {
    try {
      // Mettre à jour le service dans le catalogue
      const updatedService = await this.prisma.service.update({
        where: { id },
        data: {
          name: service.getName(),
          description: service.getDescription(),
          price: service.getPrice().getAmount(),
          duration: service.getDuration(),
          workers: service.getWorkers(),
          includes: service.getIncludes(),
          features: service.getFeatures ? service.getFeatures() : [],
          categoryId: service.getCategoryId?.() || null,
          imagePath: service.getImagePath?.() || null,
          isActive: true
        }
      });
      
      return this.mapToDomainService(updatedService);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du service ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Supprimer (désactiver) un service du catalogue
  async delete(id: string): Promise<boolean> {
    try {
      // Désactiver le service (suppression logique)
      await this.prisma.service.update({
        where: { id },
        data: { isActive: false }
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du service ${id}:`, error);
      throw new Error(`Erreur lors de la suppression du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      return false;
    }
  }

  /**
   * Méthodes liées aux réservations de services
   */

  // Récupérer un service à partir d'une réservation
  async findByBookingId(bookingId: string): Promise<Service | null> {
    try {
      const serviceBooking = await this.prisma.serviceBooking.findUnique({
        where: { bookingId },
        include: { service: true }
      });
      
      if (!serviceBooking || !serviceBooking.service) {
        return null;
      }
      
      return this.mapToDomainServiceWithBooking(serviceBooking.service, serviceBooking);
    } catch (error) {
      console.error(`Erreur lors de la recherche du service par bookingId ${bookingId}:`, error);
      throw new Error(`Erreur lors de la recherche du service: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Créer ou mettre à jour une réservation de service
  async saveServiceBooking(service: Service): Promise<Service> {
    try {
      const bookingId = service.getBookingId();
      
      if (!bookingId) {
        throw new Error('Impossible de sauvegarder une réservation sans ID de booking');
      }

      const serviceId = service.getId();
      
      if (!serviceId) {
        throw new Error('Impossible de sauvegarder une réservation sans ID de service');
      }

      // Vérifier si le service existe
      const serviceExists = await this.prisma.service.findUnique({
        where: { id: serviceId }
      });

      if (!serviceExists) {
        throw new Error('Le service demandé n\'existe pas dans le catalogue');
      }

      // Vérifier si une relation ServiceBooking existe déjà
      const existingServiceBooking = await this.prisma.serviceBooking.findUnique({
        where: { bookingId }
      });
      
      if (existingServiceBooking) {
        // Mettre à jour la relation existante
        await this.prisma.serviceBooking.update({
          where: { bookingId },
          data: {
            serviceId: serviceId,
            scheduledDate: service.getScheduledDate() || new Date(),
            location: service.getLocation() || '',
            additionalInfo: service.getAdditionalInfo() || null
          }
        });
      } else {
        // Créer une nouvelle relation
        await this.prisma.serviceBooking.create({
          data: {
            bookingId,
            serviceId: serviceId,
            scheduledDate: service.getScheduledDate() || new Date(),
            location: service.getLocation() || '',
            additionalInfo: service.getAdditionalInfo() || null
          }
        });
      }
      
      // Récupérer le service avec les données de réservation
      return this.findByBookingId(bookingId) || service;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la réservation de service:', error);
      throw new Error(`Erreur lors de la sauvegarde de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Annuler une réservation de service
  async cancelServiceBooking(bookingId: string): Promise<boolean> {
    try {
      // Récupérer la réservation
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { serviceBooking: true }
      });

      if (!booking) {
        throw new Error('Réservation non trouvée');
      }

      // Mettre à jour le statut de la réservation
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELED' }
      });

      return true;
    } catch (error) {
      console.error(`Erreur lors de l'annulation de la réservation de service ${bookingId}:`, error);
      throw new Error(`Erreur lors de l'annulation de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Méthodes utilitaires de mapping
   */
  
  // Convertir un service Prisma en domaine Service (sans réservation)
  private mapToDomainService(dbService: any): Service {
    return new Service(
      dbService.id,
      dbService.name,
      dbService.description,
      new Money(dbService.price),
      dbService.duration,
      dbService.workers,
      dbService.includes || []
    );
  }
  
  // Convertir un service Prisma en domaine Service avec données de réservation
  private mapToDomainServiceWithBooking(dbService: any, serviceBooking: any): Service {
    return new Service(
      dbService.id,
      dbService.name,
      dbService.description,
      new Money(dbService.price),
      dbService.duration,
      dbService.workers,
      dbService.includes || [],
      serviceBooking.bookingId,
      serviceBooking.scheduledDate,
      serviceBooking.location,
      serviceBooking.additionalInfo
    );
  }
} 