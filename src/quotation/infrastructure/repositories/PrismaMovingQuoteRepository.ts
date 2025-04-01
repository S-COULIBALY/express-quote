import { PrismaClient, BookingType, BookingStatus } from '@prisma/client';
import { Quote, QuoteStatus } from '../../domain/entities/Quote';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { Address } from '../../domain/valueObjects/Address';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';
import { ServiceType } from '../../domain/enums/ServiceType';

/**
 * Repository pour les devis de déménagement utilisant Prisma
 */
export class PrismaMovingQuoteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Sauvegarde un devis dans la base de données
   */
  async save(quote: Quote): Promise<Quote> {
    try {
      // Transformer l'entité Quote en données Prisma
      const quoteDTO = quote.toDTO();
      const context = quote.getContext();
      
      // Extraire les données du contexte
      const pickupAddress = context.getPickupAddress();
      const deliveryAddress = context.getDeliveryAddress();
      const contactInfo = context.getContactInfo();
      
      // Créer ou mettre à jour l'enregistrement Prisma
      const savedBooking = await this.prisma.booking.upsert({
        where: { id: quoteDTO.id },
        update: {
          type: BookingType.MOVING_QUOTE,
          status: this.mapQuoteStatusToBookingStatus(quoteDTO.status),
          totalAmount: quoteDTO.totalPrice,
          moveDate: context.getPreferredDate(),
          pickupAddress: pickupAddress.getFullAddress(),
          deliveryAddress: deliveryAddress.getFullAddress(),
          distance: context.getDistance(),
          volume: context.getVolume(),
          baseCost: quoteDTO.basePrice,
          optionsCost: quoteDTO.totalPrice - quoteDTO.basePrice,
          packagingOption: context.getOptions().packing,
          furnitureOption: context.getOptions().assembly,
          disassemblyOption: context.getOptions().disassembly,
          fragileOption: context.getOptions().insurance,
          storageOption: context.getOptions().storage,
          quoteSignature: quoteDTO.signature
        },
        create: {
          id: quoteDTO.id,
          type: BookingType.MOVING_QUOTE,
          status: this.mapQuoteStatusToBookingStatus(quoteDTO.status),
          totalAmount: quoteDTO.totalPrice,
          moveDate: context.getPreferredDate(),
          pickupAddress: pickupAddress.getFullAddress(),
          deliveryAddress: deliveryAddress.getFullAddress(),
          distance: context.getDistance(),
          volume: context.getVolume(),
          baseCost: quoteDTO.basePrice,
          optionsCost: quoteDTO.totalPrice - quoteDTO.basePrice,
          packagingOption: context.getOptions().packing,
          furnitureOption: context.getOptions().assembly,
          disassemblyOption: context.getOptions().disassembly,
          fragileOption: context.getOptions().insurance,
          storageOption: context.getOptions().storage,
          quoteSignature: quoteDTO.signature,
          customerId: quoteDTO.customerId || '', // À remplacer par l'ID du client réel
        }
      });
      
      // Reconstruire l'entité Quote à partir des données sauvegardées
      return this.mapPrismaToQuote(savedBooking);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du devis:', error);
      throw new Error(`Échec de la sauvegarde du devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère un devis par son ID
   */
  async findById(id: string): Promise<Quote | null> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { 
          id,
          type: BookingType.MOVING_QUOTE
        }
      });
      
      if (!booking) {
        return null;
      }
      
      return this.mapPrismaToQuote(booking);
    } catch (error) {
      console.error(`Erreur lors de la récupération du devis ${id}:`, error);
      throw new Error(`Échec de la récupération du devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère tous les devis
   */
  async findAll(): Promise<Quote[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { type: BookingType.MOVING_QUOTE },
        orderBy: { createdAt: 'desc' }
      });
      
      return bookings.map(booking => this.mapPrismaToQuote(booking));
    } catch (error) {
      console.error('Erreur lors de la récupération des devis:', error);
      throw new Error(`Échec de la récupération des devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Récupère les devis par statut
   */
  async findByStatus(status: QuoteStatus): Promise<Quote[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { 
          type: BookingType.MOVING_QUOTE,
          status: this.mapQuoteStatusToBookingStatus(status)
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return bookings.map(booking => this.mapPrismaToQuote(booking));
    } catch (error) {
      console.error(`Erreur lors de la récupération des devis avec le statut ${status}:`, error);
      throw new Error(`Échec de la récupération des devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour un devis
   */
  async update(id: string, data: Record<string, any>): Promise<Quote | null> {
    try {
      const existingBooking = await this.prisma.booking.findUnique({
        where: { 
          id,
          type: BookingType.MOVING_QUOTE
        }
      });
      
      if (!existingBooking) {
        return null;
      }
      
      const updatedBooking = await this.prisma.booking.update({
        where: { id },
        data: {
          ...data,
          type: BookingType.MOVING_QUOTE
        }
      });
      
      return this.mapPrismaToQuote(updatedBooking);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du devis ${id}:`, error);
      throw new Error(`Échec de la mise à jour du devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour le statut d'un devis
   */
  async updateStatus(id: string, status: QuoteStatus): Promise<Quote | null> {
    try {
      const existingBooking = await this.prisma.booking.findUnique({
        where: { 
          id,
          type: BookingType.MOVING_QUOTE
        }
      });
      
      if (!existingBooking) {
        return null;
      }
      
      const updatedBooking = await this.prisma.booking.update({
        where: { id },
        data: { 
          status: this.mapQuoteStatusToBookingStatus(status),
          type: BookingType.MOVING_QUOTE
        }
      });
      
      return this.mapPrismaToQuote(updatedBooking);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut du devis ${id}:`, error);
      throw new Error(`Échec de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Supprime un devis
   */
  async delete(id: string): Promise<boolean> {
    try {
      const existingBooking = await this.prisma.booking.findUnique({
        where: { 
          id,
          type: BookingType.MOVING_QUOTE
        }
      });
      
      if (!existingBooking) {
        return false;
      }
      
      await this.prisma.booking.delete({
        where: { id }
      });
      
      return true;
    } catch (error) {
      console.error(`Erreur lors de la suppression du devis ${id}:`, error);
      throw new Error(`Échec de la suppression du devis: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Convertit les données Prisma en entité Quote
   */
  private mapPrismaToQuote(data: any): Quote {
    const pickupAddress = new Address(
      data.pickupAddress,
      '', // city
      '', // postalCode
      'France', // country
      0, // floor
      false, // hasElevator
      0 // carryDistance
    );

    const deliveryAddress = new Address(
      data.deliveryAddress,
      '', // city
      '', // postalCode
      'France', // country
      0, // floor
      false, // hasElevator
      0 // carryDistance
    );

    const contactInfo = new ContactInfo(
      '', // name
      '', // email
      '' // phone
    );

    const context = new QuoteContext({
      serviceType: ServiceType.MOVING,
      volume: data.volume,
      distance: data.distance,
      pickupAddress,
      deliveryAddress,
      contactInfo,
      preferredDate: data.moveDate,
      options: {
        packing: data.packagingOption,
        assembly: data.furnitureOption,
        disassembly: data.disassemblyOption,
        insurance: data.fragileOption,
        storage: data.storageOption
      }
    });

    return new Quote(
      data.baseCost || 0,
      data.totalAmount,
      context,
      data.id
    );
  }

  /**
   * Convertit le statut du devis en statut de réservation
   */
  private mapQuoteStatusToBookingStatus(status: QuoteStatus): BookingStatus {
    switch (status) {
      case QuoteStatus.PENDING:
        return BookingStatus.AWAITING_PAYMENT;
      case QuoteStatus.ACCEPTED:
        return BookingStatus.CONFIRMED;
      case QuoteStatus.REJECTED:
        return BookingStatus.CANCELED;
      case QuoteStatus.EXPIRED:
        return BookingStatus.CANCELED;
      default:
        return BookingStatus.DRAFT;
    }
  }

  /**
   * Convertit le statut de réservation en statut de devis
   */
  private mapBookingStatusToQuoteStatus(status: BookingStatus): QuoteStatus {
    switch (status) {
      case BookingStatus.DRAFT:
        return QuoteStatus.PENDING;
      case BookingStatus.AWAITING_PAYMENT:
        return QuoteStatus.PENDING;
      case BookingStatus.CONFIRMED:
        return QuoteStatus.ACCEPTED;
      case BookingStatus.CANCELED:
        return QuoteStatus.REJECTED;
      default:
        return QuoteStatus.PENDING;
    }
  }
} 