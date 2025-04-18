import { Configuration } from '../configuration/Configuration';
import { ConfigurationCategory } from '../configuration/ConfigurationKey';

export interface IConfigurationRepository {
  save(configuration: Configuration): Promise<Configuration>;
  update(configuration: Configuration): Promise<Configuration>;
  findById(id: string): Promise<Configuration | null>;
  findByKey(category: ConfigurationCategory, key: string): Promise<Configuration | null>;
  findActiveByKey(category: ConfigurationCategory, key: string, date?: Date): Promise<Configuration | null>;
  findByCategory(category: ConfigurationCategory): Promise<Configuration[]>;
  findActiveByCategory(category: ConfigurationCategory, date?: Date): Promise<Configuration[]>;
  delete(id: string): Promise<void>;
} 