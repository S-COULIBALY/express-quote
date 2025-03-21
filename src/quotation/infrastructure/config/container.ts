import { SupabaseRuleRepository } from '../repositories/SupabaseRuleRepository';
import { IRuleRepository } from '@/quotation/domain/interfaces/IRuleRepository';

// Container simple pour l'injection de dépendance
class Container {
  private _services: Map<string, any> = new Map();

  // Enregistrer un service dans le container
  register<T>(token: string, implementation: T): void {
    this._services.set(token, implementation);
  }

  // Obtenir un service du container
  resolve<T>(token: string): T {
    const service = this._services.get(token);
    if (!service) {
      throw new Error(`Service not registered: ${token}`);
    }
    return service as T;
  }

  // Initialisation des services par défaut
  init(): void {
    // Repositories
    this.register<IRuleRepository>('IRuleRepository', new SupabaseRuleRepository());

    // Services
    // TODO: Ajouter d'autres services au besoin
  }
}

// Singleton
export const container = new Container();
container.init();

// Helpers
export function getRepository<T>(token: string): T {
  return container.resolve<T>(token);
}

export function getRuleRepository(): IRuleRepository {
  return container.resolve<IRuleRepository>('IRuleRepository');
} 