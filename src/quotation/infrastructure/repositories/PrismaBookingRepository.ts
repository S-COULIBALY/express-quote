import { PrismaClient } from '@prisma/client';
import { IBookingRepository, BookingSearchResult } from '../../domain/repositories/IBookingRepository';
import { Booking, BookingStatus, BookingType } from '../../domain/entities/Booking';
import { Customer } from '../../domain/entities/Customer';
import { Professional } from '../../domain/entities/Professional';
import { Money } from '../../domain/valueObjects/Money';
import { Database } from '../config/database';
import { Quote } from '../../domain/entities/Quote';
import { QuoteType, QuoteStatus } from '../../domain/enums/QuoteType';
import { QuoteContext } from '../../domain/valueObjects/QuoteContext';
import { ContactInfo } from '../../domain/valueObjects/ContactInfo';
import { BookingSearchCriteriaVO } from '../../domain/valueObjects/BookingSearchCriteria';

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
        updatedAt: new Date(),
        quoteRequestId: (booking as any).quoteRequestId || null,
        additionalInfo: (booking as any).additionalInfo ? convertToJsonValue((booking as any).additionalInfo) : undefined
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
        const bookingId = booking.getId() || crypto.randomUUID();

        const createdBooking = await this.prisma.booking.create({
          data: {
            ...bookingData,
            id: bookingId
          },
          include: {
            Customer: true,
            Professional: true
          }
        });

        // Conversion des données en entités du domaine
        // Utiliser une valeur par défaut si le téléphone est manquant
        const phone = createdBooking.Customer.phone && createdBooking.Customer.phone.trim() !== '' 
          ? createdBooking.Customer.phone 
          : '+33600000000'; // Valeur par défaut pour les clients sans téléphone
        
        const contactInfo = new ContactInfo(
          createdBooking.Customer.firstName,
          createdBooking.Customer.lastName,
          createdBooking.Customer.email,
          phone
        );

        const customer = new Customer(
          createdBooking.Customer.id,
          contactInfo
        );

        let professional: Professional | undefined;
        if (createdBooking.Professional) {
          professional = this.mapDbToProfessional(createdBooking.Professional);
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
          Customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          Professional: {
            select: {
              id: true,
              companyName: true,
              businessType: true,
              email: true,
              phone: true,
              address: true,
              city: true,
              postalCode: true,
              country: true,
              website: true,
              logoUrl: true,
              description: true,
              taxIdNumber: true,
              insuranceNumber: true,
              verified: true,
              verifiedAt: true,
              rating: true,
              servicedAreas: true,
              specialties: true,
              availabilities: true
            }
          },
          QuoteRequest: {
            select: {
              id: true,
              temporaryId: true,
              type: true,
              status: true,
              quoteData: true,
              createdAt: true,
              expiresAt: true
            }
          }
        }
      });

      if (!booking) {
        return null;
      }

      // Conversion des données en entités du domaine
      // Utiliser une valeur par défaut si le téléphone est manquant
      const phone = booking.Customer.phone && booking.Customer.phone.trim() !== '' 
        ? booking.Customer.phone 
        : '+33600000000'; // Valeur par défaut pour les clients sans téléphone
      
      const contactInfo = new ContactInfo(
        booking.Customer.firstName,
        booking.Customer.lastName,
        booking.Customer.email,
        phone
      );
      
      const customer = new Customer(
        booking.Customer.id,
        contactInfo
      );
      
      let professional: Professional | undefined;
      if (booking.Professional) {
        professional = this.mapDbToProfessional(booking.Professional);
      }

      const bookingEntity = this.mapDbToBooking(booking, customer, professional);
      
      // Stocker les données du QuoteRequest dans l'entité pour accès ultérieur
      if (booking.QuoteRequest) {
        (bookingEntity as any).quoteRequestData = booking.QuoteRequest;
      }
      
      return bookingEntity;
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
          Customer: true,
          Professional: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(bookings.map(async (booking) => {
        // Utiliser une valeur par défaut si le téléphone est manquant
        const phone = booking.Customer.phone && booking.Customer.phone.trim() !== '' 
          ? booking.Customer.phone 
          : '+33600000000'; // Valeur par défaut pour les clients sans téléphone
        
        const contactInfo = new ContactInfo(
          booking.Customer.firstName,
          booking.Customer.lastName,
          booking.Customer.email,
          phone
        );
        
        const customer = new Customer(
          booking.Customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (booking.Professional) {
          professional = this.mapDbToProfessional(booking.Professional);
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
          Customer: true,
          Professional: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(bookings.map(async (booking) => {
        // Utiliser une valeur par défaut si le téléphone est manquant
        const phone = booking.Customer.phone && booking.Customer.phone.trim() !== '' 
          ? booking.Customer.phone 
          : '+33600000000'; // Valeur par défaut pour les clients sans téléphone
        
        const contactInfo = new ContactInfo(
          booking.Customer.firstName,
          booking.Customer.lastName,
          booking.Customer.email,
          phone
        );
        
        const customer = new Customer(
          booking.Customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (booking.Professional) {
          professional = this.mapDbToProfessional(booking.Professional);
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
          Customer: true,
          Professional: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(bookings.map(async (booking) => {
        // Utiliser une valeur par défaut si le téléphone est manquant
        const phone = booking.Customer.phone && booking.Customer.phone.trim() !== '' 
          ? booking.Customer.phone 
          : '+33600000000'; // Valeur par défaut pour les clients sans téléphone
        
        const contactInfo = new ContactInfo(
          booking.Customer.firstName,
          booking.Customer.lastName,
          booking.Customer.email,
          phone
        );
        
        const customer = new Customer(
          booking.Customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (booking.Professional) {
          professional = this.mapDbToProfessional(booking.Professional);
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
          Customer: true,
          Professional: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return Promise.all(bookings.map(async (booking) => {
        // Utiliser une valeur par défaut si le téléphone est manquant
        const phone = booking.Customer.phone && booking.Customer.phone.trim() !== '' 
          ? booking.Customer.phone 
          : '+33600000000'; // Valeur par défaut pour les clients sans téléphone
        
        const contactInfo = new ContactInfo(
          booking.Customer.firstName,
          booking.Customer.lastName,
          booking.Customer.email,
          phone
        );
        
        const customer = new Customer(
          booking.Customer.id,
          contactInfo
        );
        
        let professional: Professional | undefined;
        if (booking.Professional) {
          professional = this.mapDbToProfessional(booking.Professional);
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

    const bookingEntity = new Booking(
      dbBooking.type,
      customer,
      new Quote(quoteProps),
      new Money(dbBooking.totalAmount),
      dbBooking.paymentMethod,
      professional,
      dbBooking.id
    );

    // Hydrater les propriétés persistées (statut, timestamps, acompte, scheduledDate) sans déclencher de transitions métier
    const bookingAsAny = bookingEntity as any;
    if (dbBooking.status) {
      bookingAsAny.status = dbBooking.status;
    }
    if (dbBooking.createdAt) {
      bookingAsAny.createdAt = new Date(dbBooking.createdAt);
    }
    if (dbBooking.updatedAt) {
      bookingAsAny.updatedAt = new Date(dbBooking.updatedAt);
    }
    if (dbBooking.scheduledDate) {
      bookingAsAny.scheduledDate = new Date(dbBooking.scheduledDate);
    }
    if (typeof dbBooking.depositAmount === 'number') {
      bookingAsAny.depositAmount = new Money(dbBooking.depositAmount);
    }

    return bookingEntity;
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
        updatedAt: new Date(),
        quoteRequestId: (booking as any).quoteRequestId || null
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

  // =====================================
  // NOUVELLES MÉTHODES POUR L'EXTENSION
  // =====================================

  /**
   * Recherche des réservations selon des critères
   */
  async search(criteria: BookingSearchCriteriaVO): Promise<BookingSearchResult> {
    try {
      // Construction des filtres Prisma
      const where: any = {};
      
      if (criteria.customerId) {
        where.customerId = criteria.customerId;
      }
      
      if (criteria.professionalId) {
        where.professionalId = criteria.professionalId;
      }
      
      if (criteria.status) {
        where.status = criteria.status;
      }
      
      if (criteria.type) {
        where.type = criteria.type;
      }
      
      if (criteria.dateFrom || criteria.dateTo) {
        where.createdAt = {};
        if (criteria.dateFrom) {
          where.createdAt.gte = criteria.dateFrom;
        }
        if (criteria.dateTo) {
          where.createdAt.lte = criteria.dateTo;
        }
      }
      
      if (criteria.scheduledDateFrom || criteria.scheduledDateTo) {
        where.scheduledDate = {};
        if (criteria.scheduledDateFrom) {
          where.scheduledDate.gte = criteria.scheduledDateFrom;
        }
        if (criteria.scheduledDateTo) {
          where.scheduledDate.lte = criteria.scheduledDateTo;
        }
      }
      
      if (criteria.minAmount || criteria.maxAmount) {
        where.totalAmount = {};
        if (criteria.minAmount) {
          where.totalAmount.gte = criteria.minAmount;
        }
        if (criteria.maxAmount) {
          where.totalAmount.lte = criteria.maxAmount;
        }
      }
      
      if (criteria.paymentMethod) {
        where.paymentMethod = criteria.paymentMethod;
      }
      
      if (criteria.locationSearch) {
        where.locationAddress = {
          contains: criteria.locationSearch,
          mode: 'insensitive'
        };
      }

      // Construction du tri
      const orderBy: any = {};
      orderBy[criteria.sortBy] = criteria.sortOrder;

      // Exécution de la requête avec pagination
      const [bookings, totalCount] = await Promise.all([
        this.prisma.booking.findMany({
          where,
          orderBy,
          skip: criteria.offset,
          take: criteria.limit,
          include: {
            Customer: true,
            Professional: true,
            Moving: true,
            QuoteRequest: {
              select: {
                id: true,
                quoteData: true
              }
            }
          }
        }),
        this.prisma.booking.count({ where })
      ]);

      // Conversion des résultats Prisma en entités domaine
      const domainBookings = await Promise.all(
        bookings.map(async (booking) => await this.convertPrismaToBooking(booking))
      );

      return {
        bookings: domainBookings,
        totalCount,
        hasMore: criteria.offset + criteria.limit < totalCount,
        offset: criteria.offset,
        limit: criteria.limit
      };
    } catch (error) {
      console.error('Erreur lors de la recherche de réservations:', error);
      throw new Error(`Erreur lors de la recherche: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations dans une plage de dates de création
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          Customer: true,
          Professional: true,
          Moving: true
        }
      });

      return await Promise.all(
        bookings.map(async (booking) => await this.convertPrismaToBooking(booking))
      );
    } catch (error) {
      console.error('Erreur lors de la recherche par date:', error);
      throw new Error(`Erreur lors de la recherche par date: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations dans une plage de dates programmées
   */
  async findByScheduledDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: {
          scheduledDate: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          Customer: true,
          Professional: true,
          Moving: true
        }
      });

      return await Promise.all(
        bookings.map(async (booking) => await this.convertPrismaToBooking(booking))
      );
    } catch (error) {
      console.error('Erreur lors de la recherche par date programmée:', error);
      throw new Error(`Erreur lors de la recherche par date programmée: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations dans une plage de montants
   */
  async findByAmountRange(minAmount: number, maxAmount: number): Promise<Booking[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: {
          totalAmount: {
            gte: minAmount,
            lte: maxAmount
          }
        },
        include: {
          Customer: true,
          Professional: true,
          Moving: true
        }
      });

      return await Promise.all(
        bookings.map(async (booking) => await this.convertPrismaToBooking(booking))
      );
    } catch (error) {
      console.error('Erreur lors de la recherche par montant:', error);
      throw new Error(`Erreur lors de la recherche par montant: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Trouve les réservations par recherche de localisation
   */
  async findByLocationSearch(locationQuery: string): Promise<Booking[]> {
    try {
      const bookings = await this.prisma.booking.findMany({
        where: {
          locationAddress: {
            contains: locationQuery,
            mode: 'insensitive'
          }
        },
        include: {
          Customer: true,
          Professional: true,
          Moving: true
        }
      });

      return await Promise.all(
        bookings.map(async (booking) => await this.convertPrismaToBooking(booking))
      );
    } catch (error) {
      console.error('Erreur lors de la recherche par localisation:', error);
      throw new Error(`Erreur lors de la recherche par localisation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Compte le nombre de réservations selon des critères
   */
  async count(criteria?: BookingSearchCriteriaVO): Promise<number> {
    try {
      if (!criteria) {
        return await this.prisma.booking.count();
      }

      // Construction des filtres similaires à la méthode search
      const where: any = {};
      
      if (criteria.customerId) where.customerId = criteria.customerId;
      if (criteria.professionalId) where.professionalId = criteria.professionalId;
      if (criteria.status) where.status = criteria.status;
      if (criteria.type) where.type = criteria.type;
      if (criteria.paymentMethod) where.paymentMethod = criteria.paymentMethod;
      
      if (criteria.dateFrom || criteria.dateTo) {
        where.createdAt = {};
        if (criteria.dateFrom) where.createdAt.gte = criteria.dateFrom;
        if (criteria.dateTo) where.createdAt.lte = criteria.dateTo;
      }
      
      if (criteria.minAmount || criteria.maxAmount) {
        where.totalAmount = {};
        if (criteria.minAmount) where.totalAmount.gte = criteria.minAmount;
        if (criteria.maxAmount) where.totalAmount.lte = criteria.maxAmount;
      }

      return await this.prisma.booking.count({ where });
    } catch (error) {
      console.error('Erreur lors du comptage:', error);
      throw new Error(`Erreur lors du comptage: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Suppression douce (marque comme supprimé)
   */
  async softDelete(id: string): Promise<void> {
    try {
      await this.prisma.booking.update({
        where: { id },
        data: { 
          status: BookingStatus.CANCELED,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression douce ${id}:`, error);
      throw new Error(`Erreur lors de la suppression douce: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Suppression physique
   */
  async hardDelete(id: string): Promise<void> {
    try {
      await this.prisma.booking.delete({
        where: { id }
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression physique ${id}:`, error);
      throw new Error(`Erreur lors de la suppression physique: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Annule une réservation
   */
  async cancel(id: string, reason?: string): Promise<void> {
    try {
      await this.prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.CANCELED,
          updatedAt: new Date(),
          // Stocker la raison dans additionalInfo si elle existe
          additionalInfo: reason ? { cancellationReason: reason } : undefined
        }
      });
    } catch (error) {
      console.error(`Erreur lors de l'annulation ${id}:`, error);
      throw new Error(`Erreur lors de l'annulation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Restaure une réservation supprimée
   */
  async restore(id: string): Promise<void> {
    try {
      await this.prisma.booking.update({
        where: { id },
        data: {
          status: BookingStatus.DRAFT,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error(`Erreur lors de la restauration ${id}:`, error);
      throw new Error(`Erreur lors de la restauration: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Vérifie si une réservation existe
   */
  async exists(id: string): Promise<boolean> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { id: true }
      });
      return !!booking;
    } catch (error) {
      console.error(`Erreur lors de la vérification d'existence ${id}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si une réservation appartient à un client
   */
  async isOwnedByCustomer(id: string, customerId: string): Promise<boolean> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { customerId: true }
      });
      return booking?.customerId === customerId;
    } catch (error) {
      console.error(`Erreur lors de la vérification propriétaire client ${id}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si une réservation appartient à un professionnel
   */
  async isOwnedByProfessional(id: string, professionalId: string): Promise<boolean> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { professionalId: true }
      });
      return booking?.professionalId === professionalId;
    } catch (error) {
      console.error(`Erreur lors de la vérification propriétaire professionnel ${id}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si une réservation peut être modifiée
   */
  async canBeModified(id: string): Promise<boolean> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { status: true }
      });
      
      const nonModifiableStatuses = [
        BookingStatus.CANCELED,
        BookingStatus.COMPLETED,
        BookingStatus.PAYMENT_PROCESSING
      ];
      
      return booking ? !nonModifiableStatuses.includes(booking.status as BookingStatus) : false;
    } catch (error) {
      console.error(`Erreur lors de la vérification modification ${id}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si une réservation peut être annulée
   */
  async canBeCancelled(id: string): Promise<boolean> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { status: true }
      });
      
      const nonCancellableStatuses = [
        BookingStatus.CANCELED,
        BookingStatus.COMPLETED
      ];
      
      return booking ? !nonCancellableStatuses.includes(booking.status as BookingStatus) : false;
    } catch (error) {
      console.error(`Erreur lors de la vérification annulation ${id}:`, error);
      return false;
    }
  }

  /**
   * Vérifie si une réservation peut être supprimée
   */
  async canBeDeleted(id: string): Promise<boolean> {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { id },
        select: { status: true }
      });
      
      const nonDeletableStatuses = [
        BookingStatus.PAYMENT_COMPLETED,
        BookingStatus.COMPLETED,
        BookingStatus.PAYMENT_PROCESSING
      ];
      
      return booking ? !nonDeletableStatuses.includes(booking.status as BookingStatus) : false;
    } catch (error) {
      console.error(`Erreur lors de la vérification suppression ${id}:`, error);
      return false;
    }
  }

  /**
   * Obtient les statistiques d'un client
   */
  async getBookingStatsByCustomer(customerId: string): Promise<{
    total: number;
    byStatus: Record<BookingStatus, number>;
    totalAmount: number;
  }> {
    try {
      const [total, byStatus, totalAmount] = await Promise.all([
        this.prisma.booking.count({ where: { customerId } }),
        this.prisma.booking.groupBy({
          by: ['status'],
          where: { customerId },
          _count: { status: true }
        }),
        this.prisma.booking.aggregate({
          where: { customerId },
          _sum: { totalAmount: true }
        })
      ]);

      const statusStats = {} as Record<BookingStatus, number>;
      byStatus.forEach(stat => {
        statusStats[stat.status as BookingStatus] = stat._count.status;
      });

      return {
        total,
        byStatus: statusStats,
        totalAmount: totalAmount._sum.totalAmount || 0
      };
    } catch (error) {
      console.error(`Erreur lors des statistiques client ${customerId}:`, error);
      throw new Error(`Erreur lors des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Obtient les statistiques d'un professionnel
   */
  async getBookingStatsByProfessional(professionalId: string): Promise<{
    total: number;
    byStatus: Record<BookingStatus, number>;
    totalAmount: number;
  }> {
    try {
      const [total, byStatus, totalAmount] = await Promise.all([
        this.prisma.booking.count({ where: { professionalId } }),
        this.prisma.booking.groupBy({
          by: ['status'],
          where: { professionalId },
          _count: { status: true }
        }),
        this.prisma.booking.aggregate({
          where: { professionalId },
          _sum: { totalAmount: true }
        })
      ]);

      const statusStats = {} as Record<BookingStatus, number>;
      byStatus.forEach(stat => {
        statusStats[stat.status as BookingStatus] = stat._count.status;
      });

      return {
        total,
        byStatus: statusStats,
        totalAmount: totalAmount._sum.totalAmount || 0
      };
    } catch (error) {
      console.error(`Erreur lors des statistiques professionnel ${professionalId}:`, error);
      throw new Error(`Erreur lors des statistiques: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   * Méthode utilitaire pour convertir les données Prisma en entité Booking
   */
  private async convertPrismaToBooking(prismaBooking: any): Promise<Booking> {
    // Conversion des données Prisma en entité Booking
    // Utilise les noms de relations avec majuscules (Customer, Professional, Moving)
    
    // Utiliser une valeur par défaut si le téléphone est manquant
    const phone = prismaBooking.Customer?.phone && prismaBooking.Customer.phone.trim() !== '' 
      ? prismaBooking.Customer.phone 
      : '+33600000000'; // Valeur par défaut pour les clients sans téléphone
    
    const customer = new Customer(
      prismaBooking.customerId || prismaBooking.Customer?.id || 'temp-' + Date.now(),
      new ContactInfo(
        prismaBooking.Customer?.firstName || '',
        prismaBooking.Customer?.lastName || '',
        prismaBooking.Customer?.email || '',
        phone
      )
    );
    
    const professional = prismaBooking.Professional ? new Professional(
      prismaBooking.Professional.companyName,
      prismaBooking.Professional.businessType,
      prismaBooking.Professional.email,
      prismaBooking.Professional.phone,
      prismaBooking.Professional.address,
      prismaBooking.Professional.city,
      prismaBooking.Professional.postalCode,
      prismaBooking.Professional.country,
      prismaBooking.Professional.website,
      prismaBooking.Professional.logoUrl,
      prismaBooking.Professional.description,
      prismaBooking.Professional.taxIdNumber,
      prismaBooking.Professional.insuranceNumber,
      prismaBooking.Professional.verified,
      prismaBooking.Professional.verifiedAt,
      prismaBooking.Professional.rating,
      prismaBooking.Professional.servicedAreas,
      prismaBooking.Professional.specialties,
      prismaBooking.Professional.availabilities,
      prismaBooking.Professional.id
    ) : undefined;
    
    const quote = new Quote({
      type: QuoteType.MOVING_QUOTE,
      status: QuoteStatus.CONFIRMED,
      customer: {
        id: customer.getId(),
        firstName: prismaBooking.Customer?.firstName || '',
        lastName: prismaBooking.Customer?.lastName || '',
        email: prismaBooking.Customer?.email || '',
        phone: prismaBooking.Customer?.phone || ''
      },
      totalAmount: new Money(prismaBooking.totalAmount || 0, 'EUR')
    });
    
    const booking = new Booking(
      prismaBooking.type,
      customer,
      quote,
      new Money(prismaBooking.totalAmount || 0, 'EUR'),
      prismaBooking.paymentMethod,
      professional,
      prismaBooking.id
    );
    
    // Hydrater les propriétés persistées
    const bookingAsAny = booking as any;
    if (prismaBooking.status) {
      bookingAsAny.status = prismaBooking.status;
    }
    if (prismaBooking.createdAt) {
      bookingAsAny.createdAt = new Date(prismaBooking.createdAt);
    }
    if (prismaBooking.updatedAt) {
      bookingAsAny.updatedAt = new Date(prismaBooking.updatedAt);
    }
    
    // Récupérer scheduledDate depuis la table Booking ou depuis quoteData
    let scheduledDate = prismaBooking.scheduledDate;
    if (!scheduledDate && prismaBooking.QuoteRequest?.quoteData) {
      const quoteData = prismaBooking.QuoteRequest.quoteData as any;
      scheduledDate = quoteData.scheduledDate || quoteData.serviceDate || quoteData.moveDate;
    }
    if (scheduledDate) {
      bookingAsAny.scheduledDate = new Date(scheduledDate);
    }
    
    if (typeof prismaBooking.depositAmount === 'number') {
      bookingAsAny.depositAmount = new Money(prismaBooking.depositAmount, 'EUR');
    }
    
    // Stocker les données du QuoteRequest pour accès ultérieur
    if (prismaBooking.QuoteRequest) {
      bookingAsAny.quoteRequestData = prismaBooking.QuoteRequest;
    }
    
    // Stocker additionalInfo pour accès ultérieur
    if (prismaBooking.additionalInfo) {
      bookingAsAny.additionalInfo = prismaBooking.additionalInfo;
    }
    
    return booking;
  }
} 