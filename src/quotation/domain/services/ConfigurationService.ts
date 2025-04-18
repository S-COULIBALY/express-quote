import { Configuration } from '../configuration/Configuration';
import { ConfigurationCategory, PricingConfigKey } from '../configuration/ConfigurationKey';

export class ConfigurationService {
  private cache: Map<string, Configuration>;
  
  constructor(private configurations: Configuration[] = []) {
    this.cache = new Map<string, Configuration>();
    this.initializeCache();
  }
  
  private initializeCache(): void {
    // Charger toutes les configurations actives dans le cache
    for (const config of this.configurations) {
      if (config.isValid()) {
        const key = `${config.category}_${config.key}`;
        this.cache.set(key, config);
      }
    }
  }
  
  private getCacheKey(category: ConfigurationCategory, key: string): string {
    return `${category}_${key}`;
  }
  
  /**
   * Récupère une configuration par sa catégorie et sa clé
   */
  getConfiguration(category: ConfigurationCategory, key: string): Configuration | null {
    const cacheKey = this.getCacheKey(category, key);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) || null;
    }
    
    // Rechercher dans la liste des configurations
    const config = this.configurations.find(
      c => c.category === category && c.key === key && c.isValid()
    );
    
    if (config) {
      this.cache.set(cacheKey, config);
      return config;
    }
    
    return null;
  }
  
  /**
   * Récupère la valeur d'une configuration numérique avec une valeur par défaut
   */
  getNumberValue(key: PricingConfigKey, defaultValue: number): number {
    const config = this.getConfiguration(ConfigurationCategory.PRICING, key);
    if (!config) return defaultValue;
    
    const value = config.value;
    if (typeof value === 'number') return value;
    
    // Tenter de convertir en nombre
    const numValue = Number(value);
    return isNaN(numValue) ? defaultValue : numValue;
  }
  
  /**
   * Récupère la valeur d'une configuration booléenne avec une valeur par défaut
   */
  getBooleanValue(category: ConfigurationCategory, key: string, defaultValue: boolean): boolean {
    const config = this.getConfiguration(category, key);
    if (!config) return defaultValue;
    
    const value = config.value;
    if (typeof value === 'boolean') return value;
    
    // Valeurs truthy/falsy courantes
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    
    return defaultValue;
  }
  
  /**
   * Récupère la valeur d'une configuration string avec une valeur par défaut
   */
  getStringValue(category: ConfigurationCategory, key: string, defaultValue: string): string {
    const config = this.getConfiguration(category, key);
    if (!config) return defaultValue;
    
    const value = config.value;
    if (typeof value === 'string') return value;
    
    // Convertir en chaîne
    return String(value);
  }
  
  /**
   * Ajoute ou met à jour une configuration
   */
  addOrUpdateConfiguration(config: Configuration): void {
    const existingIndex = this.configurations.findIndex(
      c => c.category === config.category && c.key === config.key
    );
    
    if (existingIndex >= 0) {
      this.configurations[existingIndex] = config;
    } else {
      this.configurations.push(config);
    }
    
    // Mettre à jour le cache si la configuration est valide
    if (config.isValid()) {
      const cacheKey = this.getCacheKey(config.category, config.key);
      this.cache.set(cacheKey, config);
    }
  }
} 