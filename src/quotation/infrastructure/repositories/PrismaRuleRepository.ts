import { PrismaClient } from '@prisma/client';
import { IRuleRepository } from '../../domain/interfaces/IRuleRepository';
import { IRule } from '../../domain/interfaces/IRule';
import { Database } from '../config/database';

/**
 * Repository pour l'accès aux règles via Prisma
 */
export class PrismaRuleRepository implements IRuleRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = Database.getClient();
  }

  /**
   * Récupère toutes les règles
   */
  async findAll(): Promise<IRule[]> {
    try {
      const rules = await this.prisma.rule.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return rules.map(rule => ({
        id: Number(rule.id),
        name: rule.name,
        description: rule.description || '',
        type: rule.type,
        value: rule.value,
        isActive: rule.isActive,
      }));
    } catch (error) {
      console.error('Error finding all rules:', error);
      throw new Error(`Failed to find rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Récupère une règle par son ID
   */
  async findById(id: number): Promise<IRule | null> {
    try {
      const rule = await this.prisma.rule.findUnique({
        where: { id: id.toString() }
      });

      if (!rule) {
        return null;
      }

      return {
        id: Number(rule.id),
        name: rule.name,
        description: rule.description || '',
        type: rule.type,
        value: rule.value,
        isActive: rule.isActive,
      };
    } catch (error) {
      console.error('Error finding rule by id:', error);
      throw new Error(`Failed to find rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Récupère les règles pour un type de service spécifique
   */
  async findByType(type: string): Promise<IRule[]> {
    try {
      const rules = await this.prisma.rule.findMany({
        where: { type },
        orderBy: { createdAt: 'desc' },
      });

      return rules.map(rule => ({
        id: Number(rule.id),
        name: rule.name,
        description: rule.description || '',
        type: rule.type,
        value: rule.value,
        isActive: rule.isActive,
      }));
    } catch (error) {
      console.error('Error finding rules by type:', error);
      throw new Error(`Failed to find rules by type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sauvegarde une règle
   */
  async save(rule: IRule): Promise<void> {
    try {
      await this.prisma.rule.create({
        data: {
          name: rule.name,
          description: rule.description,
          type: rule.type,
          value: rule.value,
          isActive: rule.isActive,
        }
      });
    } catch (error) {
      console.error('Error saving rule:', error);
      throw new Error(`Failed to save rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sauvegarde un ensemble de règles pour un type de service
   */
  async saveRules(serviceType: string, rules: IRule[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Supprimer les règles existantes pour ce type de service
        await tx.rule.deleteMany({
          where: {
            type: serviceType
          }
        });

        // Créer les nouvelles règles
        for (const rule of rules) {
          await tx.rule.create({
            data: {
              name: rule.name,
              description: rule.description,
              type: rule.type,
              value: rule.value,
              isActive: rule.isActive,
            }
          });
        }
      });
    } catch (error) {
      console.error(`Error saving rules for ${serviceType}:`, error);
      throw new Error(`Failed to save rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Supprime une règle
   */
  async delete(id: number): Promise<void> {
    try {
      await this.prisma.rule.delete({
        where: { id: id.toString() }
      });
    } catch (error) {
      console.error('Error deleting rule:', error);
      throw new Error(`Failed to delete rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByActivityType(activityType: string): Promise<IRule[]> {
    try {
      const rules = await this.prisma.rule.findMany({
        where: { type: activityType },
        orderBy: { createdAt: 'desc' }
      });

      return rules.map(rule => ({
        id: Number(rule.id),
        name: rule.name,
        description: rule.description || '',
        type: rule.type,
        value: rule.value,
        isActive: rule.isActive,
      }));
    } catch (error) {
      console.error('Error finding rules by activity type:', error);
      throw new Error(`Failed to find rules by activity type: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async update(rule: IRule): Promise<void> {
    try {
      await this.prisma.rule.update({
        where: { id: rule.id.toString() },
        data: {
          name: rule.name,
          description: rule.description,
          type: rule.type,
          value: rule.value,
          isActive: rule.isActive,
        }
      });
    } catch (error) {
      console.error('Error updating rule:', error);
      throw new Error(`Failed to update rule: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 