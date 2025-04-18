import { Service as PrismaService } from '@prisma/client';
import { Service } from '../../domain/entities/Service';
import { Money } from '../../domain/valueObjects/Money';

export class PrismaServiceAdapter {
  /**
   * Convertit un modèle Prisma Service en entité du domaine Service
   */
  static toDomain(prismaService: PrismaService, serviceBooking?: any): Service {
    return new Service(
      prismaService.id,
      prismaService.name,
      prismaService.description,
      new Money(prismaService.price),
      prismaService.duration,
      prismaService.workers,
      prismaService.includes || [],
      prismaService.features || [],
      prismaService.categoryId || undefined,
      prismaService.imagePath || undefined,
      prismaService.isActive,
      serviceBooking?.bookingId,
      serviceBooking?.scheduledDate,
      serviceBooking?.location,
      serviceBooking?.additionalInfo
    );
  }

  /**
   * Convertit une entité du domaine Service en données compatibles avec Prisma
   */
  static toPrisma(service: Service): any {
    return {
      id: service.getId() || undefined,
      name: service.getName(),
      description: service.getDescription(),
      price: service.getPrice().getAmount(),
      duration: service.getDuration(),
      workers: service.getWorkers(),
      includes: service.getIncludes(),
      features: service.getFeatures(),
      categoryId: service.getCategoryId(),
      imagePath: service.getImagePath(),
      isActive: service.isServiceActive()
    };
  }
  
  /**
   * Convertit une entité du domaine Service en données pour ServiceBooking
   */
  static toServiceBooking(service: Service): any {
    if (!service.getBookingId()) {
      throw new Error('Le service n\'a pas de bookingId associé');
    }
    
    return {
      bookingId: service.getBookingId(),
      scheduledDate: service.getScheduledDate() || new Date(),
      location: service.getLocation() || '',
      additionalInfo: service.getAdditionalInfo()
    };
  }
} 