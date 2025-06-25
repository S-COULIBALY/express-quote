import 'reflect-metadata';
import { container } from 'tsyringe';
import { PrismaProfessionalRepository } from '@/quotation/infrastructure/repositories/PrismaProfessionalRepository';
import { IProfessionalRepository } from '@/quotation/domain/repositories/IProfessionalRepository';
import { logger } from '@/lib/universal-logger';

// Fonction d'initialisation du conteneur d'injection de dépendances
export function initializeDependencyInjection() {
  // Enregistrer les repositories
  container.registerSingleton<IProfessionalRepository>(
    'IProfessionalRepository',
    PrismaProfessionalRepository
  );

  // Enregistrer le logger
  container.registerInstance('Logger', logger);

  // Ajouter d'autres enregistrements selon les besoins
}

// Export du container pour utilisation dans d'autres fichiers
export { container }; 