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
      
      salesTeamEmails: config.salesTeamEmails,
      accountingEmails: config.accountingEmails,
      professionalsEmails: config.professionalsEmails,
      notificationsEmails: config.notificationsEmails,
      
      externalProviders: config.externalProviders.map(provider => ({
        id: provider.id,
        name: provider.name,
        email: provider.email,
        category: provider.category,
        isActive: provider.isActive
      })),
      
      emailTypes: Object.entries(config.emailTypes).reduce((acc, [key, value]) => {
        acc[key] = {
          internal: value.internal,
          external: value.external,
          includeClient: value.includeClient
        };
        return acc;
      }, {} as Record<string, any>),
      
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
      dto.salesTeamEmails,
      dto.accountingEmails,
      dto.professionalsEmails,
      dto.notificationsEmails,
      dto.externalProviders.map(provider => new ExternalProvider(
        provider.id || '',
        provider.name,
        provider.email,
        provider.category,
        provider.isActive ?? true
      )),
      Object.entries(dto.emailTypes).reduce((acc, [key, value]) => {
        acc[key] = new EmailTypeConfig(
          value.internal,
          value.external,
          value.includeClient
        );
        return acc;
      }, {} as Record<string, EmailTypeConfig>),
      dto.reminderDays
    );
  }
} 