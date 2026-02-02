import { Configuration } from '../../domain/configuration/Configuration';
import { ConfigurationCategory, BusinessTypePricingConfigKey } from '../../domain/configuration/ConfigurationKey';
import { IConfigurationRepository } from '../../domain/repositories/IConfigurationRepository';

export class ConfigurationService {
  private cache: Map<string, Configuration> = new Map();

  constructor(private configurationRepository: IConfigurationRepository) {}

  private getCacheKey(category: ConfigurationCategory, key: string): string {
    return `${category}:${key}`;
  }

  private setCacheItem(configuration: Configuration): void {
    const cacheKey = this.getCacheKey(configuration.category, configuration.key);
    this.cache.set(cacheKey, configuration);
  }

  private getCacheItem(category: ConfigurationCategory, key: string): Configuration | undefined {
    const cacheKey = this.getCacheKey(category, key);
    return this.cache.get(cacheKey);
  }

  private clearCache(): void {
    this.cache.clear();
  }

  async getValue<T>(category: ConfigurationCategory, key: string, date?: Date): Promise<T | null> {
    // Vérifier d'abord le cache
    const cached = this.getCacheItem(category, key);
    if (cached && cached.isValid(date)) {
      return cached.value as T;
    }

    // Si pas dans le cache ou invalide, chercher dans la base de données
    const configuration = await this.configurationRepository.findActiveByKey(category, key, date);
    if (!configuration) {
      return null;
    }

    // Mettre en cache et retourner la valeur
    this.setCacheItem(configuration);
    return configuration.value as T;
  }

  async setValue<T>(
    category: ConfigurationCategory,
    key: string,
    value: T,
    description?: string,
    validFrom?: Date,
    validTo?: Date
  ): Promise<Configuration> {
    // Vérifier si une configuration existe déjà
    const existing = await this.configurationRepository.findByKey(category, key);

    let configuration: Configuration;
    if (existing) {
      // Mettre à jour la configuration existante
      configuration = existing.update(value, description, validTo);
      configuration = await this.configurationRepository.update(configuration);
    } else {
      // Créer une nouvelle configuration
      configuration = Configuration.create(category, key, value, description, validFrom, validTo);
      configuration = await this.configurationRepository.save(configuration);
    }

    // Mettre à jour le cache
    this.setCacheItem(configuration);
    return configuration;
  }

  async getConfigurations(category: ConfigurationCategory, date?: Date): Promise<Configuration[]> {
    return this.configurationRepository.findActiveByCategory(category, date);
  }

  async deactivateConfiguration(category: ConfigurationCategory, key: string): Promise<void> {
    const configuration = await this.configurationRepository.findByKey(category, key);
    if (configuration) {
      const deactivated = configuration.deactivate();
      await this.configurationRepository.update(deactivated);
      
      // Supprimer du cache
      const cacheKey = this.getCacheKey(category, key);
      this.cache.delete(cacheKey);
    }
  }

  async deleteConfiguration(id: string): Promise<void> {
    const configuration = await this.configurationRepository.findById(id);
    if (configuration) {
      await this.configurationRepository.delete(id);
      
      // Supprimer du cache
      const cacheKey = this.getCacheKey(configuration.category, configuration.key);
      this.cache.delete(cacheKey);
    }
  }

  clearConfigurationCache(): void {
    this.clearCache();
  }
} 