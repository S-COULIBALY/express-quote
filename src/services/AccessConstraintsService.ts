import { prisma } from '@/lib/prisma';
import { ServiceType } from '@/quotation/domain/enums/ServiceType';
import { RuleType } from '@prisma/client';

export class AccessConstraintsService {
  static async getConstraints(type: 'pickup' | 'delivery') {
    try {
      const rules = await prisma.rules.findMany({
        where: {
          ruleType: 'CONSTRAINT' as RuleType,
          serviceType: 'MOVING' as ServiceType,
          isActive: true,
          condition: {
            path: ['type'],
            equals: type
          },
          AND: [
            {
              OR: [
                { validFrom: null },
                { validFrom: { lte: new Date() } }
              ]
            },
            {
              OR: [
                { validTo: null },
                { validTo: { gte: new Date() } }
              ]
            }
          ]
        },
        orderBy: {
          priority: 'asc'
        }
      });

      return rules;
    } catch (error) {
      console.error('Error fetching access constraints:', error);
      throw error;
    }
  }

  static async validateConstraints(constraints: any, type: 'pickup' | 'delivery') {
    try {
      const rules = await this.getConstraints(type);
      
      // Implement validation logic here
      // This is a basic example - expand based on your needs
      const validationResults = rules.map(rule => {
        const isValid = this.validateRule(rule, constraints);
        return {
          ruleId: rule.id,
          isValid,
          message: isValid ? 'Valid' : `Failed validation for rule: ${rule.name}`
        };
      });

      return {
        isValid: validationResults.every(r => r.isValid),
        results: validationResults
      };
    } catch (error) {
      console.error('Error validating constraints:', error);
      throw error;
    }
  }

  private static validateRule(rule: any, constraints: any): boolean {
    // Implement rule validation logic here
    // This is a placeholder - implement actual validation based on your rules
    return true;
  }
}
