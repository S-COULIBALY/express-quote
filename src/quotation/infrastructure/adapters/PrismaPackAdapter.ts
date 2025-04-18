import { Pack as PrismaPack } from '@prisma/client';
import { Pack } from '../../domain/entities/Pack';
import { Money } from '../../domain/valueObjects/Money';

export class PrismaPackAdapter {
  /**
   * Convertit un modèle Prisma Pack en entité du domaine Pack
   */
  static toDomain(prismaPack: PrismaPack, packBooking?: any): Pack {
    return new Pack(
      prismaPack.id,
      prismaPack.name,
      prismaPack.description,
      new Money(prismaPack.price),
      prismaPack.duration,
      prismaPack.workers,
      prismaPack.includes || [],
      prismaPack.features || [],
      prismaPack.categoryId || undefined,
      prismaPack.content || undefined,
      prismaPack.imagePath || undefined,
      prismaPack.includedDistance,
      prismaPack.distanceUnit,
      prismaPack.workersNeeded,
      prismaPack.isAvailable,
      prismaPack.popular,
      packBooking?.bookingId,
      packBooking?.scheduledDate,
      packBooking?.pickupAddress,
      packBooking?.deliveryAddress,
      packBooking?.distance,
      packBooking?.additionalInfo
    );
  }

  /**
   * Convertit une entité du domaine Pack en données compatibles avec Prisma
   */
  static toPrisma(pack: Pack): any {
    return {
      id: pack.getId() || undefined,
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
  }
  
  /**
   * Convertit une entité du domaine Pack en données pour PackBooking
   */
  static toPackBooking(pack: Pack): any {
    if (!pack.getBookingId()) {
      throw new Error('Le pack n\'a pas de bookingId associé');
    }
    
    return {
      bookingId: pack.getBookingId(),
      scheduledDate: pack.getScheduledDate() || new Date(),
      pickupAddress: pack.getPickupAddress() || '',
      deliveryAddress: pack.getDeliveryAddress() || '',
      distance: pack.getDistance() || 0,
      additionalInfo: pack.getAdditionalInfo()
    };
  }
} 