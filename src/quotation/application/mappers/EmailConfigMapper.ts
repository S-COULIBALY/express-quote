import { EmailConfig, EmailTemplate, ExternalProvider, EmailTypeConfig } from '../../domain/entities/EmailConfig';
import { EmailConfigDTO } from '../dtos/EmailConfigDTO';

export class EmailConfigMapper {
  public static toDTO(config: EmailConfig, templates: EmailTemplate[]): EmailConfigDTO {
    // Convertir les templates en structure attendue par le DTO
    const templateMap = templates.reduce((acc, template) => {
      if (template.type) {
        acc[template.type] = template.htmlContent;
      }
      return acc;
    }, {} as Record<string, string>);

    return {
      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUser: config.smtpUser,
      smtpPassword: config.smtpPassword,
      emailFrom: config.emailFrom,
      
      notificationEmails: config.notificationsEmails || [],
      
      internalTeams: {
        salesTeam: {
          emails: config.salesTeamEmails || [],
          config: {
            enabled: true,
            messageTypes: [],
            channels: ['email']
          }
        },
        accounting: {
          emails: config.accountingEmails || [],
          config: {
            enabled: true,
            messageTypes: [],
            channels: ['email']
          }
        },
        professionals: {
          emails: config.professionalsEmails || [],
          config: {
            enabled: true,
            messageTypes: [],
            channels: ['email']
          }
        },
        notifications: {
          emails: config.notificationsEmails || [],
          config: {
            enabled: true,
            messageTypes: [],
            channels: ['email']
          }
        },
        operations: {
          emails: [],
          config: {
            enabled: true,
            messageTypes: [],
            channels: ['email']
          }
        }
      },
      
      externalProviders: config.externalProviders.map(provider => ({
        id: provider.id,
        name: provider.name,
        email: provider.email,
        category: provider.category,
        channels: ['email'] as const,
        messageTypes: [] as const
      })),
      
      professionals: [],
      
      documents: {},
      
      reminderDays: config.reminderDays,
      
      templates: {
        quoteConfirmation: templateMap.quoteConfirmation || '',
        bookingConfirmation: templateMap.bookingConfirmation || '',
        paymentConfirmation: templateMap.paymentConfirmation || '',
        appointmentReminder: templateMap.appointmentReminder || '',
        cancellationNotification: templateMap.cancellationNotification || '',
        paymentReceipt: templateMap.paymentReceipt || ''
      }
    };
  }

  public static toDomain(dto: EmailConfigDTO): EmailConfig {
    // Convertir DTO en entité de domaine
    return new EmailConfig(
      dto.smtpHost,
      dto.smtpPort,
      dto.smtpUser,
      dto.smtpPassword,
      dto.emailFrom,
      dto.internalTeams.salesTeam?.emails || [],
      dto.internalTeams.accounting?.emails || [],
      dto.internalTeams.professionals?.emails || [],
      dto.internalTeams.notifications?.emails || [],
      dto.externalProviders.map(provider => new ExternalProvider(
        provider.id || '',
        provider.name,
        provider.email,
        provider.category,
        true
      )),
      {},
      dto.reminderDays
    );
  }
} 