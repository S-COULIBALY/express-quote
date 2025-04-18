import { Configuration } from '../../domain/configuration/Configuration';
import { ConfigurationCategory } from '../../domain/configuration/ConfigurationKey';
import { ConfigurationService } from '../../domain/services/ConfigurationService';
import { createDefaultConfigurations } from '../../domain/configuration/DefaultConfigurations';

/**
 * Repository pour l'accès et la persistence des configurations
 */
export class ConfigurationRepository {
  private static instance: ConfigurationRepository;
  private configurations: Configuration[] = [];
  private configService: ConfigurationService;
  
  private constructor() {
    // Initialiser avec les configurations par défaut
    this.configurations = createDefaultConfigurations();
    this.configService = new ConfigurationService(this.configurations);
  }
  
  /**
   * Retourne l'instance unique du repository (Singleton)
   */
  public static getInstance(): ConfigurationRepository {
    if (!ConfigurationRepository.instance) {
      ConfigurationRepository.instance = new ConfigurationRepository();
    }
    return ConfigurationRepository.instance;
  }
  
  /**
   * Récupère le service de configuration
   */
  getConfigurationService(): ConfigurationService {
    return this.configService;
  }
  
  /**
   * Récupère toutes les configurations
   */
  getAllConfigurations(): Configuration[] {
    return [...this.configurations];
  }
  
  /**
   * Récupère les configurations par catégorie
   */
  getConfigurationsByCategory(category: ConfigurationCategory): Configuration[] {
    return this.configurations.filter(config => config.category === category);
  }
  
  /**
   * Ajoute ou met à jour une configuration
   */
  saveConfiguration(config: Configuration): void {
    const index = this.configurations.findIndex(
      c => c.category === config.category && c.key === config.key
    );
    
    if (index >= 0) {
      this.configurations[index] = config;
    } else {
      this.configurations.push(config);
    }
    
    this.configService.addOrUpdateConfiguration(config);
  }
  
  /**
   * Supprime une configuration
   */
  deleteConfiguration(category: ConfigurationCategory, key: string): boolean {
    const initialLength = this.configurations.length;
    this.configurations = this.configurations.filter(
      config => !(config.category === category && config.key === key)
    );
    
    return initialLength !== this.configurations.length;
  }
  
  /**
   * Recharge les configurations depuis la source de données
   * Note: Cette implémentation est simulée, elle devrait être remplacée par un vrai chargement depuis une BD
   */
  async loadConfigurations(): Promise<void> {
    // Dans une vraie application, chargerait depuis une BD ou API
    console.log('Chargement des configurations depuis la source de données');
    
    // Simuler un chargement (ici nous utilisons simplement les configurations par défaut)
    // this.configurations = await someDataService.fetchConfigurations();
    
    // Mettre à jour le service de configuration
    this.configService = new ConfigurationService(this.configurations);
  }
} 