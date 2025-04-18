import { PrismaClient } from '@prisma/client';
import { Pack } from '../../domain/entities/Pack';
import { IPackRepository } from '../../domain/repositories/IPackRepository';
import { Database } from '../config/database';
import { Money } from '../../domain/valueObjects/Money';

export class PrismaPackRepository implements IPackRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Méthodes liées au catalogue de packs
   */

  // Récupérer tous les packs disponibles
  async findAll(): Promise<Pack[]> {
    try {
      const packs = await this.prisma.pack.findMany({
        where: { isAvailable: true }
      });
      return packs.map(pack => this.mapToDomainPack(pack));
    } catch (error) {
      console.error('Erreur lors de la récupération des packs:', error);
      throw new Error(`Erreur lors de la récupération des packs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Récupérer un pack par ID
  async findById(id: string): Promise<Pack | null> {
    try {
      const pack = await this.prisma.pack.findUnique({
        where: { id }
      });
      
      if (!pack) {
        return null;
      }
      
      return this.mapToDomainPack(pack);
    } catch (error) {
      console.error(`Erreur lors de la recherche du pack ${id}:`, error);
      throw new Error(`Erreur lors de la recherche du pack: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Récupérer les packs populaires
  async findPopular(): Promise<Pack[]> {
    try {
      const packs = await this.prisma.pack.findMany({
        where: { 
          isAvailable: true,
          popular: true
        }
      });
      return packs.map(pack => this.mapToDomainPack(pack));
    } catch (error) {
      console.error('Erreur lors de la récupération des packs populaires:', error);
      throw new Error(`Erreur lors de la récupération des packs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Récupérer les packs par catégorie
  async findByCategory(categoryId: string): Promise<Pack[]> {
    try {
      const packs = await this.prisma.pack.findMany({
        where: { 
          categoryId,
          isAvailable: true 
        }
      });
      return packs.map(pack => this.mapToDomainPack(pack));
    } catch (error) {
      console.error(`Erreur lors de la récupération des packs par catégorie ${categoryId}:`, error);
      throw new Error(`Erreur lors de la récupération des packs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Ajouter ou mettre à jour un pack dans le catalogue
  async save(pack: Pack): Promise<Pack> {
    try {
      // Préparer les données du pack pour Prisma
      const packData = {
        name: pack.getName(),
        description: pack.getDescription(),
        price: pack.getPrice().getAmount(),
        duration: pack.getDuration(),
        workers: pack.getWorkers(),
        includes: pack.getIncludes(),
        features: pack.getFeatures(),
        categoryId: pack.getCategoryId(),
        content: pack.getContent(),
        imagePath: pack.getImagePath(),
        includedDistance: pack.getIncludedDistance(),
        distanceUnit: pack.getDistanceUnit(),
        workersNeeded: pack.getWorkersNeeded(),
        isAvailable: pack.isPackAvailable(),
        popular: pack.isPopular()
      };

      // Créer ou mettre à jour le pack
      const savedPack = await this.prisma.pack.upsert({
        where: { 
          id: pack.getId() || 'temp-id' 
        },
        update: packData,
        create: {
          ...packData,
          id: pack.getId()
        }
      });
      
      return this.mapToDomainPack(savedPack);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du pack:', error);
      throw new Error(`Erreur lors de la sauvegarde du pack: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Mettre à jour un pack existant
  async update(id: string, pack: Pack): Promise<Pack> {
    try {
      // Mettre à jour le pack
      const updatedPack = await this.prisma.pack.update({
        where: { id },
        data: {
          name: pack.getName(),
          description: pack.getDescription(),
          price: pack.getPrice().getAmount(),
          duration: pack.getDuration(),
          workers: pack.getWorkers(),
          includes: pack.getIncludes(),
          features: pack.getFeatures(),
          categoryId: pack.getCategoryId(),
          content: pack.getContent(),
          imagePath: pack.getImagePath(),
          includedDistance: pack.getIncludedDistance(),
          distanceUnit: pack.getDistanceUnit(),
          workersNeeded: pack.getWorkersNeeded(),
          isAvailable: pack.isPackAvailable(),
          popular: pack.isPopular()
        }
      });
      
      return this.mapToDomainPack(updatedPack);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du pack ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour du pack: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Supprimer (désactiver) un pack
  async delete(id: string): Promise<boolean> {
    try {
      // Désactiver le pack (suppression logique)
      await this.prisma.pack.update({
        where: { id },
        data: { isAvailable: false }
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du pack ${id}:`, error);
      throw new Error(`Erreur lors de la suppression du pack: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Méthodes liées aux réservations de packs
   */

  // Récupérer un pack associé à une réservation
  async findByBookingId(bookingId: string): Promise<Pack | null> {
    try {
      const packBooking = await this.prisma.packBooking.findUnique({
        where: { bookingId },
        include: { pack: true }
      });
      
      if (!packBooking || !packBooking.pack) {
        return null;
      }
      
      return this.mapToDomainPackWithBooking(packBooking.pack, packBooking);
    } catch (error) {
      console.error(`Erreur lors de la recherche du pack par bookingId ${bookingId}:`, error);
      throw new Error(`Erreur lors de la recherche du pack: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Créer ou mettre à jour une réservation de pack
  async savePackBooking(pack: Pack): Promise<Pack> {
    try {
      const bookingId = pack.getBookingId();
      
      if (!bookingId) {
        throw new Error('Impossible de sauvegarder une réservation sans ID de booking');
      }

      const packId = pack.getId();
      
      if (!packId) {
        throw new Error('Impossible de sauvegarder une réservation sans ID de pack');
      }

      // Vérifier si le pack existe
      const packExists = await this.prisma.pack.findUnique({
        where: { id: packId }
      });

      if (!packExists) {
        throw new Error('Le pack demandé n\'existe pas dans le catalogue');
      }

      // Vérifier si une relation PackBooking existe déjà
      const existingPackBooking = await this.prisma.packBooking.findUnique({
        where: { bookingId }
      });
      
      if (existingPackBooking) {
        // Mettre à jour la relation existante
        await this.prisma.packBooking.update({
          where: { bookingId },
          data: {
            packId: packId,
            scheduledDate: pack.getScheduledDate() || new Date(),
            pickupAddress: pack.getPickupAddress() || '',
            deliveryAddress: pack.getDeliveryAddress() || '',
            distance: pack.getDistance() || 0,
            additionalInfo: pack.getAdditionalInfo()
          }
        });
      } else {
        // Créer une nouvelle relation
        await this.prisma.packBooking.create({
          data: {
            bookingId,
            packId: packId,
            scheduledDate: pack.getScheduledDate() || new Date(),
            pickupAddress: pack.getPickupAddress() || '',
            deliveryAddress: pack.getDeliveryAddress() || '',
            distance: pack.getDistance() || 0,
            additionalInfo: pack.getAdditionalInfo()
          }
        });
      }
      
      // Récupérer le pack avec les données de réservation
      return this.findByBookingId(bookingId) || pack;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la réservation de pack:', error);
      throw new Error(`Erreur lors de la sauvegarde de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Annuler une réservation de pack
  async cancelPackBooking(bookingId: string): Promise<boolean> {
    try {
      // Récupérer la réservation
      const booking = await this.prisma.booking.findUnique({
        where: { id: bookingId },
        include: { packBooking: true }
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
      console.error(`Erreur lors de l'annulation de la réservation de pack ${bookingId}:`, error);
      throw new Error(`Erreur lors de l'annulation de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Méthodes utilitaires de mapping
   */
  
  // Convertir un pack Prisma en domaine Pack (sans réservation)
  private mapToDomainPack(dbPack: any): Pack {
    return new Pack(
      dbPack.id,
      dbPack.name,
      dbPack.description,
      new Money(dbPack.price),
      dbPack.duration,
      dbPack.workers,
      dbPack.includes || [],
      dbPack.features || [],
      dbPack.categoryId,
      dbPack.content,
      dbPack.imagePath,
      dbPack.includedDistance,
      dbPack.distanceUnit,
      dbPack.workersNeeded,
      dbPack.isAvailable,
      dbPack.popular
    );
  }
  
  // Convertir un pack Prisma en domaine Pack avec données de réservation
  private mapToDomainPackWithBooking(dbPack: any, packBooking: any): Pack {
    return new Pack(
      dbPack.id,
      dbPack.name,
      dbPack.description,
      new Money(dbPack.price),
      dbPack.duration,
      dbPack.workers,
      dbPack.includes || [],
      dbPack.features || [],
      dbPack.categoryId,
      dbPack.content,
      dbPack.imagePath,
      dbPack.includedDistance,
      dbPack.distanceUnit,
      dbPack.workersNeeded,
      dbPack.isAvailable,
      dbPack.popular,
      packBooking.bookingId,
      packBooking.scheduledDate,
      packBooking.pickupAddress,
      packBooking.deliveryAddress,
      packBooking.distance,
      packBooking.additionalInfo
    );
  }
} 