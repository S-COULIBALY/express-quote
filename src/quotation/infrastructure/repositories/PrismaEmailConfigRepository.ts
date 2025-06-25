import { injectable } from 'tsyringe';
import { PrismaClient } from '@prisma/client';
import { IEmailConfigRepository } from '../../domain/repositories/IEmailConfigRepository';
import { EmailConfig, ExternalProvider, EmailTypeConfig } from '../../domain/entities/EmailConfig';

@injectable()
export class PrismaEmailConfigRepository implements IEmailConfigRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }
  
  public async getEmailConfig(): Promise<EmailConfig> {
    try {
      // Récupérer toutes les configurations d'emails
      const emailConfigs = await this.prisma.$queryRaw`
        SELECT * FROM "EmailConfiguration" WHERE "isActive" = true
      `;
      
      // Récupérer tous les prestataires externes
      const externalProviders = await this.prisma.$queryRaw`
        SELECT * FROM "ExternalProvider" WHERE "isActive" = true
      `;

      // Mapper les configurations vers un objet
      const configMap = Array.isArray(emailConfigs) ? emailConfigs.reduce((acc: Record<string, any>, config: any) => {
        acc[config.key] = config.value;
        return acc;
      }, {} as Record<string, any>) : {};

      return new EmailConfig(
        configMap['smtp.host'] || 'smtp.example.com',
        configMap['smtp.port'] || 587,
        configMap['smtp.user'] || 'user@example.com',
        configMap['smtp.password'] || '',
        configMap['smtp.from'] || 'noreply@express-quote.com',
        configMap['recipients.salesTeam'] || [],
        configMap['recipients.accounting'] || [],
        configMap['recipients.professionals'] || [],
        configMap['recipients.notifications'] || [],
        Array.isArray(externalProviders) ? externalProviders.map((p: any) => new ExternalProvider(
          p.id,
          p.name,
          p.email,
          p.category,
          p.isActive
        )) : [],
        configMap['emailTypes'] || {},
        configMap['reminderDays'] || [7, 3, 1]
      );
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      // Retourner une configuration par défaut en cas d'erreur
      return new EmailConfig(
        'smtp.example.com',
        587,
        'user@example.com',
        '',
        'noreply@express-quote.com',
        [],
        [],
        [],
        [],
        [],
        {},
        [7, 3, 1]
      );
    }
  }

  public async updateEmailConfig(config: EmailConfig): Promise<EmailConfig> {
    try {
      // Mettre à jour les paramètres SMTP
      await this.upsertConfig('smtp.host', config.smtpHost);
      await this.upsertConfig('smtp.port', config.smtpPort);
      await this.upsertConfig('smtp.user', config.smtpUser);
      await this.upsertConfig('smtp.password', config.smtpPassword);
      await this.upsertConfig('smtp.from', config.emailFrom);
      
      // Mettre à jour les destinataires internes
      await this.upsertConfig('recipients.salesTeam', config.salesTeamEmails);
      await this.upsertConfig('recipients.accounting', config.accountingEmails);
      await this.upsertConfig('recipients.professionals', config.professionalsEmails);
      await this.upsertConfig('recipients.notifications', config.notificationsEmails);
      
      // Mettre à jour les types d'emails et jours de rappel
      await this.upsertConfig('emailTypes', config.emailTypes);
      await this.upsertConfig('reminderDays', config.reminderDays);
      
      return config;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
      return config;
    }
  }
  
  public async getExternalProviders(): Promise<ExternalProvider[]> {
    try {
      const providers = await this.prisma.$queryRaw`
        SELECT * FROM "ExternalProvider"
      `;
      
      return Array.isArray(providers) ? providers.map((p: any) => new ExternalProvider(
        p.id,
        p.name,
        p.email,
        p.category,
        p.isActive
      )) : [];
    } catch (error) {
      console.error('Erreur lors de la récupération des prestataires externes:', error);
      return [];
    }
  }
  
  public async addExternalProvider(provider: Omit<ExternalProvider, 'id'>): Promise<ExternalProvider> {
    try {
      const newProvider = await this.prisma.$queryRaw`
        INSERT INTO "ExternalProvider" ("name", "email", "category", "isActive", "createdAt", "updatedAt")
        VALUES (${provider.name}, ${provider.email}, ${provider.category}, ${provider.isActive}, NOW(), NOW())
        RETURNING *
      `;
      
      if (Array.isArray(newProvider) && newProvider.length > 0) {
        const p = newProvider[0];
        return new ExternalProvider(
          p.id,
          p.name,
          p.email,
          p.category,
          p.isActive
        );
      }
      
      throw new Error('Échec de la création du prestataire externe');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du prestataire externe:', error);
      throw error;
    }
  }
  
  public async updateExternalProvider(provider: ExternalProvider): Promise<ExternalProvider> {
    try {
      const updatedProvider = await this.prisma.$queryRaw`
        UPDATE "ExternalProvider"
        SET "name" = ${provider.name},
            "email" = ${provider.email},
            "category" = ${provider.category},
            "isActive" = ${provider.isActive},
            "updatedAt" = NOW()
        WHERE "id" = ${provider.id}
        RETURNING *
      `;
      
      if (Array.isArray(updatedProvider) && updatedProvider.length > 0) {
        const p = updatedProvider[0];
        return new ExternalProvider(
          p.id,
          p.name,
          p.email,
          p.category,
          p.isActive
        );
      }
      
      throw new Error('Prestataire externe non trouvé');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du prestataire externe:', error);
      throw error;
    }
  }
  
  public async deleteExternalProvider(id: string): Promise<void> {
    try {
      await this.prisma.$queryRaw`
        DELETE FROM "ExternalProvider"
        WHERE "id" = ${id}
      `;
    } catch (error) {
      console.error('Erreur lors de la suppression du prestataire externe:', error);
      throw error;
    }
  }

  // Méthode utilitaire pour insérer ou mettre à jour une configuration
  private async upsertConfig(key: string, value: any): Promise<void> {
    const category = key.split('.')[0];
    
    try {
      // Vérifier si la configuration existe déjà
      const existingConfig = await this.prisma.$queryRaw`
        SELECT * FROM "EmailConfiguration"
        WHERE "key" = ${key}
      `;
      
      if (Array.isArray(existingConfig) && existingConfig.length > 0) {
        // Mettre à jour la configuration existante
        await this.prisma.$queryRaw`
          UPDATE "EmailConfiguration"
          SET "value" = ${JSON.stringify(value)},
              "updatedAt" = NOW()
          WHERE "key" = ${key}
        `;
      } else {
        // Créer une nouvelle configuration
        await this.prisma.$queryRaw`
          INSERT INTO "EmailConfiguration" ("key", "category", "value", "isActive", "createdAt", "updatedAt")
          VALUES (${key}, ${category}, ${JSON.stringify(value)}, true, NOW(), NOW())
        `;
      }
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la configuration ${key}:`, error);
      throw error;
    }
  }
} 