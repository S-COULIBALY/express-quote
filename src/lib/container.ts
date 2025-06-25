import { container } from 'tsyringe';
import { IEmailConfigRepository, IEmailTemplateRepository } from '../quotation/domain/repositories/IEmailConfigRepository';
import { PrismaEmailConfigRepository } from '../quotation/infrastructure/repositories/PrismaEmailConfigRepository';
import { PrismaEmailTemplateRepository } from '../quotation/infrastructure/repositories/PrismaEmailTemplateRepository';
import { EmailConfigService } from '../quotation/application/services/EmailConfigService';

// Enregistrement pour le module d'email
container.registerSingleton<IEmailConfigRepository>('IEmailConfigRepository', PrismaEmailConfigRepository);
container.registerSingleton<IEmailTemplateRepository>('IEmailTemplateRepository', PrismaEmailTemplateRepository);
container.registerSingleton(EmailConfigService);

export { container }; 