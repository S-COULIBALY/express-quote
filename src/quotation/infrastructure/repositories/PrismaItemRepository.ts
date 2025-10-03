import { prisma } from '@/lib/prisma';
import { Item } from '../../domain/entities/Item';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { Money } from '../../domain/valueObjects/Money';

export class PrismaItemRepository implements IItemRepository {
  constructor(private readonly prismaClient = prisma) {}

  async save(item: Item): Promise<Item> {
    const data = {
      id: item.getId(),
      type: item.getType(),
      templateId: item.getTemplateId(),
      customerId: item.getCustomerId(),
      bookingId: item.getBookingId(),
      parentItemId: item.getParentItemId(),
      name: item.getName(),
      description: item.getDescription(),
      price: item.getPrice().getAmount(),
      workers: item.getWorkers(),
      duration: item.getDuration(),
      features: item.getFeatures(),
      includedDistance: item.getIncludedDistance(),
      distanceUnit: item.getDistanceUnit(),
      includes: item.getIncludes(),
      categoryId: item.getCategoryId(),
      popular: item.isPopular(),
      imagePath: item.getImagePath(),
      isActive: item.isActive(),
      status: item.getStatus(),
    };

    const result = await this.prismaClient.item.upsert({
      where: { id: item.getId() },
      create: data,
      update: data,
      include: {
        template: true,
        customer: true,
        booking: true,
        catalogSelections: true,
      }
    });

    return this.mapToEntity(result);
  }

  async findById(id: string): Promise<Item | null> {
    const result = await this.prismaClient.item.findUnique({
      where: { id },
      include: {
        template: true,
        customer: true,
        booking: true,
        catalogSelections: true,
      }
    });

    return result ? this.mapToEntity(result) : null;
  }

  async findByBookingId(bookingId: string): Promise<Item[]> {
    const results = await this.prismaClient.item.findMany({
      where: { bookingId },
      include: {
        template: true,
        customer: true,
        booking: true,
        catalogSelections: true,
      }
    });

    return results.map(result => this.mapToEntity(result));
  }

  async findByCustomerId(customerId: string): Promise<Item[]> {
    const results = await this.prismaClient.item.findMany({
      where: { customerId },
      include: {
        template: true,
        customer: true,
        booking: true,
        catalogSelections: true,
      }
    });

    return results.map(result => this.mapToEntity(result));
  }

  async findByTemplateId(templateId: string): Promise<Item[]> {
    const results = await this.prismaClient.item.findMany({
      where: { templateId },
      include: {
        template: true,
        customer: true,
        booking: true,
        catalogSelections: true,
      }
    });

    return results.map(result => this.mapToEntity(result));
  }

  async findActive(): Promise<Item[]> {
    const results = await this.prismaClient.item.findMany({
      where: { isActive: true },
      include: {
        template: true,
        customer: true,
        booking: true,
        catalogSelections: true,
      }
    });

    return results.map(result => this.mapToEntity(result));
  }

  async update(id: string, itemData: Partial<Item>): Promise<Item> {
    const updateData: any = {};

    // Map only the fields that exist in the partial update
    if (itemData instanceof Item) {
      updateData.type = itemData.getType();
      updateData.templateId = itemData.getTemplateId();
      updateData.customerId = itemData.getCustomerId();
      updateData.bookingId = itemData.getBookingId();
      updateData.parentItemId = itemData.getParentItemId();
      updateData.name = itemData.getName();
      updateData.description = itemData.getDescription();
      updateData.price = itemData.getPrice().getAmount();
      updateData.workers = itemData.getWorkers();
      updateData.duration = itemData.getDuration();
      updateData.features = itemData.getFeatures();
      updateData.includedDistance = itemData.getIncludedDistance();
      updateData.distanceUnit = itemData.getDistanceUnit();
      updateData.includes = itemData.getIncludes();
      updateData.categoryId = itemData.getCategoryId();
      updateData.popular = itemData.isPopular();
      updateData.imagePath = itemData.getImagePath();
      updateData.isActive = itemData.isActive();
      updateData.status = itemData.getStatus();
    }

    const result = await this.prismaClient.item.update({
      where: { id },
      data: updateData,
      include: {
        template: true,
        customer: true,
        booking: true,
        catalogSelections: true,
      }
    });

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prismaClient.item.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'item:', error);
      return false;
    }
  }

  async findAll(): Promise<Item[]> {
    const results = await this.prismaClient.item.findMany({
      include: {
        template: true,
        customer: true,
        booking: true,
        catalogSelections: true,
      }
    });

    return results.map(result => this.mapToEntity(result));
  }

  private mapToEntity(data: any): Item {
    return new Item(
      data.id,
      data.type,
      data.templateId,
      data.customerId,
      data.bookingId,
      data.parentItemId,
      data.name,
      data.description,
      new Money(data.price),
      data.workers,
      data.duration,
      data.features || [],
      data.includedDistance,
      data.distanceUnit,
      data.includes || [],
      data.categoryId,
      data.popular,
      data.imagePath,
      data.isActive,
      data.status,
      data.createdAt,
      data.updatedAt
    );
  }
} 