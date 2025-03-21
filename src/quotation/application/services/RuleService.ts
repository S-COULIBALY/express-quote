import { Pool } from 'pg';
import { IRuleService } from '@/quotation/domain/interfaces/IRuleService';
import { RuleRepository } from '@/quotation/infrastructure/repositories/RuleRepository';
import { IPersistedRule } from '@/quotation/domain/interfaces/IRule';
import { CacheService } from './CacheService';
import { ServiceType } from '../../domain/entities/Service';

export class RuleService implements IRuleService {
  private repository: RuleRepository;
  private cacheService: CacheService;
  private readonly RULES_CACHE_KEY = 'business_rules';
  private readonly CACHE_TTL = 3600000; // 1 heure

  constructor(dbClient: Pool) {
    this.repository = new RuleRepository(dbClient);
    this.cacheService = CacheService.getInstance();
  }

  async getRulesForActivity(activityType: string): Promise<any[]> {
    return this.getRulesForService(activityType as ServiceType);
  }

  async getRulesForService(serviceType: ServiceType): Promise<IPersistedRule[]> {
    const cacheKey = `${this.RULES_CACHE_KEY}:${serviceType}`;
    
    // Tentative de récupération depuis le cache
    const cachedRules = this.cacheService.get(cacheKey);
    if (cachedRules) {
      return cachedRules;
    }

    // Si non trouvé dans le cache, charger depuis la base de données
    const rules = await this.repository.findByServiceType(serviceType);
    
    // Mettre en cache pour les prochaines requêtes
    this.cacheService.set(cacheKey, rules, this.CACHE_TTL);
    
    return rules;
  }

  async getAllRules(): Promise<IPersistedRule[]> {
    const cacheKey = `${this.RULES_CACHE_KEY}:all`;
    
    // Tentative de récupération depuis le cache
    const cachedRules = this.cacheService.get(cacheKey);
    if (cachedRules) {
      return cachedRules;
    }

    // Si non trouvé dans le cache, charger depuis la base de données
    const rules = await this.repository.findAll();
    
    // Mettre en cache pour les prochaines requêtes
    this.cacheService.set(cacheKey, rules, this.CACHE_TTL);
    
    return rules;
  }

  async saveRules(serviceType: ServiceType, rules: IPersistedRule[]): Promise<void> {
    // Sauvegarder les règles
    for (const rule of rules) {
      await this.repository.save({
        ...rule,
        serviceType
      });
    }

    // Invalider le cache pour forcer un rechargement
    this.cacheService.invalidate(`${this.RULES_CACHE_KEY}:${serviceType}`);
    this.cacheService.invalidate(`${this.RULES_CACHE_KEY}:all`);
  }

  async refreshRules(): Promise<void> {
    // Invalider tout le cache des règles
    this.cacheService.invalidateAll();
    
    // Recharger toutes les règles
    await this.getAllRules();
  }
} 