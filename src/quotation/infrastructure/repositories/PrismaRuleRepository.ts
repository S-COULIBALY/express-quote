import { IRuleRepository } from '../../domain/repositories/IRuleRepository';
import { Rule } from '../../domain/valueObjects/Rule';
import { ServiceType } from '../../domain/enums/ServiceType';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../lib/logger';
import { prisma } from '../../../lib/prisma';
import { createMovingRules } from '../../domain/rules/MovingRules';
// import { createPackRules } from '../../domain/rules/PackRules'; // TEMPORAIRE: Commenté pendant migration
// import { createServiceRules } from '../../domain/rules/ServiceRules'; // TEMPORAIRE: Commenté pendant migration

/**
 * Repository pour accéder aux règles dans la base de données Prisma
 */
export class PrismaRuleRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Mapper un enregistrement de la BD en objet du domaine
   * Note: Dans la classe Rule, le constructeur attend le paramètre "serviceType" en 2e position,
   * ce qui correspond au champ serviceType dans la base de données.
   */
  private mapToDomain(record: any): Rule {
    console.log(`Mapping rule from DB: ${record.name}, serviceType=${record.serviceType}, percentBased=${record.percentBased}`);
    
    return new Rule(
      record.name,
      record.serviceType,  // Le champ serviceType de la BD est passé au paramètre correspondant de la Rule
      record.value,
      record.condition,
      record.isActive,
      record.id,
      record.percentBased
    );
  }

  /**
   * Récupère toutes les règles actives
   */
  async findAllActive(): Promise<Rule[]> {
    try {
      const rules = await this.prisma.rule.findMany({
        where: {
          isActive: true
        }
      });
      
      return rules.map(rule => this.mapToDomain(rule));
    } catch (error) {
      logger.error('Error fetching active rules', error as Error);
      return [];
    }
  }

  /**
   * Récupère une règle par ID
   */
  async findById(id: string): Promise<Rule | null> {
    try {
      const rule = await this.prisma.rule.findUnique({
        where: { id }
      });
      
      return rule ? this.mapToDomain(rule) : null;
    } catch (error) {
      logger.error(`Error fetching rule with ID ${id}`, error as Error);
      return null;
    }
  }

  /**
   * Récupérer les règles pour un type de service donné
   */
  async findByServiceType(serviceType: ServiceType): Promise<Rule[]> {
    console.log(`Finding rules for service type: ${serviceType}`);
    try {
      // Utiliser serviceType dans la requête et non type
      const ruleRecords = await this.prisma.rule.findMany({
        where: {
          serviceType: serviceType,
          isActive: true,
        }
      });

      console.log(`Found ${ruleRecords.length} rules for service type ${serviceType}`);
      if (ruleRecords.length > 0) {
        console.log(`First rule: ${ruleRecords[0].name}, serviceType=${ruleRecords[0].serviceType}`);
      }

      return ruleRecords.map(record => this.mapToDomain(record));
    } catch (error) {
      console.error(`Error finding rules for service type ${serviceType}:`, error);
      throw error;
    }
  }
} 