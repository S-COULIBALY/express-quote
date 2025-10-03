/**
 * Service pour gérer les responsables internes (InternalStaff)
 */
import { PrismaClient } from '@prisma/client';
import { logger } from '@/lib/logger';

export interface InternalStaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department?: string;
  serviceTypes: string[];
  isActive: boolean;
  receiveEmail: boolean;
  receiveSMS: boolean;
  receiveWhatsApp: boolean;
  phone?: string;
  workingHours?: any;
}

export class InternalStaffService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Récupère les responsables internes par type de service
   */
  async getStaffByServiceType(serviceType: string): Promise<InternalStaffMember[]> {
    try {
      logger.info(`🔍 Recherche des responsables pour le service: ${serviceType}`);

      const staff = await this.prisma.internalStaff.findMany({
        where: {
          isActive: true,
          receiveEmail: true,
          OR: [
            // Responsables spécifiques au service
            {
              serviceTypes: {
                path: '$',
                array_contains: serviceType
              }
            },
            // Responsables généraux (OPERATIONS_MANAGER, ADMIN)
            {
              role: {
                in: ['OPERATIONS_MANAGER', 'ADMIN']
              }
            }
          ]
        }
      });

      logger.info(`✅ ${staff.length} responsable(s) trouvé(s) pour ${serviceType}`);

      return staff.map(member => ({
        id: member.id,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        role: member.role,
        department: member.department,
        serviceTypes: Array.isArray(member.service_types) ? member.service_types as string[] : [],
        isActive: member.is_active,
        receiveEmail: member.receive_email,
        receiveSMS: member.receive_sms,
        receiveWhatsApp: member.receive_whatsapp,
        phone: member.phone,
        workingHours: member.working_hours
      }));
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération des responsables:', error);
      return [];
    }
  }

  /**
   * Récupère le personnel de comptabilité
   */
  async getAccountingStaff(): Promise<InternalStaffMember[]> {
    try {
      const staff = await this.prisma.internalStaff.findMany({
        where: {
          isActive: true,
          receiveEmail: true,
          role: 'ACCOUNTING'
        }
      });

      return staff.map(member => ({
        id: member.id,
        email: member.email,
        firstName: member.first_name,
        lastName: member.last_name,
        role: member.role,
        department: member.department,
        serviceTypes: Array.isArray(member.service_types) ? member.service_types as string[] : [],
        isActive: member.is_active,
        receiveEmail: member.receive_email,
        receiveSMS: member.receive_sms,
        receiveWhatsApp: member.receive_whatsapp,
        phone: member.phone,
        workingHours: member.working_hours
      }));
    } catch (error) {
      logger.error('❌ Erreur lors de la récupération du personnel comptable:', error);
      return [];
    }
  }

  /**
   * Mappe le type de service vers le type ServiceType pour la recherche
   */
  private mapBookingTypeToServiceType(bookingType: string): string {
    switch (bookingType) {
      case 'MOVING_QUOTE':
      case 'MOVING':
        return 'MOVING';
      case 'PACKING':
        return 'PACKING';
      case 'SERVICE':
        return 'CLEANING';
      case 'TRANSPORT':
        return 'TRANSPORT';
      default:
        return 'MOVING'; // Fallback
    }
  }

  /**
   * Récupère les responsables pour une réservation donnée
   */
  async getStaffForBooking(bookingType: string): Promise<InternalStaffMember[]> {
    const serviceType = this.mapBookingTypeToServiceType(bookingType);
    return await this.getStaffByServiceType(serviceType);
  }

  /**
   * Ferme la connexion Prisma
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}