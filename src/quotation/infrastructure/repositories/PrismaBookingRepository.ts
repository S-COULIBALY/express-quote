import { PrismaClient } from '@prisma/client';
import { IBookingRepository } from '../../domain/repositories/IBookingRepository';
import { Booking, BookingStatus, BookingType } from '../../domain/entities/Booking';
import { Customer } from '../../domain/entities/Customer';
import { Professional } from '../../domain/entities/Professional';
import { Money } from '../../domain/valueObjects/Money';
import { Database } from '../config/database';
import { Quote } from '../../domain/entities/Quote';
import { QuoteType, QuoteStatus } from '../../domain/enums/QuoteType';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { Discount } from '../../domain/valueObjects/Discount';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';

export class PrismaBookingRepository implements IBookingRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Enregistre une réservation en base de données
   */
  async save(booking: Booking): Promise<Booking> {
    try {
      const existingBooking = booking.getId() 
        ? await this.prisma.booking.findUnique({ where: { id: booking.getId() } })
        : null;

      // Convertir les objets complexes en JSON pour la base de données
      const convertToJsonValue = (value: any) => {
        if (value === null || value === undefined) return null;
        return JSON.parse(JSON.stringify(value));
      };

      // Données de base pour la réservation
      const bookingData = {
        type: booking.getType(),
        status: booking.getStatus(),
        customerId: booking.getCustomer().getId(),
        professionalId: booking.getProfessional()?.getId() || null,
        totalAmount: booking.getTotalAmount().getAmount(),
        paymentMethod: (booking as any).paymentMethod || null,
        conversation: convertToJsonValue((booking as any).conversation)
      };

      if (existingBooking) {
        // Mise à jour d'une réservation existante
        await this.prisma.booking.update({
          where: { id: booking.getId() },
          data: bookingData
        });
        return booking;
      } else {
        // Création d'une nouvelle réservation
        const id = booking.getId() || undefined;
        const createdBooking = await this.prisma.booking.create({
          data: {
            ...bookingData,
            id
          },
          include: {
            customer: true,
            professional: true
          }
        });

        // Conversion des données en entités du domaine
        const contactInfo = new ContactInfo(
          createdBooking.customer.firstName,
          createdBooking.customer.lastName,
          createdBooking.customer.email,
          createdBooking.customer.phone || ''
        );
        
        const customer = new Customer(
          createdBooking.customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (createdBooking.professional) {
          professional = this.mapDbToProfessional(createdBooking.professional);
        }

        // Construction de la réservation avec l'ID généré
        return this.mapDbToBooking(createdBooking, customer, professional);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la réservation:', error);
      throw new Error(`Erreur lors de la sauvegarde de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve une réservation par son ID
   */
  async findById(id: string): Promise<Booking | null> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        include: {
          customer: true,
          professional: true
        }
      });

      if (!booking) {
        return null;
      }

      // Conversion des données en entités du domaine
      const contactInfo = new ContactInfo(
        booking.customer.firstName,
        booking.customer.lastName,
        booking.customer.email,
        booking.customer.phone || ''
      );
      
      const customer = new Customer(
        booking.customer.id,
        contactInfo
      );
      
      let professional: Professional | undefined;
      if (booking.professional) {
        professional = this.mapDbToProfessional(booking.professional);
      }

      return this.mapDbToBooking(booking, customer, professional);
    } catch (error) {
      console.error(`Erreur lors de la recherche de la réservation par ID ${id}:`, error);
      throw new Error(`Erreur lors de la recherche de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations par client
   */
  async findByCustomerId(customerId: string): Promise<Booking[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { customerId },
        include: {
          customer: true,
          professional: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(bookings.map(async (booking) => {
        const contactInfo = new ContactInfo(
          booking.customer.firstName,
          booking.customer.lastName,
          booking.customer.email,
          booking.customer.phone || ''
        );
        
        const customer = new Customer(
          booking.customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (booking.professional) {
          professional = this.mapDbToProfessional(booking.professional);
        }

        return this.mapDbToBooking(booking, customer, professional);
      }));
    } catch (error) {
      console.error(`Erreur lors de la recherche des réservations par client ${customerId}:`, error);
      throw new Error(`Erreur lors de la recherche des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations par professionnel
   */
  async findByProfessionalId(professionalId: string): Promise<Booking[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { professionalId },
        include: {
          customer: true,
          professional: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(bookings.map(async (booking) => {
        const contactInfo = new ContactInfo(
          booking.customer.firstName,
          booking.customer.lastName,
          booking.customer.email,
          booking.customer.phone || ''
        );
        
        const customer = new Customer(
          booking.customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (booking.professional) {
          professional = this.mapDbToProfessional(booking.professional);
        }

        return this.mapDbToBooking(booking, customer, professional);
      }));
    } catch (error) {
      console.error(`Erreur lors de la recherche des réservations par professionnel ${professionalId}:`, error);
      throw new Error(`Erreur lors de la recherche des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations par statut
   */
  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: { status },
        include: {
          customer: true,
          professional: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(bookings.map(async (booking) => {
        const contactInfo = new ContactInfo(
          booking.customer.firstName,
          booking.customer.lastName,
          booking.customer.email,
          booking.customer.phone || ''
        );
        
        const customer = new Customer(
          booking.customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (booking.professional) {
          professional = this.mapDbToProfessional(booking.professional);
        }

        return this.mapDbToBooking(booking, customer, professional);
      }));
    } catch (error) {
      console.error(`Erreur lors de la recherche des réservations par statut ${status}:`, error);
      throw new Error(`Erreur lors de la recherche des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Met à jour le statut d'une réservation
   */
  async updateStatus(id: string, status: BookingStatus): Promise<void> {
    try {
      await this.prisma.booking.update({
        where: { id },
        data: { status }
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du statut de la réservation ${id}:`, error);
      throw new Error(`Erreur lors de la mise à jour du statut: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve toutes les réservations
   */
  async findAll(): Promise<Booking[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        include: {
          customer: true,
          professional: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(bookings.map(async (booking) => {
        const contactInfo = new ContactInfo(
          booking.customer.firstName,
          booking.customer.lastName,
          booking.customer.email,
          booking.customer.phone || ''
        );
        
        const customer = new Customer(
          booking.customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (booking.professional) {
          professional = this.mapDbToProfessional(booking.professional);
        }

        return this.mapDbToBooking(booking, customer, professional);
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération de toutes les réservations:', error);
      throw new Error(`Erreur lors de la récupération des réservations: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Convertit un objet professionnel de la base de données en entité du domaine
   */
  private mapDbToProfessional(dbProfessional: any): Professional {
    return new Professional(
      dbProfessional.companyName,
      dbProfessional.businessType,
      dbProfessional.email,
      dbProfessional.phone,
      dbProfessional.address,
      dbProfessional.city,
      dbProfessional.postalCode,
      dbProfessional.country,
      dbProfessional.website,
      dbProfessional.logoUrl,
      dbProfessional.description,
      dbProfessional.taxIdNumber,
      dbProfessional.insuranceNumber,
      dbProfessional.verified,
      dbProfessional.verifiedAt,
      dbProfessional.rating,
      dbProfessional.servicedAreas,
      dbProfessional.specialties,
      dbProfessional.availabilities,
      dbProfessional.id
    );
  }

  /**
   * Convertit un objet booking de la base de données en entité du domaine
   */
  private mapDbToBooking(dbBooking: any, customer: Customer, professional?: Professional): Booking {
    const contactInfo = customer.getContactInfo();
    
    const quoteProps = {
      type: QuoteType.MOVING_QUOTE,
      status: QuoteStatus.DRAFT,
      customer: {
        id: customer.getId(),
        firstName: contactInfo.getFirstName(),
        lastName: contactInfo.getLastName(),
        email: contactInfo.getEmail(),
        phone: contactInfo.getPhone() || ''
      },
      totalAmount: new Money(dbBooking.totalAmount)
    };

    return new Booking(
      dbBooking.type,
      customer,
      new Quote(quoteProps),
      new Money(dbBooking.totalAmount),
      dbBooking.paymentMethod,
      professional,
      dbBooking.id
    );
  }

  /**
   * Met à jour une réservation complète
   */
  async update(booking: Booking): Promise<Booking> {
    try {
      // Convertir les objets complexes en JSON pour la base de données
      const convertToJsonValue = (value: any) => {
        if (value === null || value === undefined) return null;
        return JSON.parse(JSON.stringify(value));
      };

      // Vérifier que la réservation existe
      const existingBooking = await this.prisma.booking.findUnique({
        where: { id: booking.getId() }
      });

      if (!existingBooking) {
        throw new Error(`Réservation non trouvée: ${booking.getId()}`);
      }

      // Données de base pour la réservation
      const bookingData = {
        type: booking.getType(),
        status: booking.getStatus(),
        customerId: booking.getCustomer().getId(),
        professionalId: booking.getProfessional()?.getId() || null,
        totalAmount: booking.getTotalAmount().getAmount(),
        paymentMethod: (booking as any).paymentMethod || null,
        conversation: convertToJsonValue((booking as any).conversation)
      };

      // Mise à jour de la réservation
      await this.prisma.booking.update({
        where: { id: booking.getId() },
        data: bookingData
      });

      return booking;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la réservation ${booking.getId()}:`, error);
      throw new Error(`Erreur lors de la mise à jour de la réservation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }
} 