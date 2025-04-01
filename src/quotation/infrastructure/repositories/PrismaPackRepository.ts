import { PrismaClient } from '@prisma/client';
import { IPackRepository } from '../../domain/repositories/IPackRepository';
import { Pack, PackType } from '../../domain/entities/Pack';
import { Money } from '../../domain/valueObjects/Money';
import { Database } from '../config/database';

export class PrismaPackRepository implements IPackRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  async findAll(): Promise<Pack[]> {
    const packs = await this.prisma.pack.findMany();
    return packs.map(pack => this.mapDbToPack(pack));
  }

  async findById(id: string): Promise<Pack | null> {
    const pack = await this.prisma.pack.findUnique({
      where: { id }
    });
    return pack ? this.mapDbToPack(pack) : null;
  }

  /**
   * Trouve un pack par ID de réservation
   */
  async findByBookingId(bookingId: string): Promise<Pack | null> {
    // Rechercher le pack lié à une réservation
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { pack: true }
    });

    if (!booking || !booking.pack) {
      return null;
    }

    return this.mapDbToPack(booking.pack);
  }

  /**
   * Sauvegarde un pack dans la base de données
   */
  async save(pack: Pack): Promise<Pack> {
    try {
      // Récupérer les données du pack
      const bookingId = pack.getBookingId();
      
      // Créer l'objet avec toutes les données requises par Prisma
      const packData: any = {
        id: pack.getId(),
        name: pack.getName(),
        description: pack.getDescription(),
        price: pack.getPrice().getAmount(),
        scheduledDate: new Date(), // Valeur par défaut requise par Prisma
        pickupAddress: "", // Valeur par défaut requise par Prisma
        deliveryAddress: "", // Valeur par défaut requise par Prisma
        includedItems: pack.getIncludedItems(),
        customOptions: JSON.stringify(pack.getCustomOptions()),
      };
      
      // Stratégie de création selon si nous avons un bookingId ou non
      let savedPack;
      
      if (bookingId) {
        // Avec relation explicite au booking
        savedPack = await this.prisma.pack.upsert({
          where: { id: pack.getId() || 'new-pack' },
          update: packData,
          create: {
            ...packData,
            bookingId: bookingId
          }
        });
      } else {
        // Sans relation au booking (pack indépendant)
        savedPack = await this.prisma.pack.upsert({
          where: { id: pack.getId() || 'new-pack' },
          update: packData,
          create: {
            ...packData,
            booking: undefined
          }
        });
      }
      
      return this.mapDbToPack(savedPack);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du pack:', error);
      throw new Error(`Échec de la sauvegarde du pack: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  async update(pack: Pack): Promise<Pack> {
    const data = {
      name: pack.getName(),
      type: pack.getType(),
      description: pack.getDescription(),
      price: pack.getPrice().getAmount(),
      includedItems: pack.getIncludedItems(),
      customOptions: JSON.stringify(pack.getCustomOptions()),
      updatedAt: new Date()
    };

    const updatedPack = await this.prisma.pack.update({
      where: { id: pack.getId() },
      data
    });

    return this.mapDbToPack(updatedPack);
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.pack.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting pack:', error);
      throw new Error(`Failed to delete pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapDbToPack(dbPack: any): Pack {
    // Conversion des options de chaîne JSON à objet JS si nécessaire
    const customOptions = typeof dbPack.customOptions === 'string' 
      ? JSON.parse(dbPack.customOptions) 
      : (dbPack.customOptions || {});
      
    return new Pack(
      dbPack.id,
      dbPack.name,
      dbPack.type as PackType,
      dbPack.description,
      new Money(dbPack.price),
      dbPack.includedItems || [],
      dbPack.bookingId,
      customOptions
    );
  }
} 