import { Request, Response } from 'express';
import { ConfigurationService } from '../../../application/services/ConfigurationService';
import { ConfigurationCategory } from '../../../domain/configuration/ConfigurationKey';

export class ConfigurationController {
  constructor(private configurationService: ConfigurationService) {}

  async getConfigurations(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;

      if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      const configurations = await this.configurationService.getConfigurations(
        category as ConfigurationCategory,
        date
      );

      res.json(configurations);
    } catch (error) {
      console.error('Error getting configurations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getValue(req: Request, res: Response): Promise<void> {
    try {
      const { category, key } = req.params;
      const date = req.query.date ? new Date(req.query.date as string) : undefined;

      if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      const value = await this.configurationService.getValue(
        category as ConfigurationCategory,
        key,
        date
      );

      if (value === null) {
        res.status(404).json({ error: 'Configuration not found' });
        return;
      }

      res.json({ value });
    } catch (error) {
      console.error('Error getting configuration value:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async setValue(req: Request, res: Response): Promise<void> {
    try {
      const { category, key } = req.params;
      const { value, description, validFrom, validTo } = req.body;

      if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      if (value === undefined) {
        res.status(400).json({ error: 'Value is required' });
        return;
      }

      const configuration = await this.configurationService.setValue(
        category as ConfigurationCategory,
        key,
        value,
        description,
        validFrom ? new Date(validFrom) : undefined,
        validTo ? new Date(validTo) : undefined
      );

      res.json(configuration);
    } catch (error) {
      console.error('Error setting configuration value:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deactivateConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { category, key } = req.params;

      if (!Object.values(ConfigurationCategory).includes(category as ConfigurationCategory)) {
        res.status(400).json({ error: 'Invalid category' });
        return;
      }

      await this.configurationService.deactivateConfiguration(
        category as ConfigurationCategory,
        key
      );

      res.status(204).send();
    } catch (error) {
      console.error('Error deactivating configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.configurationService.deleteConfiguration(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  clearCache(req: Request, res: Response): void {
    try {
      this.configurationService.clearConfigurationCache();
      res.status(204).send();
    } catch (error) {
      console.error('Error clearing configuration cache:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
} 