import { Template } from '../../domain/entities/Template';
import { ITemplateRepository } from '../../domain/repositories/ITemplateRepository';
import { Money } from '../../domain/valueObjects/Money';
import { prisma } from '@/lib/prisma';

export class PrismaTemplateRepository implements ITemplateRepository {
  private readonly prisma = prisma;

  async findAll(): Promise<Template[]> {
    try {
      console.log('🔍 DEBUG: PrismaTemplateRepository.findAll() - Début');
      console.log('🔍 DEBUG: Prisma instance:', !!this.prisma);
      console.log('🔍 DEBUG: Prisma.templates:', !!this.prisma?.templates);

      const results = await this.prisma.templates.findMany({
        where: { is_active: true },
        include: {
          items: true
        },
        orderBy: [
          { popular: 'desc' },
          { created_at: 'desc' }
        ]
      });

      console.log('🔍 DEBUG: Résultats Prisma:', results?.length || 0, 'templates trouvés');
      console.log('🔍 DEBUG: Premier template:', results?.[0] ? {
        id: results[0].id,
        name: results[0].name,
        type: results[0].type
      } : 'Aucun');

      const mappedResults = results.map(result => this.mapToEntity(result));
      console.log('🔍 DEBUG: Templates mappés:', mappedResults?.length || 0);

      return mappedResults;
    } catch (error) {
      console.error('❌ ERROR dans PrismaTemplateRepository.findAll():', error);
      console.error('❌ ERROR STACK:', (error as Error).stack);
      throw error;
    }
  }

  async findById(id: string): Promise<Template | null> {
    const result = await this.prisma.templates.findUnique({
      where: { id },
      include: {
        items: true
      }
    });

    return result ? this.mapToEntity(result) : null;
  }

  async findByServiceType(serviceType: string): Promise<Template[]> {
    // Mapping du serviceType vers ItemType
    const itemType = this.mapServiceTypeToItemType(serviceType);
    
      const results = await this.prisma.templates.findMany({
        where: { 
          type: itemType,
          is_active: true 
        },
      include: {
        items: true
      },
        orderBy: [
          { popular: 'desc' },
          { created_at: 'desc' }
        ]
    });

    return results.map(result => this.mapToEntity(result));
  }

  async save(template: Template): Promise<Template> {
    const data = {
      id: template.getId(),
      type: this.mapServiceTypeToItemType(template.getServiceType()),
      name: template.getName(),
      description: template.getDescription(),
      price: template.getBasePrice().getAmount(),
      workers: template.getWorkers(),
      duration: template.getDuration(),
      features: [], // À étendre si nécessaire
      included_distance: null,
      distance_unit: 'km',
      includes: [],
      category_id: null,
      popular: false,
      image_path: null,
      is_active: true,
      updated_at: new Date(),
    };

    const result = await this.prisma.templates.upsert({
      where: { id: template.getId() },
      create: data,
      update: data,
      include: {
        items: true
      }
    });

    return this.mapToEntity(result);
  }

  async update(id: string, template: Template): Promise<Template> {
    const updateData = {
      type: this.mapServiceTypeToItemType(template.getServiceType()),
      name: template.getName(),
      description: template.getDescription(),
      price: template.getBasePrice().getAmount(),
      workers: template.getWorkers(),
      duration: template.getDuration(),
      is_active: true,
      updated_at: new Date(),
    };

    const result = await this.prisma.templates.update({
      where: { id },
      data: updateData,
      include: {
        items: true
      }
    });

    return this.mapToEntity(result);
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Suppression logique
      await this.prisma.templates.update({
        where: { id },
        data: { is_active: false }
      });
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du template:', error);
      return false;
    }
  }

  async findWithItems(id: string): Promise<Template | null> {
    const result = await this.prisma.templates.findUnique({
      where: { id },
      include: {
        items: {
          where: { is_active: true }
        }
      }
    });

    return result ? this.mapToEntity(result) : null;
  }

  private mapToEntity(data: any): Template {
    return new Template(
      data.id,
      data.name,
      data.description || '',
      this.mapItemTypeToServiceType(data.type),
      new Money(data.price),
      data.duration,
      data.workers,
      data.created_at,
      data.updated_at
    );
  }

  private mapServiceTypeToItemType(serviceType: string): any {
    // Mapping du serviceType string vers ItemType enum
    switch (serviceType.toLowerCase()) {
      case 'moving':
      case 'demenagement':
        return 'DEMENAGEMENT';
      case 'cleaning':
      case 'menage':
        return 'MENAGE';
      case 'transport':
        return 'TRANSPORT';
      case 'delivery':
      case 'livraison':
        return 'LIVRAISON';
      default:
        return 'DEMENAGEMENT';
    }
  }

  private mapItemTypeToServiceType(itemType: string): string {
    // Mapping inverse : ItemType enum vers serviceType string
    switch (itemType) {
      case 'DEMENAGEMENT':
        return 'MOVING';
      case 'MENAGE':
        return 'CLEANING';
      case 'TRANSPORT':
        return 'TRANSPORT';
      case 'LIVRAISON':
        return 'DELIVERY';
      default:
        return 'MOVING';
    }
  }
} 